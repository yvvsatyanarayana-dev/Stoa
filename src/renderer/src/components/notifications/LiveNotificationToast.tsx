import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { soundService } from '../../services/soundService'
import { CalendarEvent, Reminder } from '../../../../types'
import {
  Bell,
  X,
  Video,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'

interface ActiveToast {
  id: string
  reminder?: Reminder
  event: CalendarEvent
  timestamp: string
}

export const LiveNotificationToast: React.FC = () => {
  const {
    setPreMeetingBriefingEvent,
    snoozeReminder,
    rescheduleEvent,
    fetchNotifications
  } = useAppStore()

  const [toasts, setToasts] = useState<ActiveToast[]>([])

  useEffect(() => {
    if (!window.api?.notifications?.onReceived) return

    const unsubscribe = window.api.notifications.onReceived((data: { reminder: any; event: CalendarEvent; timestamp: string }) => {
      // Play sound theme
      soundService.playForPriority(data.event?.priority)

      const newToast: ActiveToast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        reminder: data.reminder,
        event: data.event,
        timestamp: data.timestamp
      }

      setToasts((prev) => [newToast, ...prev].slice(0, 3))
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Auto-dismiss individual toasts after 15 seconds
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1))
    }, 15000)
    return () => clearTimeout(timer)
  }, [toasts])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleOpenBriefing = (event: CalendarEvent, toastId: string) => {
    setPreMeetingBriefingEvent(event)
    dismissToast(toastId)
  }

  const handleJoinCall = (url?: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  const handleSnooze = async (toast: ActiveToast, mins: number) => {
    if (toast.reminder?.id) {
      await snoozeReminder(toast.reminder.id, mins)
    }
    dismissToast(toast.id)
  }

  const handlePushTime = async (toast: ActiveToast, mins: number) => {
    await rescheduleEvent(toast.event.id, mins)
    await fetchNotifications()
    dismissToast(toast.id)
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none text-[var(--text-primary)]">
      {toasts.map((toast) => {
        const s = new Date(toast.event.start)
        const e = new Date(toast.event.end)

        return (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-2xl space-y-3 animate-in slide-in-from-bottom-3 duration-200"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <span>Upcoming Alert</span>
                    <span>•</span>
                    <span>{format(s, 'HH:mm')}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] truncate mt-0.5">
                    {toast.event.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time / Location */}
            <div className="text-[11px] text-[var(--text-secondary)] font-mono flex items-center justify-between">
              <span>{format(s, 'HH:mm')} – {format(e, 'HH:mm')}</span>
              {toast.event.location && (
                <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">
                  {toast.event.location}
                </span>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5">
                {toast.event.meeting_url ? (
                  <button
                    onClick={() => handleJoinCall(toast.event.meeting_url)}
                    className="btn-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
                  >
                    <Video className="w-3 h-3" />
                    <span>Join</span>
                  </button>
                ) : null}

                <button
                  onClick={() => handleOpenBriefing(toast.event, toast.id)}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  <span>Briefing</span>
                </button>
              </div>

              {/* Snooze & Push buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSnooze(toast, 10)}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                  title="Snooze reminder by 10 minutes"
                >
                  +10m
                </button>
                <button
                  onClick={() => handlePushTime(toast, 15)}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                  title="Push event schedule by 15 minutes"
                >
                  Push 15m
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
