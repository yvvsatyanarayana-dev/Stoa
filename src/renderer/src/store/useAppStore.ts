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

  isCalendarModalOpen: boolean
  setIsCalendarModalOpen: (open: boolean) => void

  isTimetableModalOpen: boolean
  setIsTimetableModalOpen: (open: boolean) => void

  isSubjectModalOpen: boolean
  setIsSubjectModalOpen: (open: boolean) => void

  isLoading: boolean
  fetchInitialData: () => Promise<void>
  fetchEvents: () => Promise<void>

  // User Calendar Actions
  createCalendar: (name: string, color: string) => Promise<void>
  updateCalendar: (cal: Calendar) => Promise<void>
  deleteCalendar: (id: string) => Promise<void>
  toggleCalendar: (id: string) => Promise<void>

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

  // User Subject Actions
  createSubject: (name: string, color: string) => Promise<void>
  deleteSubject: (id: string) => Promise<void>

  // User Resource Actions
  createResource: (res: Resource) => Promise<void>
  updateResource: (res: Resource) => Promise<void>
  deleteResource: (id: string) => Promise<void>

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

  isLoading: false,

  fetchInitialData: async () => {
    set({ isLoading: true })
    try {
      const data = await window.api.data.getInitial()
      const events = await window.api.events.list()
      const notifs = await window.api.notifications.getHistory()

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

      set({
        calendars: data.calendars,
        categories: data.categories,
        resources: data.resources,
        settings: data.settings,
        timetables: data.timetables,
        activeTimetableId: activeTtId,
        activeTimetableSlots: activeSlots,
        subjects: subs,
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

  createCalendar: async (name: string, color: string) => {
    const newCal: Calendar = {
      id: `cal-${Date.now()}`,
      name,
      color,
      source: 'local',
      visible: true,
      is_default: false
    }
    const updated = await window.api.calendars.create(newCal)
    set({ calendars: updated })
  },

  updateCalendar: async (cal: Calendar) => {
    const updated = await window.api.calendars.update(cal)
    set({ calendars: updated })
    get().fetchEvents()
  },

  deleteCalendar: async (id: string) => {
    const updated = await window.api.calendars.delete(id)
    set({ calendars: updated })
    get().fetchEvents()
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

  createTimetable: async (name: string, startDate: string, endDate: string) => {
    const newTt: Timetable = {
      id: `tt-${Date.now()}`,
      name,
      start_date: startDate,
      end_date: endDate,
      status: 'draft',
      settings_json: JSON.stringify({ slotDuration: 60, dayStartTime: '08:00', dayEndTime: '18:00' }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const list = await window.api.timetables.create(newTt)
    set({ timetables: list, activeTimetableId: newTt.id, activeTimetableSlots: [] })
    await get().selectTimetable(newTt.id)
  },

  deleteTimetable: async (id: string) => {
    const list = await window.api.timetables.delete(id)
    const nextId = list.length > 0 ? list[0].id : null
    set({ timetables: list, activeTimetableId: nextId, activeTimetableSlots: [] })
    if (nextId) {
      await get().selectTimetable(nextId)
    }
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

  createSubject: async (name: string, color: string) => {
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name,
      color,
      weekly_hours: 0
    }
    const subs = await window.api.subjects.create(newSub)
    set({ subjects: subs })
  },

  deleteSubject: async (id: string) => {
    const subs = await window.api.subjects.delete(id)
    set({ subjects: subs })
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
