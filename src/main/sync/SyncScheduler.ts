// Sync Scheduler - Orchestrate periodic sync, backoff, conflict resolution

import { syncMetadataDb, syncQueueDb } from '../db'
import { getRepo, getSyncStats as getAutomergeSyncStats } from './AutomergeRepo'
import { flushQueue, isOnlineStatus, setOnlineStatus } from './OfflineQueue'
import { isConnected, forceSync, broadcastPresence } from './NetworkLayer'
import { initializePredictiveCache, predictAndPrefetch } from './PredictiveCache'
import { initializeAutomergeRepo, shutdown as shutdownRepo } from './AutomergeRepo'
import { initializeNetworkLayer, shutdown as shutdownNetwork } from './NetworkLayer'
import { initializeOfflineQueue, shutdown as shutdownQueue } from './OfflineQueue'
import { startSignalingServer, stopSignalingServer } from './SignalingServer'
import type { SyncConfig, SyncStats } from './types'
import { DEFAULT_SYNC_CONFIG, SYNC_TABLE_TYPES } from './types'

let config: SyncConfig = { ...DEFAULT_SYNC_CONFIG }
let syncTimer: NodeJS.Timeout | null = null
let backoffTimer: NodeJS.Timeout | null = null
let currentBackoffMs = 1000
let isRunning = false
let onStatsUpdate: ((stats: SyncStats) => void) | null = null
let onConflict: ((conflict: any) => void) | null = null

export function initializeSyncScheduler(
  cfg: Partial<SyncConfig>,
  statsCallback?: (stats: SyncStats) => void,
  conflictCallback?: (conflict: any) => void
): Promise<void> {
  return new Promise(async (resolve) => {
    config = { ...config, ...cfg }
    onStatsUpdate = statsCallback || null
    onConflict = conflictCallback || null

    // Start signaling server in development
    if (!require('electron').app.isPackaged) {
      await startSignalingServer(8765)
    }

    // Initialize components
    await initializeAutomergeRepo()
    initializeNetworkLayer(config.signalingServerUrl, handleNetworkStatusChange)
    initializeOfflineQueue(handleOfflineStatusChange, handleQueueChange)
    initializePredictiveCache({
      enabled: config.predictiveCacheEnabled,
      ttlMs: config.cacheTTL,
      maxSize: 100
    })

    // Start periodic sync if enabled
    if (config.enabled) {
      startPeriodicSync()
    }

    isRunning = true
    console.log('[SyncScheduler] Initialized')
    resolve()
  })
}

function handleNetworkStatusChange(status: string): void {
  const wasOnline = isOnlineStatus()
  const nowOnline = status === 'connected'

  setOnlineStatus(nowOnline)

  if (!wasOnline && nowOnline) {
    // Just came online - flush queue and sync
    currentBackoffMs = config.retryBackoffBase
    flushQueue()
    broadcastPresence(SYNC_TABLE_TYPES.map(t => `crdt:${t}:collection`))
  } else if (wasOnline && !nowOnline) {
    // Went offline - increase backoff
    scheduleBackoff()
  }
}

function handleOfflineStatusChange(_status: 'online' | 'offline' | 'syncing'): void {
  // Network layer handles the actual status
}

function handleQueueChange(_queueLength: number): void {
  // Notify UI of queue changes
  if (onStatsUpdate) {
    onStatsUpdate(getSyncStats())
  }
}

function startPeriodicSync(): void {
  if (syncTimer) clearInterval(syncTimer)

  syncTimer = setInterval(async () => {
    if (isRunning && isOnlineStatus()) {
      await performSync()
    }
    if (onStatsUpdate) {
      onStatsUpdate(getSyncStats())
    }
  }, config.autoSyncInterval)
}

function scheduleBackoff(): void {
  if (backoffTimer) clearTimeout(backoffTimer)

  backoffTimer = setTimeout(() => {
    if (!isConnected() && isOnlineStatus()) {
      // Try to reconnect
      forceSync()
      currentBackoffMs = Math.min(currentBackoffMs * 2, 30000)
      scheduleBackoff()
    }
  }, currentBackoffMs)
}

async function performSync(): Promise<void> {
  if (!isOnlineStatus() || !isConnected()) return

  try {
    // Flush any pending local changes
    await flushQueue()

    // Force sync with peers
    forceSync()

    // Update last sync time
    syncMetadataDb.set('lastSyncTime', new Date().toISOString())

    // Broadcast presence
    broadcastPresence(SYNC_TABLE_TYPES.map(t => `crdt:${t}:collection`))

    console.log('[SyncScheduler] Periodic sync completed')
  } catch (error) {
    console.error('[SyncScheduler] Sync failed:', error)
    scheduleBackoff()
  }
}

