import React, { useState } from 'react'
import {
  Shield,
  Info,
  AlertTriangle,
  AlertOctagon,
  Lock,
  Unlock,
  Sun,
  Moon,
  Plus
} from 'lucide-react'
import { useBurnoutStore } from '../../store/useBurnoutStore'
import type { ChronotypeName, FatigueLevel, FocusBlockType } from '../../types/burnout'

type ActiveTab = 'overview' | 'chronotype' | 'focus' | 'history'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fatigueBadge(level: FatigueLevel): string {
  switch (level) {
    case 'low':
      return 'border border-[var(--border)] text-[var(--text-muted)] bg-transparent'
    case 'moderate':
      return 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]'
    case 'high':
      return 'text-amber-400 border border-amber-400/30 bg-transparent'
    case 'critical':
      return 'text-red-400 border border-red-400/30 bg-transparent'
  }
}

function blockTypeBadge(type: FocusBlockType): string {
  switch (type) {
    case 'deep-work':
      return 'border border-[var(--accent)] text-[var(--accent)]'
    case 'meetings':
      return 'border border-[var(--border)] text-[var(--text-primary)]'
    case 'admin':
      return 'border border-[var(--border)] text-[var(--text-muted)]'
    case 'buffer':
      return 'border border-[var(--border)] text-[var(--text-muted)]'
    case 'recovery':
      return 'border border-green-500/40 text-green-400'
  }
}

function riskColor(risk: number): string {
  if (risk >= 65) return 'text-red-400'
  if (risk >= 40) return 'text-amber-400'
  return 'text-green-400'
}

function riskBarColor(risk: number): string {
  if (risk >= 65) return 'bg-red-400'
  if (risk >= 40) return 'bg-amber-400'
  return 'bg-green-400'
}

