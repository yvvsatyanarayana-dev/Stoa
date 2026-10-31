import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  BiometricProfile,
  DailyFatigueLog,
  FocusBlock,
  BurnoutAlert,
  BurnoutShieldState
} from '../types/burnout'

interface BurnoutStoreActions {
  updateProfile: (partial: Partial<BiometricProfile>) => void
  addFatigueLog: (log: DailyFatigueLog) => void
  addFocusBlock: (block: FocusBlock) => void
  updateFocusBlock: (id: string, partial: Partial<FocusBlock>) => void
  removeFocusBlock: (id: string) => void
  dismissAlert: (id: string) => void
  toggleShield: () => void
  toggleAutoBuffer: () => void
}

type BurnoutStore = BurnoutShieldState & BurnoutStoreActions

const defaultProfile: BiometricProfile = {
  id: 'bp-001',
  userId: 'user-001',
  chronotype: 'intermediate',
  peakFocusStart: '09:00',
  peakFocusEnd: '12:00',
  secondaryPeakStart: '15:00',
  secondaryPeakEnd: '17:00',
  avgSleepHours: 7.2,
  preferredBreakInterval: 45,
  updatedAt: '2026-10-28T08:00:00Z'
}

const defaultFatigueHistory: DailyFatigueLog[] = [
  {
    id: 'fl-001',
    date: '2026-10-18',
    cognitiveLoadScore: 34,
    meetingDensity: 2,
    deepWorkBlocks: 3,
    breaksTaken: 4,
    fatigueLevel: 'low',
    burnoutRisk: 18,
    recommendations: ['Maintain current rhythm', 'Consider adding a midday walk']
  },
  {
    id: 'fl-002',
    date: '2026-10-19',
    cognitiveLoadScore: 41,
    meetingDensity: 3,
    deepWorkBlocks: 2,
    breaksTaken: 3,
    fatigueLevel: 'low',
    burnoutRisk: 22,
    recommendations: ['Deep work ratio is healthy', 'Stay hydrated during afternoon sessions']
  },
  {
    id: 'fl-003',
    date: '2026-10-20',
    cognitiveLoadScore: 58,
    meetingDensity: 5,
    deepWorkBlocks: 1,
    breaksTaken: 2,
    fatigueLevel: 'moderate',
    burnoutRisk: 39,
    recommendations: ['Reduce back-to-back meetings', 'Schedule one deep work block before 11 AM']
  },
  {
    id: 'fl-004',
    date: '2026-10-21',
    cognitiveLoadScore: 65,
    meetingDensity: 6,
    deepWorkBlocks: 1,
    breaksTaken: 1,
    fatigueLevel: 'moderate',
    burnoutRisk: 48,
    recommendations: ['Block lunch hour as recovery', 'Decline optional Friday wrap-up calls']
  },
  {
    id: 'fl-005',
    date: '2026-10-22',
    cognitiveLoadScore: 72,
    meetingDensity: 7,
    deepWorkBlocks: 0,
    breaksTaken: 1,
    fatigueLevel: 'high',
    burnoutRisk: 61,
    recommendations: [
      'No deep work recorded — critical gap in focused output',
      'Add at least 2 × 45-min focus blocks tomorrow',
      'Enable Auto-Buffer to protect afternoon hours'
    ]
  },
  {
    id: 'fl-006',
    date: '2026-10-23',
    cognitiveLoadScore: 29,
    meetingDensity: 1,
    deepWorkBlocks: 4,
    breaksTaken: 5,
    fatigueLevel: 'low',
    burnoutRisk: 15,
    recommendations: ['Weekend rest is working — continue pattern']
  },
  {
    id: 'fl-007',
    date: '2026-10-24',
    cognitiveLoadScore: 22,
    meetingDensity: 0,
    deepWorkBlocks: 3,
    breaksTaken: 5,
    fatigueLevel: 'low',
    burnoutRisk: 15,
    recommendations: ['Excellent recovery day', 'Pre-plan Monday tasks tonight']
  },
  {
    id: 'fl-008',
    date: '2026-10-25',
    cognitiveLoadScore: 47,
    meetingDensity: 4,
    deepWorkBlocks: 2,
    breaksTaken: 3,
    fatigueLevel: 'moderate',
    burnoutRisk: 33,
    recommendations: ['Solid start to the week', 'Protect Tuesday morning for deep work']
  },
  {
    id: 'fl-009',
    date: '2026-10-26',
    cognitiveLoadScore: 55,
    meetingDensity: 4,
    deepWorkBlocks: 2,
    breaksTaken: 2,
    fatigueLevel: 'moderate',
    burnoutRisk: 41,
    recommendations: ['Take a proper lunch break', 'Defer one meeting to Thursday if possible']
  },
  {
    id: 'fl-010',
    date: '2026-10-27',
    cognitiveLoadScore: 78,
    meetingDensity: 8,
    deepWorkBlocks: 0,
    breaksTaken: 1,
    fatigueLevel: 'high',
    burnoutRisk: 68,
    recommendations: [
      'Meeting density is dangerously high',
      'Activate Burnout Shield immediately',
      'Batch admin tasks to reduce context switching'
    ]
  },
  {
    id: 'fl-011',
    date: '2026-10-28',
    cognitiveLoadScore: 83,
    meetingDensity: 9,
    deepWorkBlocks: 0,
    breaksTaken: 0,
    fatigueLevel: 'critical',
    burnoutRisk: 72,
    recommendations: [
      'Critical burnout risk — immediate action required',
      'Cancel or delegate at least 3 meetings today',
      'Mandatory 20-min recovery blocks every 90 minutes',
      'Notify manager of unsustainable workload'
    ]
  },
  {
    id: 'fl-012',
    date: '2026-10-29',
    cognitiveLoadScore: 44,
    meetingDensity: 3,
    deepWorkBlocks: 2,
    breaksTaken: 3,
    fatigueLevel: 'moderate',
    burnoutRisk: 36,
    recommendations: [
      'Recovery trend detected — maintain reduced meeting load',
      'Use morning peak (9–12) for deep work exclusively'
    ]
  },
  {
    id: 'fl-013',
    date: '2026-10-30',
    cognitiveLoadScore: 31,
    meetingDensity: 2,
    deepWorkBlocks: 3,
    breaksTaken: 4,
    fatigueLevel: 'low',
    burnoutRisk: 21,
    recommendations: ['Good recovery progress', 'Keep meeting load below 4 per day this week']
  },
  {
    id: 'fl-014',
    date: '2026-10-31',
    cognitiveLoadScore: 54,
    meetingDensity: 4,
    deepWorkBlocks: 2,
    breaksTaken: 2,
    fatigueLevel: 'moderate',
    burnoutRisk: 43,
    recommendations: [
      'Schedule a buffer block after the 3 PM standup',
      'Avoid scheduling new meetings after 4 PM',
      'Complete highest-priority task during peak focus window (9–12)'
    ]
  }
]

