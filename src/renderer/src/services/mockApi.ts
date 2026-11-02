/**
 * Browser Fallback / Web Mock API
 * Provides a resilient, localStorage-persisted implementation of window.api
 * when running in browser mode, Vite preview, or when Electron preload is detached.
 */

import type {
  Calendar,
  Category,
  CalendarEvent,
  Resource,
  Timetable,
  TimetableSlot,
  Subject,
  ChronoDeskSettings,
  NotificationLog,
  Conference
} from '../../../types'

const DEFAULT_SETTINGS: ChronoDeskSettings = {
  theme: 'dark',
  start_day_of_week: 1,
  time_format: '24h',
  default_timezone: 'UTC',
  default_reminder_offset: 15,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  company_name: 'Stoa Workspace'
}

const DEFAULT_CALENDARS: Calendar[] = [
  { id: 'cal-default', name: 'Work & Projects', color: '#38bdf8', source: 'local', visible: true, is_default: true },
  { id: 'cal-personal', name: 'Personal & Health', color: '#34d399', source: 'local', visible: true }
]

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-deep', name: 'Deep Work', color: '#6366f1' },
  { id: 'cat-meeting', name: 'Meetings', color: '#f59e0b' },
  { id: 'cat-admin', name: 'Admin', color: '#64748b' }
]

