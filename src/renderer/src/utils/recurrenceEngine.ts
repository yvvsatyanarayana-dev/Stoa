import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns'
import type { CalendarEvent } from '../../../types'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type MonthlyRecurrenceType = 'day_of_month' | 'nth_weekday' | 'last_business_day'

export interface RecurrenceConfig {
  freq: RecurrenceFrequency
  interval: number
  byDay?: string[] // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  monthlyType?: MonthlyRecurrenceType
  nthWeek?: number // 1, 2, 3, 4, -1
  nthDayOfWeek?: string // 'MO', 'TU', etc.
  endType: 'never' | 'until' | 'count'
  untilDate?: string // YYYY-MM-DD
  count?: number
  exdate?: string[] // ['YYYY-MM-DD', ...]
}

const DAY_NAMES_MAP: Record<string, string> = {
  MO: 'Monday',
  TU: 'Tuesday',
  WE: 'Wednesday',
  TH: 'Thursday',
  FR: 'Friday',
  SA: 'Saturday',
  SU: 'Sunday'
}

/**
 * Builds standard RFC 5545 RRULE string from structured config
 */
export function buildRRuleString(config: RecurrenceConfig): string {
  const parts: string[] = [`FREQ=${config.freq}`]

  if (config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`)
  }

  if (config.freq === 'WEEKLY' && config.byDay && config.byDay.length > 0) {
    parts.push(`BYDAY=${config.byDay.join(',')}`)
  }

  if (config.freq === 'MONTHLY') {
    if (config.monthlyType === 'nth_weekday' && config.nthWeek && config.nthDayOfWeek) {
      parts.push(`BYSETPOS=${config.nthWeek}`)
      parts.push(`BYDAY=${config.nthDayOfWeek}`)
    } else if (config.monthlyType === 'last_business_day') {
      parts.push(`BYSETPOS=-1`)
      parts.push(`BYDAY=MO,TU,WE,TH,FR`)
    }
  }

  if (config.endType === 'until' && config.untilDate) {
    const cleanDate = config.untilDate.replace(/-/g, '')
    parts.push(`UNTIL=${cleanDate}T235959Z`)
  } else if (config.endType === 'count' && config.count && config.count > 0) {
    parts.push(`COUNT=${config.count}`)
  }

  return parts.join(';')
}

/**
 * Parses RFC 5545 RRULE string into structured config
 */
export function parseRRuleString(rruleStr?: string): RecurrenceConfig {
  const defaultConfig: RecurrenceConfig = {
    freq: 'WEEKLY',
    interval: 1,
    byDay: ['MO'],
    endType: 'never'
  }

  if (!rruleStr) return defaultConfig

  const parts = rruleStr.split(';')
  const config: Partial<RecurrenceConfig> = {
    interval: 1,
    endType: 'never'
  }

  parts.forEach((part) => {
    const [key, val] = part.split('=')
    if (!key || !val) return

    switch (key.toUpperCase()) {
      case 'FREQ':
        config.freq = val.toUpperCase() as RecurrenceFrequency
        break
      case 'INTERVAL':
        config.interval = parseInt(val, 10) || 1
        break
      case 'BYDAY':
        config.byDay = val.split(',').map((d) => d.trim().toUpperCase())
        break
      case 'BYSETPOS':
        config.nthWeek = parseInt(val, 10)
        break
      case 'COUNT':
        config.endType = 'count'
        config.count = parseInt(val, 10)
        break
      case 'UNTIL':
        config.endType = 'until'
        if (val.length >= 8) {
          config.untilDate = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`
        }
        break
    }
  })

  if (config.nthWeek === -1 && config.byDay?.join(',') === 'MO,TU,WE,TH,FR') {
    config.monthlyType = 'last_business_day'
  } else if (config.nthWeek && config.byDay && config.byDay.length === 1) {
    config.monthlyType = 'nth_weekday'
    config.nthDayOfWeek = config.byDay[0]
  } else {
    config.monthlyType = 'day_of_month'
  }

  return { ...defaultConfig, ...config }
}

