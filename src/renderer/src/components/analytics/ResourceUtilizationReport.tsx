import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ResourceType } from '../../../../types'
import { startOfWeek, addDays } from 'date-fns'
import { Layers, DoorClosed, Users, Wrench, Search, Plus } from 'lucide-react'

export const ResourceUtilizationReport: React.FC = () => {
  const { resources, events, activeTimetableSlots, selectedDate, setCurrentView } = useAppStore()
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Calculate real utilization per resource
  const report = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 7)

    // Filter events for the week
    const weekEvents = events.filter((e) => {
      const s = new Date(e.start)
      return s >= weekStart && s < weekEnd
    })

    return resources.map((res) => {
      let bookedMinutes = 0
      let bookingsCount = 0

      // 1. From Calendar Events
      weekEvents.forEach((ev) => {
        const hasRes = ev.resources?.some((r) => r.id === res.id)
        if (hasRes) {
          const s = new Date(ev.start).getTime()
          const e = new Date(ev.end).getTime()
          const dur = Math.max(0, (e - s) / 60000)
          bookedMinutes += dur
          bookingsCount++
        }
      })

      // 2. From Active Timetable Slots (recurring weekly sessions)
      activeTimetableSlots.forEach((slot) => {
        if (slot.resource_id === res.id) {
          const [sH, sM] = slot.start.split(':').map(Number)
          const [eH, eM] = slot.end.split(':').map(Number)
          const dur = Math.max(0, (eH * 60 + eM) - (sH * 60 + sM))
          bookedMinutes += dur
          bookingsCount++
        }
      })

      // Standard 40h weekly capacity
      const capacityMinutes = 40 * 60
      const utilizationRate = Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100))

      let status: 'overutilized' | 'optimal' | 'underutilized' | 'idle' = 'idle'
      if (utilizationRate > 75) status = 'overutilized'
      else if (utilizationRate >= 35) status = 'optimal'
      else if (utilizationRate > 0) status = 'underutilized'

      return {
        resource: res,
        bookedHours: Math.round((bookedMinutes / 60) * 10) / 10,
        bookingsCount,
        utilizationRate,
        status
      }
    })
  }, [resources, events, activeTimetableSlots, selectedDate])

  const filteredReport = useMemo(() => {
    return report.filter((item) => {
      if (filterType !== 'all' && item.resource.type !== filterType) return false
      if (searchQuery.trim() && !item.resource.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
  }, [report, filterType, searchQuery])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overutilized':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
            Overbooked (&gt;75%)
          </span>
        )
      case 'optimal':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            Optimal (35-75%)
          </span>
        )
      case 'underutilized':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
            Low (1-34%)
          </span>
        )
      default:
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
            Idle (0%)
          </span>
        )
    }
  }

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'room':
        return <DoorClosed className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      case 'person':
        return <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      case 'equipment':
        return <Wrench className="w-3.5 h-3.5 text-[var(--text-muted)]" />
    }
  }

  return (
    <div className="card p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Resource & Room Utilization Report
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Monitors load, capacity thresholds, and idle availability across all registered facilities and personnel.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-0.5 text-xs">
            {['all', 'room', 'person', 'equipment'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-[var(--radius-sm)] capitalize transition-all ${
                  filterType === t
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t === 'all' ? 'All Resources' : `${t}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter resources by name..."
          className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
        />
      </div>

      {/* Utilization Table / List */}
      {resources.length === 0 ? (
        <div className="p-8 text-center space-y-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <DoorClosed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">No Resources Created</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Create rooms, instructors, or equipment to track live utilization rates and avoid booking bottlenecks.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('resources')}
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Resources & Rooms</span>
          </button>
        </div>
      ) : filteredReport.length === 0 ? (
        <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          No resources matching your search or category filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReport.map((item) => (
            <div
              key={item.resource.id}
              className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    {getTypeIcon(item.resource.type)}
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {item.resource.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono ml-2">
                      Cap: {item.resource.capacity || 1} • {item.bookingsCount} booking(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {item.bookedHours}h / 40h
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.utilizationRate}%`,
                      backgroundColor:
                        item.status === 'overutilized'
                          ? 'oklch(0.65 0.22 25)'
                          : item.status === 'optimal'
                          ? 'oklch(0.72 0.18 145)'
                          : 'var(--accent)'
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Utilization: {item.utilizationRate}%</span>
                  <span>{Math.max(0, 40 - item.bookedHours)}h capacity left</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
