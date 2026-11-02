/**
 * Neural Calendar Interface Store
 * Reactive State for Live BCI Telemetry, Intent Drafts, Dreams & Auto-Shield
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  EEGTelemetryPacket,
  CognitiveState,
  BCIConnectionMode,
  NeuralIntentDraft,
  DreamJournalEntry,
  CreativityWindowForecast,
  MicroBreakAlert,
  FocusTimePrompt
} from '../types/neuralInterface'
import { neuralService } from '../services/neuralInterfaceService'
import { useAppStore } from './useAppStore'
import { useBurnoutStore } from './useBurnoutStore'
import { parseISO, addMinutes, format } from 'date-fns'

export interface NeuralState {
  mode: BCIConnectionMode
  telemetry: EEGTelemetryPacket
  cognitiveState: CognitiveState
  autoShieldEnabled: boolean
  activeDraft: NeuralIntentDraft | null
  draftHistory: NeuralIntentDraft[]
  dreamEntries: DreamJournalEntry[]
  microBreakAlert: MicroBreakAlert | null
  pendingFocusPrompt: FocusTimePrompt | null
  wakeTimeStr: string
  creativityWindows: CreativityWindowForecast[]

  // Actions
  parseThought: (thoughtStream: string) => NeuralIntentDraft
  acceptDraftToCalendar: (draftId: string) => Promise<boolean>
  dismissDraft: (draftId: string) => void
  addDreamEntry: (transcript: string) => DreamJournalEntry
  toggleAutoShield: () => void
  setWakeTime: (wakeTime: string) => void
  dismissMicroBreak: () => void
  confirmFocusBlock: (durationMinutes?: number) => Promise<boolean>
  dismissFocusPrompt: () => void
  connectBCIDevice: () => Promise<{ success: boolean; deviceName: string }>
}

export const useNeuralStore = create<NeuralState>()(
  persist(
    (set, get) => {
      // Connect live neural service subscribers
      neuralService.subscribeTelemetry((pkt) => {
        set({ telemetry: pkt })
      })

      neuralService.subscribeCognitiveState((state) => {
        set({ cognitiveState: state })

        // Focus Protection: check if user is in deep productive flow
        if (state === 'deep_flow' || state === 'hyper_focused') {
          const appStore = useAppStore.getState()
          const todayStr = new Date().toISOString().split('T')[0]
          const existingFocusBlock = appStore.events.find(
            (e) =>
              e.start.startsWith(todayStr) &&
              (e.title.includes('Focus Time') || e.title.includes('Focus') || e.title.includes('Shield'))
          )

          if (!existingFocusBlock) {
            if (get().autoShieldEnabled) {
              // Automatic mode (if user explicitly enabled it)
              const now = new Date()
              const startIso = now.toISOString()
              const endIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
              const calId = appStore.calendars.find((c) => c.is_default)?.id || appStore.calendars[0]?.id || 'cal-default'

              appStore.createEvent({
                id: `evt-focus-block-${Date.now()}`,
                calendar_id: calId,
                title: 'Focus Time',
                description: 'Protected focus block to work without interruptions.',
                start: startIso,
                end: endIso,
                all_day: false,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                priority: 'urgent',
                status: 'confirmed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            } else if (!get().pendingFocusPrompt) {
              // User-friendly confirmation mode: ask politely before adding anything!
              const now = Date.now()
              set({
                pendingFocusPrompt: {
                  id: `focus-prompt-${now}`,
                  detectedAt: now,
                  suggestedDurationMinutes: 60,
                  reason: 'High productivity & deep work flow detected'
                }
              })
            }
          }
        }
      })

      neuralService.subscribeMicroBreak((alert) => {
        set({ microBreakAlert: alert })
      })

      // Dynamically derive circadian wake time from user's live biometric profile & chronotype
      const burnoutProfile = useBurnoutStore.getState()?.profile
      let initialWake = '07:00'
      if (burnoutProfile?.peakFocusStart) {
        try {
          initialWake = format(addMinutes(parseISO(`2000-01-01T${burnoutProfile.peakFocusStart}:00`), -120), 'HH:mm')
        } catch {
          initialWake = burnoutProfile.chronotype === 'early-bird' ? '06:00' : burnoutProfile.chronotype === 'night-owl' ? '08:30' : '07:00'
        }
      } else if (burnoutProfile?.chronotype) {
        initialWake = burnoutProfile.chronotype === 'early-bird' ? '06:00' : burnoutProfile.chronotype === 'night-owl' ? '08:30' : '07:00'
      }

      const initialWindows = neuralService.forecastCreativityWindows(initialWake)

      return {
        mode: neuralService.getMode(),
        telemetry: neuralService.getLatestTelemetry(),
        cognitiveState: 'collaborative',
        autoShieldEnabled: false,
        pendingFocusPrompt: null,
        activeDraft: null,
        draftHistory: [],
        dreamEntries: [],
        microBreakAlert: null,
        wakeTimeStr: initialWake,
        creativityWindows: initialWindows,

        parseThought: (thoughtStream: string) => {
          const resources = useAppStore.getState().resources
          const draft = neuralService.parseNeuralIntent(thoughtStream, resources)
          set((state) => ({
            activeDraft: draft,
            draftHistory: [draft, ...state.draftHistory.slice(0, 20)]
          }))
          return draft
        },

        acceptDraftToCalendar: async (draftId: string) => {
          const draft = get().draftHistory.find((d) => d.id === draftId) || get().activeDraft
          if (!draft) return false

          const appStore = useAppStore.getState()
          const calId = appStore.calendars[0]?.id || 'cal-primary'

          const startIso = new Date(`${draft.suggestedDate}T${draft.suggestedTime}:00`).toISOString()
          const endIso = new Date(
            new Date(startIso).getTime() + draft.durationMinutes * 60 * 1000
          ).toISOString()

          await appStore.createEvent({
            id: `evt-neural-${Date.now()}`,
            calendar_id: calId,
            title: draft.extractedTitle,
            description: `Drafted via Neural Calendar Interface from thought stream:\n"${draft.rawThoughtStream}"\nConfidence: ${draft.confidenceScore}%`,
            start: startIso,
            end: endIso,
            all_day: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            priority: draft.cognitivePriority,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          await appStore.fetchEvents()
          set((state) => ({
            activeDraft: state.activeDraft?.id === draftId ? null : state.activeDraft,
            draftHistory: state.draftHistory.filter((d) => d.id !== draftId)
          }))
          return true
        },

        dismissDraft: (draftId: string) => {
          set((state) => ({
            activeDraft: state.activeDraft?.id === draftId ? null : state.activeDraft,
            draftHistory: state.draftHistory.filter((d) => d.id !== draftId)
          }))
        },

        addDreamEntry: (transcript: string) => {
          const wakeHour = parseInt(get().wakeTimeStr.split(':')[0], 10) || 7
          const entry = neuralService.analyzeDreamJournal(transcript, wakeHour)
          set((state) => ({
            dreamEntries: [entry, ...state.dreamEntries]
          }))
          return entry
        },

        toggleAutoShield: () => {
          set((state) => ({ autoShieldEnabled: !state.autoShieldEnabled }))
        },

        setWakeTime: (wakeTime: string) => {
          const windows = neuralService.forecastCreativityWindows(wakeTime)
          set({ wakeTimeStr: wakeTime, creativityWindows: windows })
        },

        dismissMicroBreak: () => {
          set({ microBreakAlert: null })
        },

        confirmFocusBlock: async (durationMinutes = 60) => {
          const appStore = useAppStore.getState()
          const calId =
            appStore.calendars.find((c) => c.is_default)?.id ||
            appStore.calendars[0]?.id ||
            'cal-default'
          const now = new Date()
          const startIso = now.toISOString()
          const endIso = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString()

          await appStore.createEvent({
            id: `evt-focus-block-${Date.now()}`,
            calendar_id: calId,
            title: 'Focus Time',
            description: 'Protected focus time to work without interruptions.',
            start: startIso,
            end: endIso,
            all_day: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            priority: 'urgent',
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          await appStore.fetchEvents()
          set({ pendingFocusPrompt: null })
          return true
        },

        dismissFocusPrompt: () => {
          set({ pendingFocusPrompt: null })
        },

        connectBCIDevice: async () => {
          const res = await neuralService.connectWebBluetoothBCI()
          set({ mode: neuralService.getMode() })
          return res
        }
      }
    },
    {
      name: 'stoa-neural-interface-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        autoShieldEnabled: state.autoShieldEnabled,
        wakeTimeStr: state.wakeTimeStr,
        dreamEntries: state.dreamEntries,
        draftHistory: state.draftHistory
      })
    }
  )
)
