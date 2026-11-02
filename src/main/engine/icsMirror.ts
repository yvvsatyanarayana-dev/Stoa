import { parseIcsText, fetchIcsFeed, ParsedIcsResult } from './icsFeed'
import type { CalendarEvent } from '../../types'
import type { ICSMirrorConfig, MirrorEvent } from '../../types/sync'
import { getDb, icsMirrorDb, mirrorEventsDb } from '../db'
import type { ICSMirrorSyncResult } from '../../types/sync'
import { randomUUID } from 'crypto'

/**
 * Computes SHA-256 hash of a string
 */
async function computeHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Normalizes an ICS event to our internal CalendarEvent format
 */
function normalizeIcsEvent(
  parsedEvent: Partial<CalendarEvent>,
  calendarId: string
): CalendarEvent {
  const now = new Date().toISOString()
  return {
    id: parsedEvent.id || `evt-${Date.now()}-${randomUUID().slice(0, 8)}`,
    calendar_id: calendarId,
    title: parsedEvent.title || 'External Event',
    description: parsedEvent.description,
    location: parsedEvent.location,
    meeting_url: parsedEvent.meeting_url,
    start: parsedEvent.start!,
    end: parsedEvent.end!,
    all_day: parsedEvent.all_day || false,
    timezone: parsedEvent.timezone || 'UTC',
    rrule: parsedEvent.rrule,
    category_id: parsedEvent.category_id,
    priority: parsedEvent.priority || 'medium',
    status: parsedEvent.status || 'confirmed',
    created_at: parsedEvent.created_at || now,
    updated_at: now
  }
}

/**
 * Fetches and parses an ICS feed with delta sync support
 */
