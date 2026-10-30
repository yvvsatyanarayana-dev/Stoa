import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Bell, Trash2, Sun } from 'lucide-react'
import { NotificationGrouping } from './NotificationGrouping'

export const NotificationsView: React.FC = () => {
  const { notificationLogs, fetchNotifications, setIsDailyDigestOpen } = useAppStore()

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
              <span>Notification & Reminder Intelligence</span>
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Smart grouped reminders, pre-meeting briefings, custom audio cues, and instant reschedule.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Daily Digest Modal Launcher */}
            <button
              onClick={() => setIsDailyDigestOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shadow-xs"
              title="Open Today's Morning Executive Digest"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Digest</span>
            </button>

            {notificationLogs.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="btn-secondary flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium"
                title="Clear notification audit log"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Smart Grouping & Sound Synthesizer Engine */}
        <NotificationGrouping />
      </div>
    </div>
  )
}
