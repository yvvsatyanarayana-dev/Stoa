import type { CalendarEvent, FreeSlotRequest, FreeSlotOption } from '../../types'
import { parseISO, addDays, format, isSameDay } from 'date-fns'

export type { FreeSlotRequest, FreeSlotOption }

export function findCommonFreeSlots(
  events: CalendarEvent[],
  req: FreeSlotRequest
): FreeSlotOption[] {
  const {
    durationMinutes,
    startDate,
    daysToSearch = 5,
    workingHoursStart = '09:00',
    workingHoursEnd = '17:00',
    targetResourceIds = []
  } = req

  const [workStartH, workStartM] = workingHoursStart.split(':').map(Number)
  const [workEndH, workEndM] = workingHoursEnd.split(':').map(Number)

  const relevantEvents = events.filter((e) => {
    if (e.status === 'cancelled') return false
    if (targetResourceIds.length === 0) return true
    if (!e.resources || e.resources.length === 0) return true
    return e.resources.some((r) => targetResourceIds.includes(r.id))
  })

  const results: FreeSlotOption[] = []
  const baseDate = parseISO(startDate)

  // Step through each day
  for (let dayOffset = 0; dayOffset < daysToSearch; dayOffset++) {
    const currentDay = addDays(baseDate, dayOffset)
    // Skip weekends if seeking business slots
    const dayOfWeek = currentDay.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    const dayStr = format(currentDay, 'yyyy-MM-dd')
    const dayEvents = relevantEvents.filter((e) => isSameDay(parseISO(e.start), currentDay))

    // Discretize day into 15-minute intervals between workingHoursStart and workingHoursEnd
    const totalMinutes = (workEndH * 60 + workEndM) - (workStartH * 60 + workStartM)
    const slotCount = Math.floor(totalMinutes / 15)

    // Interval availability array (15 min buckets)
    const isBusy = new Array(slotCount).fill(false)

    dayEvents.forEach((evt) => {
      const eStart = new Date(evt.start)
      const eEnd = new Date(evt.end)

      const eStartMin = eStart.getHours() * 60 + eStart.getMinutes() - (workStartH * 60 + workStartM)
      const eEndMin = eEnd.getHours() * 60 + eEnd.getMinutes() - (workStartH * 60 + workStartM)

      const startBucket = Math.max(0, Math.floor(eStartMin / 15))
      const endBucket = Math.min(slotCount, Math.ceil(eEndMin / 15))

      for (let b = startBucket; b < endBucket; b++) {
        isBusy[b] = true
      }
    })

    // Find consecutive free intervals of durationMinutes
    const neededBuckets = Math.ceil(durationMinutes / 15)
    for (let i = 0; i <= slotCount - neededBuckets; i++) {
      let allFree = true
      for (let b = 0; b < neededBuckets; b++) {
        if (isBusy[i + b]) {
          allFree = false
          break
        }
      }

      if (allFree) {
        const slotStartTotalMin = (workStartH * 60 + workStartM) + i * 15
        const slotEndTotalMin = slotStartTotalMin + durationMinutes

        const sH = Math.floor(slotStartTotalMin / 60)
        const sM = slotStartTotalMin % 60
        const eH = Math.floor(slotEndTotalMin / 60)
        const eM = slotEndTotalMin % 60

        const startIso = new Date(`${dayStr}T${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00`).toISOString()
        const endIso = new Date(`${dayStr}T${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00`).toISOString()

        // Score: Morning slots (10:00 - 12:00) & early afternoon (14:00 - 15:30) get bonus
        let score = 80
        if (sH >= 10 && sH <= 12) score += 15
        if (sH >= 14 && sH <= 15) score += 10
        if (dayOffset === 0) score += 5 // sooner is better

        let reason = 'Zero conflicts across all selected attendees and rooms'
        if (sH >= 10 && sH <= 12) reason = 'Prime business focus window (10:00 - 12:00)'
        else if (sH >= 14 && sH <= 16) reason = 'Afternoon collaboration window'

        results.push({
          start: startIso,
          end: endIso,
          date: dayStr,
          timeRange: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')} - ${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
          score,
          recommendedReason: reason
        })

        // Advance 30 min to offer diverse alternatives rather than 15-min increments
        i += 1
      }
    }
  }

  // Sort by score descending and return top 8 recommendations
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 8)
}
