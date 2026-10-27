import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { X, TableProperties } from 'lucide-react'
import { format, addMonths } from 'date-fns'

export const TimetableModal: React.FC = () => {
  const { isTimetableModalOpen, setIsTimetableModalOpen, createTimetable } = useAppStore()
  const today = new Date()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(format(today, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addMonths(today, 3), 'yyyy-MM-dd'))

  if (!isTimetableModalOpen) return null

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) return
    await createTimetable(name.trim(), startDate, endDate)
    setName('')
    setIsTimetableModalOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <TableProperties className="w-4 h-4" />
            <span>Create New Timetable</span>
          </h3>
          <button
            onClick={() => setIsTimetableModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Timetable Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Q4 Master Operations or Clinic Shift Schedule"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Effective Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Effective End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsTimetableModalOpen(false)}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-5"
            >
              Create Timetable
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
