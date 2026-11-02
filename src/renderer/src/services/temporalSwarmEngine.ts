/**
 * Stoa Temporal AI Agent Swarm Engine
 * Real-time Multi-Agent Algorithmic Core
 */

import {
  format,
  addDays,
  parseISO,
  isBefore,
  isAfter,
  differenceInMinutes,
  addMinutes
} from 'date-fns'
import type { CalendarEvent } from '../../../types'
import type {
  SwarmSettings,
  SwarmDecision,
  CandidateMeetingSlot,
  DiplomatNegotiationSession,
  ArchivistBriefing,
  Chronotype
} from '../types/temporalSwarm'

// Helper: parse time string HH:mm to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getChronotypePeakHours(chronotype: Chronotype): { start: number; end: number; idealMeetingStart: number; idealMeetingEnd: number } {
  switch (chronotype) {
    case 'lark':
      return { start: 8 * 60, end: 11 * 60 + 30, idealMeetingStart: 13 * 60 + 30, idealMeetingEnd: 16 * 60 + 30 }
    case 'owl':
      return { start: 14 * 60, end: 18 * 60 + 30, idealMeetingStart: 10 * 60, idealMeetingEnd: 13 * 60 }
    case 'third-bird':
    default:
      return { start: 9 * 60 + 30, end: 13 * 60, idealMeetingStart: 14 * 60, idealMeetingEnd: 17 * 60 }
  }
}

/**
 * SCHEDULER AGENT: Finds chronotype-optimal slots for new meetings
 */
export function findOptimalSlots(
  events: CalendarEvent[],
  durationMinutes: number,
  settings: SwarmSettings,
  daysToLookAhead: number = 7
): CandidateMeetingSlot[] {
  const candidates: CandidateMeetingSlot[] = []
  const today = new Date()
  const dayStartMins = timeToMinutes(settings.hardDayStart)
  const dayEndMins = timeToMinutes(settings.hardDayEnd)
  const peak = getChronotypePeakHours(settings.chronotype)

  for (let d = 1; d <= daysToLookAhead; d++) {
    const targetDate = addDays(today, d)
    const dateStr = format(targetDate, 'yyyy-MM-dd')

    // Filter day events
    const dayEvents = events
      .filter((e) => e.start.startsWith(dateStr) && e.status !== 'cancelled')
      .sort((a, b) => a.start.localeCompare(b.start))

    // Walk through in 30-minute steps
    for (let m = dayStartMins; m + durationMinutes <= dayEndMins; m += 30) {
      const slotStart = `${dateStr}T${minutesToTime(m)}:00`
      const slotEnd = `${dateStr}T${minutesToTime(m + durationMinutes)}:00`

      // Check collision with lunch
      if (settings.protectLunchBreak) {
        const lunchStart = timeToMinutes(settings.lunchWindowStart)
        const lunchEnd = timeToMinutes(settings.lunchWindowEnd)
        if (m < lunchEnd && m + durationMinutes > lunchStart) continue
      }

      // Check collision with calendar events
      const hasConflict = dayEvents.some((e) => {
        const eStart = timeToMinutes(e.start.split('T')[1].slice(0, 5))
        const eEnd = timeToMinutes(e.end.split('T')[1].slice(0, 5))
        return m < eEnd && m + durationMinutes > eStart
      })

      if (!hasConflict) {
        // Calculate intelligence score
        let score = 70
        let rationale = 'Open calendar availability.'

        // Chronotype alignment: meetings are penalized during peak deep work hours
        if (m >= peak.start && m + durationMinutes <= peak.end) {
          score -= 30
          rationale = 'Overlaps peak chronotype deep focus window (sub-optimal for meetings).'
        } else if (m >= peak.idealMeetingStart && m + durationMinutes <= peak.idealMeetingEnd) {
          score += 25
          rationale = 'Ideal chronotype collaborative window (low mental fatigue).'
        }

        // Proximity to existing meetings (clustering reduces fragmentation)
        const isClustered = dayEvents.some((e) => {
          const eStart = timeToMinutes(e.start.split('T')[1].slice(0, 5))
          const eEnd = timeToMinutes(e.end.split('T')[1].slice(0, 5))
          return Math.abs(m - eEnd) === settings.requiredBufferMinutes || Math.abs(eStart - (m + durationMinutes)) === settings.requiredBufferMinutes
        })

        if (isClustered) {
          score += 15
          rationale += ' Well-clustered with buffer, preventing isolated context switching.'
        }

        candidates.push({
          start: slotStart,
          end: slotEnd,
          score: Math.min(100, Math.max(10, score)),
          rationale
        })
      }
    }
  }

  // Sort by score descending and return top 5
  return candidates.sort((a, b) => b.score - a.score).slice(0, 5)
}

