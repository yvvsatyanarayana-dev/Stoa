import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  X,
  Sun,
  Sunset,
  Moon,
  Clock,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  Video,
  MapPin,
  Sparkles
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'

export const DailyDigestModal: React.FC = () => {
  const {
    isDailyDigestOpen,
    setIsDailyDigestOpen,
    events,
    categories,
    setIsExportHubOpen,
    setExportHubInitialTab,
    createEvent,
    calendars
  } = useAppStore()

  const today = new Date()

  // Filter today's active events
  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e.status !== 'cancelled' && isSameDay(new Date(e.start), today))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, today])

  // Total meeting minutes
  const totalMeetingMinutes = useMemo(() => {
    return todayEvents.reduce((acc, evt) => {
      const s = new Date(evt.start).getTime()
      const e = new Date(evt.end).getTime()
      const diff = Math.max(0, e - s)
      return acc + Math.round(diff / 60000)
    }, 0)
  }, [todayEvents])

  // Conflict detection for today
  const hasConflicts = useMemo(() => {
    for (let i = 0; i < todayEvents.length; i++) {
      const s1 = new Date(todayEvents[i].start).getTime()
      const e1 = new Date(todayEvents[i].end).getTime()
      for (let j = i + 1; j < todayEvents.length; j++) {
        const s2 = new Date(todayEvents[j].start).getTime()
        const e2 = new Date(todayEvents[j].end).getTime()
        if (s1 < e2 && s2 < e1) return true
      }
    }
    return false
  }, [todayEvents])

  if (!isDailyDigestOpen) return null

  const hours = today.getHours()
  const greeting =
    hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening'
  const GreetingIcon = hours < 12 ? Sun : hours < 18 ? Sunset : Moon

  const meetingHoursFormatted = (totalMeetingMinutes / 60).toFixed(1)
  const estimatedWorkHours = 8
  const focusHoursRemaining = Math.max(0, estimatedWorkHours - totalMeetingMinutes / 60).toFixed(1)

  const handleShieldFocus = async () => {
    const start = new Date(today)
    start.setHours(14, 0, 0, 0)
    const end = new Date(start.getTime() + 2 * 3600000)

    await createEvent({
      id: `evt-focus-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: 'Shielded Focus Block (Deep Work)',
      description: '[FOCUS_BLOCK] [SHIELD: strict]\nProtected uninterrupted focus block.',
      start: start.toISOString(),
      end: end.toISOString(),
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      priority: 'high',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    setIsDailyDigestOpen(false)
  }

  const handleExportPdf = () => {
    setExportHubInitialTab('pdf')
    setIsDailyDigestOpen(false)
    setIsExportHubOpen(true)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)] animate-in fade-in duration-150">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <GreetingIcon className="w-4 h-4 stroke-[2]" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                {greeting} • Daily Executive Digest
              </h2>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              {format(today, 'EEEE, MMMM d, yyyy')} • Operating on real-time calendar store
            </p>
          </div>

          <button
            onClick={() => setIsDailyDigestOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[var(--accent)]" />
              <span>Meetings</span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)]">
              {todayEvents.length} <span className="text-[11px] font-normal text-[var(--text-muted)] font-mono">({meetingHoursFormatted}h)</span>
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Focus Buffer</span>
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              ~{focusHoursRemaining}h
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              {hasConflicts ? (
                <AlertCircle className="w-3 h-3 text-red-400" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
              <span>Health Status</span>
            </div>
            <div className="text-xs font-semibold truncate">
              {hasConflicts ? (
                <span className="text-red-400">Overlaps Found</span>
              ) : (
                <span className="text-emerald-400">Conflict-Free</span>
              )}
            </div>
          </div>
        </div>

        {/* Today's Agenda Itinerary */}
        <div className="flex-1 min-h-0 flex flex-col space-y-2">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between shrink-0">
            <span>Today&apos;s Run-Down</span>
            <span className="font-mono">{todayEvents.length} scheduled</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {todayEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                Your calendar is clear today. Great opportunity for deep work and strategic planning!
              </div>
            ) : (
              todayEvents.map((evt) => {
                const s = new Date(evt.start)
                const e = new Date(evt.end)
                const cat = categories.find((c) => c.id === evt.category_id)

                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color || 'var(--accent)' }}
                      />
                      <div className="truncate">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {evt.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-2 mt-0.5">
                          <span>
                            {format(s, 'HH:mm')} – {format(e, 'HH:mm')}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5" />
                              {evt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {evt.meeting_url && (
                        <a
                          href={evt.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-[var(--bg-hover)]"
                          title="Open Video Call"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShieldFocus}
              className="px-2.5 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1.5"
              title="Add a 2-hour protected focus block at 2pm"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Shield Focus (2h)</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-2.5 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1.5"
              title="Print or export polished PDF of today's schedule"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Print Day PDF</span>
            </button>
          </div>

          <button
            onClick={() => setIsDailyDigestOpen(false)}
            className="btn-primary text-xs py-1.5 px-4"
          >
            Start My Day
          </button>
        </div>
      </div>
    </div>
  )
}
