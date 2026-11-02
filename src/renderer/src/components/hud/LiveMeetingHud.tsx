import React, { useState, useEffect, useMemo } from 'react'
import {
  Mic,
  CheckCircle2,
  Plus,
  Play,
  Pause,
  RotateCcw,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'

interface AgendaItem {
  id: string
  title: string
  durationMinutes: number
  speaker: string
  completed: boolean
}

export const LiveMeetingHud: React.FC = () => {
  const { isLiveMeetingHudOpen, setIsLiveMeetingHudOpen, events } = useAppStore()
  const { currentUser } = useAuthStore()

  // Find currently active or next upcoming meeting
  const now = new Date()
  const activeEvent = useMemo(() => {
    return (
      events.find((e) => {
        const s = new Date(e.start).getTime()
        const end = new Date(e.end).getTime()
        return now.getTime() >= s - 5 * 60000 && now.getTime() <= end
      }) || events[0]
    )
  }, [events])

  const [isMinimized, setIsMinimized] = useState(false)
  const [isRunning, setIsRunning] = useState(true)

  // Real remaining seconds computed from actual calendar meeting end time
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (activeEvent) {
      const endMs = new Date(activeEvent.end).getTime()
      const remaining = Math.max(0, Math.round((endMs - Date.now()) / 1000))
      if (remaining > 0) return remaining
    }
    return 25 * 60
  })

  // Synchronize timer whenever the active event changes
  useEffect(() => {
    if (activeEvent) {
      const endMs = new Date(activeEvent.end).getTime()
      const remaining = Math.max(0, Math.round((endMs - Date.now()) / 1000))
      if (remaining > 0) {
        setSecondsRemaining(remaining)
      }
    }
  }, [activeEvent])

  const [activeSpeaker, setActiveSpeaker] = useState(currentUser?.name || 'Meeting Host')
  const [speakerSeconds, setSpeakerSeconds] = useState(180)

  // Live Captured Action Items (Persisted in LocalStorage)
  const [actionItems, setActionItems] = useState<Array<{ id: string; text: string; owner: string; done: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('stoa_hud_action_items')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [newActionText, setNewActionText] = useState('')

  // Agenda Checkpoints (Persisted in LocalStorage)
  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    try {
      const saved = localStorage.getItem('stoa_hud_agenda')
      if (saved) return JSON.parse(saved)
    } catch {}
    if (activeEvent) {
      return [
        { id: 'a1', title: `Goals: ${activeEvent.title}`, durationMinutes: 5, speaker: 'Host', completed: false },
        { id: 'a2', title: 'Open Discussion & Execution', durationMinutes: 15, speaker: currentUser?.name || 'Host', completed: false },
        { id: 'a3', title: 'Action Item Wrap-up', durationMinutes: 5, speaker: 'All Attendees', completed: false }
      ]
    }
    return []
  })

  // Timer tick
  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1))
      setSpeakerSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning])

  if (!isLiveMeetingHudOpen) return null

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActionText.trim()) return
    const updated = [
      ...actionItems,
      {
        id: Date.now().toString(),
        text: newActionText.trim(),
        owner: currentUser?.name || 'Assigned Lead',
        done: false
      }
    ]
    setActionItems(updated)
    try {
      localStorage.setItem('stoa_hud_action_items', JSON.stringify(updated))
    } catch {}
    setNewActionText('')
  }

  const toggleActionDone = (id: string) => {
    const updated = actionItems.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    setActionItems(updated)
    try {
      localStorage.setItem('stoa_hud_action_items', JSON.stringify(updated))
    } catch {}
  }

  const toggleAgendaCompleted = (id: string) => {
    const updated = agenda.map((ag) => (ag.id === id ? { ...ag, completed: !ag.completed } : ag))
    setAgenda(updated)
    try {
      localStorage.setItem('stoa_hud_agenda', JSON.stringify(updated))
    } catch {}
  }

  return (
    <aside
      aria-label="Live Meeting HUD and Agenda Clock"
      className="fixed bottom-6 right-6 z-40 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-200 select-none"
      style={{ width: isMinimized ? '280px' : '360px' }}
    >
      {/* Header bar */}
      <div className="bg-[var(--bg-subtle)] px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold truncate text-[var(--text-primary)]">
            {activeEvent?.title || 'Live Meeting HUD'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsLiveMeetingHudOpen(false)}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="Close HUD"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main HUD Body */}
      <div className="p-4 space-y-4">
        {/* Big Countdown Timer */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">
              {secondsRemaining === 0 ? 'Meeting Overtime' : 'Time Remaining'}
            </div>
            <div
              className={`text-2xl font-mono font-bold tracking-tight ${
                secondsRemaining < 300 && secondsRemaining > 0
                  ? 'text-amber-400 animate-pulse'
                  : secondsRemaining === 0
                  ? 'text-red-400'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {formatTimer(secondsRemaining)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)] transition-colors"
              title={isRunning ? 'Pause' : 'Resume'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => {
                if (activeEvent) {
                  const endMs = new Date(activeEvent.end).getTime()
                  const remaining = Math.max(0, Math.round((endMs - Date.now()) / 1000))
                  setSecondsRemaining(remaining > 0 ? remaining : 25 * 60)
                } else {
                  setSecondsRemaining(25 * 60)
                }
              }}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Reset to Scheduled Duration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Active Speaker Equitability Clock */}
            <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[var(--text-secondary)]">Speaker:</span>
                <input
                  type="text"
                  value={activeSpeaker}
                  onChange={(e) => setActiveSpeaker(e.target.value)}
                  className="font-semibold text-[var(--text-primary)] bg-transparent border-0 outline-none w-32 truncate focus:ring-1 focus:ring-[var(--border-strong)] rounded px-1"
                />
              </div>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {formatTimer(speakerSeconds)}
              </span>
            </div>

            {/* Micro Agenda Progress */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Agenda Checkpoints ({agenda.filter((a) => a.completed).length}/{agenda.length})
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {agenda.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleAgendaCompleted(item.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs transition-colors border ${
                      item.completed
                        ? 'bg-[var(--bg-subtle)]/50 border-transparent text-[var(--text-muted)] line-through'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          item.completed ? 'text-emerald-500' : 'text-[var(--text-muted)]'
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 ml-1">
                      {item.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Item Capture */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Live Action Items ({actionItems.filter((a) => a.done).length}/{actionItems.length})
              </div>
              <form onSubmit={handleAddAction} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Capture action item..."
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-[var(--accent)] text-[var(--accent-fg)] rounded-[var(--radius-sm)] text-xs font-semibold hover:opacity-90 flex items-center justify-center shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                {actionItems.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => toggleActionDone(act.id)}
                    className={`flex items-center justify-between p-1 rounded text-[11px] cursor-pointer transition-colors ${
                      act.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                      <span className="truncate">{act.text}</span>
                    </div>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 ml-1">
                      {act.owner}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
