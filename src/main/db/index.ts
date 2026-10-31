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
  ChronoDeskSettings,
  Conference
} from '../../types'
import type { ICSMirrorConfig, MirrorEvent, BundleMetadata } from '../../types/sync'

let db: DatabaseSync

export function getDb(): DatabaseSync {
  if (!db) {
    initDatabase()
  }
  return db
}

export function initDatabase(): void {
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

    CREATE TABLE IF NOT EXISTS conferences (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT,
      tracks_json TEXT NOT NULL DEFAULT '[]',
      sessions_json TEXT NOT NULL DEFAULT '[]',
      runsheet_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'manual',
      base_palette_json TEXT NOT NULL,
      circadian_offset_minutes INTEGER DEFAULT 0,
      seasonal_enabled INTEGER NOT NULL DEFAULT 0,
      custom_phase_palettes_json TEXT,
      custom_seasonal_palettes_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crdt_documents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 0,
      last_modified TEXT NOT NULL,
      modified_by TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('create', 'update', 'delete')),
      table_name TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS cache_entries (
      key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      hits INTEGER NOT NULL DEFAULT 0,
      last_accessed INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ics_mirrors (
      id TEXT PRIMARY KEY,
      calendar_id TEXT NOT NULL,
      url TEXT NOT NULL,
      name TEXT,
      etag TEXT,
      last_modified TEXT,
      schedule_cron TEXT DEFAULT '0 */6 * * *',
      enabled INTEGER NOT NULL DEFAULT 1,
      last_synced_at TEXT,
      last_sync_status TEXT,
      last_sync_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mirror_events (
      id TEXT PRIMARY KEY,
      mirror_id TEXT NOT NULL,
      ics_uid TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted')),
      event_data_json TEXT,
      synced_at TEXT NOT NULL,
      FOREIGN KEY(mirror_id) REFERENCES ics_mirrors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bundle_metadata (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL DEFAULT 'v1',
      name TEXT,
      description TEXT,
      file_path TEXT,
      file_size INTEGER,
      checksum_sha256 TEXT,
      encryption_params_json TEXT,
      tables_included_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      created_by TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_crdt_type ON crdt_documents(type);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
    CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);
    CREATE INDEX IF NOT EXISTS idx_ics_mirrors_calendar ON ics_mirrors(calendar_id);
    CREATE INDEX IF NOT EXISTS idx_ics_mirrors_enabled ON ics_mirrors(enabled);
    CREATE INDEX IF NOT EXISTS idx_mirror_events_mirror ON mirror_events(mirror_id);
    CREATE INDEX IF NOT EXISTS idx_mirror_events_ics_uid ON mirror_events(ics_uid);
    CREATE INDEX IF NOT EXISTS idx_bundle_metadata_created ON bundle_metadata(created_at);

    CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
    CREATE INDEX IF NOT EXISTS idx_events_end ON events(end);
    CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(calendar_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_slots_day ON timetable_slots(timetable_id, day);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_title TEXT NOT NULL,
      action TEXT NOT NULL,
      previous_payload TEXT,
      new_payload TEXT,
      user_actor TEXT NOT NULL DEFAULT 'Enterprise Admin',
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `)
}

function seedInitialData(): void {
  // Only create a starter calendar if none exists (completely user editable/removable)
  const existingCal = db.prepare('SELECT count(*) as count FROM calendars').get() as { count: number }
  if (Number(existingCal.count) === 0) {
    console.log('[Database] Creating clean user workspace...')
    
    // User's default initial calendar with monochrome theme
    const insertCal = db.prepare('INSERT INTO calendars (id, name, color, source, visible, is_default) VALUES (?, ?, ?, ?, ?, ?)')
    insertCal.run('cal-primary', 'Main Calendar', '#0A0A0A', 'local', 1, 1)

    // Base categories styled with grayscale scale
    const insertCat = db.prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)')
    insertCat.run('cat-meeting', 'Meeting', '#0A0A0A', 'Users')
    insertCat.run('cat-appointment', 'Appointment', '#404040', 'UserCheck')
    insertCat.run('cat-training', 'Training / Session', '#737373', 'GraduationCap')
    insertCat.run('cat-event', 'Special Event', '#A3A3A3', 'Presentation')
    insertCat.run('cat-deadline', 'Milestone & Deadline', '#0A0A0A', 'Flag')
  }

  // Ensure default settings exist with user's theme palette defaults
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
      company_name: 'Stoa Workspace',
      company_footer: 'Personal & Confidential'
    }

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    for (const [key, value] of Object.entries(defaultSettings)) {
      insertSetting.run(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }

    // Theme settings
    insertSetting.run('activeThemeId', 'preset-0')
    insertSetting.run('themeMode', 'manual')
    insertSetting.run('highContrast', 'false')
    insertSetting.run('circadianSettings', JSON.stringify({
      latitude: 0,
      longitude: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      dawnOffsetMinutes: -30,
      duskOffsetMinutes: 30,
    }))
  }
}

// ----------------- CRUD Repositories -----------------

export const calendarDb = {
  list(): Calendar[] {
    const rows = getDb().prepare('SELECT * FROM calendars ORDER BY is_default DESC, name ASC').all()
    return rows.map((r: any) => ({
      ...r,
      visible: Boolean(r.visible),
      is_default: Boolean(r.is_default)
    }))
  },
  create(cal: Calendar): Calendar[] {
    getDb().prepare('INSERT INTO calendars (id, name, color, source, visible, is_default) VALUES (?, ?, ?, ?, ?, ?)')
      .run(cal.id, cal.name, cal.color, cal.source || 'local', cal.visible ? 1 : 0, cal.is_default ? 1 : 0)
    return calendarDb.list()
  },
  update(cal: Calendar): Calendar[] {
    getDb().prepare('UPDATE calendars SET name = ?, color = ? WHERE id = ?')
      .run(cal.name, cal.color, cal.id)
    return calendarDb.list()
  },
  delete(id: string): Calendar[] {
    getDb().prepare('DELETE FROM calendars WHERE id = ?').run(id)
    return calendarDb.list()
  },
  toggleVisibility(id: string, visible: boolean): void {
    getDb().prepare('UPDATE calendars SET visible = ? WHERE id = ?').run(visible ? 1 : 0, id)
  }
}

export const categoryDb = {
  list(): Category[] {
    return getDb().prepare('SELECT * FROM categories ORDER BY name ASC').all() as unknown as Category[]
  },
  create(cat: Category): Category[] {
    getDb().prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)')
      .run(cat.id, cat.name, cat.color, cat.icon || null)
    return categoryDb.list()
  },
  delete(id: string): Category[] {
    getDb().prepare('DELETE FROM categories WHERE id = ?').run(id)
    return categoryDb.list()
  }
}

export const resourceDb = {
  list(): Resource[] {
    return getDb().prepare('SELECT * FROM resources ORDER BY name ASC').all() as unknown as Resource[]
  },
  create(res: Resource): Resource[] {
    getDb().prepare('INSERT INTO resources (id, name, type, capacity, availability_json) VALUES (?, ?, ?, ?, ?)')
      .run(res.id, res.name, res.type, res.capacity, res.availability_json || null)
    return resourceDb.list()
  },
  update(res: Resource): Resource[] {
    getDb().prepare('UPDATE resources SET name = ?, type = ?, capacity = ?, availability_json = ? WHERE id = ?')
      .run(res.name, res.type, res.capacity, res.availability_json || null, res.id)
    return resourceDb.list()
  },
  delete(id: string): Resource[] {
    getDb().prepare('DELETE FROM resources WHERE id = ?').run(id)
    return resourceDb.list()
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

  get(id: string): CalendarEvent | undefined {
    return eventDb.list().find((e) => e.id === id)
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM events WHERE id = ?').run(id)
  }
}

export const subjectDb = {
  list(): Subject[] {
    return getDb().prepare('SELECT * FROM subjects ORDER BY name ASC').all() as unknown as Subject[]
  },
  create(sub: Subject): Subject[] {
    getDb().prepare('INSERT INTO subjects (id, name, color, icon, weekly_hours) VALUES (?, ?, ?, ?, ?)')
      .run(sub.id, sub.name, sub.color, sub.icon || null, sub.weekly_hours || 0)
    return subjectDb.list()
  },
  delete(id: string): Subject[] {
    getDb().prepare('DELETE FROM subjects WHERE id = ?').run(id)
    return subjectDb.list()
  }
}

export const timetableDb = {
  list(): Timetable[] {
    return getDb().prepare('SELECT * FROM timetables ORDER BY created_at DESC').all() as unknown as Timetable[]
  },
  create(tt: Timetable): Timetable[] {
    const now = new Date().toISOString()
    getDb().prepare('INSERT INTO timetables (id, name, start_date, end_date, status, settings_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(tt.id, tt.name, tt.start_date, tt.end_date, tt.status || 'draft', tt.settings_json || null, now, now)
    return timetableDb.list()
  },
  update(tt: Timetable): Timetable[] {
    const now = new Date().toISOString()
    getDb().prepare('UPDATE timetables SET name = ?, start_date = ?, end_date = ?, status = ?, settings_json = ?, updated_at = ? WHERE id = ?')
      .run(tt.name, tt.start_date, tt.end_date, tt.status, tt.settings_json || null, now, tt.id)
    return timetableDb.list()
  },
  delete(id: string): Timetable[] {
    getDb().prepare('DELETE FROM timetables WHERE id = ?').run(id)
    return timetableDb.list()
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

    const subjects = subjectDb.list()

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
      else if (!isNaN(Number(r.value)) && (r.key.includes('offset') || r.key.includes('day'))) result[r.key] = Number(r.value)
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

export const conferenceDb = {
  list(): Conference[] {
    const rows = getDb().prepare('SELECT * FROM conferences ORDER BY date ASC').all() as any[]
    return rows.map((r) => ({
      ...r,
      tracks: JSON.parse(r.tracks_json || '[]'),
      sessions: JSON.parse(r.sessions_json || '[]'),
      runsheet: JSON.parse(r.runsheet_json || '[]')
    }))
  },
  get(id: string): Conference | null {
    const r = getDb().prepare('SELECT * FROM conferences WHERE id = ?').get(id) as any
    if (!r) return null
    return {
      ...r,
      tracks: JSON.parse(r.tracks_json || '[]'),
      sessions: JSON.parse(r.sessions_json || '[]'),
      runsheet: JSON.parse(r.runsheet_json || '[]')
    }
  },
  create(conf: Conference): void {
    getDb().prepare(`
      INSERT INTO conferences (id, title, date, venue, tracks_json, sessions_json, runsheet_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      conf.id,
      conf.title,
      conf.date,
      conf.venue || null,
      conf.tracks_json,
      conf.sessions_json,
      conf.runsheet_json,
      conf.created_at,
      conf.updated_at
    )
  },
  update(conf: Conference): void {
    getDb().prepare(`
      UPDATE conferences SET
        title = ?, date = ?, venue = ?, tracks_json = ?, sessions_json = ?, runsheet_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      conf.title,
      conf.date,
      conf.venue || null,
      conf.tracks_json,
      conf.sessions_json,
      conf.runsheet_json,
      new Date().toISOString(),
      conf.id
    )
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM conferences WHERE id = ?').run(id)
  }
}

export const themeDb = {
  list(): any[] {
    const rows = getDb().prepare('SELECT * FROM themes ORDER BY created_at DESC').all() as any[]
    return rows.map((r) => ({
      ...r,
      basePalette: JSON.parse(r.base_palette_json),
      customPhasePalettes: r.custom_phase_palettes_json ? JSON.parse(r.custom_phase_palettes_json) : undefined,
      customSeasonalPalettes: r.custom_seasonal_palettes_json ? JSON.parse(r.custom_seasonal_palettes_json) : undefined,
      seasonalEnabled: Boolean(r.seasonal_enabled),
    }))
  },
  get(id: string): any | null {
    const r = getDb().prepare('SELECT * FROM themes WHERE id = ?').get(id) as any
    if (!r) return null
    return {
      ...r,
      basePalette: JSON.parse(r.base_palette_json),
      customPhasePalettes: r.custom_phase_palettes_json ? JSON.parse(r.custom_phase_palettes_json) : undefined,
      customSeasonalPalettes: r.custom_seasonal_palettes_json ? JSON.parse(r.custom_seasonal_palettes_json) : undefined,
      seasonalEnabled: Boolean(r.seasonal_enabled),
    }
  },
  create(theme: any): any[] {
    const now = new Date().toISOString()
    getDb().prepare(`
      INSERT INTO themes (id, name, mode, base_palette_json, circadian_offset_minutes, seasonal_enabled, custom_phase_palettes_json, custom_seasonal_palettes_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      theme.id,
      theme.name,
      theme.mode,
      JSON.stringify(theme.basePalette),
      theme.circadianOffsetMinutes || 0,
      theme.seasonalEnabled ? 1 : 0,
      theme.customPhasePalettes ? JSON.stringify(theme.customPhasePalettes) : null,
      theme.customSeasonalPalettes ? JSON.stringify(theme.customSeasonalPalettes) : null,
      now,
      now
    )
    return themeDb.list()
  },
  update(theme: any): any[] {
    const now = new Date().toISOString()
    getDb().prepare(`
      UPDATE themes SET
        name = ?, mode = ?, base_palette_json = ?, circadian_offset_minutes = ?, seasonal_enabled = ?,
        custom_phase_palettes_json = ?, custom_seasonal_palettes_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      theme.name,
      theme.mode,
      JSON.stringify(theme.basePalette),
      theme.circadianOffsetMinutes || 0,
      theme.seasonalEnabled ? 1 : 0,
      theme.customPhasePalettes ? JSON.stringify(theme.customPhasePalettes) : null,
      theme.customSeasonalPalettes ? JSON.stringify(theme.customSeasonalPalettes) : null,
      now,
      theme.id
    )
    return themeDb.list()
  },
  delete(id: string): any[] {
    getDb().prepare('DELETE FROM themes WHERE id = ?').run(id)
    return themeDb.list()
  }
}

// CRDT Document Repository
export const crdtDocDb = {
  list(type?: string): any[] {
    let sql = 'SELECT * FROM crdt_documents'
    const params: any[] = []
    if (type) {
      sql += ' WHERE type = ?'
      params.push(type)
    }
    sql += ' ORDER BY last_modified DESC'
    return getDb().prepare(sql).all(...params) as any[]
  },
  get(id: string): any | null {
    const r = getDb().prepare('SELECT * FROM crdt_documents WHERE id = ?').get(id) as any
    if (!r) return null
    return {
      ...r,
      data: JSON.parse(r.data_json),
    }
  },
  upsert(doc: { id: string; type: string; data: any; version: number; lastModified: string; modifiedBy: string; synced?: boolean }): void {
    getDb().prepare(`
      INSERT INTO crdt_documents (id, type, data_json, version, last_modified, modified_by, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data_json = excluded.data_json,
        version = excluded.version,
        last_modified = excluded.last_modified,
        modified_by = excluded.modified_by,
        synced = excluded.synced
    `).run(doc.id, doc.type, JSON.stringify(doc.data), doc.version, doc.lastModified, doc.modifiedBy, doc.synced ? 1 : 0)
  },
  markSynced(id: string): void {
    getDb().prepare('UPDATE crdt_documents SET synced = 1 WHERE id = ?').run(id)
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM crdt_documents WHERE id = ?').run(id)
  },
  deleteByType(type: string): void {
    getDb().prepare('DELETE FROM crdt_documents WHERE type = ?').run(type)
  }
}

// Sync Queue Repository
export const syncQueueDb = {
  list(onlyPending = false): any[] {
    let sql = 'SELECT * FROM sync_queue ORDER BY timestamp ASC'
    if (onlyPending) {
      sql = 'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY timestamp ASC'
    }
    return getDb().prepare(sql).all() as any[]
  },
  add(item: { id: string; type: 'create' | 'update' | 'delete'; tableName: string; entityId: string; payload: any }): void {
    getDb().prepare(`
      INSERT INTO sync_queue (id, type, table_name, entity_id, payload_json, timestamp, retry_count, synced)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    `).run(item.id, item.type, item.tableName, item.entityId, JSON.stringify(item.payload), new Date().toISOString())
  },
  markSynced(id: string): void {
    getDb().prepare('UPDATE sync_queue SET synced = 1 WHERE id = ?').run(id)
  },
  incrementRetry(id: string, error?: string): void {
    if (error) {
      getDb().prepare('UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?').run(error, id)
    } else {
      getDb().prepare('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?').run(id)
    }
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM sync_queue WHERE id = ?').run(id)
  },
  clearSynced(): number {
    const result = getDb().prepare('DELETE FROM sync_queue WHERE synced = 1').run()
    return Number(result.changes)
  },
  getPendingCount(): number {
    const row = getDb().prepare('SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0').get() as { count: number }
    return row.count
  }
}

// Cache Repository
export const cacheDb = {
  get(key: string): any | null {
    const row = getDb().prepare('SELECT * FROM cache_entries WHERE key = ? AND expires_at > ?').get(key, Date.now()) as any
    if (!row) return null
    // Update access stats
    getDb().prepare('UPDATE cache_entries SET hits = hits + 1, last_accessed = ? WHERE key = ?').run(Date.now(), key)
    return JSON.parse(row.data_json)
  },
  set(key: string, data: any, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs
    getDb().prepare(`
      INSERT INTO cache_entries (key, data_json, expires_at, hits, last_accessed)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(key) DO UPDATE SET
        data_json = excluded.data_json,
        expires_at = excluded.expires_at,
        last_accessed = excluded.last_accessed
    `).run(key, JSON.stringify(data), expiresAt, Date.now())
  },
  delete(key: string): void {
    getDb().prepare('DELETE FROM cache_entries WHERE key = ?').run(key)
  },
  clearExpired(): number {
    const result = getDb().prepare('DELETE FROM cache_entries WHERE expires_at <= ?').run(Date.now())
    return Number(result.changes)
  },
  clearAll(): void {
    getDb().prepare('DELETE FROM cache_entries').run()
  },
  getStats(): { count: number; oldestEntry: number | null; newestEntry: number | null } {
    const row = getDb().prepare(`
      SELECT COUNT(*) as count, MIN(last_accessed) as oldest, MAX(last_accessed) as newest
      FROM cache_entries
    `).get() as any
    return {
      count: row.count,
      oldestEntry: row.oldest,
      newestEntry: row.newest
    }
  }
}

// Sync Metadata Repository
export const syncMetadataDb = {
  get(key: string): string | null {
    const row = getDb().prepare('SELECT value FROM sync_metadata WHERE key = ?').get(key) as any
    return row?.value ?? null
  },
  set(key: string, value: string): void {
    getDb().prepare('INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)').run(key, value)
  },
  getAll(): Record<string, string> {
    const rows = getDb().prepare('SELECT key, value FROM sync_metadata').all() as any[]
    const result: Record<string, string> = {}
    for (const r of rows) {
      result[r.key] = r.value
    }
    return result
  }
}

// Initialize default sync metadata
export function initSyncMetadata(deviceId: string): void {
  const existing = syncMetadataDb.get('deviceId')
  if (!existing) {
    syncMetadataDb.set('deviceId', deviceId)
  }
  syncMetadataDb.set('lastSyncCheck', new Date().toISOString())
}

// ICS Mirror Repository
export const icsMirrorDb = {
  list(enabledOnly = false): ICSMirrorConfig[] {
    let sql = 'SELECT * FROM ics_mirrors ORDER BY created_at DESC'
    if (enabledOnly) {
      sql = 'SELECT * FROM ics_mirrors WHERE enabled = 1 ORDER BY created_at DESC'
    }
    const rows = getDb().prepare(sql).all() as any[]
    return rows.map((r) => ({
      ...r,
      enabled: Boolean(r.enabled)
    }))
  },
  get(id: string): ICSMirrorConfig | null {
    const r = getDb().prepare('SELECT * FROM ics_mirrors WHERE id = ?').get(id) as any
    if (!r) return null
    return { ...r, enabled: Boolean(r.enabled) }
  },
  getByCalendarId(calendarId: string): ICSMirrorConfig[] {
    const rows = getDb().prepare('SELECT * FROM ics_mirrors WHERE calendar_id = ? ORDER BY created_at DESC').all(calendarId) as any[]
    return rows.map((r) => ({ ...r, enabled: Boolean(r.enabled) }))
  },
  create(mirror: Omit<ICSMirrorConfig, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): ICSMirrorConfig {
    const now = new Date().toISOString()
    const id = mirror.id || `mirror-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    getDb().prepare(`
      INSERT INTO ics_mirrors (id, calendar_id, url, name, etag, last_modified, schedule_cron, enabled, last_synced_at, last_sync_status, last_sync_error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      mirror.calendarId,
      mirror.url,
      mirror.name || null,
      mirror.etag || null,
      mirror.lastModified || null,
      mirror.scheduleCron || '0 */6 * * *',
      mirror.enabled ? 1 : 0,
      mirror.lastSyncedAt || null,
      mirror.lastSyncStatus || null,
      mirror.lastSyncError || null,
      mirror.createdAt || now,
      mirror.updatedAt || now
    )
    return icsMirrorDb.get(id)!
  },
  update(mirror: ICSMirrorConfig): ICSMirrorConfig {
    const now = new Date().toISOString()
    getDb().prepare(`
      UPDATE ics_mirrors SET
        calendar_id = ?, url = ?, name = ?, etag = ?, last_modified = ?, schedule_cron = ?, enabled = ?,
        last_synced_at = ?, last_sync_status = ?, last_sync_error = ?, updated_at = ?
      WHERE id = ?
    `).run(
      mirror.calendarId,
      mirror.url,
      mirror.name || null,
      mirror.etag || null,
      mirror.lastModified || null,
      mirror.scheduleCron || '0 */6 * * *',
      mirror.enabled ? 1 : 0,
      mirror.lastSyncedAt || null,
      mirror.lastSyncStatus || null,
      mirror.lastSyncError || null,
      now,
      mirror.id
    )
    return icsMirrorDb.get(mirror.id)!
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM ics_mirrors WHERE id = ?').run(id)
  },
  setEnabled(id: string, enabled: boolean): void {
    getDb().prepare('UPDATE ics_mirrors SET enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, new Date().toISOString(), id)
  },
  updateSyncResult(id: string, result: { status: string; error?: string; etag?: string; lastModified?: string }): void {
    const now = new Date().toISOString()
    getDb().prepare(`
      UPDATE ics_mirrors SET
        last_synced_at = ?, last_sync_status = ?, last_sync_error = ?, etag = COALESCE(?, etag), last_modified = COALESCE(?, last_modified), updated_at = ?
      WHERE id = ?
    `).run(now, result.status, result.error || null, result.etag || null, result.lastModified || null, now, id)
  }
}

// Mirror Events Repository
export const mirrorEventsDb = {
  list(mirrorId: string, limit = 100): MirrorEvent[] {
    const rows = getDb().prepare('SELECT * FROM mirror_events WHERE mirror_id = ? ORDER BY synced_at DESC LIMIT ?').all(mirrorId, limit) as any[]
    return rows.map((r) => ({
      ...r,
      eventData: r.event_data_json ? JSON.parse(r.event_data_json) : undefined
    }))
  },
  getByMirrorAndUID(mirrorId: string, icsUid: string): MirrorEvent | null {
    const r = getDb().prepare('SELECT * FROM mirror_events WHERE mirror_id = ? AND ics_uid = ? ORDER BY synced_at DESC LIMIT 1').get(mirrorId, icsUid) as any
    if (!r) return null
    return { ...r, eventData: r.event_data_json ? JSON.parse(r.event_data_json) : undefined }
  },
  add(event: Omit<MirrorEvent, 'id'> & { id?: string }): MirrorEvent {
    const id = event.id || `mevt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    getDb().prepare(`
      INSERT INTO mirror_events (id, mirror_id, ics_uid, content_hash, action, event_data_json, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      event.mirrorId,
      event.icsUid,
      event.contentHash,
      event.action,
      event.eventData ? JSON.stringify(event.eventData) : null,
      event.syncedAt
    )
    return mirrorEventsDb.getByMirrorAndUID(event.mirrorId, event.icsUid)!
  },
  delete(mirrorId: string, icsUid?: string): number {
    if (icsUid) {
      const result = getDb().prepare('DELETE FROM mirror_events WHERE mirror_id = ? AND ics_uid = ?').run(mirrorId, icsUid)
      return Number(result.changes)
    }
    const result = getDb().prepare('DELETE FROM mirror_events WHERE mirror_id = ?').run(mirrorId)
    return Number(result.changes)
  },
  getLatestHash(mirrorId: string, icsUid: string): string | null {
    const r = getDb().prepare('SELECT content_hash FROM mirror_events WHERE mirror_id = ? AND ics_uid = ? ORDER BY synced_at DESC LIMIT 1').get(mirrorId, icsUid) as any
    return r?.content_hash ?? null
  }
}

// Bundle Metadata Repository
export const bundleMetadataDb = {
  list(): BundleMetadata[] {
    const rows = getDb().prepare('SELECT * FROM bundle_metadata ORDER BY created_at DESC').all() as any[]
    return rows.map((r) => ({
      ...r,
      encryptionParams: r.encryption_params_json ? JSON.parse(r.encryption_params_json) : undefined,
      tablesIncluded: JSON.parse(r.tables_included_json || '[]')
    }))
  },
  get(id: string): BundleMetadata | null {
    const r = getDb().prepare('SELECT * FROM bundle_metadata WHERE id = ?').get(id) as any
    if (!r) return null
    return {
      ...r,
      encryptionParams: r.encryption_params_json ? JSON.parse(r.encryption_params_json) : undefined,
      tablesIncluded: JSON.parse(r.tables_included_json || '[]')
    }
  },
  create(bundle: Omit<BundleMetadata, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): BundleMetadata {
    const id = bundle.id || `bundle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    getDb().prepare(`
      INSERT INTO bundle_metadata (id, version, name, description, file_path, file_size, checksum_sha256, encryption_params_json, tables_included_json, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      bundle.version || 'v1',
      bundle.name || null,
      bundle.description || null,
      bundle.filePath || null,
      bundle.fileSize || null,
      bundle.checksumSha256 || null,
      bundle.encryptionParams ? JSON.stringify(bundle.encryptionParams) : null,
      JSON.stringify(bundle.tablesIncluded || []),
      bundle.createdAt || now,
      bundle.createdBy || null
    )
    return bundleMetadataDb.get(id)!
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM bundle_metadata WHERE id = ?').run(id)
  }
}

export interface AuditLogEntry {
  id: string
  entity_type: 'event' | 'resource' | 'timetable' | 'calendar'
  entity_id: string
  entity_title: string
  action: 'create' | 'update' | 'delete' | 'reschedule' | 'rollback'
  previous_payload?: string
  new_payload?: string
  user_actor: string
  timestamp: string
}

export const auditLogDb = {
  add(entry: AuditLogEntry): void {
    try {
      getDb()
        .prepare(
          `INSERT INTO audit_logs (id, entity_type, entity_id, entity_title, action, previous_payload, new_payload, user_actor, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          entry.id,
          entry.entity_type,
          entry.entity_id,
          entry.entity_title,
          entry.action,
          entry.previous_payload || null,
          entry.new_payload || null,
          entry.user_actor || 'Enterprise Admin',
          entry.timestamp
        )
    } catch (e) {
      console.error('[AuditLog] Error recording audit log:', e)
    }
  },
  list(limit: number = 200): AuditLogEntry[] {
    try {
      return getDb()
        .prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`)
        .all(limit) as unknown as AuditLogEntry[]
    } catch {
      return []
    }
  },
  get(id: string): AuditLogEntry | undefined {
    try {
      return getDb().prepare(`SELECT * FROM audit_logs WHERE id = ?`).get(id) as unknown as AuditLogEntry | undefined
    } catch {
      return undefined
    }
  },
  clear(): void {
    try {
      getDb().prepare(`DELETE FROM audit_logs`).run()
    } catch {}
  }
}
