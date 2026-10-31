export type ChronotypeName = 'early-bird' | 'intermediate' | 'night-owl'
export type FatigueLevel = 'low' | 'moderate' | 'high' | 'critical'
export type FocusBlockType = 'deep-work' | 'meetings' | 'admin' | 'buffer' | 'recovery'

export interface BiometricProfile {
  id: string
  userId: string
  chronotype: ChronotypeName
  peakFocusStart: string // "HH:MM"
  peakFocusEnd: string
  secondaryPeakStart: string
  secondaryPeakEnd: string
  avgSleepHours: number
  preferredBreakInterval: number // minutes
  updatedAt: string
}

export interface DailyFatigueLog {
  id: string
  date: string // YYYY-MM-DD
  cognitiveLoadScore: number // 0–100
  meetingDensity: number // meetings/day
  deepWorkBlocks: number
  breaksTaken: number
  fatigueLevel: FatigueLevel
  burnoutRisk: number // 0–100 percentage
  recommendations: string[]
}

export interface FocusBlock {
  id: string
  date: string
  startTime: string
  endTime: string
  type: FocusBlockType
  label: string
  isAutoScheduled: boolean
  cognitiveWeight: number // 1-10
  locked: boolean
}

export interface BurnoutAlert {
  id: string
  triggeredAt: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  dismissed: boolean
}

export interface BurnoutShieldState {
  profile: BiometricProfile
  fatigueHistory: DailyFatigueLog[]
  focusBlocks: FocusBlock[]
  alerts: BurnoutAlert[]
  shieldEnabled: boolean
  autoBufferEnabled: boolean
  weeklyBurnoutTrend: number[] // 7 values, Sun–Sat
}
