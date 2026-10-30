import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { startOfWeek, addDays, isSameDay } from 'date-fns'
import { PieChart, Clock, Target, Shield, AlertCircle } from 'lucide-react'

export const MeetingFocusRatio: React.FC = () => {
  const { events, selectedDate } = useAppStore()

  const stats = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = addDays(weekStart, 7)

    const weekEvents = events.filter((e) => {
      if (e.all_day) return false
      const s = new Date(e.start)
      return s >= weekStart && s < weekEnd
    })

    let totalMeetingMinutes = 0
    let focusBlockMinutes = 0

    // Standard working week: 5 days * 8 hours (9:00 - 17:00) = 40h = 2400 mins
    const workWeekCapacityMins = 40 * 60

    // Analyze each day's events
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const currentDay = addDays(weekStart, dayIdx)
      const dayEvents = weekEvents
        .filter((e) => isSameDay(new Date(e.start), currentDay))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

      let dayMeetingMins = 0

      for (const ev of dayEvents) {
        const s = new Date(ev.start).getTime()
        const e = new Date(ev.end).getTime()
        const dur = Math.max(0, (e - s) / 60000)
        dayMeetingMins += dur
      }

      totalMeetingMinutes += dayMeetingMins

      // Calculate deep work blocks (free contiguous gaps >= 90 mins within 9am - 5pm)
      const dayStart = new Date(currentDay)
      dayStart.setHours(9, 0, 0, 0)
      const dayEnd = new Date(currentDay)
      dayEnd.setHours(17, 0, 0, 0)

      let cursor = dayStart.getTime()

      for (const ev of dayEvents) {
        const evStart = Math.max(cursor, new Date(ev.start).getTime())
        const evEnd = new Date(ev.end).getTime()

        if (evStart > cursor) {
          const gapMins = (evStart - cursor) / 60000
          if (gapMins >= 90) {
            focusBlockMinutes += gapMins
          }
        }
        cursor = Math.max(cursor, evEnd)
      }

      if (dayEnd.getTime() > cursor) {
        const remainingMins = (dayEnd.getTime() - cursor) / 60000
        if (remainingMins >= 90) {
          focusBlockMinutes += remainingMins
        }
      }
    }

    const unallocatedMinutes = Math.max(0, workWeekCapacityMins - totalMeetingMinutes - focusBlockMinutes)

    const meetingPct = Math.min(100, Math.round((totalMeetingMinutes / workWeekCapacityMins) * 100))
    const focusPct = Math.min(100, Math.round((focusBlockMinutes / workWeekCapacityMins) * 100))
    const unallocatedPct = Math.max(0, 100 - meetingPct - focusPct)

    return {
      totalMeetingHours: Math.round((totalMeetingMinutes / 60) * 10) / 10,
      focusBlockHours: Math.round((focusBlockMinutes / 60) * 10) / 10,
      unallocatedHours: Math.round((unallocatedMinutes / 60) * 10) / 10,
      meetingPct,
      focusPct,
      unallocatedPct,
      totalEvents: weekEvents.length
    }
  }, [events, selectedDate])

  const ratioGrade = useMemo(() => {
    if (stats.meetingPct > 60) {
      return {
        label: 'Meeting Overload',
        desc: 'Over 60% of work hours are meeting-locked. Deep focus capacity is severely compromised.',
        color: 'oklch(0.65 0.22 25)'
      }
    }
    if (stats.meetingPct > 40) {
      return {
        label: 'Moderate Meeting Density',
        desc: 'Healthy engagement, but consider reserving uninterrupted focus mornings.',
        color: 'oklch(0.82 0.18 80)'
      }
    }
    return {
      label: 'Optimal Deep Work Balance',
      desc: 'Excellent ratio. Adequate blocks of 90+ minutes available for sustained productivity.',
      color: 'oklch(0.72 0.18 145)'
    }
  }, [stats.meetingPct])

  return (
    <div className="card p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <PieChart className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Meeting vs. Focus Ratio (B2)
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Calculates weekly meeting commitments vs. uninterrupted 90+ min deep focus intervals.
            </p>
          </div>
        </div>

        <span
          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
          style={{
            borderColor: ratioGrade.color,
            color: ratioGrade.color,
            background: 'color-mix(in oklch, currentColor 10%, transparent)'
          }}
        >
          {ratioGrade.label}
        </span>
      </div>

      {/* Segmented Visual Ratio Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded-full bg-[var(--bg-subtle)] overflow-hidden flex border border-[var(--border-subtle)]">
          <div
            className="h-full transition-all duration-500 bg-[var(--accent)]"
            style={{ width: `${stats.meetingPct}%` }}
            title={`Meetings: ${stats.meetingPct}%`}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${stats.focusPct}%`,
              background: 'oklch(0.72 0.18 145)'
            }}
            title={`Deep Focus: ${stats.focusPct}%`}
          />
          <div
            className="h-full transition-all duration-500 opacity-40 bg-[var(--border-default)]"
            style={{ width: `${stats.unallocatedPct}%` }}
            title={`Unallocated: ${stats.unallocatedPct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" />
            Meetings ({stats.meetingPct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'oklch(0.72 0.18 145)' }} />
            Deep Focus ({stats.focusPct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--border-default)] inline-block opacity-60" />
            Unallocated ({stats.unallocatedPct}%)
          </span>
        </div>
      </div>

      {/* 3 Metric Detail Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono uppercase">
            <Clock className="w-3 h-3 text-[var(--accent)]" />
            <span>Scheduled Meetings</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {stats.totalMeetingHours} hrs
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Across {stats.totalEvents} calendar bookings this week.
          </p>
        </div>

        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono uppercase">
            <Target className="w-3 h-3" style={{ color: 'oklch(0.72 0.18 145)' }} />
            <span>Deep Work Gaps</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {stats.focusBlockHours} hrs
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Contiguous free windows ≥ 90 mins in working hours.
          </p>
        </div>

        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono uppercase">
            <Shield className="w-3 h-3 text-[var(--text-muted)]" />
            <span>Buffer Time</span>
          </div>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {stats.unallocatedHours} hrs
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Available for ad-hoc tasks, transitions, and planning.
          </p>
        </div>
      </div>

      {/* Feedback Note */}
      <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent)]" />
        <span>{ratioGrade.desc}</span>
      </div>
    </div>
  )
}
