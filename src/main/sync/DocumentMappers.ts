// Document Mappers - Convert between SQLite rows and Automerge documents

import { getDb } from '../db'
import type { SyncTableType, SyncDocumentData } from './types'

// Map SQLite row to typed object
export function mapRowToObject<T>(row: any, table: SyncTableType): T {
  switch (table) {
    case 'calendars':
      return {
        ...row,
        visible: Boolean(row.visible),
        is_default: Boolean(row.is_default)
      } as unknown as T

    case 'events':
      return {
        ...row,
        all_day: Boolean(row.all_day)
      } as unknown as T

    case 'categories':
      return row as unknown as T

    case 'resources':
      return {
        ...row,
        availability_json: row.availability_json ? JSON.parse(row.availability_json) : undefined
      } as unknown as T

    case 'timetables':
      return {
        ...row,
        settings_json: row.settings_json ? JSON.parse(row.settings_json) : undefined
      } as unknown as T

    case 'timetable_slots':
      return {
        ...row,
        week_pattern: row.week_pattern || 'all'
      } as unknown as T

    case 'subjects':
      return row as unknown as T

    case 'themes':
      return {
        ...row,
        basePalette: JSON.parse(row.base_palette_json),
        customPhasePalettes: row.custom_phase_palettes_json ? JSON.parse(row.custom_phase_palettes_json) : undefined,
        customSeasonalPalettes: row.custom_seasonal_palettes_json ? JSON.parse(row.custom_seasonal_palettes_json) : undefined,
        seasonalEnabled: Boolean(row.seasonal_enabled)
      } as unknown as T

    case 'settings':
      let val: any = row.value
      if (val === 'true') val = true
      else if (val === 'false') val = false
      else if (!isNaN(Number(val)) && (row.key.includes('offset') || row.key.includes('day'))) val = Number(val)
      return { [row.key]: val } as unknown as T

    default:
      return row as unknown as T
  }
}

// Map typed object to SQLite row
export function mapObjectToRow<T>(obj: T, table: SyncTableType): any {
  switch (table) {
    case 'calendars':
      const cal = obj as any
      return {
        id: cal.id,
        name: cal.name,
        color: cal.color,
        source: cal.source || 'local',
        visible: cal.visible ? 1 : 0,
        is_default: cal.is_default ? 1 : 0
      }

    case 'events':
      const evt = obj as any
      return {
        id: evt.id,
        calendar_id: evt.calendar_id,
        title: evt.title,
        description: evt.description || null,
        location: evt.location || null,
        meeting_url: evt.meeting_url || null,
        start: evt.start,
        end: evt.end,
        all_day: evt.all_day ? 1 : 0,
        timezone: evt.timezone || 'UTC',
        rrule: evt.rrule || null,
        category_id: evt.category_id || null,
        priority: evt.priority || 'medium',
        status: evt.status || 'confirmed',
        created_at: evt.created_at,
        updated_at: evt.updated_at
      }

    case 'categories':
      const cat = obj as any
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon || null
      }

    case 'resources':
      const res = obj as any
      return {
        id: res.id,
        name: res.name,
        type: res.type,
        capacity: res.capacity || 1,
        availability_json: res.availability_json ? JSON.stringify(res.availability_json) : null
      }

    case 'timetables':
      const tt = obj as any
      return {
        id: tt.id,
        name: tt.name,
        start_date: tt.start_date,
        end_date: tt.end_date,
        status: tt.status || 'draft',
        settings_json: tt.settings_json ? JSON.stringify(tt.settings_json) : null,
        created_at: tt.created_at,
        updated_at: tt.updated_at
      }

    case 'timetable_slots':
      const slot = obj as any
      return {
        id: slot.id,
        timetable_id: slot.timetable_id,
        subject_id: slot.subject_id,
        resource_id: slot.resource_id || null,
        day: slot.day,
        start: slot.start,
        end: slot.end,
        room: slot.room || null,
        week_pattern: slot.week_pattern || 'all'
      }

    case 'subjects':
      const sub = obj as any
      return {
        id: sub.id,
        name: sub.name,
        color: sub.color,
        icon: sub.icon || null,
        weekly_hours: sub.weekly_hours || 0
      }

    case 'themes':
      const theme = obj as any
      return {
        id: theme.id,
        name: theme.name,
        mode: theme.mode,
        base_palette_json: JSON.stringify(theme.basePalette),
        circadian_offset_minutes: theme.circadianOffsetMinutes || 0,
        seasonal_enabled: theme.seasonalEnabled ? 1 : 0,
        custom_phase_palettes_json: theme.customPhasePalettes ? JSON.stringify(theme.customPhasePalettes) : null,
        custom_seasonal_palettes_json: theme.customSeasonalPalettes ? JSON.stringify(theme.customSeasonalPalettes) : null,
        created_at: theme.createdAt,
        updated_at: theme.updatedAt
      }

    case 'settings':
      // Settings handled separately
      return obj

    default:
      return obj
  }
}

