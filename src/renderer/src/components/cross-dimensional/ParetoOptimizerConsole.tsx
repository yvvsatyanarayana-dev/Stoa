import React, { useState } from 'react'
import {
  Sliders,
  RotateCcw,
  CheckCircle2,
  BatteryCharging,
  Zap,
  DollarSign,
  HeartHandshake,
  HeartPulse,
  Clock,
  ShieldCheck
} from 'lucide-react'
import type { DimensionVector, ParetoFrontierPoint } from '../../types/crossDimensional'
import { useCrossDimensionalStore } from '../../store/useCrossDimensionalStore'
import { generateParetoFrontierPoints } from '../../services/crossDimensionalEngine'

interface ParetoOptimizerConsoleProps {
  baseline: DimensionVector
  simulated: DimensionVector
}

export const ParetoOptimizerConsole: React.FC<ParetoOptimizerConsoleProps> = ({
  baseline,
  simulated
}) => {
  const {
    simulationParams,
    updateSimulationParams,
    resetSimulation,
    activeFrontierPointId,
    selectFrontierPoint,
    applyParetoStrategyToCalendar
  } = useCrossDimensionalStore()

  const [isApplying, setIsApplying] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const frontierPoints: ParetoFrontierPoint[] = generateParetoFrontierPoints(baseline)

  const handleApply = async () => {
    setIsApplying(true)
    setSuccessNotice(null)
    try {
      const res = await applyParetoStrategyToCalendar()
      setSuccessNotice(`Applied Pareto strategy: Protected ${res.scheduledBlocks} deep work session(s) in your primary calendar!`)
      setTimeout(() => setSuccessNotice(null), 4500)
    } catch (e: any) {
      alert(`Optimization failed: ${e.message || String(e)}`)
    } finally {
      setIsApplying(false)
    }
  }

  // Deltas
  const deltaEnergy = simulated.energyBatteryPct - baseline.energyBatteryPct
  const deltaAttention = simulated.attentionFocusPoints - baseline.attentionFocusPoints
  const deltaMoney = simulated.moneyGrossValueUsd - baseline.moneyGrossValueUsd
  const deltaTrust = simulated.relationshipTrustCapital - baseline.relationshipTrustCapital
  const deltaStress = simulated.healthStressLoad - baseline.healthStressLoad

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {successNotice && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Preset Multi-Objective Pareto Frontier Strategies */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Pareto Frontier Multi-Objective Profiles
          </span>
          {activeFrontierPointId && (
            <button
              onClick={resetSimulation}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-mono transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Current</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {frontierPoints.filter((p) => !p.isCurrentSchedule).map((pt) => {
            const isSelected = activeFrontierPointId === pt.id

            return (
              <div
                key={pt.id}
                onClick={() => selectFrontierPoint(isSelected ? null : pt.id)}
                className={`p-3 rounded-[var(--radius-lg)] border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {pt.label}
                  </span>
                  {pt.isParetoOptimal && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                      Pareto
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-[var(--text-muted)] font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span>Meeting Load:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{pt.meetingHours}h/wk</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deep Architecture:</span>
                    <span className="font-semibold text-indigo-400">{pt.deepWorkHours}h/wk</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border-subtle)]">
                    <span>Pareto Utility:</span>
                    <span className="font-bold text-amber-400">{pt.overallParetoUtility}/100</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Sliders: Interactive Dimension Trade-off Knobs */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Interactive Dimension Trade-off Knobs
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Drag any knob — all 5 orthogonal axes recompute in real time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SLIDER 1: Meeting Reduction % */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Meeting Load Adjustment</span>
              </span>
              <span className={`font-mono font-bold ${
                simulationParams.meetingReductionPct < 0
                  ? 'text-emerald-400'
                  : simulationParams.meetingReductionPct > 0
                  ? 'text-amber-400'
                  : 'text-[var(--text-muted)]'
              }`}>
                {simulationParams.meetingReductionPct > 0 ? `+${simulationParams.meetingReductionPct}%` : `${simulationParams.meetingReductionPct}%`} ({simulated.timeMeetingHours} hrs)
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={simulationParams.meetingReductionPct}
              onChange={(e) => updateSimulationParams({ meetingReductionPct: Number(e.target.value) })}
              className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>-50% (Protected)</span>
              <span>0% (Current: {baseline.timeMeetingHours}h)</span>
              <span>+50% (Dense)</span>
            </div>
          </div>

          {/* SLIDER 2: Deep Work Target Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Weekly Deep Focus Target</span>
              </span>
              <span className="font-mono font-bold text-indigo-400">
                {simulationParams.targetDeepWorkHours} hrs/wk ({simulated.timeDeepWorkHours} hrs actual)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={simulationParams.targetDeepWorkHours}
              onChange={(e) => updateSimulationParams({ targetDeepWorkHours: Number(e.target.value) })}
              className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>5 hrs</span>
              <span>20 hrs (Equilibrium)</span>
              <span>40 hrs (Max Flow)</span>
            </div>
          </div>

          {/* SLIDER 3: Billing Rate ($/hr) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base Opportunity & Billing Rate</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                ${simulationParams.hourlyBillingRate}/hr (${simulated.moneyGrossValueUsd} gross)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={simulationParams.hourlyBillingRate}
              onChange={(e) => updateSimulationParams({ hourlyBillingRate: Number(e.target.value) })}
              className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>$50/hr</span>
              <span>$150/hr</span>
              <span>$500/hr</span>
            </div>
          </div>

          {/* SLIDER 4: 1:1 Social Syncs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                <span>1:1 High-Trust Connection Target</span>
              </span>
              <span className="font-mono font-bold text-pink-400">
                {simulationParams.targetOneOnOneHours} hrs/wk ({simulated.relationshipTrustCapital} Trust)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={simulationParams.targetOneOnOneHours}
              onChange={(e) => updateSimulationParams({ targetOneOnOneHours: Number(e.target.value) })}
              className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>1 hr (Lean)</span>
              <span>3 hrs</span>
              <span>10 hrs (Socially Dense)</span>
            </div>
          </div>
        </div>

        {/* Real-Time Impact Differential Readout Pills */}
        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-2">
            Real-Time Pareto Differential Impact
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* Energy Delta */}
            <div className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
              deltaEnergy > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : deltaEnergy < 0
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}>
              <BatteryCharging className="w-3 h-3" />
              <span>Energy: {deltaEnergy >= 0 ? `+${deltaEnergy}%` : `${deltaEnergy}%`}</span>
            </div>

            {/* Attention Delta */}
            <div className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
              deltaAttention > 0
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                : deltaAttention < 0
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}>
              <Zap className="w-3 h-3" />
              <span>Focus: {deltaAttention >= 0 ? `+${deltaAttention} pts` : `${deltaAttention} pts`}</span>
            </div>

            {/* Money Delta */}
            <div className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
              deltaMoney >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <DollarSign className="w-3 h-3" />
              <span>Gross: {deltaMoney >= 0 ? `+$${deltaMoney}` : `-$${Math.abs(deltaMoney)}`}</span>
            </div>

            {/* Stress Delta (Negative is Good) */}
            <div className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
              deltaStress < 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : deltaStress > 0
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}>
              <HeartPulse className="w-3 h-3" />
              <span>Stress: {deltaStress > 0 ? `+${deltaStress}` : `${deltaStress}`} pts</span>
            </div>

            {/* Relationships Delta */}
            <div className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
              deltaTrust >= 0
                ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <HeartHandshake className="w-3 h-3" />
              <span>Trust: {deltaTrust >= 0 ? `+${deltaTrust}` : `${deltaTrust}`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execute Pareto Optimization Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-primary)]">
            Apply Pareto Strategy to Calendar
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Auto-schedules protected cognitive flow blocks and trims low-utility meeting slots in your master SQLite database.
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={isApplying}
          className="btn-primary py-2 px-5 text-xs inline-flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2]" />
          <span>{isApplying ? 'Rebalancing...' : 'Execute Pareto Calendar Rebalance'}</span>
        </button>
      </div>
    </div>
  )
}
