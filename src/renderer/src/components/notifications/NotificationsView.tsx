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
    <div className="flex-1 overflow-y-auto bg-[#2D0000] p-6 space-y-6 text-[#EEEAD7]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#551010]">
          <div>
            <h2 className="text-xl font-bold text-[#EEEAD7] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#EEEAD7]" />
              <span>Notification & Reminder Center</span>
            </h2>
            <p className="text-xs text-[#757D6F] mt-1">
              Active reminders, snooze controls, and system alert logs.
            </p>
          </div>

          {notificationLogs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#380505] hover:bg-[#480707] text-[#EEEAD7] text-xs font-bold border border-[#551010] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>

        {/* Scheduled Reminders */}
        <div className="bg-[#380505] border border-[#551010] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#EEEAD7] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#757D6F]" />
            <span>Active Event Reminders</span>
          </h3>

          {eventsWithReminders.length === 0 ? (
            <div className="text-center py-6 text-[#757D6F] text-xs">
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
                    className="p-3.5 bg-[#1F0000] border border-[#551010] rounded-lg flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#EEEAD7]">{evt.title}</div>
                      <div className="text-xs text-[#757D6F] font-mono mt-0.5">
                        Scheduled: {format(start, 'PPp')} • Alerts {rem.offset_minutes}m prior
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.meeting_url && (
                        <a
                          href={evt.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] border border-[#EEEAD7]/30 rounded-md text-xs font-bold flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Meeting</span>
                        </a>
                      )}
                      <button
                        onClick={() => snoozeReminder(rem.id, 10)}
                        className="px-2.5 py-1 bg-[#380505] hover:bg-[#480707] text-[#EEEAD7] rounded-md text-xs font-bold border border-[#551010] transition-colors"
                      >
                        Snooze 10m
                      </button>
                      <button
                        onClick={() => dismissReminder(rem.id)}
                        className="px-2.5 py-1 bg-[#380505] hover:bg-[#480707] text-[#EEEAD7] rounded-md text-xs font-bold border border-[#551010] transition-colors"
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
        <div className="bg-[#380505] border border-[#551010] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#EEEAD7] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#757D6F]" />
            <span>Fired Notification History</span>
          </h3>

          {notificationLogs.length === 0 ? (
            <div className="text-center py-8 text-[#757D6F] text-xs">
              No recent notifications logged.
            </div>
          ) : (
            <div className="space-y-2">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#1F0000] border border-[#551010] rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#EEEAD7]">{log.title}</div>
                    {log.body && <div className="text-[#C4BFAC] text-[11px]">{log.body}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#757D6F] font-mono">
                      {format(new Date(log.shown_at), 'HH:mm:ss • MMM d')}
                    </span>
                    {log.action_taken && (
                      <div className="text-[10px] text-[#EEEAD7] font-bold uppercase tracking-wider">
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
