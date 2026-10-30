import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Attendee, RsvpStatus } from '../../../../types'
import {
  Calendar,
  CheckCircle2,
  Download,
  Search,
  Save
} from 'lucide-react'
import { format } from 'date-fns'

export type PresenceStatus = 'present' | 'late' | 'absent' | 'excused'

interface PresenceRecord {
  attendeeId: string
  name: string
  email: string
  status: PresenceStatus
  notes: string
  lateMinutes?: number
}

export const AttendanceTracker: React.FC = () => {
  const { events, resources, updateEvent } = useAppStore()

  // Select an event to track attendance for
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Eligible events (meetings, sessions, training)
  const eligibleEvents = useMemo(() => {
    return [...events]
      .filter((e) => e.status !== 'cancelled')
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  }, [events])

  // Set default selected event
  React.useEffect(() => {
    if (eligibleEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(eligibleEvents[0].id)
    }
  }, [eligibleEvents, selectedEventId])

  const currentEvent = useMemo(() => {
    return eligibleEvents.find((e) => e.id === selectedEventId) || null
  }, [eligibleEvents, selectedEventId])

  // Attendance Records state for currently selected event
  const [records, setRecords] = useState<Record<string, PresenceRecord>>({})

  // Initialize records from current event's attendees or default to team personnel
  React.useEffect(() => {
    if (currentEvent) {
      const initial: Record<string, PresenceRecord> = {}

      if (currentEvent.attendees && currentEvent.attendees.length > 0) {
        currentEvent.attendees.forEach((att) => {
          let status: PresenceStatus = 'present'
          if (att.rsvp_status === 'declined') status = 'absent'
          else if (att.rsvp_status === 'tentative') status = 'late'

          initial[att.id] = {
            attendeeId: att.id,
            name: att.name,
            email: att.email,
            status,
            notes: ''
          }
        })
      } else {
        // Populate from team personnel resources if no attendees explicitly linked
        const staff = resources.filter((r) => r.type === 'person')
        staff.forEach((m, idx) => {
          initial[`gen-${m.id}`] = {
            attendeeId: `gen-${m.id}`,
            name: m.name,
            email: `${m.name.toLowerCase().replace(/\s+/g, '.')}@chronodesk.internal`,
            status: idx % 4 === 3 ? 'late' : 'present',
            notes: ''
          }
        })
      }

      setRecords(initial)
    }
  }, [currentEvent, resources])

  const recordList = useMemo(() => {
    return Object.values(records)
      .filter((rec) => {
        const matchesSearch =
          rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || rec.status === filterStatus
        return matchesSearch && matchesFilter
      })
  }, [records, searchQuery, filterStatus])

  // KPI Calculations
  const stats = useMemo(() => {
    const all = Object.values(records)
    const total = all.length
    if (total === 0) return { presentRate: 100, present: 0, late: 0, absent: 0, excused: 0 }

    const present = all.filter((r) => r.status === 'present').length
    const late = all.filter((r) => r.status === 'late').length
    const absent = all.filter((r) => r.status === 'absent').length
    const excused = all.filter((r) => r.status === 'excused').length

    // Late counts as 0.5 attendance
    const presentRate = Math.round(((present + late * 0.75) / total) * 100)

    return { presentRate, present, late, absent, excused }
  }, [records])

  const setAttendeeStatus = (attendeeId: string, status: PresenceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [attendeeId]: {
        ...prev[attendeeId],
        status
      }
    }))
  }

  const setAttendeeNotes = (attendeeId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [attendeeId]: {
        ...prev[attendeeId],
        notes
      }
    }))
  }

  // Save changes to event in SQLite
  const handleSaveAttendance = async () => {
    if (!currentEvent) return

    try {
      // Map records to attendees
      const updatedAttendees: Attendee[] = Object.values(records).map((rec) => {
        let rsvp: RsvpStatus = 'accepted'
        if (rec.status === 'absent') rsvp = 'declined'
        else if (rec.status === 'late' || rec.status === 'excused') rsvp = 'tentative'

        return {
          id: rec.attendeeId,
          event_id: currentEvent.id,
          name: rec.name,
          email: rec.email,
          rsvp_status: rsvp
        }
      })

      await updateEvent({
        ...currentEvent,
        attendees: updatedAttendees,
        updated_at: new Date().toISOString()
      })

      setSaveMessage('Attendance ledger successfully saved to SQLite database!')
      setTimeout(() => setSaveMessage(null), 3500)
    } catch (err) {
      console.error('Error saving attendance:', err)
      setSaveMessage('Failed to save attendance.')
    }
  }

  // Export attendance ledger to CSV
  const handleExportCsv = () => {
    if (!currentEvent) return
    const rows = [
      ['Event Title', currentEvent.title],
      ['Date', format(new Date(currentEvent.start), 'yyyy-MM-dd HH:mm')],
      ['Total Attendees', String(Object.keys(records).length)],
      ['Attendance Rate', `${stats.presentRate}%`],
      [],
      ['Name', 'Email', 'Presence Status', 'Notes']
    ]

    Object.values(records).forEach((r) => {
      rows.push([r.name, r.email, r.status.toUpperCase(), r.notes])
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_${currentEvent.title.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Event Selector & Actions */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1 flex-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Select Event / Session for Attendance Roll:</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full max-w-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-semibold"
          >
            {eligibleEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({format(new Date(evt.start), 'MMM d • HH:mm')})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAttendance}
            className="px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Ledger</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Presence Rate */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
            Presence Rate
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
            {stats.presentRate}%
          </div>
        </div>

        {/* Present Count */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">
            {stats.present}
          </div>
        </div>

        {/* Late Count */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Late</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
            {stats.late}
          </div>
        </div>

        {/* Absent Count */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Absent</span>
          </div>
          <div className="text-xl font-bold font-mono text-red-400 mt-0.5">
            {stats.absent}
          </div>
        </div>

        {/* Excused Count */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[10px] font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Excused</span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">
            {stats.excused}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search attendee by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] pl-8 pr-3 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-[var(--text-muted)] text-[11px] font-medium mr-1">Filter:</span>
          {['all', 'present', 'late', 'absent', 'excused'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-[var(--radius-sm)] capitalize text-[11px] font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Attendee Name</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Attendance Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {recordList.length > 0 ? (
                recordList.map((rec) => {
                  return (
                    <tr key={rec.attendeeId} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {rec.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {rec.email}
                        </div>
                      </td>

                      {/* Presence Status Toggle Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAttendeeStatus(rec.attendeeId, 'present')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                              rec.status === 'present'
                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-xs'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-emerald-400'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendeeStatus(rec.attendeeId, 'late')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                              rec.status === 'late'
                                ? 'bg-amber-500 text-black border-amber-500 shadow-xs'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-amber-400'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendeeStatus(rec.attendeeId, 'absent')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                              rec.status === 'absent'
                                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-red-400'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendeeStatus(rec.attendeeId, 'excused')}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                              rec.status === 'excused'
                                ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-blue-400'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Notes input */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Add attendance note (e.g. excused by manager)..."
                          value={rec.notes}
                          onChange={(e) => setAttendeeNotes(rec.attendeeId, e.target.value)}
                          className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No attendees found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
