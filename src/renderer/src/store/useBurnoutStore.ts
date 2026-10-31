import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  BiometricProfile,
  DailyFatigueLog,
  FocusBlock,
  BurnoutAlert
} from '../types/burnout'

export interface BurnoutStore {
  profile: BiometricProfile
  fatigueHistory: DailyFatigueLog[]
  focusBlocks: FocusBlock[]
  alerts: BurnoutAlert[]
  shieldEnabled: boolean
  autoBufferEnabled: boolean
  weeklyBurnoutTrend: number[]

  updateProfile: (partial: Partial<BiometricProfile>) => void
  addFatigueLog: (log: DailyFatigueLog) => void
  addFocusBlock: (block: FocusBlock) => void
  updateFocusBlock: (id: string, partial: Partial<FocusBlock>) => void
  removeFocusBlock: (id: string) => void
  dismissAlert: (id: string) => void
  toggleShield: () => void
  toggleAutoBuffer: () => void
  setWeeklyBurnoutTrend: (trend: number[]) => void
  clearAllBurnoutData: () => void
}

const DEFAULT_PROFILE: BiometricProfile = {
  id: 'bp-default',
  userId: 'user-primary',
  chronotype: 'intermediate',
  peakFocusStart: '09:00',
  peakFocusEnd: '12:00',
  secondaryPeakStart: '15:00',
  secondaryPeakEnd: '17:00',
  avgSleepHours: 7.5,
  preferredBreakInterval: 45,
  updatedAt: new Date().toISOString()
}

export const useBurnoutStore = create<BurnoutStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      fatigueHistory: [],
      focusBlocks: [],
      alerts: [],
      shieldEnabled: true,
      autoBufferEnabled: true,
      weeklyBurnoutTrend: [0, 0, 0, 0, 0, 0, 0],

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
          fatigueHistory: [log, ...state.fatigueHistory.filter((l) => l.date !== log.date)]
        })),

      addFocusBlock: (block) =>
        set((state) => ({
          focusBlocks: [block, ...state.focusBlocks]
        })),

      updateFocusBlock: (id, partial) =>
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id ? { ...b, ...partial } : b
          )
        })),

      removeFocusBlock: (id) =>
        set((state) => ({
          focusBlocks: state.focusBlocks.filter((b) => b.id !== id)
        })),

      dismissAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, dismissed: true } : a
          )
        })),

      toggleShield: () =>
        set((state) => ({ shieldEnabled: !state.shieldEnabled })),

      toggleAutoBuffer: () =>
        set((state) => ({ autoBufferEnabled: !state.autoBufferEnabled })),

      setWeeklyBurnoutTrend: (trend) =>
        set({ weeklyBurnoutTrend: trend }),

      clearAllBurnoutData: () =>
        set({ fatigueHistory: [], focusBlocks: [], alerts: [] })
    }),
    {
      name: 'chronodesk-burnout-store-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
