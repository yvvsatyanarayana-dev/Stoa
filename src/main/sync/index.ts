// Sync Module Barrel Export - Explicit exports to avoid conflicts

// Types
export * from './types'

// AutomergeRepo
export {
  initializeAutomergeRepo,
  getRepo,
  getDeviceId,
  syncTableToAutomerge,
  getDocumentHandle,
  getAllDocumentHandles,
  changeDocument,
  addToSyncQueue,
  shutdown as shutdownAutomergeRepo,
  getSyncStats as getAutomergeSyncStats,
  crdtDocDb,
  syncQueueDb,
  syncMetadataDb
} from './AutomergeRepo'

// DocumentMappers
export {
  mapRowToObject,
  mapObjectToRow,
  automergeDocToSqlite,
  sqliteToAutomergeDoc,
  applyAutomergeToSqlite,
  getChangesSince
} from './DocumentMappers'

// NetworkLayer
export {
  initializeNetworkLayer,
  send,
  broadcastSync,
  broadcastPresence,
  onMessage,
  getPeers,
  getPeerCount as getNetworkPeerCount,
  isConnected,
  forceSync,
  flushSyncQueue,
  shutdown as shutdownNetworkLayer
} from './NetworkLayer'

// SignalingServer
export {
  startSignalingServer,
  broadcastToAll,
  getConnectedClients,
  stopSignalingServer,
  isSignalingServerRunning
} from './SignalingServer'

// OfflineQueue
export {
  initializeOfflineQueue,
  setOnlineStatus,
  isOnlineStatus,
  queueAction,
  flushQueue,
  getQueueLength,
  getQueueItems,
  clearSyncedItems,
  retryFailedItems,
  removeQueueItem,
  detectConflicts,
  resolveConflict,
  shutdown as shutdownOfflineQueue
} from './OfflineQueue'

// PredictiveCache
export {
  initializePredictiveCache,
  get,
  set,
  invalidate,
  invalidatePattern,
  clear,
  prefetchWeekEvents,
  prefetchDayEvents,
  prefetchTimetableSlots,
  prefetchUpcomingEvents,
  getCacheStats,
  setConfig as setCacheConfig,
  getConfig as getCacheConfig,
  recordView as recordCacheView,
  predictAndPrefetch
} from './PredictiveCache'

// SyncScheduler
export {
  initializeSyncScheduler,
  manualSync,
  getSyncStats as getSchedulerSyncStats,
  getConfig as getSyncSchedulerConfig,
  setConfig as setSyncSchedulerConfig,
  recordView as recordSyncView,
  getSyncStatus,
  getPendingChangesCount,
  getPeerCount as getSchedulerPeerCount,
  shutdown as shutdownSyncScheduler,
  handleConflict,
  queueAction as schedulerQueueAction
} from './SyncScheduler'