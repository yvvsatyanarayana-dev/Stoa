// Offline Queue - Manage offline changes and sync when online

import { syncQueueDb, getDb } from '../db'
import { flushSyncQueue, isConnected, onMessage } from './NetworkLayer'
import { syncMetadataDb } from '../db'
import type { SyncTableType } from './types'

let isOnline = false
let flushTimer: NodeJS.Timeout | null = null
let pendingFlush = false
let onQueueChange: ((queueLength: number) => void) | null = null
let onStatusChange: ((status: 'online' | 'offline' | 'syncing') => void) | null = null

export function initializeOfflineQueue(
  statusCallback?: (status: 'online' | 'offline' | 'syncing') => void,
  queueChangeCallback?: (queueLength: number) => void
): void {
  onStatusChange = statusCallback ?? null
  onQueueChange = queueChangeCallback ?? null

  // Listen for network status changes
  onMessage(handleNetworkMessage)

  // Start periodic flush when online
  startPeriodicFlush()

  // Initial queue length notification
  notifyQueueChange()
}

function handleNetworkMessage(message: any): void {
  if (message.type === 'join' && message.senderId !== 'server') {
    // Peer joined, we might be coming online
    setOnlineStatus(true)
  }
}

export function setOnlineStatus(online: boolean): void {
  if (isOnline === online) return

  isOnline = online
  console.log('[OfflineQueue] Status changed:', online ? 'online' : 'offline')

  if (onStatusChange) {
    onStatusChange(online ? 'online' : 'offline')
  }

  if (online) {
    // Trigger immediate flush
    flushQueue()
  }
}

export function isOnlineStatus(): boolean {
  return isOnline
}

export function queueAction(
  type: 'create' | 'update' | 'delete',
  table: SyncTableType,
  entityId: string,
  payload: any
): string {
  const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  syncQueueDb.add({ id, type, tableName: table, entityId, payload })

  notifyQueueChange()

  // If online, try to flush immediately
  if (isOnline && isConnected()) {
    flushQueue()
  }

  return id
}

export async function flushQueue(): Promise<number> {
  if (pendingFlush || !isOnline) return 0

  pendingFlush = true
  if (onStatusChange) onStatusChange('syncing')

  try {
    // First, apply any pending local queue items to SQLite
    const localFlushed = await flushSyncQueue()

    // Then request sync from peers
    if (isConnected()) {
      requestSyncFromPeers()
    }

    notifyQueueChange()
    return localFlushed
  } catch (error) {
    console.error('[OfflineQueue] Flush failed:', error)
    return 0
  } finally {
    pendingFlush = false
    if (onStatusChange) onStatusChange(isOnline ? 'online' : 'offline')
  }
}

function requestSyncFromPeers(): void {
  // This would be sent via network layer
  // For now, we just update the last sync time
  syncMetadataDb.set('lastSyncTime', new Date().toISOString())
}

function startPeriodicFlush(): void {
  if (flushTimer) clearInterval(flushTimer)

  flushTimer = setInterval(() => {
    if (isOnline && !pendingFlush && syncQueueDb.getPendingCount() > 0) {
      flushQueue()
    }
    notifyQueueChange()
  }, 10000) // Check every 10 seconds
}

export function stopPeriodicFlush(): void {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}

export function getQueueLength(): number {
  return syncQueueDb.getPendingCount()
}

export function getQueueItems(): any[] {
  return syncQueueDb.list(true)
}

export function clearSyncedItems(): number {
  const count = syncQueueDb.clearSynced()
  notifyQueueChange()
  return count
}

export function retryFailedItems(): void {
  const items = syncQueueDb.list(true)
  for (const item of items) {
    if (item.retry_count > 0) {
      // Reset retry count and re-queue
      syncQueueDb.incrementRetry(item.id) // This will increment, we want to reset
      // Actually re-add with reset retry
      const db = getDb()
      db.prepare('UPDATE sync_queue SET retry_count = 0, last_error = NULL WHERE id = ?').run(item.id)
    }
  }
  notifyQueueChange()
}

export function removeQueueItem(id: string): void {
  syncQueueDb.remove(id)
  notifyQueueChange()
}

function notifyQueueChange(): void {
  if (onQueueChange) {
    onQueueChange(getQueueLength())
  }
}

// Conflict resolution helpers
export interface ConflictResolution {
  action: 'local' | 'remote' | 'merge'
  mergedData?: any
}

export function detectConflicts(localData: any, remoteData: any): string[] {
  const conflicts: string[] = []

  if (!localData || !remoteData) return conflicts

  const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)])
  for (const key of allKeys) {
    if (JSON.stringify(localData[key]) !== JSON.stringify(remoteData[key])) {
      conflicts.push(key)
    }
  }

  return conflicts
}

export function resolveConflict(
  table: SyncTableType,
  entityId: string,
  resolution: ConflictResolution
): any {
  const db = getDb()

  let resolvedData: any

  switch (resolution.action) {
    case 'local':
      resolvedData = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(entityId)
      break
    case 'remote':
      resolvedData = resolution.mergedData
      break
    case 'merge':
      const local = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(entityId)
      resolvedData = { ...local, ...resolution.mergedData }
      break
  }

  // Apply resolved data
  if (resolvedData) {
    const columns = Object.keys(resolvedData).filter(k => k !== 'id').join(', ')
    const placeholders = Object.keys(resolvedData).filter(k => k !== 'id').map(() => '?').join(', ')
    const values = Object.keys(resolvedData).filter(k => k !== 'id').map(k => resolvedData[k])

    db.prepare(`
      INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})
    `).run(...values)
  }

  return resolvedData
}

export function shutdown(): void {
  stopPeriodicFlush()
}