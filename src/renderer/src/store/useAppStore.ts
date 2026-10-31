import { create } from 'zustand'
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
import { DEFAULT_DARK_PALETTE, DEFAULT_BW_PALETTE } from '../../../types'
import { useThemeStore } from './useThemeStore'

export type AppView =
  | 'calendar'
  | 'timetable'
  | 'resources'
  | 'conferences'
  | 'spatial-canvas'
  | 'burnout-shield'
  | 'transcriber'
  | 'annotation-layer'
  | 'dashboard'
  | 'notifications'
  | 'profiles'
  | 'theme-studio'
  | 'audit-log'
  | 'p2p-relay'
  | 'settings'

export type CalendarViewType = 'day' | 'week' | 'month' | 'agenda'

interface AppState {
  currentView: AppView
  setCurrentView: (view: AppView) => void

  selectedDate: Date
  setSelectedDate: (date: Date) => void

  calendarViewType: CalendarViewType
  setCalendarViewType: (vt: CalendarViewType) => void

  calendars: Calendar[]
  categories: Category[]
  resources: Resource[]
  events: CalendarEvent[]
  timetables: Timetable[]
  activeTimetableId: string | null
  activeTimetableSlots: TimetableSlot[]
  subjects: Subject[]
  settings: ChronoDeskSettings | null
  notificationLogs: NotificationLog[]
  unreadNotificationsCount: number

  conferences: Conference[]
  activeConferenceId: string | null
  setActiveConferenceId: (id: string | null) => void

  resourceActiveTab: 'directory' | 'availability' | 'suggester' | 'conflicts' | 'roster' | 'attendance'
  setResourceActiveTab: (tab: 'directory' | 'availability' | 'suggester' | 'conflicts' | 'roster' | 'attendance') => void

  searchQuery: string
  setSearchQuery: (q: string) => void

  selectedEvent: CalendarEvent | null
  setSelectedEvent: (event: CalendarEvent | null) => void
  isEventModalOpen: boolean
  setIsEventModalOpen: (open: boolean) => void

  selectedSlot: TimetableSlot | null
  setSelectedSlot: (slot: TimetableSlot | null) => void
  isSlotModalOpen: boolean
  setIsSlotModalOpen: (open: boolean) => void

  isCalendarModalOpen: boolean
  setIsCalendarModalOpen: (open: boolean) => void

  isTimetableModalOpen: boolean
  setIsTimetableModalOpen: (open: boolean) => void

  isSubjectModalOpen: boolean
  setIsSubjectModalOpen: (open: boolean) => void

  // New feature modals
  isAutoGenerateModalOpen: boolean
  setIsAutoGenerateModalOpen: (open: boolean) => void

  isFreeSlotFinderOpen: boolean
  setIsFreeSlotFinderOpen: (open: boolean) => void

  isWorldClockOpen: boolean
  setIsWorldClockOpen: (open: boolean) => void

  isFeedSubscriptionModalOpen: boolean
  setIsFeedSubscriptionModalOpen: (open: boolean) => void

  isExportHubOpen: boolean
  setIsExportHubOpen: (open: boolean) => void
  exportHubInitialTab: 'pdf' | 'share' | 'excel' | 'ical' | 'qr'
  setExportHubInitialTab: (tab: 'pdf' | 'share' | 'excel' | 'ical' | 'qr') => void

  isNlpQuickAddOpen: boolean
  setIsNlpQuickAddOpen: (open: boolean) => void

  isConflictPredictorOpen: boolean
  setIsConflictPredictorOpen: (open: boolean) => void

  isPresentationModeOpen: boolean
  setIsPresentationModeOpen: (open: boolean) => void

  isShortcutsModalOpen: boolean
  setIsShortcutsModalOpen: (open: boolean) => void

  isDashboardCustomizerOpen: boolean
  setIsDashboardCustomizerOpen: (open: boolean) => void

  isCommandPaletteOpen: boolean
  setIsCommandPaletteOpen: (open: boolean) => void

  isDailyDigestOpen: boolean
  setIsDailyDigestOpen: (open: boolean) => void

  preMeetingBriefingEvent: CalendarEvent | null
  setPreMeetingBriefingEvent: (event: CalendarEvent | null) => void

