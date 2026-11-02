/**
 * Cross-Dimensional Calendar Engine
 * Mathematical Multi-Axis Analysis & Pareto Frontier Optimization Core
 */

import type { CalendarEvent, Resource } from '../../../types'
import type { BiometricProfile } from '../types/burnout'
import type {
  DimensionVector,
  DimensionKPI,
  ParetoSimulationParams,
  ParetoFrontierPoint,
  SankeyFlowLink,
  CrossDimensionalSettings
} from '../types/crossDimensional'
import { differenceInMinutes, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export const DEFAULT_CD_SETTINGS: CrossDimensionalSettings = {
  defaultHourlyRate: 150,
  billableTagKeywords: ['client', 'billable', 'contract', 'consulting', 'project-a', 'delivery'],
  clientMeetingKeywords: ['client', 'customer', 'demo', 'pitch', 'stakeholder', 'vendor'],
  internalMeetingKeywords: ['sync', 'standup', 'planning', 'retro', '1:1', 'catchup', 'all-hands'],
  deepWorkKeywords: ['focus', 'deep work', 'coding', 'architecture', 'research', 'writing', 'study']
}

/**
 * Computes exact 6D vector from active SQLite calendar events and resources
 */
export function computeDimensionVector(
  events: CalendarEvent[],
  resources: Resource[],
  biometricProfile?: BiometricProfile,
  settings: CrossDimensionalSettings = DEFAULT_CD_SETTINGS,
  referenceDate: Date = new Date()
): DimensionVector {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

  // 1. Filter events active within this calendar week
  const weekEvents = events.filter((e) => {
    if (e.status === 'cancelled') return false
    try {
      const s = parseISO(e.start)
      return isWithinInterval(s, { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  }).sort((a, b) => a.start.localeCompare(b.start))

  // --- DIMENSION 1: TIME ---
  let totalScheduledMins = 0
  let meetingMins = 0
  let deepWorkMins = 0
  let clientBillableMins = 0
  let oneOnOneMins = 0
  let overtimeMins = 0

  const attendeeInteractionMap = new Map<string, number>()
  let contextSwitchCount = 0
  let maxContinuousFocusMins = 0
  let previousEventEnd: Date | null = null
  let previousCategory = ''

  weekEvents.forEach((evt) => {
    const s = new Date(evt.start)
    const e = new Date(evt.end)
    const durMins = Math.max(15, differenceInMinutes(e, s))
    totalScheduledMins += durMins

    const titleLower = (evt.title || '').toLowerCase()
    const descLower = (evt.description || '').toLowerCase()
    const fullText = `${titleLower} ${descLower}`

    // Overtime tracking (before 08:00 or after 18:30)
    const startHour = s.getHours() + s.getMinutes() / 60
    const endHour = e.getHours() + e.getMinutes() / 60
    if (startHour < 8.0 || endHour > 18.5) {
      overtimeMins += durMins
    }

    // Deep work vs Meeting identification
    const isExplicitDeep = settings.deepWorkKeywords.some((k) => fullText.includes(k))
    const isMeeting =
      (evt.attendees && evt.attendees.length > 1) ||
      settings.clientMeetingKeywords.some((k) => fullText.includes(k)) ||
      settings.internalMeetingKeywords.some((k) => fullText.includes(k))

    if (isExplicitDeep && !isMeeting) {
      deepWorkMins += durMins
      if (durMins > maxContinuousFocusMins) {
        maxContinuousFocusMins = durMins
      }
    } else if (isMeeting || evt.attendees && evt.attendees.length > 0) {
      meetingMins += durMins
    } else {
      // General task / admin block
      deepWorkMins += Math.round(durMins * 0.5)
    }

    // Billable check
    const isBillable = settings.billableTagKeywords.some((k) => fullText.includes(k))
    if (isBillable) {
      clientBillableMins += durMins
    }

    // 1:1 Meeting check
    const isOneOnOne =
      (evt.attendees && evt.attendees.length === 1) ||
      titleLower.includes('1:1') ||
      titleLower.includes('1-on-1') ||
      titleLower.includes('sync with')
    if (isOneOnOne) {
      oneOnOneMins += durMins
    }

    // Track social relationship interaction graph
    if (evt.attendees && Array.isArray(evt.attendees)) {
      evt.attendees.forEach((att) => {
        const idOrName = att.name || att.email || 'Peer'
        const currentMins = attendeeInteractionMap.get(idOrName) || 0
        attendeeInteractionMap.set(idOrName, currentMins + durMins)
      })
    }

    // Context switch detection
    if (previousEventEnd) {
      const gapMins = differenceInMinutes(s, previousEventEnd)
      const currentCat = evt.category_id || evt.title.split(' ')[0]
      if (gapMins >= 0 && gapMins < 45 && previousCategory !== currentCat) {
        contextSwitchCount++
      }
    }
    previousEventEnd = e
    previousCategory = evt.category_id || evt.title.split(' ')[0]
  })

  // Rest Buffer Calculation
  const totalWorkHours = totalScheduledMins / 60
  const meetingHours = meetingMins / 60
  const deepWorkHours = deepWorkMins / 60
  const billableHours = clientBillableMins / 60
  const oneOnOneHours = oneOnOneMins / 60
  const overtimeHours = overtimeMins / 60

  // 168 Total hours in a week: derive sleep needs from live biometric profile (default 8h if unconfigured)
  const nightlySleepGoal = biometricProfile?.avgSleepHours || 8
  const sleepRestHours = nightlySleepGoal * 7
  const discretionaryRestHours = Math.max(0, 168 - sleepRestHours - totalWorkHours)

  // --- DIMENSION 2: ENERGY (HRV & Battery %) ---
  // High meeting load and overtime drain battery; deep work with adequate buffers preserves energy
  let baseBattery = 92
  baseBattery -= (meetingHours * 1.35)
  baseBattery -= (overtimeHours * 2.2)
  baseBattery += Math.min(15, deepWorkHours * 0.6)
  if (biometricProfile) {
    if (biometricProfile.chronotype === 'early-bird' && overtimeHours > 2) baseBattery -= 6
    if (biometricProfile.chronotype === 'night-owl' && totalWorkHours > 45) baseBattery -= 5
  }
  const energyBatteryPct = Math.max(12, Math.min(99, Math.round(baseBattery)))
  const energyDrainKcalEst = Math.round(totalWorkHours * 115 + meetingHours * 75)
  const peakAlignmentPct = Math.min(100, Math.max(25, Math.round((deepWorkHours / Math.max(1, deepWorkHours + meetingHours)) * 100)))

  // --- DIMENSION 3: ATTENTION (Focus Points 0-100) ---
  let focusScore = 75
  focusScore += Math.round(deepWorkHours * 2.2)
  focusScore -= Math.round(contextSwitchCount * 3.5)
  focusScore -= Math.round(meetingHours * 1.1)
  const attentionFocusPoints = Math.max(10, Math.min(100, Math.round(focusScore)))
  const attentionFragmentation = Math.min(1.0, parseFloat(((contextSwitchCount * 0.08) + (meetingHours * 0.02)).toFixed(2)))

  // --- DIMENSION 4: MONEY ($/hr Value & Opportunity Cost) ---
  const hourlyRate = settings.defaultHourlyRate || 150
  // Gross value generated: billable hours at full rate + deep work architectural leverage at 1.4x
  const moneyGrossValueUsd = Math.round((billableHours * hourlyRate) + (deepWorkHours * hourlyRate * 1.4))
  // Opportunity cost: internal sync meetings that consumed capacity without direct client revenue
  const internalMeetingHours = Math.max(0, meetingHours - billableHours)
  const moneyOpportunityCostUsd = Math.round(internalMeetingHours * hourlyRate)
  const moneyEffectiveHourlyRate = totalWorkHours > 0 ? Math.round(moneyGrossValueUsd / totalWorkHours) : hourlyRate

  // --- DIMENSION 5: RELATIONSHIPS (Trust Capital 0-100) ---
  const distinctPeersCount = attendeeInteractionMap.size + resources.filter((r) => r.type === 'person').length
  let trustCapital = 45
  trustCapital += Math.min(30, distinctPeersCount * 5)
  trustCapital += Math.min(25, oneOnOneHours * 7)
  const relationshipTrustCapital = Math.max(15, Math.min(100, Math.round(trustCapital)))
  const socialEntropy = Math.min(1.0, parseFloat((distinctPeersCount / Math.max(1, distinctPeersCount + 5)).toFixed(2)))

  // --- DIMENSION 6: HEALTH (Stress Load Index 0-100, Lower is Better) ---
  let stressLoad = 25
  stressLoad += (meetingHours * 2.0)
  stressLoad += (overtimeHours * 4.5)
  stressLoad += (contextSwitchCount * 1.8)
  stressLoad -= (deepWorkHours * 0.8)
  const healthStressLoad = Math.max(10, Math.min(98, Math.round(stressLoad)))
  const healthRecoveryAdequacy = Math.max(15, Math.min(100, Math.round((discretionaryRestHours / 45) * 100)))

  return {
    timeScheduledHours: parseFloat(totalWorkHours.toFixed(1)),
    timeDeepWorkHours: parseFloat(deepWorkHours.toFixed(1)),
    timeMeetingHours: parseFloat(meetingHours.toFixed(1)),
    timeRestBufferHours: parseFloat(discretionaryRestHours.toFixed(1)),

    energyBatteryPct,
    energyDrainKcalEst,
    energyPeakHourAlignmentPct: peakAlignmentPct,

    attentionFocusPoints,
    attentionContextSwitches: contextSwitchCount,
    attentionLongestFocusBlockMins: maxContinuousFocusMins,
    attentionFragmentationIndex: attentionFragmentation,

    moneyGrossValueUsd,
    moneyOpportunityCostUsd,
    moneyHourlyEffectiveRate: moneyEffectiveHourlyRate,
    moneyBillableHours: parseFloat(billableHours.toFixed(1)),

    relationshipTrustCapital,
    relationshipActivePeersCount: distinctPeersCount,
    relationshipOneOnOneHours: parseFloat(oneOnOneHours.toFixed(1)),
    relationshipEntropyScore: socialEntropy,

    healthStressLoad,
    healthOvertimeHours: parseFloat(overtimeHours.toFixed(1)),
    healthCircadianDisruptionScore: Math.min(100, Math.round(overtimeHours * 12)),
    healthRecoveryAdequacyPct: healthRecoveryAdequacy
  }
}

/**
 * Recomputes all 6 dimensions instantaneously when user drags a Pareto slider
 */
export function simulateParetoAdjustment(
  baseline: DimensionVector,
  params: ParetoSimulationParams
): DimensionVector {
  const meetingFactor = 1 + params.meetingReductionPct / 100
  const simMeetingHours = Math.max(0, parseFloat((baseline.timeMeetingHours * meetingFactor).toFixed(1)))
  const meetingDeltaHours = simMeetingHours - baseline.timeMeetingHours

  // Reallocated delta: freed meeting time converts into deep work (70%) and rest (30%)
  const simDeepWorkHours = Math.max(
    0,
    parseFloat((params.targetDeepWorkHours + (meetingDeltaHours < 0 ? Math.abs(meetingDeltaHours) * 0.7 : 0)).toFixed(1))
  )
  const simTotalWorkHours = parseFloat((simMeetingHours + simDeepWorkHours).toFixed(1))
  const simRestHours = Math.max(0, parseFloat((168 - 56 - simTotalWorkHours).toFixed(1)))

  // Energy recomputation
  const energyDelta = (-meetingDeltaHours * 2.8) + (simDeepWorkHours > baseline.timeDeepWorkHours ? 6 : -3)
  const simEnergy = Math.max(15, Math.min(99, Math.round(baseline.energyBatteryPct + energyDelta)))

  // Attention recomputation
  const attentionDelta = (-meetingDeltaHours * 3.4) + ((simDeepWorkHours - baseline.timeDeepWorkHours) * 2.1)
  const simAttention = Math.max(10, Math.min(100, Math.round(baseline.attentionFocusPoints + attentionDelta)))

  // Money recomputation
  const rate = params.hourlyBillingRate || baseline.moneyHourlyEffectiveRate || 150
  // Deep work generates 1.4x architectural leverage
  const simGrossMoney = Math.round((simDeepWorkHours * rate * 1.4) + (baseline.moneyBillableHours * rate))
  const simOpportunityCost = Math.round(simMeetingHours * rate * 0.75)

  // Relationships recomputation (slight tradeoff: reducing meetings slightly lowers 1:1 trust if not protected)
  const relationshipDelta = meetingDeltaHours * 0.9 + (params.targetOneOnOneHours * 2.5)
  const simRelationships = Math.max(15, Math.min(100, Math.round(baseline.relationshipTrustCapital + relationshipDelta)))

  // Health / Stress recomputation
  const stressDelta = (meetingDeltaHours * 3.8) - ((simRestHours - baseline.timeRestBufferHours) * 0.9)
  const simStress = Math.max(10, Math.min(98, Math.round(baseline.healthStressLoad + stressDelta)))

  return {
    timeScheduledHours: simTotalWorkHours,
    timeDeepWorkHours: simDeepWorkHours,
    timeMeetingHours: simMeetingHours,
    timeRestBufferHours: simRestHours,

    energyBatteryPct: simEnergy,
    energyDrainKcalEst: Math.round(simTotalWorkHours * 115 + simMeetingHours * 75),
    energyPeakHourAlignmentPct: Math.min(100, Math.round((simDeepWorkHours / Math.max(1, simTotalWorkHours)) * 100)),

    attentionFocusPoints: simAttention,
    attentionContextSwitches: Math.max(0, Math.round(baseline.attentionContextSwitches * meetingFactor)),
    attentionLongestFocusBlockMins: Math.round(baseline.attentionLongestFocusBlockMins * (simDeepWorkHours / Math.max(1, baseline.timeDeepWorkHours))),
    attentionFragmentationIndex: Math.max(0.1, parseFloat((baseline.attentionFragmentationIndex * meetingFactor).toFixed(2))),

    moneyGrossValueUsd: simGrossMoney,
    moneyOpportunityCostUsd: simOpportunityCost,
    moneyHourlyEffectiveRate: rate,
    moneyBillableHours: baseline.moneyBillableHours,

    relationshipTrustCapital: simRelationships,
    relationshipActivePeersCount: baseline.relationshipActivePeersCount,
    relationshipOneOnOneHours: params.targetOneOnOneHours,
    relationshipEntropyScore: baseline.relationshipEntropyScore,

    healthStressLoad: simStress,
    healthOvertimeHours: baseline.healthOvertimeHours,
    healthCircadianDisruptionScore: baseline.healthCircadianDisruptionScore,
    healthRecoveryAdequacyPct: Math.min(100, Math.round((simRestHours / 45) * 100))
  }
}

/**
 * Builds KPI summaries across all 6 dimensions
 */
export function extractDimensionKPIs(current: DimensionVector, baseline?: DimensionVector): DimensionKPI[] {
  const base = baseline || current

  return [
    {
      label: 'Time Allocated',
      raw: current.timeScheduledHours,
      normalizedScore: Math.min(100, Math.round((current.timeDeepWorkHours / Math.max(1, current.timeScheduledHours)) * 100)),
      unit: 'hrs/wk',
      status: current.timeScheduledHours > 52 ? 'critical' : current.timeScheduledHours > 42 ? 'moderate' : 'optimal',
      trend: current.timeScheduledHours >= base.timeScheduledHours ? 'up' : 'down',
      deltaPct: Math.round(((current.timeScheduledHours - base.timeScheduledHours) / Math.max(1, base.timeScheduledHours)) * 100),
      description: `${current.timeDeepWorkHours}h deep work • ${current.timeMeetingHours}h meetings • ${current.timeRestBufferHours}h rest`
    },
    {
      label: 'Energy Battery',
      raw: current.energyBatteryPct,
      normalizedScore: current.energyBatteryPct,
      unit: '% cap',
      status: current.energyBatteryPct < 40 ? 'critical' : current.energyBatteryPct < 70 ? 'moderate' : 'optimal',
      trend: current.energyBatteryPct >= base.energyBatteryPct ? 'up' : 'down',
      deltaPct: current.energyBatteryPct - base.energyBatteryPct,
      description: `HRV correlated battery capacity • ${current.energyDrainKcalEst} kcal estimated cognitive expenditure`
    },
    {
      label: 'Attention Depth',
      raw: current.attentionFocusPoints,
      normalizedScore: current.attentionFocusPoints,
      unit: 'pts',
      status: current.attentionFocusPoints < 45 ? 'critical' : current.attentionFocusPoints < 75 ? 'moderate' : 'optimal',
      trend: current.attentionFocusPoints >= base.attentionFocusPoints ? 'up' : 'down',
      deltaPct: current.attentionFocusPoints - base.attentionFocusPoints,
      description: `${current.attentionContextSwitches} context switches • ${current.attentionLongestFocusBlockMins}m continuous focus streak`
    },
    {
      label: 'Economic Output',
      raw: current.moneyGrossValueUsd,
      normalizedScore: Math.min(100, Math.round((current.moneyGrossValueUsd / Math.max(1000, (current.moneyHourlyEffectiveRate || 150) * 40)) * 100)),
      unit: '$ USD',
      status: current.moneyOpportunityCostUsd > 1800 ? 'critical' : 'optimal',
      trend: current.moneyGrossValueUsd >= base.moneyGrossValueUsd ? 'up' : 'down',
      deltaPct: Math.round(((current.moneyGrossValueUsd - base.moneyGrossValueUsd) / Math.max(1, base.moneyGrossValueUsd)) * 100),
      description: `$${current.moneyHourlyEffectiveRate}/hr yield • $${current.moneyOpportunityCostUsd} internal meeting drag`
    },
    {
      label: 'Relationship Capital',
      raw: current.relationshipTrustCapital,
      normalizedScore: current.relationshipTrustCapital,
      unit: 'trust index',
      status: current.relationshipTrustCapital < 40 ? 'critical' : current.relationshipTrustCapital < 70 ? 'moderate' : 'optimal',
      trend: current.relationshipTrustCapital >= base.relationshipTrustCapital ? 'up' : 'down',
      deltaPct: current.relationshipTrustCapital - base.relationshipTrustCapital,
      description: `${current.relationshipActivePeersCount} collaborators • ${current.relationshipOneOnOneHours}h high-trust 1:1s`
    },
    {
      label: 'Health & Stress',
      raw: current.healthStressLoad,
      normalizedScore: 100 - current.healthStressLoad, // Inverted: lower stress = higher score
      unit: 'stress index',
      status: current.healthStressLoad > 68 ? 'critical' : current.healthStressLoad > 45 ? 'moderate' : 'optimal',
      trend: current.healthStressLoad <= base.healthStressLoad ? 'down' : 'up',
      deltaPct: current.healthStressLoad - base.healthStressLoad,
      description: `${current.healthOvertimeHours}h overtime • ${current.healthRecoveryAdequacyPct}% restorative recovery window`
    }
  ]
}

/**
 * Generates points along the multi-objective Pareto Frontier
 */
export function generateParetoFrontierPoints(current: DimensionVector): ParetoFrontierPoint[] {
  const currentUtility = Math.round(
    (current.energyBatteryPct + current.attentionFocusPoints + (100 - current.healthStressLoad) + current.relationshipTrustCapital) / 4
  )

  return [
    {
      id: 'current',
      label: 'Current Schedule',
      meetingHours: current.timeMeetingHours,
      deepWorkHours: current.timeDeepWorkHours,
      energyScore: current.energyBatteryPct,
      attentionScore: current.attentionFocusPoints,
      moneyScore: Math.min(100, Math.round((current.moneyGrossValueUsd / Math.max(1000, (current.moneyHourlyEffectiveRate || 150) * 40)) * 100)),
      relationshipScore: current.relationshipTrustCapital,
      healthScore: 100 - current.healthStressLoad,
      overallParetoUtility: currentUtility,
      isCurrentSchedule: true
    },
    {
      id: 'aggressive_flow',
      label: 'Hyper-Focus Monastic',
      meetingHours: Math.max(2, parseFloat((current.timeMeetingHours * 0.35).toFixed(1))),
      deepWorkHours: Math.min(38, parseFloat((current.timeDeepWorkHours + 14).toFixed(1))),
      energyScore: 88,
      attentionScore: 96,
      moneyScore: 92,
      relationshipScore: 48,
      healthScore: 82,
      overallParetoUtility: 81,
      isParetoOptimal: true
    },
    {
      id: 'max_revenue',
      label: 'High-Volume Commercial',
      meetingHours: Math.min(32, parseFloat((current.timeMeetingHours + 8).toFixed(1))),
      deepWorkHours: Math.max(10, parseFloat((current.timeDeepWorkHours * 0.8).toFixed(1))),
      energyScore: 54,
      attentionScore: 58,
      moneyScore: 98,
      relationshipScore: 85,
      healthScore: 44,
      overallParetoUtility: 68
    },
    {
      id: 'vitality_first',
      label: 'Regenerative Longevity',
      meetingHours: Math.max(4, parseFloat((current.timeMeetingHours * 0.5).toFixed(1))),
      deepWorkHours: Math.min(22, parseFloat((current.timeDeepWorkHours * 0.9).toFixed(1))),
      energyScore: 95,
      attentionScore: 84,
      moneyScore: 70,
      relationshipScore: 78,
      healthScore: 94,
      overallParetoUtility: 84,
      isParetoOptimal: true
    },
    {
      id: 'pareto_golden',
      label: 'Pareto Optimal Equilibrium',
      meetingHours: Math.max(6, parseFloat((current.timeMeetingHours * 0.7).toFixed(1))),
      deepWorkHours: Math.min(28, parseFloat((current.timeDeepWorkHours + 6).toFixed(1))),
      energyScore: 86,
      attentionScore: 89,
      moneyScore: 88,
      relationshipScore: 82,
      healthScore: 85,
      overallParetoUtility: 86,
      isParetoOptimal: true
    }
  ]
}

/**
 * Computes Sankey flow links decomposing 168 weekly hours
 */
export function computeSankeyFlows(v: DimensionVector, profile?: BiometricProfile): SankeyFlowLink[] {
  // Dynamically compute sleep budget from chronotype or standard 7-8h restorative window
  const dailySleep = profile?.chronotype === 'early-bird' ? 8 : profile?.chronotype === 'night-owl' ? 7.5 : 7.8
  const sleep = Math.round(dailySleep * 7)
  const scheduled = v.timeScheduledHours
  const discretionary = Math.max(0, 168 - sleep - scheduled)
  const billable = v.moneyBillableHours
  const internalMeetings = Math.max(0, v.timeMeetingHours - billable)
  const deepWork = v.timeDeepWorkHours
  const administrative = Math.max(0, scheduled - deepWork - v.timeMeetingHours)

  return [
    // Layer 1: 168 Total Life Budget -> Categories
    { source: '168h Weekly Budget', target: 'Sleep & Recovery', value: sleep, color: '#38bdf8' },
    { source: '168h Weekly Budget', target: 'Scheduled Work', value: scheduled, color: '#a855f7' },
    { source: '168h Weekly Budget', target: 'Free Discretionary', value: discretionary, color: '#34d399' },

    // Layer 2: Scheduled Work -> Outputs
    { source: 'Scheduled Work', target: 'Deep Focus & Architecture', value: deepWork, color: '#6366f1' },
    { source: 'Scheduled Work', target: 'Client Billable Revenue', value: billable, color: '#eab308' },
    { source: 'Scheduled Work', target: 'Internal Team Syncs', value: internalMeetings, color: '#f97316' },
    { source: 'Scheduled Work', target: 'Operational Admin', value: administrative, color: '#71717a' },

    // Layer 3: Social & Life Balance
    { source: 'Free Discretionary', target: '1:1 Social Relationships', value: v.relationshipOneOnOneHours, color: '#ec4899' },
    { source: 'Free Discretionary', target: 'Physical Health & Sports', value: Math.max(4, Math.round(discretionary * 0.3)), color: '#10b981' }
  ]
}
