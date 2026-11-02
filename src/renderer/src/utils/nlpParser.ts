export interface ParsedEvent {
  title: string
  date: string | null        // YYYY-MM-DD
  time: string | null        // HH:MM (24h)
  durationMinutes: number    // default 60
  location: string | null
  rrule: string | null       // RFC 5545 RRULE string
  confidence: number         // 0-100
  ambiguities: string[]      // array of ambiguous parts
}

function getMonday(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1)
  copy.setDate(diff)
  return copy
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nextWeekday(dayName: string): string {
  const days: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  }
  const target = days[dayName.toLowerCase()]
  if (target === undefined) return toYMD(new Date())
  const now = new Date()
  const current = now.getDay()
  let diff = target - current
  if (diff <= 0) diff += 7
  const result = new Date(now)
  result.setDate(now.getDate() + diff)
  return toYMD(result)
}

function thisWeekday(dayName: string): string {
  const days: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  }
  const target = days[dayName.toLowerCase()]
  if (target === undefined) return toYMD(new Date())
  const monday = getMonday(new Date())
  const result = new Date(monday)
  const dayOffset = target === 0 ? 6 : target - 1
  result.setDate(monday.getDate() + dayOffset)
  return toYMD(result)
}

export function parseNaturalLanguage(input: string): ParsedEvent {
  const text = input.trim()
  const ambiguities: string[] = []
  let confidence = 30
  let date: string | null = null
  let time: string | null = null
  let durationMinutes = 60
  let location: string | null = null
  let rrule: string | null = null
  let remaining = text

  // --- DATE PARSING ---
  const todayMatch = remaining.match(/\btoday\b/i)
  const tomorrowMatch = remaining.match(/\btomorrow\b/i)
  const inDaysMatch = remaining.match(/\bin\s+(\d+)\s+days?\b/i)
  const nextDayMatch = remaining.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  const thisDayMatch = remaining.match(/\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  const thisWeekMatch = remaining.match(/\bthis\s+week\b/i)
  const nextWeekMatch = remaining.match(/\bnext\s+week\b/i)
  const specificDateMatch = remaining.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)

  if (todayMatch) {
    date = toYMD(new Date())
    remaining = remaining.replace(todayMatch[0], '')
    confidence += 20
  } else if (tomorrowMatch) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    date = toYMD(d)
    remaining = remaining.replace(tomorrowMatch[0], '')
    confidence += 20
  } else if (inDaysMatch) {
    const d = new Date(); d.setDate(d.getDate() + parseInt(inDaysMatch[1]))
    date = toYMD(d)
    remaining = remaining.replace(inDaysMatch[0], '')
    confidence += 15
  } else if (nextDayMatch) {
    date = nextWeekday(nextDayMatch[1])
    remaining = remaining.replace(nextDayMatch[0], '')
    confidence += 20
  } else if (thisDayMatch) {
    date = thisWeekday(thisDayMatch[1])
    remaining = remaining.replace(thisDayMatch[0], '')
    confidence += 20
  } else if (nextWeekMatch) {
    const d = new Date(); d.setDate(d.getDate() + 7)
    date = toYMD(d)
    remaining = remaining.replace(nextWeekMatch[0], '')
    confidence += 10
    ambiguities.push('Which day next week? Defaulting to same weekday.')
  } else if (thisWeekMatch) {
    date = toYMD(new Date())
    remaining = remaining.replace(thisWeekMatch[0], '')
    confidence += 10
    ambiguities.push('Which day this week? Defaulting to today.')
  } else if (specificDateMatch) {
    const monthMap: Record<string, number> = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
      nov: 10, november: 10, dec: 11, december: 11
    }
    const month = monthMap[specificDateMatch[1].toLowerCase().slice(0, 3)]
    const day = parseInt(specificDateMatch[2])
    const now = new Date()
    let year = now.getFullYear()
    const candidate = new Date(year, month, day)
    if (candidate < now) year++
    date = toYMD(new Date(year, month, day))
    remaining = remaining.replace(specificDateMatch[0], '')
    confidence += 20
  }

  // --- TIME PARSING ---
  const time12hMatch = remaining.match(/\bat?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  const time24hMatch = remaining.match(/\bat?\s*(\d{2}):(\d{2})\b/)
  const timeNakedMatch = remaining.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i)

  if (time12hMatch) {
    let h = parseInt(time12hMatch[1])
    const m = parseInt(time12hMatch[2] || '0')
    const period = time12hMatch[3].toLowerCase()
    if (period === 'pm' && h !== 12) h += 12
    if (period === 'am' && h === 12) h = 0
    time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    remaining = remaining.replace(time12hMatch[0], '')
    confidence += 20
  } else if (time24hMatch) {
    time = `${time24hMatch[1]}:${time24hMatch[2]}`
    remaining = remaining.replace(time24hMatch[0], '')
    confidence += 20
  } else if (timeNakedMatch) {
    let h = parseInt(timeNakedMatch[1])
    const m = parseInt(timeNakedMatch[2] || '0')
    if (h < 8) h += 12 // assume pm for ambiguous hours < 8
    time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    remaining = remaining.replace(timeNakedMatch[0], '')
    confidence += 10
    ambiguities.push(`Time "${timeNakedMatch[0]}" — AM or PM? Assumed ${h >= 12 ? 'PM' : 'AM'}.`)
  }

  // --- DURATION PARSING ---
  const durationMatch = remaining.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(h(?:our)?s?|min(?:ute)?s?)\b/i)
  if (durationMatch) {
    const value = parseFloat(durationMatch[1])
    const unit = durationMatch[2].toLowerCase()
    if (unit.startsWith('h')) {
      durationMinutes = Math.round(value * 60)
    } else {
      durationMinutes = Math.round(value)
    }
    remaining = remaining.replace(durationMatch[0], '')
    confidence += 10
  }

  // --- RECURRENCE PARSING ---
  const rruleMatch = remaining.match(/\bevery\s+(day|week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+(?:st|nd|rd|th)?\s+\w+)\b/i)
  if (rruleMatch) {
    const freq = rruleMatch[1].toLowerCase()
    const dayRRule: Record<string, string> = {
      monday: 'MO', tuesday: 'TU', wednesday: 'WE',
      thursday: 'TH', friday: 'FR', saturday: 'SA', sunday: 'SU'
    }
    if (freq === 'day') {
      rrule = 'FREQ=DAILY'
    } else if (freq === 'week') {
      rrule = 'FREQ=WEEKLY'
    } else if (dayRRule[freq]) {
      rrule = `FREQ=WEEKLY;BYDAY=${dayRRule[freq]}`
    } else {
      rrule = 'FREQ=WEEKLY'
    }
    remaining = remaining.replace(rruleMatch[0], '')
    confidence += 10
  }

  // --- LOCATION PARSING ---
  const locationCapMatch = remaining.match(/\b(?:at|in)\s+([A-Z][^,.\n]+(?:Room|Hall|Office|Center|Centre|Building|Lab)[^,.\n]*)/i)
  if (locationCapMatch) {
    location = locationCapMatch[1].trim()
    remaining = remaining.replace(locationCapMatch[0], '')
    confidence += 5
  } else {
    // Simpler: "at Location" or "in Location"
    const locationSimple = remaining.match(/\b(?:at|in)\s+([A-Z][A-Za-z\s]{2,30})\b/)
    if (locationSimple) {
      const candidate = locationSimple[1].trim()
      // Only treat as location if it doesn't look like a day name
      const dayNames = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday','today','tomorrow']
      if (!dayNames.includes(candidate.toLowerCase())) {
        location = candidate
        remaining = remaining.replace(locationSimple[0], '')
        confidence += 5
      }
    }
  }

  // --- TITLE EXTRACTION ---
  // Remove common stopwords and clean up remaining text
  let title = remaining
    .replace(/\s+/g, ' ')
    .replace(/^(a|an|the|some|my|our|team|staff)\s+/i, '')
    .trim()

  // Remove trailing prepositions/conjunctions
  title = title.replace(/\s+(with|and|for|by|on|at|in)\s*$/i, '').trim()
  title = title.replace(/[,.]$/, '').trim()

  if (!title || title.length < 2) {
    title = 'New Event'
    ambiguities.push('Could not determine event title from input.')
  } else {
    confidence += 10
  }

  // Cap confidence
  confidence = Math.min(100, confidence)

  return {
    title,
    date,
    time,
    durationMinutes,
    location,
    rrule,
    confidence,
    ambiguities
  }
}