  isWorkspaceLocked: boolean
  setIsWorkspaceLocked: (locked: boolean) => void

  isTemplateMarketplaceOpen: boolean
  setIsTemplateMarketplaceOpen: (open: boolean) => void

  activeProfileId: string
  setActiveProfileId: (id: string) => void

  rescheduleEvent: (eventId: string, minutesToAdd: number) => Promise<void>
  moveEventToTomorrow: (eventId: string) => Promise<void>

  themeMode: 'dark' | 'light'
  setThemeMode: (mode: 'dark' | 'light') => void
  toggleThemeMode: () => void

  isLoading: boolean
  fetchInitialData: () => Promise<void>
  fetchEvents: () => Promise<void>
  fetchConferences: () => Promise<void>

  // User Calendar Actions
  createCalendar: (name: string, color: string) => Promise<void>
  updateCalendar: (cal: Calendar) => Promise<void>
  deleteCalendar: (id: string) => Promise<void>
  toggleCalendar: (id: string) => Promise<void>
  importIcsFeed: (options: { url?: string; content?: string; calendarName?: string; calendarColor?: string }) => Promise<{ calendar: Calendar; importedCount: number }>

  // User Event Actions
  createEvent: (event: CalendarEvent, resourceIds?: string[]) => Promise<void>
  updateEvent: (event: CalendarEvent, resourceIds?: string[]) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  // User Timetable Actions
  createTimetable: (name: string, startDate: string, endDate: string) => Promise<void>
  deleteTimetable: (id: string) => Promise<void>
  selectTimetable: (id: string) => Promise<void>
  saveSlot: (slot: TimetableSlot) => Promise<void>
  deleteSlot: (id: string) => Promise<void>
  applyAutoGeneratedSlots: (slots: TimetableSlot[]) => Promise<void>

  // User Subject Actions
  createSubject: (name: string, color: string) => Promise<void>
  deleteSubject: (id: string) => Promise<void>

  // User Resource Actions
  createResource: (res: Resource) => Promise<void>
  updateResource: (res: Resource) => Promise<void>
  deleteResource: (id: string) => Promise<void>

  // Conference Actions
  createConference: (conf: Conference) => Promise<void>
  updateConference: (conf: Conference) => Promise<void>
  deleteConference: (id: string) => Promise<void>

