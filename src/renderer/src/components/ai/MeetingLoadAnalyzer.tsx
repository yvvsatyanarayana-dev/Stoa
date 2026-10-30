import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent } from '../../../../types'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { BarChart3, AlertTriangle, Zap, CheckCircle, Flame, Clock } from 'lucide-react'

interface DayLoad {
  date: Date
  dayName: string
  dateStr: string
  totalMinutes: number
  totalHours: number
  events: CalendarEvent[]
  isFragmented: boolean
  chains: Array<{
    count: number
    start: Date
    end: Date
  }>
}

export const MeetingLoadAnalyzer: React.FC = () => {
  const { events, selectedDate } = useAppStore()

  // Calculate stats for the selected week (Mon - Sun)
  const analysis = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday start
    const days: DayLoad[] = []

    let weekTotalMinutes = 0
    let longestChainCount = 0
    let longestChainDesc = 'None'
    let maxDayMinutes = 0
    let maxDayName = 'None'

    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(weekStart, i)
      const dayEvents = events
        .filter((e) => !e.all_day && isSameDay(new Date(e.start), currentDay))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

      let dayMinutes = 0
      for (const ev of dayEvents) {
        const s = new Date(ev.start).getTime()
        const e = new Date(ev.end).getTime()
        const durationMin = Math.max(0, (e - s) / 60000)
        dayMinutes += durationMin
      }

      weekTotalMinutes += dayMinutes
      if (dayMinutes > maxDayMinutes) {
        maxDayMinutes = dayMinutes
        maxDayName = format(currentDay, 'EEEE')
      }

      // Detect chains (back-to-back: gap <= 10 mins)
      const chains: Array<{ count: number; start: Date; end: Date }> = []
      let currentChain: CalendarEvent[] = []

      for (let j = 0; j < dayEvents.length; j++) {
        const ev = dayEvents[j]
        if (currentChain.length === 0) {
          currentChain.push(ev)
        } else {
          const prevEv = currentChain[currentChain.length - 1]
          const prevEnd = new Date(prevEv.end).getTime()
          const currStart = new Date(ev.start).getTime()
          const gapMin = (currStart - prevEnd) / 60000

          if (gapMin <= 10) {
            currentChain.push(ev)
          } else {
            if (currentChain.length >= 3) {
              chains.push({
                count: currentChain.length,
                start: new Date(currentChain[0].start),
                end: new Date(currentChain[currentChain.length - 1].end)
              })
            }
            currentChain = [ev]
          }
        }
      }
      if (currentChain.length >= 3) {
        chains.push({
          count: currentChain.length,
          start: new Date(currentChain[0].start),
          end: new Date(currentChain[currentChain.length - 1].end)
        })
      }

      for (const ch of chains) {
        if (ch.count > longestChainCount) {
          longestChainCount = ch.count
          longestChainDesc = `${format(currentDay, 'EEE')}: ${ch.count} meetings in a row (${format(ch.start, 'HH:mm')} - ${format(ch.end, 'HH:mm')})`
        }
      }

      // Detect Fragmented Day: at least 3 meetings, and all gaps between working hours are < 30 mins
      let isFragmented = false
      if (dayEvents.length >= 3) {
        let hasDeepFocusSlot = false
        for (let k = 0; k < dayEvents.length - 1; k++) {
          const gap =
            (new Date(dayEvents[k + 1].start).getTime() - new Date(dayEvents[k].end).getTime()) / 60000
          if (gap >= 60) {
            hasDeepFocusSlot = true
            break
          }
        }
        if (!hasDeepFocusSlot && dayMinutes > 180) {
          isFragmented = true
        }
      }

      days.push({
        date: currentDay,
        dayName: format(currentDay, 'EEE'),
        dateStr: format(currentDay, 'MMM d'),
        totalMinutes: dayMinutes,
        totalHours: Math.round((dayMinutes / 60) * 10) / 10,
        events: dayEvents,
        isFragmented,
        chains
      })
    }

    // Working capacity: 5 working days * 8 hours = 40 hours = 2400 minutes
    const workingCapacityMin = 40 * 60
    const focusPercentage = Math.max(
      0,
      Math.min(100, Math.round(((workingCapacityMin - weekTotalMinutes) / workingCapacityMin) * 100))
    )

    return {
      days,
      weekTotalHours: Math.round((weekTotalMinutes / 60) * 10) / 10,
      avgHoursPerDay: Math.round((weekTotalMinutes / 5 / 60) * 10) / 10,
      longestChainDesc: longestChainCount >= 3 ? longestChainDesc : 'None (No marathon meetings)',
      maxDayName: maxDayMinutes > 0 ? `${maxDayName} (${Math.round((maxDayMinutes / 60) * 10) / 10}h)` : 'None',
      focusPercentage
    }
  }, [events, selectedDate])

  const getLoadColor = (hours: number): string => {
    if (hours > 6) return 'oklch(0.65 0.22 25)' // Red
    if (hours >= 4) return 'oklch(0.82 0.18 80)' // Amber/Yellow
    return 'oklch(0.72 0.18 145)' // Green
  }

  return (
    <div className="card p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              AI Meeting Load & Focus Analyzer
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Analyzes meeting saturation, back-to-back fatigue, and available deep work time.
            </p>
          </div>
        </div>

        {/* Focus Score Badge */}
        <div className="flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-[var(--radius-md)]">
          <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
          <div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Focus Time
            </div>
            <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
              {analysis.focusPercentage}% Free
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono uppercase">
            <Clock className="w-3 h-3" />
            <span>Total Load</span>
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] mt-1">
            {analysis.weekTotalHours} hrs
          </div>
        </div>

        <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Avg Per Day</div>
          <div className="text-sm font-bold text-[var(--text-primary)] mt-1">
            {analysis.avgHoursPerDay} hrs
          </div>
        </div>

        <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono uppercase">
            <Flame className="w-3 h-3" />
            <span>Busiest Day</span>
          </div>
          <div className="text-xs font-semibold text-[var(--text-primary)] truncate mt-1">
            {analysis.maxDayName}
          </div>
        </div>

        <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Longest Chain</div>
          <div className="text-xs font-semibold text-[var(--text-primary)] truncate mt-1" title={analysis.longestChainDesc}>
            {analysis.longestChainDesc}
          </div>
        </div>
      </div>

      {/* Daily Load Bars */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Weekly Saturation Breakdown (Mon – Sun)
        </div>

        <div className="space-y-2">
          {analysis.days.map((day) => {
            const barWidth = Math.min(100, (day.totalHours / 8) * 100) // 8 hrs max scale
            const color = getLoadColor(day.totalHours)

            return (
              <div key={day.dayName} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] w-8">
                      {day.dayName}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {day.dateStr}
                    </span>
                    {day.isFragmented && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <AlertTriangle className="w-2.5 h-2.5" /> Fragmented Day
                      </span>
                    )}
                    {day.chains.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        <Flame className="w-2.5 h-2.5" /> {day.chains[0].count} in a row
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                    {day.totalHours > 0 ? `${day.totalHours}h (${day.events.length} mtgs)` : 'Free'}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Advisory Card */}
      <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
        <CheckCircle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Scheduling Tip: </span>
          {analysis.focusPercentage >= 60 ? (
            <span>Your week has healthy focus blocks. Keep protecting slots of 2+ hours for deep concentration.</span>
          ) : analysis.focusPercentage >= 40 ? (
            <span>Meeting density is moderate. Watch out for fragmented gaps under 30 minutes on overloaded days.</span>
          ) : (
            <span className="text-amber-500">
              High meeting overload detected! More than 60% of working hours are booked. Consider declining non-essential sessions or batching syncs.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
