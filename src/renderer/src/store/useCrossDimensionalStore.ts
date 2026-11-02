/**
 * Cross-Dimensional Calendar Store
 * Reactive Zustand State for 6D Metrics, Pareto Simulator & Optimization Actions
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ParetoSimulationParams,
  CrossDimensionalSettings
} from '../types/crossDimensional'
import {
  DEFAULT_CD_SETTINGS,
  computeDimensionVector,
  generateParetoFrontierPoints
} from '../services/crossDimensionalEngine'
import { useAppStore } from './useAppStore'
import { useBurnoutStore } from './useBurnoutStore'
import { addDays, format, startOfWeek } from 'date-fns'

export interface CrossDimensionalState {
  settings: CrossDimensionalSettings
  simulationParams: ParetoSimulationParams
  isSimulating: boolean
  activeFrontierPointId: string | null

  // Actions
  updateSimulationParams: (patch: Partial<ParetoSimulationParams>) => void
  resetSimulation: () => void
  updateSettings: (patch: Partial<CrossDimensionalSettings>) => void
  selectFrontierPoint: (id: string | null) => void
  applyParetoStrategyToCalendar: () => Promise<{ scheduledBlocks: number; freedHours: number }>
}

const DEFAULT_PARAMS: ParetoSimulationParams = {
  meetingReductionPct: 0,
  targetDeepWorkHours: 20,
  hourlyBillingRate: 150,
  targetSleepRestHours: 8,
  targetOneOnOneHours: 3
}

export const useCrossDimensionalStore = create<CrossDimensionalState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_CD_SETTINGS,
      simulationParams: DEFAULT_PARAMS,
      isSimulating: false,
      activeFrontierPointId: null,

      updateSimulationParams: (patch) => {
        set((state) => ({
          simulationParams: { ...state.simulationParams, ...patch },
          isSimulating: true
        }))
      },

      resetSimulation: () => {
        const liveSleepGoal = useBurnoutStore.getState().profile?.avgSleepHours || 8
        set({
          simulationParams: {
            ...DEFAULT_PARAMS,
            targetSleepRestHours: liveSleepGoal
          },
          isSimulating: false,
          activeFrontierPointId: null
        })
      },

      updateSettings: (patch) => {
        set((state) => ({
          settings: { ...state.settings, ...patch }
        }))
      },

      selectFrontierPoint: (id) => {
        if (!id) {
          set({ activeFrontierPointId: null })
          return
        }

        const events = useAppStore.getState().events
        const resources = useAppStore.getState().resources
        const profile = useBurnoutStore.getState().profile
        const base = computeDimensionVector(events, resources, profile, get().settings)
        const points = generateParetoFrontierPoints(base)
        const targetPoint = points.find((p) => p.id === id)

        if (targetPoint) {
          const meetingDelta = base.timeMeetingHours > 0
            ? Math.round(((targetPoint.meetingHours - base.timeMeetingHours) / base.timeMeetingHours) * 100)
            : 0

          set({
            activeFrontierPointId: id,
            isSimulating: true,
            simulationParams: {
              ...get().simulationParams,
              meetingReductionPct: meetingDelta,
              targetDeepWorkHours: targetPoint.deepWorkHours
            }
          })
        }
      },

      applyParetoStrategyToCalendar: async () => {
        const { simulationParams } = get()
        const appStore = useAppStore.getState()
        const calId = appStore.calendars[0]?.id || 'cal-primary'
        const monday = startOfWeek(new Date(), { weekStartsOn: 1 })

        let scheduledCount = 0
        const neededDeepBlocks = Math.max(1, Math.min(5, Math.round(simulationParams.targetDeepWorkHours / 4)))

        // Schedule deep focus blocks across weekdays during optimal morning hours (09:00 - 11:30)
        for (let i = 0; i < neededDeepBlocks; i++) {
          const targetDay = addDays(monday, i)
          const dateStr = format(targetDay, 'yyyy-MM-dd')
          const startIso = new Date(`${dateStr}T09:00:00`).toISOString()
          const endIso = new Date(`${dateStr}T12:00:00`).toISOString()

          // Check if slot has conflicting events
          const hasConflict = appStore.events.some((e) => {
            if (e.status === 'cancelled') return false
            const eS = new Date(e.start).getTime()
            const eE = new Date(e.end).getTime()
            const sS = new Date(startIso).getTime()
            const sE = new Date(endIso).getTime()
            return eS < sE && eE > sS
          })

          if (!hasConflict) {
            await appStore.createEvent({
              id: `evt-pareto-deep-${Date.now()}-${i}`,
              calendar_id: calId,
              title: '🛡️ Deep Architecture & Cognitive Flow',
              description: 'Pareto-optimized deep work block protected by 6D Cross-Dimensional Engine.',
              start: startIso,
              end: endIso,
              all_day: false,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              priority: 'high',
              status: 'confirmed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            scheduledCount++
          }
        }

        await appStore.fetchEvents()
        const freed = Math.abs(Math.round((appStore.events.length * simulationParams.meetingReductionPct) / 100))

        set({ isSimulating: false })
        return { scheduledBlocks: scheduledCount, freedHours: freed }
      }
    }),
    {
      name: 'stoa-cross-dimensional-store-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
