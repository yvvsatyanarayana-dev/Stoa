import { DatabaseSync } from 'node:sqlite'
import { join } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import type {
  Calendar,
  Category,
  CalendarEvent,
  Resource,
  Timetable,
  TimetableSlot,
  Subject,
  Reminder,
  NotificationLog,
  ChronoDeskSettings
} from '../../types'

let db: DatabaseSync

export function getDb(): DatabaseSync {
  if (!db) {
    initDatabase()
  }
  return db
}

export function initDatabase(): void {
  // Determine path: userData in production/development, or fallback
  const isDev = !app.isPackaged
  let dbDir: string
  try {
    dbDir = app.getPath('userData')
  } catch {
    dbDir = process.cwd()
  }

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = isDev ? join(dbDir, 'chronodesk.dev.sqlite') : join(dbDir, 'chronodesk.sqlite')
  console.log(`[Database] Initializing SQLite database at: ${dbPath}`)

  db = new DatabaseSync(dbPath)

  // Configure SQLite pragmas for high performance & reliability (WAL mode)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA synchronous = NORMAL;')

  // Create tables according to PRD
  createSchema()
  seedInitialData()
}

function createSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'local',
      visible INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('person', 'room', 'equipment')),
      capacity INTEGER NOT NULL DEFAULT 1,
      availability_json TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      calendar_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      meeting_url TEXT,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      rrule TEXT,
      category_id TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('tentative', 'confirmed', 'cancelled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS event_exceptions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      original_date TEXT NOT NULL,
      override_fields TEXT NOT NULL,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendees (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      rsvp_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_resources (
      event_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      PRIMARY KEY (event_id, resource_id),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      offset_minutes INTEGER NOT NULL DEFAULT 15,
      channel TEXT NOT NULL DEFAULT 'native',
      fired_at TEXT,
      snoozed_until TEXT,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timetables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'locked')),
      settings_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      weekly_hours REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS timetable_slots (
      id TEXT PRIMARY KEY,
      timetable_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      resource_id TEXT,
      day INTEGER NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      room TEXT,
      week_pattern TEXT DEFAULT 'all',
      FOREIGN KEY(timetable_id) REFERENCES timetables(id) ON DELETE CASCADE,
      FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY(resource_id) REFERENCES resources(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS timetable_versions (
      id TEXT PRIMARY KEY,
      timetable_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(timetable_id) REFERENCES timetables(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      title TEXT NOT NULL,
      body TEXT,
      shown_at TEXT NOT NULL,
      action_taken TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
    CREATE INDEX IF NOT EXISTS idx_events_end ON events(end);
    CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(calendar_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_slots_day ON timetable_slots(timetable_id, day);
  `)
}

function seedInitialData(): void {
  // Check if calendars exist
  const existingCal = db.prepare('SELECT count(*) as count FROM calendars').get() as { count: number }
  if (Number(existingCal.count) === 0) {
    console.log('[Database] Seeding default calendars, categories, and resources...')
    
    // Calendars
    const insertCal = db.prepare('INSERT INTO calendars (id, name, color, source, visible, is_default) VALUES (?, ?, ?, ?, ?, ?)')
    insertCal.run('cal-primary', 'Corporate & Operations', '#3b82f6', 'local', 1, 1)
    insertCal.run('cal-clients', 'Client Meetings', '#10b981', 'local', 1, 0)
    insertCal.run('cal-training', 'Training & Workshops', '#8b5cf6', 'local', 1, 0)
    insertCal.run('cal-conferences', 'Conferences & Events', '#f59e0b', 'local', 1, 0)

    // Categories
    const insertCat = db.prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)')
    insertCat.run('cat-meeting', 'Meeting', '#3b82f6', 'Users')
    insertCat.run('cat-appointment', 'Client Appointment', '#10b981', 'UserCheck')
    insertCat.run('cat-interview', 'Interview', '#06b6d4', 'Briefcase')
    insertCat.run('cat-training', 'Training Session', '#8b5cf6', 'GraduationCap')
    insertCat.run('cat-webinar', 'Webinar / Stream', '#ec4899', 'Video')
    insertCat.run('cat-conference', 'Conference Track', '#f59e0b', 'Presentation')
    insertCat.run('cat-deadline', 'Project Milestone', '#ef4444', 'Flag')

    // Default Resources
    const insertRes = db.prepare('INSERT INTO resources (id, name, type, capacity, availability_json) VALUES (?, ?, ?, ?, ?)')
    insertRes.run('res-room-a', 'Executive Boardroom', 'room', 16, JSON.stringify({ workingHours: { start: '08:00', end: '19:00' }, workingDays: [1,2,3,4,5] }))
    insertRes.run('res-room-b', 'Conference Room Alpha', 'room', 30, JSON.stringify({ workingHours: { start: '08:00', end: '20:00' }, workingDays: [1,2,3,4,5,6] }))
    insertRes.run('res-room-c', 'Meeting Pod 1', 'room', 4, JSON.stringify({ workingHours: { start: '08:00', end: '20:00' }, workingDays: [1,2,3,4,5,6,7] }))
    insertRes.run('res-person-1', 'Dr. Sarah Mitchell (Lead Consultant)', 'person', 1, JSON.stringify({ workingHours: { start: '09:00', end: '17:00' }, workingDays: [1,2,3,4,5] }))
    insertRes.run('res-person-2', 'Marcus Vance (Principal Trainer)', 'person', 1, JSON.stringify({ workingHours: { start: '08:30', end: '16:30' }, workingDays: [1,2,3,4,5] }))
    insertRes.run('res-eq-1', 'Main 4K Projector & Audio Rig', 'equipment', 1, null)

    // Default Subjects for Timetable
    const insertSub = db.prepare('INSERT INTO subjects (id, name, color, icon, weekly_hours) VALUES (?, ?, ?, ?, ?)')
    insertSub.run('sub-1', 'Executive Briefing & Strategy', '#3b82f6', 'TrendingUp', 4)
    insertSub.run('sub-2', 'Technical Architecture Workshop', '#8b5cf6', 'Code', 6)
    insertSub.run('sub-3', 'Operations Review', '#10b981', 'CheckCircle', 3)
    insertSub.run('sub-4', 'Client Consultation Window', '#f59e0b', 'MessageSquare', 5)

    // Default sample timetable
    const insertTt = db.prepare('INSERT INTO timetables (id, name, start_date, end_date, status, settings_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    const nowIso = new Date().toISOString()
    insertTt.run(
      'tt-default',
      'Q4 Master Operations & Training Roster',
      '2026-10-01',
      '2026-12-31',
      'published',
      JSON.stringify({
        slotDuration: 60,
        dayStartTime: '08:00',
        dayEndTime: '18:00',
        daysToShow: [1, 2, 3, 4, 5],
        lunchBreak: { start: '12:00', end: '13:00' }
      }),
      nowIso,
      nowIso
    )

    // Default timetable slots
    const insertSlot = db.prepare('INSERT INTO timetable_slots (id, timetable_id, subject_id, resource_id, day, start, end, room, week_pattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    insertSlot.run('slot-1', 'tt-default', 'sub-1', 'res-person-1', 1, '09:00', '11:00', 'Executive Boardroom', 'all')
    insertSlot.run('slot-2', 'tt-default', 'sub-2', 'res-person-2', 2, '10:00', '12:00', 'Conference Room Alpha', 'all')
    insertSlot.run('slot-3', 'tt-default', 'sub-3', 'res-person-1', 3, '14:00', '16:00', 'Executive Boardroom', 'all')
    insertSlot.run('slot-4', 'tt-default', 'sub-4', 'res-person-2', 4, '09:30', '11:30', 'Meeting Pod 1', 'all')

    // Initial seed events (Today + upcoming)
    const today = new Date()
    const fmtDate = (d: Date, hour: number, minute: number): string => {
      const copy = new Date(d)
      copy.setHours(hour, minute, 0, 0)
      return copy.toISOString()
    }

    const insertEvent = db.prepare(`
      INSERT INTO events (id, calendar_id, title, description, location, meeting_url, start, end, all_day, timezone, priority, status, category_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertEvent.run(
      'evt-1',
      'cal-primary',
      'Senior Leadership Sync & Roadmap',
      'Reviewing Q4 OKRs, budget approvals, and timeline milestones.',
      'Executive Boardroom',
      'https://teams.microsoft.com/l/meetup-join/sample-link',
      fmtDate(today, 10, 0),
      fmtDate(today, 11, 30),
      0,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      'high',
      'confirmed',
      'cat-meeting',
      nowIso,
      nowIso
    )

    insertEvent.run(
      'evt-2',
      'cal-clients',
      'AcroCorp Architecture Onboarding',
      'Technical architecture handover with the client engineering directors.',
      'Conference Room Alpha',
      'https://meet.google.com/abc-defg-hij',
      fmtDate(today, 14, 0),
      fmtDate(today, 15, 0),
      0,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      'urgent',
      'confirmed',
      'cat-appointment',
      nowIso,
      nowIso
    )

    // Add reminders
    const insertRem = db.prepare('INSERT INTO reminders (id, event_id, offset_minutes, channel) VALUES (?, ?, ?, ?)')
    insertRem.run('rem-1', 'evt-1', 15, 'both')
    insertRem.run('rem-2', 'evt-2', 10, 'both')

    // Add event resources
    const insertEvtRes = db.prepare('INSERT INTO event_resources (event_id, resource_id) VALUES (?, ?)')
    insertEvtRes.run('evt-1', 'res-room-a')
    insertEvtRes.run('evt-1', 'res-person-1')
    insertEvtRes.run('evt-2', 'res-room-b')
  }

  // Ensure default settings exist
  const existingSettings = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number }
  if (Number(existingSettings.count) === 0) {
    const defaultSettings: ChronoDeskSettings = {
      theme: 'dark',
      start_day_of_week: 1, // Monday
      time_format: '24h',
      default_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      default_reminder_offset: 15,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      company_name: 'ChronoDesk Enterprise',
      company_footer: 'Confidential & Proprietary'
    }

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    for (const [key, value] of Object.entries(defaultSettings)) {
      insertSetting.run(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
  }
}

// ----------------- CRUD Repositories -----------------

export const calendarDb = {
  list(): Calendar[] {
    const rows = getDb().prepare('SELECT * FROM calendars ORDER BY name ASC').all()
    return rows.map((r: any) => ({
      ...r,
      visible: Boolean(r.visible),
      is_default: Boolean(r.is_default)
    }))
  },
  toggleVisibility(id: string, visible: boolean): void {
    getDb().prepare('UPDATE calendars SET visible = ? WHERE id = ?').run(visible ? 1 : 0, id)
  }
}

export const categoryDb = {
  list(): Category[] {
    return getDb().prepare('SELECT * FROM categories ORDER BY name ASC').all() as unknown as Category[]
  }
}

export const resourceDb = {
  list(): Resource[] {
    return getDb().prepare('SELECT * FROM resources ORDER BY name ASC').all() as unknown as Resource[]
  },
  create(res: Resource): void {
    getDb().prepare('INSERT INTO resources (id, name, type, capacity, availability_json) VALUES (?, ?, ?, ?, ?)')
      .run(res.id, res.name, res.type, res.capacity, res.availability_json || null)
  },
  update(res: Resource): void {
    getDb().prepare('UPDATE resources SET name = ?, type = ?, capacity = ?, availability_json = ? WHERE id = ?')
      .run(res.name, res.type, res.capacity, res.availability_json || null, res.id)
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM resources WHERE id = ?').run(id)
  }
}

export const eventDb = {
  list(options?: { start?: string; end?: string; calendarIds?: string[]; query?: string }): CalendarEvent[] {
    const db = getDb()
    let sql = `
      SELECT e.*, 
             c.name as cal_name, c.color as cal_color,
             cat.name as cat_name, cat.color as cat_color, cat.icon as cat_icon
      FROM events e
      LEFT JOIN calendars c ON e.calendar_id = c.id
      LEFT JOIN categories cat ON e.category_id = cat.id
      WHERE 1=1
    `
    const params: any[] = []

    if (options?.start) {
      sql += ' AND e.end >= ?'
      params.push(options.start)
    }
    if (options?.end) {
      sql += ' AND e.start <= ?'
      params.push(options.end)
    }
    if (options?.calendarIds && options.calendarIds.length > 0) {
      const placeholders = options.calendarIds.map(() => '?').join(',')
      sql += ` AND e.calendar_id IN (${placeholders})`
      params.push(...options.calendarIds)
    }
    if (options?.query && options.query.trim()) {
      sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)'
      const q = `%${options.query.trim()}%`
      params.push(q, q, q)
    }

    sql += ' ORDER BY e.start ASC'
    const rows = db.prepare(sql).all(...params) as any[]

    // Attach attendees, resources, and reminders
    return rows.map((r) => {
      const resRows = db.prepare(`
        SELECT r.* FROM resources r
        JOIN event_resources er ON er.resource_id = r.id
        WHERE er.event_id = ?
      `).all(r.id) as unknown as Resource[]

      const reminders = db.prepare('SELECT * FROM reminders WHERE event_id = ?').all(r.id) as unknown as Reminder[]
      const attendees = db.prepare('SELECT * FROM attendees WHERE event_id = ?').all(r.id) as any[]

      return {
        id: r.id,
        calendar_id: r.calendar_id,
        title: r.title,
        description: r.description || undefined,
        location: r.location || undefined,
        meeting_url: r.meeting_url || undefined,
        start: r.start,
        end: r.end,
        all_day: Boolean(r.all_day),
        timezone: r.timezone,
        rrule: r.rrule || undefined,
        category_id: r.category_id || undefined,
        priority: r.priority,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        calendar: r.cal_name ? { id: r.calendar_id, name: r.cal_name, color: r.cal_color, source: 'local', visible: true } : undefined,
        category: r.cat_name ? { id: r.category_id, name: r.cat_name, color: r.cat_color, icon: r.cat_icon } : undefined,
        resources: resRows,
        reminders,
        attendees
      }
    })
  },

  create(event: CalendarEvent, resourceIds?: string[]): CalendarEvent {
    const db = getDb()
    const now = new Date().toISOString()
    const insertStmt = db.prepare(`
      INSERT INTO events (id, calendar_id, title, description, location, meeting_url, start, end, all_day, timezone, rrule, category_id, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertStmt.run(
      event.id,
      event.calendar_id,
      event.title,
      event.description || null,
      event.location || null,
      event.meeting_url || null,
      event.start,
      event.end,
      event.all_day ? 1 : 0,
      event.timezone || 'UTC',
      event.rrule || null,
      event.category_id || null,
      event.priority || 'medium',
      event.status || 'confirmed',
      event.created_at || now,
      now
    )

    if (resourceIds && resourceIds.length > 0) {
      const insRes = db.prepare('INSERT OR IGNORE INTO event_resources (event_id, resource_id) VALUES (?, ?)')
      for (const resId of resourceIds) {
        insRes.run(event.id, resId)
      }
    }

    if (event.reminders && event.reminders.length > 0) {
      const insRem = db.prepare('INSERT INTO reminders (id, event_id, offset_minutes, channel) VALUES (?, ?, ?, ?)')
      for (const rem of event.reminders) {
        insRem.run(rem.id, event.id, rem.offset_minutes, rem.channel || 'native')
      }
    }

    return eventDb.list({ query: event.title }).find((e) => e.id === event.id) || event
  },

  update(event: CalendarEvent, resourceIds?: string[]): CalendarEvent {
    const db = getDb()
    const now = new Date().toISOString()
    db.prepare(`
      UPDATE events
      SET calendar_id = ?, title = ?, description = ?, location = ?, meeting_url = ?, start = ?, end = ?, all_day = ?, timezone = ?, rrule = ?, category_id = ?, priority = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      event.calendar_id,
      event.title,
      event.description || null,
      event.location || null,
      event.meeting_url || null,
      event.start,
      event.end,
      event.all_day ? 1 : 0,
      event.timezone || 'UTC',
      event.rrule || null,
      event.category_id || null,
      event.priority,
      event.status,
      now,
      event.id
    )

    if (resourceIds !== undefined) {
      db.prepare('DELETE FROM event_resources WHERE event_id = ?').run(event.id)
      const insRes = db.prepare('INSERT INTO event_resources (event_id, resource_id) VALUES (?, ?)')
      for (const resId of resourceIds) {
        insRes.run(event.id, resId)
      }
    }

    return eventDb.list({ query: event.title }).find((e) => e.id === event.id) || event
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM events WHERE id = ?').run(id)
  }
}

export const timetableDb = {
  list(): Timetable[] {
    return getDb().prepare('SELECT * FROM timetables ORDER BY created_at DESC').all() as unknown as Timetable[]
  },
  get(id: string): { timetable: Timetable; slots: TimetableSlot[]; subjects: Subject[] } | null {
    const db = getDb()
    const tt = db.prepare('SELECT * FROM timetables WHERE id = ?').get(id) as unknown as Timetable | undefined
    if (!tt) return null

    const slots = db.prepare(`
      SELECT ts.*, s.name as sub_name, s.color as sub_color, s.icon as sub_icon,
             r.name as res_name, r.type as res_type
      FROM timetable_slots ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN resources r ON ts.resource_id = r.id
      WHERE ts.timetable_id = ?
      ORDER BY ts.day ASC, ts.start ASC
    `).all(id) as any[]

    const formattedSlots: TimetableSlot[] = slots.map((s) => ({
      id: s.id,
      timetable_id: s.timetable_id,
      subject_id: s.subject_id,
      resource_id: s.resource_id || undefined,
      day: s.day,
      start: s.start,
      end: s.end,
      room: s.room || undefined,
      week_pattern: s.week_pattern || 'all',
      subject: s.sub_name ? { id: s.subject_id, name: s.sub_name, color: s.sub_color, icon: s.sub_icon } : undefined,
      resource: s.res_name ? { id: s.resource_id, name: s.res_name, type: s.res_type, capacity: 1 } : undefined
    }))

    const subjects = db.prepare('SELECT * FROM subjects ORDER BY name ASC').all() as unknown as Subject[]

    return { timetable: tt, slots: formattedSlots, subjects }
  },
  saveSlot(slot: TimetableSlot): void {
    const db = getDb()
    const existing = db.prepare('SELECT id FROM timetable_slots WHERE id = ?').get(slot.id)
    if (existing) {
      db.prepare(`
        UPDATE timetable_slots 
        SET subject_id = ?, resource_id = ?, day = ?, start = ?, end = ?, room = ?, week_pattern = ?
        WHERE id = ?
      `).run(slot.subject_id, slot.resource_id || null, slot.day, slot.start, slot.end, slot.room || null, slot.week_pattern || 'all', slot.id)
    } else {
      db.prepare(`
        INSERT INTO timetable_slots (id, timetable_id, subject_id, resource_id, day, start, end, room, week_pattern)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(slot.id, slot.timetable_id, slot.subject_id, slot.resource_id || null, slot.day, slot.start, slot.end, slot.room || null, slot.week_pattern || 'all')
    }
  },
  deleteSlot(id: string): void {
    getDb().prepare('DELETE FROM timetable_slots WHERE id = ?').run(id)
  },
  saveVersion(timetableId: string, snapshotJson: string): string {
    const id = `ver-${Date.now()}`
    getDb().prepare('INSERT INTO timetable_versions (id, timetable_id, snapshot_json, created_at) VALUES (?, ?, ?, ?)')
      .run(id, timetableId, snapshotJson, new Date().toISOString())
    return id
  },
  getVersions(timetableId: string): any[] {
    return getDb().prepare('SELECT * FROM timetable_versions WHERE timetable_id = ? ORDER BY created_at DESC').all(timetableId)
  }
}

export const reminderDb = {
  getDueReminders(): Array<{ reminder: Reminder; event: CalendarEvent }> {
    const db = getDb()
    const now = new Date()
    // Find reminders where (event.start - offset_minutes) <= now AND fired_at IS NULL AND (snoozed_until IS NULL OR snoozed_until <= now)
    const sql = `
      SELECT r.*, e.title as evt_title, e.start as evt_start, e.end as evt_end, e.location as evt_location, e.meeting_url as evt_meeting_url, e.calendar_id as evt_cal_id
      FROM reminders r
      JOIN events e ON r.event_id = e.id
      WHERE r.fired_at IS NULL
    `
    const rows = db.prepare(sql).all() as any[]
    const due: Array<{ reminder: Reminder; event: CalendarEvent }> = []

    for (const r of rows) {
      const eventStart = new Date(r.evt_start).getTime()
      const triggerTime = eventStart - (r.offset_minutes * 60 * 1000)
      const nowTime = now.getTime()

      let isSnoozeActive = false
      if (r.snoozed_until) {
        const snoozeTime = new Date(r.snoozed_until).getTime()
        if (snoozeTime > nowTime) {
          isSnoozeActive = true
        }
      }

      if (!isSnoozeActive && nowTime >= triggerTime) {
        due.push({
          reminder: {
            id: r.id,
            event_id: r.event_id,
            offset_minutes: r.offset_minutes,
            channel: r.channel,
            fired_at: r.fired_at,
            snoozed_until: r.snoozed_until
          },
          event: {
            id: r.event_id,
            calendar_id: r.evt_cal_id,
            title: r.evt_title,
            start: r.evt_start,
            end: r.evt_end,
            location: r.evt_location,
            meeting_url: r.evt_meeting_url,
            all_day: false,
            timezone: 'UTC',
            priority: 'medium',
            status: 'confirmed',
            created_at: '',
            updated_at: ''
          }
        })
      }
    }
    return due
  },
  markFired(id: string): void {
    getDb().prepare('UPDATE reminders SET fired_at = ? WHERE id = ?').run(new Date().toISOString(), id)
  },
  snooze(id: string, minutes: number): void {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    getDb().prepare('UPDATE reminders SET snoozed_until = ?, fired_at = NULL WHERE id = ?').run(snoozeUntil, id)
  },
  dismiss(id: string): void {
    getDb().prepare('UPDATE reminders SET fired_at = ? WHERE id = ?').run(new Date().toISOString(), id)
  }
}

export const settingsDb = {
  get(): ChronoDeskSettings {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as any[]
    const result: any = {}
    for (const r of rows) {
      if (r.value === 'true') result[r.key] = true
      else if (r.value === 'false') result[r.key] = false
      else if (!isNaN(Number(r.value)) && r.key.includes('offset') || r.key.includes('day')) result[r.key] = Number(r.value)
      else result[r.key] = r.value
    }
    return result as ChronoDeskSettings
  },
  set(key: string, value: any): void {
    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value)
    getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, strVal)
  }
}

export const notificationLogDb = {
  list(limit = 50): NotificationLog[] {
    return getDb().prepare('SELECT * FROM notifications_log ORDER BY shown_at DESC LIMIT ?').all(limit) as unknown as NotificationLog[]
  },
  add(log: NotificationLog): void {
    getDb().prepare('INSERT INTO notifications_log (id, event_id, title, body, shown_at, action_taken) VALUES (?, ?, ?, ?, ?, ?)')
      .run(log.id, log.event_id || null, log.title, log.body || null, log.shown_at, log.action_taken || null)
  },
  clear(): void {
    getDb().prepare('DELETE FROM notifications_log').run()
  }
}
