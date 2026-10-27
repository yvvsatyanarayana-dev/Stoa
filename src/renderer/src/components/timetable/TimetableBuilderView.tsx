import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { TimetableSlot } from '../../../../types'
import {
  Plus,
  AlertTriangle,
  Download,
  Printer,
  Trash2,
  TableProperties,
  BookOpen
} from 'lucide-react'

export const TimetableBuilderView: React.FC = () => {
  const {
    timetables,
    activeTimetableId,
    selectTimetable,
    deleteTimetable,
    activeTimetableSlots,
    subjects,
    resources,
    setSelectedSlot,
    setIsSlotModalOpen,
    setIsTimetableModalOpen,
    setIsSubjectModalOpen,
    deleteSubject
  } = useAppStore()

  const [selectedWeekPattern, setSelectedWeekPattern] = useState<'all' | 'A' | 'B'>('all')

  const activeTimetable = timetables.find((t) => t.id === activeTimetableId)
  const days = [
    { num: 1, name: 'Monday' },
    { num: 2, name: 'Tuesday' },
    { num: 3, name: 'Wednesday' },
    { num: 4, name: 'Thursday' },
    { num: 5, name: 'Friday' }
  ]

  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ]

  // Detect internal conflicts across slots in active timetable
  const detectedConflicts: Array<{ message: string; slotId: string }> = []
  activeTimetableSlots.forEach((slotA, i) => {
    activeTimetableSlots.slice(i + 1).forEach((slotB) => {
      if (slotA.day === slotB.day) {
        const overlap = slotA.start < slotB.end && slotA.end > slotB.start
        if (overlap) {
          if (slotA.resource_id && slotA.resource_id === slotB.resource_id) {
            const res = resources.find((r) => r.id === slotA.resource_id)
            detectedConflicts.push({
              message: `Trainer/Person "${res?.name || 'Resource'}" is double-booked on Day ${slotA.day} at ${slotA.start}-${slotA.end}`,
              slotId: slotA.id
            })
          }
          if (slotA.room && slotB.room && slotA.room.toLowerCase() === slotB.room.toLowerCase()) {
            detectedConflicts.push({
              message: `Room "${slotA.room}" is double-booked on Day ${slotA.day} at ${slotA.start}-${slotA.end}`,
              slotId: slotA.id
            })
          }
        }
      }
    })
  })

  const handleAddSlot = (day: number, startHour: string): void => {
    const [h] = startHour.split(':').map(Number)
    const endHour = `${String(h + 1).padStart(2, '0')}:00`

    const newSlot: TimetableSlot = {
      id: `slot-${Date.now()}`,
      timetable_id: activeTimetableId || 'tt-default',
      subject_id: subjects[0]?.id || '',
      resource_id: resources[0]?.id,
      day,
      start: startHour,
      end: endHour,
      room: '',
      week_pattern: selectedWeekPattern
    }
    setSelectedSlot(newSlot)
    setIsSlotModalOpen(true)
  }

  const handleEditSlot = (slot: TimetableSlot, e: React.MouseEvent): void => {
    e.stopPropagation()
    setSelectedSlot(slot)
    setIsSlotModalOpen(true)
  }

  const handleExportCsv = (): void => {
    let csv = 'Day,Start,End,Subject,Trainer/Resource,Room,WeekPattern\n'
    const sorted = [...activeTimetableSlots].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
    sorted.forEach((s) => {
      const dayName = days.find((d) => d.num === s.day)?.name || `Day ${s.day}`
      const subName = s.subject?.name || subjects.find((sub) => sub.id === s.subject_id)?.name || ''
      const resName = s.resource?.name || resources.find((r) => r.id === s.resource_id)?.name || ''
      csv += `"${dayName}","${s.start}","${s.end}","${subName}","${resName}","${s.room || ''}","${s.week_pattern || 'all'}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTimetable?.name || 'timetable'}.csv`
    a.click()
  }

  if (timetables.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)] p-6 text-[var(--text-primary)]">
        <div className="max-w-md w-full card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center mx-auto shadow-sm">
            <TableProperties className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">No Timetables Found</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Create your own timetable roster from scratch. You can define weekly session hours, assign personnel, and prevent booking overlaps.
            </p>
          </div>
          <button
            onClick={() => setIsTimetableModalOpen(true)}
            className="btn-primary w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Timetable</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Timetable Sub-header Controls */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Timetable:</span>
            <select
              value={activeTimetableId || ''}
              onChange={(e) => selectTimetable(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            >
              {timetables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsTimetableModalOpen(true)}
            className="p-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-1 transition-colors"
            title="Create Another Timetable"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {activeTimetable && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]">
                {activeTimetable.status}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {activeTimetable.start_date} → {activeTimetable.end_date}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Delete timetable "${activeTimetable.name}" and all its slots?`)) {
                    deleteTimetable(activeTimetable.id)
                  }
                }}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="Delete Timetable"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Week pattern filter */}
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs">
            {(['all', 'A', 'B'] as const).map((pat) => (
              <button
                key={pat}
                onClick={() => setSelectedWeekPattern(pat)}
                className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                  selectedWeekPattern === pat
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {pat === 'all' ? 'All Weeks' : `Week ${pat}`}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => handleAddSlot(1, '09:00')}
            className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Subjects Bar */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Subjects:</span>
          </span>
          {subjects.length === 0 ? (
            <span className="text-[11px] text-[var(--text-muted)] italic">No subjects added yet.</span>
          ) : (
            subjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-[11px] font-semibold"
              >
                <span className="w-2 h-2 rounded-full border border-current" />
                <span>{s.name}</span>
                <button
                  onClick={() => {
                    if (confirm(`Remove subject "${s.name}"?`)) deleteSubject(s.id)
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-1"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <button
          onClick={() => setIsSubjectModalOpen(true)}
          className="text-xs text-[var(--text-primary)] font-semibold hover:underline flex items-center gap-1 shrink-0 ml-2"
        >
          <Plus className="w-3 h-3" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Conflict Alert Banner */}
      {detectedConflicts.length > 0 && (
        <div className="bg-[var(--bg-subtle)] border-b border-[var(--border-strong)] px-4 py-2 flex items-center justify-between text-xs text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--text-primary)]" />
            <span className="font-bold">
              Conflict Detected: {detectedConflicts[0].message}
            </span>
          </div>
          <span className="text-[11px] bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 rounded-[var(--radius-sm)] font-bold">
            {detectedConflicts.length} conflict{detectedConflicts.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Timetable Weekly Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-[70px_repeat(5,1fr)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="p-3 bg-[var(--bg-sidebar)] border-b border-r border-[var(--border-subtle)] text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Time
          </div>
          {days.map((day) => (
            <div
              key={day.num}
              className="p-3 bg-[var(--bg-sidebar)] border-b border-r border-[var(--border-subtle)] last:border-r-0 text-center font-bold text-sm text-[var(--text-primary)]"
            >
              {day.name}
            </div>
          ))}

          {/* Time Slot Rows */}
          {timeSlots.map((time) => {
            return (
              <React.Fragment key={time}>
                {/* Time Label */}
                <div className="p-2 border-b border-r border-[var(--cal-hour-line)] bg-[var(--bg-sidebar)] text-center text-xs font-mono text-[var(--text-muted)] flex items-center justify-center">
                  {time}
                </div>

                {/* Day Cells */}
                {days.map((day) => {
                  const cellSlots = activeTimetableSlots.filter(
                    (s) =>
                      s.day === day.num &&
                      s.start <= time &&
                      s.end > time &&
                      (selectedWeekPattern === 'all' || s.week_pattern === 'all' || s.week_pattern === selectedWeekPattern)
                  )

                  return (
                    <div
                      key={day.num}
                      onClick={() => handleAddSlot(day.num, time)}
                      className="border-b border-r border-[var(--cal-grid-line)] last:border-r-0 p-1.5 min-h-[90px] relative hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    >
                      {cellSlots.map((slot) => {
                        const sub = slot.subject || subjects.find((s) => s.id === slot.subject_id)
                        const res = slot.resource || resources.find((r) => r.id === slot.resource_id)

                        return (
                          <div
                            key={slot.id}
                            onClick={(e) => handleEditSlot(slot, e)}
                            className="event-block rounded-[var(--radius-sm)] p-2 text-xs bg-[var(--event-1-bg)] text-[var(--event-1-text)] shadow-sm flex flex-col justify-between mb-1 transition-all"
                          >
                            <div>
                              <div className="font-bold flex items-center justify-between">
                                <span className="truncate">{sub?.name || 'Session'}</span>
                                {slot.week_pattern && slot.week_pattern !== 'all' && (
                                  <span className="text-[9px] px-1 py-0.2 rounded font-bold border border-current">
                                    Wk {slot.week_pattern}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] opacity-80 font-mono mt-0.5">
                                {slot.start} - {slot.end}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] opacity-90">
                              <span className="truncate max-w-[100px]">{res?.name || 'Unassigned'}</span>
                              {slot.room && (
                                <span className="bg-[var(--bg-elevated)] text-[var(--text-primary)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] font-semibold">
                                  {slot.room}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
