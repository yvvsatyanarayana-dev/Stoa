import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react'
import { format, addDays, subDays, isSameDay } from 'date-fns'

const TIMELINE_HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 08:00 to 19:00

export const TeamAvailabilityOverlay: React.FC = () => {
  const { resources, events, activeTimetableSlots, setSelectedEvent, setIsEventModalOpen, calendars } = useAppStore()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Team members (resources of type 'person')
  const teamMembers = useMemo(() => {
    return resources.filter((r) => r.type === 'person')
  }, [resources])

  // Track which team members are selected for overlay
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  // Initialize selected members when resources load
  React.useEffect(() => {
    if (teamMembers.length > 0 && selectedMemberIds.length === 0) {
      setSelectedMemberIds(teamMembers.map((m) => m.id))
    }
  }, [teamMembers])

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedMemberIds(teamMembers.map((m) => m.id))
  }

  const clearAll = () => {
    setSelectedMemberIds([])
  }

  // Get events and timetable slots for a specific member on the selected date
  const getMemberCommitments = (memberId: string, memberName: string) => {
    const commitments: Array<{
      id: string
      title: string
      startHour: number
      endHour: number
      source: 'event' | 'timetable'
      color?: string
    }> = []

    // 1. Calendar Events where attendee matches member name or event_resources contains memberId
    events.forEach((evt) => {
      try {
        const evtStart = new Date(evt.start)
        const evtEnd = new Date(evt.end)

        if (isSameDay(evtStart, selectedDate)) {
          const isAttendee = evt.attendees?.some(
            (a) => a.name.toLowerCase() === memberName.toLowerCase() || a.email.toLowerCase().includes(memberName.toLowerCase())
          )
          const isAssignedResource = evt.resources?.some((r) => r.id === memberId)
          const isInTitle = evt.title.toLowerCase().includes(memberName.toLowerCase())

          if (isAttendee || isAssignedResource || isInTitle) {
            const startHour = evtStart.getHours() + evtStart.getMinutes() / 60
            const endHour = evtEnd.getHours() + evtEnd.getMinutes() / 60
            commitments.push({
              id: evt.id,
              title: evt.title,
              startHour: Math.max(8, startHour),
              endHour: Math.min(20, endHour),
              source: 'event'
            })
          }
        }
      } catch {}
    })

    // 2. Timetable slots for this day of week
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay() // 1 = Mon, 7 = Sun
    activeTimetableSlots.forEach((slot) => {
      if (slot.resource_id === memberId && slot.day === dayOfWeek) {
        try {
          const [sH, sM] = slot.start.split(':').map(Number)
          const [eH, eM] = slot.end.split(':').map(Number)
          commitments.push({
            id: slot.id,
            title: slot.subject?.name || 'Class / Session',
            startHour: Math.max(8, sH + sM / 60),
            endHour: Math.min(20, eH + eM / 60),
            source: 'timetable',
            color: slot.subject?.color
          })
        } catch {}
      }
    })

    return commitments
  }

  // Common free windows calculation
  const commonFreeWindows = useMemo(() => {
    if (selectedMemberIds.length === 0) return []

    // Map 30-minute slots from 8:00 to 18:00 (20 slots)
    const slotCount = 20 // 8:00 to 18:00
    const slotAvailable = new Array(slotCount).fill(true)

    selectedMemberIds.forEach((mId) => {
      const member = teamMembers.find((m) => m.id === mId)
      if (!member) return

      const commitments = getMemberCommitments(mId, member.name)
      commitments.forEach((c) => {
        const startSlotIndex = Math.max(0, Math.floor((c.startHour - 8) * 2))
        const endSlotIndex = Math.min(slotCount, Math.ceil((c.endHour - 8) * 2))
        for (let i = startSlotIndex; i < endSlotIndex; i++) {
          slotAvailable[i] = false
        }
      })
    })

    // Group available slots into continuous windows (at least 30 mins)
    const windows: Array<{ startHour: number; endHour: number; durationMins: number; label: string }> = []
    let currentStart: number | null = null

    for (let i = 0; i < slotCount; i++) {
      if (slotAvailable[i] && currentStart === null) {
        currentStart = 8 + i * 0.5
      } else if (!slotAvailable[i] && currentStart !== null) {
        const endHour = 8 + i * 0.5
        const durationMins = Math.round((endHour - currentStart) * 60)
        if (durationMins >= 30) {
          windows.push({
            startHour: currentStart,
            endHour,
            durationMins,
            label: `${formatHour(currentStart)} – ${formatHour(endHour)} (${durationMins}m)`
          })
        }
        currentStart = null
      }
    }

    if (currentStart !== null) {
      const endHour = 8 + slotCount * 0.5
      const durationMins = Math.round((endHour - currentStart) * 60)
      if (durationMins >= 30) {
        windows.push({
          startHour: currentStart,
          endHour,
          durationMins,
          label: `${formatHour(currentStart)} – ${formatHour(endHour)} (${durationMins}m)`
        })
      }
    }

    return windows
  }, [selectedMemberIds, selectedDate, events, activeTimetableSlots, teamMembers])

  function formatHour(h: number) {
    const hour = Math.floor(h)
    const mins = Math.round((h - hour) * 60)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const displayMins = mins === 0 ? '00' : String(mins).padStart(2, '0')
    return `${displayHour}:${displayMins} ${period}`
  }

  const handleScheduleInFreeWindow = (startHour: number, endHour: number) => {
    const sDate = new Date(selectedDate)
    const sH = Math.floor(startHour)
    const sM = Math.round((startHour - sH) * 60)
    sDate.setHours(sH, sM, 0, 0)

    const eDate = new Date(selectedDate)
    const eH = Math.floor(endHour)
    const eM = Math.round((endHour - eH) * 60)
    eDate.setHours(eH, eM, 0, 0)

    const attendees = selectedMemberIds
      .map((id) => teamMembers.find((m) => m.id === id))
      .filter(Boolean)
      .map((m, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        event_id: `evt-${Date.now()}`,
        name: m!.name,
        email: `${m!.name.toLowerCase().replace(/\s+/g, '.')}@chronodesk.internal`,
        rsvp_status: 'pending' as const
      }))

    setSelectedEvent({
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: 'Team Sync & Alignment',
      start: sDate.toISOString(),
      end: eDate.toISOString(),
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'medium',
      status: 'confirmed',
      attendees,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    setIsEventModalOpen(true)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Controls: Date Picker & Member Filters */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-0.5">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-sm text-[var(--text-primary)] ml-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>

        {/* Member Selector Pill Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)] font-medium">Overlay:</span>
          {teamMembers.length > 0 ? (
            <>
              {teamMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id)
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] shadow-xs'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{member.name}</span>
                  </button>
                )
              })}

              <button
                onClick={selectedMemberIds.length === teamMembers.length ? clearAll : selectAll}
                className="text-[11px] text-[var(--accent)] hover:underline font-medium ml-1"
              >
                {selectedMemberIds.length === teamMembers.length ? 'Clear All' : 'Select All'}
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--text-muted)] italic">
              No team personnel found in Directory
            </span>
          )}
        </div>
      </div>

      {/* Common Free Windows Alert Bar */}
      {commonFreeWindows.length > 0 ? (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-500">
                {commonFreeWindows.length} Common Free Window(s) Found
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                All {selectedMemberIds.length} selected team members are completely available during these slots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {commonFreeWindows.map((win, idx) => (
              <button
                key={idx}
                onClick={() => handleScheduleInFreeWindow(win.startHour, win.endHour)}
                className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 flex items-center gap-1 shadow-xs transition-colors"
                title="Click to schedule meeting in this window"
              >
                <Clock className="w-3 h-3" />
                <span>{win.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center justify-between">
          <span>No common overlapping free windows between all selected team members today.</span>
          <span className="text-[11px] font-mono">Try deselecting members or switching dates</span>
        </div>
      )}

      {/* Synchronized Multi-Member Free/Busy Grid */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3 overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Header Hours Row */}
          <div className="grid grid-cols-12 gap-1 pb-2 border-b border-[var(--border-subtle)] text-center text-[10px] font-mono text-[var(--text-muted)]">
            <div className="col-span-2 text-left font-sans font-semibold text-[11px] text-[var(--text-primary)]">
              TEAM MEMBER
            </div>
            {TIMELINE_HOURS.map((hour) => (
              <div key={hour} className="col-span-1">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </div>
            ))}
          </div>

          {/* Member Rows */}
          {selectedMemberIds.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {selectedMemberIds.map((mId) => {
                const member = teamMembers.find((m) => m.id === mId)
                if (!member) return null
                const commitments = getMemberCommitments(mId, member.name)

                return (
                  <div key={mId} className="py-2.5 flex items-center gap-2 group hover:bg-[var(--bg-subtle)]/50 rounded transition-colors px-1">
                    {/* Member Info */}
                    <div className="w-[16.666%] shrink-0 pr-2">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        {commitments.length} commitment(s)
                      </div>
                    </div>

                    {/* Timeline Canvas (12 hours = 100% width) */}
                    <div className="flex-1 h-8 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] relative overflow-hidden">
                      {/* Grid tick marks */}
                      <div className="absolute inset-0 grid grid-cols-12 pointer-events-none divide-x divide-[var(--border-subtle)]/30">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} />
                        ))}
                      </div>

                      {/* Busy Commitments */}
                      {commitments.map((c) => {
                        const leftPercent = ((c.startHour - 8) / 12) * 100
                        const widthPercent = Math.max(2, ((c.endHour - c.startHour) / 12) * 100)

                        return (
                          <div
                            key={c.id}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`
                            }}
                            className="absolute top-1 bottom-1 rounded-[var(--radius-xs)] bg-[var(--accent)]/85 text-[var(--accent-text)] text-[10px] font-medium px-1.5 flex items-center justify-between shadow-xs truncate cursor-pointer hover:brightness-110 transition-all z-10"
                            title={`${c.title} (${formatHour(c.startHour)} – ${formatHour(c.endHour)})`}
                          >
                            <span className="truncate">{c.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No team members selected. Check members above to visualize availability.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
