/**
 * Generative Schedule Worlds — Types & Schemas
 * Procedural Multiverse Scenario Trees, Generative Priors & CRDT Document Forks
 */

import type { CalendarEvent } from '../../../types'

export type ScenarioWorldArchetype =
  | 'executive_leadership'
  | 'startup_founder'
  | 'creative_sabbatical'
  | 'remote_nomad'
  | 'parental_leave'
  | 'custom'

export interface GenerativePriors {
  avgMeetingLengthMins: number
  weeklyWorkHours: number
  deepWorkRatio: number
  earliestStartHour: number
  latestEndHour: number
  weekendWorkFrequency: number // 0 to 1
  travelTripsPerQuarter: number
  eveningDinnerPreservationRate: number // 0 to 1
  topCollaborators: string[]
  hourlyYield: number
}

export interface ScenarioImpactProjection {
  weeklyScheduledHours: number
  weeklyMeetingHours: number
  weeklyDeepWorkHours: number
  quarterlyTravelDays: number
  weeklyFamilyDinnersPreserved: number // 0 to 7
  weekendFreeHours: number // out of 48h
  annualProjectedCompensationUsd: number
  projectedHrvMs: number // 30-90 ms (higher is healthier)
  burnoutRiskIndex: number // 0-100 (lower is healthier)
  relationshipBondScore: number // 0-100
  cognitiveVitalityScore: number // 0-100
}

export interface ScenarioTravelTrip {
  id: string
  tripName: string
  destination: string
  departureDate: string
  returnDate: string
  flightBlocks: string[]
  jetLagDisruptionScore: number // 0-10
}

export interface ScenarioTeamDynamic {
  id: string
  role: string
  name: string
  cadence: string
  sentiment: 'energizing' | 'demanding' | 'mentorship'
  interactionHoursPerWeek: number
}

export interface ScenarioPeerCollaborator {
  peerId: string
  peerName: string
  avatarColor: string
  role: 'owner' | 'partner' | 'advisor' | 'colleague'
  joinedAt: string
  commentsCount: number
}

export interface ScenarioDecisionNode {
  id: string
  label: string
  choicePrompt: string
  chosenOptionId?: string
  options: Array<{
    id: string
    title: string
    description: string
    resultBranchId?: string
  }>
}

export interface ScenarioBranch {
  id: string
  name: string
  tagline: string
  description: string
  archetype: ScenarioWorldArchetype
  parentBranchId: string | null // null for Reality Root
  forkedFromDate: string
  crdtDocumentForkId: string
  lamportClock: number
  color: string
  isActive: boolean

  // Projections & Computed Impacts
  projections: ScenarioImpactProjection
  deltaFromReality: {
    hoursDeltaPct: number
    incomeDeltaPct: number
    familyDeltaPct: number
    burnoutDeltaPct: number
    travelDeltaDays: number
  }

  // Procedural Timeline
  generatedEvents: CalendarEvent[]
  travelSchedule: ScenarioTravelTrip[]
  teamDynamics: ScenarioTeamDynamic[]
  decisionNodes: ScenarioDecisionNode[]
  collaborators: ScenarioPeerCollaborator[]

  createdAt: string
  updatedAt: string
}

export interface MultiverseScenarioTree {
  rootBranchId: string
  branches: Record<string, ScenarioBranch>
  activeBranchId: string
  priors: GenerativePriors
}
