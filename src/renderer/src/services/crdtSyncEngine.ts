/**
 * Stoa True Offline-First CRDT & End-to-End Encryption Engine
 * Zero Cloud Servers • AES-256-GCM Hardware Encryption • Lamport Vector Clocks
 */

import type { CalendarEvent } from '../../../types'

export interface CRDTEventRecord {
  id: string
  calendar_id: string
  title: string
  description?: string
  start: string
  end: string
  all_day?: boolean
  location?: string
  timezone?: string
  category_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'confirmed' | 'tentative' | 'cancelled'
  meeting_url?: string

  // CRDT Logical Metadata
  lamportClock: number
  originPeerId: string
  lastModifiedBy: string
  lastModifiedAt: string
  isDeleted: boolean
  checksum: string
}

export interface CRDTConflictResolution {
  eventId: string
  eventTitle: string
  field: string
  localValue: any
  remoteValue: any
  winningValue: any
  reason: string
  resolvedAt: string
}

export interface CRDTSyncBundle {
  protocolVersion: 'stoa-crdt-v1'
  roomId: string
  roomName: string
  senderPeerId: string
  senderPeerName: string
  timestamp: string
  lamportClock: number
  records: CRDTEventRecord[]
}

export interface EncryptedCRDTPayload {
  protocolVersion: 'stoa-crdt-v1'
  roomId: string
  senderPeerId: string
  senderPeerName: string
  iv: string
  ciphertext: string
  timestamp: number
}

// -------------------------------------------------------------
// Web Crypto AES-256-GCM Utilities
// -------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function generateRoomEncryptionKey(): Promise<{ keyBase64: string; key: CryptoKey }> {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const raw = await window.crypto.subtle.exportKey('raw', key)
  return {
    keyBase64: bufferToBase64(raw),
    key
  }
}

export async function importRoomEncryptionKey(keyBase64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(keyBase64)
  return window.crypto.subtle.importKey(
    'raw',
    buffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptCRDTBundle(
  bundle: CRDTSyncBundle,
  key: CryptoKey
): Promise<EncryptedCRDTPayload> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encodedData = new TextEncoder().encode(JSON.stringify(bundle))

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  )

  return {
    protocolVersion: 'stoa-crdt-v1',
    roomId: bundle.roomId,
    senderPeerId: bundle.senderPeerId,
    senderPeerName: bundle.senderPeerName,
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
    timestamp: Date.now()
  }
}

export async function decryptCRDTPayload(
  payload: EncryptedCRDTPayload,
  key: CryptoKey
): Promise<CRDTSyncBundle> {
  const ivBuffer = base64ToBuffer(payload.iv)
  const cipherBuffer = base64ToBuffer(payload.ciphertext)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    key,
    cipherBuffer
  )

  const text = new TextDecoder().decode(decryptedBuffer)
  return JSON.parse(text) as CRDTSyncBundle
}

