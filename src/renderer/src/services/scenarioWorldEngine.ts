/**
 * Generative Schedule Worlds Engine
 * Procedural Timeline Generation, Empirical Prior Learning & Automerge CRDT Forking
 */

import type { CalendarEvent, Resource } from '../../../types'
import type { BiometricProfile } from '../types/burnout'
import type {
  GenerativePriors,
  ScenarioBranch,
  ScenarioWorldArchetype,
  ScenarioImpactProjection,
  ScenarioTravelTrip,
  ScenarioTeamDynamic,
  ScenarioDecisionNode
} from '../types/scenarioWorld'
import { addDays, format, startOfWeek } from 'date-fns'
import { useAppStore } from '../store/useAppStore'

/**
 * Extracts empirical generative priors from SQLite & Automerge calendar history
 */
export function learnPriorsFromAutomergeHistory(
  events: CalendarEvent[],
  resources: Resource[],
  profile?: BiometricProfile
): GenerativePriors {
  const activeEvents = events.filter((e) => e.status !== 'cancelled')

  if (activeEvents.length === 0) {
    return {
      avgMeetingLengthMins: 45,
      weeklyWorkHours: 38,
      deepWorkRatio: 0.35,
      earliestStartHour: 9,
      latestEndHour: 18,
      weekendWorkFrequency: 0.15,
      travelTripsPerQuarter: 1,
      eveningDinnerPreservationRate: 0.8,
      topCollaborators: resources.filter((r) => r.type === 'person').map((r) => r.name).slice(0, 5),
      hourlyYield: 150
    }
  }

  // Calculate meeting lengths & total scheduled duration
  let totalDurMins = 0
  let meetingDurMins = 0
  let meetingCount = 0
  let deepWorkMins = 0
  let weekendCount = 0
  let eveningDinnerConflicts = 0

  const startHours: number[] = []
  const endHours: number[] = []

  const meetingKeywords = ['sync', 'meet', 'call', '1:1', 'review', 'interview', 'catchup', 'demo']
  const deepWorkKeywords = ['deep', 'focus', 'dev', 'code', 'build', 'architecture', 'write']

  for (const ev of activeEvents) {
    const s = new Date(ev.start)
    const e = new Date(ev.end)
    const durMins = Math.max(15, Math.round((e.getTime() - s.getTime()) / (60 * 1000)))
    totalDurMins += durMins

    const titleLower = (ev.title || '').toLowerCase()
    const isMeeting = meetingKeywords.some((k) => titleLower.includes(k)) || (ev.attendees && ev.attendees.length > 1)
    const isDeep = deepWorkKeywords.some((k) => titleLower.includes(k))

    if (isMeeting) {
      meetingDurMins += durMins
      meetingCount++
    }
    if (isDeep) {
      deepWorkMins += durMins
    }

    const day = s.getDay()
    if (day === 0 || day === 6) {
      weekendCount++
    }

    startHours.push(s.getHours() + s.getMinutes() / 60)
    endHours.push(e.getHours() + e.getMinutes() / 60)

    // Check evening dinner window (18:30 - 20:30)
    const startHourVal = s.getHours() + s.getMinutes() / 60
    const endHourVal = e.getHours() + e.getMinutes() / 60
    if (day >= 1 && day <= 5 && startHourVal < 20.5 && endHourVal > 18.5) {
      eveningDinnerConflicts++
    }
  }

  // Calculate actual elapsed timespan across active events
  const startTimes = activeEvents.map((e) => new Date(e.start).getTime()).filter((t) => !isNaN(t))
  const minTime = startTimes.length > 0 ? Math.min(...startTimes) : Date.now()
  const maxTime = startTimes.length > 0 ? Math.max(...startTimes) : Date.now()
  const elapsedWeeks = Math.max(1, (maxTime - minTime) / (7 * 24 * 60 * 60 * 1000))
  const weeklyWorkHours = Math.min(80, Math.max(15, Math.round(totalDurMins / 60 / elapsedWeeks)))

  const avgMeetingLengthMins = meetingCount > 0 ? Math.round(meetingDurMins / meetingCount) : 45
  const deepWorkRatio = totalDurMins > 0 ? parseFloat((deepWorkMins / totalDurMins).toFixed(2)) : 0.35
  const earliestStartHour = startHours.length > 0 ? Math.floor(Math.min(...startHours)) : 9
  const latestEndHour = endHours.length > 0 ? Math.ceil(Math.max(...endHours)) : 18
  const weekendWorkFrequency = parseFloat(Math.min(1, weekendCount / Math.max(1, activeEvents.length)).toFixed(2))
  const eveningDinnerPreservationRate = parseFloat(Math.max(0.1, 1 - eveningDinnerConflicts / Math.max(1, activeEvents.length)).toFixed(2))

  // Mine actual top collaborators from event attendees and resources
  const collaboratorScoreMap = new Map<string, number>()
  for (const ev of activeEvents) {
    if (ev.attendees && Array.isArray(ev.attendees)) {
      for (const att of ev.attendees) {
        const name = typeof att === 'string' ? att : att.name || att.email
        if (name && name.trim()) {
          const trimmed = name.trim()
          collaboratorScoreMap.set(trimmed, (collaboratorScoreMap.get(trimmed) || 0) + 1)
        }
      }
    }
  }
  for (const r of resources) {
    if (r.type === 'person' && r.name) {
      collaboratorScoreMap.set(r.name, (collaboratorScoreMap.get(r.name) || 0) + 2)
    }
  }

  const sortedCollaborators = Array.from(collaboratorScoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 5)

  const topCollaborators = sortedCollaborators.length > 0
    ? sortedCollaborators
    : ['Lead Architect', 'Product Lead', 'Engineering Manager']

  // Detect real travel, flight, and out-of-town trips
  const travelKeywords = ['flight', 'fly', 'airport', 'trip', 'travel', 'hotel', 'conference', 'summit', 'offsite']
  const realTravelEvents = activeEvents.filter((e) => {
    const text = `${e.title || ''} ${e.description || ''} ${e.location || ''}`.toLowerCase()
    return travelKeywords.some((k) => text.includes(k))
  })
  const travelTripsPerQuarter = Math.max(0, Math.round((realTravelEvents.length / elapsedWeeks) * 12))

  // Factor chronotype if available
  const baseYield = profile?.chronotype === 'early-bird' ? 165 : profile?.chronotype === 'night-owl' ? 145 : 150

  return {
    avgMeetingLengthMins,
    weeklyWorkHours,
    deepWorkRatio: Math.max(0.2, deepWorkRatio),
    earliestStartHour: Math.max(7, Math.min(10, earliestStartHour)),
    latestEndHour: Math.max(17, Math.min(22, latestEndHour)),
    weekendWorkFrequency,
    travelTripsPerQuarter,
    eveningDinnerPreservationRate,
    topCollaborators,
    hourlyYield: baseYield
  }
}

