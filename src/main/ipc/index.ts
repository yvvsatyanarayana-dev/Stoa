import { ipcMain, BrowserWindow } from 'electron'
import {
  calendarDb,
  categoryDb,
  resourceDb,
  eventDb,
  timetableDb,
  subjectDb,
  reminderDb,
  settingsDb,
  notificationLogDb,
  conferenceDb,
  themeDb,
  syncQueueDb,
  cacheDb,
  getDb
} from '../db'
import { checkEventConflicts, checkTimetableSlotConflicts } from '../engine/conflictEngine'
import { solveTimetable, SolverOptions } from '../engine/timetableSolver'
import { findCommonFreeSlots, FreeSlotRequest } from '../engine/slotFinder'
import { parseIcsText, fetchIcsFeed } from '../engine/icsFeed'
import { createMirrorConfig, updateMirrorConfig, deleteMirror, toggleMirror, getMirrorStatus } from '../engine/icsMirror'
import { exportWorkspaceBundle, validateBundleFormat, getDefaultExportPath } from '../export/workspaceBundle'
import { importWorkspaceBundle, listAvailableBundles, getBundleMetadata, deleteBundleMetadata, getExportsDirectory } from '../import/workspaceBundle'
import { scheduleMirrorSync, unscheduleMirror, triggerMirrorSync, triggerAllMirrorsSync, getSchedulerStatus, initScheduler } from '../scheduler'
import { icsMirrorDb, mirrorEventsDb } from '../db'
import type { Calendar, CalendarEvent, Resource, Timetable, TimetableSlot, Subject, Conference } from '../../types'
import type { ICSMirrorConfig, BundleExportOptions, BundleImportOptions } from '../../types/sync'

let activeMainWindow: BrowserWindow | null = null

export function setIpcMainWindow(window: BrowserWindow | null): void {
  activeMainWindow = window
}

