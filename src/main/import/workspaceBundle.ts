import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { createHash, pbkdf2Sync } from 'crypto'
import { getDb } from '../db'
import type { BundleImportOptions, BundleManifest, BundleEncryptionParams, BundleMetadata } from '../../types/sync'
import { bundleMetadataDb } from '../db'
import AdmZip from 'adm-zip'

/**
 * Derives encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer, iterations = 100000): Buffer {
  return pbkdf2Sync(password, salt, iterations, 32, 'sha256')
}

/**
 * Decrypts data using AES-GCM
 */
async function decryptData(encrypted: Buffer, password: string, params: BundleEncryptionParams): Promise<Buffer> {
  const salt = Buffer.from(params.salt, 'base64')
  const iv = Buffer.from(params.iv, 'base64')
  const key = deriveKey(password, salt, params.iterations)

  const algorithm = { name: 'AES-GCM', iv: new Uint8Array(iv) }
  const cryptoKey = await crypto.subtle.importKey('raw', new Uint8Array(key), algorithm, false, ['decrypt'])

  try {
    const decrypted = await crypto.subtle.decrypt(algorithm, cryptoKey, new Uint8Array(encrypted))
    return Buffer.from(decrypted)
  } catch (error) {
    throw new Error('Decryption failed: incorrect password or corrupted data')
  }
}

/**
 * Computes SHA-256 checksum
 */
function computeChecksum(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Parses and validates bundle file structure
 */
async function parseBundleFile(filePath: string, password: string): Promise<{
  manifest: BundleManifest
  sqlBuffer: Buffer
  params: BundleEncryptionParams
}> {
  const fs = await import('fs/promises')
  const buffer = await fs.readFile(filePath)

  // Check header
  const header = buffer.subarray(0, 21).toString('utf8')
  if (header !== 'CHRONODESK_BUNDLE_V1\n') {
    throw new Error('Invalid bundle format: missing or incorrect header')
  }

  // Read params length
  const paramsLength = buffer.readUInt32LE(21)
  if (paramsLength > 10000) {
    throw new Error('Invalid bundle format: params too large')
  }

  // Read and parse params
  const paramsJson = buffer.subarray(25, 25 + paramsLength).toString('utf8')
  let params: BundleEncryptionParams
  try {
    params = JSON.parse(paramsJson)
  } catch {
    throw new Error('Invalid bundle format: corrupt encryption params')
  }

  // Decrypt the rest
  const encryptedData = buffer.subarray(25 + paramsLength)
  const zipBuffer = await decryptData(encryptedData, password, params)

  // Extract ZIP
  const zip = new AdmZip(zipBuffer)
  const manifestEntry = zip.getEntry('manifest.json')
  const dataEntry = zip.getEntry('data.sql')

  if (!manifestEntry || !dataEntry) {
    throw new Error('Invalid bundle: missing manifest.json or data.sql')
  }

  const manifest: BundleManifest = JSON.parse(manifestEntry.getData().toString('utf8'))
  const sqlBuffer = dataEntry.getData()

  // Verify checksum
  const actualChecksum = computeChecksum(sqlBuffer)
  if (actualChecksum !== manifest.checksum) {
    throw new Error(`Checksum mismatch: expected ${manifest.checksum}, got ${actualChecksum}`)
  }

  return { manifest, sqlBuffer, params }
}

/**
 * Executes SQL statements from buffer
 */
async function executeSqlDump(sqlBuffer: Buffer, overwrite = false): Promise<{ executed: number; errors: string[] }> {
  const db = getDb()
  const sql = sqlBuffer.toString('utf8')
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0)

  let executed = 0
  const errors: string[] = []

  // Execute in transaction
  db.exec('BEGIN TRANSACTION;')

  try {
    for (const stmt of statements) {
      try {
        if (stmt.startsWith('BEGIN') || stmt.startsWith('COMMIT')) continue
        db.exec(stmt + ';')
        executed++
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        // Skip duplicate key errors if not overwriting
        if (!overwrite && (errMsg.includes('UNIQUE constraint failed') || errMsg.includes('PRIMARY KEY'))) {
          continue
        }
        errors.push(`${stmt.substring(0, 100)}...: ${errMsg}`)
      }
    }
    db.exec('COMMIT;')
  } catch (error) {
    db.exec('ROLLBACK;')
    throw error
  }

  return { executed, errors }
}

/**
 * Main import function - restores from .chronodesk bundle
 */
export async function importWorkspaceBundle(filePath: string, options: BundleImportOptions): Promise<{
  success: boolean
  metadata: BundleMetadata
  manifest: BundleManifest
  executed: number
  errors: string[]
}> {
  const { password, overwrite = false, validateOnly = false } = options

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  if (!existsSync(filePath)) {
    throw new Error('Bundle file not found')
  }

  // Parse and validate bundle
  const { manifest, sqlBuffer, params } = await parseBundleFile(filePath, password)

  // If validate only, return early
  if (validateOnly) {
    const fs = await import('fs/promises')
    const stats = await fs.stat(filePath)
    const fileSize = stats.size
    const fileBuffer = await fs.readFile(filePath)
    const checksum = computeChecksum(fileBuffer)

    const metadata = bundleMetadataDb.create({
      version: manifest.version,
      name: manifest.createdBy,
      description: `Validated bundle from ${new Date(manifest.createdAt).toLocaleDateString()}`,
      filePath,
      fileSize,
      checksumSha256: checksum,
      encryptionParams: params,
      tablesIncluded: manifest.tables,
      createdBy: manifest.createdBy || 'StoaPro'
    })

    return {
      success: true,
      metadata,
      manifest,
      executed: 0,
      errors: []
    }
  }

  // Execute SQL dump
  const { executed, errors } = await executeSqlDump(sqlBuffer, overwrite)

  // Record metadata
  const fs = await import('fs/promises')
  const stats = await fs.stat(filePath)
  const fileSize = stats.size
  const fileBuffer = await fs.readFile(filePath)
  const checksum = computeChecksum(fileBuffer)

  const metadata = bundleMetadataDb.create({
    version: manifest.version,
    name: manifest.createdBy,
    description: `Imported bundle from ${new Date(manifest.createdAt).toLocaleDateString()}`,
    filePath,
    fileSize,
    checksumSha256: checksum,
    encryptionParams: params,
    tablesIncluded: manifest.tables,
    createdBy: manifest.createdBy || 'StoaPro'
  })

  return {
    success: errors.length === 0,
    metadata,
    manifest,
    executed,
    errors
  }
}

/**
 * Lists available bundle files in exports directory
 */
export function listAvailableBundles(): BundleMetadata[] {
  return bundleMetadataDb.list()
}

/**
 * Gets bundle metadata by ID
 */
export function getBundleMetadata(id: string): BundleMetadata | null {
  return bundleMetadataDb.get(id)
}

/**
 * Deletes bundle metadata record (not the file)
 */
export function deleteBundleMetadata(id: string): void {
  bundleMetadataDb.delete(id)
}

/**
 * Gets the default exports directory
 */
export function getExportsDirectory(): string {
  const userData = app.getPath('userData')
  const exportsDir = join(userData, 'exports')
  if (!existsSync(exportsDir)) {
    mkdirSync(exportsDir, { recursive: true })
  }
  return exportsDir
}