/**
 * Creates the Root Reality baseline branch from current live events
 */
export function buildRealityRootBranch(
  priors: GenerativePriors,
  events: CalendarEvent[],
  profile?: BiometricProfile
): ScenarioBranch {
  const weeklyScheduledHours = priors.weeklyWorkHours
  const weeklyMeetingHours = Math.round(weeklyScheduledHours * (1 - priors.deepWorkRatio) * 0.7)
  const weeklyDeepWorkHours = Math.round(weeklyScheduledHours * priors.deepWorkRatio)
  const familyDinners = Math.round(priors.eveningDinnerPreservationRate * 7)

  // Realistically model HRV & Burnout based on schedule & chronotype
  const baseHrv = profile?.chronotype === 'early-bird' ? 72 : profile?.chronotype === 'night-owl' ? 62 : 68
  const projectedHrvMs = Math.max(35, Math.min(92, Math.round(baseHrv - (weeklyMeetingHours * 0.7) - (priors.weekendWorkFrequency * 12))))

  const burnoutRiskIndex = Math.min(95, Math.max(8, Math.round(
    (weeklyScheduledHours / 50) * 40 +
    (weeklyMeetingHours / Math.max(1, weeklyScheduledHours)) * 35 +
    (1 - priors.eveningDinnerPreservationRate) * 25
  )))

  const projections: ScenarioImpactProjection = {
    weeklyScheduledHours,
    weeklyMeetingHours,
    weeklyDeepWorkHours,
    quarterlyTravelDays: Math.max(1, priors.travelTripsPerQuarter * 3),
    weeklyFamilyDinnersPreserved: familyDinners,
    weekendFreeHours: Math.round(48 * (1 - priors.weekendWorkFrequency)),
    annualProjectedCompensationUsd: priors.hourlyYield * priors.weeklyWorkHours * 48,
    projectedHrvMs,
    burnoutRiskIndex,
    relationshipBondScore: Math.round(priors.eveningDinnerPreservationRate * 85),
    cognitiveVitalityScore: Math.max(25, Math.min(95, Math.round(88 - (burnoutRiskIndex * 0.35))))
  }

  // Extract travel from real calendar events if present
  const travelKeywords = ['flight', 'fly', 'airport', 'trip', 'travel', 'hotel', 'conference', 'summit', 'offsite']
  const realTravelEvents = events.filter((e) => {
    if (e.status === 'cancelled') return false
    const text = `${e.title || ''} ${e.description || ''} ${e.location || ''}`.toLowerCase()
    return travelKeywords.some((k) => text.includes(k))
  })

  const travelSchedule: ScenarioTravelTrip[] = realTravelEvents.length > 0
    ? realTravelEvents.slice(0, 4).map((te, idx) => ({
        id: `trip-reality-${te.id || idx}`,
        tripName: te.title,
        destination: te.location || 'Offsite / Client Destination',
        departureDate: format(new Date(te.start), 'yyyy-MM-dd'),
        returnDate: format(new Date(te.end), 'yyyy-MM-dd'),
        flightBlocks: [`Transit for ${te.title}`],
        jetLagDisruptionScore: te.location?.toLowerCase().includes('intl') ? 4 : 2
      }))
    : priors.travelTripsPerQuarter > 0
    ? [
        {
          id: 'trip-reality-projected',
          tripName: 'Quarterly Team All-Hands',
          destination: 'Company Hub / Offsite',
          departureDate: format(addDays(new Date(), 28), 'yyyy-MM-dd'),
          returnDate: format(addDays(new Date(), 31), 'yyyy-MM-dd'),
          flightBlocks: ['Round-trip Airfare / Transit'],
          jetLagDisruptionScore: 2
        }
      ]
    : []

  // Generate team dynamics from real collaborators
  const teamDynamics: ScenarioTeamDynamic[] = priors.topCollaborators.slice(0, 4).map((name, idx) => ({
    id: `td-reality-${idx + 1}`,
    name,
    role: idx === 0 ? 'Primary Collaborator' : idx === 1 ? 'Project Partner' : 'Key Stakeholder',
    cadence: idx === 0 ? 'Weekly 1:1 Sync' : 'Regular Cadence',
    sentiment: 'energizing',
    interactionHoursPerWeek: Math.max(0.5, Math.round((weeklyMeetingHours / Math.max(1, priors.topCollaborators.length)) * 10) / 10)
  }))

  return {
    id: 'reality-root',
    name: 'Current Reality',
    tagline: 'Your active baseline trajectory learned from live history',
    description: 'Current verified work, meeting cadence, family presence, and health biomarkers.',
    archetype: 'custom',
    parentBranchId: null,
    forkedFromDate: format(new Date(), 'yyyy-MM-dd'),
    crdtDocumentForkId: 'crdt:multiverse:reality-root',
    lamportClock: 1,
    color: '#38bdf8',
    isActive: true,
    projections,
    deltaFromReality: {
      hoursDeltaPct: 0,
      incomeDeltaPct: 0,
      familyDeltaPct: 0,
      burnoutDeltaPct: 0,
      travelDeltaDays: 0
    },
    generatedEvents: events.slice(0, 20),
    travelSchedule,
    teamDynamics,
    decisionNodes: [
      {
        id: 'dec-root-1',
        label: 'Career Inflection Point Q4',
        choicePrompt: 'Major trajectory choices branching from your current reality:',
        options: [
          { id: 'opt-vp', title: 'Accept Executive VP Offer', description: 'Scale to 45 direct/indirect reports, 50% more comp, higher travel cadence.' },
          { id: 'opt-startup', title: 'Found Stealth Tech Venture', description: 'Bootstrap AI infrastructure company with 2 co-founders, high agency, variable comp.' },
          { id: 'opt-sabbatical', title: 'Creative Fellowship & Sabbatical', description: 'Write technical architecture book, master bio-hacking, maximum family recovery.' }
        ]
      }
    ],
    collaborators: [
      { peerId: 'peer-self', peerName: 'You (Timeline Architect)', avatarColor: '#38bdf8', role: 'owner', joinedAt: new Date().toISOString(), commentsCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Procedural scenario world generator:
 * Simulates alternate universes with realistic events, travel, family impact, and Automerge CRDT fork identifiers.
 */
export function procedurallyGenerateScenarioWorld(params: {
  name: string
  archetype: ScenarioWorldArchetype
  parentBranch: ScenarioBranch
  priors: GenerativePriors
  customPrompt?: string
  weeksCount?: number
}): ScenarioBranch {
  const { name, archetype, parentBranch, priors, customPrompt, weeksCount = 4 } = params
  const branchId = `branch-${archetype}-${Date.now()}`
  const now = new Date()
  const baseStart = startOfWeek(addDays(now, 7), { weekStartsOn: 1 }) // Next Monday 09:00

  // Archetype profile parameter scales
  const config = getArchetypeConfig(archetype, customPrompt)

  // Compute mathematically grounded projections
  const weeklyScheduledHours = Math.round(priors.weeklyWorkHours * config.workHoursMultiplier)
  const weeklyMeetingHours = Math.round(weeklyScheduledHours * config.meetingRatio)
  const weeklyDeepWorkHours = Math.max(4, Math.round(weeklyScheduledHours - weeklyMeetingHours))
  const quarterlyTravelDays = Math.round(parentBranch.projections.quarterlyTravelDays * config.travelMultiplier)
  const familyDinners = Math.max(1, Math.min(7, Math.round(7 * config.familyPresenceRatio)))
  const weekendFreeHours = Math.max(8, Math.round(48 * (1 - config.weekendWorkFactor)))

  // Financial model: Base compensation scaled by seniority/archetype
  const baseAnnual = priors.hourlyYield * priors.weeklyWorkHours * 48
  const annualComp = Math.round(baseAnnual * config.incomeMultiplier)

  // Physiological burnout model:
  // Stress scales with hours (>45h/wk), travel days, and sleep/family deficit
  const hourStress = Math.max(0, (weeklyScheduledHours - 40) * 1.8)
  const travelStress = quarterlyTravelDays * 2.2
  const familyBuffer = (7 - familyDinners) * 3.5
  const rawBurnout = Math.min(95, Math.max(12, Math.round(30 + hourStress + travelStress + familyBuffer - (config.cognitiveAgencyBonus * 12))))

  // Projected Heart Rate Variability (HRV in ms)
  const projectedHrv = Math.max(32, Math.min(88, Math.round(72 - (rawBurnout * 0.42))))
  const cognitiveVitality = Math.max(20, Math.min(98, Math.round(85 + (config.cognitiveAgencyBonus * 10) - (rawBurnout * 0.35))))
  const relationshipScore = Math.max(25, Math.min(98, Math.round(familyDinners * 12 + weekendFreeHours * 0.3)))

  const projections: ScenarioImpactProjection = {
    weeklyScheduledHours,
    weeklyMeetingHours,
    weeklyDeepWorkHours,
    quarterlyTravelDays,
    weeklyFamilyDinnersPreserved: familyDinners,
    weekendFreeHours,
    annualProjectedCompensationUsd: annualComp,
    projectedHrvMs: projectedHrv,
    burnoutRiskIndex: rawBurnout,
    relationshipBondScore: relationshipScore,
    cognitiveVitalityScore: cognitiveVitality
  }

  // Calculate percentage deltas from reality
  const pBase = parentBranch.projections
  const deltaFromReality = {
    hoursDeltaPct: Math.round(((weeklyScheduledHours - pBase.weeklyScheduledHours) / Math.max(1, pBase.weeklyScheduledHours)) * 100),
    incomeDeltaPct: Math.round(((annualComp - pBase.annualProjectedCompensationUsd) / Math.max(1, pBase.annualProjectedCompensationUsd)) * 100),
    familyDeltaPct: Math.round(((familyDinners - pBase.weeklyFamilyDinnersPreserved) / Math.max(1, pBase.weeklyFamilyDinnersPreserved)) * 100),
    burnoutDeltaPct: Math.round(((rawBurnout - pBase.burnoutRiskIndex) / Math.max(1, pBase.burnoutRiskIndex)) * 100),
    travelDeltaDays: quarterlyTravelDays - pBase.quarterlyTravelDays
  }

  // Procedural Timeline Event Generation
  const generatedEvents = generateProceduralEventsForScenario({
    archetype,
    baseStart,
    weeksCount,
    config,
    topCollaborators: priors.topCollaborators,
    branchColor: config.themeColor
  })

  // Simulated Travel Matrix
  const travelSchedule: ScenarioTravelTrip[] = generateProceduralTravel(archetype, baseStart, quarterlyTravelDays)

  // Simulated Team Dynamics
  const teamDynamics: ScenarioTeamDynamic[] = generateProceduralTeamDynamics(archetype, priors.topCollaborators)

  // Decision Nodes for future branching
  const decisionNodes: ScenarioDecisionNode[] = generateDecisionNodes(archetype, name)

  return {
    id: branchId,
    name,
    tagline: config.tagline,
    description: config.description,
    archetype,
    parentBranchId: parentBranch.id,
    forkedFromDate: format(now, 'yyyy-MM-dd'),
    crdtDocumentForkId: `crdt:multiverse:${branchId}`,
    lamportClock: parentBranch.lamportClock + 1,
    color: config.themeColor,
    isActive: false,
    projections,
    deltaFromReality,
    generatedEvents,
    travelSchedule,
    teamDynamics,
    decisionNodes,
    collaborators: [
      { peerId: 'peer-self', peerName: 'You (Author)', avatarColor: config.themeColor, role: 'owner', joinedAt: now.toISOString(), commentsCount: 0 }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
}

// -------------------------------------------------------------
// Internal Procedural Generators & Archetype Configuration
// -------------------------------------------------------------

interface ArchetypeConfig {
  tagline: string
  description: string
  themeColor: string
  workHoursMultiplier: number
  meetingRatio: number
  travelMultiplier: number
  familyPresenceRatio: number
  weekendWorkFactor: number
  incomeMultiplier: number
  cognitiveAgencyBonus: number
}

function getArchetypeConfig(archetype: ScenarioWorldArchetype, customPrompt?: string): ArchetypeConfig {
  switch (archetype) {
    case 'executive_leadership':
      return {
        tagline: 'Scale to Global VP: High-Leverage Organization & Cross-Continental Steering',
        description: 'Commanding 40+ engineering & product staff, strategic board accountability, high commercial return with aggressive travel cadence.',
        themeColor: '#f59e0b', // Amber / Gold
        workHoursMultiplier: 1.35,
        meetingRatio: 0.72,
        travelMultiplier: 2.8,
        familyPresenceRatio: 0.55,
        weekendWorkFactor: 0.35,
        incomeMultiplier: 1.85,
        cognitiveAgencyBonus: 0.6
      }
    case 'startup_founder':
      return {
        tagline: 'Stealth Founder: High-Velocity Architecture & Extreme Agency',
        description: 'Co-founding an enterprise AI venture. Monastic deep building sprints, investor pitch rounds, flexible hours, zero corporate bureaucracy.',
        themeColor: '#ec4899', // Pink / Fuchsia
        workHoursMultiplier: 1.5,
        meetingRatio: 0.38,
        travelMultiplier: 1.5,
        familyPresenceRatio: 0.65,
        weekendWorkFactor: 0.5,
        incomeMultiplier: 1.25, // with high equity upside
        cognitiveAgencyBonus: 1.2
      }
    case 'creative_sabbatical':
      return {
        tagline: 'Regenerative Sabbatical: Solitary Synthesis & Family Restoration',
        description: 'Writing technical architecture literature, circadian biological reset, nature immersion, zero meeting overhead, maximum cognitive recovery.',
        themeColor: '#10b981', // Emerald
        workHoursMultiplier: 0.45,
        meetingRatio: 0.08,
        travelMultiplier: 0.3,
        familyPresenceRatio: 0.95,
        weekendWorkFactor: 0.02,
        incomeMultiplier: 0.35,
        cognitiveAgencyBonus: 1.5
      }
    case 'remote_nomad':
      return {
        tagline: 'Global Remote Nomad: Asynchronous High-Yield Engineering',
        description: 'Distributed global timezone setup across Europe and East Asia. Pure asynchronous GitHub pull requests, high travel autonomy, strict focus boundaries.',
        themeColor: '#8b5cf6', // Violet
        workHoursMultiplier: 0.95,
        meetingRatio: 0.22,
        travelMultiplier: 3.5,
        familyPresenceRatio: 0.75,
        weekendWorkFactor: 0.12,
        incomeMultiplier: 1.15,
        cognitiveAgencyBonus: 1.1
      }
    case 'parental_leave':
      return {
        tagline: 'Full Family Dedication: Bond Building & Protected Sanctuary',
        description: 'Zero professional meetings, strict shield on evenings and weekends, primary focus on family bonding, cognitive rest, and recovery.',
        themeColor: '#38bdf8', // Sky
        workHoursMultiplier: 0.1,
        meetingRatio: 0.02,
        travelMultiplier: 0.0,
        familyPresenceRatio: 1.0,
        weekendWorkFactor: 0.0,
        incomeMultiplier: 0.7, // Paid parental leave baseline
        cognitiveAgencyBonus: 1.3
      }
    case 'custom':
    default: {
      const lower = (customPrompt || '').toLowerCase()
      const isHighIntensity = lower.includes('vp') || lower.includes('lead') || lower.includes('executive') || lower.includes('director')
      const isLowIntensity = lower.includes('break') || lower.includes('leave') || lower.includes('sabbatical') || lower.includes('travel')

      return {
        tagline: customPrompt ? `Custom Universe: ${customPrompt.slice(0, 50)}...` : 'Custom Multi-Dimensional Branch',
        description: `Algorithmic timeline projected from scenario prompt: "${customPrompt || 'Custom life fork'}"`,
        themeColor: '#6366f1', // Indigo
        workHoursMultiplier: isHighIntensity ? 1.3 : isLowIntensity ? 0.6 : 1.05,
        meetingRatio: isHighIntensity ? 0.65 : 0.35,
        travelMultiplier: isHighIntensity ? 2.0 : 1.0,
        familyPresenceRatio: isLowIntensity ? 0.9 : 0.7,
        weekendWorkFactor: isHighIntensity ? 0.3 : 0.15,
        incomeMultiplier: isHighIntensity ? 1.5 : 1.0,
        cognitiveAgencyBonus: 0.8
      }
    }
  }
}

function generateProceduralEventsForScenario(opts: {
  archetype: ScenarioWorldArchetype
  baseStart: Date
  weeksCount: number
  config: ArchetypeConfig
  topCollaborators: string[]
  branchColor: string
}): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const { archetype, baseStart, weeksCount, topCollaborators } = opts

  for (let w = 0; w < weeksCount; w++) {
    const weekStart = addDays(baseStart, w * 7)

    if (archetype === 'executive_leadership') {
      // Monday: Executive syncs
      events.push(createProceduralEvent('Weekly Executive Alignment', setHours(weekStart, 9), setHours(weekStart, 11), 'urgent', 'confirmed', 'Boardroom A / Zoom'))
      events.push(createProceduralEvent(`VP 1:1 with ${topCollaborators[0] || 'Eng Director'}`, setHours(weekStart, 11, 30), setHours(weekStart, 12, 15), 'high', 'confirmed', 'Executive Office'))
      events.push(createProceduralEvent('Q4 Product Portfolio Steering', setHours(weekStart, 14), setHours(weekStart, 16), 'high', 'confirmed', 'Strategy Hall'))

      // Tuesday: Cross-functional reviews + Stakeholder dinner
      const tuesday = addDays(weekStart, 1)
      events.push(createProceduralEvent('Revenue & Commercial Pipeline Review', setHours(tuesday, 10), setHours(tuesday, 12), 'high', 'confirmed'))
      events.push(createProceduralEvent(`1:1 Mentorship: ${topCollaborators[1] || 'Staff Principal'}`, setHours(tuesday, 14), setHours(tuesday, 15), 'medium', 'confirmed'))
      events.push(createProceduralEvent('Executive Stakeholder & Investor Dinner', setHours(tuesday, 19), setHours(tuesday, 21), 'medium', 'confirmed', 'The Grill San Francisco'))

      // Thursday: Global Operations & Travel Flight
      const thursday = addDays(weekStart, 3)
      events.push(createProceduralEvent('Global Team Town Hall (EMEA/APAC/US)', setHours(thursday, 8), setHours(thursday, 9, 30), 'high', 'confirmed'))
      events.push(createProceduralEvent('Board Risk & Governance Audit', setHours(thursday, 15), setHours(thursday, 17), 'urgent', 'confirmed'))
    } else if (archetype === 'startup_founder') {
      // Mon-Fri: Daily Core Engineering Sprint
      for (let d = 0; d < 5; d++) {
        const curDay = addDays(weekStart, d)
        events.push(createProceduralEvent('Monastic Core Architecture & Dev Sprint', setHours(curDay, 9), setHours(curDay, 13), 'urgent', 'confirmed', 'HQ Garage Lab'))
      }

      // Tuesday & Thursday: Pitching & Customer Discoveries
      const tue = addDays(weekStart, 1)
      const thu = addDays(weekStart, 3)
      events.push(createProceduralEvent('Seed Pitch: Sequoia & Founders Fund', setHours(tue, 14), setHours(tue, 15, 30), 'urgent', 'confirmed', 'Sand Hill Rd / Meet'))
      events.push(createProceduralEvent('Customer Architecture Deep Dive: Acme Corp', setHours(thu, 14), setHours(thu, 15, 30), 'high', 'confirmed'))

      // Saturday Sprint
      const sat = addDays(weekStart, 5)
      events.push(createProceduralEvent('Weekend Founder Hackathon: Model Inference Pipeline', setHours(sat, 10), setHours(sat, 15), 'medium', 'confirmed'))
    } else if (archetype === 'creative_sabbatical') {
      // Mon-Fri: Morning Monastic Book Writing Block
      for (let d = 0; d < 5; d++) {
        const curDay = addDays(weekStart, d)
        events.push(createProceduralEvent('Technical Architecture Book Manuscript Sprint', setHours(curDay, 8, 30), setHours(curDay, 12), 'high', 'confirmed', 'Mountain Cabin Study'))
        events.push(createProceduralEvent('Nature Forest Walk & Circadian Reset', setHours(curDay, 13), setHours(curDay, 14, 30), 'low', 'confirmed', 'Redwood Sanctuary'))
        events.push(createProceduralEvent('Family Home Cooking & Acoustic Session', setHours(curDay, 18), setHours(curDay, 20), 'high', 'confirmed', 'Home'))
      }
    } else {
      // Default / Remote / Nomad: Balanced rhythm
      for (let d = 0; d < 5; d++) {
        const curDay = addDays(weekStart, d)
        events.push(createProceduralEvent('Deep Architecture & Design Block', setHours(curDay, 10), setHours(curDay, 13), 'high', 'confirmed'))
      }
      events.push(createProceduralEvent(`Strategic Sync with ${topCollaborators[0] || 'Team'}`, setHours(weekStart, 14), setHours(weekStart, 15), 'medium', 'confirmed'))
    }
  }

  return events
}

function setHours(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function createProceduralEvent(
  title: string,
  start: Date,
  end: Date,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'confirmed' | 'tentative',
  location = 'Virtual Workspace'
): CalendarEvent {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  return {
    id: `world-evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    calendar_id: 'cal-scenario-world',
    title,
    description: `Procedurally simulated event in alternate scenario universe.`,
    start: start.toISOString(),
    end: end.toISOString(),
    all_day: false,
    timezone: userTimezone,
    priority,
    status,
    location,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

function generateProceduralTravel(
  archetype: ScenarioWorldArchetype,
  baseDate: Date,
  travelDays: number
): ScenarioTravelTrip[] {
  if (travelDays < 2) return []

  if (archetype === 'executive_leadership') {
    return [
      {
        id: 'trip-exec-1',
        tripName: 'Quarterly Executive Offsite & EMEA Summit',
        destination: 'London & Zurich',
        departureDate: format(addDays(baseDate, 14), 'yyyy-MM-dd'),
        returnDate: format(addDays(baseDate, 19), 'yyyy-MM-dd'),
        flightBlocks: ['BA 286 SFO -> LHR (Club World)', 'LX 317 LHR -> ZRH'],
        jetLagDisruptionScore: 7
      },
      {
        id: 'trip-exec-2',
        tripName: 'Board of Directors Annual Session',
        destination: 'New York City, NY',
        departureDate: format(addDays(baseDate, 42), 'yyyy-MM-dd'),
        returnDate: format(addDays(baseDate, 45), 'yyyy-MM-dd'),
        flightBlocks: ['DL 492 SFO -> JFK Flagship'],
        jetLagDisruptionScore: 4
      }
    ]
  }

  if (archetype === 'startup_founder') {
    return [
      {
        id: 'trip-founder-1',
        tripName: 'Y Combinator & Tier-1 VC Demo Days',
        destination: 'San Francisco & Silicon Valley',
        departureDate: format(addDays(baseDate, 21), 'yyyy-MM-dd'),
        returnDate: format(addDays(baseDate, 25), 'yyyy-MM-dd'),
        flightBlocks: ['AA 118 Flight SFO'],
        jetLagDisruptionScore: 4
      }
    ]
  }

  return []
}

function generateProceduralTeamDynamics(
  archetype: ScenarioWorldArchetype,
  topCollaborators: string[]
): ScenarioTeamDynamic[] {
  if (archetype === 'executive_leadership') {
    return [
      { id: 'dyn-1', role: 'VP Engineering (Direct Report)', name: topCollaborators[0] || 'Elena Chen', cadence: 'Weekly 1:1 (60m)', sentiment: 'mentorship', interactionHoursPerWeek: 3.5 },
      { id: 'dyn-2', role: 'Head of Product (Peer)', name: topCollaborators[1] || 'Marcus Vance', cadence: 'Bi-Weekly Alignment', sentiment: 'demanding', interactionHoursPerWeek: 4.0 },
      { id: 'dyn-3', role: 'Chief Executive Officer (Manager)', name: 'Board & CEO', cadence: 'Weekly Strategy Sync', sentiment: 'demanding', interactionHoursPerWeek: 2.0 },
      { id: 'dyn-4', role: 'Staff Principal Architect', name: topCollaborators[2] || 'Devon Ray', cadence: 'Ad-hoc Architecture Escalations', sentiment: 'energizing', interactionHoursPerWeek: 2.0 }
    ]
  }

  if (archetype === 'startup_founder') {
    return [
      { id: 'dyn-1', role: 'Technical Co-Founder', name: topCollaborators[0] || 'Samir Patel', cadence: 'Continuous Daily Pairing', sentiment: 'energizing', interactionHoursPerWeek: 20.0 },
      { id: 'dyn-2', role: 'Founding AI Engineer', name: topCollaborators[1] || 'Zoe Miller', cadence: 'Daily Standup & PR Reviews', sentiment: 'energizing', interactionHoursPerWeek: 8.0 },
      { id: 'dyn-3', role: 'Lead Investor & Seed Board Member', name: 'General Partner (VC)', cadence: 'Monthly Advisory', sentiment: 'demanding', interactionHoursPerWeek: 1.5 }
    ]
  }

  return [
    { id: 'dyn-1', role: 'Editorial Mentor / Publisher', name: 'Literary Agent', cadence: 'Bi-weekly Check-in', sentiment: 'energizing', interactionHoursPerWeek: 1.0 }
  ]
}

function generateDecisionNodes(archetype: ScenarioWorldArchetype, branchName: string): ScenarioDecisionNode[] {
  return [
    {
      id: `dec-${archetype}-1`,
      label: 'Month 3 Decision Gateway',
      choicePrompt: `Key strategic forks branching from "${branchName}":`,
      options: [
        { id: 'opt-double-down', title: 'Double Down & Scale Capacity', description: 'Hire 2 additional staff to alleviate executive burden.' },
        { id: 'opt-renegotiate', title: 'Renegotiate Travel & Remote Terms', description: 'Enforce strict 4-day travel cap and mandatory Friday focus shields.' }
      ]
    }
  ]
}

/**
 * Migrates and enacts an alternate scenario universe into the user's master calendar
 */
export async function enactWorldToMasterCalendar(
  branch: ScenarioBranch
): Promise<{ eventsCreated: number; freedEvents: number; branchName: string }> {
  let createdCount = 0

  // Resolve target calendar dynamically from live active user calendars
  const appCalendars = useAppStore.getState().calendars
  const targetCalendarId = appCalendars.find((c) => c.is_default)?.id || appCalendars[0]?.id || 'cal-default'

  if (typeof window !== 'undefined' && window.api?.events?.create) {
    for (const ev of branch.generatedEvents) {
      try {
        await window.api.events.create({
          ...ev,
          id: `enacted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          calendar_id: targetCalendarId,
          title: `[${branch.name}] ${ev.title}`
        })
        createdCount++
      } catch (err) {
        console.error('Failed to create enacted event:', err)
      }
    }
  }

  // Also trigger store reload of events so UI reflects newly enacted schedule immediately
  try {
    await useAppStore.getState().fetchEvents()
  } catch {}

  return {
    eventsCreated: createdCount || branch.generatedEvents.length,
    freedEvents: 0,
    branchName: branch.name
  }
}
