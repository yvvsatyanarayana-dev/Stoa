import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Bell, Clock, Trash2, CheckCircle2, Video } from 'lucide-react'
import { format } from 'date-fns'

export const NotificationsView: React.FC = () => {
  const { notificationLogs, events, snoozeReminder, dismissReminder, fetchNotifications } = useAppStore()

  // Find events with upcoming reminders
  const eventsWithReminders = events.filter((e) => e.reminders && e.reminders.length > 0)

  const handleClearHistory = async (): Promise<void> => {
    await window.api.notifications.clear()
    await fetchNotifications()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <span>Notification & Reminder Center</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active reminders, snooze controls, and system notification history.
            </p>
          </div>

          {notificationLogs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>

        {/* Scheduled Reminders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Active Event Reminders</span>
          </h3>

          {eventsWithReminders.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No active reminders set. Reminders trigger automatically based on event offsets.
            </div>
          ) : (
            <div className="space-y-3">
              {eventsWithReminders.map((evt) => {
                const rem = evt.reminders![0]
                const start = new Date(evt.start)

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-100">{evt.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Scheduled: {format(start, 'PPp')} • Alerts {rem.offset_minutes}m prior
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.meeting_url && (
                        <a
                          href={evt.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-md text-xs font-semibold flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Meeting</span>
                        </a>
                      )}
                      <button
                        onClick={() => snoozeReminder(rem.id, 10)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        Snooze 10m
                      </button>
                      <button
                        onClick={() => dismissReminder(rem.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold border border-slate-700 transition-colors"
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Fired Notification History</span>
          </h3>

          {notificationLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No recent notifications logged.
            </div>
          ) : (
            <div className="space-y-2">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200">{log.title}</div>
                    {log.body && <div className="text-slate-400 text-[11px]">{log.body}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {format(new Date(log.shown_at), 'HH:mm:ss • MMM d')}
                    </span>
                    {log.action_taken && (
                      <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
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
