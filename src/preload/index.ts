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
  NotificationLog
} from '../types'
import type { ConflictReport } from '../main/engine/conflictEngine'

export const api = {
  data: {
    getInitial: (): Promise<{
      calendars: Calendar[]
      categories: Category[]
      resources: Resource[]
      settings: ChronoDeskSettings
      timetables: Timetable[]
    }> => ipcRenderer.invoke('data:get-initial')
  },
  calendars: {
    list: (): Promise<Calendar[]> => ipcRenderer.invoke('calendars:list'),
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
      ipcRenderer.invoke('events:check-conflicts', event, resourceIds, excludeEventId)
  },
  timetables: {
    list: (): Promise<Timetable[]> => ipcRenderer.invoke('timetables:list'),
    get: (id: string): Promise<{ timetable: Timetable; slots: TimetableSlot[]; subjects: Subject[] } | null> =>
      ipcRenderer.invoke('timetables:get', id),
    saveSlot: (slot: TimetableSlot): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('timetables:save-slot', slot),
    deleteSlot: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('timetables:delete-slot', id),
    checkConflicts: (slot: Partial<TimetableSlot>, timetableId: string, excludeSlotId?: string): Promise<ConflictReport> =>
      ipcRenderer.invoke('timetables:check-conflicts', slot, timetableId, excludeSlotId),
    saveVersion: (timetableId: string, snapshotJson: string): Promise<string> =>
      ipcRenderer.invoke('timetables:save-version', timetableId, snapshotJson),
    getVersions: (timetableId: string): Promise<any[]> =>
      ipcRenderer.invoke('timetables:get-versions', timetableId)
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
