import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Upload,
  RefreshCw
} from 'lucide-react'
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns'

export type ShiftType = 'morning' | 'evening' | 'night' | 'off'

interface ShiftConfig {
  type: ShiftType
  label: string
  shortCode: string
  start: string
  end: string
  hours: number
  badgeClass: string
  icon: React.ComponentType<{ className?: string }>
}

const SHIFT_CONFIGS: Record<ShiftType, ShiftConfig> = {
  morning: {
    type: 'morning',
    label: 'Morning (07:00 – 15:30)',
    shortCode: 'M',
    start: '07:00',
    end: '15:30',
    hours: 8,
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    icon: Sun
  },
  evening: {
    type: 'evening',
    label: 'Evening (15:00 – 23:30)',
    shortCode: 'E',
    start: '15:00',
    end: '23:30',
    hours: 8,
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    icon: Sunset
  },
  night: {
    type: 'night',
    label: 'Night (23:00 – 07:30)',
    shortCode: 'N',
    start: '23:00',
    end: '07:30',
    hours: 8,
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    icon: Moon
  },
  off: {
    type: 'off',
    label: 'Day Off / Rest',
    shortCode: 'OFF',
    start: '',
    end: '',
    hours: 0,
    badgeClass: 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]',
    icon: Coffee
  }
}

