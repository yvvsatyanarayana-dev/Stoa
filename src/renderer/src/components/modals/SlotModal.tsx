import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { TimetableSlot } from '../../../../types'
import { X, Trash2, AlertTriangle, Layers } from 'lucide-react'
import type { ConflictReport } from '../../../../main/engine/conflictEngine'

export const SlotModal: React.FC = () => {
  const {
    isSlotModalOpen,
    setIsSlotModalOpen,
    selectedSlot,
    subjects,
    resources,
    activeTimetableId,
    saveSlot,
    deleteSlot
  } = useAppStore()

  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'sub-1')
  const [resourceId, setResourceId] = useState<string>('')
  const [day, setDay] = useState<number>(1)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [room, setRoom] = useState('Executive Boardroom')
  const [weekPattern, setWeekPattern] = useState<'all' | 'A' | 'B'>('all')
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null)

  useEffect(() => {
    if (selectedSlot) {
      setSubjectId(selectedSlot.subject_id || subjects[0]?.id || '')
      setResourceId(selectedSlot.resource_id || '')
      setDay(selectedSlot.day || 1)
      setStart(selectedSlot.start || '09:00')
      setEnd(selectedSlot.end || '10:00')
      setRoom(selectedSlot.room || '')
      setWeekPattern((selectedSlot.week_pattern as any) || 'all')
    }
  }, [selectedSlot, subjects])

  // Real-time conflict check for timetable slot
  useEffect(() => {
    if (!isSlotModalOpen || !activeTimetableId) {
      setConflictReport(null)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const report = await window.api.timetables.checkConflicts(
          {
            day,
            start,
            end,
            resource_id: resourceId || undefined,
            room: room.trim() || undefined
          },
          activeTimetableId,
          selectedSlot?.id
        )
        setConflictReport(report)
      } catch (err) {
        console.error('Slot conflict check error:', err)
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [day, start, end, resourceId, room, isSlotModalOpen, activeTimetableId, selectedSlot])

  if (!isSlotModalOpen) return null

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    const slotPayload: TimetableSlot = {
      id: selectedSlot?.id || `slot-${Date.now()}`,
      timetable_id: activeTimetableId || 'tt-default',
      subject_id: subjectId,
      resource_id: resourceId || undefined,
      day,
      start,
      end,
      room: room.trim() || undefined,
      week_pattern: weekPattern
    }

    await saveSlot(slotPayload)
    setIsSlotModalOpen(false)
  }

  const handleDelete = async (): Promise<void> => {
    if (!selectedSlot?.id) return
    if (confirm('Delete this timetable session slot?')) {
      await deleteSlot(selectedSlot.id)
      setIsSlotModalOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>{selectedSlot?.id ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</span>
          </h2>
          <button
            onClick={() => setIsSlotModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Subject / Module *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Day of Week</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={7}>Sunday</option>
            </select>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Room & Trainer / Resource */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Room / Venue</label>
              <input
                type="text"
                value={room}
                placeholder="e.g. Boardroom A"
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Trainer / Resource</label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Week Pattern */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Week Rotation Pattern</label>
            <div className="flex gap-2">
              {(['all', 'A', 'B'] as const).map((pat) => (
                <button
                  key={pat}
                  type="button"
                  onClick={() => setWeekPattern(pat)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-semibold border transition-all ${
                    weekPattern === pat
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pat === 'all' ? 'Every Week' : `Week ${pat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Alert Warning */}
          {conflictReport && conflictReport.hasConflict && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Timetable Conflict Detected</span>
              </div>
              {conflictReport.conflicts.map((c, i) => (
                <div key={i} className="text-red-300 text-[11px] pl-6">
                  • {c.message}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {selectedSlot?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Save Slot
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
