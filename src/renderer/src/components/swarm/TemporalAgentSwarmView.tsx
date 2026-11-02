/**
 * Stoa Temporal AI Agent Swarm View
 * Autonomous Multi-Agent Calendar Intelligence Interface
 */

import React, { useState, useEffect } from 'react'
import {
  Brain,
  ShieldCheck,
  Clock,
  Sparkles,
  TrendingUp,
  Share2,
  FileText,
  RotateCw,
  CheckCircle2,
  Sun,
  Moon,
  Bird,
  Sliders,
  Zap,
  Users
} from 'lucide-react'
import { useTemporalSwarmStore } from '../../store/useTemporalSwarmStore'
import { useAppStore } from '../../store/useAppStore'
import { useP2PStore } from '../../store/useP2PStore'
import type {
  SwarmAgentRole,
  SwarmAutonomyLevel
} from '../../types/temporalSwarm'

export const TemporalAgentSwarmView: React.FC = () => {
  const {
    agents,
    settings,
    decisions,
    negotiations,
    latestBriefing,
    isAnalyzing,
    lastRunTimestamp,
    runSwarmCycle,
    applyDecision,
    dismissDecision,
    setAgentAutonomy,
    updateSettings,
    startDiplomatNegotiation,
    confirmNegotiationSlot
  } = useTemporalSwarmStore()

  const { events } = useAppStore()
  const { peers } = useP2PStore()

  const [activeTab, setActiveTab] = useState<'agents' | 'feed' | 'negotiations' | 'archivist'>('agents')
  const [feedFilter, setFeedFilter] = useState<'all' | 'pending' | 'applied'>('all')

  // Diplomat Simulation Modal State
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false)
  const [peerNameInput, setPeerNameInput] = useState('')
  const [meetingTitleInput, setMeetingTitleInput] = useState('')
  const [durationInput, setDurationInput] = useState(30)

  useEffect(() => {
    // Run an initial swarm analysis if no decisions have been generated yet
    if (decisions.length === 0 && !isAnalyzing && events.length > 0) {
      runSwarmCycle()
    }
  }, [])

  const handleLaunchNegotiation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!peerNameInput.trim() || !meetingTitleInput.trim()) return

    await startDiplomatNegotiation(peerNameInput.trim(), meetingTitleInput.trim(), Number(durationInput))
    setIsNegotiationModalOpen(false)
    setActiveTab('negotiations')
  }

  const filteredDecisions = decisions.filter((d) => {
    if (feedFilter === 'pending') return !d.applied
    if (feedFilter === 'applied') return d.applied
    return true
  })

  const pendingCount = decisions.filter((d) => !d.applied).length

  const agentIcons: Record<SwarmAgentRole, React.ReactNode> = {
    scheduler: <Clock className="w-4 h-4 text-sky-400" />,
    guardian: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    strategist: <TrendingUp className="w-4 h-4 text-purple-400" />,
    diplomat: <Share2 className="w-4 h-4 text-amber-400" />,
    archivist: <FileText className="w-4 h-4 text-indigo-400" />
  }

  const agentThemeColors: Record<SwarmAgentRole, string> = {
    scheduler: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    guardian: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    strategist: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    diplomat: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    archivist: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] animate-in fade-in duration-150">
      {/* Top Header & Autonomous Swarm Control Strip */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Temporal AI Agent Swarm
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>5 Agents Synced</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Autonomous multi-agent intelligence negotiating, shielding flow, and balancing your calendar via Automerge CRDTs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chronotype Pill */}
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => updateSettings({ chronotype: 'lark' })}
              className={`flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                settings.chronotype === 'lark'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Morning Lark (Peak: 08:00 - 11:30)"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Lark</span>
            </button>
            <button
              onClick={() => updateSettings({ chronotype: 'third-bird' })}
              className={`flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                settings.chronotype === 'third-bird'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Third-Bird (Peak: 10:00 - 13:00)"
            >
              <Bird className="w-3 h-3 text-sky-400" />
              <span>Mid-Day</span>
            </button>
            <button
              onClick={() => updateSettings({ chronotype: 'owl' })}
              className={`flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                settings.chronotype === 'owl'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Night Owl (Peak: 14:00 - 18:30)"
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Owl</span>
            </button>
          </div>

          {/* Run Full Swarm Cycle */}
          <button
            onClick={() => runSwarmCycle()}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-all shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Optimizing...' : 'Run Swarm Cycle'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Dock */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-2 flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] text-xs shrink-0 no-scrollbar overflow-x-auto gap-0.5">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'agents'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Agent Command Deck</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Decisions</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('negotiations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'negotiations'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Diplomat P2P Mesh</span>
            {negotiations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {negotiations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('archivist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'archivist'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Archivist Retrospective</span>
          </button>
        </div>

        {lastRunTimestamp && (
          <span className="text-[11px] font-mono text-[var(--text-muted)] hidden md:inline">
            Last pass: {new Date(lastRunTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* TAB 1: AGENT COMMAND DECK */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              {/* Swarm Architecture Banner */}
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Autonomous Neural Calendar Loop</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-2xl">
                    Your 5 specialized temporal agents collaborate continuously across local Automerge CRDTs. They analyze energy curves, defend uninterrupted flow states, balance weekly workloads, and negotiate with peer agents peer-to-peer.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsNegotiationModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulate P2P Negotiation</span>
                  </button>
                </div>
              </div>

              {/* 5 Agent Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden group hover:border-[var(--border-strong)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2 rounded-[var(--radius-md)] border ${agentThemeColors[agent.role]}`}>
                          {agentIcons[agent.role]}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[var(--text-primary)]">{agent.name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)] uppercase">
                              {agent.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{agent.title}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {agent.confidenceScore}% Acc
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {agent.description}
                    </p>

                    {/* Agent Real-time Metrics Strip */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                      {agent.metrics.map((m, idx) => (
                        <div key={idx}>
                          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{m.label}</p>
                          <p className="text-xs font-bold font-mono text-[var(--text-primary)] mt-0.5 truncate">{m.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Agent Autonomy Level Selector */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">Mode:</span>
                      <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[10px]">
                        {(['autonomous', 'supervised', 'passive'] as SwarmAutonomyLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setAgentAutonomy(agent.role, lvl)}
                            className={`px-2 py-0.5 rounded-[var(--radius-sm)] capitalize font-semibold transition-all cursor-pointer ${
                              agent.autonomyLevel === lvl
                                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Swarm Configuration Panel */}
              <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Autonomous Boundary & Flow Parameters</span>
                  </h4>
                  <span className="text-[11px] text-[var(--text-muted)]">Auto-persisted in CRDT doc</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Required Recovery Buffer
                    </label>
                    <select
                      value={settings.requiredBufferMinutes}
                      onChange={(e) => updateSettings({ requiredBufferMinutes: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes (Standard)</option>
                      <option value={20}>20 Minutes (Deep Rest)</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Target Focus Ratio
                    </label>
                    <select
                      value={settings.targetFocusRatio}
                      onChange={(e) => updateSettings({ targetFocusRatio: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
                    >
                      <option value={50}>50% Focus / 50% Meetings</option>
                      <option value={60}>60% Focus / 40% Meetings (Optimal)</option>
                      <option value={70}>70% Focus / 30% Meetings (Maker)</option>
                      <option value={80}>80% Focus / 20% Meetings (Deep Flow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Hard Day Start / Shutdown
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={settings.hardDayStart}
                        onChange={(e) => updateSettings({ hardDayStart: e.target.value })}
                        className="w-1/2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--text-primary)] outline-hidden"
                      />
                      <input
                        type="time"
                        value={settings.hardDayEnd}
                        onChange={(e) => updateSettings({ hardDayEnd: e.target.value })}
                        className="w-1/2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--text-primary)] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Guardian Lunch Shield
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        checked={settings.protectLunchBreak}
                        onChange={(e) => updateSettings({ protectLunchBreak: e.target.checked })}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--accent)] cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">Shield 12:30 - 13:30 from bookings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTONOMOUS DECISIONS AUDIT FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real-Time Swarm Decision Log ({filteredDecisions.length})</span>
                  </h3>
                </div>

                <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs">
                  <button
                    onClick={() => setFeedFilter('all')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                      feedFilter === 'all'
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    All ({decisions.length})
                  </button>
                  <button
                    onClick={() => setFeedFilter('pending')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                      feedFilter === 'pending'
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Pending Review ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFeedFilter('applied')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                      feedFilter === 'applied'
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Applied ({decisions.length - pendingCount})
                  </button>
                </div>
              </div>

              {filteredDecisions.length === 0 ? (
                <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-2">
                  <Brain className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
                  <h5 className="text-xs font-bold text-[var(--text-primary)]">
                    No decisions in this filter view
                  </h5>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                    Click "Run Swarm Cycle" above to analyze your calendar events and generate algorithmic flow defenses.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDecisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`p-2 rounded-[var(--radius-md)] border shrink-0 ${agentThemeColors[dec.agentRole]}`}>
                          {agentIcons[dec.agentRole]}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)] uppercase">
                              {dec.agentRole}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${
                              dec.impact === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {dec.impact} impact
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                              {new Date(dec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1">{dec.title}</h4>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{dec.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {dec.applied ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Applied to Calendar</span>
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => applyDecision(dec.id)}
                              className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer shadow-xs"
                            >
                              Apply Protection
                            </button>
                            <button
                              onClick={() => dismissDecision(dec.id)}
                              className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIPLOMAT P2P MESH NEGOTIATION */}
          {activeTab === 'negotiations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Autonomous P2P Agent Negotiation Deck</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    No Calendly links or email scheduling tags. Your Hermes Diplomat negotiates directly with peer agents via decentralized CRDT documents.
                  </p>
                </div>

                <button
                  onClick={() => setIsNegotiationModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Start Autonomous Negotiation</span>
                </button>
              </div>

              {negotiations.length === 0 ? (
                <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-3">
                  <Share2 className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
                  <h5 className="text-xs font-bold text-[var(--text-primary)]">
                    No active peer negotiations
                  </h5>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                    Start a peer-to-peer negotiation session. Your Diplomat will exchange chronotype availability vectors and reach consensus autonomously.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {negotiations.map((neg) => (
                    <div
                      key={neg.sessionId}
                      className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold uppercase">
                              P2P Consensus • {neg.consensusConfidence}% Match
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              Rounds: {neg.rounds}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                            {neg.meetingTitle}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Between <strong className="text-[var(--text-primary)]">{neg.initiatorPeerName}</strong> and{' '}
                            <strong className="text-[var(--text-primary)]">{neg.targetPeerName}</strong> • {neg.durationMinutes} mins
                          </p>
                        </div>

                        {neg.state === 'confirmed_in_crdt' ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmed in Calendar</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmNegotiationSlot(neg.sessionId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Agreed Slot</span>
                          </button>
                        )}
                      </div>

                      {/* Agreed Slot Card */}
                      {neg.agreedSlot && (
                        <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex items-center justify-between text-xs">
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                              Consensus Slot (Top Chronotype Match):
                            </p>
                            <p className="font-bold text-[var(--text-primary)] mt-0.5 font-mono">
                              {new Date(neg.agreedSlot.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                              {new Date(neg.agreedSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {new Date(neg.agreedSlot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            Zero Calendar Conflicts
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ARCHIVIST RETROSPECTIVE BRIEFING */}
          {activeTab === 'archivist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Archivist Executive Retrospective</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Automated weekly synthesis generated while you sleep. Tracks cognitive transitions, flow velocity, and burnout risk.
                  </p>
                </div>
              </div>

              {latestBriefing ? (
                <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-6 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                        WEEKLY BRIEFING: {latestBriefing.weekStartDate} → {latestBriefing.weekEndDate}
                      </span>
                      <h4 className="text-lg font-bold text-[var(--text-primary)] mt-1">
                        Temporal Health & Cognitive Velocity Score: {latestBriefing.productivityScore}/100
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-mono text-[var(--text-muted)]">Fatigue Risk:</span>
                        <p className="text-xs font-bold font-mono text-emerald-400 uppercase">{latestBriefing.fatigueRisk}</p>
                      </div>
                      <div className="text-right border-l border-[var(--border-subtle)] pl-3">
                        <span className="text-xs font-mono text-[var(--text-muted)]">Focus Ratio:</span>
                        <p className="text-xs font-bold font-mono text-[var(--text-primary)]">{latestBriefing.ratioPercent}%</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-subtle)] p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                    "{latestBriefing.summaryText}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Core Behavioral Insights
                      </h5>
                      <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        {latestBriefing.topInsights.map((ins, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <span>{ins}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Archivist Strategic Recommendations
                      </h5>
                      <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        {latestBriefing.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-2">
                  <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
                  <h5 className="text-xs font-bold text-[var(--text-primary)]">
                    No briefing compiled yet
                  </h5>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                    Click "Run Swarm Cycle" above to generate your first Archivist retrospective summary.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diplomat Negotiation Simulation Modal */}
      {isNegotiationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Initiate P2P Diplomat Negotiation
                </h4>
              </div>
              <button
                onClick={() => setIsNegotiationModalOpen(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleLaunchNegotiation} className="space-y-4 text-xs">
              {peers.length > 0 && (
                <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Select Connected P2P Peer Node:
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setPeerNameInput(e.target.value)
                    }}
                    defaultValue=""
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1 text-xs text-[var(--text-primary)] outline-hidden"
                  >
                    <option value="" disabled>
                      -- Choose from {peers.length} active mesh peer(s) --
                    </option>
                    {peers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.organization || 'Mesh Peer'}) - {p.ipAddress || 'Local'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Peer Participant Name / Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera or Sarah (Engineer)"
                  value={peerNameInput}
                  onChange={(e) => setPeerNameInput(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Meeting Objective / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint Architecture Sync or Quarterly Review"
                  value={meetingTitleInput}
                  onChange={(e) => setMeetingTitleInput(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Duration (Minutes)
                </label>
                <select
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] outline-hidden"
                >
                  <option value={15}>15 Minutes (Quick Sync)</option>
                  <option value={30}>30 Minutes (Standard)</option>
                  <option value={45}>45 Minutes (Deep Dive)</option>
                  <option value={60}>60 Minutes (Strategy Session)</option>
                </select>
              </div>

              <div className="p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Automerge CRDT P2P Protocol:</span>
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Your local Hermes Diplomat will broadcast encrypted availability matrices over WebRTC / BroadcastChannel, negotiate slot conflicts automatically, and confirm the consensus time without sending emails or links.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                Launch Autonomous Multi-Round Negotiation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
