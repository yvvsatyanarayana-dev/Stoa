import React, { useState } from 'react'
import {
  Brain,
  Activity,
  Zap,
  Coffee,
  ShieldCheck,
  Bluetooth,
  Radio,
  Eye,
  Keyboard,
  MoonStar,
  X,
  Flame
} from 'lucide-react'
import { useNeuralStore } from '../../store/useNeuralStore'
import { EEGWaveformVisualizer } from './EEGWaveformVisualizer'
import { ThoughtIntentConsole } from './ThoughtIntentConsole'
import { SubconsciousDreamConsole } from './SubconsciousDreamConsole'

export type NeuralTab = 'telemetry' | 'thought_terminal' | 'subconscious_dreams'

export const NeuralInterfaceView: React.FC = () => {
  const {
    mode,
    telemetry,
    cognitiveState,
    autoShieldEnabled,
    toggleAutoShield,
    microBreakAlert,
    dismissMicroBreak,
    connectBCIDevice
  } = useNeuralStore()

  const [activeTab, setActiveTab] = useState<NeuralTab>('telemetry')
  const [bciConnecting, setBciConnecting] = useState(false)
  const [connectMessage, setConnectMessage] = useState<string | null>(null)

  const handleConnectBCI = async () => {
    setBciConnecting(true)
    const res = await connectBCIDevice()
    setBciConnecting(false)
    setConnectMessage(res.success ? `Connected to ${res.deviceName}` : `Using ${res.deviceName}`)
    setTimeout(() => setConnectMessage(null), 4000)
  }

  const stateColors: Record<string, { bg: string; text: string; border: string }> = {
    deep_flow: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    hyper_focused: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    collaborative: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
    fatigued: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    restoration_needed: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' }
  }

  const activeColor = stateColors[cognitiveState] || stateColors.collaborative

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header & Mode Navigation */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none no-scrollbar">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
              Neural Calendar Interface
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs sm:max-w-md">
              Thought-to-Event • Focus & Energy Detection • Smart Focus Time • Sleep & Dream Notes
            </p>
          </div>
        </div>

        {/* View Switcher Tabs - Segmented Pill Control */}
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] text-xs shrink-0 no-scrollbar overflow-x-auto gap-0.5 max-w-full">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live BCI Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('thought_terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'thought_terminal'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Thought-to-Event</span>
          </button>

          <button
            onClick={() => setActiveTab('subconscious_dreams')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'subconscious_dreams'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <MoonStar className="w-3.5 h-3.5" />
            <span>Dream & Spindle Insights</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Micro-Break Prompt Alert Banner */}
          {microBreakAlert && (
            <div className="p-4 rounded-[var(--radius-lg)] bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2.5">
                <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">
                    Micro-Break Recommended: Continuous Flow at {microBreakAlert.sustainedFlowMinutes} mins
                  </div>
                  <div className="text-[11px] opacity-80">
                    {microBreakAlert.triggerReason} Step away for 3 minutes to restore synaptic plasticity.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={dismissMicroBreak}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded text-xs font-semibold transition-colors"
                >
                  Take Break
                </button>
                <button
                  onClick={dismissMicroBreak}
                  className="p-1 text-amber-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {connectMessage && (
            <div className="p-3 rounded-[var(--radius-md)] bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
              <Radio className="w-4 h-4 shrink-0" />
              <span>{connectMessage}</span>
            </div>
          )}

          {/* Top Real-Time Cognitive Telemetry Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Cognitive State */}
            <div className={`p-3 rounded-[var(--radius-lg)] border shadow-xs space-y-1 ${activeColor.bg} ${activeColor.border}`}>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Cognitive State</span>
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div className={`text-xs font-bold uppercase truncate ${activeColor.text}`}>
                {cognitiveState.replace('_', ' ')}
              </div>
              <div className="text-[9px] text-[var(--text-muted)] font-mono">
                {cognitiveState === 'deep_flow' ? 'Protected by Shield' : 'BCI Stream Active'}
              </div>
            </div>

            {/* Cognitive Load */}
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Cognitive Load</span>
                <Zap className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {telemetry.cognitiveLoadPct}%
              </div>
              <div className="w-full h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.cognitiveLoadPct}%` }}
                />
              </div>
            </div>

            {/* Focus Index */}
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Focus Index</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {telemetry.focusIndex}
              </div>
              <div className="text-[9px] text-[var(--text-muted)] font-mono">
                (Beta+Gamma)/(Theta+Alpha)
              </div>
            </div>

            {/* Keystroke Cadence */}
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Input Cadence</span>
                <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {telemetry.keystrokeCadenceWpm} <span className="text-xs font-normal text-[var(--text-muted)]">WPM</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)] font-mono">
                {telemetry.interKeystrokeIntervalMs}ms IKI pause
              </div>
            </div>

            {/* Blink Rate */}
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Blink Rate</span>
                <Eye className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {telemetry.blinkRatePerMinute} <span className="text-xs font-normal text-[var(--text-muted)]">/min</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)] font-mono">
                {telemetry.pupilDilationMm}mm pupil dilation
              </div>
            </div>

            {/* BCI Connection Device */}
            <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>BCI Protocol</span>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xs font-bold font-mono text-emerald-400 truncate">
                {mode === 'hardware_bci' ? 'Bluetooth GATT' : 'Hardware Proxy'}
              </div>
              <button
                onClick={handleConnectBCI}
                disabled={bciConnecting}
                className="text-[9px] font-mono text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <Bluetooth className="w-2.5 h-2.5" />
                <span>{bciConnecting ? 'Scanning...' : 'Pair Headset'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE BCI TELEMETRY & AUTO-SHIELD */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* EEG Spectral Waveform Canvas Visualizer */}
              <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Live Multi-Band EEG Telemetry Traces</span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Synchronized real-time spectral power across Gamma, Beta, Alpha, Theta, and Delta bands.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[var(--text-muted)]">Sampling at 2 Hz</span>
                  </div>
                </div>

                <EEGWaveformVisualizer telemetry={telemetry} height={190} />
              </div>

              {/* Smart Focus Time Protection Controller */}
              <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Smart Focus Time Protection
                    </h3>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    When deep concentration is detected, Stoa can prompt you to reserve 60 minutes of uninterrupted Focus Time (Do Not Disturb). Enable auto-mode to schedule it automatically without asking.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-semibold">
                    {autoShieldEnabled ? (
                      <span className="text-emerald-400 font-bold">Auto-Block Enabled</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Ask Before Blocking</span>
                    )}
                  </span>
                  <button
                    onClick={toggleAutoShield}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      autoShieldEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoShieldEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THOUGHT-TO-EVENT INTENT TERMINAL */}
          {activeTab === 'thought_terminal' && (
            <div className="animate-in fade-in duration-150">
              <ThoughtIntentConsole />
            </div>
          )}

          {/* TAB 3: DREAM & SUBCONSCIOUS SPINDLE MINING */}
          {activeTab === 'subconscious_dreams' && (
            <div className="animate-in fade-in duration-150">
              <SubconsciousDreamConsole />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