/**
 * GUARDIAN AGENT: Detects back-to-back meeting fatigue, protects deep work & hard boundaries
 */
export function runGuardianAnalysis(
  events: CalendarEvent[],
  settings: SwarmSettings
): SwarmDecision[] {
  const decisions: SwarmDecision[] = []
  const today = new Date()
  const dayStartMins = timeToMinutes(settings.hardDayStart)
  const dayEndMins = timeToMinutes(settings.hardDayEnd)
  const peak = getChronotypePeakHours(settings.chronotype)

  for (let d = 0; d < 7; d++) {
    const targetDate = addDays(today, d)
    const dateStr = format(targetDate, 'yyyy-MM-dd')
    const dayName = format(targetDate, 'EEEE')

    const dayEvents = events
      .filter((e) => e.start.startsWith(dateStr) && e.status !== 'cancelled' && !e.title.includes('Recovery Buffer'))
      .sort((a, b) => a.start.localeCompare(b.start))

    // 1. Detect Back-to-Back Meetings needing recovery buffers
    for (let i = 0; i < dayEvents.length - 1; i++) {
      const cur = dayEvents[i]
      const nxt = dayEvents[i + 1]

      const curEnd = parseISO(cur.end)
      const nxtStart = parseISO(nxt.start)
      const gapMins = differenceInMinutes(nxtStart, curEnd)

      // If gap is between 0 and 10 mins (fatigue hazard)
      if (gapMins >= 0 && gapMins < settings.requiredBufferMinutes) {
        const bufferEnd = addMinutes(curEnd, settings.requiredBufferMinutes)
        decisions.push({
          id: `dec-guard-buff-${cur.id}-${d}`,
          agentRole: 'guardian',
          type: 'buffer_inserted',
          title: `Insert 15m Buffer between "${cur.title}" and "${nxt.title}"`,
          details: `Detected back-to-back meeting on ${dayName}. Inserting cognitive recovery buffer to prevent mental fatigue accumulation.`,
          timestamp: new Date().toISOString(),
          impact: 'high',
          applied: false,
          crdtSynced: false,
          eventPayload: {
            title: '☕ Guardian Recovery Buffer',
            start: format(curEnd, "yyyy-MM-dd'T'HH:mm:ss"),
            end: format(bufferEnd, "yyyy-MM-dd'T'HH:mm:ss"),
            description: `Auto-generated by Guardian Agent to protect cognitive continuity between ${cur.title} and ${nxt.title}.`,
            isBuffer: true
          }
        })
      }
    }

    // 2. Shield Peak Deep Work
    if (settings.autoShieldDeepWork) {
      const peakStartTime = `${dateStr}T${minutesToTime(peak.start)}:00`
      const peakEndTime = `${dateStr}T${minutesToTime(peak.end)}:00`

      // Check if any event already interrupts peak deep work
      const overlapsPeak = dayEvents.some((e) => {
        const eStart = timeToMinutes(e.start.split('T')[1].slice(0, 5))
        const eEnd = timeToMinutes(e.end.split('T')[1].slice(0, 5))
        return eStart < peak.end && eEnd > peak.start
      })

      if (!overlapsPeak && d > 0) {
        decisions.push({
          id: `dec-guard-shield-${dateStr}`,
          agentRole: 'guardian',
          type: 'deep_work_shielded',
          title: `Shield Peak Chronotype Focus Block (${dayName} ${minutesToTime(peak.start)} - ${minutesToTime(peak.end)})`,
          details: `Reserved prime 3.5h cognitive flow window tailored to your ${settings.chronotype.toUpperCase()} chronotype.`,
          timestamp: new Date().toISOString(),
          impact: 'high',
          applied: false,
          crdtSynced: false,
          eventPayload: {
            title: '🛡️ Guardian Deep Work Shield',
            start: peakStartTime,
            end: peakEndTime,
            description: `Protected flow state window automatically reserved by Guardian Agent based on ${settings.chronotype} bio-rhythms.`,
            isShield: true
          }
        })
      }
    }

    // 3. Boundary Over-Extension Detection
    dayEvents.forEach((e) => {
      const eEndMins = timeToMinutes(e.end.split('T')[1].slice(0, 5))
      const eStartMins = timeToMinutes(e.start.split('T')[1].slice(0, 5))

      if (eEndMins > dayEndMins) {
        decisions.push({
          id: `dec-guard-bound-${e.id}`,
          agentRole: 'guardian',
          type: 'boundary_protected',
          title: `Boundary Breach: "${e.title}" runs past ${settings.hardDayEnd}`,
          details: `Event on ${dayName} extends past your hard day shutdown boundary. Recommending shifting earlier to safeguard sleep architecture.`,
          timestamp: new Date().toISOString(),
          impact: 'medium',
          applied: false,
          crdtSynced: false
        })
      }

      if (eStartMins < dayStartMins) {
        decisions.push({
          id: `dec-guard-early-${e.id}`,
          agentRole: 'guardian',
          type: 'boundary_protected',
          title: `Early Start Warning: "${e.title}" before ${settings.hardDayStart}`,
          details: `Scheduled before official morning start. May cause circadian desynchronization.`,
          timestamp: new Date().toISOString(),
          impact: 'low',
          applied: false,
          crdtSynced: false
        })
      }
    })
  }

  return decisions
}

