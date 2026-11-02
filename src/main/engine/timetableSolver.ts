import type { TimetableSlot, SolverSubjectRequirement, SolverOptions, SolverResult } from '../../types'
import { randomUUID } from 'crypto'

export type { SolverSubjectRequirement, SolverOptions, SolverResult }

/**
 * Constraint-Satisfaction Backtracking Solver for Timetable Generation
 * Ensures:
 * 1. No trainer/resource double-booked at the same day & time
 * 2. No room double-booked at the same day & time
 * 3. Max sessions per day constraint respected per subject/trainer
 * 4. Respects trainer working days/hours if availability_json exists
 */
export function solveTimetable(options: SolverOptions): SolverResult {
  const {
    timetable_id,
    days,
    time_slots,
    requirements,
    resources,
    subjects,
    max_sessions_per_day = 2
  } = options

  // Build pool of session tasks to schedule
  interface SessionTask {
    id: string
    subject_id: string
    resource_id?: string
    room?: string
  }

  const tasks: SessionTask[] = []
  requirements.forEach((req, reqIdx) => {
    for (let i = 0; i < req.required_sessions; i++) {
      tasks.push({
        id: `task-${reqIdx}-${i}`,
        subject_id: req.subject_id,
        resource_id: req.resource_id,
        room: req.room
      })
    }
  })

  // Sort tasks by most constrained first (Degree heuristic)
  tasks.sort((a, b) => {
    const aConstrained = (a.resource_id ? 1 : 0) + (a.room ? 1 : 0)
    const bConstrained = (b.resource_id ? 1 : 0) + (b.room ? 1 : 0)
    return bConstrained - aConstrained
  })

  // Grid occupancy matrices
  // key: `${day}-${timeStart}` -> Set of occupied resource_ids & rooms
  const resourceOccupied = new Map<string, Set<string>>()
  const roomOccupied = new Map<string, Set<string>>()
  const subjectDayCount = new Map<string, number>() // key: `${subject_id}-${day}`

  // Helper: check availability
  const isAvailable = (
    day: number,
    slot: { start: string; end: string },
    task: SessionTask
  ): boolean => {
    const timeKey = `${day}-${slot.start}`

    // 1. Check max sessions per day for this subject
    const subjKey = `${task.subject_id}-${day}`
    const currentCount = subjectDayCount.get(subjKey) || 0
    if (currentCount >= max_sessions_per_day) {
      return false
    }

    // 2. Check resource conflict & availability
    if (task.resource_id) {
      const occupiedRes = resourceOccupied.get(timeKey)
      if (occupiedRes && occupiedRes.has(task.resource_id)) {
        return false
      }

      // Check resource working hours/days
      const res = resources.find((r) => r.id === task.resource_id)
      if (res?.availability_json) {
        try {
          const avail = JSON.parse(res.availability_json)
          if (avail.workingDays && !avail.workingDays.includes(day)) {
            return false
          }
          if (avail.workingHours) {
            if (slot.start < avail.workingHours.start || slot.end > avail.workingHours.end) {
              return false
            }
          }
        } catch {}
      }
    }

    // 3. Check room conflict
    if (task.room) {
      const occupiedRooms = roomOccupied.get(timeKey)
      if (occupiedRooms && occupiedRooms.has(task.room.toLowerCase())) {
        return false
      }
    }

    return true
  }

  // Pre-generate available slot candidates (day x time)
  const allSlotCandidates: Array<{ day: number; start: string; end: string }> = []
  for (const day of days) {
    for (const ts of time_slots) {
      allSlotCandidates.push({ day, start: ts.start, end: ts.end })
    }
  }

  const scheduledSlots: TimetableSlot[] = []

  // Backtracking solver
  function backtrack(taskIndex: number): boolean {
    if (taskIndex >= tasks.length) {
      return true // All scheduled successfully
    }

    const task = tasks[taskIndex]

    for (const candidate of allSlotCandidates) {
      if (isAvailable(candidate.day, candidate, task)) {
        // Place task in candidate slot
        const timeKey = `${candidate.day}-${candidate.start}`
        const subjKey = `${task.subject_id}-${candidate.day}`

        // Record occupancy
        if (task.resource_id) {
          if (!resourceOccupied.has(timeKey)) resourceOccupied.set(timeKey, new Set())
          resourceOccupied.get(timeKey)!.add(task.resource_id)
        }
        if (task.room) {
          if (!roomOccupied.has(timeKey)) roomOccupied.set(timeKey, new Set())
          roomOccupied.get(timeKey)!.add(task.room.toLowerCase())
        }
        subjectDayCount.set(subjKey, (subjectDayCount.get(subjKey) || 0) + 1)

        const assignedSlot: TimetableSlot = {
          id: `slot-auto-${Date.now()}-${randomUUID().slice(0, 8)}`,
          timetable_id,
          subject_id: task.subject_id,
          resource_id: task.resource_id,
          day: candidate.day,
          start: candidate.start,
          end: candidate.end,
          room: task.room,
          week_pattern: 'all',
          subject: subjects.find((s) => s.id === task.subject_id),
          resource: resources.find((r) => r.id === task.resource_id)
        }
        scheduledSlots.push(assignedSlot)

        // Recurse
        if (backtrack(taskIndex + 1)) {
          return true
        }

        // Unwind (backtrack)
        scheduledSlots.pop()
        if (task.resource_id) {
          resourceOccupied.get(timeKey)?.delete(task.resource_id)
        }
        if (task.room) {
          roomOccupied.get(timeKey)?.delete(task.room.toLowerCase())
        }
        subjectDayCount.set(subjKey, (subjectDayCount.get(subjKey) || 1) - 1)
      }
    }

    return false
  }

  const success = backtrack(0)

  return {
    success,
    slots: scheduledSlots,
    unscheduledCount: tasks.length - scheduledSlots.length,
    message: success
      ? `Successfully scheduled all ${tasks.length} sessions without any conflicts.`
      : `Partially scheduled ${scheduledSlots.length} of ${tasks.length} sessions. Could not fit remaining sessions without violating constraints.`
  }
}