export const BurnoutShieldView: React.FC = () => {
  const {
    profile,
    fatigueHistory,
    focusBlocks,
    alerts,
    shieldEnabled,
    autoBufferEnabled,
    weeklyBurnoutTrend,
    updateProfile,
    addFocusBlock,
    updateFocusBlock,
    removeFocusBlock,
    dismissAlert,
    toggleShield,
    toggleAutoBuffer
  } = useBurnoutStore()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // Chronotype form local state
  const [editChronotype, setEditChronotype] = useState<ChronotypeName>(profile.chronotype)
  const [editPeakStart, setEditPeakStart] = useState(profile.peakFocusStart)
  const [editPeakEnd, setEditPeakEnd] = useState(profile.peakFocusEnd)
  const [editSecStart, setEditSecStart] = useState(profile.secondaryPeakStart)
  const [editSecEnd, setEditSecEnd] = useState(profile.secondaryPeakEnd)
  const [editSleep, setEditSleep] = useState(profile.avgSleepHours)
  const [editBreak, setEditBreak] = useState(profile.preferredBreakInterval)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = fatigueHistory.find((l) => l.date === today) ?? fatigueHistory[fatigueHistory.length - 1]
  const activeAlerts = alerts.filter((a) => !a.dismissed)
  const todayBlocks = focusBlocks.filter((b) => b.date === today)
  const todayDeepWork = todayBlocks.filter((b) => b.type === 'deep-work').length
  const todayMeetings = todayBlocks.filter((b) => b.type === 'meetings').length

  const maxTrend = Math.max(...weeklyBurnoutTrend, 1)

  function handleSaveProfile() {
    updateProfile({
      chronotype: editChronotype,
      peakFocusStart: editPeakStart,
      peakFocusEnd: editPeakEnd,
      secondaryPeakStart: editSecStart,
      secondaryPeakEnd: editSecEnd,
      avgSleepHours: editSleep,
      preferredBreakInterval: editBreak
    })
  }

  function handleAddBuffer() {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(now.getMinutes()).padStart(2, '0')
    const endH = String(now.getHours() + 1).padStart(2, '0')
    const newBlock = {
      id: `fb-${Date.now()}`,
      date: today,
      startTime: `${h}:${m}`,
      endTime: `${endH}:${m}`,
      type: 'buffer' as FocusBlockType,
      label: 'Auto Buffer Block',
      isAutoScheduled: true,
      cognitiveWeight: 1,
      locked: false
    }
    addFocusBlock(newBlock)
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'chronotype', label: 'Chronotype' },
    { key: 'focus', label: 'Focus Blocks' },
    { key: 'history', label: 'Fatigue History' }
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--bg-app)] w-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4.5 h-4.5 text-[var(--accent)]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                Burnout Shield
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Biometric-aware scheduling with cognitive load protection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Shield toggle */}
            <button
              onClick={toggleShield}
              className="flex items-center gap-2 h-7 px-3 text-xs rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${shieldEnabled ? 'bg-green-400' : 'bg-[var(--text-muted)]'}`}
              />
              Shield {shieldEnabled ? 'Active' : 'Inactive'}
            </button>
            {/* Auto-buffer toggle */}
            <button
              onClick={toggleAutoBuffer}
              className="flex items-center gap-2 h-7 px-3 text-xs rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${autoBufferEnabled ? 'bg-green-400' : 'bg-[var(--text-muted)]'}`}
              />
              Auto-Buffer {autoBufferEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 mt-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`h-7 px-3 text-xs rounded transition-colors ${
                activeTab === t.key
                  ? 'bg-[var(--accent)] text-white font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-5">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
                  Today&apos;s Burnout Risk
                </div>
                <div className={`text-3xl font-bold font-mono ${riskColor(todayLog.burnoutRisk)}`}>
                  {todayLog.burnoutRisk}%
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  {todayLog.fatigueLevel} fatigue
                </div>
              </div>
              <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
                  Cognitive Load
                </div>
                <div className={`text-3xl font-bold font-mono ${riskColor(todayLog.cognitiveLoadScore)}`}>
                  {todayLog.cognitiveLoadScore}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">out of 100</div>
              </div>
              <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
                  Deep Work Today
                </div>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                  {todayDeepWork}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">blocks scheduled</div>
              </div>
              <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
                  Meetings Today
                </div>
                <div
                  className={`text-3xl font-bold font-mono ${todayMeetings >= 6 ? 'text-red-400' : todayMeetings >= 4 ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}
                >
                  {todayMeetings}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">scheduled</div>
              </div>
            </div>

            {/* Weekly trend chart */}
            <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                Weekly Burnout Trend
              </div>
              <div className="flex items-end gap-2 h-20">
                {weeklyBurnoutTrend.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                      <div
                        className={`w-full rounded-sm transition-all ${riskBarColor(val)}`}
                        style={{ height: `${Math.round((val / maxTrend) * 64)}px`, opacity: 0.8 }}
                      />
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono">{DAYS[i]}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Active alerts */}
            {activeAlerts.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Active Alerts ({activeAlerts.length})
                </div>
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                      alert.severity === 'critical'
                        ? 'border-red-400/30 bg-red-400/5'
                        : alert.severity === 'warning'
                          ? 'border-amber-400/30 bg-amber-400/5'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {alert.severity === 'critical' ? (
                        <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <span
                      className={`flex-1 leading-relaxed ${
                        alert.severity === 'critical'
                          ? 'text-red-300'
                          : alert.severity === 'warning'
                            ? 'text-amber-300'
                            : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {alert.message}
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="flex-shrink-0 h-5 px-2 text-[10px] rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {todayLog.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Today&apos;s Recommendations
                </div>
                <div className="space-y-1.5">
                  {todayLog.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-[var(--text-primary)] p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)]"
                    >
                      <span className="text-[var(--accent)] font-mono flex-shrink-0 mt-px">→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CHRONOTYPE TAB ── */}
        {activeTab === 'chronotype' && (
          <div className="space-y-5">
            {/* Profile card */}
            <div className="bg-[var(--bg-elevated)] rounded-lg p-5 border border-[var(--border)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                {profile.chronotype === 'night-owl' ? (
                  <Moon className="w-5 h-5 text-[var(--accent)]" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                  {profile.chronotype.replace('-', ' ')}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Peak focus: {profile.peakFocusStart} – {profile.peakFocusEnd} &nbsp;·&nbsp; Secondary:{' '}
                  {profile.secondaryPeakStart} – {profile.secondaryPeakEnd}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Sleep avg: {profile.avgSleepHours}h &nbsp;·&nbsp; Break interval:{' '}
                  {profile.preferredBreakInterval} min
                </div>
              </div>
            </div>

            {/* Peak windows timeline */}
            <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                Focus Windows (8 AM – 8 PM)
              </div>
              <div className="relative h-6 bg-[var(--bg-app)] rounded border border-[var(--border)] overflow-hidden">
                {/* Peak window */}
                {(() => {
                  const total = 12 * 60
                  const startMin = parseInt(profile.peakFocusStart.split(':')[0]) * 60 + parseInt(profile.peakFocusStart.split(':')[1]) - 8 * 60
                  const endMin = parseInt(profile.peakFocusEnd.split(':')[0]) * 60 + parseInt(profile.peakFocusEnd.split(':')[1]) - 8 * 60
                  return (
                    <div
                      className="absolute top-0 h-full bg-[var(--accent)] opacity-70"
                      style={{
                        left: `${(startMin / total) * 100}%`,
                        width: `${((endMin - startMin) / total) * 100}%`
                      }}
                    />
                  )
                })()}
                {/* Secondary window */}
                {(() => {
                  const total = 12 * 60
                  const startMin = parseInt(profile.secondaryPeakStart.split(':')[0]) * 60 + parseInt(profile.secondaryPeakStart.split(':')[1]) - 8 * 60
                  const endMin = parseInt(profile.secondaryPeakEnd.split(':')[0]) * 60 + parseInt(profile.secondaryPeakEnd.split(':')[1]) - 8 * 60
                  return (
                    <div
                      className="absolute top-0 h-full bg-[var(--accent)] opacity-40"
                      style={{
                        left: `${(startMin / total) * 100}%`,
                        width: `${((endMin - startMin) / total) * 100}%`
                      }}
                    />
                  )
                })()}
              </div>
              <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1">
                <span>8 AM</span>
                <span>12 PM</span>
                <span>4 PM</span>
                <span>8 PM</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm bg-[var(--accent)] opacity-70" />
                  Primary peak
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm bg-[var(--accent)] opacity-40" />
                  Secondary peak
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)] space-y-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Edit Profile
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Chronotype */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">Chronotype</label>
                  <select
                    value={editChronotype}
                    onChange={(e) => setEditChronotype(e.target.value as ChronotypeName)}
                    className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="early-bird">Early Bird</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="night-owl">Night Owl</option>
                  </select>
                </div>

                {/* Break interval */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">
                    Break Interval: <span className="text-[var(--text-primary)] font-mono">{editBreak} min</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={90}
                    step={5}
                    value={editBreak}
                    onChange={(e) => setEditBreak(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                {/* Peak focus start */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">Peak Focus Start</label>
                  <input
                    type="time"
                    value={editPeakStart}
                    onChange={(e) => setEditPeakStart(e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Peak focus end */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">Peak Focus End</label>
                  <input
                    type="time"
                    value={editPeakEnd}
                    onChange={(e) => setEditPeakEnd(e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Secondary peak start */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">Secondary Peak Start</label>
                  <input
                    type="time"
                    value={editSecStart}
                    onChange={(e) => setEditSecStart(e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Secondary peak end */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">Secondary Peak End</label>
                  <input
                    type="time"
                    value={editSecEnd}
                    onChange={(e) => setEditSecEnd(e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Sleep hours */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)]">
                    Avg Sleep Hours: <span className="text-[var(--text-primary)] font-mono">{editSleep.toFixed(1)}h</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={10}
                    step={0.1}
                    value={editSleep}
                    onChange={(e) => setEditSleep(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                    <span>4h</span>
                    <span>7h (optimal)</span>
                    <span>10h</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="h-7 px-3 text-xs rounded bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        {/* ── FOCUS BLOCKS TAB ── */}
        {activeTab === 'focus' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Focus Blocks ({focusBlocks.length})
              </div>
              <button
                onClick={handleAddBuffer}
                className="h-7 px-3 text-xs rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors flex items-center gap-1.5"
              >
                <Plus style={{ width: 12, height: 12 }} />
                Add Buffer Block
              </button>
            </div>

            <div className="space-y-2">
              {focusBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs"
                >
                  {/* Date */}
                  <span className="text-[var(--text-muted)] font-mono w-20 flex-shrink-0">{block.date}</span>
                  {/* Time */}
                  <span className="text-[var(--text-primary)] font-mono w-24 flex-shrink-0">
                    {block.startTime} – {block.endTime}
                  </span>
                  {/* Type badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize flex-shrink-0 ${blockTypeBadge(block.type)}`}
                  >
                    {block.type.replace('-', ' ')}
                  </span>
                  {/* Label */}
                  <span className="flex-1 text-[var(--text-primary)] truncate">{block.label}</span>
                  {/* Auto-scheduled badge */}
                  {block.isAutoScheduled && (
                    <span className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 flex-shrink-0">
                      auto
                    </span>
                  )}
                  {/* Lock toggle */}
                  <button
                    onClick={() => updateFocusBlock(block.id, { locked: !block.locked })}
                    className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {block.locked ? (
                      <Lock style={{ width: 13, height: 13 }} />
                    ) : (
                      <Unlock style={{ width: 13, height: 13 }} />
                    )}
                  </button>
                  {/* Remove */}
                  {!block.locked && (
                    <button
                      onClick={() => removeFocusBlock(block.id)}
                      className="flex-shrink-0 text-[var(--text-muted)] hover:text-red-400 transition-colors text-[10px] font-mono"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {focusBlocks.length === 0 && (
                <div className="text-xs text-[var(--text-muted)] p-4 text-center border border-dashed border-[var(--border)] rounded-lg">
                  No focus blocks scheduled. Click &quot;Add Buffer Block&quot; to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FATIGUE HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Last 14 Days
            </div>
            {/* Header row */}
            <div className="grid gap-3 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider px-3"
              style={{ gridTemplateColumns: '7rem 6rem 1fr 4rem 4rem 4rem' }}>
              <span>Date</span>
              <span>Fatigue</span>
              <span>Burnout Risk</span>
              <span className="text-center">Meetings</span>
              <span className="text-center">Deep Work</span>
              <span className="text-center">Breaks</span>
            </div>

            <div className="space-y-1.5">
              {[...fatigueHistory].reverse().map((log) => (
                <div
                  key={log.id}
                  className="grid items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs"
                  style={{ gridTemplateColumns: '7rem 6rem 1fr 4rem 4rem 4rem' }}
                >
                  {/* Date */}
                  <span className="text-[var(--text-muted)] font-mono">{log.date}</span>
                  {/* Fatigue badge */}
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${fatigueBadge(log.fatigueLevel)}`}
                  >
                    {log.fatigueLevel}
                  </span>
                  {/* Burnout risk bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-app)] border border-[var(--border)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${riskBarColor(log.burnoutRisk)}`}
                        style={{ width: `${log.burnoutRisk}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] w-7 text-right flex-shrink-0 ${riskColor(log.burnoutRisk)}`}>
                      {log.burnoutRisk}%
                    </span>
                  </div>
                  {/* Meetings */}
                  <span className="text-center text-[var(--text-primary)] font-mono">{log.meetingDensity}</span>
                  {/* Deep work */}
                  <span className="text-center text-[var(--text-primary)] font-mono">{log.deepWorkBlocks}</span>
                  {/* Breaks */}
                  <span className="text-center text-[var(--text-primary)] font-mono">{log.breaksTaken}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