export async function manualSync(): Promise<SyncStats> {
  await performSync()
  return getAutomergeSyncStats()
}

export function getSyncStats(): SyncStats {
  return getAutomergeSyncStats()
}

export function getConfig(): SyncConfig {
  return { ...config }
}

export function setConfig(cfg: Partial<SyncConfig>): void {
  config = { ...config, ...cfg }

  if (config.enabled) {
    startPeriodicSync()
  } else {
    if (syncTimer) {
      clearInterval(syncTimer)
      syncTimer = null
    }
  }
}

export function recordView(viewType: string, params: Record<string, any>): void {
  // This will trigger predictive prefetch
  predictAndPrefetch(viewType, params)
}

export function getSyncStatus(): 'idle' | 'syncing' | 'offline' | 'error' {
  if (!isOnlineStatus()) return 'offline'
  if (!isConnected()) return 'error'
  // Would need to track if currently syncing
  return 'idle'
}

export function getPendingChangesCount(): number {
  return syncQueueDb.getPendingCount()
}

export function getPeerCount(): number {
  // Would need to get from network layer
  return 0 // Placeholder
}

export async function shutdown(): Promise<void> {
  isRunning = false

  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
  if (backoffTimer) {
    clearTimeout(backoffTimer)
    backoffTimer = null
  }

  await shutdownQueue()
  shutdownNetwork()
  await shutdownRepo()
  stopSignalingServer()

  console.log('[SyncScheduler] Shutdown complete')
}

// Conflict resolution - called when Automerge detects conflicts
export function handleConflict(documentId: string, localVersion: any, remoteVersion: any): void {
  const conflictPaths = detectConflictPaths(localVersion, remoteVersion)

  const conflict = {
    documentId,
    localVersion,
    remoteVersion,
    conflictPaths,
    timestamp: new Date().toISOString()
  }

  if (onConflict) {
    onConflict(conflict)
  }

  // Auto-resolve simple conflicts (last-writer-wins based on timestamp)
  const autoResolved = autoResolveConflict(localVersion, remoteVersion)
  if (autoResolved) {
    applyResolvedConflict(documentId, autoResolved)
  }
}

function detectConflictPaths(local: any, remote: any, prefix = ''): string[] {
  const paths: string[] = []

  if (!local || !remote) return paths

  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)])
  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key
    const localVal = local[key]
    const remoteVal = remote[key]

    if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
      if (typeof localVal === 'object' && typeof remoteVal === 'object' && localVal && remoteVal) {
        paths.push(...detectConflictPaths(localVal, remoteVal, path))
      } else {
        paths.push(path)
      }
    }
  }

  return paths
}

function autoResolveConflict(local: any, remote: any): any | null {
  // Simple LWW based on updated_at timestamps
  // For arrays, merge unique items
  // For objects, merge preferring newer timestamps

  if (!local || !remote) return local || remote

  const result = { ...local }

  for (const key of Object.keys(remote)) {
    if (!(key in local)) {
      result[key] = remote[key]
    } else {
      const localVal = local[key]
      const remoteVal = remote[key]

      // If both have updated_at, use newer
      if (localVal?.updated_at && remoteVal?.updated_at) {
        result[key] = new Date(localVal.updated_at) > new Date(remoteVal.updated_at) ? localVal : remoteVal
      } else if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
        // Merge arrays, deduplicate by id
        const merged = [...localVal]
        for (const item of remoteVal) {
          if (item.id && !merged.find((m: any) => m.id === item.id)) {
            merged.push(item)
          }
        }
        result[key] = merged
      } else if (typeof localVal === 'object' && typeof remoteVal === 'object') {
        // Recursively merge objects
        result[key] = autoResolveConflict(localVal, remoteVal)
      } else {
        // Primitive conflict - use local (could be configured)
        result[key] = localVal
      }
    }
  }

  return result
}

function applyResolvedConflict(documentId: string, resolvedData: any): void {
  const repo = getRepo()
  if (!repo) return

  // repo.find returns Promise<DocHandle>, need to await
  const handlePromise = repo.find(documentId as any)
  handlePromise.then(handle => {
    handle.change((doc: any) => {
      Object.assign(doc, resolvedData)
    })
  }).catch(err => {
    console.error('[SyncScheduler] Failed to apply resolved conflict:', err)
  })
}

// Export for external use
export { queueAction } from './OfflineQueue'
export { getRepo, getDeviceId } from './AutomergeRepo'