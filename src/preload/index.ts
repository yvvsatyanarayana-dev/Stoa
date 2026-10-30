import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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
  Conference,
  FreeSlotRequest,
  FreeSlotOption,
  SolverOptions,
  SolverResult
} from '../types'
import type { ThemeConfig, CircadianSettings } from '../types/theme'
import type { ConflictReport } from '../main/engine/conflictEngine'
import type { SyncStatus, SyncConfig, OfflineAction, ICSMirrorConfig, MirrorEvent, ICSMirrorSyncResult, BundleExportOptions, BundleImportOptions, BundleMetadata, BundleManifest } from '../types/sync'

export const api = {
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized')
  },
  data: {
    getInitial: (): Promise<{
      calendars: Calendar[]
      categories: Category[]
      resources: Resource[]
      settings: ChronoDeskSettings
      timetables: Timetable[]
      subjects: Subject[]
    }> => ipcRenderer.invoke('data:get-initial')
  },
  calendars: {
    list: (): Promise<Calendar[]> => ipcRenderer.invoke('calendars:list'),
    create: (cal: Calendar): Promise<Calendar[]> => ipcRenderer.invoke('calendars:create', cal),
    update: (cal: Calendar): Promise<Calendar[]> => ipcRenderer.invoke('calendars:update', cal),
    delete: (id: string): Promise<Calendar[]> => ipcRenderer.invoke('calendars:delete', id),
    toggle: (id: string, visible: boolean): Promise<Calendar[]> => ipcRenderer.invoke('calendars:toggle', id, visible)
  },
  events: {
    list: (options?: { start?: string; end?: string; calendarIds?: string[]; query?: string }): Promise<CalendarEvent[]> =>
      ipcRenderer.invoke('events:list', options),
    create: (event: CalendarEvent, resourceIds?: string[]): Promise<CalendarEvent> =>
      ipcRenderer.invoke('events:create', event, resourceIds),
    update: (event: CalendarEvent, resourceIds?: string[]): Promise<CalendarEvent> =>
      ipcRenderer.invoke('events:update', event, resourceIds),
    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('events:delete', id),
    checkConflicts: (event: Partial<CalendarEvent>, resourceIds: string[], excludeEventId?: string): Promise<ConflictReport> =>
      ipcRenderer.invoke('events:check-conflicts', event, resourceIds, excludeEventId),
    findFreeSlots: (req: FreeSlotRequest): Promise<FreeSlotOption[]> =>
      ipcRenderer.invoke('calendar:find-free-slots', req),
    importIcs: (options: { url?: string; content?: string; calendarName?: string; calendarColor?: string }): Promise<{ calendar: Calendar; importedCount: number }> =>
      ipcRenderer.invoke('calendar:import-ics', options)
  },
  timetables: {
    list: (): Promise<Timetable[]> => ipcRenderer.invoke('timetables:list'),
    get: (id: string): Promise<{ timetable: Timetable; slots: TimetableSlot[]; subjects: Subject[] } | null> =>
      ipcRenderer.invoke('timetables:get', id),
    create: (tt: Timetable): Promise<Timetable[]> => ipcRenderer.invoke('timetables:create', tt),
    update: (tt: Timetable): Promise<Timetable[]> => ipcRenderer.invoke('timetables:update', tt),
    delete: (id: string): Promise<Timetable[]> => ipcRenderer.invoke('timetables:delete', id),
    saveSlot: (slot: TimetableSlot): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('timetables:save-slot', slot),
    deleteSlot: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('timetables:delete-slot', id),
    checkConflicts: (slot: Partial<TimetableSlot>, timetableId: string, excludeSlotId?: string): Promise<ConflictReport> =>
      ipcRenderer.invoke('timetables:check-conflicts', slot, timetableId, excludeSlotId),
    saveVersion: (timetableId: string, snapshotJson: string): Promise<string> =>
      ipcRenderer.invoke('timetables:save-version', timetableId, snapshotJson),
    getVersions: (timetableId: string): Promise<any[]> =>
      ipcRenderer.invoke('timetables:get-versions', timetableId),
    autoGenerate: (options: SolverOptions): Promise<SolverResult> =>
      ipcRenderer.invoke('timetables:auto-generate', options),
    applyGenerated: (slots: TimetableSlot[]): Promise<{ success: boolean; count: number }> =>
      ipcRenderer.invoke('timetables:apply-generated', slots)
  },
  subjects: {
    list: (): Promise<Subject[]> => ipcRenderer.invoke('subjects:list'),
    create: (sub: Subject): Promise<Subject[]> => ipcRenderer.invoke('subjects:create', sub),
    delete: (id: string): Promise<Subject[]> => ipcRenderer.invoke('subjects:delete', id)
  },
  resources: {
    list: (): Promise<Resource[]> => ipcRenderer.invoke('resources:list'),
    create: (res: Resource): Promise<Resource[]> => ipcRenderer.invoke('resources:create', res),
    update: (res: Resource): Promise<Resource[]> => ipcRenderer.invoke('resources:update', res),
    delete: (id: string): Promise<Resource[]> => ipcRenderer.invoke('resources:delete', id)
  },
  reminders: {
    snooze: (reminderId: string, minutes: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('reminders:snooze', reminderId, minutes),
    dismiss: (reminderId: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('reminders:dismiss', reminderId)
  },
  notifications: {
    getHistory: (limit?: number): Promise<NotificationLog[]> =>
      ipcRenderer.invoke('notifications:get-history', limit),
    clear: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('notifications:clear'),
    onReceived: (callback: (data: { reminder: any; event: CalendarEvent; timestamp: string }) => void) => {
      const subscription = (_event: any, data: any) => callback(data)
      ipcRenderer.on('notification:received', subscription)
      return () => ipcRenderer.removeListener('notification:received', subscription)
    }
  },
  settings: {
    get: (): Promise<ChronoDeskSettings> => ipcRenderer.invoke('settings:get'),
    set: (key: string, value: any): Promise<ChronoDeskSettings> => ipcRenderer.invoke('settings:set', key, value)
  },
  theme: {
    list: (): Promise<ThemeConfig[]> => ipcRenderer.invoke('theme:list'),
    get: (id: string): Promise<ThemeConfig | null> => ipcRenderer.invoke('theme:get', id),
    create: (theme: ThemeConfig): Promise<ThemeConfig[]> => ipcRenderer.invoke('theme:create', theme),
    update: (theme: ThemeConfig): Promise<ThemeConfig[]> => ipcRenderer.invoke('theme:update', theme),
    delete: (id: string): Promise<ThemeConfig[]> => ipcRenderer.invoke('theme:delete', id),
    setActive: (id: string): Promise<{ success: boolean }> => ipcRenderer.invoke('theme:set-active', id),
    preview: (theme: ThemeConfig): Promise<{ success: boolean }> => ipcRenderer.invoke('theme:preview', theme),
    getVariables: (): Promise<Record<string, string>> => ipcRenderer.invoke('theme:get-variables'),
    circadian: {
      get: (): Promise<CircadianSettings> => ipcRenderer.invoke('theme:circadian:get'),
      set: (settings: CircadianSettings): Promise<CircadianSettings> => ipcRenderer.invoke('theme:circadian:set', settings)
    }
  },
  conferences: {
    list: (): Promise<Conference[]> => ipcRenderer.invoke('conferences:list'),
    get: (id: string): Promise<Conference | null> => ipcRenderer.invoke('conferences:get', id),
    create: (conf: Conference): Promise<Conference> => ipcRenderer.invoke('conferences:create', conf),
    update: (conf: Conference): Promise<Conference> => ipcRenderer.invoke('conferences:update', conf),
    delete: (id: string): Promise<{ success: boolean }> => ipcRenderer.invoke('conferences:delete', id)
  },
  sync: {
    getStatus: (): Promise<{
      stats: any
      status: SyncStatus
      pendingChanges: number
      peerCount: number
      isOnline: boolean
    }> => ipcRenderer.invoke('sync:status'),
    manualSync: (): Promise<any> => ipcRenderer.invoke('sync:manual'),
    getConfig: (): Promise<SyncConfig> => ipcRenderer.invoke('sync:config:get'),
    setConfig: (config: Partial<SyncConfig>): Promise<{ success: boolean }> => ipcRenderer.invoke('sync:config:set', config),
    getQueue: (): Promise<OfflineAction[]> => ipcRenderer.invoke('sync:queue:list'),
    clearQueue: (): Promise<{ success: boolean; cleared: number }> => ipcRenderer.invoke('sync:queue:clear'),
    retryQueue: (): Promise<{ success: boolean }> => ipcRenderer.invoke('sync:queue:retry'),
    getCacheStats: (): Promise<any> => ipcRenderer.invoke('sync:cache:stats'),
    clearCache: (): Promise<{ success: boolean }> => ipcRenderer.invoke('sync:cache:clear'),
    invalidateCache: (pattern: string): Promise<{ success: boolean }> => ipcRenderer.invoke('sync:cache:invalidate', pattern),
    recordView: (viewType: string, params: any): Promise<{ success: boolean }> => ipcRenderer.invoke('sync:record-view', viewType, params),
    getDevices: (): Promise<any[]> => ipcRenderer.invoke('sync:devices'),
    forceSync: (): Promise<{ success: boolean }> => ipcRenderer.invoke('sync:force')
  },
  offline: {
    queueAction: (type: string, table: string, entityId: string, payload: any): Promise<{ id: string }> =>
      ipcRenderer.invoke('offline:queue-action', type, table, entityId, payload),
    getStatus: (): Promise<{ isOnline: boolean }> => ipcRenderer.invoke('offline:status')
  },
  icsMirror: {
    list: (): Promise<ICSMirrorConfig[]> => ipcRenderer.invoke('ics:mirror:list'),
    get: (id: string): Promise<ICSMirrorConfig | null> => ipcRenderer.invoke('ics:mirror:get', id),
    create: (config: Omit<ICSMirrorConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ICSMirrorConfig> =>
      ipcRenderer.invoke('ics:mirror:create', config),
    update: (config: ICSMirrorConfig): Promise<ICSMirrorConfig> =>
      ipcRenderer.invoke('ics:mirror:update', config),
    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('ics:mirror:delete', id),
    toggle: (id: string, enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('ics:mirror:toggle', id, enabled),
    sync: (id: string): Promise<ICSMirrorSyncResult> =>
      ipcRenderer.invoke('ics:mirror:sync', id),
    syncAll: (maxConcurrent?: number): Promise<ICSMirrorSyncResult[]> =>
      ipcRenderer.invoke('ics:mirror:sync-all', maxConcurrent),
    getStatus: (id: string): Promise<{ mirror: ICSMirrorConfig | null; recentEvents: MirrorEvent[]; stats: any }> =>
      ipcRenderer.invoke('ics:mirror:status', id),
    getEvents: (mirrorId: string, limit?: number): Promise<MirrorEvent[]> =>
      ipcRenderer.invoke('ics:mirror:events', mirrorId, limit)
  },
  scheduler: {
    getStatus: (): Promise<{ initialized: boolean; scheduledCount: number; nextRuns: any[] }> =>
      ipcRenderer.invoke('scheduler:status'),
    initialize: (): Promise<{ success: boolean }> => ipcRenderer.invoke('scheduler:initialize')
  },
  workspaceBundle: {
    export: (options: BundleExportOptions): Promise<{ success: boolean; metadata: BundleMetadata; manifest: BundleManifest; buffer: ArrayBuffer }> =>
      ipcRenderer.invoke('bundle:export', options),
    exportAndSave: (options: BundleExportOptions): Promise<{ success: boolean; metadata: BundleMetadata; manifest: BundleManifest }> =>
      ipcRenderer.invoke('bundle:export:save', options),
    import: (filePath: string, options: BundleImportOptions): Promise<{ success: boolean; metadata: BundleMetadata; manifest: BundleManifest; executed: number; errors: string[] }> =>
      ipcRenderer.invoke('bundle:import', filePath, options),
    validate: (filePath: string): Promise<{ valid: boolean; error?: string; manifest?: BundleManifest }> =>
      ipcRenderer.invoke('bundle:validate', filePath),
    list: (): Promise<BundleMetadata[]> => ipcRenderer.invoke('bundle:list'),
    get: (id: string): Promise<BundleMetadata | null> => ipcRenderer.invoke('bundle:get', id),
    delete: (id: string): Promise<{ success: boolean }> => ipcRenderer.invoke('bundle:delete', id),
    getExportsDir: (): Promise<string> => ipcRenderer.invoke('bundle:exports-dir'),
    getDefaultPath: (name?: string): Promise<string> => ipcRenderer.invoke('bundle:default-path', name)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
