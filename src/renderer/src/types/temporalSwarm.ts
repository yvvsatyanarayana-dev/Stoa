/**
 * Stoa Temporal AI Agent Swarm Types
 * Autonomous Multi-Agent Calendar Intelligence System
 */

export type SwarmAgentRole = 'scheduler' | 'guardian' | 'strategist' | 'diplomat' | 'archivist'

export type SwarmAgentStatus = 'idle' | 'observing' | 'optimizing' | 'negotiating' | 'synthesizing' | 'sleeping'

export type SwarmAutonomyLevel = 'autonomous' | 'supervised' | 'passive'

export type Chronotype = 'lark' | 'third-bird' | 'owl'

export interface SwarmAgentProfile {
  id: SwarmAgentRole
  name: string
  title: string
  role: SwarmAgentRole
  description: string
  autonomyLevel: SwarmAutonomyLevel
  status: SwarmAgentStatus
  currentAction: string
  confidenceScore: number // 0 - 100
  lastActive: string // ISO date
  totalDecisions: number
  metrics: {
    label: string
    value: string | number
  }[]
}

export interface SwarmSettings {
  enabled: boolean
  chronotype: Chronotype
  targetFocusRatio: number // e.g. 60 (%)
  maxDailyMeetingHours: number // e.g. 4
  requiredBufferMinutes: number // e.g. 15
  hardDayStart: string // '08:30'
  hardDayEnd: string // '18:00'
  protectLunchBreak: boolean
  lunchWindowStart: string // '12:30'
  lunchWindowEnd: string // '13:30'
  autoInsertBuffers: boolean
  autoShieldDeepWork: boolean
  enableP2PNegotiation: boolean
}

export type SwarmDecisionType =
  | 'buffer_inserted'
  | 'deep_work_shielded'
  | 'boundary_protected'
  | 'meeting_rescheduled'
  | 'p2p_negotiation_resolved'
  | 'crunch_mitigated'
  | 'weekly_retrospective'

export interface SwarmDecision {
  id: string
  agentRole: SwarmAgentRole
  type: SwarmDecisionType
  title: string
  details: string
  timestamp: string // ISO
  impact: 'high' | 'medium' | 'low'
  applied: boolean
  crdtSynced: boolean
  eventPayload?: {
    title: string
    start: string
    end: string
    description?: string
    isBuffer?: boolean
    isShield?: boolean
  }
}

export interface CandidateMeetingSlot {
  start: string // YYYY-MM-DDTHH:mm:ss
  end: string
  score: number // 0-100 (100 = optimal chronotype alignment + 0 context switch)
  rationale: string
}

export interface DiplomatNegotiationSession {
  sessionId: string
  initiatorPeerId: string
  initiatorPeerName: string
  targetPeerId: string
  targetPeerName: string
  meetingTitle: string
  durationMinutes: number
  urgency: 'low' | 'normal' | 'urgent'
  state: 'probing_slots' | 'counter_offered' | 'consensus_reached' | 'confirmed_in_crdt' | 'declined'
  candidateSlots: CandidateMeetingSlot[]
  agreedSlot?: {
    start: string
    end: string
  }
  rounds: number
  consensusConfidence: number // 0-100%
  updatedAt: string
}

export interface ArchivistBriefing {
  id: string
  weekStartDate: string
  weekEndDate: string
  generatedAt: string
  productivityScore: number // 0 - 100
  focusHours: number
  meetingHours: number
  ratioPercent: number
  contextSwitches: number
  fatigueRisk: 'optimal' | 'moderate' | 'elevated' | 'severe'
  topInsights: string[]
  recommendations: string[]
  summaryText: string
}
