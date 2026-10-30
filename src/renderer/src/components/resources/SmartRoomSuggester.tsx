import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Resource } from '../../../../types'
import {
  DoorClosed,
  Users,
  Tv,
  Video,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react'

interface AmenityOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const AMENITY_OPTIONS: AmenityOption[] = [
  { id: 'video', label: 'Video Conferencing (Zoom/Teams)', icon: Video },
  { id: 'display', label: '4K Display / Projector', icon: Tv },
  { id: 'whiteboard', label: 'Whiteboard', icon: CheckCircle2 },
  { id: 'audio', label: 'Conference Microphone Rig', icon: ShieldCheck }
]

export const SmartRoomSuggester: React.FC = () => {
  const { resources, events, activeTimetableSlots, setSelectedEvent, setIsEventModalOpen, calendars } = useAppStore()

  // Criteria Inputs
  const [attendeeCount, setAttendeeCount] = useState<number>(6)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [startTime, setStartTime] = useState<string>('14:00')
  const [durationMins, setDurationMins] = useState<number>(60)
  const [requiredAmenities, setRequiredAmenities] = useState<string[]>(['video'])
  const [searchFilter, setSearchFilter] = useState<string>('')

  // Filter rooms from resources
  const rooms = useMemo(() => {
    return resources.filter((r) => r.type === 'room')
  }, [resources])

  const toggleAmenity = (id: string) => {
    setRequiredAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  // Calculate target Start and End Date
  const targetTimeInterval = useMemo(() => {
    const [h, m] = startTime.split(':').map(Number)
    const start = new Date(`${selectedDate}T00:00:00`)
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + durationMins * 60 * 1000)
    return { start, end }
  }, [selectedDate, startTime, durationMins])

  // Evaluate and rank each room
  const rankedRooms = useMemo(() => {
    const { start: targetStart, end: targetEnd } = targetTimeInterval

    return rooms
      .map((room) => {
        // 1. Conflict Check: is room occupied during target time?
        let isOccupied = false
        let occupyingEventTitle: string | null = null

        events.forEach((evt) => {
          try {
            const eStart = new Date(evt.start)
            const eEnd = new Date(evt.end)

            // Overlap condition
            if (eStart < targetEnd && eEnd > targetStart) {
              const isRoomBooked =
                evt.location?.toLowerCase().includes(room.name.toLowerCase()) ||
                evt.resources?.some((r) => r.id === room.id)
              if (isRoomBooked) {
                isOccupied = true
                occupyingEventTitle = evt.title
              }
            }
          } catch {}
        })

        // Check timetable slots
        const targetDay = new Date(selectedDate).getDay() === 0 ? 7 : new Date(selectedDate).getDay()
        const [targetSH, targetSM] = startTime.split(':').map(Number)
        const targetStartDec = targetSH + targetSM / 60
        const targetEndDec = targetStartDec + durationMins / 60

        activeTimetableSlots.forEach((slot) => {
          if (slot.day === targetDay && (slot.room?.toLowerCase() === room.name.toLowerCase() || slot.resource_id === room.id)) {
            try {
              const [sH, sM] = slot.start.split(':').map(Number)
              const [eH, eM] = slot.end.split(':').map(Number)
              const slotSDec = sH + sM / 60
              const slotEDec = eH + eM / 60

              if (slotSDec < targetEndDec && slotEDec > targetStartDec) {
                isOccupied = true
                occupyingEventTitle = slot.subject?.name || 'Class Session'
              }
            } catch {}
          }
        })

        // 2. Capacity Score
        let capacityScore = 0
        let capacityStatus: 'undersized' | 'perfect' | 'roomy' | 'oversized' = 'perfect'

        if (room.capacity < attendeeCount) {
          capacityScore = 10 // Too small
          capacityStatus = 'undersized'
        } else if (room.capacity === attendeeCount || room.capacity <= attendeeCount + 2) {
          capacityScore = 100 // Ideal sizing
          capacityStatus = 'perfect'
        } else if (room.capacity <= attendeeCount * 2) {
          capacityScore = 80 // Comfortably roomy
          capacityStatus = 'roomy'
        } else {
          capacityScore = 50 // Severely oversized (waste of facility)
          capacityStatus = 'oversized'
        }

        // 3. Amenity Score
        const roomNameLower = room.name.toLowerCase()
        let amenityMatchCount = 0
        requiredAmenities.forEach((req) => {
          if (
            roomNameLower.includes(req) ||
            roomNameLower.includes('studio') ||
            roomNameLower.includes('boardroom') ||
            roomNameLower.includes('av') ||
            room.capacity >= 10
          ) {
            amenityMatchCount++
          }
        })

        const amenityScore =
          requiredAmenities.length > 0
            ? Math.round((amenityMatchCount / requiredAmenities.length) * 100)
            : 100

        // 4. Composite Fit Score
        const overallScore = isOccupied
          ? 0
          : Math.round(capacityScore * 0.6 + amenityScore * 0.4)

        return {
          room,
          isOccupied,
          occupyingEventTitle,
          capacityScore,
          capacityStatus,
          amenityScore,
          overallScore
        }
      })
      .filter((r) =>
        searchFilter ? r.room.name.toLowerCase().includes(searchFilter.toLowerCase()) : true
      )
      .sort((a, b) => b.overallScore - a.overallScore)
  }, [rooms, events, activeTimetableSlots, attendeeCount, targetTimeInterval, requiredAmenities, searchFilter, selectedDate, startTime, durationMins])

  const handleBookRoom = (room: Resource) => {
    const { start, end } = targetTimeInterval

    setSelectedEvent({
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: `Meeting in ${room.name}`,
      location: room.name,
      start: start.toISOString(),
      end: end.toISOString(),
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'medium',
      status: 'confirmed',
      resources: [room],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    setIsEventModalOpen(true)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search & Criteria Formulation Bar */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)]">
              <DoorClosed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Smart Room Suggester
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Algorithmic room allocation based on capacity efficiency, AV amenities, and occupancy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter room name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>
        </div>

        {/* Input Parameters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Attendees Count */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Attendees Count</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="200"
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-semibold"
              />
              <span className="text-xs text-[var(--text-muted)] font-mono shrink-0">people</span>
            </div>
          </div>

          {/* 2. Target Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Session Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>

          {/* 3. Start Time */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Start Time</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>

          {/* 4. Duration */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Meeting Duration
            </label>
            <select
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour (60m)</option>
              <option value="90">1.5 hours (90m)</option>
              <option value="120">2 hours (120m)</option>
              <option value="180">3 hours (180m)</option>
            </select>
          </div>
        </div>

        {/* Amenity Filter Buttons */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
            Required Facilities & Equipment:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {AMENITY_OPTIONS.map((amenity) => {
              const isChecked = requiredAmenities.includes(amenity.id)
              const Icon = amenity.icon

              return (
                <button
                  key={amenity.id}
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    isChecked
                      ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] shadow-xs'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{amenity.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ranked Room Cards List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
          <span>RECOMMENDED ROOMS ({rankedRooms.length})</span>
          <span>FIT SCORE & OCCUPANCY</span>
        </div>

        {rankedRooms.length > 0 ? (
          <div className="space-y-2.5">
            {rankedRooms.map((item, index) => {
              const isTopPick = index === 0 && item.overallScore >= 70

              return (
                <div
                  key={item.room.id}
                  className={`p-4 rounded-[var(--radius-md)] border transition-all ${
                    isTopPick
                      ? 'bg-[var(--bg-elevated)] border-[var(--accent)] ring-1 ring-[var(--accent)]/30 shadow-sm'
                      : item.isOccupied
                      ? 'bg-[var(--bg-subtle)]/40 border-[var(--border-subtle)] opacity-75'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Room Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${
                          isTopPick
                            ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <DoorClosed className="w-5 h-5 stroke-[1.8]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {item.room.name}
                          </span>
                          {isTopPick && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-[var(--accent)] text-[var(--accent-text)] flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-3 h-3" />
                              <span>Best Match</span>
                            </span>
                          )}
                        </div>

                        {/* Room Specifications */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)] font-mono">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Max {item.room.capacity} seats</span>
                          </span>
                          <span>•</span>
                          <span>
                            {item.capacityStatus === 'undersized' && (
                              <span className="text-red-400">Needs {attendeeCount - item.room.capacity} more seats</span>
                            )}
                            {item.capacityStatus === 'perfect' && (
                              <span className="text-emerald-500 font-semibold">Perfect Capacity Fit</span>
                            )}
                            {item.capacityStatus === 'roomy' && (
                              <span className="text-amber-500">Comfortable Space</span>
                            )}
                            {item.capacityStatus === 'oversized' && (
                              <span className="text-[var(--text-muted)]">Oversized for {attendeeCount}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Scores & Booking Button */}
                    <div className="flex items-center gap-4">
                      {/* Status & Fit percentage */}
                      <div className="text-right">
                        {item.isOccupied ? (
                          <div className="text-red-400 text-xs font-semibold flex items-center gap-1 justify-end">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Occupied</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs text-[var(--text-muted)] font-mono">Score:</span>
                            <span className="text-sm font-bold font-mono text-[var(--accent)]">
                              {item.overallScore}%
                            </span>
                          </div>
                        )}

                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {item.isOccupied
                            ? `Conflict: ${item.occupyingEventTitle || 'Booked'}`
                            : `${item.amenityScore}% amenities match`}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleBookRoom(item.room)}
                        disabled={item.isOccupied}
                        className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          item.isOccupied
                            ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
                            : 'bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 shadow-xs'
                        }`}
                      >
                        <span>Book Room</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            No rooms registered in directory matching criteria. Add rooms in the Directory tab.
          </div>
        )}
      </div>
    </div>
  )
}