/**
 * STRATEGIST AGENT: 14-day balance ratio analysis & crunch forecast
 */
export function runStrategistAnalysis(
  events: CalendarEvent[],
  settings: SwarmSettings
): {
  decisions: SwarmDecision[]
  focusHours: number
  meetingHours: number
  ratioPercent: number
  crunchScore: number
  crunchDays: string[]
} {
  const decisions: SwarmDecision[] = []
  const today = new Date()

  let totalFocusMinutes = 0
  let totalMeetingMinutes = 0
  const dailyMeetingLoads: Record<string, number> = {}

  // Filter 14-day window
  const windowEnd = addDays(today, 14)
  const windowEvents = events.filter((e) => {
    const s = parseISO(e.start)
    return isAfter(s, today) && isBefore(s, windowEnd) && e.status !== 'cancelled'
  })

  windowEvents.forEach((e) => {
    const duration = Math.max(15, differenceInMinutes(parseISO(e.end), parseISO(e.start)))
    const dateKey = e.start.split('T')[0]
    dailyMeetingLoads[dateKey] = (dailyMeetingLoads[dateKey] || 0) + duration

    const isMeeting =
      e.meeting_url ||
      e.title.toLowerCase().includes('sync') ||
      e.title.toLowerCase().includes('meeting') ||
      e.title.toLowerCase().includes('1:1') ||
      e.title.toLowerCase().includes('standup')

    if (isMeeting) {
      totalMeetingMinutes += duration
    } else {
      totalFocusMinutes += duration
    }
  })

  const totalTracked = totalFocusMinutes + totalMeetingMinutes
  const ratioPercent = totalTracked > 0 ? Math.round((totalFocusMinutes / totalTracked) * 100) : 70

  // Detect crunch days (> 4 hours of meetings in a single day)
  const crunchDays = Object.entries(dailyMeetingLoads)
    .filter(([_, mins]) => mins >= settings.maxDailyMeetingHours * 60)
    .map(([date, mins]) => {
      const hours = (mins / 60).toFixed(1)
      const dayName = format(parseISO(date), 'EEEE, MMM d')

      decisions.push({
        id: `dec-strat-crunch-${date}`,
        agentRole: 'strategist',
        type: 'crunch_mitigated',
        title: `Crunch Alert: Heavy Load on ${dayName} (${hours}h meetings)`,
        details: `Cognitive density exceeds threshold (${settings.maxDailyMeetingHours}h max). Strategist suggests offloading low-priority syncs to lower-density days.`,
        timestamp: new Date().toISOString(),
        impact: 'high',
        applied: false,
        crdtSynced: false
      })

      return date
    })

  const crunchScore = Math.min(100, Math.round((crunchDays.length / 10) * 100) + (ratioPercent < settings.targetFocusRatio ? 25 : 0))

  if (ratioPercent < settings.targetFocusRatio) {
    decisions.push({
      id: `dec-strat-ratio-${format(today, 'yyyy-MM-dd')}`,
      agentRole: 'strategist',
      type: 'crunch_mitigated',
      title: `Sub-Optimal Focus Ratio (${ratioPercent}% vs ${settings.targetFocusRatio}% target)`,
      details: `Meeting footprint is consuming focus bandwidth. Strategist recommends condensing fragmented 30m slots into single afternoon batches.`,
      timestamp: new Date().toISOString(),
      impact: 'medium',
      applied: false,
      crdtSynced: false
    })
  }

  return {
    decisions,
    focusHours: Number((totalFocusMinutes / 60).toFixed(1)),
    meetingHours: Number((totalMeetingMinutes / 60).toFixed(1)),
    ratioPercent,
    crunchScore,
    crunchDays
  }
}

/**
 * ARCHIVIST AGENT: Historical pattern synthesis & weekly retrospective
 */
