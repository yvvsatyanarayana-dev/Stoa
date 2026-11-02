/**
 * Scenario World View — Generative Schedule Universes Command Center
 * Procedural Multiverse Scenarios, Learned Generative Priors & Automerge CRDT Branching
 */

import React, { useEffect } from 'react'
import {
  Globe,
  GitBranch,
  Activity,
  Calendar,
  Plane,
  CheckCircle2,
  Plus,
  Zap
} from 'lucide-react'
import { useScenarioWorldStore } from '../../store/useScenarioWorldStore'
import { MultiverseTreeGraph } from './MultiverseTreeGraph'
import { ScenarioImpactMatrix } from './ScenarioImpactMatrix'
import { ScenarioTimelinePreview } from './ScenarioTimelinePreview'
import { ScenarioTeamTravel } from './ScenarioTeamTravel'
import { ScenarioForkModal } from './ScenarioForkModal'

export const ScenarioWorldView: React.FC = () => {
  const {
    branches,
    rootBranchId,
    activeBranchId,
    selectedBranchId,
    activeTab,
    isForkModalOpen,
    isEnactConfirmOpen,
    enactedSuccessNotice,
    initializeMultiverse,
    setActiveTab,
    selectBranch,
    openForkModal,
    closeForkModal,
    openEnactConfirm,
    closeEnactConfirm,
    forkBranch,
    enactBranchToMasterCalendar,
    addPeerToBranch
  } = useScenarioWorldStore()

  useEffect(() => {
    initializeMultiverse()
  }, [])

  const reality = branches[rootBranchId] || Object.values(branches)[0]
  const selected = branches[selectedBranchId] || reality

  if (!reality || !selected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)] text-xs text-[var(--text-muted)] font-mono">
        Synthesizing Generative Priors & CRDT Multiverse...
      </div>
    )
  }

  const isRealitySelected = selected.id === reality.id
  const isSelectedEnacted = selected.id === activeBranchId

  const handleEnact = async () => {
    await enactBranchToMasterCalendar(selected.id)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header & Navigation Bar */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none no-scrollbar">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
              Generative Schedule Worlds & Multiverse
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs sm:max-w-md">
              Procedural Scenarios • Empirical Automerge Priors • CRDT Document Forks
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Enact Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] text-xs shrink-0 no-scrollbar overflow-x-auto gap-0.5 max-w-full">
            <button
              onClick={() => setActiveTab('multiverse_tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'multiverse_tree'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Multiverse Decision Tree</span>
            </button>

            <button
              onClick={() => setActiveTab('impact_matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'impact_matrix'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Comparative Impact Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('scenario_timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'scenario_timeline'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Universe Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('team_travel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'team_travel'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Travel & Multi-Player</span>
            </button>
          </div>

          {!isRealitySelected && !isSelectedEnacted && (
            <button
              onClick={openEnactConfirm}
              className="btn-primary py-1.5 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              title="One-click migration: enact this alternate universe directly into your master calendar"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Make Reality</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Enacted Success Alert Banner */}
          {enactedSuccessNotice && (
            <div className="p-4 rounded-[var(--radius-lg)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3 shadow-md animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{enactedSuccessNotice}</span>
            </div>
          )}

          {/* Quick Branch Switcher Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Viewing Branch:
              </span>
              <div className="flex items-center gap-1.5">
                {Object.values(branches).map((b) => {
                  const isCur = b.id === selectedBranchId
                  return (
                    <button
                      key={b.id}
                      onClick={() => selectBranch(b.id)}
                      className={`px-3 py-1 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isCur
                          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] border border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                      <span>{b.name}</span>
                      {b.id === activeBranchId && (
                        <span className="text-[8px] font-mono px-1 rounded bg-[var(--accent)] text-[var(--accent-text)] font-bold">
                          LIVE
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => openForkModal()}
              className="px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Fork Scenario</span>
            </button>
          </div>

          {/* TAB 1: Multiverse Decision Tree */}
          {activeTab === 'multiverse_tree' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <MultiverseTreeGraph
                branches={branches}
                activeBranchId={activeBranchId}
                selectedBranchId={selectedBranchId}
                onSelectBranch={selectBranch}
                onOpenForkModal={() => openForkModal()}
              />
              <ScenarioImpactMatrix reality={reality} selected={selected} />
            </div>
          )}

          {/* TAB 2: Comparative Impact Matrix */}
          {activeTab === 'impact_matrix' && (
            <div className="animate-in fade-in duration-150">
              <ScenarioImpactMatrix reality={reality} selected={selected} />
            </div>
          )}

          {/* TAB 3: Scenario Timeline Preview */}
          {activeTab === 'scenario_timeline' && (
            <div className="animate-in fade-in duration-150">
              <ScenarioTimelinePreview branch={selected} />
            </div>
          )}

          {/* TAB 4: Travel & Team Dynamics */}
          {activeTab === 'team_travel' && (
            <div className="animate-in fade-in duration-150">
              <ScenarioTeamTravel branch={selected} onAddPeer={addPeerToBranch} />
            </div>
          )}
        </div>
      </div>

      {/* Fork Modal */}
      {isForkModalOpen && (
        <ScenarioForkModal
          branches={branches}
          initialParentId={selectedBranchId}
          onClose={closeForkModal}
          onFork={forkBranch}
        />
      )}

      {/* Enact to Master Calendar Confirmation Modal */}
      {isEnactConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Make Alternate World Real?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  1-Click Multiverse Migration to Master Calendar
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enacting <strong className="text-[var(--text-primary)]">{selected.name}</strong> will create{' '}
              <strong className="text-[var(--text-primary)]">{selected.generatedEvents.length} simulated events</strong> directly into your master calendar database.
            </p>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Target Hours/wk:</span>
                <span className="font-bold">{selected.projections.weeklyScheduledHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Quarterly Travel:</span>
                <span className="font-bold">{selected.projections.quarterlyTravelDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Projected Annual Comp:</span>
                <span className="font-bold text-emerald-400">${Math.round(selected.projections.annualProjectedCompensationUsd / 1000)}k</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={closeEnactConfirm}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleEnact}
                className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Migrate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
