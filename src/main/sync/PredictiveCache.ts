// Predictive Cache - Pre-fetch and cache data for instant UI

import { cacheDb, getDb } from '../db'

interface CacheConfig {
  enabled: boolean
  ttlMs: number
  maxSize: number
}

let config: CacheConfig = {
  enabled: true,
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
}

let onCacheHit: ((key: string) => void) | null = null
let onCacheMiss: ((key: string) => void) | null = null

export function initializePredictiveCache(
  cfg: Partial<CacheConfig>,
  hitCallback?: (key: string) => void,
  missCallback?: (key: string) => void
): void {
  config = { ...config, ...cfg }
  onCacheHit = hitCallback || null
  onCacheMiss = missCallback || null

  // Clean expired entries periodically
  setInterval(() => {
    cacheDb.clearExpired()
  }, 60000)

  // Warm cache on startup
  warmCache()
}

function warmCache(): void {
  // Pre-cache current week events
  prefetchWeekEvents(new Date())

  // Pre-cache active timetables
  const activeTimetables = getDb().prepare(`
    SELECT * FROM timetables WHERE status = 'published'
    AND date(end_date) >= date('now')
  `).all()

  for (const tt of activeTimetables) {
    if (tt.id) prefetchTimetableSlots(String(tt.id))
  }
}

export function get<T>(key: string): T | null {
  const data = cacheDb.get(key)
  if (data) {
    onCacheHit?.(key)
    return data as T
  }
  onCacheMiss?.(key)
  return null
}

export function set<T>(key: string, data: T, ttlMs?: number): void {
  cacheDb.set(key, data, ttlMs || config.ttlMs)
}

export function invalidate(key: string): void {
  cacheDb.delete(key)
}

export function invalidatePattern(pattern: string): void {
  // Simple pattern matching - in production use a more sophisticated approach
  const db = getDb()
  const keys = db.prepare('SELECT key FROM cache_entries WHERE key LIKE ?').all(pattern.replace('*', '%')) as any[]
  for (const k of keys) {
    cacheDb.delete(k.key)
  }
}

export function clear(): void {
  cacheDb.clearAll()
}

// Prefetch functions for common UI scenarios

export function prefetchWeekEvents(date: Date): void {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay() + 1) // Monday
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const key = `events:week:${startOfWeek.toISOString().split('T')[0]}`

  if (cacheDb.get(key)) return

  const events = getDb().prepare(`
    SELECT e.*, c.name as cal_name, c.color as cal_color,
           cat.name as cat_name, cat.color as cat_color, cat.icon as cat_icon
    FROM events e
    LEFT JOIN calendars c ON e.calendar_id = c.id
    LEFT JOIN categories cat ON e.category_id = cat.id
    WHERE e.end >= ? AND e.start <= ?
    ORDER BY e.start ASC
  `).all(startOfWeek.toISOString(), endOfWeek.toISOString()) as any[]

  const formatted = events.map(r => ({
    id: r.id,
    calendar_id: r.calendar_id,
    title: r.title,
    description: r.description,
    location: r.location,
    meeting_url: r.meeting_url,
    start: r.start,
    end: r.end,
    all_day: Boolean(r.all_day),
    timezone: r.timezone,
    rrule: r.rrule,
    category_id: r.category_id,
    priority: r.priority,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    calendar: r.cal_name ? { id: r.calendar_id, name: r.cal_name, color: r.cal_color, source: 'local', visible: true } : undefined,
    category: r.cat_name ? { id: r.category_id, name: r.cat_name, color: r.cat_color, icon: r.cat_icon } : undefined,
  }))

  set(key, formatted)
}

export function prefetchDayEvents(date: Date): void {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const key = `events:day:${startOfDay.toISOString().split('T')[0]}`

  if (cacheDb.get(key)) return

  const events = getDb().prepare(`
    SELECT e.*, c.name as cal_name, c.color as cal_color,
           cat.name as cat_name, cat.color as cat_color, cat.icon as cat_icon
    FROM events e
    LEFT JOIN calendars c ON e.calendar_id = c.id
    LEFT JOIN categories cat ON e.category_id = cat.id
    WHERE e.end >= ? AND e.start <= ?
    ORDER BY e.start ASC
  `).all(startOfDay.toISOString(), endOfDay.toISOString()) as any[]

  const formatted = events.map(r => ({
    id: r.id,
    calendar_id: r.calendar_id,
    title: r.title,
    description: r.description,
    location: r.location,
    meeting_url: r.meeting_url,
    start: r.start,
    end: r.end,
    all_day: Boolean(r.all_day),
    timezone: r.timezone,
    rrule: r.rrule,
    category_id: r.category_id,
    priority: r.priority,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    calendar: r.cal_name ? { id: r.calendar_id, name: r.cal_name, color: r.cal_color, source: 'local', visible: true } : undefined,
    category: r.cat_name ? { id: r.category_id, name: r.cat_name, color: r.cat_color, icon: r.cat_icon } : undefined,
  }))

  set(key, formatted)
}