export const ShiftRosterBuilder: React.FC = () => {
  const { resources, createEvent, calendars } = useAppStore()

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)

  // Team personnel
  const teamMembers = useMemo(() => {
    return resources.filter((r) => r.type === 'person')
  }, [resources])

  // Roster schedule state: memberId -> dayIndex (0 to 6) -> ShiftType
  const [roster, setRoster] = useState<Record<string, ShiftType[]>>({})

  // Initialize or maintain roster data
  React.useEffect(() => {
    if (teamMembers.length > 0) {
      setRoster((prev) => {
        const next = { ...prev }
        teamMembers.forEach((m, idx) => {
          if (!next[m.id]) {
            // Default rotation template: Mon-Fri Morning, Sat-Sun Off (staggered)
            const defaultWeek: ShiftType[] = ['morning', 'morning', 'morning', 'morning', 'morning', 'off', 'off']
            // Stagger shifts across team
            if (idx % 3 === 1) {
              next[m.id] = ['evening', 'evening', 'evening', 'evening', 'off', 'off', 'evening']
            } else if (idx % 3 === 2) {
              next[m.id] = ['night', 'night', 'night', 'off', 'off', 'night', 'night']
            } else {
              next[m.id] = defaultWeek
            }
          }
        })
        return next
      })
    }
  }, [teamMembers])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  // Toggle or cycle shift in cell
  const handleCycleShift = (memberId: string, dayIndex: number) => {
    setRoster((prev) => {
      const current = prev[memberId]?.[dayIndex] || 'morning'
      const cycle: ShiftType[] = ['morning', 'evening', 'night', 'off']
      const nextShift = cycle[(cycle.indexOf(current) + 1) % cycle.length]
      const memberShifts = [...(prev[memberId] || ['off', 'off', 'off', 'off', 'off', 'off', 'off'])]
      memberShifts[dayIndex] = nextShift
      return { ...prev, [memberId]: memberShifts }
    })
  }

  // Calculate fatigue and hours for a member
  const getMemberWorkload = (memberId: string) => {
    const shifts = roster[memberId] || []
    let totalHours = 0
    let hasFatigueWarning = false
    let warningReason = ''

    shifts.forEach((s) => {
      totalHours += SHIFT_CONFIGS[s].hours
    })

    // Turnaround check: Night shift followed immediately by Morning shift
    for (let i = 0; i < shifts.length - 1; i++) {
      if (shifts[i] === 'night' && shifts[i + 1] === 'morning') {
        hasFatigueWarning = true
        warningReason = 'Short turnaround (<11h rest) between Night & Morning shift'
      }
    }

    if (totalHours > 40) {
      hasFatigueWarning = true
      warningReason = `Overtime threshold exceeded (${totalHours}h / 40h max)`
    }

    return { totalHours, hasFatigueWarning, warningReason }
  }

  // Auto-rotate balanced schedule
  const handleAutoRotate = () => {
    setRoster(() => {
      const next: Record<string, ShiftType[]> = {}
      const shiftPatterns: ShiftType[][] = [
        ['morning', 'morning', 'morning', 'morning', 'morning', 'off', 'off'],
        ['evening', 'evening', 'evening', 'evening', 'off', 'off', 'evening'],
        ['night', 'night', 'night', 'off', 'off', 'night', 'night'],
        ['off', 'morning', 'morning', 'morning', 'evening', 'evening', 'off']
      ]

      teamMembers.forEach((m, idx) => {
        next[m.id] = [...shiftPatterns[idx % shiftPatterns.length]]
      })

      return next
    })
    setPublishMessage('Auto-generated balanced fair rotation pattern across all members!')
  }

  // Publish scheduled shifts directly to live calendar events in SQLite!
  const handlePublishToCalendar = async () => {
    setIsPublishing(true)
    setPublishMessage(null)

    try {
      let createdCount = 0

      for (const member of teamMembers) {
        const shifts = roster[member.id] || []

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const shiftType = shifts[dayIdx]
          if (shiftType === 'off') continue

          const cfg = SHIFT_CONFIGS[shiftType]
          const dayDate = weekDays[dayIdx]

          const [sH, sM] = cfg.start.split(':').map(Number)
          const [eH, eM] = cfg.end.split(':').map(Number)

          const startDate = new Date(dayDate)
          startDate.setHours(sH, sM, 0, 0)

          const endDate = new Date(dayDate)
          if (shiftType === 'night') {
            // End date is next day
            endDate.setDate(endDate.getDate() + 1)
          }
          endDate.setHours(eH, eM, 0, 0)

          await createEvent({
            id: `shift-${member.id}-${format(dayDate, 'yyyyMMdd')}-${Date.now()}`,
            calendar_id: calendars[0]?.id || 'cal-primary',
            title: `Shift: ${cfg.label.split(' ')[0]} • ${member.name}`,
            description: `Scheduled shift assignment via Shift Roster Builder (${cfg.label})`,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            all_day: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            priority: 'medium',
            status: 'confirmed',
            resources: [member],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          createdCount++
        }
      }

      setPublishMessage(`Successfully published ${createdCount} shifts as live events into your calendar!`)
    } catch (err) {
      console.error('Error publishing shifts:', err)
      setPublishMessage('Failed to publish shifts to calendar.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header: Week Selector & Action Buttons */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-0.5">
            <button
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-sm text-[var(--text-primary)] ml-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <span>
              Week of {format(currentWeekStart, 'MMMM d')} – {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoRotate}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto-Rotate Roster</span>
          </button>

          <button
            type="button"
            onClick={handlePublishToCalendar}
            disabled={isPublishing || teamMembers.length === 0}
            className="px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Publish Shifts to Calendar</span>
          </button>
        </div>
      </div>

      {publishMessage && (
        <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{publishMessage}</span>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs flex-wrap gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Shift Legend (Click cells to cycle):
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.values(SHIFT_CONFIGS).map((cfg) => {
            const Icon = cfg.icon
            return (
              <div
                key={cfg.type}
                className={`px-2 py-0.5 rounded-[var(--radius-xs)] border text-[11px] font-medium flex items-center gap-1 ${cfg.badgeClass}`}
              >
                <Icon className="w-3 h-3" />
                <span>{cfg.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive Roster Grid */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Header Row */}
          <div className="grid grid-cols-9 gap-2 pb-2.5 border-b border-[var(--border-subtle)] text-center text-xs font-semibold text-[var(--text-primary)]">
            <div className="col-span-2 text-left">TEAM MEMBER</div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="col-span-1">
                <div className="text-[11px] text-[var(--text-muted)] font-normal">
                  {format(day, 'EEE')}
                </div>
                <div className="font-mono text-xs">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>

          {/* Member Rows */}
          {teamMembers.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {teamMembers.map((member) => {
                const workload = getMemberWorkload(member.id)
                const shifts = roster[member.id] || []

                return (
                  <div key={member.id} className="py-2.5 grid grid-cols-9 gap-2 items-center">
                    {/* Member Info & Hours */}
                    <div className="col-span-2 pr-2">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {member.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            workload.totalHours > 40
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                          }`}
                        >
                          {workload.totalHours} hrs / wk
                        </span>

                        {workload.hasFatigueWarning && (
                          <span
                            title={workload.warningReason}
                            className="text-amber-400 cursor-help"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day Cells (0 to 6) */}
                    {weekDays.map((_, dayIdx) => {
                      const currentShift = shifts[dayIdx] || 'off'
                      const cfg = SHIFT_CONFIGS[currentShift]
                      const Icon = cfg.icon

                      return (
                        <div key={dayIdx} className="col-span-1">
                          <button
                            type="button"
                            onClick={() => handleCycleShift(member.id, dayIdx)}
                            className={`w-full h-11 rounded-[var(--radius-sm)] border flex flex-col items-center justify-center p-1 transition-all hover:scale-[1.03] active:scale-95 shadow-2xs ${cfg.badgeClass}`}
                            title={`Click to cycle shift • Currently: ${cfg.label}`}
                          >
                            <Icon className="w-3.5 h-3.5 mb-0.5" />
                            <span className="text-[10px] font-bold font-mono uppercase tracking-tight">
                              {cfg.shortCode}
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No staff members found in Directory. Add team members to build the shift rotation.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