// Convert Automerge document to SQLite-ready data
export function automergeDocToSqlite(doc: SyncDocumentData): Record<SyncTableType, any[]> {
  const result: Record<SyncTableType, any[]> = {
    calendars: [],
    events: [],
    categories: [],
    resources: [],
    timetables: [],
    timetable_slots: [],
    subjects: [],
    themes: [],
    settings: []
  }

  if (doc.calendars) {
    result.calendars = doc.calendars.map(c => mapObjectToRow(c, 'calendars'))
  }
  if (doc.events) {
    result.events = doc.events.map(e => mapObjectToRow(e, 'events'))
  }
  if (doc.categories) {
    result.categories = doc.categories.map(c => mapObjectToRow(c, 'categories'))
  }
  if (doc.resources) {
    result.resources = doc.resources.map(r => mapObjectToRow(r, 'resources'))
  }
  if (doc.timetables) {
    result.timetables = doc.timetables.map(t => mapObjectToRow(t, 'timetables'))
  }
  if (doc.timetableSlots) {
    result.timetable_slots = doc.timetableSlots.map(s => mapObjectToRow(s, 'timetable_slots'))
  }
  if (doc.subjects) {
    result.subjects = doc.subjects.map(s => mapObjectToRow(s, 'subjects'))
  }
  if (doc.themes) {
    result.themes = doc.themes.map(t => mapObjectToRow(t, 'themes'))
  }
  if (doc.settings) {
    result.settings = Object.entries(doc.settings).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }))
  }

  return result
}

// Convert SQLite data to Automerge document format
export function sqliteToAutomergeDoc(): SyncDocumentData {
  const db = getDb()

  return {
    calendars: db.prepare('SELECT * FROM calendars').all().map(r => mapRowToObject(r, 'calendars')),
    events: db.prepare('SELECT * FROM events').all().map(r => mapRowToObject(r, 'events')),
    categories: db.prepare('SELECT * FROM categories').all().map(r => mapRowToObject(r, 'categories')),
    resources: db.prepare('SELECT * FROM resources').all().map(r => mapRowToObject(r, 'resources')),
    timetables: db.prepare('SELECT * FROM timetables').all().map(r => mapRowToObject(r, 'timetables')),
    timetableSlots: db.prepare('SELECT * FROM timetable_slots').all().map(r => mapRowToObject(r, 'timetable_slots')),
    subjects: db.prepare('SELECT * FROM subjects').all().map(r => mapRowToObject(r, 'subjects')),
    themes: db.prepare('SELECT * FROM themes').all().map(r => mapRowToObject(r, 'themes')),
    settings: db.prepare('SELECT key, value FROM settings').all().reduce((acc: any, r: any) => {
      let val: any = r.value
      if (val === 'true') val = true
      else if (val === 'false') val = false
      else if (!isNaN(Number(val)) && (r.key.includes('offset') || r.key.includes('day'))) val = Number(val)
      acc[r.key] = val
      return acc
    }, {})
  }
}