const defaultFocusBlocks: FocusBlock[] = [
  {
    id: 'fb-001',
    date: '2026-10-31',
    startTime: '09:00',
    endTime: '11:00',
    type: 'deep-work',
    label: 'Strategic Planning Session',
    isAutoScheduled: false,
    cognitiveWeight: 9,
    locked: true
  },
  {
    id: 'fb-002',
    date: '2026-10-31',
    startTime: '11:00',
    endTime: '11:15',
    type: 'buffer',
    label: 'Post Deep Work Buffer',
    isAutoScheduled: true,
    cognitiveWeight: 1,
    locked: false
  },
  {
    id: 'fb-003',
    date: '2026-10-31',
    startTime: '11:15',
    endTime: '12:00',
    type: 'admin',
    label: 'Email & Inbox Triage',
    isAutoScheduled: false,
    cognitiveWeight: 3,
    locked: false
  },
  {
    id: 'fb-004',
    date: '2026-10-31',
    startTime: '13:00',
    endTime: '14:30',
    type: 'meetings',
    label: 'Team Sync & Sprint Review',
    isAutoScheduled: false,
    cognitiveWeight: 6,
    locked: false
  },
  {
    id: 'fb-005',
    date: '2026-10-31',
    startTime: '14:30',
    endTime: '14:45',
    type: 'recovery',
    label: 'Recovery Break',
    isAutoScheduled: true,
    cognitiveWeight: 1,
    locked: false
  },
  {
    id: 'fb-006',
    date: '2026-10-31',
    startTime: '15:00',
    endTime: '17:00',
    type: 'deep-work',
    label: 'Feature Development',
    isAutoScheduled: false,
    cognitiveWeight: 8,
    locked: true
  },
  {
    id: 'fb-007',
    date: '2026-11-01',
    startTime: '09:00',
    endTime: '10:30',
    type: 'deep-work',
    label: 'Research & Analysis',
    isAutoScheduled: true,
    cognitiveWeight: 8,
    locked: false
  },
  {
    id: 'fb-008',
    date: '2026-11-01',
    startTime: '14:00',
    endTime: '15:00',
    type: 'meetings',
    label: 'Client Check-in',
    isAutoScheduled: false,
    cognitiveWeight: 5,
    locked: false
  }
]

const defaultAlerts: BurnoutAlert[] = [
  {
    id: 'ba-001',
    triggeredAt: '2026-10-31T08:00:00Z',
    severity: 'info',
    message: 'Your peak focus window (9:00–12:00) is approaching. Deep work block is scheduled.',
    dismissed: false
  },
  {
    id: 'ba-002',
    triggeredAt: '2026-10-31T07:30:00Z',
    severity: 'warning',
    message:
      'Burnout risk has been above 40% for 3 consecutive days. Consider reducing meeting load this week.',
    dismissed: false
  },
  {
    id: 'ba-003',
    triggeredAt: '2026-10-28T09:15:00Z',
    severity: 'critical',
    message:
      'Critical burnout risk (72%) detected on Oct 28. Cognitive load exceeded safe threshold for 2 days. Auto-Buffer has been activated.',
    dismissed: true
  }
]

export const useBurnoutStore = create<BurnoutStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      fatigueHistory: defaultFatigueHistory,
      focusBlocks: defaultFocusBlocks,
      alerts: defaultAlerts,
      shieldEnabled: true,
      autoBufferEnabled: true,
      weeklyBurnoutTrend: [28, 45, 52, 67, 71, 38, 22],

      updateProfile: (partial) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...partial,
            updatedAt: new Date().toISOString()
          }
        })),

      addFatigueLog: (log) =>
        set((state) => ({
          fatigueHistory: [...state.fatigueHistory, log]
        })),

      addFocusBlock: (block) =>
        set((state) => ({
          focusBlocks: [...state.focusBlocks, block]
        })),

      updateFocusBlock: (id, partial) =>
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) => (b.id === id ? { ...b, ...partial } : b))
        })),

      removeFocusBlock: (id) =>
        set((state) => ({
          focusBlocks: state.focusBlocks.filter((b) => b.id !== id)
        })),

      dismissAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a))
        })),

      toggleShield: () =>
        set((state) => ({
          shieldEnabled: !state.shieldEnabled
        })),

      toggleAutoBuffer: () =>
        set((state) => ({
          autoBufferEnabled: !state.autoBufferEnabled
        }))
    }),
    {
      name: 'chronodesk-burnout-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