/**
 * Returns human-readable English summary of the recurrence rule
 */
export function getRRuleSummary(rruleStr?: string): string {
  if (!rruleStr) return 'Does not repeat'
  const config = parseRRuleString(rruleStr)

  let freqText = ''
  if (config.freq === 'DAILY') {
    freqText = config.interval === 1 ? 'Every day' : `Every ${config.interval} days`
  } else if (config.freq === 'WEEKLY') {
    if (config.byDay?.join(',') === 'MO,TU,WE,TH,FR') {
      freqText = 'Every weekday (Mon–Fri)'
    } else {
      const daysText = (config.byDay || []).map((d) => DAY_NAMES_MAP[d] || d).join(', ')
      freqText =
        config.interval === 1
          ? `Weekly on ${daysText || 'selected days'}`
          : `Every ${config.interval} weeks on ${daysText || 'selected days'}`
    }
  } else if (config.freq === 'MONTHLY') {
    if (config.monthlyType === 'last_business_day') {
      freqText = 'On the last business day of every month'
    } else if (config.monthlyType === 'nth_weekday' && config.nthWeek && config.nthDayOfWeek) {
      const posMap: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', '-1': 'last' }
      const pos = posMap[config.nthWeek] || `${config.nthWeek}th`
      freqText = `Monthly on the ${pos} ${DAY_NAMES_MAP[config.nthDayOfWeek] || config.nthDayOfWeek}`
    } else {
      freqText = config.interval === 1 ? 'Monthly' : `Every ${config.interval} months`
    }
  } else if (config.freq === 'YEARLY') {
    freqText = config.interval === 1 ? 'Annually' : `Every ${config.interval} years`
  }

  let endText = ''
  if (config.endType === 'until' && config.untilDate) {
    endText = ` until ${config.untilDate}`
  } else if (config.endType === 'count' && config.count) {
    endText = `, ${config.count} times`
  }

  return `${freqText}${endText}`
}

/**
 * Expands recurring events within a given viewing range (e.g., current week or month)
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = []

  events.forEach((ev) => {
    if (!ev.rrule) {
      // Non-recurring event: include if in range
      const evStart = new Date(ev.start)
      const evEnd = new Date(ev.end)
      if (evEnd >= rangeStart && evStart <= rangeEnd) {
        result.push(ev)
      }
      return
    }

    // Process recurring event
    const config = parseRRuleString(ev.rrule)
    const baseStart = new Date(ev.start)
    const baseEnd = new Date(ev.end)
    const durationMs = baseEnd.getTime() - baseStart.getTime()

    const untilDate = config.untilDate ? new Date(`${config.untilDate}T23:59:59`) : null
    const maxCount = config.count || 200

    let current = new Date(baseStart)
    let occurrenceIdx = 0

    // Loop through occurrences up to rangeEnd or maxCount
    while (occurrenceIdx < maxCount) {
      if (untilDate && current > untilDate) break
      if (current > rangeEnd) break

      const occEnd = new Date(current.getTime() + durationMs)
      const currentYMD = format(current, 'yyyy-MM-dd')

      // Check if this date is excluded (EXDATE or holiday skip)
      const isExcluded = config.exdate?.includes(currentYMD)

      if (!isExcluded && occEnd >= rangeStart && current <= rangeEnd) {
        result.push({
          ...ev,
          id: `${ev.id}_occ_${currentYMD}`,
          start: current.toISOString(),
          end: occEnd.toISOString()
        })
      }

      occurrenceIdx++

      // Increment based on frequency
      if (config.freq === 'DAILY') {
        current = addDays(current, config.interval)
      } else if (config.freq === 'WEEKLY') {
        current = addWeeks(current, config.interval)
      } else if (config.freq === 'MONTHLY') {
        current = addMonths(current, config.interval)
      } else if (config.freq === 'YEARLY') {
        current = addYears(current, config.interval)
      } else {
        break
      }
    }
  })

  return result
}
