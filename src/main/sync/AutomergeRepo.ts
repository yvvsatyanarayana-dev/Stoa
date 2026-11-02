// Automerge Repository - Core CRDT document management

import { Repo } from '@automerge/automerge-repo'
import type { AnyDocumentId } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel'
import { getDb } from '../db'
import { crdtDocDb, syncQueueDb, syncMetadataDb } from '../db'
import type { SyncTableType, DocumentHandle, SyncDocumentData, SyncStats } from './types'
import { randomUUID } from 'crypto'

let repo: Repo | null = null
const documentHandles = new Map<string, DocumentHandle>()
let deviceId: string

export function generateDeviceId(): string {
  return `device-${Date.now()}-${randomUUID().slice(0, 8)}`
}

export async function initializeAutomergeRepo(): Promise<Repo> {
  deviceId = syncMetadataDb.get('deviceId') || generateDeviceId()
  syncMetadataDb.set('deviceId', deviceId)

  // Use IndexedDB storage (works in Electron renderer/main)
  const storage = new IndexedDBStorageAdapter('automerge-repo')

  // Use BroadcastChannel for local network (same origin)
  const network = new BroadcastChannelNetworkAdapter()

  // Create repo with storage and network
  repo = new Repo({ storage, network: [network] })

  // Load existing documents from SQLite into Automerge
  await loadDocumentsFromSQLite()

  console.log('[AutomergeRepo] Initialized with deviceId:', deviceId)
  return repo
}

export function getRepo(): Repo | null {
  return repo
}

export function getDeviceId(): string {
  return deviceId
}

async function loadDocumentsFromSQLite(): Promise<void> {
  if (!repo) return

  const tables: SyncTableType[] = ['calendars', 'events', 'categories', 'resources', 'timetables', 'timetable_slots', 'subjects', 'themes', 'settings']

  for (const table of tables) {
    const docId = `crdt:${table}:collection`
    try {
      const handle = await repo.find<SyncDocumentData>(docId as AnyDocumentId)
      const doc = await handle.doc()

      // If document is empty, load from SQLite
      if (!doc || Object.keys(doc).length === 0) {
        await syncTableToAutomerge(table, handle)
      }

      documentHandles.set(docId, {
        docId,
        handle,
        type: table,
        lastSyncedVersion: 0,
        pendingChanges: false
      })
    } catch (error) {
      console.error(`[AutomergeRepo] Failed to load document for ${table}:`, error)
    }
  }
}

export async function syncTableToAutomerge(table: SyncTableType, handle?: any): Promise<void> {
  if (!repo) return

  const docId = `crdt:${table}:collection`
  const docHandle = handle || await repo.find<SyncDocumentData>(docId as AnyDocumentId)

  try {
    let data: any[] = []

    switch (table) {
      case 'calendars':
        data = getDb().prepare('SELECT * FROM calendars').all() as any[]
        break
      case 'events':
        data = getDb().prepare('SELECT * FROM events').all() as any[]
        break
      case 'categories':
        data = getDb().prepare('SELECT * FROM categories').all() as any[]
        break
      case 'resources':
        data = getDb().prepare('SELECT * FROM resources').all() as any[]
        break
      case 'timetables':
        data = getDb().prepare('SELECT * FROM timetables').all() as any[]
        break
      case 'timetable_slots':
        data = getDb().prepare('SELECT * FROM timetable_slots').all() as any[]
        break
      case 'subjects':
        data = getDb().prepare('SELECT * FROM subjects').all() as any[]
        break
      case 'themes':
        const themeRows = getDb().prepare('SELECT * FROM themes').all() as any[]
        data = themeRows.map(r => ({
          ...r,
          basePalette: JSON.parse(r.base_palette_json),
          customPhasePalettes: r.custom_phase_palettes_json ? JSON.parse(r.custom_phase_palettes_json) : undefined,
          customSeasonalPalettes: r.custom_seasonal_palettes_json ? JSON.parse(r.custom_seasonal_palettes_json) : undefined,
          seasonalEnabled: Boolean(r.seasonal_enabled),
        }))
        break
      case 'settings':
        const settingsRows = getDb().prepare('SELECT key, value FROM settings').all() as any[]
        data = settingsRows.reduce((acc, r) => {
          let val: any = r.value
          if (val === 'true') val = true
          else if (val === 'false') val = false
          else if (!isNaN(Number(val)) && (r.key.includes('offset') || r.key.includes('day'))) val = Number(val)
          acc[r.key] = val
          return acc
        }, {} as Record<string, any>)
        break
    }

    docHandle.change((d: any) => {
      d[table] = data
    })

    // Also save to crdt_documents table for persistence
    const savedDoc = await docHandle.doc()
    crdtDocDb.upsert({
      id: docId,
      type: table,
      data: savedDoc,
      version: 1,
      lastModified: new Date().toISOString(),
      modifiedBy: deviceId,
      synced: false
    })

    console.log(`[AutomergeRepo] Synced ${table} to Automerge (${data.length} items)`)
  } catch (error) {
    console.error(`[AutomergeRepo] Failed to sync ${table}:`, error)
  }
}

export function getDocumentHandle(type: SyncTableType): DocumentHandle | undefined {
  const docId = `crdt:${type}:collection`
  return documentHandles.get(docId)
}

export function getAllDocumentHandles(): DocumentHandle[] {
  return Array.from(documentHandles.values())
}

export async function changeDocument(type: SyncTableType, changeFn: (doc: any) => void): Promise<void> {
  if (!repo) return

  const docId = `crdt:${type}:collection`
  const handle = await repo.find<SyncDocumentData>(docId as AnyDocumentId)

  handle.change(changeFn)

  const doc = await handle.doc()
  const existing = crdtDocDb.get(docId)
  crdtDocDb.upsert({
    id: docId,
    type,
    data: doc,
    version: (existing?.version || 0) + 1,
    lastModified: new Date().toISOString(),
    modifiedBy: deviceId,
    synced: false
  })

  // Mark as having pending changes
  const existingHandle = documentHandles.get(docId)
  if (existingHandle) {
    documentHandles.set(docId, { ...existingHandle, pendingChanges: true })
  }

  // Add to sync queue
  addToSyncQueue({ type: 'update', tableName: type, entityId: 'collection', payload: doc })
}

export function addToSyncQueue(item: { type: 'create' | 'update' | 'delete'; tableName: SyncTableType; entityId: string; payload: any }): void {
  const id = `sync-${Date.now()}-${randomUUID().slice(0, 8)}`
  syncQueueDb.add({ id, ...item })
}

export async function shutdown(): Promise<void> {
  if (repo) {
    // Repo doesn't have close method in newer versions
    repo = null
  }
  documentHandles.clear()
}

export function getSyncStats(): SyncStats {
  const pendingCount = syncQueueDb.getPendingCount()
  const handles = getAllDocumentHandles()

  return {
    documentsTotal: handles.length,
    documentsSynced: handles.filter(h => !h.pendingChanges).length,
    pendingChanges: pendingCount,
    conflictsResolved: 0,
    conflictsPending: 0,
    bytesSent: 0,
    bytesReceived: 0,
    lastSyncTime: syncMetadataDb.get('lastSyncTime') ? new Date(syncMetadataDb.get('lastSyncTime')!).getTime() : null,
    uptime: Date.now() - (syncMetadataDb.get('startTime') ? new Date(syncMetadataDb.get('startTime')!).getTime() : Date.now())
  }
}

// Export syncQueueDb and crdtDocDb for external use
export { crdtDocDb, syncQueueDb, syncMetadataDb } from '../db'