// Apply Automerge document changes to SQLite (for initial sync or conflict resolution)
export function applyAutomergeToSqlite(doc: SyncDocumentData): void {
  const db = getDb()
  const sqliteData = automergeDocToSqlite(doc)

  // Use BEGIN/COMMIT for atomicity
  db.exec('BEGIN TRANSACTION')
  try {
    // Calendars
    for (const cal of sqliteData.calendars) {
      const existing = db.prepare('SELECT id FROM calendars WHERE id = ?').get(cal.id)
      if (existing) {
        db.prepare('UPDATE calendars SET name = ?, color = ?, source = ?, visible = ?, is_default = ? WHERE id = ?')
          .run(cal.name, cal.color, cal.source, cal.visible, cal.is_default, cal.id)
      } else {
        db.prepare('INSERT INTO calendars (id, name, color, source, visible, is_default) VALUES (?, ?, ?, ?, ?, ?)')
          .run(cal.id, cal.name, cal.color, cal.source, cal.visible, cal.is_default)
      }
    }

    // Events
    for (const evt of sqliteData.events) {
      const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(evt.id)
      if (existing) {
        db.prepare(`
          UPDATE events SET calendar_id = ?, title = ?, description = ?, location = ?, meeting_url = ?,
            start = ?, end = ?, all_day = ?, timezone = ?, rrule = ?, category_id = ?,
            priority = ?, status = ?, updated_at = ?
          WHERE id = ?
        `).run(
          evt.calendar_id, evt.title, evt.description, evt.location, evt.meeting_url,
          evt.start, evt.end, evt.all_day, evt.timezone, evt.rrule, evt.category_id,
          evt.priority, evt.status, new Date().toISOString(), evt.id
        )
      } else {
        db.prepare(`
          INSERT INTO events (id, calendar_id, title, description, location, meeting_url, start, end, all_day, timezone, rrule, category_id, priority, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          evt.id, evt.calendar_id, evt.title, evt.description, evt.location, evt.meeting_url,
          evt.start, evt.end, evt.all_day, evt.timezone, evt.rrule, evt.category_id,
          evt.priority, evt.status, evt.created_at, evt.updated_at
        )
      }
    }

    // Categories
    for (const cat of sqliteData.categories) {
      const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(cat.id)
      if (existing) {
        db.prepare('UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?')
          .run(cat.name, cat.color, cat.icon, cat.id)
      } else {
        db.prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)')
          .run(cat.id, cat.name, cat.color, cat.icon)
      }
    }

    // Resources
    for (const res of sqliteData.resources) {
      const existing = db.prepare('SELECT id FROM resources WHERE id = ?').get(res.id)
      if (existing) {
        db.prepare('UPDATE resources SET name = ?, type = ?, capacity = ?, availability_json = ? WHERE id = ?')
          .run(res.name, res.type, res.capacity, res.availability_json, res.id)
      } else {
        db.prepare('INSERT INTO resources (id, name, type, capacity, availability_json) VALUES (?, ?, ?, ?, ?)')
          .run(res.id, res.name, res.type, res.capacity, res.availability_json)
      }
    }

    // Timetables
    for (const tt of sqliteData.timetables) {
      const existing = db.prepare('SELECT id FROM timetables WHERE id = ?').get(tt.id)
      if (existing) {
        db.prepare('UPDATE timetables SET name = ?, start_date = ?, end_date = ?, status = ?, settings_json = ?, updated_at = ? WHERE id = ?')
          .run(tt.name, tt.start_date, tt.end_date, tt.status, tt.settings_json, tt.updated_at, tt.id)
      } else {
        db.prepare('INSERT INTO timetables (id, name, start_date, end_date, status, settings_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(tt.id, tt.name, tt.start_date, tt.end_date, tt.status, tt.settings_json, tt.created_at, tt.updated_at)
      }
    }

    // Timetable Slots
    for (const slot of sqliteData.timetable_slots) {
      const existing = db.prepare('SELECT id FROM timetable_slots WHERE id = ?').get(slot.id)
      if (existing) {
        db.prepare('UPDATE timetable_slots SET subject_id = ?, resource_id = ?, day = ?, start = ?, end = ?, room = ?, week_pattern = ? WHERE id = ?')
          .run(slot.subject_id, slot.resource_id, slot.day, slot.start, slot.end, slot.room, slot.week_pattern, slot.id)
      } else {
        db.prepare('INSERT INTO timetable_slots (id, timetable_id, subject_id, resource_id, day, start, end, room, week_pattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(slot.id, slot.timetable_id, slot.subject_id, slot.resource_id, slot.day, slot.start, slot.end, slot.room, slot.week_pattern)
      }
    }

    // Subjects
    for (const sub of sqliteData.subjects) {
      const existing = db.prepare('SELECT id FROM subjects WHERE id = ?').get(sub.id)
      if (existing) {
        db.prepare('UPDATE subjects SET name = ?, color = ?, icon = ?, weekly_hours = ? WHERE id = ?')
          .run(sub.name, sub.color, sub.icon, sub.weekly_hours, sub.id)
      } else {
        db.prepare('INSERT INTO subjects (id, name, color, icon, weekly_hours) VALUES (?, ?, ?, ?, ?)')
          .run(sub.id, sub.name, sub.color, sub.icon, sub.weekly_hours)
      }
    }

    // Themes
    for (const theme of sqliteData.themes) {
      const existing = db.prepare('SELECT id FROM themes WHERE id = ?').get(theme.id)
      if (existing) {
        db.prepare(`
          UPDATE themes SET name = ?, mode = ?, base_palette_json = ?, circadian_offset_minutes = ?,
            seasonal_enabled = ?, custom_phase_palettes_json = ?, custom_seasonal_palettes_json = ?, updated_at = ?
          WHERE id = ?
        `).run(
          theme.name, theme.mode, theme.base_palette_json, theme.circadian_offset_minutes,
          theme.seasonal_enabled, theme.custom_phase_palettes_json, theme.custom_seasonal_palettes_json,
          theme.updated_at, theme.id
        )
      } else {
        db.prepare(`
          INSERT INTO themes (id, name, mode, base_palette_json, circadian_offset_minutes, seasonal_enabled, custom_phase_palettes_json, custom_seasonal_palettes_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          theme.id, theme.name, theme.mode, theme.base_palette_json, theme.circadian_offset_minutes,
          theme.seasonal_enabled, theme.custom_phase_palettes_json, theme.custom_seasonal_palettes_json,
          theme.created_at, theme.updated_at
        )
      }
    }

    // Settings
    for (const setting of sqliteData.settings) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
        .run(setting.key, setting.value)
    }

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

// Get changed rows since last sync (for incremental sync)
export function getChangesSince(lastSyncTime: string): Partial<SyncDocumentData> {
  const db = getDb()
  const timestamp = lastSyncTime

  return {
    calendars: db.prepare('SELECT * FROM calendars WHERE updated_at > ?').all(timestamp).map(r => mapRowToObject(r, 'calendars')),
    events: db.prepare('SELECT * FROM events WHERE updated_at > ?').all(timestamp).map(r => mapRowToObject(r, 'events')),
    categories: db.prepare('SELECT * FROM categories WHERE id IN (SELECT category_id FROM events WHERE updated_at > ?)').all(timestamp).map(r => mapRowToObject(r, 'categories')),
    resources: db.prepare('SELECT * FROM resources WHERE id IN (SELECT resource_id FROM event_resources WHERE event_id IN (SELECT id FROM events WHERE updated_at > ?))').all(timestamp).map(r => mapRowToObject(r, 'resources')),
    timetables: db.prepare('SELECT * FROM timetables WHERE updated_at > ?').all(timestamp).map(r => mapRowToObject(r, 'timetables')),
    timetableSlots: db.prepare('SELECT * FROM timetable_slots WHERE timetable_id IN (SELECT id FROM timetables WHERE updated_at > ?)').all(timestamp).map(r => mapRowToObject(r, 'timetable_slots')),
    subjects: db.prepare('SELECT * FROM subjects WHERE id IN (SELECT subject_id FROM timetable_slots WHERE timetable_id IN (SELECT id FROM timetables WHERE updated_at > ?))').all(timestamp).map(r => mapRowToObject(r, 'subjects')),
    themes: db.prepare('SELECT * FROM themes WHERE updated_at > ?').all(timestamp).map(r => mapRowToObject(r, 'themes')),
    settings: db.prepare('SELECT key, value FROM settings WHERE key IN (SELECT key FROM settings)').all().reduce((acc: any, r: any) => {
      let val: any = r.value
      if (val === 'true') val = true
      else if (val === 'false') val = false
      else if (!isNaN(Number(val)) && (r.key.includes('offset') || r.key.includes('day'))) val = Number(val)
      acc[r.key] = val
      return acc
    }, {})
  }
}