export function runArchivistSynthesis(
  events: CalendarEvent[],
  settings: SwarmSettings
): ArchivistBriefing {
  const today = new Date()
  const weekStart = addDays(today, -7)
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(today, 'yyyy-MM-dd')

  const pastEvents = events.filter((e) => {
    const s = parseISO(e.start)
    return isAfter(s, weekStart) && isBefore(s, today) && e.status !== 'cancelled'
  })

  let focusMinutes = 0
  let meetingMinutes = 0
  let contextSwitches = 0

  pastEvents.forEach((e) => {
    const dur = Math.max(15, differenceInMinutes(parseISO(e.end), parseISO(e.start)))
    if (e.title.toLowerCase().includes('sync') || e.title.toLowerCase().includes('meeting') || e.meeting_url) {
      meetingMinutes += dur
      contextSwitches += 1
    } else {
      focusMinutes += dur
    }
  })

  const totalMins = focusMinutes + meetingMinutes
  const ratio = totalMins > 0 ? Math.round((focusMinutes / totalMins) * 100) : 100

  let productivityScore = 80
  if (totalMins === 0) {
    productivityScore = 70
  } else {
    if (ratio >= settings.targetFocusRatio) productivityScore += 15
    else productivityScore -= Math.min(30, Math.round((settings.targetFocusRatio - ratio) * 0.8))

    if (contextSwitches > 12) productivityScore -= Math.min(25, (contextSwitches - 12) * 2)
  }

  productivityScore = Math.max(30, Math.min(99, productivityScore))

  const fatigueRisk: ArchivistBriefing['fatigueRisk'] =
    productivityScore >= 80 ? 'optimal' : productivityScore >= 65 ? 'moderate' : productivityScore >= 50 ? 'elevated' : 'severe'

  const focusHrs = Number((focusMinutes / 60).toFixed(1))
  const meetHrs = Number((meetingMinutes / 60).toFixed(1))

  const insights: string[] = []
  if (pastEvents.length === 0) {
    insights.push('No events tracked in the past 7 days. Add calendar entries to enable deep cognitive velocity tracking.')
    insights.push(`Chronotype configured for ${settings.chronotype.toUpperCase()} bio-rhythm windows.`)
  } else {
    insights.push(`Logged ${focusHrs}h of uninterrupted deep work across the past 7 days.`)
    insights.push(`Executed ${contextSwitches} discrete cognitive transitions with an average session of ${(totalMins / Math.max(1, pastEvents.length)).toFixed(0)} mins.`)
    insights.push(`Current ratio: ${ratio}% focus volume vs ${100 - ratio}% collaboration.`)
  }

  const recommendations: string[] = []
  if (ratio < settings.targetFocusRatio) {
    recommendations.push(`Decline or batch low-priority syncs to recover your target ${settings.targetFocusRatio}% focus ratio.`)
  } else {
    recommendations.push('Maintain current meeting batching—your deep focus velocity is well-protected.')
  }
  recommendations.push('Keep 15-minute recovery buffers enabled between back-to-back calls to mitigate context switching penalties.')

  const summaryText = pastEvents.length > 0
    ? `Over the past week, your temporal equilibrium scored ${productivityScore}/100 with ${meetHrs}h spent in collaboration and ${focusHrs}h in deep flow. Cognitive fatigue risk is currently categorized as ${fatigueRisk.toUpperCase()}.`
    : `Archivist initialized. Schedule upcoming calendar meetings to compute real-time cognitive metrics.`

  return {
    id: `brief-${weekStartStr}`,
    weekStartDate: weekStartStr,
    weekEndDate: weekEndStr,
    generatedAt: new Date().toISOString(),
    productivityScore,
    focusHours: focusHrs,
    meetingHours: meetHrs,
    ratioPercent: ratio,
    contextSwitches,
    fatigueRisk,
    topInsights: insights,
    recommendations,
    summaryText
  }
}

/**
 * DIPLOMAT AGENT: Peer-to-Peer Autonomous Meeting Negotiation
 */
export function negotiateDiplomatSlots(
  peerName: string,
  meetingTitle: string,
  durationMinutes: number,
  events: CalendarEvent[],
  settings: SwarmSettings,
  targetPeerId?: string
): DiplomatNegotiationSession {
  const candidateSlots = findOptimalSlots(events, durationMinutes, settings, 7)
  const agreed = candidateSlots.length > 0 ? candidateSlots[0] : null

  const confidence = agreed ? Math.round(agreed.score) : 0
  const rounds = agreed ? (agreed.score >= 80 ? 1 : agreed.score >= 60 ? 2 : 3) : 0

  return {
    sessionId: `neg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initiatorPeerId: 'peer-local-user',
    initiatorPeerName: 'You (Local Swarm)',
    targetPeerId: targetPeerId || `peer-${peerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    targetPeerName: peerName,
    meetingTitle,
    durationMinutes,
    urgency: 'normal',
    state: agreed ? 'consensus_reached' : 'probing_slots',
    candidateSlots,
    agreedSlot: agreed ? { start: agreed.start, end: agreed.end } : undefined,
    rounds,
    consensusConfidence: confidence,
    updatedAt: new Date().toISOString()
  }
}
