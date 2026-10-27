import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { TimetableSlot } from '../../../../types'
import {
  Plus,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react'

export const TimetableBuilderView: React.FC = () => {
  const {
    timetables,
    activeTimetableId,
    selectTimetable,
    activeTimetableSlots,
    subjects,
    resources,
    setSelectedSlot,
    setIsSlotModalOpen
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
        // Time overlap condition
        const overlap = slotA.start < slotB.end && slotA.end > slotB.start
        if (overlap) {
          if (slotA.resource_id && slotA.resource_id === slotB.resource_id) {
            const res = resources.find((r) => r.id === slotA.resource_id)
            detectedConflicts.push({
              message: `Trainer "${res?.name || 'Resource'}" is double-booked on Day ${slotA.day} at ${slotA.start}-${slotA.end}`,
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
    if (activeTimetable?.status === 'locked') {
      alert('This timetable is locked. Unlock it in settings to make modifications.')
      return
    }

    const [h] = startHour.split(':').map(Number)
    const endHour = `${String(h + 1).padStart(2, '0')}:00`

    const newSlot: TimetableSlot = {
      id: `slot-${Date.now()}`,
      timetable_id: activeTimetableId || 'tt-default',
      subject_id: subjects[0]?.id || 'sub-1',
      resource_id: resources.find((r) => r.type === 'person')?.id,
      day,
      start: startHour,
      end: endHour,
      room: 'Executive Boardroom',
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Timetable Sub-header Controls */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Timetable:</span>
            <select
              value={activeTimetableId || ''}
              onChange={(e) => selectTimetable(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {timetables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {activeTimetable && (
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  activeTimetable.status === 'published'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : activeTimetable.status === 'locked'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600'
                }`}
              >
                {activeTimetable.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeTimetable.start_date} → {activeTimetable.end_date}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Week pattern filter */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-md border border-slate-800 text-xs">
            {(['all', 'A', 'B'] as const).map((pat) => (
              <button
                key={pat}
                onClick={() => setSelectedWeekPattern(pat)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  selectedWeekPattern === pat
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pat === 'all' ? 'Every Week' : `Week ${pat}`}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => handleAddSlot(1, '09:00')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Conflict Alert Banner (PRD 3.1) */}
      {detectedConflicts.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-semibold">
              Conflict Detected: {detectedConflicts[0].message}
            </span>
          </div>
          <span className="text-[11px] bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
            {detectedConflicts.length} conflict{detectedConflicts.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Timetable Weekly Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-[70px_repeat(5,1fr)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="p-3 bg-slate-950 border-b border-r border-slate-800 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            Time
          </div>
          {days.map((day) => (
            <div
              key={day.num}
              className="p-3 bg-slate-950 border-b border-r border-slate-800 last:border-r-0 text-center font-bold text-sm text-slate-200"
            >
              {day.name}
            </div>
          ))}

          {/* Time Slot Rows */}
          {timeSlots.map((time) => {
            return (
              <React.Fragment key={time}>
                {/* Time Label */}
                <div className="p-2 border-b border-r border-slate-800 bg-slate-950/40 text-center text-xs font-mono text-slate-400 flex items-center justify-center">
                  {time}
                </div>

                {/* Day Cells */}
                {days.map((day) => {
                  // Find slots matching this day and starting in or covering this hour
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
                      className="border-b border-r border-slate-800 last:border-r-0 p-1.5 min-h-[90px] relative hover:bg-slate-800/30 cursor-pointer transition-colors"
                    >
                      {cellSlots.map((slot) => {
                        const sub = slot.subject || subjects.find((s) => s.id === slot.subject_id)
                        const res = slot.resource || resources.find((r) => r.id === slot.resource_id)

                        return (
                          <div
                            key={slot.id}
                            onClick={(e) => handleEditSlot(slot, e)}
                            className="rounded-lg p-2 text-xs bg-slate-800 hover:bg-slate-750 border-l-4 border border-slate-700 shadow-sm flex flex-col justify-between mb-1 transition-all"
                            style={{ borderLeftColor: sub?.color || '#3b82f6' }}
                          >
                            <div>
                              <div className="font-bold text-slate-100 flex items-center justify-between">
                                <span className="truncate">{sub?.name || 'Class/Session'}</span>
                                {slot.week_pattern && slot.week_pattern !== 'all' && (
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-semibold">
                                    Wk {slot.week_pattern}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {slot.start} - {slot.end}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[100px]">{res?.name || 'Unassigned'}</span>
                              {slot.room && (
                                <span className="bg-slate-900 px-1.5 py-0.5 rounded font-medium text-slate-300">
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