export function prefetchTimetableSlots(timetableId: string): void {
  const key = `timetable:slots:${timetableId}`

  if (cacheDb.get(key)) return

  const slots = getDb().prepare(`
    SELECT ts.*, s.name as sub_name, s.color as sub_color, s.icon as sub_icon,
           r.name as res_name, r.type as res_type
    FROM timetable_slots ts
    LEFT JOIN subjects s ON ts.subject_id = s.id
    LEFT JOIN resources r ON ts.resource_id = r.id
    WHERE ts.timetable_id = ?
    ORDER BY ts.day ASC, ts.start ASC
  `).all(timetableId) as any[]

  const formatted = slots.map(s => ({
    id: s.id,
    timetable_id: s.timetable_id,
    subject_id: s.subject_id,
    resource_id: s.resource_id,
    day: s.day,
    start: s.start,
    end: s.end,
    room: s.room,
    week_pattern: s.week_pattern,
    subject: s.sub_name ? { id: s.subject_id, name: s.sub_name, color: s.sub_color, icon: s.sub_icon } : undefined,
    resource: s.res_name ? { id: s.resource_id, name: s.res_name, type: s.res_type, capacity: 1 } : undefined
  }))

  set(key, formatted)
}

export function prefetchUpcomingEvents(days: number = 7): void {
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() + days)
  end.setHours(23, 59, 59, 999)

  const key = `events:upcoming:${days}d`

  if (cacheDb.get(key)) return

  const events = getDb().prepare(`
    SELECT e.*, c.name as cal_name, c.color as cal_color
    FROM events e
    LEFT JOIN calendars c ON e.calendar_id = c.id
    WHERE e.start >= ? AND e.start <= ?
    ORDER BY e.start ASC
    LIMIT 50
  `).all(now.toISOString(), end.toISOString()) as any[]

  const formatted = events.map(r => ({
    id: r.id,
    calendar_id: r.calendar_id,
    title: r.title,
    start: r.start,
    end: r.end,
    all_day: Boolean(r.all_day),
    calendar: r.cal_name ? { id: r.calendar_id, name: r.cal_name, color: r.cal_color, source: 'local', visible: true } : undefined,
  }))

  set(key, formatted)
}

export function getCacheStats(): { count: number; oldestEntry: number | null; newestEntry: number | null; hitRate?: number } {
  return cacheDb.getStats()
}

export function setConfig(cfg: Partial<CacheConfig>): void {
  config = { ...config, ...cfg }
}

export function getConfig(): CacheConfig {
  return { ...config }
}

// Smart prefetch based on user behavior patterns
export function recordView(viewType: string, params: Record<string, any>): void {
  // Record user view patterns for predictive prefetching
  const key = `view:pattern:${viewType}`
  const patterns = cacheDb.get(key) || []
  patterns.push({ params, timestamp: Date.now() })

  // Keep only last 100 patterns
  if (patterns.length > 100) patterns.shift()

  cacheDb.set(key, patterns, 24 * 60 * 60 * 1000) // 24 hour TTL for patterns
}

export function predictAndPrefetch(currentView: string, currentParams: Record<string, any>): void {
  // Simple prediction: if user views week view, prefetch next week
  if (currentView === 'week' && currentParams.date) {
    const currentDate = new Date(currentParams.date)
    const nextWeek = new Date(currentDate)
    nextWeek.setDate(currentDate.getDate() + 7)
    prefetchWeekEvents(nextWeek)
  }

  // If user views day, prefetch next day
  if (currentView === 'day' && currentParams.date) {
    const currentDate = new Date(currentParams.date)
    const nextDay = new Date(currentDate)
    nextDay.setDate(currentDate.getDate() + 1)
    prefetchDayEvents(nextDay)
  }

  // If user views timetable, prefetch related slots
  if (currentView === 'timetable' && currentParams.timetableId) {
    prefetchTimetableSlots(currentParams.timetableId)
  }
}