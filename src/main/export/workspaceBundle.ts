import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { createHash, randomBytes, pbkdf2Sync } from 'crypto'
import { ZipArchive } from 'archiver'
import { getDb } from '../db'
import type { BundleExportOptions, BundleManifest, BundleEncryptionParams, BundleMetadata } from '../../types/sync'
import { bundleMetadataDb } from '../db'

const TABLES_TO_EXPORT = [
  'calendars',
  'categories',
  'resources',
  'events',
  'event_exceptions',
  'attendees',
  'event_resources',
  'reminders',
  'timetables',
  'subjects',
  'timetable_slots',
  'timetable_versions',
  'holidays',
  'settings',
  'conferences',
  'themes',
  'ics_mirrors',
  'mirror_events',
  'sync_metadata'
]

/**
 * Derives encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer, iterations = 100000): Buffer {
  return pbkdf2Sync(password, salt, iterations, 32, 'sha256')
}

/**
 * Encrypts data using AES-GCM
 */
async function encryptData(data: Buffer, password: string): Promise<{ encrypted: Buffer; params: BundleEncryptionParams }> {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = deriveKey(password, salt)

  const algorithm = { name: 'AES-GCM', iv: new Uint8Array(iv) }
  const cryptoKey = await crypto.subtle.importKey('raw', new Uint8Array(key), algorithm, false, ['encrypt'])

  const encrypted = await crypto.subtle.encrypt(algorithm, cryptoKey, new Uint8Array(data))

  return {
    encrypted: Buffer.from(encrypted),
    params: {
      algorithm: 'AES-GCM',
      keyLength: 256,
      iterations: 100000,
      salt: salt.toString('base64'),
      iv: iv.toString('base64')
    }
  }
}

/**
 * Computes SHA-256 checksum
 */
function computeChecksum(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Exports database tables to SQLite dump format
 */
async function exportTablesToSql(tables: string[]): Promise<{ sql: string; recordCounts: Record<string, number> }> {
  const db = getDb()
  let sql = ''
  const recordCounts: Record<string, number> = {}

  // Start transaction
  sql += 'BEGIN TRANSACTION;\n'

  for (const table of tables) {
    try {
      // Get table schema
      const schemaRows = db.prepare(`
        SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?
      `).get(table) as { sql: string } | undefined

      if (schemaRows?.sql) {
        sql += `${schemaRows.sql};\n`
      }

      // Get data
      const rows = db.prepare(`SELECT * FROM ${table}`).all() as any[]
      recordCounts[table] = rows.length

      if (rows.length > 0) {
        const columns = Object.keys(rows[0])

        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col]
            if (val === null || val === undefined) return 'NULL'
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
            if (typeof val === 'boolean') return val ? 1 : 0
            return val
          })
          sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
        }
      }
    } catch (error) {
      console.error(`[bundleExport] Failed to export table ${table}:`, error)
    }
  }

  sql += 'COMMIT;\n'
  return { sql, recordCounts }
}

/**
 * Main export function - creates encrypted .chronodesk bundle
 */
export async function exportWorkspaceBundle(options: BundleExportOptions): Promise<{ buffer: Buffer; metadata: BundleMetadata; manifest: BundleManifest }> {
  const { password, name, description, tables = TABLES_TO_EXPORT, outputPath } = options

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  // Export tables to SQL
  const { sql, recordCounts } = await exportTablesToSql(tables)
  const sqlBuffer = Buffer.from(sql, 'utf8')
  const checksum = computeChecksum(sqlBuffer)

  // Create manifest
  const manifest: BundleManifest = {
    version: 'v1',
    createdAt: new Date().toISOString(),
    createdBy: 'StoaPro',
    appVersion: '1.0.0',
    tables,
    recordCounts,
    checksum
  }

  // Create ZIP with manifest + SQL dump
  const archive = new ZipArchive({ zlib: { level: 6 } })
  const chunks: Buffer[] = []

  archive.on('data', (chunk: Buffer) => chunks.push(chunk))

  // Add manifest
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })

  // Add SQL dump
  archive.append(sqlBuffer, { name: 'data.sql' })

  await archive.finalize()

  const zipBuffer = Buffer.concat(chunks)

  // Encrypt the ZIP
  const { encrypted, params } = await encryptData(zipBuffer, password)

  // Create final bundle with header
  const header = Buffer.from('CHRONODESK_BUNDLE_V1\n', 'utf8')
  const paramsJson = Buffer.from(JSON.stringify(params), 'utf8')
  const paramsLength = Buffer.alloc(4)
  paramsLength.writeUInt32LE(paramsJson.length, 0)

  const bundleBuffer = Buffer.concat([header, paramsLength, paramsJson, encrypted])

  // Save to file if outputPath provided
  let filePath: string | undefined
  let fileSize = bundleBuffer.length

  if (outputPath) {
    const dir = join(outputPath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    const fs = await import('fs/promises')
    await fs.writeFile(outputPath, bundleBuffer)
    filePath = outputPath
  }

  // Create metadata record
  const bundleMetadata: Omit<BundleMetadata, 'id' | 'createdAt'> = {
    version: 'v1',
    name,
    description,
    filePath,
    fileSize,
    checksumSha256: computeChecksum(bundleBuffer),
    encryptionParams: params,
    tablesIncluded: tables
  }

  const savedMetadata = bundleMetadataDb.create(bundleMetadata)

  return {
    buffer: bundleBuffer,
    metadata: savedMetadata,
    manifest
  }
}

/**
 * Validates a bundle file without decrypting (checks format only)
 */
export async function validateBundleFormat(filePath: string): Promise<{ valid: boolean; error?: string; manifest?: BundleManifest }> {
  const fs = await import('fs/promises')

  try {
    const buffer = await fs.readFile(filePath)

    // Check header
    const header = buffer.subarray(0, 21).toString('utf8')
    if (header !== 'CHRONODESK_BUNDLE_V1\n') {
      return { valid: false, error: 'Invalid bundle format: missing or incorrect header' }
    }

    // Read params length
    const paramsLength = buffer.readUInt32LE(21)
    if (paramsLength > 10000) {
      return { valid: false, error: 'Invalid bundle format: params too large' }
    }

    // Read and parse params
    const paramsJson = buffer.subarray(25, 25 + paramsLength).toString('utf8')
    try {
      JSON.parse(paramsJson)
    } catch {
      return { valid: false, error: 'Invalid bundle format: corrupt encryption params' }
    }

    // The rest is encrypted data - we can't validate without password
    // But we can return the manifest if we decrypt... for now just format check
    return { valid: true, manifest: undefined }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Gets the default export path
 */
export function getDefaultExportPath(name?: string): string {
  const userData = app.getPath('userData')
  const exportsDir = join(userData, 'exports')
  if (!existsSync(exportsDir)) {
    mkdirSync(exportsDir, { recursive: true })
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = name ? `${name}-${timestamp}.chronodesk` : `chronodesk-backup-${timestamp}.chronodesk`
  return join(exportsDir, fileName)
}