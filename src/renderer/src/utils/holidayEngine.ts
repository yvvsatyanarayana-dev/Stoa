import { addDays, isSameDay, format } from 'date-fns'
import type { CalendarEvent } from '../../../types'

export type HolidayRegion = 'US' | 'UK' | 'IN' | 'DE' | 'CA' | 'AU' | 'INTL'

/**
 * Detects real-time holiday region based on system locale, timezone, or user persistence
 */
export function detectSystemHolidayRegion(): HolidayRegion {
  try {
    const saved = localStorage.getItem('stoa_holiday_region') as HolidayRegion | null
    if (saved && ['US', 'UK', 'IN', 'DE', 'CA', 'AU', 'INTL'].includes(saved)) {
      return saved
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India') || tz.includes('Asia/Kolkata')) return 'IN'
    if (tz.includes('London') || tz.includes('Europe/London')) return 'UK'
    if (tz.includes('Berlin') || tz.includes('Europe/Berlin') || tz.includes('Europe/Paris')) return 'DE'
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('America/Toronto')) return 'CA'
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Australia/')) return 'AU'
    if (tz.includes('America/')) return 'US'
  } catch {}
  return 'US'
}

export interface PublicHoliday {
  date: string // YYYY-MM-DD
  name: string
  region: HolidayRegion
  isMandatory: boolean
}

export interface HolidayConflict {
  eventId: string
  eventTitle: string
  eventStart: string
  eventEnd: string
  holiday: PublicHoliday
  suggestedShiftStart: string
  suggestedShiftEnd: string
}

/**
 * Returns public holidays for a given year and region
 */
export function getHolidaysForYear(year: number, region: HolidayRegion): PublicHoliday[] {
  const holidays: PublicHoliday[] = []

  // Helper for fixed date
  const addFixed = (m: number, d: number, name: string, isMandatory = true) => {
    const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    holidays.push({ date: dateStr, name, region, isMandatory })
  }

  // Universal New Year's Day
  addFixed(1, 1, "New Year's Day")

  if (region === 'US') {
    // MLK Day: 3rd Monday in Jan
    holidays.push({ date: getNthWeekdayOfMonth(year, 1, 1, 3), name: 'Martin Luther King Jr. Day', region, isMandatory: true })
    // Washington's Birthday: 3rd Monday in Feb
    holidays.push({ date: getNthWeekdayOfMonth(year, 2, 1, 3), name: "Washington's Birthday", region, isMandatory: false })
    // Memorial Day: Last Monday in May
    holidays.push({ date: getLastWeekdayOfMonth(year, 5, 1), name: 'Memorial Day', region, isMandatory: true })
    // Juneteenth
    addFixed(6, 19, 'Juneteenth National Independence Day')
    // Independence Day
    addFixed(7, 4, 'Independence Day')
    // Labor Day: 1st Monday in Sep
    holidays.push({ date: getNthWeekdayOfMonth(year, 9, 1, 1), name: 'Labor Day', region, isMandatory: true })
    // Columbus / Indigenous Peoples' Day: 2nd Monday in Oct
    holidays.push({ date: getNthWeekdayOfMonth(year, 10, 1, 2), name: "Columbus / Indigenous Peoples' Day", region, isMandatory: false })
    // Veterans Day
    addFixed(11, 11, 'Veterans Day')
    // Thanksgiving: 4th Thursday in Nov
    holidays.push({ date: getNthWeekdayOfMonth(year, 11, 4, 4), name: 'Thanksgiving Day', region, isMandatory: true })
    // Christmas Day
    addFixed(12, 25, 'Christmas Day')
  } else if (region === 'UK') {
    addFixed(1, 2, '2nd January Bank Holiday')
    addFixed(5, 1, 'Early May Bank Holiday')
    addFixed(5, 29, 'Spring Bank Holiday')
    addFixed(8, 28, 'Summer Bank Holiday')
    addFixed(12, 25, 'Christmas Day')
    addFixed(12, 26, 'Boxing Day')
  } else if (region === 'IN') {
    addFixed(1, 26, 'Republic Day')
    addFixed(8, 15, 'Independence Day')
    addFixed(10, 2, 'Mahatma Gandhi Jayanti')
    addFixed(11, 1, 'Diwali Festival')
    addFixed(12, 25, 'Christmas Day')
  } else if (region === 'DE') {
    addFixed(5, 1, 'Labour Day')
    addFixed(10, 3, 'German Unity Day')
    addFixed(12, 25, 'Christmas Day')
    addFixed(12, 26, '2nd Day of Christmas')
  } else if (region === 'CA') {
    addFixed(7, 1, 'Canada Day')
    holidays.push({ date: getNthWeekdayOfMonth(year, 9, 1, 1), name: 'Labour Day', region, isMandatory: true })
    addFixed(11, 11, 'Remembrance Day')
    addFixed(12, 25, 'Christmas Day')
    addFixed(12, 26, 'Boxing Day')
  } else if (region === 'AU') {
    addFixed(1, 26, 'Australia Day')
    addFixed(4, 25, 'ANZAC Day')
    addFixed(12, 25, 'Christmas Day')
    addFixed(12, 26, 'Boxing Day')
  } else {
    // International
    addFixed(5, 1, 'International Workers Day')
    addFixed(12, 25, 'Christmas Day')
    addFixed(12, 31, "New Year's Eve")
  }

  return holidays
}

