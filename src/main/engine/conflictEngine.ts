import { getDb } from '../db'
import type { CalendarEvent, Resource, TimetableSlot } from '../../types'

export interface ConflictReport {
  hasConflict: boolean
  conflicts: Array<{
    type: 'room_double_booked' | 'person_double_booked' | 'outside_availability'
    message: string
    conflictingItemTitle?: string
    conflictingItemId?: string
  }>
  suggestedFreeSlots?: Array<{ start: string; end: string }>
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

    // 2. Check resource working hours / days availability if defined
    if (res.availability_json) {
      try {
        const avail = JSON.parse(res.availability_json)
        const eventStartDate = new Date(event.start)
        const dayOfWeek = eventStartDate.getDay() // 0 = Sunday, 1 = Monday, etc.
        const dayFormatted = dayOfWeek === 0 ? 7 : dayOfWeek // convert to 1-7 (Mon-Sun)

        if (avail.workingDays && Array.isArray(avail.workingDays)) {
          if (!avail.workingDays.includes(dayFormatted)) {
            conflicts.push({
              type: 'outside_availability',
              message: `"${res.name}" is scheduled outside standard working days (Day ${dayFormatted})`
            })
          }
        }

        if (avail.workingHours && avail.workingHours.start && avail.workingHours.end) {
          const eventStartH = eventStartDate.getHours() + eventStartDate.getMinutes() / 60
          const eventEndDate = new Date(event.end)
          const eventEndH = eventEndDate.getHours() + eventEndDate.getMinutes() / 60

          const [startH, startM] = avail.workingHours.start.split(':').map(Number)
          const [endH, endM] = avail.workingHours.end.split(':').map(Number)
          const availStart = startH + (startM || 0) / 60
          const availEnd = endH + (endM || 0) / 60

          if (eventStartH < availStart || eventEndH > availEnd) {
            conflicts.push({
              type: 'outside_availability',
              message: `"${res.name}" is scheduled outside working hours (${avail.workingHours.start} - ${avail.workingHours.end})`
            })
          }
        }
      } catch (err) {
        console.warn('Error parsing availability JSON:', err)
      }
    }
  }

  // 3. Propose nearest free slot (e.g. shift by 1 hour)
  const suggestedFreeSlots: Array<{ start: string; end: string }> = []
  if (conflicts.length > 0) {
    const durationMs = endMs - startMs
    // Try 1 hour later, 2 hours later, next morning at 9am
    for (let offsetH = 1; offsetH <= 3; offsetH++) {
      const nextStart = new Date(startMs + offsetH * 60 * 60 * 1000)
      const nextEnd = new Date(nextStart.getTime() + durationMs)
      // Quick check if this candidate conflicts
      let hasCandidateConflict = false
      for (const resId of resourceIds) {
        const ov = db.prepare(`
          SELECT e.id FROM events e
          JOIN event_resources er ON er.event_id = e.id
          WHERE er.resource_id = ? AND e.status != 'cancelled' AND e.end > ? AND e.start < ?
        `).get(resId, nextStart.toISOString(), nextEnd.toISOString())
        if (ov) {
          hasCandidateConflict = true
          break
        }
      }
      if (!hasCandidateConflict) {
        suggestedFreeSlots.push({
          start: nextStart.toISOString(),
          end: nextEnd.toISOString()
        })
        break
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    suggestedFreeSlots
  }
}

export function checkTimetableSlotConflicts(
  slot: Partial<TimetableSlot>,
  timetableId: string,
  excludeSlotId?: string
): ConflictReport {
  const db = getDb()
  const conflicts: ConflictReport['conflicts'] = []

  if (!slot.day || !slot.start || !slot.end) {
    return { hasConflict: false, conflicts: [] }
  }

  // Check resource double-booking in timetable
  if (slot.resource_id) {
    let sql = `
      SELECT ts.id, ts.start, ts.end, ts.room, s.name as sub_name
      FROM timetable_slots ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.timetable_id = ? AND ts.day = ? AND ts.resource_id = ?
        AND ts.end > ? AND ts.start < ?
    `
    const params: any[] = [timetableId, slot.day, slot.resource_id, slot.start, slot.end]
    if (excludeSlotId) {
      sql += ' AND ts.id != ?'
      params.push(excludeSlotId)
    }

    const overlaps = db.prepare(sql).all(...params) as any[]
    for (const ov of overlaps) {
      conflicts.push({
        type: 'person_double_booked',
        message: `Trainer/Person is already booked for "${ov.sub_name}" at ${ov.start}-${ov.end}`,
        conflictingItemId: ov.id,
        conflictingItemTitle: ov.sub_name
      })
    }
  }

  // Check room double booking in timetable
  if (slot.room && slot.room.trim()) {
    let sql = `
      SELECT ts.id, ts.start, ts.end, s.name as sub_name
      FROM timetable_slots ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.timetable_id = ? AND ts.day = ? AND ts.room = ?
        AND ts.end > ? AND ts.start < ?
    `
    const params: any[] = [timetableId, slot.day, slot.room, slot.start, slot.end]
    if (excludeSlotId) {
      sql += ' AND ts.id != ?'
      params.push(excludeSlotId)
    }

    const overlaps = db.prepare(sql).all(...params) as any[]
    for (const ov of overlaps) {
      conflicts.push({
        type: 'room_double_booked',
        message: `Room "${slot.room}" is already allocated to "${ov.sub_name}" at ${ov.start}-${ov.end}`,
        conflictingItemId: ov.id,
        conflictingItemTitle: ov.sub_name
      })
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  }
}