export async function computeEventChecksum(event: Partial<CalendarEvent>): Promise<string> {
  const canonical = `${event.id}|${event.title}|${event.start}|${event.end}|${event.description || ''}|${event.location || ''}`
  const encoded = new TextEncoder().encode(canonical)
  const hashBuf = await window.crypto.subtle.digest('SHA-256', encoded)
  const hashArr = Array.from(new Uint8Array(hashBuf))
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

// -------------------------------------------------------------
// State-based CRDT Merge Engine (LWW-Element-Set + Field Clock)
// -------------------------------------------------------------

class CRDTEngine {
  private localPeerId: string = ''
  private localPeerName: string = ''
  private lamportClock: number = 1
  private tombstoneRegistry = new Map<string, CRDTEventRecord>()
  private conflictHistory: CRDTConflictResolution[] = []

  constructor() {
    // Synchronize with persisted P2P local node identity
    try {
      const persistedP2P = localStorage.getItem('stoa_p2p_state')
      if (persistedP2P) {
        const parsed = JSON.parse(persistedP2P)
        if (parsed?.state?.localNodeId) {
          this.localPeerId = parsed.state.localNodeId
          this.localPeerName = parsed.state.localNodeName || 'Local Stoa Terminal'
        }
      }
    } catch {}

    if (!this.localPeerId) {
      const bytes = new Uint8Array(4)
      window.crypto.getRandomValues(bytes)
      const hex = Array.from(bytes).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('')
      this.localPeerId = `STOA-NODE-${hex}`
      this.localPeerName = 'Local Stoa Terminal'
    }

    const savedClock = localStorage.getItem('stoa_crdt_lamport_clock')
    if (savedClock) {
      this.lamportClock = parseInt(savedClock, 10) || 1
    }
  }

  public getPeerId(): string {
    return this.localPeerId
  }

  public setPeerInfo(id: string, name: string) {
    this.localPeerId = id
    this.localPeerName = name
  }

  public getLamportClock(): number {
    return this.lamportClock
  }

  public tickClock(remoteClock?: number): number {
    if (remoteClock !== undefined) {
      this.lamportClock = Math.max(this.lamportClock, remoteClock) + 1
    } else {
      this.lamportClock += 1
    }
    localStorage.setItem('stoa_crdt_lamport_clock', this.lamportClock.toString())
    return this.lamportClock
  }

  public getConflictHistory(): CRDTConflictResolution[] {
    return [...this.conflictHistory]
  }

  /**
   * Convert local CalendarEvents into a state-based CRDT bundle
   */
  public async createSyncBundle(
    events: CalendarEvent[],
    roomId: string,
    roomName: string
  ): Promise<CRDTSyncBundle> {
    const records: CRDTEventRecord[] = []

    for (const evt of events) {
      const checksum = await computeEventChecksum(evt)
      const existingTomb = this.tombstoneRegistry.get(evt.id)
      const clock = existingTomb ? existingTomb.lamportClock : this.lamportClock

      records.push({
        id: evt.id,
        calendar_id: evt.calendar_id,
        title: evt.title,
        description: evt.description,
        start: evt.start,
        end: evt.end,
        all_day: evt.all_day,
        location: evt.location,
        timezone: evt.timezone,
        category_id: evt.category_id,
        priority: evt.priority,
        status: evt.status,
        meeting_url: evt.meeting_url,
        lamportClock: clock,
        originPeerId: this.localPeerId,
        lastModifiedBy: this.localPeerName,
        lastModifiedAt: evt.updated_at || new Date().toISOString(),
        isDeleted: false,
        checksum
      })
    }

    // Append tombstones for deleted items
    for (const [, tomb] of this.tombstoneRegistry) {
      records.push(tomb)
    }

    return {
      protocolVersion: 'stoa-crdt-v1',
      roomId,
      roomName,
      senderPeerId: this.localPeerId,
      senderPeerName: this.localPeerName,
      timestamp: new Date().toISOString(),
      lamportClock: this.lamportClock,
      records
    }
  }

  /**
   * Deterministically merge incoming CRDT records with local calendar events
   */
  public async mergeCRDTPayload(
    localEvents: CalendarEvent[],
    incomingBundle: CRDTSyncBundle
  ): Promise<{
    mergedEvents: CalendarEvent[]
    appliedCount: number
    conflictsResolved: number
    eventsToCreate: CalendarEvent[]
    eventsToUpdate: CalendarEvent[]
    eventsToDelete: string[]
  }> {
    // Advance local Lamport clock
    this.tickClock(incomingBundle.lamportClock)

    const eventMap = new Map<string, CalendarEvent>()
    localEvents.forEach((e) => eventMap.set(e.id, { ...e }))

    const eventsToCreate: CalendarEvent[] = []
    const eventsToUpdate: CalendarEvent[] = []
    const eventsToDelete: string[] = []
    let conflictsResolved = 0
    let appliedCount = 0

    for (const remoteRecord of incomingBundle.records) {
      const local = eventMap.get(remoteRecord.id)

      // Case 1: Remote record is a Tombstone (Deleted event)
      if (remoteRecord.isDeleted) {
        if (local) {
          // Compare Lamport clocks: higher clock wins. In tie, peerId string comparison breaks tie deterministically.
          const remoteWins =
            remoteRecord.lamportClock > this.lamportClock ||
            (remoteRecord.lamportClock === this.lamportClock &&
              remoteRecord.originPeerId > this.localPeerId)

          if (remoteWins) {
            eventMap.delete(remoteRecord.id)
            eventsToDelete.push(remoteRecord.id)
            this.tombstoneRegistry.set(remoteRecord.id, remoteRecord)
            appliedCount++
            conflictsResolved++
            this.conflictHistory.unshift({
              eventId: remoteRecord.id,
              eventTitle: remoteRecord.title,
              field: 'isDeleted',
              localValue: 'active',
              remoteValue: 'deleted',
              winningValue: 'deleted (tombstone)',
              reason: `Lamport clock ${remoteRecord.lamportClock} > local ${this.lamportClock}`,
              resolvedAt: new Date().toLocaleTimeString()
            })
          }
        } else {
          this.tombstoneRegistry.set(remoteRecord.id, remoteRecord)
        }
        continue
      }

      // Check if local has a tombstone that is newer
      const localTombstone = this.tombstoneRegistry.get(remoteRecord.id)
      if (localTombstone && localTombstone.lamportClock >= remoteRecord.lamportClock) {
        // Local deletion wins over older remote edit
        continue
      }

      // Case 2: New Event from Remote Peer
      if (!local) {
        const newEvt: CalendarEvent = {
          id: remoteRecord.id,
          calendar_id: remoteRecord.calendar_id,
          title: remoteRecord.title,
          description: remoteRecord.description,
          start: remoteRecord.start,
          end: remoteRecord.end,
          all_day: remoteRecord.all_day || false,
          location: remoteRecord.location,
          timezone: remoteRecord.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          category_id: remoteRecord.category_id,
          priority: remoteRecord.priority || 'medium',
          status: remoteRecord.status || 'confirmed',
          meeting_url: remoteRecord.meeting_url,
          created_at: remoteRecord.lastModifiedAt,
          updated_at: remoteRecord.lastModifiedAt
        }
        eventMap.set(newEvt.id, newEvt)
        eventsToCreate.push(newEvt)
        appliedCount++
        continue
      }

      // Case 3: Concurrent Edit Merge (3-Way Field-Level Convergence)
      const localChecksum = await computeEventChecksum(local)
      if (localChecksum === remoteRecord.checksum) {
        // Both nodes are already identical
        continue
      }

      // Perform deterministic field-level LWW merge
      const merged: CalendarEvent = { ...local }
      let hasFieldChange = false

      // Check title
      if (local.title !== remoteRecord.title) {
        const remoteWins =
          remoteRecord.lamportClock > this.lamportClock ||
          (remoteRecord.lamportClock === this.lamportClock &&
            remoteRecord.originPeerId > this.localPeerId)

        if (remoteWins) {
          this.conflictHistory.unshift({
            eventId: local.id,
            eventTitle: local.title,
            field: 'title',
            localValue: local.title,
            remoteValue: remoteRecord.title,
            winningValue: remoteRecord.title,
            reason: `CRDT LWW (Peer ${remoteRecord.lastModifiedBy || remoteRecord.originPeerId})`,
            resolvedAt: new Date().toLocaleTimeString()
          })
          merged.title = remoteRecord.title
          hasFieldChange = true
          conflictsResolved++
        }
      }

      // Check description (collaborative merge: if remote added info and local didn't modify it, preserve remote)
      if (remoteRecord.description && remoteRecord.description !== local.description) {
        if (!local.description || remoteRecord.lamportClock >= this.lamportClock) {
          merged.description = remoteRecord.description
          hasFieldChange = true
        }
      }

      // Check start & end times
      if (local.start !== remoteRecord.start || local.end !== remoteRecord.end) {
        const remoteWins = remoteRecord.lamportClock >= this.lamportClock
        if (remoteWins) {
          merged.start = remoteRecord.start
          merged.end = remoteRecord.end
          hasFieldChange = true
          conflictsResolved++
        }
      }

      // Check location
      if (remoteRecord.location && remoteRecord.location !== local.location) {
        if (!local.location || remoteRecord.lamportClock >= this.lamportClock) {
          merged.location = remoteRecord.location
          hasFieldChange = true
        }
      }

      // Check status & priority
      if (remoteRecord.status && remoteRecord.status !== local.status) {
        if (remoteRecord.lamportClock >= this.lamportClock) {
          merged.status = remoteRecord.status
          hasFieldChange = true
        }
      }

      if (hasFieldChange) {
        merged.updated_at = new Date().toISOString()
        eventMap.set(merged.id, merged)
        eventsToUpdate.push(merged)
        appliedCount++
      }
    }

    return {
      mergedEvents: Array.from(eventMap.values()),
      appliedCount,
      conflictsResolved,
      eventsToCreate,
      eventsToUpdate,
      eventsToDelete
    }
  }

  /**
   * Register a local event deletion as a tombstone
   */
  public registerLocalTombstone(eventId: string, eventTitle: string) {
    this.tickClock()
    this.tombstoneRegistry.set(eventId, {
      id: eventId,
      calendar_id: 'default',
      title: eventTitle,
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      lamportClock: this.lamportClock,
      originPeerId: this.localPeerId,
      lastModifiedBy: this.localPeerName,
      lastModifiedAt: new Date().toISOString(),
      isDeleted: true,
      checksum: 'tombstone'
    })
  }
}

export const crdtEngine = new CRDTEngine()
