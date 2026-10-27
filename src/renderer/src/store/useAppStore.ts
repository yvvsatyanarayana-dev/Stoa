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
  NotificationLog
} from '../../../types'

export type AppView = 'calendar' | 'timetable' | 'resources' | 'dashboard' | 'notifications' | 'settings'
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

  isLoading: boolean
  fetchInitialData: () => Promise<void>
  fetchEvents: () => Promise<void>
  toggleCalendar: (id: string) => Promise<void>
  createEvent: (event: CalendarEvent, resourceIds?: string[]) => Promise<void>
  updateEvent: (event: CalendarEvent, resourceIds?: string[]) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  selectTimetable: (id: string) => Promise<void>
  saveSlot: (slot: TimetableSlot) => Promise<void>
  deleteSlot: (id: string) => Promise<void>

  createResource: (res: Resource) => Promise<void>
  updateResource: (res: Resource) => Promise<void>
  deleteResource: (id: string) => Promise<void>

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

  isLoading: false,

  fetchInitialData: async () => {
    set({ isLoading: true })
    try {
      const data = await window.api.data.getInitial()
      const events = await window.api.events.list()
      const notifs = await window.api.notifications.getHistory()

      let activeTtId = data.timetables.length > 0 ? data.timetables[0].id : null
      let activeSlots: TimetableSlot[] = []
      let subjects: Subject[] = []

      if (activeTtId) {
        const ttData = await window.api.timetables.get(activeTtId)
        if (ttData) {
          activeSlots = ttData.slots
          subjects = ttData.subjects
        }
      }

      set({
        calendars: data.calendars,
        categories: data.categories,
        resources: data.resources,
        settings: data.settings,
        timetables: data.timetables,
        activeTimetableId: activeTtId,
        activeTimetableSlots: activeSlots,
        subjects,
        events,
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
      const events = await window.api.events.list({ query: get().searchQuery })
      set({ events })
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  },

  toggleCalendar: async (id: string) => {
    const cal = get().calendars.find((c) => c.id === id)
    if (!cal) return
    const updated = await window.api.calendars.toggle(id, !cal.visible)
    set({ calendars: updated })
    get().fetchEvents()
  },

  createEvent: async (event: CalendarEvent, resourceIds?: string[]) => {
    await window.api.events.create(event, resourceIds)
    await get().fetchEvents()
  },

  updateEvent: async (event: CalendarEvent, resourceIds?: string[]) => {
    await window.api.events.update(event, resourceIds)
    await get().fetchEvents()
  },

  deleteEvent: async (id: string) => {
    await window.api.events.delete(id)
    await get().fetchEvents()
  },

  selectTimetable: async (id: string) => {
    const res = await window.api.timetables.get(id)
    if (res) {
      set({
        activeTimetableId: id,
        activeTimetableSlots: res.slots,
        subjects: res.subjects
      })
    }
  },

  saveSlot: async (slot: TimetableSlot) => {
    await window.api.timetables.saveSlot(slot)
    if (get().activeTimetableId) {
      await get().selectTimetable(get().activeTimetableId!)
    }
  },

  deleteSlot: async (id: string) => {
    await window.api.timetables.deleteSlot(id)
    if (get().activeTimetableId) {
      await get().selectTimetable(get().activeTimetableId!)
    }
  },

  createResource: async (res: Resource) => {
    const updated = await window.api.resources.create(res)
    set({ resources: updated })
  },

  updateResource: async (res: Resource) => {
    const updated = await window.api.resources.update(res)
    set({ resources: updated })
  },

  deleteResource: async (id: string) => {
    const updated = await window.api.resources.delete(id)
    set({ resources: updated })
  },

  snoozeReminder: async (id: string, minutes: number) => {
    await window.api.reminders.snooze(id, minutes)
    await get().fetchNotifications()
  },

  dismissReminder: async (id: string) => {
    await window.api.reminders.dismiss(id)
    await get().fetchNotifications()
  },

  fetchNotifications: async () => {
    const notifs = await window.api.notifications.getHistory()
    set({ notificationLogs: notifs })
  },

  updateSetting: async (key: string, value: any) => {
    const updated = await window.api.settings.set(key, value)
    set({ settings: updated })
  }
}))
