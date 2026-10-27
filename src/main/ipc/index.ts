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
  notificationLogDb
} from '../db'
import { checkEventConflicts, checkTimetableSlotConflicts } from '../engine/conflictEngine'
import type { Calendar, CalendarEvent, Resource, Timetable, TimetableSlot, Subject } from '../../types'

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
}
