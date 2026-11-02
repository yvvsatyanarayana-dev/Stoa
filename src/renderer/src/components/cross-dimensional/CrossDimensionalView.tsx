import React, { useState, useMemo } from 'react'
import {
  Compass,
  Clock,
  BatteryCharging,
  Zap,
  DollarSign,
  HeartHandshake,
  HeartPulse,
  Sliders,
  Sparkles,
  GitBranch,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  X,
  Check
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useBurnoutStore } from '../../store/useBurnoutStore'
import { useCrossDimensionalStore } from '../../store/useCrossDimensionalStore'
import {
  computeDimensionVector,
  simulateParetoAdjustment,
  extractDimensionKPIs
} from '../../services/crossDimensionalEngine'
import { RadarChart6D } from './RadarChart6D'
import { ParallelCoordinatesPlot6D } from './ParallelCoordinatesPlot6D'
import { SankeyFlow168H } from './SankeyFlow168H'
import { ParetoOptimizerConsole } from './ParetoOptimizerConsole'

export type CDViewTab = 'radar_parallel' | 'sankey_flow' | 'pareto_optimizer'

export const CrossDimensionalView: React.FC = () => {
  const { events, resources } = useAppStore()
  const { profile } = useBurnoutStore()
  const {
    settings,
    updateSettings,
    simulationParams,
    isSimulating
  } = useCrossDimensionalStore()

  const [activeTab, setActiveTab] = useState<CDViewTab>('radar_parallel')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Local state for economic settings modal
  const [tempBillingRate, setTempBillingRate] = useState(settings.defaultHourlyRate)
  const [tempBillableTags, setTempBillableTags] = useState(settings.billableTagKeywords.join(', '))
  const [tempDeepWorkTags, setTempDeepWorkTags] = useState(settings.deepWorkKeywords.join(', '))
  const [tempClientMeetingTags, setTempClientMeetingTags] = useState(settings.clientMeetingKeywords.join(', '))

  // Compute live Baseline 6D Vector from real SQLite events & resources
  const baseline = useMemo(() => {
    return computeDimensionVector(events, resources, profile, settings)
  }, [events, resources, profile, settings])

  // Compute live Simulated 6D Vector based on real-time slider adjustments
  const simulated = useMemo(() => {
    return simulateParetoAdjustment(baseline, simulationParams)
  }, [baseline, simulationParams])

  // Active display vector
  const activeVector = isSimulating ? simulated : baseline
  const kpis = extractDimensionKPIs(activeVector, baseline)

  const handleSaveSettings = () => {
    updateSettings({
      defaultHourlyRate: Math.max(10, tempBillingRate),
      billableTagKeywords: tempBillableTags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      deepWorkKeywords: tempDeepWorkTags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      clientMeetingKeywords: tempClientMeetingTags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    })
    setIsSettingsOpen(false)
  }

  const kpiIcons: Record<string, React.ReactNode> = {
    'Time Allocated': <Clock className="w-4 h-4 text-sky-400" />,
    'Energy Battery': <BatteryCharging className="w-4 h-4 text-emerald-400" />,
    'Attention Depth': <Zap className="w-4 h-4 text-indigo-400" />,
    'Economic Output': <DollarSign className="w-4 h-4 text-amber-400" />,
    'Relationship Capital': <HeartHandshake className="w-4 h-4 text-pink-400" />,
    'Health & Stress': <HeartPulse className="w-4 h-4 text-rose-400" />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header & Navigation Bar */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none no-scrollbar">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
              Cross-Dimensional Calendar & Life Optimizer
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs sm:max-w-md">
              6D Unified Model: Time • Energy • Attention • Money • Relationships • Health
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Economic Settings Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] text-xs shrink-0 no-scrollbar overflow-x-auto gap-0.5 max-w-full">
            <button
              onClick={() => setActiveTab('radar_parallel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'radar_parallel'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>6D Radar & Parallel Coordinates</span>
            </button>

            <button
              onClick={() => setActiveTab('sankey_flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'sankey_flow'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>168h Life Sankey Flow</span>
            </button>

            <button
              onClick={() => setActiveTab('pareto_optimizer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'pareto_optimizer'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pareto Frontier Optimizer</span>
              {isSimulating && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setTempBillingRate(settings.defaultHourlyRate)
              setTempBillableTags(settings.billableTagKeywords.join(', '))
              setTempDeepWorkTags(settings.deepWorkKeywords.join(', '))
              setTempClientMeetingTags(settings.clientMeetingKeywords.join(', '))
              setIsSettingsOpen(true)
            }}
            className="p-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Configure Economic & Life Dimension Rates"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top 6D Dimension KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {kpiIcons[kpi.label]}
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] truncate">
                      {kpi.label.split(' ')[0]}
                    </span>
                  </div>
                  {isSimulating && kpi.deltaPct !== 0 && (
                    <span className={`text-[9px] font-mono font-bold flex items-center ${
                      kpi.deltaPct > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {kpi.deltaPct > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {Math.abs(kpi.deltaPct)}%
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-[var(--text-primary)] font-mono">
                    {typeof kpi.raw === 'number' && kpi.raw >= 1000 ? `$${(kpi.raw / 1000).toFixed(1)}k` : kpi.raw}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {kpi.unit}
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      kpi.status === 'optimal'
                        ? 'bg-emerald-500'
                        : kpi.status === 'moderate'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, kpi.normalizedScore))}%` }}
                  />
                </div>

                <div className="text-[9px] text-[var(--text-muted)] truncate font-mono">
                  {kpi.description}
                </div>
              </div>
            ))}
          </div>

          {/* TAB 1: 6D RADAR & PARALLEL COORDINATES PLOT */}
          {activeTab === 'radar_parallel' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 5 Cols: 6D Radar Polygon */}
                <div className="lg:col-span-5 p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col items-center">
                  <div className="w-full flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>6D Radar Polygon</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Normalized 0-100 Axis
                    </span>
                  </div>

                  <RadarChart6D
                    baseline={baseline}
                    simulated={simulated}
                    isSimulating={isSimulating}
                    size={340}
                  />
                </div>

                {/* Right 7 Cols: Parallel Coordinates Plot */}
                <div className="lg:col-span-7 p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col">
                  <div className="w-full flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>6D Parallel Coordinates Plot</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Multi-Axis Trajectory
                    </span>
                  </div>

                  <ParallelCoordinatesPlot6D
                    baseline={baseline}
                    simulated={simulated}
                    isSimulating={isSimulating}
                    height={340}
                  />
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[var(--text-secondary)]">
                    {isSimulating
                      ? 'Displaying simulated Pareto adjustments over your calendar baseline.'
                      : 'Radar and Parallel coordinates are derived from your live calendar events, biometrics, and personnel resources.'}
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab('pareto_optimizer')}
                  className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open Pareto Optimizer Controls</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 168-HOUR LIFE SANKEY FLOW */}
          {activeTab === 'sankey_flow' && (
            <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    168-Hour Life Resource Decomposition
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Deconstructs the fixed weekly life budget (24h × 7 = 168h) into Sleep, Focus, Monetized Delivery, and Social Capital.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {Math.round((profile?.chronotype === 'early-bird' ? 8 : profile?.chronotype === 'night-owl' ? 7.5 : 7.8) * 7)}h Sleep
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {activeVector.timeScheduledHours}h Scheduled
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {activeVector.timeRestBufferHours}h Rest Buffer
                  </span>
                </div>
              </div>

              <SankeyFlow168H vector={activeVector} height={360} />
            </div>
          )}

          {/* TAB 3: PARETO FRONTIER OPTIMIZER */}
          {activeTab === 'pareto_optimizer' && (
            <div className="animate-in fade-in duration-150">
              <ParetoOptimizerConsole baseline={baseline} simulated={simulated} />
            </div>
          )}
        </div>
      </div>

      {/* Economic & Life Dimension Configuration Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Economic & Dimension Benchmarks
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Hourly Billing Rate ($ USD / hr)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--text-muted)] font-mono">$</span>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    step={5}
                    value={tempBillingRate}
                    onChange={(e) => setTempBillingRate(Number(e.target.value))}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[var(--radius-md)] pl-7 pr-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Used to benchmark commercial yields and meeting opportunity drag.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Deep Work Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={tempDeepWorkTags}
                  onChange={(e) => setTempDeepWorkTags(e.target.value)}
                  placeholder="deep, focus, code, dev, write, architecture"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Events matching these keywords get priority attention focus scoring.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Billable Project Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={tempBillableTags}
                  onChange={(e) => setTempBillableTags(e.target.value)}
                  placeholder="client, consulting, contract, freelance, billable"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Events matching these keywords contribute directly to monetized gross revenue.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Client & External Meeting Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={tempClientMeetingTags}
                  onChange={(e) => setTempClientMeetingTags(e.target.value)}
                  placeholder="demo, pitch, sync, review, customer, stakeholder"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Events classified as client-facing meetings rather than internal overhead.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Benchmarks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
