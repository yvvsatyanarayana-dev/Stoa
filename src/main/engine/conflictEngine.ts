import { getDb } from '../db'
import type { CalendarEvent, Resource, TimetableSlot } from '../../types'

export interface TravelBuffer {
  transitMinutes: number
  mode: 'flight' | 'drive' | 'transit' | 'walk' | 'teleport'
  distanceKm?: number
  originLocation: string
  destinationLocation: string
  bufferStart: string
  bufferEnd: string
  isCrossTimezone?: boolean
  timezoneDifferenceHours?: number
}

export interface ConflictReport {
  hasConflict: boolean
  conflicts: Array<{
    type: 'room_double_booked' | 'person_double_booked' | 'outside_availability' | 'travel_overlap' | 'insufficient_transit'
    message: string
    conflictingItemTitle?: string
    conflictingItemId?: string
    travelBuffer?: TravelBuffer
  }>
  suggestedFreeSlots?: Array<{ start: string; end: string }>
}

/**
 * Calculates estimated travel duration between two text locations offline.
 * Uses deterministic city / airport / campus heuristic mapping.
 */
export function estimateOfflineTransitTime(origin: string, destination: string): {
  transitMinutes: number
  mode: TravelBuffer['mode']
  distanceKm: number
  isCrossTimezone: boolean
  timezoneDifferenceHours: number
} {
  const o = (origin || '').trim().toLowerCase()
  const d = (destination || '').trim().toLowerCase()

  if (!o || !d || o === d || o.includes('zoom') || d.includes('zoom') || o.includes('meet') || d.includes('meet') || o.includes('online') || d.includes('online')) {
    return { transitMinutes: 0, mode: 'walk', distanceKm: 0, isCrossTimezone: false, timezoneDifferenceHours: 0 }
  }

  // Same building / campus room transitions
  if ((o.includes('room') && d.includes('room')) || (o.includes('hall') && d.includes('hall')) || (o.includes('floor') && d.includes('floor'))) {
    return { transitMinutes: 10, mode: 'walk', distanceKm: 0.5, isCrossTimezone: false, timezoneDifferenceHours: 0 }
  }

  // Major global hubs / airport flights
  const majorCities: Record<string, { lat: number; lon: number; tz: number }> = {
    'new york': { lat: 40.71, lon: -74.0, tz: -5 },
    'nyc': { lat: 40.71, lon: -74.0, tz: -5 },
    'london': { lat: 51.5, lon: -0.12, tz: 0 },
    'paris': { lat: 48.85, lon: 2.35, tz: 1 },
    'berlin': { lat: 52.52, lon: 13.4, tz: 1 },
    'tokyo': { lat: 35.67, lon: 139.65, tz: 9 },
    'san francisco': { lat: 37.77, lon: -122.41, tz: -8 },
    'sf': { lat: 37.77, lon: -122.41, tz: -8 },
    'seattle': { lat: 47.6, lon: -122.33, tz: -8 },
    'singapore': { lat: 1.35, lon: 103.81, tz: 8 },
    'hyderabad': { lat: 17.38, lon: 78.48, tz: 5.5 },
    'bengaluru': { lat: 12.97, lon: 77.59, tz: 5.5 },
    'bangalore': { lat: 12.97, lon: 77.59, tz: 5.5 },
    'dubai': { lat: 25.2, lon: 55.27, tz: 4 }
  }

  const findCity = (str: string) => Object.entries(majorCities).find(([k]) => str.includes(k))
  const cityA = findCity(o)
  const cityB = findCity(d)

  if (cityA && cityB && cityA[0] !== cityB[0]) {
    // Great circle distance (Haversine approximation)
    const R = 6371 // km
    const dLat = ((cityB[1].lat - cityA[1].lat) * Math.PI) / 180
    const dLon = ((cityB[1].lon - cityA[1].lon) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((cityA[1].lat * Math.PI) / 180) * Math.cos((cityB[1].lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const dist = Math.round(R * c)
    const tzDiff = Math.abs(cityA[1].tz - cityB[1].tz)

    // Flight buffer: ~800 km/h + 2.5 hours airport security & boarding buffer
    const flightMinutes = Math.round((dist / 800) * 60 + 150)
    return {
      transitMinutes: flightMinutes,
      mode: 'flight',
      distanceKm: dist,
      isCrossTimezone: tzDiff > 0,
      timezoneDifferenceHours: tzDiff
    }
  }

  // Cross-town / intra-city drive default
  return { transitMinutes: 45, mode: 'drive', distanceKm: 18, isCrossTimezone: false, timezoneDifferenceHours: 0 }
}

export function checkEventConflicts(
  event: Partial<CalendarEvent>,
  resourceIds: string[] = [],
  excludeEventId?: string
): ConflictReport {
  const db = getDb()
  const conflicts: ConflictReport['conflicts'] = []

  if (!event.start || !event.end) {
    return { hasConflict: false, conflicts: [] }
  }

  const startMs = new Date(event.start).getTime()
  const endMs = new Date(event.end).getTime()

  // 1. Check resource double-booking with existing events
  for (const resId of resourceIds) {
    const res = db.prepare('SELECT * FROM resources WHERE id = ?').get(resId) as Resource | undefined
    if (!res) continue

    // Find overlapping events for this resource
    let sql = `
      SELECT e.id, e.title, e.start, e.end
      FROM events e
      JOIN event_resources er ON er.event_id = e.id
      WHERE er.resource_id = ?
        AND e.status != 'cancelled'
        AND e.end > ? AND e.start < ?
    `
    const params: any[] = [resId, event.start, event.end]
    if (excludeEventId) {
      sql += ' AND e.id != ?'
      params.push(excludeEventId)
    }

    const overlaps = db.prepare(sql).all(...params) as Array<{ id: string; title: string; start: string; end: string }>
    for (const ov of overlaps) {
      conflicts.push({
        type: res.type === 'room' ? 'room_double_booked' : 'person_double_booked',
        message: `Resource "${res.name}" (${res.type}) is already booked by "${ov.title}" (${new Date(ov.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(ov.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        conflictingItemId: ov.id,
        conflictingItemTitle: ov.title
      })
    }
  }

  // 2. Deterministic Offline-First Travel & Commute Shield
  if (event.location && event.location.trim()) {
    // Find prior adjacent event on the same day
    const dayStart = new Date(event.start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(event.end)
    dayEnd.setHours(23, 59, 59, 999)

    let priorSql = `
      SELECT id, title, start, end, location
      FROM events
      WHERE status != 'cancelled'
        AND start >= ? AND start <= ?
    `
    const pParams: any[] = [dayStart.toISOString(), dayEnd.toISOString()]
    if (excludeEventId) {
      priorSql += ' AND id != ?'
      pParams.push(excludeEventId)
    }
    priorSql += ' ORDER BY start ASC'

    const sameDayEvents = db.prepare(priorSql).all(...pParams) as Array<{
      id: string
      title: string
      start: string
      end: string
      location?: string
    }>

    for (const other of sameDayEvents) {
      if (!other.location || !other.location.trim()) continue

      const otherStartMs = new Date(other.start).getTime()
      const otherEndMs = new Date(other.end).getTime()

      // Case A: other ends right before event starts
      if (otherEndMs <= startMs) {
        const gapMinutes = Math.round((startMs - otherEndMs) / 60000)
        const transit = estimateOfflineTransitTime(other.location, event.location)

        if (transit.transitMinutes > gapMinutes) {
          conflicts.push({
            type: 'insufficient_transit',
            message: `Travel Warning: Only ${gapMinutes} min gap between "${other.title}" (${other.location}) and "${event.title || 'New Event'}" (${event.location}). Required transit buffer is ${transit.transitMinutes} min via ${transit.mode}.`,
            conflictingItemId: other.id,
            conflictingItemTitle: other.title,
            travelBuffer: {
              transitMinutes: transit.transitMinutes,
              mode: transit.mode,
              distanceKm: transit.distanceKm,
              originLocation: other.location,
              destinationLocation: event.location,
              bufferStart: other.end,
              bufferEnd: new Date(otherEndMs + transit.transitMinutes * 60000).toISOString(),
              isCrossTimezone: transit.isCrossTimezone,
              timezoneDifferenceHours: transit.timezoneDifferenceHours
            }
          })
        }
      }
      // Case B: event ends right before other starts
      else if (endMs <= otherStartMs) {
        const gapMinutes = Math.round((otherStartMs - endMs) / 60000)
        const transit = estimateOfflineTransitTime(event.location, other.location)

        if (transit.transitMinutes > gapMinutes) {
          conflicts.push({
            type: 'insufficient_transit',
            message: `Travel Warning: After "${event.title || 'New Event'}" (${event.location}), only ${gapMinutes} min remains before "${other.title}" (${other.location}). Required transit buffer is ${transit.transitMinutes} min via ${transit.mode}.`,
            conflictingItemId: other.id,
            conflictingItemTitle: other.title,
            travelBuffer: {
              transitMinutes: transit.transitMinutes,
              mode: transit.mode,
              distanceKm: transit.distanceKm,
              originLocation: event.location,
              destinationLocation: other.location,
              bufferStart: event.end,
              bufferEnd: new Date(endMs + transit.transitMinutes * 60000).toISOString(),
              isCrossTimezone: transit.isCrossTimezone,
              timezoneDifferenceHours: transit.timezoneDifferenceHours
            }
          })
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  }
}

export function checkTimetableSlotConflicts(
  slot: Partial<TimetableSlot>,
  timetableId: string,
  excludeSlotId?: string
): ConflictReport {
  const db = getDb()
  const conflicts: ConflictReport['conflicts'] = []

  if (slot.day === undefined || !slot.start || !slot.end) {
    return { hasConflict: false, conflicts: [] }
  }

  let sql = `
    SELECT ts.*, s.name as sub_name
    FROM timetable_slots ts
    LEFT JOIN subjects s ON ts.subject_id = s.id
    WHERE ts.timetable_id = ?
      AND ts.day = ?
      AND ts.end > ? AND ts.start < ?
  `
  const params: (string | number)[] = [timetableId, slot.day, slot.start, slot.end]
  if (excludeSlotId) {
    sql += ' AND ts.id != ?'
    params.push(excludeSlotId)
  }

  const overlaps = db.prepare(sql).all(...params) as unknown as Array<TimetableSlot & { sub_name?: string }>
  for (const ov of overlaps) {
    conflicts.push({
      type: 'room_double_booked',
      message: `Time slot overlaps with "${ov.sub_name || 'Subject'}" on Day ${ov.day} (${ov.start} - ${ov.end})`,
      conflictingItemId: ov.id,
      conflictingItemTitle: ov.sub_name
    })
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  }
}
