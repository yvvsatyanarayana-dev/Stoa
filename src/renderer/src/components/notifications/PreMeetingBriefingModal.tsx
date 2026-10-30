import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { soundService } from '../../services/soundService'
import {
  X,
  Video,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Volume2
} from 'lucide-react'
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns'

export const PreMeetingBriefingModal: React.FC = () => {
  const {
    preMeetingBriefingEvent,
    setPreMeetingBriefingEvent,
    events,
    categories,
    rescheduleEvent,
    moveEventToTomorrow,
    snoozeReminder
  } = useAppStore()

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false)

  // Real-time ticker
  useEffect(() => {
    if (!preMeetingBriefingEvent) return
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [preMeetingBriefingEvent])

  if (!preMeetingBriefingEvent) return null

  const event = preMeetingBriefingEvent
  const startTime = new Date(event.start)
  const endTime = new Date(event.end)
  const now = currentTime.getTime()
  const startTs = startTime.getTime()
  const diffSecs = differenceInSeconds(startTime, currentTime)
  const isOngoing = now >= startTs && now <= endTime.getTime()

  // Category
  const category = categories.find((c) => c.id === event.category_id)

  // Next meeting buffer
  const nextEventAfterThis = events
    .filter((e) => e.id !== event.id && new Date(e.start).getTime() >= endTime.getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0]

  const bufferMinutes = nextEventAfterThis
    ? differenceInMinutes(new Date(nextEventAfterThis.start), endTime)
    : null

  const handleJoinCall = () => {
    if (event.meeting_url) {
      window.open(event.meeting_url, '_blank')
    }
  }

  const handleSnooze = async (minutes: number) => {
    if (event.reminders && event.reminders[0]) {
      await snoozeReminder(event.reminders[0].id, minutes)
    }
    setPreMeetingBriefingEvent(null)
  }

  const handlePushTime = async (minutes: number) => {
    setIsRescheduling(true)
    await rescheduleEvent(event.id, minutes)
    setIsRescheduling(false)
    setPreMeetingBriefingEvent(null)
  }

  const handleMoveTomorrow = async () => {
    setIsRescheduling(true)
    await moveEventToTomorrow(event.id)
    setIsRescheduling(false)
    setPreMeetingBriefingEvent(null)
  }

  const formatCountdown = () => {
    if (isOngoing) return 'Session in progress'
    if (diffSecs <= 0) return 'Starts now'
    const mins = Math.floor(diffSecs / 60)
    const secs = diffSecs % 60
    return `Starts in ${mins}m ${secs}s`
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)] animate-in fade-in duration-150">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-hidden relative">
        {/* Top Accent Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: category?.color || 'var(--accent)' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 pt-1 border-b border-[var(--border-subtle)] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-text)]">
                Executive Briefing
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatCountdown()}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              {event.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(startTime, 'EEEE, MMMM d')}</span>
              <span>•</span>
              <span>{format(startTime, 'HH:mm')} – {format(endTime, 'HH:mm')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => soundService.play()}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
              title="Test audio chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreMeetingBriefingEvent(null)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meeting Video Link Banner (if present) */}
        {event.meeting_url ? (
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Video Conference Ready
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                  {event.meeting_url}
                </div>
              </div>
            </div>

            <button
              onClick={handleJoinCall}
              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Video className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Join Now</span>
            </button>
          </div>
        ) : null}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Location / Room */}
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[var(--accent)]" />
              <span>Location / Venue</span>
            </div>
            <div className="text-xs font-medium text-[var(--text-primary)] truncate">
              {event.location || 'No physical room specified (Virtual)'}
            </div>
          </div>

          {/* Buffer to Next Meeting */}
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Post-Meeting Buffer</span>
            </div>
            <div className="text-xs font-medium text-[var(--text-primary)] truncate">
              {bufferMinutes !== null
                ? `${bufferMinutes} min until "${nextEventAfterThis?.title}"`
                : 'No further meetings scheduled today'}
            </div>
          </div>
        </div>

        {/* Agenda & Notes */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Agenda Outline & Notes
          </div>
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed max-h-28 overflow-y-auto">
            {event.description ? (
              <p className="whitespace-pre-line">{event.description}</p>
            ) : (
              <p className="italic text-[var(--text-muted)]">
                No description or agenda provided for this meeting.
              </p>
            )}
          </div>
        </div>

        {/* Actions Bar: Snooze & Reschedule directly */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Quick Actions & Reschedule
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Snooze options */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-muted)]">Snooze:</span>
              <button
                onClick={() => handleSnooze(5)}
                className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
              >
                +5m
              </button>
              <button
                onClick={() => handleSnooze(15)}
                className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
              >
                +15m
              </button>
            </div>

            {/* Direct Push / Reschedule options */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-muted)]">Push Event:</span>
              <button
                disabled={isRescheduling}
                onClick={() => handlePushTime(15)}
                className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors disabled:opacity-50"
                title="Delay entire meeting by 15 minutes"
              >
                +15m
              </button>
              <button
                disabled={isRescheduling}
                onClick={() => handlePushTime(30)}
                className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors disabled:opacity-50"
                title="Delay entire meeting by 30 minutes"
              >
                +30m
              </button>
              <button
                disabled={isRescheduling}
                onClick={handleMoveTomorrow}
                className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors disabled:opacity-50"
                title="Shift to tomorrow at same time"
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
