// Internal types for sync module

import type { DocHandle } from '@automerge/automerge-repo'
import type { CalendarEvent, Calendar, Timetable, TimetableSlot, Subject, Resource, Category } from '../../types'
import type { ThemeConfig } from '../../types/theme'

export type SyncTableType = 'calendars' | 'events' | 'categories' | 'resources' | 'timetables' | 'timetable_slots' | 'subjects' | 'themes' | 'settings'

export { type ThemeConfig } from '../../types/theme'
export { type CalendarEvent, type Calendar, type Timetable, type TimetableSlot, type Subject, type Resource, type Category } from '../../types'

export interface SyncDocumentData {
  calendars?: Calendar[]
  events?: CalendarEvent[]
  categories?: Category[]
  resources?: Resource[]
  timetables?: Timetable[]
  timetableSlots?: TimetableSlot[]
  subjects?: Subject[]
  themes?: ThemeConfig[]
  settings?: Record<string, any>
}

export interface DocumentHandle<T = any> {
  docId: string
  handle: DocHandle<T>
  type: SyncTableType
  lastSyncedVersion: number
  pendingChanges: boolean
}

export interface PeerInfo {
  id: string
  connectedAt: number
  lastSeen: number
  documentIds: string[]
}

export interface SyncStats {
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

export interface NetworkMessage {
  type: 'join' | 'leave' | 'sync' | 'ack' | 'request' | 'response' | 'presence' | 'ping' | 'pong'
  documentId?: string
  payload?: any
  senderId: string
  targetId?: string
  timestamp: number
  messageId: string
}

export interface OfflineQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  table: SyncTableType
  entityId: string
  payload: any
  timestamp: number
  retryCount: number
}

export interface CacheEntry<T = any> {
  key: string
  data: T
  expiresAt: number
  hits: number
  lastAccessed: number
}

export const SYNC_TABLE_TYPES: SyncTableType[] = [
  'calendars', 'events', 'categories', 'resources',
  'timetables', 'timetable_slots', 'subjects', 'themes', 'settings'
]

export function getDocumentId(type: SyncTableType, id?: string): string {
  if (id) return `crdt:${type}:${id}`
  return `crdt:${type}:collection`
}

// Sync configuration
export interface SyncConfig {
  enabled: boolean
  autoSyncInterval: number
  maxRetries: number
  retryBackoffBase: number
  conflictResolution: 'last-write-wins' | 'manual' | 'merge'
  cacheTTL: number
  predictiveCacheEnabled: boolean
  networkTimeout: number
  signalingServerUrl: string
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  autoSyncInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryBackoffBase: 1000,
  conflictResolution: 'last-write-wins',
  cacheTTL: 300000, // 5 minutes
  predictiveCacheEnabled: true,
  networkTimeout: 10000,
  signalingServerUrl: 'ws://localhost:8765'
}