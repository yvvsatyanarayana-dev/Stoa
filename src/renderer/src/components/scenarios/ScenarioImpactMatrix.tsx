/**
 * Scenario Impact Matrix
 * Comprehensive Multi-Axis Reality vs Alternate World Comparative Analysis
 */

import React from 'react'
import type { ScenarioBranch } from '../../types/scenarioWorld'
import {
  Clock,
  DollarSign,
  Heart,
  Activity,
  Plane,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react'

interface ScenarioImpactMatrixProps {
  reality: ScenarioBranch
  selected: ScenarioBranch
}

export const ScenarioImpactMatrix: React.FC<ScenarioImpactMatrixProps> = ({ reality, selected }) => {
  const isReality = selected.id === reality.id
  const pReal = reality.projections
  const pSel = selected.projections
  const delta = selected.deltaFromReality

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="space-y-5">
      {/* Overview Header Banner */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-white shadow-xs shrink-0"
            style={{ background: selected.color }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{selected.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                {selected.archetype.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{selected.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            CRDT Fork: <code className="text-[var(--text-primary)]">{selected.crdtDocumentForkId.split(':').pop()}</code>
          </span>
        </div>
      </div>

      {/* Primary Comparative 6D Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Workload & Schedule Capacity */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Weekly Work Load</span>
            </div>
            {!isReality && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center ${
                  delta.hoursDeltaPct <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {delta.hoursDeltaPct > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(delta.hoursDeltaPct)}%
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {pSel.weeklyScheduledHours}h
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">/ week</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] text-right">
              Baseline: {pReal.weeklyScheduledHours}h
            </div>
          </div>

          {/* Allocation breakdown */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span>Meetings: {pSel.weeklyMeetingHours}h</span>
              <span>Deep Focus: {pSel.weeklyDeepWorkHours}h</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(pSel.weeklyMeetingHours / pSel.weeklyScheduledHours) * 100}%` }}
              />
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${(pSel.weeklyDeepWorkHours / pSel.weeklyScheduledHours) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Financial Yield & Opportunity */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Projected Annual Income</span>
            </div>
            {!isReality && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center ${
                  delta.incomeDeltaPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {delta.incomeDeltaPct > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(delta.incomeDeltaPct)}%
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                ${Math.round(pSel.annualProjectedCompensationUsd / 1000)}k
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">/ year</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] text-right">
              Baseline: ${Math.round(pReal.annualProjectedCompensationUsd / 1000)}k
            </div>
          </div>

          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            Hourly Yield: ${Math.round(pSel.annualProjectedCompensationUsd / (pSel.weeklyScheduledHours * 48))}/hr
          </div>
        </div>

        {/* Card 3: Family Dinners & Evening Presence */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Family Dinners Preserved</span>
            </div>
            {!isReality && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center ${
                  delta.familyDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {delta.familyDeltaPct > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(delta.familyDeltaPct)}%
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {pSel.weeklyFamilyDinnersPreserved}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">of 7 evenings</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] text-right">
              Weekend Free: {pSel.weekendFreeHours}h
            </div>
          </div>

          {/* 7-Day Presence Dots */}
          <div className="flex items-center justify-between pt-1">
            {daysOfWeek.map((day, idx) => {
              const isPreserved = idx < pSel.weeklyFamilyDinnersPreserved
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">{day}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                      isPreserved ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {isPreserved && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card 4: Physiological Burnout & Stress */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Projected Burnout Risk</span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                pSel.burnoutRiskIndex > 65
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : pSel.burnoutRiskIndex > 45
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {pSel.burnoutRiskIndex > 65 ? 'Elevated Risk' : pSel.burnoutRiskIndex > 45 ? 'Moderate' : 'Sustainable'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {pSel.burnoutRiskIndex}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">/ 100</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              Baseline: {pReal.burnoutRiskIndex}/100
            </div>
          </div>

          <div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                pSel.burnoutRiskIndex > 65 ? 'bg-red-500' : pSel.burnoutRiskIndex > 45 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${pSel.burnoutRiskIndex}%` }}
            />
          </div>
        </div>

        {/* Card 5: Biomarkers & Heart Rate Variability */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Projected HRV & Autonomic Health</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Recovery Index: {pSel.cognitiveVitalityScore}%
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {pSel.projectedHrvMs}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">ms rMSSD</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              Baseline: {pReal.projectedHrvMs} ms
            </div>
          </div>

          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            Cognitive Vitality: {pSel.cognitiveVitalityScore} / 100 • Restorative Sleep: {pSel.burnoutRiskIndex > 60 ? 'Strained' : 'Optimal'}
          </div>
        </div>

        {/* Card 6: Travel Cadence & Jet Lag */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Plane className="w-4 h-4 text-indigo-400" />
              <span>Quarterly Travel Cadence</span>
            </div>
            {!isReality && (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {delta.travelDeltaDays >= 0 ? `+${delta.travelDeltaDays}` : delta.travelDeltaDays} days
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {pSel.quarterlyTravelDays}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">days / quarter</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              Baseline: {pReal.quarterlyTravelDays} days
            </div>
          </div>

          <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
            {selected.travelSchedule.length > 0
              ? `${selected.travelSchedule.length} major scheduled trips across continents`
              : 'Zero long-haul travel disruptions'}
          </div>
        </div>
      </div>
    </div>
  )
}
