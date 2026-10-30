import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { startOfWeek, addDays, isSameDay, format } from 'date-fns'
import { Grid, ChevronLeft, ChevronRight, Info } from 'lucide-react'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 AM to 8:00 PM (20:00)
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const TimeUseHeatmap: React.FC = () => {
  const { events, selectedDate } = useAppStore()
  const [weekOffset, setWeekOffset] = useState<number>(0)
  const [hoveredCell, setHoveredCell] = useState<{
    dayName: string
    dateStr: string
    hourStr: string
    minutes: number
    eventTitles: string[]
  } | null>(null)

  // Compute reference week start based on selectedDate + weekOffset
  const weekStart = useMemo(() => {
    const base = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
    return addDays(base, weekOffset * 7)
  }, [selectedDate, weekOffset])

  // Compute 7 days x 14 hours matrix from real user events
  const { matrix, totalWeekMinutes } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(HOURS.length).fill(0))
    const eventMap: Record<string, string[]> = {}
    let totalMins = 0

    // Filter events for this 7-day window
    const weekEnd = addDays(weekStart, 7)
    const currentEvents = events.filter((e) => {
      if (e.all_day) return false
      const s = new Date(e.start)
      return s >= weekStart && s < weekEnd
    })

    currentEvents.forEach((ev) => {
      const start = new Date(ev.start)
      const end = new Date(ev.end)

      // Determine day index 0..6
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const dayDate = addDays(weekStart, dayIdx)
        if (isSameDay(start, dayDate)) {
          const sMin = start.getHours() * 60 + start.getMinutes()
          const eMin = end.getHours() * 60 + end.getMinutes()
          const duration = Math.max(1, eMin - sMin)
          totalMins += duration

          // Distribute across hour buckets (7 to 20)
          HOURS.forEach((h, hIdx) => {
            const bucketStart = h * 60
            const bucketEnd = (h + 1) * 60

            const overlapStart = Math.max(sMin, bucketStart)
            const overlapEnd = Math.min(eMin, bucketEnd)
            const overlapMin = Math.max(0, overlapEnd - overlapStart)

            if (overlapMin > 0) {
              grid[dayIdx][hIdx] += overlapMin

              const key = `${dayIdx}-${hIdx}`
              if (!eventMap[key]) eventMap[key] = []
              if (!eventMap[key].includes(ev.title || 'Untitled')) {
                eventMap[key].push(ev.title || 'Untitled')
              }
            }
          })
          break
        }
      }
    })

    return {
      matrix: grid.map((hours, dayIdx) =>
        hours.map((mins, hIdx) => ({
          minutes: mins,
          events: eventMap[`${dayIdx}-${hIdx}`] || []
        }))
      ),
      totalWeekMinutes: totalMins
    }
  }, [events, weekStart])

  // Helper for heatmap cell color intensity using CSS var(--accent)
  const getCellBackground = (mins: number): string => {
    if (mins === 0) return 'var(--bg-subtle)'
    const ratio = Math.min(1, mins / 60) // 60 min is a full hour
    if (ratio < 0.3) return 'color-mix(in oklch, var(--accent) 25%, var(--bg-subtle))'
    if (ratio < 0.6) return 'color-mix(in oklch, var(--accent) 50%, var(--bg-subtle))'
    if (ratio < 0.9) return 'color-mix(in oklch, var(--accent) 75%, var(--bg-subtle))'
    return 'var(--accent)'
  }

  const getCellTextColor = (mins: number): string => {
    return mins >= 45 ? 'var(--accent-text)' : 'var(--text-primary)'
  }

  return (
    <div className="card p-5 space-y-4 shadow-xs">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <Grid className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Time-Use Density Heatmap
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Hourly density analysis showing peak concentration and idle slots across the week.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-0.5">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono font-medium text-[var(--text-primary)]">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2 py-1 text-[11px] rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            >
              This Week
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div>
          Total scheduled in view:{' '}
          <span className="font-bold font-mono text-[var(--text-primary)]">
            {Math.round((totalWeekMinutes / 60) * 10) / 10} hours
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
          <span>Less</span>
          <div className="flex gap-1">
            <span className="w-3 h-3 rounded-xs bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
            <span
              className="w-3 h-3 rounded-xs"
              style={{ background: 'color-mix(in oklch, var(--accent) 30%, var(--bg-subtle))' }}
            />
            <span
              className="w-3 h-3 rounded-xs"
              style={{ background: 'color-mix(in oklch, var(--accent) 60%, var(--bg-subtle))' }}
            />
            <span className="w-3 h-3 rounded-xs bg-[var(--accent)]" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[580px] space-y-1.5">
          {/* Hour Headers */}
          <div className="grid grid-cols-15 gap-1 text-[10px] font-mono text-[var(--text-muted)] text-center">
            <div className="w-12 text-left font-sans font-semibold">Day</div>
            {HOURS.map((h) => (
              <div key={h} className="truncate">
                {h}:00
              </div>
            ))}
          </div>

          {/* Heatmap Rows (7 Days) */}
          {DAY_LABELS.map((dayName, dayIdx) => {
            const dayDate = addDays(weekStart, dayIdx)
            const isTodayDate = isSameDay(dayDate, new Date())

            return (
              <div key={dayName} className="grid grid-cols-15 gap-1 items-center">
                {/* Day Label */}
                <div
                  className={`w-12 text-xs font-semibold truncate flex items-center gap-1 ${
                    isTodayDate ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <span>{dayName}</span>
                  <span className="text-[10px] font-mono opacity-60">{format(dayDate, 'd')}</span>
                </div>

                {/* 14 Hour Blocks */}
                {HOURS.map((h, hIdx) => {
                  const cell = matrix[dayIdx][hIdx]
                  const bg = getCellBackground(cell.minutes)
                  const fg = getCellTextColor(cell.minutes)

                  return (
                    <div
                      key={h}
                      onMouseEnter={() =>
                        setHoveredCell({
                          dayName,
                          dateStr: format(dayDate, 'EEEE, MMM d'),
                          hourStr: `${h}:00 - ${h + 1}:00`,
                          minutes: cell.minutes,
                          eventTitles: cell.events
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className="h-8 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]/50 transition-transform duration-100 hover:scale-105 hover:z-10 cursor-pointer flex items-center justify-center relative group"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      {cell.minutes > 0 && (
                        <span className="text-[9px] font-mono font-bold opacity-90 select-none">
                          {cell.minutes >= 60 ? '1h' : `${cell.minutes}m`}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip & Live Hover Detail */}
      <div className="min-h-[44px] p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
        {hoveredCell ? (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-primary)]">
              {hoveredCell.dateStr} • {hoveredCell.hourStr}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              {hoveredCell.minutes > 0 ? `${hoveredCell.minutes} min booked` : 'Available / Free'}
            </span>
            {hoveredCell.eventTitles.length > 0 && (
              <span className="text-[var(--text-muted)] truncate max-w-sm">
                ({hoveredCell.eventTitles.join(', ')})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px]">
            <Info className="w-3.5 h-3.5 opacity-70" />
            <span>Hover over any hour block above to see scheduled events and exact booked time.</span>
          </div>
        )}
      </div>
    </div>
  )
}