// Parse "Find X hours for N people this week" type queries for FreeSlotFinder
export interface ParsedSlotQuery {
  durationMinutes: number
  attendeeCount: number
  daysToSearch: number
  startDate: string
}

export function parseSlotQuery(input: string): ParsedSlotQuery {
  let durationMinutes = 60
  let attendeeCount = 1
  let daysToSearch = 5

  const hoursMatch = input.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?/i)
  const minutesMatch = input.match(/(\d+)\s*min(?:ute)?s?/i)
  if (hoursMatch) durationMinutes = Math.round(parseFloat(hoursMatch[1]) * 60)
  else if (minutesMatch) durationMinutes = parseInt(minutesMatch[1])

  const peopleMatch = input.match(/(\d+)\s*(?:people|persons?|attendees?)/i)
  if (peopleMatch) attendeeCount = parseInt(peopleMatch[1])

  const today = new Date()
  const todayYMD = toYMD(today)

  if (/today/i.test(input)) {
    daysToSearch = 1
  } else if (/tomorrow/i.test(input)) {
    // Start from tomorrow
    const tm = new Date(today)
    tm.setDate(today.getDate() + 1)
    return { durationMinutes, attendeeCount, daysToSearch: 1, startDate: toYMD(tm) }
  } else if (/this\s+week/i.test(input)) {
    daysToSearch = 5
  } else if (/next\s+week/i.test(input)) {
    const nm = new Date(today)
    nm.setDate(today.getDate() + 7)
    return { durationMinutes, attendeeCount, daysToSearch: 5, startDate: toYMD(nm) }
  } else if (/next\s+(\d+)\s+days?/i.test(input)) {
    const m = input.match(/next\s+(\d+)\s+days?/i)
    if (m) daysToSearch = parseInt(m[1])
  }

  return { durationMinutes, attendeeCount, daysToSearch, startDate: todayYMD }
}