export async function fetchAndParseMirror(mirror: ICSMirrorConfig): Promise<{
  result: ParsedIcsResult
  etag?: string
  lastModified?: string
}> {
  const headers: Record<string, string> = {
    'User-Agent': 'StoaPro/1.0'
  }

  if (mirror.etag) {
    headers['If-None-Match'] = mirror.etag
  }
  if (mirror.lastModified) {
    headers['If-Modified-Since'] = mirror.lastModified
  }

  const normalizedUrl = mirror.url.replace(/^webcal:\/\//i, 'https://')
  const isHttps = normalizedUrl.startsWith('https')
  const client = isHttps ? (await import('https')).default : (await import('http')).default

  return new Promise((resolve, reject) => {
    client.get(normalizedUrl, { headers }, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // For simplicity, we'll just follow one redirect
        fetchIcsFeed(res.headers.location).then(content => {
          const result = parseIcsText(content, mirror.calendarId)
          resolve({ result, etag: res.headers.etag, lastModified: res.headers['last-modified'] })
        }).catch(reject)
        return
      }

      if (res.statusCode === 304) {
        // Not modified
        resolve({ result: { calendarName: '', events: [] }, etag: mirror.etag, lastModified: mirror.lastModified })
        return
      }

      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Failed to fetch feed: HTTP ${res.statusCode}`))
        return
      }

      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const result = parseIcsText(data, mirror.calendarId)
        resolve({
          result,
          etag: res.headers.etag,
          lastModified: res.headers['last-modified']
        })
      })
    }).on('error', reject)
  })
}

/**
 * Syncs a single ICS mirror - compares with stored hashes and applies changes
 */
export async function syncMirror(mirror: ICSMirrorConfig): Promise<ICSMirrorSyncResult> {
  const startTime = Date.now()
  let eventsAdded = 0
  let eventsUpdated = 0
  let eventsDeleted = 0

  try {
    const { result, etag, lastModified } = await fetchAndParseMirror(mirror)

    // If 304 Not Modified
    if (result.events.length === 0 && etag === mirror.etag && lastModified === mirror.lastModified) {
      return {
        mirrorId: mirror.id,
        status: 'no_changes',
        eventsAdded: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        durationMs: Date.now() - startTime
      }
    }

    // Get existing event hashes for this mirror
    const existingEvents = new Map<string, MirrorEvent>()
    for (const mevt of mirrorEventsDb.list(mirror.id, 1000)) {
      existingEvents.set(mevt.icsUid, mevt)
    }

    const processedUids = new Set<string>()
    const db = getDb()

    // Process each event from the feed
    for (const parsedEvent of result.events) {
      if (!parsedEvent.start) continue

      const icsUid = parsedEvent.id || `ics-${Date.now()}-${randomUUID().slice(0, 8)}`
      const eventContent = JSON.stringify(parsedEvent)
      const contentHash = await computeHash(eventContent)
      processedUids.add(icsUid)

      const existing = existingEvents.get(icsUid)

      if (!existing) {
        // New event
        const normalizedEvent = normalizeIcsEvent(parsedEvent, mirror.calendarId)

        // Insert into events table
        db.prepare(`
          INSERT INTO events (id, calendar_id, title, description, location, meeting_url, start, end, all_day, timezone, rrule, category_id, priority, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          normalizedEvent.id,
          normalizedEvent.calendar_id,
          normalizedEvent.title,
          normalizedEvent.description || null,
          normalizedEvent.location || null,
          normalizedEvent.meeting_url || null,
          normalizedEvent.start,
          normalizedEvent.end,
          normalizedEvent.all_day ? 1 : 0,
          normalizedEvent.timezone,
          normalizedEvent.rrule || null,
          normalizedEvent.category_id || null,
          normalizedEvent.priority,
          normalizedEvent.status,
          normalizedEvent.created_at,
          normalizedEvent.updated_at
        )

        // Record in mirror_events
        mirrorEventsDb.add({
          mirrorId: mirror.id,
          icsUid,
          contentHash,
          action: 'created',
          eventData: normalizedEvent,
          syncedAt: new Date().toISOString()
        })
        eventsAdded++
      } else if (existing.contentHash !== contentHash) {
        // Updated event
        const normalizedEvent = normalizeIcsEvent(parsedEvent, mirror.calendarId)

        // Update in events table
        db.prepare(`
          UPDATE events SET
            title = ?, description = ?, location = ?, meeting_url = ?, start = ?, end = ?,
            all_day = ?, timezone = ?, rrule = ?, category_id = ?, priority = ?, status = ?, updated_at = ?
          WHERE id = ?
        `).run(
          normalizedEvent.title,
          normalizedEvent.description || null,
          normalizedEvent.location || null,
          normalizedEvent.meeting_url || null,
          normalizedEvent.start,
          normalizedEvent.end,
          normalizedEvent.all_day ? 1 : 0,
          normalizedEvent.timezone,
          normalizedEvent.rrule || null,
          normalizedEvent.category_id || null,
          normalizedEvent.priority,
          normalizedEvent.status,
          new Date().toISOString(),
          existing.eventData?.id || normalizedEvent.id
        )

        // Record in mirror_events
        mirrorEventsDb.add({
          mirrorId: mirror.id,
          icsUid,
          contentHash,
          action: 'updated',
          eventData: normalizedEvent,
          syncedAt: new Date().toISOString()
        })
        eventsUpdated++
      } else {
        // Unchanged - just update the timestamp
        mirrorEventsDb.add({
          mirrorId: mirror.id,
          icsUid,
          contentHash,
          action: 'created', // Keep as created for tracking
          eventData: existing.eventData,
          syncedAt: new Date().toISOString()
        })
      }
    }

    // Check for deleted events (UIDs that were in mirror but not in new feed)
    for (const [icsUid, existing] of existingEvents) {
      if (!processedUids.has(icsUid)) {
        // Event was deleted from source
        if (existing.eventData?.id) {
          db.prepare('DELETE FROM events WHERE id = ?').run(existing.eventData.id)
        }

        mirrorEventsDb.add({
          mirrorId: mirror.id,
          icsUid,
          contentHash: existing.contentHash,
          action: 'deleted',
          eventData: existing.eventData,
          syncedAt: new Date().toISOString()
        })
        eventsDeleted++
      }
    }

    // Update mirror sync status
    icsMirrorDb.updateSyncResult(mirror.id, {
      status: 'success',
      etag,
      lastModified
    })

    return {
      mirrorId: mirror.id,
      status: 'success',
      eventsAdded,
      eventsUpdated,
      eventsDeleted,
      durationMs: Date.now() - startTime
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    icsMirrorDb.updateSyncResult(mirror.id, {
      status: 'error',
      error: errorMsg
    })

    return {
      mirrorId: mirror.id,
      status: 'error',
      eventsAdded,
      eventsUpdated,
      eventsDeleted,
      error: errorMsg,
      durationMs: Date.now() - startTime
    }
  }
}

/**
 * Syncs all enabled mirrors with concurrency control
 */
export async function syncAllMirrors(maxConcurrent = 3): Promise<ICSMirrorSyncResult[]> {
  const mirrors = icsMirrorDb.list(true) // enabled only
  const results: ICSMirrorSyncResult[] = []

  // Process in batches
  for (let i = 0; i < mirrors.length; i += maxConcurrent) {
    const batch = mirrors.slice(i, i + maxConcurrent)
    const batchResults = await Promise.all(batch.map(m => syncMirror(m)))
    results.push(...batchResults)
  }

  return results
}

/**
 * Gets mirror sync status for UI
 */
export function getMirrorStatus(mirrorId: string): {
  mirror: ICSMirrorConfig | null
  recentEvents: MirrorEvent[]
  stats: { total: number; created: number; updated: number; deleted: number }
} {
  const mirror = icsMirrorDb.get(mirrorId)
  const recentEvents = mirrorEventsDb.list(mirrorId, 50)

  const stats = recentEvents.reduce((acc, evt) => {
    acc.total++
    if (evt.action === 'created') acc.created++
    else if (evt.action === 'updated') acc.updated++
    else if (evt.action === 'deleted') acc.deleted++
    return acc
  }, { total: 0, created: 0, updated: 0, deleted: 0 })

  return { mirror, recentEvents, stats }
}

/**
 * Creates a new ICS mirror configuration
 */
export function createMirrorConfig(config: Omit<ICSMirrorConfig, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): ICSMirrorConfig {
  return icsMirrorDb.create(config)
}

/**
 * Updates an existing mirror configuration
 */
export function updateMirrorConfig(config: ICSMirrorConfig): ICSMirrorConfig {
  return icsMirrorDb.update(config)
}

/**
 * Deletes a mirror and its event history
 */
export function deleteMirror(mirrorId: string): void {
  mirrorEventsDb.delete(mirrorId)
  icsMirrorDb.delete(mirrorId)
}

/**
 * Toggles mirror enabled state
 */
export function toggleMirror(mirrorId: string, enabled: boolean): void {
  icsMirrorDb.setEnabled(mirrorId, enabled)
}