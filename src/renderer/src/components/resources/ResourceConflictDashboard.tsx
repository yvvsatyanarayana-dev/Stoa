import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent, Resource } from '../../../../types'
import {
  AlertOctagon,
  CheckCircle2,
  DoorClosed,
  Clock,
  Sparkles,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface DetectedConflict {
  id: string
  type: 'room_double_booking' | 'person_double_booking' | 'equipment_double_booking' | 'overcapacity'
  resource: Resource
  eventA: CalendarEvent
  eventB: CalendarEvent
  overlapStart: Date
  overlapEnd: Date
  severity: 'high' | 'medium'
  description: string
}

export const ResourceConflictDashboard: React.FC = () => {
  const { events, resources, updateEvent } = useAppStore()

  const [isResolving, setIsResolving] = useState<boolean>(false)
  const [resolutionMessage, setResolutionMessage] = useState<string | null>(null)

  // Map of rooms and equipment
  const rooms = useMemo(() => resources.filter((r) => r.type === 'room'), [resources])

  // Continuous audit of all events to find resource collisions
  const detectedConflicts: DetectedConflict[] = useMemo(() => {
    const list: DetectedConflict[] = []
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    for (let i = 0; i < sortedEvents.length; i++) {
      const eA = sortedEvents[i]
      if (eA.status === 'cancelled') continue
      const startA = new Date(eA.start)
      const endA = new Date(eA.end)

      // Check Overcapacity in rooms
      if (eA.resources) {
        eA.resources.forEach((res) => {
          if (res.type === 'room' && eA.attendees && eA.attendees.length > res.capacity) {
            list.push({
              id: `overcap-${eA.id}-${res.id}`,
              type: 'overcapacity',
              resource: res,
              eventA: eA,
              eventB: eA,
              overlapStart: startA,
              overlapEnd: endA,
              severity: 'medium',
              description: `Event has ${eA.attendees.length} attendees exceeding room capacity of ${res.capacity} seats.`
            })
          }
        })
      }

      // Check double-booking with subsequent events
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const eB = sortedEvents[j]
        if (eB.status === 'cancelled') continue
        const startB = new Date(eB.start)
        const endB = new Date(eB.end)

        // If eB starts after eA ends, no more overlaps possible for eA
        if (startB >= endA) break

        // Overlap detected: check shared resources
        const sharedResources: Resource[] = []

        // 1. By location / room name
        if (
          eA.location &&
          eB.location &&
          eA.location.trim().toLowerCase() === eB.location.trim().toLowerCase()
        ) {
          const matchedRoom = rooms.find(
            (r) => r.name.toLowerCase() === eA.location!.trim().toLowerCase()
          )
          if (matchedRoom) sharedResources.push(matchedRoom)
        }

        // 2. By explicitly attached resources
        if (eA.resources && eB.resources) {
          eA.resources.forEach((rA) => {
            if (eB.resources?.some((rB) => rB.id === rA.id)) {
              if (!sharedResources.some((sr) => sr.id === rA.id)) {
                sharedResources.push(rA)
              }
            }
          })
        }

        // 3. By shared personnel / attendees
        if (eA.attendees && eB.attendees) {
          eA.attendees.forEach((attA) => {
            if (eB.attendees?.some((attB) => attB.email === attA.email || attB.name === attA.name)) {
              const matchedPerson = resources.find(
                (r) => r.type === 'person' && (r.name === attA.name || attA.email.includes(r.name.toLowerCase()))
              )
              if (matchedPerson && !sharedResources.some((sr) => sr.id === matchedPerson.id)) {
                sharedResources.push(matchedPerson)
              }
            }
          })
        }

        // Register conflict for each shared resource
        sharedResources.forEach((res) => {
          const overlapStart = new Date(Math.max(startA.getTime(), startB.getTime()))
          const overlapEnd = new Date(Math.min(endA.getTime(), endB.getTime()))

          let type: DetectedConflict['type'] = 'room_double_booking'
          if (res.type === 'person') type = 'person_double_booking'
          else if (res.type === 'equipment') type = 'equipment_double_booking'

          list.push({
            id: `conflict-${eA.id}-${eB.id}-${res.id}`,
            type,
            resource: res,
            eventA: eA,
            eventB: eB,
            overlapStart,
            overlapEnd,
            severity: 'high',
            description: `Double-booking on "${res.name}" during ${format(overlapStart, 'HH:mm')} – ${format(overlapEnd, 'HH:mm')}`
          })
        })
      }
    }

    return list
  }, [events, resources, rooms])

  // Resolution 1: Auto-reassign Event B to an alternative available room
  const handleAutoReassignRoom = async (conflict: DetectedConflict) => {
    setIsResolving(true)
    setResolutionMessage(null)

    try {
      const eB = conflict.eventB
      const startB = new Date(eB.start)
      const endB = new Date(eB.end)

      // Find an available alternative room with adequate capacity
      const requiredCapacity = eB.attendees?.length || conflict.resource.capacity || 4
      const availableRoom = rooms.find((r) => {
        if (r.id === conflict.resource.id) return false
        if (r.capacity < requiredCapacity) return false

        // Check if free during Event B
        const hasCollision = events.some((evt) => {
          if (evt.id === eB.id || evt.status === 'cancelled') return false
          const eS = new Date(evt.start)
          const eE = new Date(evt.end)
          const overlaps = eS < endB && eE > startB
          const inSameRoom =
            evt.location?.toLowerCase() === r.name.toLowerCase() ||
            evt.resources?.some((res) => res.id === r.id)
          return overlaps && inSameRoom
        })

        return !hasCollision
      })

      if (!availableRoom) {
        setResolutionMessage(`No alternative room with ${requiredCapacity} capacity is free during this slot. Consider shifting time instead.`)
        return
      }

      // Reassign Event B to availableRoom
      const updatedResources = (eB.resources || []).filter((r) => r.id !== conflict.resource.id)
      updatedResources.push(availableRoom)

      await updateEvent({
        ...eB,
        location: availableRoom.name,
        resources: updatedResources,
        updated_at: new Date().toISOString()
      })

      setResolutionMessage(`Successfully moved "${eB.title}" to ${availableRoom.name}!`)
    } catch (err) {
      console.error('Error reassigning room:', err)
      setResolutionMessage('Failed to update event room assignment.')
    } finally {
      setIsResolving(false)
    }
  }

  // Resolution 2: Shift Event B to start right after Event A finishes
  const handleShiftEventB = async (conflict: DetectedConflict) => {
    setIsResolving(true)
    setResolutionMessage(null)

    try {
      const eA = conflict.eventA
      const eB = conflict.eventB
      const endA = new Date(eA.end)
      const durationMs = new Date(eB.end).getTime() - new Date(eB.start).getTime()

      const newStartB = new Date(endA.getTime() + 10 * 60 * 1000) // 10 min buffer
      const newEndB = new Date(newStartB.getTime() + durationMs)

      await updateEvent({
        ...eB,
        start: newStartB.toISOString(),
        end: newEndB.toISOString(),
        updated_at: new Date().toISOString()
      })

      setResolutionMessage(`Shifted "${eB.title}" to start at ${format(newStartB, 'HH:mm')} after "${eA.title}" ends!`)
    } catch (err) {
      console.error('Error shifting event:', err)
      setResolutionMessage('Failed to shift event.')
    } finally {
      setIsResolving(false)
    }
  }

  // Resolution 3: Cancel duplicate Event B
  const handleCancelEventB = async (conflict: DetectedConflict) => {
    setIsResolving(true)
    setResolutionMessage(null)

    try {
      await updateEvent({
        ...conflict.eventB,
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      setResolutionMessage(`Cancelled duplicate event "${conflict.eventB.title}".`)
    } catch (err) {
      console.error('Error cancelling event:', err)
      setResolutionMessage('Failed to cancel event.')
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Overview Status Banner */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${
              detectedConflicts.length > 0
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {detectedConflicts.length > 0 ? (
              <AlertOctagon className="w-5 h-5 stroke-[2]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Resource Conflict Dashboard
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold ${
                  detectedConflicts.length > 0
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}
              >
                {detectedConflicts.length} Conflict(s) Active
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Real-time audit across all rooms, staff members, and equipment with 1-click automated resolution.
            </p>
          </div>
        </div>

        {resolutionMessage && (
          <div className="p-2 px-3 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] text-xs font-medium shadow-xs">
            {resolutionMessage}
          </div>
        )}
      </div>

      {/* Conflicts List */}
      <div className="space-y-3">
        {detectedConflicts.length > 0 ? (
          detectedConflicts.map((c) => {
            return (
              <div
                key={c.id}
                className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-red-500/30 shadow-xs space-y-3"
              >
                {/* Conflict Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20">
                      {c.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {c.resource.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      ({c.resource.type})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span>
                      {format(c.overlapStart, 'EEEE, MMM d • HH:mm')} – {format(c.overlapEnd, 'HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Colliding Events Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Event A */}
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                        Event 1 (Initial Booking)
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-[var(--text-secondary)]">
                        {format(new Date(c.eventA.start), 'HH:mm')} – {format(new Date(c.eventA.end), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {c.eventA.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      Location: {c.eventA.location || c.resource.name}
                    </div>
                  </div>

                  {/* Event B */}
                  <div className="p-3 rounded-[var(--radius-sm)] bg-red-500/5 border border-red-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-red-400">
                        Event 2 (Colliding Booking)
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-red-400">
                        {format(new Date(c.eventB.start), 'HH:mm')} – {format(new Date(c.eventB.end), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {c.eventB.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      Location: {c.eventB.location || c.resource.name}
                    </div>
                  </div>
                </div>

                {/* 1-Click Automated Resolution Actions */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Quick Resolutions:</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {c.resource.type === 'room' && (
                      <button
                        type="button"
                        onClick={() => handleAutoReassignRoom(c)}
                        disabled={isResolving}
                        className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1 shadow-xs transition-opacity"
                      >
                        <DoorClosed className="w-3 h-3" />
                        <span>Auto-Reassign Room</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleShiftEventB(c)}
                      disabled={isResolving}
                      className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Shift Event 2 Forward</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancelEventB(c)}
                      disabled={isResolving}
                      className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Cancel Duplicate</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              No Resource Collisions Detected
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              All registered rooms, equipment assets, and personnel schedules are currently 100% conflict-free across the calendar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
