import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { soundService, SoundTheme } from '../../services/soundService'
import { CalendarEvent } from '../../../../types'
import {
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  Video,
  Layers
} from 'lucide-react'
import { format, differenceInMinutes, isToday } from 'date-fns'

export const NotificationGrouping: React.FC = () => {
  const {
    events,
    notificationLogs,
    snoozeReminder,
    dismissReminder,
    rescheduleEvent,
    moveEventToTomorrow,
    setPreMeetingBriefingEvent,
    fetchNotifications
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'reminders' | 'history' | 'audio'>('reminders')

  // Audio settings local state
  const [soundTheme, setSoundTheme] = useState<SoundTheme>(soundService.getTheme())
  const [volume, setVolume] = useState<number>(soundService.getVolume())
  const [isMuted, setIsMuted] = useState<boolean>(soundService.isMuted())

  // Events that have reminders set or are scheduled for today/upcoming
  const eventsWithReminders = useMemo(() => {
    return events.filter((e) => e.status !== 'cancelled' && e.reminders && e.reminders.length > 0)
  }, [events])

  const now = new Date()

  // G1: Smart Notification Grouping into Time Clusters
  const groupedReminders = useMemo(() => {
    const next60Mins: CalendarEvent[] = []
    const laterToday: CalendarEvent[] = []
    const upcomingDays: CalendarEvent[] = []

    eventsWithReminders.forEach((evt) => {
      const s = new Date(evt.start)
      const diffMins = differenceInMinutes(s, now)

      if (diffMins >= -30 && diffMins <= 60) {
        next60Mins.push(evt)
      } else if (isToday(s) && diffMins > 60) {
        laterToday.push(evt)
      } else if (diffMins > 0) {
        upcomingDays.push(evt)
      }
    })

    return {
      next60Mins,
      laterToday,
      upcomingDays
    }
  }, [eventsWithReminders, now])

  const handlePreviewSound = (theme: SoundTheme) => {
    soundService.play(theme)
  }

  const handleSelectSoundTheme = (theme: SoundTheme) => {
    setSoundTheme(theme)
    soundService.setTheme(theme)
    soundService.play(theme)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    soundService.setVolume(val)
  }

  const handleToggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    soundService.setMuted(next)
  }

  // Batch actions
  const handleBatchSnooze = async (groupEvents: CalendarEvent[], mins: number) => {
    for (const evt of groupEvents) {
      if (evt.reminders && evt.reminders[0]) {
        await snoozeReminder(evt.reminders[0].id, mins)
      }
    }
    await fetchNotifications()
  }

  const handleBatchDismiss = async (groupEvents: CalendarEvent[]) => {
    for (const evt of groupEvents) {
      if (evt.reminders && evt.reminders[0]) {
        await dismissReminder(evt.reminders[0].id)
      }
    }
    await fetchNotifications()
  }

  const SOUND_THEMES_INFO: Array<{ id: SoundTheme; name: string; desc: string }> = [
    { id: 'executive_chime', name: 'Executive Chime', desc: 'Harmonious corporate dual chime (E5 → A5)' },
    { id: 'gentle_marimba', name: 'Gentle Marimba', desc: 'Warm melodic triad arpeggio for focus blocks' },
    { id: 'urgent_pulse', name: 'Urgent Pulse', desc: 'Crisp double-frequency alert for high-priority events' },
    { id: 'subtle_tick', name: 'Subtle Modern Tick', desc: 'Minimalist low-distraction acoustic click' },
    { id: 'zen_bowl', name: 'Zen Singing Bowl', desc: 'Ambient resonant harmonic tone with long decay' }
  ]

  return (
    <div className="space-y-5">
      {/* Segmented Top Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
              activeTab === 'reminders'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Smart Grouped Alerts</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              {eventsWithReminders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dispatched History</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              {notificationLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Sound Themes & Cues</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
          Real-Time Scheduler • Audio Synthesizer Active
        </span>
      </div>

      {/* TAB 1: SMART GROUPED ALERTS */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {/* Group 1: Next 60 Minutes (Urgent Cluster) */}
          <div className="card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Imminent Focus Cluster (Next 60 Minutes)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-red-500/20 text-red-400 font-bold">
                  {groupedReminders.next60Mins.length} Active
                </span>
              </div>

              {groupedReminders.next60Mins.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleBatchSnooze(groupedReminders.next60Mins, 15)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                  >
                    Snooze All (+15m)
                  </button>
                  <button
                    onClick={() => handleBatchDismiss(groupedReminders.next60Mins)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                  >
                    Dismiss All
                  </button>
                </div>
              )}
            </div>

            {groupedReminders.next60Mins.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                No events scheduled within the next 60 minutes.
              </div>
            ) : (
              <div className="space-y-2">
                {groupedReminders.next60Mins.map((evt) => (
                  <RemindersCardItem
                    key={evt.id}
                    event={evt}
                    onSnooze={snoozeReminder}
                    onDismiss={dismissReminder}
                    onPush={rescheduleEvent}
                    onMoveTomorrow={moveEventToTomorrow}
                    onOpenBriefing={setPreMeetingBriefingEvent}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Group 2: Later Today */}
          <div className="card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Later Today
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {groupedReminders.laterToday.length}
                </span>
              </div>

              {groupedReminders.laterToday.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleBatchSnooze(groupedReminders.laterToday, 30)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                  >
                    Snooze All (+30m)
                  </button>
                </div>
              )}
            </div>

            {groupedReminders.laterToday.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                No subsequent events scheduled for today.
              </div>
            ) : (
              <div className="space-y-2">
                {groupedReminders.laterToday.map((evt) => (
                  <RemindersCardItem
                    key={evt.id}
                    event={evt}
                    onSnooze={snoozeReminder}
                    onDismiss={dismissReminder}
                    onPush={rescheduleEvent}
                    onMoveTomorrow={moveEventToTomorrow}
                    onOpenBriefing={setPreMeetingBriefingEvent}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Group 3: Upcoming Days */}
          <div className="card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Upcoming Schedules & Future Reminders
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                  {groupedReminders.upcomingDays.length}
                </span>
              </div>
            </div>

            {groupedReminders.upcomingDays.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                No future active reminders configured.
              </div>
            ) : (
              <div className="space-y-2">
                {groupedReminders.upcomingDays.map((evt) => (
                  <RemindersCardItem
                    key={evt.id}
                    event={evt}
                    onSnooze={snoozeReminder}
                    onDismiss={dismissReminder}
                    onPush={rescheduleEvent}
                    onMoveTomorrow={moveEventToTomorrow}
                    onOpenBriefing={setPreMeetingBriefingEvent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCHED ALERT HISTORY */}
      {activeTab === 'history' && (
        <div className="card p-4 space-y-3 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Historical Notification Audit Log</span>
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {notificationLogs.length} alerts logged
            </span>
          </div>

          {notificationLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No notifications logged yet. Dispatched alerts will automatically record here.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] truncate">
                      {log.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {log.body}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {format(new Date(log.shown_at), 'MMM d, HH:mm:ss')}
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] inline-block mt-0.5">
                      {log.action_taken || 'shown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM SOUND THEMES (G4) */}
      {activeTab === 'audio' && (
        <div className="card p-5 space-y-5 shadow-xs animate-in fade-in duration-150">
          <div className="pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Custom Sound Themes & Audio Synthesizer
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Powered by real-time Web Audio API frequency synthesis. Test each sound profile below.
            </p>
          </div>

          {/* Master Volume & Mute Controls */}
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className={`p-2 rounded-[var(--radius-md)] border transition-colors ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-[var(--accent)] text-[var(--accent-text)] border-transparent'
                }`}
                title={isMuted ? 'Unmute Audio' : 'Mute All Notification Sounds'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {isMuted ? 'Notifications Muted' : 'Sound Alerts Enabled'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  Master Output Volume: {Math.round(volume * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-48">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">0%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                disabled={isMuted}
                onChange={handleVolumeChange}
                className="w-full accent-[var(--accent)] cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] font-mono text-[var(--text-muted)]">100%</span>
            </div>
          </div>

          {/* Sound Themes Grid */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Select Active Theme
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SOUND_THEMES_INFO.map((item) => {
                const isSelected = soundTheme === item.id

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-[var(--radius-md)] border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-[var(--accent)] text-[var(--accent-text)]">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewSound(item.id)}
                        className="p-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shadow-2xs"
                        title="Preview audio cue"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSoundTheme(item.id)}
                        disabled={isSelected}
                        className={`text-xs py-1 px-2.5 rounded font-medium transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent)] text-[var(--accent-text)] opacity-90 cursor-default'
                            : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Use'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual Reminder Item Card with G5 direct Snooze & Reschedule
const RemindersCardItem: React.FC<{
  event: CalendarEvent
  onSnooze: (id: string, mins: number) => Promise<void>
  onDismiss: (id: string) => Promise<void>
  onPush: (id: string, mins: number) => Promise<void>
  onMoveTomorrow: (id: string) => Promise<void>
  onOpenBriefing: (event: CalendarEvent) => void
}> = ({ event, onSnooze, onDismiss, onPush, onMoveTomorrow, onOpenBriefing }) => {
  const rem = event.reminders![0]
  const start = new Date(event.start)
  const end = new Date(event.end)

  return (
    <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-[var(--text-muted)]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
            {event.title}
          </span>
          {event.priority === 'urgent' && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-red-500 text-white">
              Urgent
            </span>
          )}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-2 mt-0.5">
          <span>{format(start, 'PPp')} – {format(end, 'HH:mm')}</span>
          {event.location && <span>• {event.location}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {/* Pre-Meeting Briefing Button */}
        <button
          onClick={() => onOpenBriefing(event)}
          className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1"
          title="Open Executive Pre-Meeting Briefing"
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          <span>Briefing</span>
        </button>

        {/* Video Link */}
        {event.meeting_url && (
          <a
            href={event.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-[var(--bg-hover)]"
            title="Join Video Meeting"
          >
            <Video className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Snooze options */}
        <button
          onClick={() => onSnooze(rem.id, 10)}
          className="px-2 py-1 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
          title="Snooze reminder by 10m"
        >
          Snooze 10m
        </button>

        {/* Direct Push 15m */}
        <button
          onClick={() => onPush(event.id, 15)}
          className="px-2 py-1 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
          title="Push entire event by 15m"
        >
          Push 15m
        </button>

        {/* Move Tomorrow */}
        <button
          onClick={() => onMoveTomorrow(event.id)}
          className="px-2 py-1 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
          title="Shift to tomorrow at same time"
        >
          Tomorrow
        </button>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(rem.id)}
          className="btn-primary text-[10px] py-1 px-2.5"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
