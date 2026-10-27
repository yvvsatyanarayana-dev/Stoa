import type { CalendarEvent } from '../../types'
import https from 'https'
import http from 'http'

export interface ParsedIcsResult {
  calendarName?: string
  events: Partial<CalendarEvent>[]
}

/**
 * Parses iCalendar (RFC 5545) text stream into CalendarEvent objects
 */
export function parseIcsText(icsContent: string, targetCalendarId: string): ParsedIcsResult {
  // Normalize line endings and unfold lines (lines starting with space or tab continue previous line)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  let calendarName = 'External Feed'
  const events: Partial<CalendarEvent>[] = []
  let currentEvent: Record<string, string> | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('X-WR-CALNAME:')) {
      calendarName = trimmed.substring(13).trim()
    } else if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {}
    } else if (trimmed === 'END:VEVENT') {
      if (currentEvent && currentEvent['DTSTART']) {
        const startIso = parseIcsDate(currentEvent['DTSTART'])
        let endIso = currentEvent['DTEND'] ? parseIcsDate(currentEvent['DTEND']) : null

        if (!endIso && startIso) {
          // Default to 1 hour after start
          const d = new Date(startIso)
          d.setHours(d.getHours() + 1)
          endIso = d.toISOString()
        }

        if (startIso && endIso) {
          events.push({
            id: currentEvent['UID'] || `evt-ics-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            calendar_id: targetCalendarId,
            title: unescapeIcsText(currentEvent['SUMMARY'] || 'External Event'),
            description: currentEvent['DESCRIPTION'] ? unescapeIcsText(currentEvent['DESCRIPTION']) : undefined,
            location: currentEvent['LOCATION'] ? unescapeIcsText(currentEvent['LOCATION']) : undefined,
            meeting_url: currentEvent['URL'] || extractUrl(currentEvent['DESCRIPTION']),
            start: startIso,
            end: endIso,
            all_day: currentEvent['DTSTART'].length === 8, // YYYYMMDD without time
            timezone: 'UTC',
            priority: 'medium',
            status: currentEvent['STATUS']?.toLowerCase() === 'tentative' ? 'tentative' : 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
      currentEvent = null
    } else if (currentEvent) {
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex > 0) {
        let key = trimmed.substring(0, colonIndex).toUpperCase()
        const value = trimmed.substring(colonIndex + 1)

        // Strip parameters like DTSTART;TZID=America/New_York
        if (key.includes(';')) {
          key = key.split(';')[0]
        }
        currentEvent[key] = value
      }
    }
  }

  return { calendarName, events }
}

function parseIcsDate(dateStr: string): string | null {
  // Handles:
  // 1. 20261027T143000Z (UTC)
  // 2. 20261027T143000 (Local)
  // 3. 20261027 (All day)
  try {
    const clean = dateStr.replace(/[^0-9TZ]/g, '')
    if (clean.length === 8) {
      // YYYYMMDD
      const y = clean.substring(0, 4)
      const m = clean.substring(4, 6)
      const d = clean.substring(6, 8)
      return `${y}-${m}-${d}T00:00:00.000Z`
    } else if (clean.length >= 15) {
      // YYYYMMDDTHHMMSS
      const y = clean.substring(0, 4)
      const m = clean.substring(4, 6)
      const d = clean.substring(6, 8)
      const h = clean.substring(9, 11)
      const min = clean.substring(11, 13)
      const s = clean.substring(13, 15)
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s))).toISOString()
    }
  } catch {}
  return null
}

function unescapeIcsText(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function extractUrl(text?: string): string | undefined {
  if (!text) return undefined
  const match = text.match(/https?:\/\/[^\s<"'>]+/)
  return match ? match[0] : undefined
}

/**
 * Fetches an external Webcal / HTTP .ics feed
 */
export async function fetchIcsFeed(url: string): Promise<string> {
  const normalizedUrl = url.replace(/^webcal:\/\//i, 'https://')
  const client = normalizedUrl.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    client
      .get(normalizedUrl, { headers: { 'User-Agent': 'ChronoDeskPro/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Handle redirect
          fetchIcsFeed(res.headers.location).then(resolve).catch(reject)
          return
        }

        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Failed to fetch feed: HTTP ${res.statusCode}`))
          return
        }

        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}
