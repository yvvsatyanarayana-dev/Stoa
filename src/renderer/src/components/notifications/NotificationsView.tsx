import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Bell, Clock, Trash2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

export const NotificationsView: React.FC = () => {
  const { notificationLogs, events, snoozeReminder, dismissReminder, fetchNotifications } = useAppStore()

  const eventsWithReminders = events.filter((e) => e.reminders && e.reminders.length > 0)

  const handleClearHistory = async (): Promise<void> => {
    await window.api.notifications.clear()
    await fetchNotifications()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 space-y-5 text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--text-primary)]" />
              <span>Notification & Reminder Center</span>
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Active reminders, snooze controls, and background scheduler logs.
            </p>
          </div>

          {notificationLogs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn-secondary flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Log</span>
            </button>
          )}
        </div>

        {/* Scheduled Reminders */}
        <div className="card p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Active Event Reminders</span>
          </h3>

          {eventsWithReminders.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-muted)] text-xs">
              No active event reminders set. Reminders trigger automatically based on event offsets.
            </div>
          ) : (
            <div className="space-y-2">
              {eventsWithReminders.map((evt) => {
                const rem = evt.reminders![0]
                const start = new Date(evt.start)

                return (
                  <div
                    key={evt.id}
                    className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{evt.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                        Scheduled: {format(start, 'PPp')} • Alerts {rem.offset_minutes}m prior
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => snoozeReminder(rem.id, 10)}
                        className="btn-secondary text-[10px] font-mono py-1 px-2.5"
                      >
                        Snooze 10m
                      </button>
                      <button
                        onClick={() => dismissReminder(rem.id)}
                        className="btn-primary text-[10px] py-1 px-2.5"
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

        {/* Historical Notification Log */}
        <div className="card p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Dispatched Alert History</span>
          </h3>

          {notificationLogs.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-xs">
              No past notifications recorded. Alerts will appear here when fired.
            </div>
          ) : (
            <div className="space-y-2">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{log.title}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{log.body}</div>
                    <div className="text-[9px] text-[var(--text-muted)] font-mono mt-1">
                      {format(new Date(log.shown_at), 'yyyy-MM-dd HH:mm:ss')}
                    </div>
                  </div>
                  {log.action_taken && (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {log.action_taken}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
