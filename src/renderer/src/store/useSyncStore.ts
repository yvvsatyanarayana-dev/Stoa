// Sync Store - Zustand store for sync/offline state management

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SyncStatus, SyncConfig, OfflineAction } from '../../../types/sync'

interface SyncState {
  // Status
  status: SyncStatus
  isOnline: boolean
  peerCount: number

  // Stats
  stats: {
    documentsTotal: number
    documentsSynced: number
    pendingChanges: number
    conflictsResolved: number
    conflictsPending: number
    bytesSent: number
    bytesReceived: number
    lastSyncTime: number | null
    uptime: number
  }

  // Queue
  queue: OfflineAction[]
  queueLength: number

  // Cache
  cacheStats: {
    count: number
    oldestEntry: number | null
    newestEntry: number | null
  }

  // Config
  config: SyncConfig

  // Actions
  setStatus: (status: SyncStatus) => void
  setOnline: (online: boolean) => void
  setPeerCount: (count: number) => void
  setStats: (stats: any) => void
  setQueue: (queue: OfflineAction[]) => void
  setQueueLength: (length: number) => void
  setCacheStats: (stats: any) => void
  setConfig: (config: Partial<SyncConfig>) => void

  // Async actions
  fetchStatus: () => Promise<void>
  fetchQueue: () => Promise<void>
  fetchCacheStats: () => Promise<void>
  fetchConfig: () => Promise<void>
  manualSync: () => Promise<void>
  clearQueue: () => Promise<void>
  retryQueue: () => Promise<void>
  clearCache: () => Promise<void>
  invalidateCache: (pattern: string) => Promise<void>
  updateConfig: (config: Partial<SyncConfig>) => Promise<void>
  recordView: (viewType: string, params: any) => Promise<void>
}

const STORAGE_KEY = 'chronodesk-sync-store'

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      // Initial state
      status: 'idle',
      isOnline: false,
      peerCount: 0,
      stats: {
        documentsTotal: 0,
        documentsSynced: 0,
        pendingChanges: 0,
        conflictsResolved: 0,
        conflictsPending: 0,
        bytesSent: 0,
        bytesReceived: 0,
        lastSyncTime: null,
        uptime: 0
      },
      queue: [],
      queueLength: 0,
      cacheStats: {
        count: 0,
        oldestEntry: null,
        newestEntry: null
      },
      config: {
        signalingUrl: 'ws://localhost:8765',
        autoSync: true,
        syncIntervalMs: 30000,
        maxRetries: 5,
        retryBackoffMs: 1000,
        cacheEnabled: true,
        cacheTTLMs: 5 * 60 * 1000,
        maxCacheSize: 100
      },

      // Setters
      setStatus: (status) => set({ status }),
      setOnline: (isOnline) => set({ isOnline }),
      setPeerCount: (peerCount) => set({ peerCount }),
      setStats: (stats) => set({ stats }),
      setQueue: (queue) => set({ queue, queueLength: queue.length }),
      setQueueLength: (queueLength) => set({ queueLength }),
      setCacheStats: (cacheStats) => set({ cacheStats }),
      setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),

      // Async actions
      fetchStatus: async () => {
        try {
          const result = await window.api.sync.getStatus()
          set({
            status: result.status,
            isOnline: result.isOnline,
            peerCount: result.peerCount,
            stats: result.stats
          })
        } catch (error) {
          console.error('[SyncStore] Failed to fetch status:', error)
        }
      },

      fetchQueue: async () => {
        try {
          const queue = await window.api.sync.getQueue()
          set({ queue, queueLength: queue.length })
        } catch (error) {
          console.error('[SyncStore] Failed to fetch queue:', error)
        }
      },

      fetchCacheStats: async () => {
        try {
          const stats = await window.api.sync.getCacheStats()
          set({ cacheStats: stats })
        } catch (error) {
          console.error('[SyncStore] Failed to fetch cache stats:', error)
        }
      },

      fetchConfig: async () => {
        try {
          const config = await window.api.sync.getConfig()
          set({ config })
        } catch (error) {
          console.error('[SyncStore] Failed to fetch config:', error)
        }
      },

      manualSync: async () => {
        set({ status: 'syncing' })
        try {
          await window.api.sync.manualSync()
          await get().fetchStatus()
          await get().fetchQueue()
        } catch (error) {
          console.error('[SyncStore] Manual sync failed:', error)
          set({ status: 'error' })
        }
      },

      clearQueue: async () => {
        try {
          await window.api.sync.clearQueue()
          await get().fetchQueue()
        } catch (error) {
          console.error('[SyncStore] Failed to clear queue:', error)
        }
      },

      retryQueue: async () => {
        try {
          await window.api.sync.retryQueue()
          await get().fetchQueue()
        } catch (error) {
          console.error('[SyncStore] Failed to retry queue:', error)
        }
      },

      clearCache: async () => {
        try {
          await window.api.sync.clearCache()
          await get().fetchCacheStats()
        } catch (error) {
          console.error('[SyncStore] Failed to clear cache:', error)
        }
      },

      invalidateCache: async (pattern) => {
        try {
          await window.api.sync.invalidateCache(pattern)
          await get().fetchCacheStats()
        } catch (error) {
          console.error('[SyncStore] Failed to invalidate cache:', error)
        }
      },

      updateConfig: async (config) => {
        try {
          await window.api.sync.setConfig(config)
          set((state) => ({ config: { ...state.config, ...config } }))
        } catch (error) {
          console.error('[SyncStore] Failed to update config:', error)
        }
      },

      recordView: async (viewType, params) => {
        try {
          await window.api.sync.recordView(viewType, params)
        } catch (error) {
          console.error('[SyncStore] Failed to record view:', error)
        }
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config
      })
    }
  )
)

// Auto-refresh status periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { fetchStatus, fetchQueue, fetchCacheStats } = useSyncStore.getState()
    fetchStatus()
    fetchQueue()
    fetchCacheStats()
  }, 10000) // Every 10 seconds
}