const DEFAULT_RESOURCES: Resource[] = [
  { id: 'res-1', name: 'Lead Architect', type: 'person', capacity: 1 },
  { id: 'res-2', name: 'Project Lead', type: 'person', capacity: 1 },
  { id: 'res-3', name: 'Studio A', type: 'room', capacity: 10 }
]

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-arch', name: 'System Architecture', color: '#6366f1', weekly_hours: 8 },
  { id: 'sub-dev', name: 'Core Development', color: '#3b82f6', weekly_hours: 12 }
]

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`stoa_web_${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`stoa_web_${key}`, JSON.stringify(value))
  } catch {}
}

export function initWebMockApi(): void {
  if (typeof window === 'undefined' || (window as any).api) {
    return
  }

  console.info('[Stoa Web API] Initializing resilient browser mock layer for window.api')

  const notificationListeners: Array<(data: any) => void> = []

  const mockApi = {
    window: {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      isMaximized: async () => false,
      openSecondary: async (_viewType: string) => {}
    },
    data: {
      getInitial: async () => {
        return {
          calendars: getStored('calendars', DEFAULT_CALENDARS),
          categories: getStored('categories', DEFAULT_CATEGORIES),
          resources: getStored('resources', DEFAULT_RESOURCES),
          settings: getStored('settings', DEFAULT_SETTINGS),
          timetables: getStored<Timetable[]>('timetables', []),
          subjects: getStored('subjects', DEFAULT_SUBJECTS)
        }
      },
      exportAll: async () => ({}),
      importAll: async (_payload: any) => ({ success: true, importedCounts: {} })
    },
    audit: {
      list: async () => [],
      clear: async () => ({ success: true }),
      rollback: async () => ({ success: true })
    },
    calendars: {
      list: async () => getStored('calendars', DEFAULT_CALENDARS),
      create: async (cal: Calendar) => {
        const list = getStored('calendars', DEFAULT_CALENDARS)
        const updated = [...list, { ...cal, id: cal.id || `cal-${Date.now()}` }]
        setStored('calendars', updated)
        return updated
      },
      update: async (cal: Calendar) => {
        const list = getStored('calendars', DEFAULT_CALENDARS)
        const updated = list.map((c) => (c.id === cal.id ? cal : c))
        setStored('calendars', updated)
        return updated
      },
      delete: async (id: string) => {
        const list = getStored('calendars', DEFAULT_CALENDARS)
        const updated = list.filter((c) => c.id !== id)
        setStored('calendars', updated)
        return updated
      },
      toggle: async (id: string, visible: boolean) => {
        const list = getStored('calendars', DEFAULT_CALENDARS)
        const updated = list.map((c) => (c.id === id ? { ...c, visible } : c))
        setStored('calendars', updated)
        return updated
      }
    },
    events: {
      list: async (options?: { query?: string }) => {
        let events = getStored<CalendarEvent[]>('events', [])
        if (options?.query) {
          const q = options.query.toLowerCase()
          events = events.filter((e) => e.title.toLowerCase().includes(q))
        }
        return events
      },
      create: async (event: CalendarEvent) => {
        const list = getStored<CalendarEvent[]>('events', [])
        const created: CalendarEvent = {
          ...event,
          id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setStored('events', [...list, created])
        return created
      },
      update: async (event: CalendarEvent) => {
        const list = getStored<CalendarEvent[]>('events', [])
        const updated = list.map((e) => (e.id === event.id ? { ...event, updated_at: new Date().toISOString() } : e))
        setStored('events', updated)
        return event
      },
      delete: async (id: string) => {
        const list = getStored<CalendarEvent[]>('events', [])
        setStored('events', list.filter((e) => e.id !== id))
        return { success: true }
      },
      checkConflicts: async () => ({ hasConflicts: false, conflicts: [] } as any),
      findFreeSlots: async () => [],
      importIcs: async () => ({ calendar: DEFAULT_CALENDARS[0], importedCount: 0 })
    },
    timetables: {
      list: async () => getStored<Timetable[]>('timetables', []),
      get: async (id: string) => {
        const timetables = getStored<Timetable[]>('timetables', [])
        const tt = timetables.find((t) => t.id === id) || null
        const slots = getStored<TimetableSlot[]>('timetable_slots', []).filter((s) => s.timetable_id === id)
        const subjects = getStored('subjects', DEFAULT_SUBJECTS)
        return tt ? { timetable: tt, slots, subjects } : null
      },
      create: async (tt: Timetable) => {
        const list = getStored<Timetable[]>('timetables', [])
        const updated = [...list, tt]
        setStored('timetables', updated)
        return updated
      },
      update: async (tt: Timetable) => {
        const list = getStored<Timetable[]>('timetables', [])
        const updated = list.map((t) => (t.id === tt.id ? tt : t))
        setStored('timetables', updated)
        return updated
      },
      delete: async (id: string) => {
        const list = getStored<Timetable[]>('timetables', [])
        const updated = list.filter((t) => t.id !== id)
        setStored('timetables', updated)
        return updated
      },
      saveSlot: async (slot: TimetableSlot) => {
        const list = getStored<TimetableSlot[]>('timetable_slots', [])
        const exists = list.some((s) => s.id === slot.id)
        const updated = exists ? list.map((s) => (s.id === slot.id ? slot : s)) : [...list, slot]
        setStored('timetable_slots', updated)
        return { success: true }
      },
      deleteSlot: async (id: string) => {
        const list = getStored<TimetableSlot[]>('timetable_slots', [])
        setStored('timetable_slots', list.filter((s) => s.id !== id))
        return { success: true }
      },
      checkConflicts: async () => ({ hasConflicts: false, conflicts: [] } as any),
      saveVersion: async () => `ver-${Date.now()}`,
      getVersions: async () => [],
      autoGenerate: async () => ({ success: true, slots: [] } as any),
      applyGenerated: async () => ({ success: true, count: 0 })
    },
    subjects: {
      list: async () => getStored('subjects', DEFAULT_SUBJECTS),
      create: async (sub: Subject) => {
        const list = getStored('subjects', DEFAULT_SUBJECTS)
        const updated = [...list, sub]
        setStored('subjects', updated)
        return updated
      },
      delete: async (id: string) => {
        const list = getStored('subjects', DEFAULT_SUBJECTS)
        const updated = list.filter((s) => s.id !== id)
        setStored('subjects', updated)
        return updated
      }
    },
    resources: {
      list: async () => getStored('resources', DEFAULT_RESOURCES),
      create: async (res: Resource) => {
        const list = getStored('resources', DEFAULT_RESOURCES)
        const updated = [...list, res]
        setStored('resources', updated)
        return updated
      },
      update: async (res: Resource) => {
        const list = getStored('resources', DEFAULT_RESOURCES)
        const updated = list.map((r) => (r.id === res.id ? res : r))
        setStored('resources', updated)
        return updated
      },
      delete: async (id: string) => {
        const list = getStored('resources', DEFAULT_RESOURCES)
        const updated = list.filter((r) => r.id !== id)
        setStored('resources', updated)
        return updated
      }
    },
    reminders: {
      snooze: async () => ({ success: true }),
      dismiss: async () => ({ success: true })
    },
    notifications: {
      getHistory: async (): Promise<NotificationLog[]> => [],
      clear: async () => ({ success: true }),
      onReceived: (callback: (data: any) => void) => {
        notificationListeners.push(callback)
        return () => {
          const index = notificationListeners.indexOf(callback)
          if (index >= 0) notificationListeners.splice(index, 1)
        }
      }
    },
    settings: {
      get: async () => getStored('settings', DEFAULT_SETTINGS),
      set: async (key: string, value: any) => {
        const cur = getStored('settings', DEFAULT_SETTINGS)
        const updated = { ...cur, [key]: value }
        setStored('settings', updated)
        return updated
      }
    },
    theme: {
      list: async () => [],
      get: async () => null,
      create: async () => [],
      update: async () => [],
      delete: async () => [],
      setActive: async () => ({ success: true }),
      preview: async () => ({ success: true }),
      getVariables: async () => ({}),
      circadian: {
        get: async () => ({ enabled: false, latitude: 0, longitude: 0, dawnOffsetMinutes: 0, duskOffsetMinutes: 0 }),
        set: async (s: any) => s
      },
      scheduler: {
        getStatus: async () => ({ mode: 'manual', hasValidLocation: false, settings: {} as any })
      }
    },
    conferences: {
      list: async (): Promise<Conference[]> => [],
      get: async () => null,
      create: async (conf: Conference) => conf,
      update: async (conf: Conference) => conf,
      delete: async () => ({ success: true })
    },
    sync: {
      getStatus: async () => ({
        status: 'synced' as const,
        isOnline: true,
        peerCount: 0,
        pendingChanges: 0,
        stats: { totalEvents: 0, lastSynced: new Date().toISOString() }
      }),
      manualSync: async () => ({ success: true }),
      getConfig: async () => ({
        autoSyncInterval: 30,
        conflictStrategy: 'local_wins' as const,
        offlineMode: false,
        cacheRetentionDays: 30
      }),
      setConfig: async () => ({ success: true }),
      getQueue: async () => [],
      clearQueue: async () => ({ success: true, cleared: 0 }),
      retryQueue: async () => ({ success: true }),
      getCacheStats: async () => ({ memoryItems: 0, dbItems: 0 }),
      clearCache: async () => ({ success: true }),
      invalidateCache: async () => ({ success: true }),
      recordView: async () => ({ success: true }),
      getDevices: async () => [],
      forceSync: async () => ({ success: true })
    },
    offline: {
      queueAction: async () => ({ id: `act-${Date.now()}` }),
      getStatus: async () => ({ isOnline: true })
    },
    icsMirror: {
      list: async () => [],
      get: async () => null,
      create: async (c: any) => c,
      update: async (c: any) => c,
      delete: async () => ({ success: true }),
      toggle: async () => ({ success: true }),
      sync: async () => ({ success: true, inserted: 0, updated: 0, deleted: 0 } as any),
      syncAll: async () => [],
      getStatus: async () => ({ mirror: null, recentEvents: [], stats: {} }),
      getEvents: async () => []
    },
    scheduler: {
      getStatus: async () => ({ initialized: true, scheduledCount: 0, nextRuns: [] }),
      initialize: async () => ({ success: true })
    },
    workspaceBundle: {
      export: async () => ({ success: true, metadata: {} as any, manifest: {} as any, buffer: new ArrayBuffer(0) }),
      exportAndSave: async () => ({ success: true, metadata: {} as any, manifest: {} as any }),
      import: async () => ({ success: true, metadata: {} as any, manifest: {} as any, executed: 0, errors: [] }),
      validate: async () => ({ valid: true }),
      list: async () => [],
      get: async () => null,
      delete: async () => ({ success: true }),
      getExportsDir: async () => '',
      getDefaultPath: async () => ''
    },
    shortcuts: {
      register: async () => ({ success: true }),
      unregister: async () => ({ success: true }),
      unregisterAll: async () => ({ success: true }),
      getRegistered: async () => [],
      onCommandPalette: () => () => {},
      offCommandPalette: () => {}
    }
  }

  ;(window as any).api = mockApi
}

// Automatically invoke on import if in window context
if (typeof window !== 'undefined') {
  initWebMockApi()
}
