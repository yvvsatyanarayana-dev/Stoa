/**
 * Generative Schedule Worlds Store
 * Zustand State for Multiverse Scenario Trees, CRDT Document Branches & 1-Click Migration
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ScenarioBranch,
  ScenarioWorldArchetype,
  GenerativePriors
} from '../types/scenarioWorld'
import {
  learnPriorsFromAutomergeHistory,
  buildRealityRootBranch,
  procedurallyGenerateScenarioWorld,
  enactWorldToMasterCalendar
} from '../services/scenarioWorldEngine'
import { useAppStore } from './useAppStore'
import { useBurnoutStore } from './useBurnoutStore'

export type ScenarioWorldTab = 'multiverse_tree' | 'scenario_timeline' | 'impact_matrix' | 'team_travel'

export interface ScenarioWorldState {
  // Multiverse tree state
  rootBranchId: string
  activeBranchId: string
  selectedBranchId: string
  branches: Record<string, ScenarioBranch>
  priors: GenerativePriors | null
  activeTab: ScenarioWorldTab

  // UI Dialog Controls
  isForkModalOpen: boolean
  isEnactConfirmOpen: boolean
  isInvitingPeer: boolean
  enactedSuccessNotice: string | null

  // Actions
  initializeMultiverse: () => void
  setActiveTab: (tab: ScenarioWorldTab) => void
  selectBranch: (branchId: string) => void
  openForkModal: () => void
  closeForkModal: () => void
  openEnactConfirm: () => void
  closeEnactConfirm: () => void

  forkBranch: (params: {
    name: string
    archetype: ScenarioWorldArchetype
    parentBranchId?: string
    customPrompt?: string
    weeksCount?: number
  }) => ScenarioBranch

  deleteBranch: (branchId: string) => void
  enactBranchToMasterCalendar: (branchId: string) => Promise<{ success: boolean; eventsCreated: number }>
  addPeerToBranch: (branchId: string, peerName: string, role: 'partner' | 'advisor' | 'colleague') => void
}

export const useScenarioWorldStore = create<ScenarioWorldState>()(
  persist(
    (set, get) => ({
      rootBranchId: 'reality-root',
      activeBranchId: 'reality-root',
      selectedBranchId: 'reality-root',
      branches: {},
      priors: null,
      activeTab: 'multiverse_tree',

      isForkModalOpen: false,
      isEnactConfirmOpen: false,
      isInvitingPeer: false,
      enactedSuccessNotice: null,

      initializeMultiverse: () => {
        const events = useAppStore.getState().events
        const resources = useAppStore.getState().resources
        const profile = useBurnoutStore.getState().profile

        const learnedPriors = learnPriorsFromAutomergeHistory(events, resources, profile)
        const currentBranches = get().branches
        const rootReality = buildRealityRootBranch(learnedPriors, events, profile)

        if (!currentBranches['reality-root']) {
          // Pre-seed 3 foundational scenario branches for instant exploration
          const vpBranch = procedurallyGenerateScenarioWorld({
            name: 'Executive VP Offer',
            archetype: 'executive_leadership',
            parentBranch: rootReality,
            priors: learnedPriors
          })

          const startupBranch = procedurallyGenerateScenarioWorld({
            name: 'Stealth AI Venture',
            archetype: 'startup_founder',
            parentBranch: rootReality,
            priors: learnedPriors
          })

          const sabbaticalBranch = procedurallyGenerateScenarioWorld({
            name: 'Creative Sabbatical',
            archetype: 'creative_sabbatical',
            parentBranch: rootReality,
            priors: learnedPriors
          })

          set({
            priors: learnedPriors,
            rootBranchId: 'reality-root',
            activeBranchId: 'reality-root',
            selectedBranchId: vpBranch.id,
            branches: {
              [rootReality.id]: rootReality,
              [vpBranch.id]: vpBranch,
              [startupBranch.id]: startupBranch,
              [sabbaticalBranch.id]: sabbaticalBranch
            }
          })
        } else {
          // Dynamically synchronize the reality-root baseline with live calendar changes
          const updatedBranches = { ...currentBranches, ['reality-root']: rootReality }
          set({
            priors: learnedPriors,
            branches: updatedBranches
          })
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      selectBranch: (branchId) => {
        if (get().branches[branchId]) {
          set({ selectedBranchId: branchId })
        }
      },

      openForkModal: () => set({ isForkModalOpen: true }),
      closeForkModal: () => set({ isForkModalOpen: false }),

      openEnactConfirm: () => set({ isEnactConfirmOpen: true }),
      closeEnactConfirm: () => set({ isEnactConfirmOpen: false }),

      forkBranch: (params) => {
        const { name, archetype, parentBranchId, customPrompt, weeksCount } = params
        const state = get()
        const parent = state.branches[parentBranchId || state.selectedBranchId] || state.branches['reality-root']
        const priors = state.priors || learnPriorsFromAutomergeHistory(useAppStore.getState().events, useAppStore.getState().resources)

        const newBranch = procedurallyGenerateScenarioWorld({
          name,
          archetype,
          parentBranch: parent,
          priors,
          customPrompt,
          weeksCount
        })

        set((s) => ({
          branches: {
            ...s.branches,
            [newBranch.id]: newBranch
          },
          selectedBranchId: newBranch.id,
          isForkModalOpen: false
        }))

        return newBranch
      },

      deleteBranch: (branchId) => {
        if (branchId === 'reality-root') return // Cannot delete reality root

        set((s) => {
          const next = { ...s.branches }
          delete next[branchId]
          return {
            branches: next,
            selectedBranchId: s.selectedBranchId === branchId ? 'reality-root' : s.selectedBranchId
          }
        })
      },

      enactBranchToMasterCalendar: async (branchId) => {
        const branch = get().branches[branchId]
        if (!branch) return { success: false, eventsCreated: 0 }

        const result = await enactWorldToMasterCalendar(branch)

        // Refresh live master calendar in store
        await useAppStore.getState().fetchEvents()

        set({
          isEnactConfirmOpen: false,
          activeBranchId: branchId,
          enactedSuccessNotice: `Enacted alternate world "${branch.name}" into master calendar! Generated ${result.eventsCreated} event(s).`
        })

        setTimeout(() => {
          set({ enactedSuccessNotice: null })
        }, 5000)

        return { success: true, eventsCreated: result.eventsCreated }
      },

      addPeerToBranch: (branchId, peerName, role) => {
        const branch = get().branches[branchId]
        if (!branch) return

        const colors = ['#f59e0b', '#ec4899', '#38bdf8', '#10b981', '#a855f7']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]

        const updated = {
          ...branch,
          collaborators: [
            ...branch.collaborators,
            {
              peerId: `peer-${Date.now()}`,
              peerName,
              avatarColor: randomColor,
              role,
              joinedAt: new Date().toISOString(),
              commentsCount: 1
            }
          ]
        }

        set((s) => ({
          branches: { ...s.branches, [branchId]: updated }
        }))
      }
    }),
    {
      name: 'stoa-generative-worlds-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        branches: state.branches,
        activeBranchId: state.activeBranchId,
        selectedBranchId: state.selectedBranchId
      })
    }
  )
)
