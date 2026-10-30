import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { startOfWeek, addDays } from 'date-fns'
import { AlertOctagon, UserCheck, UserX, Plus, UserPlus } from 'lucide-react'

export const TeamBottleneckDetector: React.FC = () => {
  const { resources, events, activeTimetableSlots, selectedDate, setCurrentView } = useAppStore()

  const staffMembers = useMemo(() => {
    return resources.filter((r) => r.type === 'person')
  }, [resources])

  const analysis = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 7)

    const weekEvents = events.filter((e) => {
      const s = new Date(e.start)
      return s >= weekStart && s < weekEnd
    })

    const data = staffMembers.map((person) => {
      let bookedMinutes = 0
      let sessionCount = 0

      // Sum from events
      weekEvents.forEach((ev) => {
        if (ev.resources?.some((r) => r.id === person.id)) {
          const s = new Date(ev.start).getTime()
          const e = new Date(ev.end).getTime()
          bookedMinutes += Math.max(0, (e - s) / 60000)
          sessionCount++
        }
      })

      // Sum from timetable recurring slots
      activeTimetableSlots.forEach((slot) => {
        if (slot.resource_id === person.id) {
          const [sH, sM] = slot.start.split(':').map(Number)
          const [eH, eM] = slot.end.split(':').map(Number)
          bookedMinutes += Math.max(0, (eH * 60 + eM) - (sH * 60 + sM))
          sessionCount++
        }
      })

      const capacityMinutes = 40 * 60
      const saturationPct = Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100))

      return {
        person,
        bookedHours: Math.round((bookedMinutes / 60) * 10) / 10,
        sessionCount,
        saturationPct
      }
    })

    // Sort by most saturated first
    data.sort((a, b) => b.saturationPct - a.saturationPct)

    const bottleneck = data.length > 0 && data[0].saturationPct >= 60 ? data[0] : null
    const mostAvailable = data.length > 0 && data[data.length - 1].saturationPct < 40 ? data[data.length - 1] : null

    return {
      members: data,
      bottleneck,
      mostAvailable
    }
  }, [staffMembers, events, activeTimetableSlots, selectedDate])

  return (
    <div className="card p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <AlertOctagon className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Team Bottleneck & Workload Distribution
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Pinpoints overcommitted staff members and reveals underutilized team bandwidth.
            </p>
          </div>
        </div>

        {staffMembers.length > 0 && (
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {staffMembers.length} team member(s) tracked
          </span>
        )}
      </div>

      {/* Empty State */}
      {staffMembers.length === 0 ? (
        <div className="p-8 text-center space-y-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">No Team Staff Registered</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Add trainers, consultants, or employees in Resources to detect workload bottlenecks and prevent team burnout.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('resources')}
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team Member in Resources</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Key Insight Spotlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bottleneck Spotlight */}
            <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-red-400" />
                  Primary Bottleneck
                </span>
                {analysis.bottleneck && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {analysis.bottleneck.saturationPct}% Booked
                  </span>
                )}
              </div>
              {analysis.bottleneck ? (
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {analysis.bottleneck.person.name}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {analysis.bottleneck.bookedHours} hours booked across {analysis.bottleneck.sessionCount} sessions.
                    High risk of schedule delay or burnout.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-semibold text-emerald-400">No Overload Detected</div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    All staff members are currently operating under the 60% saturation threshold.
                  </p>
                </div>
              )}
            </div>

            {/* Bandwidth Available Spotlight */}
            <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Available Bandwidth
                </span>
                {analysis.mostAvailable && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {100 - analysis.mostAvailable.saturationPct}% Free
                  </span>
                )}
              </div>
              {analysis.mostAvailable ? (
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {analysis.mostAvailable.person.name}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Only {analysis.mostAvailable.bookedHours} hours booked ({analysis.mostAvailable.sessionCount} sessions).
                    Ideal candidate to take on overflow sessions.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Evenly Distributed</div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Workload is evenly balanced across the team.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Member Workload Bars */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              All Team Members Saturation
            </span>
            <div className="space-y-2">
              {analysis.members.map((item) => (
                <div
                  key={item.person.id}
                  className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">{item.person.name}</span>
                    <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {item.bookedHours}h / 40h ({item.saturationPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.saturationPct}%`,
                        backgroundColor:
                          item.saturationPct > 70
                            ? 'oklch(0.65 0.22 25)'
                            : item.saturationPct > 40
                            ? 'oklch(0.82 0.18 80)'
                            : 'oklch(0.72 0.18 145)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