function getNthWeekdayOfMonth(year: number, month: number, targetDayOfWeek: number, n: number): string {
  // month is 1-12, targetDayOfWeek is 0=Sun..6=Sat, 1=Mon
  let count = 0
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day)
    if (d.getMonth() !== month - 1) break
    if (d.getDay() === targetDayOfWeek) {
      count++
      if (count === n) {
        return format(d, 'yyyy-MM-dd')
      }
    }
  }
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function getLastWeekdayOfMonth(year: number, month: number, targetDayOfWeek: number): string {
  let lastDate = `${year}-${String(month).padStart(2, '0')}-28`
  for (let day = 31; day >= 20; day--) {
    const d = new Date(year, month - 1, day)
    if (d.getMonth() === month - 1 && d.getDay() === targetDayOfWeek) {
      return format(d, 'yyyy-MM-dd')
    }
  }
  return lastDate
}

/**
 * Checks if a given date string (YYYY-MM-DD) falls on a weekend
 */
export function isWeekend(date: Date): boolean {
  const dow = date.getDay()
  return dow === 0 || dow === 6 // Sun or Sat
}

/**
 * Finds next business day (Mon - Fri) that is not a holiday
 */
export function getNextBusinessDay(date: Date, holidays: PublicHoliday[]): Date {
  let candidate = addDays(date, 1)
  const holidayDates = new Set(holidays.map((h) => h.date))

  while (isWeekend(candidate) || holidayDates.has(format(candidate, 'yyyy-MM-dd'))) {
    candidate = addDays(candidate, 1)
  }
  return candidate
}

/**
 * Finds previous business day (Mon - Fri) that is not a holiday
 */
export function getPreviousBusinessDay(date: Date, holidays: PublicHoliday[]): Date {
  let candidate = addDays(date, -1)
  const holidayDates = new Set(holidays.map((h) => h.date))

  while (isWeekend(candidate) || holidayDates.has(format(candidate, 'yyyy-MM-dd'))) {
    candidate = addDays(candidate, -1)
  }
  return candidate
}

/**
 * Scans all calendar events for collisions with public holidays
 */
export function scanHolidayConflicts(
  events: CalendarEvent[],
  region: HolidayRegion,
  year = new Date().getFullYear()
): HolidayConflict[] {
  const holidays = [
    ...getHolidaysForYear(year, region),
    ...getHolidaysForYear(year + 1, region)
  ]
  const conflicts: HolidayConflict[] = []

  events.forEach((ev) => {
    const start = new Date(ev.start)
    const end = new Date(ev.end)
    const durMs = end.getTime() - start.getTime()

    const matchingHoliday = holidays.find((h) => {
      const hDate = new Date(`${h.date}T00:00:00`)
      return isSameDay(start, hDate)
    })

    if (matchingHoliday) {
      const nextBiz = getNextBusinessDay(start, holidays)
      // Preserve original hour and minutes
      nextBiz.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0)
      const nextBizEnd = new Date(nextBiz.getTime() + durMs)

      conflicts.push({
        eventId: ev.id,
        eventTitle: ev.title || '(Untitled Event)',
        eventStart: ev.start,
        eventEnd: ev.end,
        holiday: matchingHoliday,
        suggestedShiftStart: nextBiz.toISOString(),
        suggestedShiftEnd: nextBizEnd.toISOString()
      })
    }
  })

  return conflicts
}
