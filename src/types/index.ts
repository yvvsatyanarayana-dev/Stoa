// Shared types for ChronoDesk Pro

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type EventStatus = 'tentative' | 'confirmed' | 'cancelled'
export type ResourceType = 'person' | 'room' | 'equipment'
export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'tentative'
export type TimetableStatus = 'draft' | 'published' | 'locked'
export type NotificationAction = 'snoozed' | 'dismissed' | 'opened' | 'joined'

export interface Calendar {
  id: string
  name: string
  color: string
  source: string // 'local' | 'work' | 'client' | etc.
  visible: boolean
  is_default?: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

export interface EventResource {
  event_id: string
  resource_id: string
}

export interface Attendee {
  id: string
  event_id: string
  name: string
  email: string
  rsvp_status: RsvpStatus
}

export interface Reminder {
  id: string
  event_id: string
  offset_minutes: number
  channel: 'native' | 'in_app' | 'both'
  fired_at?: string | null
  snoozed_until?: string | null
}

export interface CalendarEvent {
  id: string
  calendar_id: string
  title: string
  description?: string
  location?: string
  meeting_url?: string
  start: string // ISO string
  end: string   // ISO string
  all_day: boolean
  timezone: string
  rrule?: string
  category_id?: string
  priority: Priority
  status: EventStatus
  created_at: string
  updated_at: string
  // Populated fields for UI convenience
  calendar?: Calendar
  category?: Category
  attendees?: Attendee[]
  resources?: Resource[]
  reminders?: Reminder[]
}

export interface Resource {
  id: string
  name: string
  type: ResourceType
  capacity: number
  availability_json?: string // JSON: { workingHours: { start: '09:00', end: '17:00' }, workingDays: [1,2,3,4,5] }
}

export interface Timetable {
  id: string
  name: string
  start_date: string
  end_date: string
  status: TimetableStatus
  settings_json?: string // JSON config for grid, time slots, lunch breaks
  created_at: string
  updated_at: string
}

export interface TimetableSlot {
  id: string
  timetable_id: string
  subject_id: string
  resource_id?: string // teacher, trainer, speaker, person
  day: number          // 1 (Monday) to 7 (Sunday)
  start: string        // "09:00"
  end: string          // "10:30"
  room?: string
  week_pattern?: string // 'all' | 'A' | 'B'
  subject?: Subject
  resource?: Resource
}

export interface Subject {
  id: string
  name: string
  color: string
  icon?: string
  weekly_hours?: number
}

export interface TimetableVersion {
  id: string
  timetable_id: string
  snapshot_json: string
  created_at: string
}

export interface NotificationLog {
  id: string
  event_id?: string
  title: string
  body?: string
  shown_at: string
  action_taken?: NotificationAction
}

export interface ConflictCheckResult {
  hasConflict: boolean
  conflicts: Array<{
    type: 'resource_double_booked' | 'person_double_booked' | 'outside_availability'
    message: string
    conflictWithId?: string
    conflictWithTitle?: string
  }>
}

export interface ChronoDeskSettings {
  theme: 'dark' | 'light' | 'system'
  start_day_of_week: number // 0 = Sunday, 1 = Monday
  time_format: '12h' | '24h'
  default_timezone: string
  default_reminder_offset: number // e.g. 15 mins
  quiet_hours_enabled: boolean
  quiet_hours_start: string // "22:00"
  quiet_hours_end: string   // "08:00"
  company_name: string
  company_logo?: string
  company_footer?: string
}