  // Reminder Actions
  snoozeReminder: (id: string, minutes: number) => Promise<void>
  dismissReminder: (id: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  updateSetting: (key: string, value: any) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'calendar',
  setCurrentView: (view) => set({ currentView: view }),

  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  calendarViewType: 'week',
  setCalendarViewType: (calendarViewType) => set({ calendarViewType }),

  calendars: [],
  categories: [],
  resources: [],
  events: [],
  timetables: [],
  activeTimetableId: null,
  activeTimetableSlots: [],
  subjects: [],
  settings: null,
  notificationLogs: [],
  unreadNotificationsCount: 0,

  conferences: [],
  activeConferenceId: null,
  setActiveConferenceId: (activeConferenceId) => set({ activeConferenceId }),

  resourceActiveTab: 'directory',
  setResourceActiveTab: (resourceActiveTab) => set({ resourceActiveTab }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedEvent: null,
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  isEventModalOpen: false,
  setIsEventModalOpen: (isEventModalOpen) => set({ isEventModalOpen }),

  selectedSlot: null,
  setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
  isSlotModalOpen: false,
  setIsSlotModalOpen: (isSlotModalOpen) => set({ isSlotModalOpen }),

  isCalendarModalOpen: false,
  setIsCalendarModalOpen: (isCalendarModalOpen) => set({ isCalendarModalOpen }),

  isTimetableModalOpen: false,
  setIsTimetableModalOpen: (isTimetableModalOpen) => set({ isTimetableModalOpen }),

  isSubjectModalOpen: false,
  setIsSubjectModalOpen: (isSubjectModalOpen) => set({ isSubjectModalOpen }),

  isAutoGenerateModalOpen: false,
  setIsAutoGenerateModalOpen: (isAutoGenerateModalOpen) => set({ isAutoGenerateModalOpen }),

  isFreeSlotFinderOpen: false,
  setIsFreeSlotFinderOpen: (isFreeSlotFinderOpen) => set({ isFreeSlotFinderOpen }),

  isWorldClockOpen: false,
  setIsWorldClockOpen: (isWorldClockOpen) => set({ isWorldClockOpen }),

  isFeedSubscriptionModalOpen: false,
  setIsFeedSubscriptionModalOpen: (isFeedSubscriptionModalOpen) => set({ isFeedSubscriptionModalOpen }),

  isExportHubOpen: false,
  setIsExportHubOpen: (isExportHubOpen) => set({ isExportHubOpen }),
  exportHubInitialTab: 'pdf',
  setExportHubInitialTab: (exportHubInitialTab) => set({ exportHubInitialTab }),

  isNlpQuickAddOpen: false,
  setIsNlpQuickAddOpen: (isNlpQuickAddOpen) => set({ isNlpQuickAddOpen }),

  isConflictPredictorOpen: false,
  setIsConflictPredictorOpen: (isConflictPredictorOpen) => set({ isConflictPredictorOpen }),

  isPresentationModeOpen: false,
  setIsPresentationModeOpen: (isPresentationModeOpen) => set({ isPresentationModeOpen }),

  isShortcutsModalOpen: false,
  setIsShortcutsModalOpen: (isShortcutsModalOpen) => set({ isShortcutsModalOpen }),

  isDashboardCustomizerOpen: false,
  setIsDashboardCustomizerOpen: (isDashboardCustomizerOpen) => set({ isDashboardCustomizerOpen }),

  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),

  isDailyDigestOpen: false,
  setIsDailyDigestOpen: (isDailyDigestOpen) => set({ isDailyDigestOpen }),

  preMeetingBriefingEvent: null,
  setPreMeetingBriefingEvent: (preMeetingBriefingEvent) => set({ preMeetingBriefingEvent }),

  isWorkspaceLocked: false,
  setIsWorkspaceLocked: (isWorkspaceLocked) => set({ isWorkspaceLocked }),

  isTemplateMarketplaceOpen: false,
  setIsTemplateMarketplaceOpen: (isTemplateMarketplaceOpen) => set({ isTemplateMarketplaceOpen }),

  activeProfileId: 'prof-enterprise',
  setActiveProfileId: (activeProfileId) => set({ activeProfileId }),

  themeMode: 'dark',
  setThemeMode: (mode) => {
    document.documentElement.setAttribute('data-theme', mode)
    const isDark = mode === 'dark'
    useThemeStore.getState().applyTheme(isDark ? DEFAULT_DARK_PALETTE : DEFAULT_BW_PALETTE, isDark)
    set({ themeMode: mode })
  },
  toggleThemeMode: () => {
    const next = get().themeMode === 'dark' ? 'light' : 'dark'
    get().setThemeMode(next)
  },

  isLoading: false,

  fetchInitialData: async () => {
    set({ isLoading: true })
    try {
      const data = await window.api.data.getInitial()
      const events = await window.api.events.list()
      const notifs = await window.api.notifications.getHistory()
      const conferences = await window.api.conferences.list()

      let activeTtId = data.timetables.length > 0 ? data.timetables[0].id : null
      let activeSlots: TimetableSlot[] = []
      let subs: Subject[] = data.subjects || []

      if (activeTtId) {
        const ttData = await window.api.timetables.get(activeTtId)
        if (ttData) {
          activeSlots = ttData.slots
          subs = ttData.subjects
        }
      }

      const theme = data.settings?.theme === 'light' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', theme)

      set({
        calendars: data.calendars,
        categories: data.categories,
        resources: data.resources,
        settings: data.settings,
        themeMode: theme,
        timetables: data.timetables,
        activeTimetableId: activeTtId,
        activeTimetableSlots: activeSlots,
        subjects: subs,
        events,
        conferences,
        activeConferenceId: conferences.length > 0 ? conferences[0].id : null,
        notificationLogs: notifs,
        isLoading: false
      })
    } catch (err) {
      console.error('Error fetching initial data:', err)
      set({ isLoading: false })
    }
  },

  fetchEvents: async () => {
    try {
      const { searchQuery } = get()
      const events = await window.api.events.list({ query: searchQuery || undefined })
      set({ events })
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  },

  fetchConferences: async () => {
    try {
      const conferences = await window.api.conferences.list()
      set({ conferences })
    } catch (err) {
      console.error('Error fetching conferences:', err)
    }
  },

  createCalendar: async (name: string, color: string) => {
    try {
      const newCal: Calendar = {
        id: `cal-${Date.now()}`,
        name,
        color,
        source: 'local',
        visible: true,
        is_default: false
      }
      const calendars = await window.api.calendars.create(newCal)
      set({ calendars })
    } catch (err) {
      console.error('Error creating calendar:', err)
    }
  },

  updateCalendar: async (cal: Calendar) => {
    try {
      const calendars = await window.api.calendars.update(cal)
      set({ calendars })
    } catch (err) {
      console.error('Error updating calendar:', err)
    }
  },

  deleteCalendar: async (id: string) => {
    try {
      const calendars = await window.api.calendars.delete(id)
      set({ calendars })
      await get().fetchEvents()
    } catch (err) {
      console.error('Error deleting calendar:', err)
    }
  },

  toggleCalendar: async (id: string) => {
    try {
      const cal = get().calendars.find((c) => c.id === id)
      if (!cal) return
      const calendars = await window.api.calendars.toggle(id, !cal.visible)
      set({ calendars })
    } catch (err) {
      console.error('Error toggling calendar:', err)
    }
  },

  importIcsFeed: async (options) => {
    try {
      const res = await window.api.events.importIcs(options)
      await get().fetchInitialData()
      return res
    } catch (err) {
      console.error('Error importing feed:', err)
      throw err
    }
  },

  createEvent: async (event: CalendarEvent, resourceIds?: string[]) => {
    try {
      await window.api.events.create(event, resourceIds)
      await get().fetchEvents()
    } catch (err) {
      console.error('Error creating event:', err)
    }
  },

  updateEvent: async (event: CalendarEvent, resourceIds?: string[]) => {
    try {
      await window.api.events.update(event, resourceIds)
      await get().fetchEvents()
    } catch (err) {
      console.error('Error updating event:', err)
    }
  },

  deleteEvent: async (id: string) => {
    try {
      await window.api.events.delete(id)
      await get().fetchEvents()
    } catch (err) {
      console.error('Error deleting event:', err)
    }
  },

  rescheduleEvent: async (eventId: string, minutesToAdd: number) => {
    try {
      const evt = get().events.find((e) => e.id === eventId)
      if (!evt) return
      const s = new Date(evt.start)
      const e = new Date(evt.end)
      const newStart = new Date(s.getTime() + minutesToAdd * 60000).toISOString()
      const newEnd = new Date(e.getTime() + minutesToAdd * 60000).toISOString()

      const updated: CalendarEvent = {
        ...evt,
        start: newStart,
        end: newEnd,
        updated_at: new Date().toISOString()
      }
      await get().updateEvent(updated)
    } catch (err) {
      console.error('Error rescheduling event:', err)
    }
  },

  moveEventToTomorrow: async (eventId: string) => {
    try {
      const evt = get().events.find((e) => e.id === eventId)
      if (!evt) return
      const s = new Date(evt.start)
      const e = new Date(evt.end)
      const newStart = new Date(s.getTime() + 24 * 3600000).toISOString()
      const newEnd = new Date(e.getTime() + 24 * 3600000).toISOString()

      const updated: CalendarEvent = {
        ...evt,
        start: newStart,
        end: newEnd,
        updated_at: new Date().toISOString()
      }
      await get().updateEvent(updated)
    } catch (err) {
      console.error('Error moving event to tomorrow:', err)
    }
  },

  createTimetable: async (name: string, startDate: string, endDate: string) => {
    try {
      const newTt: Timetable = {
        id: `tt-${Date.now()}`,
        name,
        start_date: startDate,
        end_date: endDate,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const timetables = await window.api.timetables.create(newTt)
      set({ timetables, activeTimetableId: newTt.id, activeTimetableSlots: [] })
    } catch (err) {
      console.error('Error creating timetable:', err)
    }
  },

  deleteTimetable: async (id: string) => {
    try {
      const timetables = await window.api.timetables.delete(id)
      const nextId = timetables.length > 0 ? timetables[0].id : null
      set({ timetables, activeTimetableId: nextId })
      if (nextId) {
        await get().selectTimetable(nextId)
      } else {
        set({ activeTimetableSlots: [] })
      }
    } catch (err) {
      console.error('Error deleting timetable:', err)
    }
  },

  selectTimetable: async (id: string) => {
    try {
      set({ activeTimetableId: id })
      const data = await window.api.timetables.get(id)
      if (data) {
        set({
          activeTimetableSlots: data.slots,
          subjects: data.subjects
        })
      }
    } catch (err) {
      console.error('Error selecting timetable:', err)
    }
  },

  saveSlot: async (slot: TimetableSlot) => {
    try {
      await window.api.timetables.saveSlot(slot)
      if (get().activeTimetableId) {
        await get().selectTimetable(get().activeTimetableId!)
      }
    } catch (err) {
      console.error('Error saving slot:', err)
    }
  },

  deleteSlot: async (id: string) => {
    try {
      await window.api.timetables.deleteSlot(id)
      if (get().activeTimetableId) {
        await get().selectTimetable(get().activeTimetableId!)
      }
    } catch (err) {
      console.error('Error deleting slot:', err)
    }
  },

  applyAutoGeneratedSlots: async (slots: TimetableSlot[]) => {
    try {
      await window.api.timetables.applyGenerated(slots)
      if (get().activeTimetableId) {
        await get().selectTimetable(get().activeTimetableId!)
      }
    } catch (err) {
      console.error('Error applying auto-generated slots:', err)
    }
  },

  createSubject: async (name: string, color: string) => {
    try {
      const newSub: Subject = {
        id: `sub-${Date.now()}`,
        name,
        color
      }
      const subjects = await window.api.subjects.create(newSub)
      set({ subjects })
    } catch (err) {
      console.error('Error creating subject:', err)
    }
  },

  deleteSubject: async (id: string) => {
    try {
      const subjects = await window.api.subjects.delete(id)
      set({ subjects })
    } catch (err) {
      console.error('Error deleting subject:', err)
    }
  },

  createResource: async (res: Resource) => {
    try {
      const resources = await window.api.resources.create(res)
      set({ resources })
    } catch (err) {
      console.error('Error creating resource:', err)
    }
  },

  updateResource: async (res: Resource) => {
    try {
      const resources = await window.api.resources.update(res)
      set({ resources })
    } catch (err) {
      console.error('Error updating resource:', err)
    }
  },

  deleteResource: async (id: string) => {
    try {
      const resources = await window.api.resources.delete(id)
      set({ resources })
    } catch (err) {
      console.error('Error deleting resource:', err)
    }
  },

  createConference: async (conf: Conference) => {
    try {
      await window.api.conferences.create(conf)
      await get().fetchConferences()
      set({ activeConferenceId: conf.id })
    } catch (err) {
      console.error('Error creating conference:', err)
    }
  },

  updateConference: async (conf: Conference) => {
    try {
      await window.api.conferences.update(conf)
      await get().fetchConferences()
    } catch (err) {
      console.error('Error updating conference:', err)
    }
  },

  deleteConference: async (id: string) => {
    try {
      await window.api.conferences.delete(id)
      await get().fetchConferences()
      const confs = get().conferences
      set({ activeConferenceId: confs.length > 0 ? confs[0].id : null })
    } catch (err) {
      console.error('Error deleting conference:', err)
    }
  },

  snoozeReminder: async (id: string, minutes: number) => {
    try {
      await window.api.reminders.snooze(id, minutes)
      await get().fetchNotifications()
    } catch (err) {
      console.error('Error snoozing reminder:', err)
    }
  },

  dismissReminder: async (id: string) => {
    try {
      await window.api.reminders.dismiss(id)
      await get().fetchNotifications()
    } catch (err) {
      console.error('Error dismissing reminder:', err)
    }
  },

  fetchNotifications: async () => {
    try {
      const notificationLogs = await window.api.notifications.getHistory()
      set({ notificationLogs })
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  },

  updateSetting: async (key: string, value: any) => {
    try {
      const settings = await window.api.settings.set(key, value)
      set({ settings })
    } catch (err) {
      console.error('Error updating setting:', err)
    }
  }
}))
