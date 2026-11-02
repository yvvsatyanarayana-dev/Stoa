/**
 * Stoa Temporal AI Agent Swarm Store
 * Manages autonomous multi-agent lifecycle, CRDT sync, and peer negotiations
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseISO, differenceInMinutes } from 'date-fns'
import type { CalendarEvent } from '../../../types'
import type {
  SwarmAgentProfile,
  SwarmSettings,
  SwarmDecision,
  DiplomatNegotiationSession,
  ArchivistBriefing,
  SwarmAgentRole,
  SwarmAutonomyLevel
} from '../types/temporalSwarm'
import {
  runGuardianAnalysis,
  runStrategistAnalysis,
  runArchivistSynthesis,
  negotiateDiplomatSlots,
  findOptimalSlots,
  getChronotypePeakHours,
  minutesToTime
} from '../services/temporalSwarmEngine'
import { useAppStore } from './useAppStore'

const INITIAL_SETTINGS: SwarmSettings = {
  enabled: true,
  chronotype: 'lark',
  targetFocusRatio: 60,
  maxDailyMeetingHours: 4,
  requiredBufferMinutes: 15,
  hardDayStart: '08:30',
  hardDayEnd: '18:00',
  protectLunchBreak: true,
  lunchWindowStart: '12:30',
  lunchWindowEnd: '13:30',
  autoInsertBuffers: true,
  autoShieldDeepWork: true,
  enableP2PNegotiation: true
}

export function computeLiveAgentProfiles(
  currentAgents: SwarmAgentProfile[],
  events: CalendarEvent[],
  decisions: SwarmDecision[],
  settings: SwarmSettings,
  negotiations: DiplomatNegotiationSession[],
  briefing: ArchivistBriefing | null
): SwarmAgentProfile[] {
  const peak = getChronotypePeakHours(settings.chronotype)
  const peakWindowStr = `${minutesToTime(peak.start)} - ${minutesToTime(peak.end)}`

  // 1. Scheduler metrics
  const optimalSlots = findOptimalSlots(events, 30, settings, 7)
  const schedulerDecisions = decisions.filter((d) => d.agentRole === 'scheduler').length

  // 2. Guardian metrics
  let shieldedMinutes = 0
  let bufferCount = 0
  events.forEach((e) => {
    if (e.title.includes('Deep Work Shield') || e.title.includes('Deep Work')) {
      const dur = Math.max(15, differenceInMinutes(parseISO(e.end), parseISO(e.start)))
      shieldedMinutes += dur
    }
    if (e.title.includes('Recovery Buffer')) {
      bufferCount += 1
    }
  })
  const guardianDecisions = decisions.filter((d) => d.agentRole === 'guardian').length

  // 3. Strategist metrics
  const strategistAnalysis = runStrategistAnalysis(events, settings)
  const strategistDecisions = decisions.filter((d) => d.agentRole === 'strategist').length

  // 4. Diplomat metrics
  const totalNegotiations = negotiations.length
  const agreedNegotiations = negotiations.filter(
    (n) => n.state === 'consensus_reached' || n.state === 'confirmed_in_crdt'
  ).length
  const consensusRate =
    totalNegotiations > 0 ? `${Math.round((agreedNegotiations / totalNegotiations) * 100)}%` : '0%'
  const avgRounds =
    totalNegotiations > 0
      ? (negotiations.reduce((a, n) => a + n.rounds, 0) / totalNegotiations).toFixed(1)
      : '0'
  const diplomatDecisions = decisions.filter((d) => d.agentRole === 'diplomat').length

  // 5. Archivist metrics
  const prodScore = briefing ? `${briefing.productivityScore}/100` : 'Pending'
  const switches = briefing ? `${briefing.contextSwitches} / wk` : '0 / wk'
  const archivistDecisions = decisions.filter((d) => d.agentRole === 'archivist').length

  return currentAgents.map((agent) => {
    switch (agent.role) {
      case 'scheduler':
        return {
          ...agent,
          status: 'observing',
          confidenceScore: optimalSlots.length > 0 ? 98 : 75,
          totalDecisions: schedulerDecisions,
          currentAction: `Evaluated ${optimalSlots.length} optimal meeting windows`,
          metrics: [
            { label: 'Chronotype Window', value: peakWindowStr },
            { label: 'Open Slots Found', value: `${optimalSlots.length}` }
          ]
        }
      case 'guardian':
        return {
          ...agent,
          status: 'optimizing',
          confidenceScore: 95,
          totalDecisions: guardianDecisions,
          currentAction: `Protected ${(shieldedMinutes / 60).toFixed(1)}h deep focus & ${bufferCount} buffers`,
          metrics: [
            { label: 'Shielded Flow Hours', value: `${(shieldedMinutes / 60).toFixed(1)}h` },
            { label: 'Buffers Injected', value: `${bufferCount}` }
          ]
        }
      case 'strategist':
        return {
          ...agent,
          status: 'observing',
          confidenceScore: 92,
          totalDecisions: strategistDecisions,
          currentAction: `Tracking 14-day load: ${strategistAnalysis.ratioPercent}% focus volume`,
          metrics: [
            { label: 'Focus Ratio', value: `${strategistAnalysis.ratioPercent}%` },
            { label: 'Crunch Score', value: `${strategistAnalysis.crunchScore}/100` }
          ]
        }
      case 'diplomat':
        return {
          ...agent,
          status: totalNegotiations > 0 ? 'negotiating' : 'idle',
          confidenceScore: 94,
          totalDecisions: diplomatDecisions,
          currentAction:
            totalNegotiations > 0
              ? `Negotiated ${totalNegotiations} P2P session(s)`
              : 'Listening on WebRTC DataChannel',
          metrics: [
            { label: 'P2P Consensus Rate', value: consensusRate },
            { label: 'Avg Rounds', value: avgRounds }
          ]
        }
      case 'archivist':
        return {
          ...agent,
          status: briefing ? 'synthesizing' : 'idle',
          confidenceScore: 99,
          totalDecisions: archivistDecisions,
          currentAction: briefing
            ? `Archived 7-day pattern (${briefing.fatigueRisk} risk)`
            : 'Awaiting event history',
          metrics: [
            { label: 'Productivity Index', value: prodScore },
            { label: 'Context Switches', value: switches }
          ]
        }
      default:
        return agent
    }
  })
}

const INITIAL_AGENTS: SwarmAgentProfile[] = [
  {
    id: 'scheduler',
    name: 'Chronos',
    title: 'Precision Slot & Chronotype Engine',
    role: 'scheduler',
    description: 'Finds optimal meeting slots respecting biological energy peaks and minimal context switching.',
    autonomyLevel: 'autonomous',
    status: 'observing',
    currentAction: 'Monitoring 14-day energy availability curve',
    confidenceScore: 0,
    lastActive: new Date().toISOString(),
    totalDecisions: 0,
    metrics: [
      { label: 'Chronotype Window', value: '08:00 - 11:30' },
      { label: 'Open Slots Found', value: '0' }
    ]
  },
  {
    id: 'guardian',
    name: 'Aegis',
    title: 'Deep Work & Boundary Shield',
    role: 'guardian',
    description: 'Guards uninterrupted focus blocks, inserts 15m cognitive buffers, and halts evening overrun.',
    autonomyLevel: 'autonomous',
    status: 'optimizing',
    currentAction: 'Shielding flow windows and boundary shutdown',
    confidenceScore: 0,
    lastActive: new Date().toISOString(),
    totalDecisions: 0,
    metrics: [
      { label: 'Shielded Flow Hours', value: '0.0h' },
      { label: 'Buffers Injected', value: '0' }
    ]
  },
  {
    id: 'strategist',
    name: 'Athena',
    title: 'Macro Load Balancer & Crunch Forecaster',
    role: 'strategist',
    description: 'Forecasts 14-day crunch periods, calculates focus ratios, and balances meeting density.',
    autonomyLevel: 'supervised',
    status: 'observing',
    currentAction: 'Analyzing rolling 14-day focus ratio',
    confidenceScore: 0,
    lastActive: new Date().toISOString(),
    totalDecisions: 0,
    metrics: [
      { label: 'Focus Ratio', value: '0%' },
      { label: 'Crunch Score', value: '0/100' }
    ]
  },
  {
    id: 'diplomat',
    name: 'Hermes',
    title: 'P2P Autonomous Negotiation Mesh',
    role: 'diplomat',
    description: 'Negotiates meetings with peer agents peer-to-peer via Automerge CRDTs without Calendly links.',
    autonomyLevel: 'autonomous',
    status: 'idle',
    currentAction: 'Listening on WebRTC P2P DataChannel',
    confidenceScore: 0,
    lastActive: new Date().toISOString(),
    totalDecisions: 0,
    metrics: [
      { label: 'P2P Consensus Rate', value: '0%' },
      { label: 'Avg Rounds', value: '0' }
    ]
  },
  {
    id: 'archivist',
    name: 'Calliope',
    title: 'Temporal Pattern Synthesizer',
    role: 'archivist',
    description: 'Analyzes behavioral patterns, writes weekly executive briefings, and tracks fatigue indexes.',
    autonomyLevel: 'passive',
    status: 'idle',
    currentAction: 'Awaiting event history synthesis',
    confidenceScore: 0,
    lastActive: new Date().toISOString(),
    totalDecisions: 0,
    metrics: [
      { label: 'Productivity Index', value: '0/100' },
      { label: 'Context Switches', value: '0 / wk' }
    ]
  }
]

interface SwarmState {
  settings: SwarmSettings
  agents: SwarmAgentProfile[]
  decisions: SwarmDecision[]
  negotiations: DiplomatNegotiationSession[]
  latestBriefing: ArchivistBriefing | null
  isAnalyzing: boolean
  lastRunTimestamp: string | null

  // Actions
  runSwarmCycle: () => Promise<void>
  applyDecision: (decisionId: string) => Promise<void>
  dismissDecision: (decisionId: string) => void
  setAgentAutonomy: (role: SwarmAgentRole, level: SwarmAutonomyLevel) => void
  updateSettings: (partial: Partial<SwarmSettings>) => void
  startDiplomatNegotiation: (
    peerName: string,
    meetingTitle: string,
    durationMinutes: number
  ) => Promise<DiplomatNegotiationSession>
  confirmNegotiationSlot: (sessionId: string) => Promise<void>
  clearDecisions: () => void
}

export const useTemporalSwarmStore = create<SwarmState>()(
  persist(
    (set, get) => ({
      settings: INITIAL_SETTINGS,
      agents: INITIAL_AGENTS,
      decisions: [],
      negotiations: [],
      latestBriefing: null,
      isAnalyzing: false,
      lastRunTimestamp: null,

      runSwarmCycle: async () => {
        set({ isAnalyzing: true })
        try {
          const { events } = useAppStore.getState()
          const { settings, agents } = get()

          // 1. Run Guardian
          const guardianDecisions = runGuardianAnalysis(events, settings)

          // 2. Run Strategist
          const strategistResult = runStrategistAnalysis(events, settings)

          // 3. Run Archivist
          const briefing = runArchivistSynthesis(events, settings)

          // Combine all generated decisions with existing ones (avoid duplicates by ID)
          const allNewDecisions = [...guardianDecisions, ...strategistResult.decisions]
          const existingIds = new Set(get().decisions.map((d) => d.id))
          const freshDecisions = allNewDecisions.filter((d) => !existingIds.has(d.id))

          // Auto-apply if agent is in autonomous mode and autoInsertBuffers is enabled
          const guardianAgent = agents.find((a) => a.id === 'guardian')
          const isGuardianAuto = guardianAgent?.autonomyLevel === 'autonomous'

          const processedDecisions: SwarmDecision[] = []

          for (const dec of freshDecisions) {
            if (
              isGuardianAuto &&
              (dec.type === 'buffer_inserted' || dec.type === 'deep_work_shielded') &&
              dec.eventPayload
            ) {
              // Automatically commit event to calendar
              try {
                const primaryCal =
                  useAppStore.getState().calendars.find((c) => c.is_default) ||
                  useAppStore.getState().calendars[0]
                const calId = primaryCal ? primaryCal.id : 'default-cal'

                const nowIso = new Date().toISOString()
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

                await useAppStore.getState().createEvent({
                  id: crypto.randomUUID(),
                  calendar_id: calId,
                  title: dec.eventPayload.title,
                  start: dec.eventPayload.start,
                  end: dec.eventPayload.end,
                  description: dec.eventPayload.description,
                  all_day: false,
                  timezone: tz,
                  priority: 'medium',
                  status: 'confirmed',
                  created_at: nowIso,
                  updated_at: nowIso
                })

                processedDecisions.push({ ...dec, applied: true, crdtSynced: true })
              } catch (err) {
                console.error('Failed to auto-apply swarm event:', err)
                processedDecisions.push(dec)
              }
            } else {
              processedDecisions.push(dec)
            }
          }

          // Refresh main calendar events
          await useAppStore.getState().fetchEvents()
          const liveEvents = useAppStore.getState().events

          const allDecisions = [...processedDecisions, ...get().decisions].slice(0, 50)

          // Dynamically compute live metrics for all 5 agents from actual events and negotiations
          const updatedAgents = computeLiveAgentProfiles(
            agents,
            liveEvents,
            allDecisions,
            settings,
            get().negotiations,
            briefing
          )

          set({
            decisions: allDecisions,
            latestBriefing: briefing,
            agents: updatedAgents,
            lastRunTimestamp: new Date().toISOString(),
            isAnalyzing: false
          })
        } catch (e) {
          console.error('Temporal swarm execution failed:', e)
          set({ isAnalyzing: false })
        }
      },

      applyDecision: async (decisionId: string) => {
        const decision = get().decisions.find((d) => d.id === decisionId)
        if (!decision || decision.applied) return

        if (decision.eventPayload) {
          try {
            const primaryCal =
              useAppStore.getState().calendars.find((c) => c.is_default) ||
              useAppStore.getState().calendars[0]
            const calId = primaryCal ? primaryCal.id : 'default-cal'

            const nowIso = new Date().toISOString()
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

            await useAppStore.getState().createEvent({
              id: crypto.randomUUID(),
              calendar_id: calId,
              title: decision.eventPayload.title,
              start: decision.eventPayload.start,
              end: decision.eventPayload.end,
              description: decision.eventPayload.description,
              all_day: false,
              timezone: tz,
              priority: 'medium',
              status: 'confirmed',
              created_at: nowIso,
              updated_at: nowIso
            })
          } catch (e) {
            console.error('Failed to manually apply decision:', e)
          }
        }

        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === decisionId ? { ...d, applied: true, crdtSynced: true } : d
          )
        }))
      },

      dismissDecision: (decisionId: string) => {
        set((state) => ({
          decisions: state.decisions.filter((d) => d.id !== decisionId)
        }))
      },

      setAgentAutonomy: (role: SwarmAgentRole, level: SwarmAutonomyLevel) => {
        set((state) => ({
          agents: state.agents.map((a) => (a.id === role ? { ...a, autonomyLevel: level } : a))
        }))
      },

      updateSettings: (partial: Partial<SwarmSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...partial }
        }))
      },

      startDiplomatNegotiation: async (peerName, meetingTitle, durationMinutes) => {
        const { events } = useAppStore.getState()
        const { settings, agents, decisions } = get()
        const session = negotiateDiplomatSlots(
          peerName,
          meetingTitle,
          durationMinutes,
          events,
          settings
        )

        const updatedNegotiations = [session, ...get().negotiations]

        // Log Diplomat decision
        const newDecision: SwarmDecision = {
          id: `dec-diplo-${session.sessionId}`,
          agentRole: 'diplomat',
          type: 'p2p_negotiation_resolved',
          title: `Autonomous Slot Negotiation with ${peerName}`,
          details: `Diplomat agent negotiated consensus for "${meetingTitle}" at ${session.agreedSlot?.start || 'Pending'} with ${session.consensusConfidence}% confidence in ${session.rounds} round(s).`,
          timestamp: new Date().toISOString(),
          impact: 'high',
          applied: false,
          crdtSynced: true,
          eventPayload: session.agreedSlot
            ? {
                title: `🤝 ${meetingTitle} (w/ ${peerName})`,
                start: session.agreedSlot.start,
                end: session.agreedSlot.end,
                description: `Peer-to-peer negotiated via Diplomat Agent through Automerge CRDT mesh.`
              }
            : undefined
        }

        const allDecisions = [newDecision, ...decisions]
        const updatedAgents = computeLiveAgentProfiles(
          agents,
          events,
          allDecisions,
          settings,
          updatedNegotiations,
          get().latestBriefing
        )

        set({
          negotiations: updatedNegotiations,
          decisions: allDecisions,
          agents: updatedAgents
        })

        return session
      },

      confirmNegotiationSlot: async (sessionId: string) => {
        const session = get().negotiations.find((n) => n.sessionId === sessionId)
        if (!session || !session.agreedSlot) return

        try {
          const primaryCal =
            useAppStore.getState().calendars.find((c) => c.is_default) ||
            useAppStore.getState().calendars[0]
          const calId = primaryCal ? primaryCal.id : 'default-cal'

          const nowIso = new Date().toISOString()
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

          await useAppStore.getState().createEvent({
            id: crypto.randomUUID(),
            calendar_id: calId,
            title: `🤝 ${session.meetingTitle} (w/ ${session.targetPeerName})`,
            start: session.agreedSlot.start,
            end: session.agreedSlot.end,
            description: `Autonomous P2P Diplomat Negotiation confirmed via local CRDT log.`,
            all_day: false,
            timezone: tz,
            priority: 'medium',
            status: 'confirmed',
            created_at: nowIso,
            updated_at: nowIso
          })

          set((state) => ({
            negotiations: state.negotiations.map((n) =>
              n.sessionId === sessionId ? { ...n, state: 'confirmed_in_crdt' as const } : n
            ),
            decisions: state.decisions.map((d) =>
              d.id.includes(sessionId) ? { ...d, applied: true } : d
            )
          }))
        } catch (e) {
          console.error('Failed to confirm negotiated slot:', e)
        }
      },

      clearDecisions: () => set({ decisions: [] })
    }),
    {
      name: 'stoa-temporal-swarm-store',
      partialize: (state) => ({
        settings: state.settings,
        agents: state.agents,
        decisions: state.decisions.slice(0, 30),
        negotiations: state.negotiations.slice(0, 20),
        latestBriefing: state.latestBriefing,
        lastRunTimestamp: state.lastRunTimestamp
      })
    }
  )
)
