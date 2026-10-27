import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Bell, Clock, Trash2, CheckCircle2, Video } from 'lucide-react'
import { format } from 'date-fns'

export const NotificationsView: React.FC = () => {
  const { notificationLogs, events, snoozeReminder, dismissReminder, fetchNotifications } = useAppStore()

  const eventsWithReminders = events.filter((e) => e.reminders && e.reminders.length > 0)

  const handleClearHistory = async (): Promise<void> => {
    await window.api.notifications.clear()
    await fetchNotifications()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 space-y-6 text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--text-primary)]" />
              <span>Notification & Reminder Center</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Active reminders, snooze controls, and system alert logs.
            </p>
          </div>

          {notificationLogs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>

        {/* Scheduled Reminders */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Active Event Reminders</span>
          </h3>

          {eventsWithReminders.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-muted)] text-xs">
              No active event reminders set. Reminders trigger automatically based on event offsets.
            </div>
          ) : (
            <div className="space-y-3">
              {eventsWithReminders.map((evt) => {
                const rem = evt.reminders![0]
                const start = new Date(evt.start)

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">{evt.title}</div>
                      <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                        Scheduled: {format(start, 'PPp')} • Alerts {rem.offset_minutes}m prior
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.meeting_url && (
                        <a
                          href={evt.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Meeting</span>
                        </a>
                      )}
                      <button
                        onClick={() => snoozeReminder(rem.id, 10)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        Snooze 10m
                      </button>
                      <button
                        onClick={() => dismissReminder(rem.id)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historical Log */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Fired Notification History</span>
          </h3>

          {notificationLogs.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-xs">
              No recent notifications logged.
            </div>
          ) : (
            <div className="space-y-2">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[var(--text-primary)]">{log.title}</div>
                    {log.body && <div className="text-[var(--text-secondary)] text-[11px]">{log.body}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {format(new Date(log.shown_at), 'HH:mm:ss • MMM d')}
                    </span>
                    {log.action_taken && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Action: {log.action_taken}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
