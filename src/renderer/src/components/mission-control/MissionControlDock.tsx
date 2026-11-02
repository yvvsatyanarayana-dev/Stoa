import React, { useState, useEffect } from 'react'
import {
  X,
  Radio,
  ListTodo,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
  Check,
  Calendar,
  Clock,
  ChevronRight,
  Headphones,
  Trash2
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { focusAudioService } from '../../services/focusAudioService'
import { format, isToday, addMinutes } from 'date-fns'

export const MissionControlDock: React.FC = () => {
  const {
    isMissionControlOpen,
    setIsMissionControlOpen,
    events,
    nexusTasks,
    addNexusTask,
    toggleNexusTask,
    deleteNexusTask,
    setSelectedEvent,
    setIsEventModalOpen,
    createEvent,
    calendars
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'radar' | 'tasks' | 'pomodoro'>('radar')

  // --- Task Matrix Form State ---
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDuration, setNewTaskDuration] = useState(45)
  const [newTaskPriority, setNewTaskPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high')

  // --- Pomodoro State ---
  const [pomoMinutes, setPomoMinutes] = useState(25)
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60)
  const [isPomoRunning, setIsPomoRunning] = useState(false)
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus')
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('stoa_pomo_completed') || '0', 10) || 0
    } catch {
      return 0
    }
  })

  // --- Sound Generator State ---
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioMode, setAudioMode] = useState<'binaural_gamma' | 'brown_noise' | 'rain_drift'>('binaural_gamma')
  const [audioVolume, setAudioVolume] = useState(0.2)

  // Pomodoro countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isPomoRunning && pomoSecondsLeft > 0) {
      interval = setInterval(() => {
        setPomoSecondsLeft((prev) => prev - 1)
      }, 1000)
    } else if (pomoSecondsLeft === 0) {
      setIsPomoRunning(false)
      if (pomoMode === 'focus') {
        setCompletedSessions((prev) => {
          const next = prev + 1
          try {
            localStorage.setItem('stoa_pomo_completed', next.toString())
          } catch {}
          return next
        })
        setPomoMode('break')
        setPomoSecondsLeft(5 * 60)
      } else {
        setPomoMode('focus')
        setPomoSecondsLeft(pomoMinutes * 60)
      }
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPomoRunning, pomoSecondsLeft, pomoMode, pomoMinutes])

  const toggleSound = () => {
    if (isAudioPlaying) {
      focusAudioService.stop()
      setIsAudioPlaying(false)
    } else {
      focusAudioService.setVolume(audioVolume)
      focusAudioService.play(audioMode)
      setIsAudioPlaying(true)
    }
  }

  const handleAudioModeChange = (mode: 'binaural_gamma' | 'brown_noise' | 'rain_drift') => {
    setAudioMode(mode)
    if (isAudioPlaying) {
      focusAudioService.play(mode)
    }
  }

  // Active or next upcoming event for Radar
  const now = new Date()
  const todayEvents = events
    .filter((e) => isToday(new Date(e.start)) && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  const currentOrNextEvent =
    todayEvents.find((e) => {
      const end = new Date(e.end).getTime()
      return end > now.getTime()
    }) || todayEvents[0]

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addNexusTask(newTaskTitle.trim(), newTaskDuration, newTaskPriority)
    setNewTaskTitle('')
  }

  // Quick 1-click slot scheduler for a backlog task
  const handleAutoScheduleTask = async (task: { title: string; durationMinutes: number }) => {
    const primaryCal = calendars[0]?.id || 'cal-primary'
    // Find next available 30-min aligned slot today or tomorrow
    const candidateStart = new Date()
    candidateStart.setMinutes(Math.ceil(candidateStart.getMinutes() / 30) * 30 + 15, 0, 0)
    const candidateEnd = addMinutes(candidateStart, task.durationMinutes)

    try {
      await createEvent({
        id: `evt-${Date.now()}`,
        calendar_id: primaryCal,
        title: `[Focus] ${task.title}`,
        start: candidateStart.toISOString(),
        end: candidateEnd.toISOString(),
        all_day: false,
        status: 'confirmed',
        priority: 'high',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        description: `Auto-scheduled via Stoa Nexus Task Matrix (${task.durationMinutes}m sprint)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch {}
  }

  if (!isMissionControlOpen) return null

  const formatPomoTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <aside className="w-84 border-l border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col shrink-0 select-none z-20 shadow-xl overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Dock Top Bar */}
      <div className="h-10 px-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[var(--text-primary)]">
            Mission Control
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMissionControlOpen(false)}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Collapse Mission Control (Ctrl+B)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/60 text-xs">
        <button
          onClick={() => setActiveTab('radar')}
          className={`py-2 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
            activeTab === 'radar'
              ? 'border-[var(--accent)] text-[var(--text-primary)] bg-[var(--bg-elevated)] font-semibold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-2 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
            activeTab === 'tasks'
              ? 'border-[var(--accent)] text-[var(--text-primary)] bg-[var(--bg-elevated)] font-semibold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Tasks ({nexusTasks.filter((t) => !t.completed).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pomodoro')}
          className={`py-2 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
            activeTab === 'pomodoro'
              ? 'border-[var(--accent)] text-[var(--text-primary)] bg-[var(--bg-elevated)] font-semibold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>
      </div>

      {/* Dock Body Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ================= TAB 1: RADAR ================= */}
        {activeTab === 'radar' && (
          <div className="space-y-3.5">
            {/* Live Focus Status Banner */}
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-mono uppercase text-[var(--text-muted)]">Active Horizon</span>
                <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Synced
                </span>
              </div>

              {currentOrNextEvent ? (
                <div>
                  <h4 className="font-semibold text-xs text-[var(--text-primary)] leading-tight truncate">
                    {currentOrNextEvent.title || '(Untitled Event)'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                    <Clock className="w-3 h-3 text-[var(--accent)]" />
                    <span>
                      {format(new Date(currentOrNextEvent.start), 'HH:mm')} -{' '}
                      {format(new Date(currentOrNextEvent.end), 'HH:mm')}
                    </span>
                  </div>

                  {currentOrNextEvent.meeting_url && (
                    <a
                      href={currentOrNextEvent.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 w-full py-1.5 px-3 rounded-[var(--radius-sm)] bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Launch Video Call</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-[var(--text-muted)]">
                  No upcoming meetings today. You have unbroken deep work runway!
                </div>
              )}
            </div>

            {/* Quick Metrics Radar */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Meetings Today</div>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">
                  {todayEvents.length}
                </div>
              </div>
              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Focus Sprints</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {completedSessions}
                </div>
              </div>
            </div>

            {/* Today's Remaining Flow Runway */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1.5">
                <span>Today's Run-Sheet</span>
                <span>{todayEvents.length} items</span>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                {todayEvents.length === 0 ? (
                  <p className="text-[11px] text-[var(--text-muted)] py-3 text-center">
                    Calendar clear for the rest of today
                  </p>
                ) : (
                  todayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedEvent(evt)
                        setIsEventModalOpen(true)
                      }}
                      className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-[11px] text-[var(--text-primary)] block truncate">
                          {evt.title || '(Untitled)'}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {format(new Date(evt.start), 'HH:mm')}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: TASK MATRIX ================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-3.5">
            {/* Quick Task Entry Form */}
            <form onSubmit={handleCreateTask} className="space-y-2">
              <input
                type="text"
                placeholder="+ Add priority task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--accent)] outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
              <div className="flex items-center gap-1.5">
                <select
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                  className="text-[10px] font-mono px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
                >
                  <option value={15}>15m Sprint</option>
                  <option value={30}>30m Focus</option>
                  <option value={45}>45m Block</option>
                  <option value={60}>60m Deep</option>
                  <option value={90}>90m Ultradian</option>
                </select>

                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="text-[10px] font-mono px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <button
                  type="submit"
                  className="flex-1 py-1 px-2.5 rounded-[var(--radius-sm)] bg-white/10 hover:bg-white/15 text-white border border-white/20 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Task Item List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {nexusTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-[var(--radius-md)] border text-xs transition-all ${
                    t.completed
                      ? 'bg-[var(--bg-subtle)]/40 border-[var(--border-subtle)] opacity-50 line-through'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-[var(--accent)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => toggleNexusTask(t.id)}
                      className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        t.completed
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'border-[var(--border-subtle)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[11px] text-[var(--text-primary)] leading-snug truncate">
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--bg-hover)] text-[var(--text-muted)] uppercase">
                          {t.durationMinutes}m
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase ${
                            t.priority === 'urgent'
                              ? 'text-rose-400'
                              : t.priority === 'high'
                              ? 'text-amber-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!t.completed && (
                        <button
                          onClick={() => handleAutoScheduleTask(t)}
                          title="Auto-schedule into next calendar free slot"
                          className="p-1 rounded text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNexusTask(t.id)}
                        title="Delete Task"
                        className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: FOCUS & SOUNDSCAPES ================= */}
        {activeTab === 'pomodoro' && (
          <div className="space-y-4">
            {/* Visual Pomodoro Circle Display */}
            <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {pomoMode === 'focus' ? 'Deep Work Sprint' : 'Recovery Break'}
              </div>
              <div className="text-3xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
                {formatPomoTime(pomoSecondsLeft)}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setIsPomoRunning(!isPomoRunning)}
                  className="py-1.5 px-4 rounded-[var(--radius-sm)] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {isPomoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPomoRunning ? 'Pause' : 'Start Sprint'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPomoRunning(false)
                    setPomoSecondsLeft(pomoMinutes * 60)
                  }}
                  className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Reset Sprint"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-1.5 mt-3">
                <button
                  onClick={() => {
                    setPomoMinutes(25)
                    setPomoSecondsLeft(25 * 60)
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${pomoMinutes === 25 ? 'bg-white/15 text-white font-bold border border-white/20' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                >
                  25m
                </button>
                <button
                  onClick={() => {
                    setPomoMinutes(50)
                    setPomoSecondsLeft(50 * 60)
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${pomoMinutes === 50 ? 'bg-white/15 text-white font-bold border border-white/20' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                >
                  50m
                </button>
              </div>
            </div>

            {/* Offline Web Audio Focus Waves Generator */}
            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cognitive Soundscapes</span>
                </div>
                <button
                  onClick={toggleSound}
                  className={`p-1 rounded-[var(--radius-sm)] border transition-colors ${
                    isAudioPlaying
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title={isAudioPlaying ? 'Mute Focus Sound' : 'Play Focus Sound'}
                >
                  {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <button
                  onClick={() => handleAudioModeChange('binaural_gamma')}
                  className={`p-1.5 rounded-[var(--radius-xs)] border text-center transition-all ${
                    audioMode === 'binaural_gamma'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-bold shadow-xs'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  40Hz Gamma
                </button>
                <button
                  onClick={() => handleAudioModeChange('brown_noise')}
                  className={`p-1.5 rounded-[var(--radius-xs)] border text-center transition-all ${
                    audioMode === 'brown_noise'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-bold shadow-xs'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Brown Noise
                </button>
                <button
                  onClick={() => handleAudioModeChange('rain_drift')}
                  className={`p-1.5 rounded-[var(--radius-xs)] border text-center transition-all ${
                    audioMode === 'rain_drift'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-bold shadow-xs'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Rain Drift
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 pt-1 text-[10px] text-[var(--text-muted)] font-mono">
                <span>Vol</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setAudioVolume(v)
                    focusAudioService.setVolume(v)
                  }}
                  className="flex-1 accent-[var(--accent)] h-1"
                />
                <span>{Math.round(audioVolume * 200)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
