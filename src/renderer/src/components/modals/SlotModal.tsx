import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { TimetableSlot } from '../../../../types'
import { X, Trash2, AlertTriangle, Layers, Plus } from 'lucide-react'
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
    deleteSlot,
    setIsSubjectModalOpen
  } = useAppStore()

  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [resourceId, setResourceId] = useState<string>('')
  const [day, setDay] = useState<number>(1)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [room, setRoom] = useState('')
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>{selectedSlot?.id ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</span>
          </h2>
          <button
            onClick={() => setIsSlotModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Subject / Module *</label>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(true)}
                className="text-xs font-semibold text-[var(--text-primary)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Subject</span>
              </button>
            </div>
            {subjects.length === 0 ? (
              <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
                <span>No subjects created yet.</span>
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(true)}
                  className="btn-primary text-xs py-1 px-2"
                >
                  + Add Subject
                </button>
              </div>
            ) : (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Day of Week</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
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
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Time</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">End Time</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Room & Trainer / Resource */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Room / Venue</label>
              <input
                type="text"
                value={room}
                placeholder="e.g. Room 101"
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Trainer / Resource</label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
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
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Week Rotation Pattern</label>
            <div className="flex gap-2">
              {(['all', 'A', 'B'] as const).map((pat) => (
                <button
                  key={pat}
                  type="button"
                  onClick={() => setWeekPattern(pat)}
                  className={`flex-1 py-1.5 text-xs rounded-[var(--radius-sm)] font-bold border transition-all ${
                    weekPattern === pat
                      ? 'bg-[var(--accent)] border-[var(--border-strong)] text-[var(--accent-text)]'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {pat === 'all' ? 'All Weeks' : `Week ${pat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Alert Warning */}
          {conflictReport && conflictReport.hasConflict && (
            <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-[var(--radius-md)] text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Timetable Conflict Detected</span>
              </div>
              {conflictReport.conflicts.map((c, i) => (
                <div key={i} className="text-[var(--text-secondary)] text-[11px] pl-6">
                  • {c.message}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
            {selectedSlot?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-secondary text-xs flex items-center gap-1.5"
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
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
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