export function registerIpcHandlers(): void {
  // Window Controls
  ipcMain.handle('window:minimize', () => {
    activeMainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (activeMainWindow?.isMaximized()) {
      activeMainWindow.unmaximize()
    } else {
      activeMainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    activeMainWindow?.close()
  })

  ipcMain.handle('window:is-maximized', () => {
    return activeMainWindow?.isMaximized() ?? false
  })

  // Initial Hydration
  ipcMain.handle('data:get-initial', async () => {
    return {
      calendars: calendarDb.list(),
      categories: categoryDb.list(),
      resources: resourceDb.list(),
      settings: settingsDb.get(),
      timetables: timetableDb.list(),
      subjects: subjectDb.list()
    }
  })

  // Calendars
  ipcMain.handle('calendars:list', async () => {
    return calendarDb.list()
  })

  ipcMain.handle('calendars:create', async (_, cal: Calendar) => {
    return calendarDb.create(cal)
  })

  ipcMain.handle('calendars:update', async (_, cal: Calendar) => {
    return calendarDb.update(cal)
  })

  ipcMain.handle('calendars:delete', async (_, id: string) => {
    return calendarDb.delete(id)
  })

  ipcMain.handle('calendars:toggle', async (_, id: string, visible: boolean) => {
    calendarDb.toggleVisibility(id, visible)
    return calendarDb.list()
  })

  // Events
  ipcMain.handle('events:list', async (_, options?: { start?: string; end?: string; calendarIds?: string[]; query?: string }) => {
    return eventDb.list(options)
  })

  ipcMain.handle('events:create', async (_, event: CalendarEvent, resourceIds?: string[]) => {
    return eventDb.create(event, resourceIds)
  })

  ipcMain.handle('events:update', async (_, event: CalendarEvent, resourceIds?: string[]) => {
    return eventDb.update(event, resourceIds)
  })

  ipcMain.handle('events:delete', async (_, id: string) => {
    eventDb.delete(id)
    return { success: true }
  })

  ipcMain.handle('events:check-conflicts', async (_, event: Partial<CalendarEvent>, resourceIds: string[], excludeEventId?: string) => {
    return checkEventConflicts(event, resourceIds, excludeEventId)
  })

  // Intelligent Free Slot Finder
  ipcMain.handle('calendar:find-free-slots', async (_, req: FreeSlotRequest) => {
    const allEvents = eventDb.list()
    return findCommonFreeSlots(allEvents, req)
  })

  // External Calendar Feed Import (.ics / Webcal)
  ipcMain.handle('calendar:import-ics', async (_, options: { url?: string; content?: string; calendarName?: string; calendarColor?: string }) => {
    let rawContent = options.content || ''
    if (options.url) {
      rawContent = await fetchIcsFeed(options.url)
    }

    const calId = `cal-feed-${Date.now()}`
    const parsed = parseIcsText(rawContent, calId)
    const finalCalName = options.calendarName || parsed.calendarName || 'Imported Calendar'

    // Create Calendar
    const newCal: Calendar = {
      id: calId,
      name: finalCalName,
      color: options.calendarColor || '#737373',
      source: options.url ? 'feed' : 'ics_import',
      visible: true
    }
    calendarDb.create(newCal)

    // Insert parsed events
    let importedCount = 0
    for (const evt of parsed.events) {
      if (evt.start && evt.end && evt.title) {
        eventDb.create(evt as CalendarEvent)
        importedCount++
      }
    }

    return {
      calendar: newCal,
      importedCount
    }
  })

  // Timetables
  ipcMain.handle('timetables:list', async () => {
    return timetableDb.list()
  })

  ipcMain.handle('timetables:get', async (_, id: string) => {
    return timetableDb.get(id)
  })

  ipcMain.handle('timetables:create', async (_, tt: Timetable) => {
    return timetableDb.create(tt)
  })

  ipcMain.handle('timetables:update', async (_, tt: Timetable) => {
    return timetableDb.update(tt)
  })

  ipcMain.handle('timetables:delete', async (_, id: string) => {
    return timetableDb.delete(id)
  })

  ipcMain.handle('timetables:save-slot', async (_, slot: TimetableSlot) => {
    timetableDb.saveSlot(slot)
    return { success: true }
  })

  ipcMain.handle('timetables:delete-slot', async (_, id: string) => {
    timetableDb.deleteSlot(id)
    return { success: true }
  })

  ipcMain.handle('timetables:check-conflicts', async (_, slot: Partial<TimetableSlot>, timetableId: string, excludeSlotId?: string) => {
    return checkTimetableSlotConflicts(slot, timetableId, excludeSlotId)
  })

  ipcMain.handle('timetables:save-version', async (_, timetableId: string, snapshotJson: string) => {
    return timetableDb.saveVersion(timetableId, snapshotJson)
  })

  ipcMain.handle('timetables:get-versions', async (_, timetableId: string) => {
    return timetableDb.getVersions(timetableId)
  })

  // Constraint Solver Auto-Generator
  ipcMain.handle('timetables:auto-generate', async (_, options: SolverOptions) => {
    return solveTimetable(options)
  })

  ipcMain.handle('timetables:apply-generated', async (_, slots: TimetableSlot[]) => {
    for (const slot of slots) {
      timetableDb.saveSlot(slot)
    }
    return { success: true, count: slots.length }
  })

  // Subjects
  ipcMain.handle('subjects:list', async () => {
    return subjectDb.list()
  })

  ipcMain.handle('subjects:create', async (_, sub: Subject) => {
    return subjectDb.create(sub)
  })

  ipcMain.handle('subjects:delete', async (_, id: string) => {
    return subjectDb.delete(id)
  })

  // Resources
  ipcMain.handle('resources:list', async () => {
    return resourceDb.list()
  })

  ipcMain.handle('resources:create', async (_, res: Resource) => {
    return resourceDb.create(res)
  })

  ipcMain.handle('resources:update', async (_, res: Resource) => {
    return resourceDb.update(res)
  })

  ipcMain.handle('resources:delete', async (_, id: string) => {
    return resourceDb.delete(id)
  })

  // Reminders & Notifications
  ipcMain.handle('reminders:snooze', async (_, reminderId: string, minutes: number) => {
    reminderDb.snooze(reminderId, minutes)
    return { success: true }
  })

  ipcMain.handle('reminders:dismiss', async (_, reminderId: string) => {
    reminderDb.dismiss(reminderId)
    return { success: true }
  })

  ipcMain.handle('notifications:get-history', async (_, limit = 50) => {
    return notificationLogDb.list(limit)
  })

  ipcMain.handle('notifications:clear', async () => {
    notificationLogDb.clear()
    return { success: true }
  })

  // Settings
  ipcMain.handle('settings:get', async () => {
    return settingsDb.get()
  })

  ipcMain.handle('settings:set', async (_, key: string, value: any) => {
    settingsDb.set(key, value)
    return settingsDb.get()
  })

  // Theme Engine
  ipcMain.handle('theme:list', async () => {
    return themeDb.list()
  })

  ipcMain.handle('theme:get', async (_, id: string) => {
    return themeDb.get(id)
  })

  ipcMain.handle('theme:create', async (_, theme: any) => {
    return themeDb.create(theme)
  })

  ipcMain.handle('theme:update', async (_, theme: any) => {
    return themeDb.update(theme)
  })

  ipcMain.handle('theme:delete', async (_, id: string) => {
    return themeDb.delete(id)
  })

  ipcMain.handle('theme:set-active', async (_, id: string) => {
    const db = getDb()
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('activeThemeId', id)
    return { success: true }
  })

  ipcMain.handle('theme:preview', async (_: any, _theme: any) => {
    // Preview doesn't persist, just returns the computed variables
    return { success: true }
  })

  ipcMain.handle('theme:get-variables', async () => {
    const settings = settingsDb.get()
    const activeThemeId = settings.activeThemeId || 'preset-0'
    const theme = themeDb.get(activeThemeId)
    if (!theme) return {}
    // Return computed CSS variables
    return theme.basePalette // Will be processed by renderer
  })

  ipcMain.handle('theme:circadian:get', async () => {
    const settings = settingsDb.get()
    if (settings.circadianSettings) {
      return typeof settings.circadianSettings === 'string'
        ? JSON.parse(settings.circadianSettings)
        : settings.circadianSettings
    }
    return {
      latitude: 0,
      longitude: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      dawnOffsetMinutes: -30,
      duskOffsetMinutes: 30,
    }
  })

  ipcMain.handle('theme:circadian:set', async (_, settings: any) => {
    settingsDb.set('circadianSettings', settings)
    // Restart theme scheduler to pick up new settings
    const { startThemeScheduler } = await import('../theme/ThemeScheduler')
    startThemeScheduler()
    return settingsDb.get().circadianSettings
  })

  ipcMain.handle('theme:scheduler:status', async () => {
    const { getCircadianSettings, getActiveThemeMode } = await import('../theme/ThemeScheduler')
    const settings = getCircadianSettings()
    const mode = getActiveThemeMode()
    return {
      mode,
      hasValidLocation: (settings.latitude !== 0 || settings.longitude !== 0),
      settings
    }
  })

  // Conferences & Run-Sheets
  ipcMain.handle('conferences:list', async () => {
    return conferenceDb.list()
  })

  ipcMain.handle('conferences:get', async (_, id: string) => {
    return conferenceDb.get(id)
  })

  ipcMain.handle('conferences:create', async (_, conf: Conference) => {
    conferenceDb.create(conf)
    return conferenceDb.get(conf.id)
  })

  ipcMain.handle('conferences:update', async (_, conf: Conference) => {
    conferenceDb.update(conf)
    return conferenceDb.get(conf.id)
  })

  ipcMain.handle('conferences:delete', async (_, id: string) => {
    conferenceDb.delete(id)
    return { success: true }
  })

  // Sync & Offline (Phase 2)
  ipcMain.handle('sync:status', async () => {
    const { getSyncStatus, getPendingChangesCount } = await import('../sync/SyncScheduler')
    const { getSyncStats: getSchedulerSyncStats } = await import('../sync/SyncScheduler')
    const { getPeerCount: getNetworkPeerCount } = await import('../sync/NetworkLayer')
    return {
      stats: getSchedulerSyncStats(),
      status: getSyncStatus(),
      pendingChanges: getPendingChangesCount(),
      peerCount: getNetworkPeerCount(),
      isOnline: require('../sync/OfflineQueue').isOnlineStatus()
    }
  })

  ipcMain.handle('sync:manual', async () => {
    const { manualSync } = await import('../sync/SyncScheduler')
    return manualSync()
  })

  ipcMain.handle('sync:config:get', async () => {
    const { getConfig } = await import('../sync/SyncScheduler')
    return getConfig()
  })

  ipcMain.handle('sync:config:set', async (_, config: any) => {
    const { setConfig } = await import('../sync/SyncScheduler')
    setConfig(config)
    return { success: true }
  })

  ipcMain.handle('sync:queue:list', async () => {
    return syncQueueDb.list(true)
  })

  ipcMain.handle('sync:queue:clear', async () => {
    const count = syncQueueDb.clearSynced()
    return { success: true, cleared: count }
  })

  ipcMain.handle('sync:queue:retry', async () => {
    require('../sync/OfflineQueue').retryFailedItems()
    return { success: true }
  })

  ipcMain.handle('sync:cache:stats', async () => {
    return cacheDb.getStats()
  })

  ipcMain.handle('sync:cache:clear', async () => {
    cacheDb.clearAll()
    return { success: true }
  })

  ipcMain.handle('sync:cache:invalidate', async (_, pattern: string) => {
    require('../sync/PredictiveCache').invalidatePattern(pattern)
    return { success: true }
  })

  ipcMain.handle('sync:record-view', async (_, viewType: string, params: any) => {
    const { recordView } = await import('../sync/SyncScheduler')
    recordView(viewType, params)
    return { success: true }
  })

  ipcMain.handle('sync:devices', async () => {
    const { getPeers } = await import('../sync/NetworkLayer')
    return getPeers()
  })

  ipcMain.handle('sync:force', async () => {
    const { forceSync } = await import('../sync/NetworkLayer')
    forceSync()
    return { success: true }
  })

  // Offline queue actions
  ipcMain.handle('offline:queue-action', async (_, type: string, table: string, entityId: string, payload: any) => {
    const { queueAction } = await import('../sync/OfflineQueue')
    const id = queueAction(type as any, table as any, entityId, payload)
    return { id }
  })

  ipcMain.handle('offline:status', async () => {
    return { isOnline: require('../sync/OfflineQueue').isOnlineStatus() }
  })

  // ICS Mirror (Phase 3)
  ipcMain.handle('ics:mirror:list', async () => {
    return icsMirrorDb.list()
  })

  ipcMain.handle('ics:mirror:get', async (_, id: string) => {
    return icsMirrorDb.get(id)
  })

  ipcMain.handle('ics:mirror:create', async (_, config: Omit<ICSMirrorConfig, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }) => {
    const mirror = createMirrorConfig(config)
    scheduleMirrorSync(mirror)
    return mirror
  })

  ipcMain.handle('ics:mirror:update', async (_, config: ICSMirrorConfig) => {
    const mirror = updateMirrorConfig(config)
    if (mirror.enabled) {
      scheduleMirrorSync(mirror)
    } else {
      unscheduleMirror(mirror.id)
    }
    return mirror
  })

  ipcMain.handle('ics:mirror:delete', async (_, id: string) => {
    unscheduleMirror(id)
    deleteMirror(id)
    return { success: true }
  })

  ipcMain.handle('ics:mirror:toggle', async (_, id: string, enabled: boolean) => {
    toggleMirror(id, enabled)
    const mirror = icsMirrorDb.get(id)
    if (mirror) {
      if (enabled) scheduleMirrorSync(mirror)
      else unscheduleMirror(id)
    }
    return { success: true }
  })

  ipcMain.handle('ics:mirror:sync', async (_, id: string) => {
    return triggerMirrorSync(id)
  })

  ipcMain.handle('ics:mirror:sync-all', async (_, maxConcurrent = 3) => {
    return triggerAllMirrorsSync(maxConcurrent)
  })

  ipcMain.handle('ics:mirror:status', async (_, id: string) => {
    return getMirrorStatus(id)
  })

  ipcMain.handle('ics:mirror:events', async (_, mirrorId: string, limit = 100) => {
    return mirrorEventsDb.list(mirrorId, limit)
  })

  ipcMain.handle('scheduler:status', async () => {
    return getSchedulerStatus()
  })

  ipcMain.handle('scheduler:initialize', async () => {
    initScheduler({} as any)
    return { success: true }
  })

  // Workspace Bundle (Phase 3)
  ipcMain.handle('bundle:export', async (_, options: BundleExportOptions) => {
    const result = await exportWorkspaceBundle(options)
    return {
      success: true,
      metadata: result.metadata,
      manifest: result.manifest,
      buffer: result.buffer // Will be sent as ArrayBuffer
    }
  })

  ipcMain.handle('bundle:export:save', async (_, options: BundleExportOptions) => {
    const result = await exportWorkspaceBundle(options)
    return {
      success: true,
      metadata: result.metadata,
      manifest: result.manifest
    }
  })

  ipcMain.handle('bundle:import', async (_, filePath: string, options: BundleImportOptions) => {
    return importWorkspaceBundle(filePath, options)
  })

  ipcMain.handle('bundle:validate', async (_, filePath: string) => {
    return validateBundleFormat(filePath)
  })

  ipcMain.handle('bundle:list', async () => {
    return listAvailableBundles()
  })

  ipcMain.handle('bundle:get', async (_, id: string) => {
    return getBundleMetadata(id)
  })

  ipcMain.handle('bundle:delete', async (_, id: string) => {
    deleteBundleMetadata(id)
    return { success: true }
  })

  ipcMain.handle('bundle:exports-dir', async () => {
    return getExportsDirectory()
  })

  ipcMain.handle('bundle:default-path', async (_, name?: string) => {
    return getDefaultExportPath(name)
  })

  // Global Shortcuts
  let registeredShortcuts: Map<string, string> = new Map()

  ipcMain.handle('shortcuts:register', async (_, accelerator: string, action: string) => {
    const { globalShortcut } = await import('electron')
    const success = globalShortcut.register(accelerator, () => {
      if (action === 'command-palette') {
        activeMainWindow?.webContents.send('shortcuts:command-palette')
      }
    })
    if (success) {
      registeredShortcuts.set(accelerator, action)
    }
    return { success }
  })

  ipcMain.handle('shortcuts:unregister', async (_, accelerator: string) => {
    const { globalShortcut } = await import('electron')
    const success = globalShortcut.unregister(accelerator)
    registeredShortcuts.delete(accelerator)
    return { success }
  })

  ipcMain.handle('shortcuts:unregister-all', async () => {
    const { globalShortcut } = await import('electron')
    globalShortcut.unregisterAll()
    registeredShortcuts.clear()
    return { success: true }
  })

  ipcMain.handle('shortcuts:get-registered', async () => {
    return Array.from(registeredShortcuts.keys())
  })
}
