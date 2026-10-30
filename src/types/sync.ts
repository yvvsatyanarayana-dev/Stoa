// Shared types for Offline CRDT Sync (Phase 2)

export type SyncStatus = 'idle' | 'connecting' | 'syncing' | 'offline' | 'error' | 'conflict';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type SyncTableType = 'calendars' | 'events' | 'categories' | 'resources' | 'timetables' | 'timetable_slots' | 'subjects' | 'themes' | 'settings';

export interface SyncMetadata {
  lastSyncedAt: string | null;
  pendingChanges: number;
  conflictCount: number;
  deviceId: string;
  peerCount: number;
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  entityId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  synced: boolean;
}

export interface CRDTDocument<T = any> {
  id: string;
  type: string;
  data: T;
  version: number;
  lastModified: string;
  modifiedBy: string;
}

export interface SyncMessage {
  type: 'sync' | 'ack' | 'conflict' | 'presence' | 'request' | 'response';
  documentId: string;
  payload: any;
  senderId: string;
  timestamp: string;
  messageId: string;
}

export interface ConflictInfo {
  documentId: string;
  localVersion: any;
  remoteVersion: any;
  conflictPaths: string[];
  timestamp: string;
}

export interface PredictiveCacheEntry {
  key: string;
  data: any;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
}

export interface SyncConfig {
  signalingUrl: string;
  autoSync: boolean;
  syncIntervalMs: number;
  maxRetries: number;
  retryBackoffMs: number;
  cacheEnabled: boolean;
  cacheTTLMs: number;
  maxCacheSize: number;
  maxConcurrentMirrors?: number;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  signalingUrl: 'ws://localhost:8765',
  autoSync: true,
  syncIntervalMs: 30000,
  maxRetries: 5,
  retryBackoffMs: 1000,
  cacheEnabled: true,
  cacheTTLMs: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  maxConcurrentMirrors: 3,
};

// ICS Mirror Types
export interface ICSMirrorConfig {
  id: string;
  calendarId: string;
  url: string;
  name?: string;
  etag?: string;
  lastModified?: string;
  scheduleCron: string;
  enabled: boolean;
  lastSyncedAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MirrorEvent {
  id: string;
  mirrorId: string;
  icsUid: string;
  contentHash: string;
  action: 'created' | 'updated' | 'deleted';
  eventData?: any;
  syncedAt: string;
}

export interface ICSMirrorSyncResult {
  mirrorId: string;
  status: 'success' | 'error' | 'no_changes';
  eventsAdded: number;
  eventsUpdated: number;
  eventsDeleted: number;
  error?: string;
  durationMs: number;
}

// Bundle Types
export interface BundleEncryptionParams {
  algorithm: 'AES-GCM';
  keyLength: 256;
  iterations: number;
  salt: string; // base64
  iv: string; // base64
}

export interface BundleManifest {
  version: string;
  createdAt: string;
  createdBy?: string;
  appVersion: string;
  tables: string[];
  recordCounts: Record<string, number>;
  checksum: string; // SHA-256 of decrypted SQLite
}

export interface BundleMetadata {
  id: string;
  version: string;
  name?: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  checksumSha256?: string;
  encryptionParams?: BundleEncryptionParams;
  tablesIncluded: string[];
  createdAt: string;
  createdBy?: string;
}

export interface BundleExportOptions {
  name?: string;
  description?: string;
  password: string; // Required for encryption
  tables?: string[]; // Default: all user tables
  outputPath?: string; // If not provided, returns buffer
}

export interface BundleImportOptions {
  password: string;
  overwrite?: boolean; // Default: false
  validateOnly?: boolean; // Default: false
}