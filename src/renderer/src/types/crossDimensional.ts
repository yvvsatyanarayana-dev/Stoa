/**
 * Cross-Dimensional Calendar Types
 * Unified Multi-Axis Model: Time, Energy, Attention, Money, Relationships, Health
 */

export interface DimensionKPI {
  raw: number
  normalizedScore: number // 0 to 100
  unit: string
  label: string
  status: 'optimal' | 'moderate' | 'critical'
  trend: 'up' | 'down' | 'steady'
  deltaPct: number
  description: string
}

export interface DimensionVector {
  // 1. Time (Total hours scheduled out of 168h weekly budget)
  timeScheduledHours: number
  timeDeepWorkHours: number
  timeMeetingHours: number
  timeRestBufferHours: number

  // 2. Energy (HRV estimate & cognitive battery percentage)
  energyBatteryPct: number
  energyDrainKcalEst: number
  energyPeakHourAlignmentPct: number

  // 3. Attention (Focus Points 0-100)
  attentionFocusPoints: number
  attentionContextSwitches: number
  attentionLongestFocusBlockMins: number
  attentionFragmentationIndex: number // 0 (unfragmented) to 1 (shattered)

  // 4. Money (Economic value & opportunity cost in USD)
  moneyGrossValueUsd: number
  moneyOpportunityCostUsd: number
  moneyHourlyEffectiveRate: number
  moneyBillableHours: number

  // 5. Relationships (Trust capital & interaction graph)
  relationshipTrustCapital: number // 0-100
  relationshipActivePeersCount: number
  relationshipOneOnOneHours: number
  relationshipEntropyScore: number // Diversity of social network

  // 6. Health (Stress load index 0-100, lower is better)
  healthStressLoad: number
  healthOvertimeHours: number
  healthCircadianDisruptionScore: number
  healthRecoveryAdequacyPct: number
}

export interface ParetoSimulationParams {
  meetingReductionPct: number // -50% to +50%
  targetDeepWorkHours: number // 5 to 40 hrs
  hourlyBillingRate: number // default $150/hr
  targetSleepRestHours: number // 6 to 9 hrs/day
  targetOneOnOneHours: number // 1 to 10 hrs/week
}

export interface ParetoFrontierPoint {
  id: string
  label: string
  meetingHours: number
  deepWorkHours: number
  energyScore: number
  attentionScore: number
  moneyScore: number
  relationshipScore: number
  healthScore: number
  overallParetoUtility: number // 0 to 100
  isCurrentSchedule?: boolean
  isParetoOptimal?: boolean
}

export interface SankeyFlowLink {
  source: string
  target: string
  value: number // hours
  color: string
}

export interface CrossDimensionalSettings {
  defaultHourlyRate: number
  billableTagKeywords: string[]
  clientMeetingKeywords: string[]
  internalMeetingKeywords: string[]
  deepWorkKeywords: string[]
}
