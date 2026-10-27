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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#2D0000] border border-[#6D0808] rounded-2xl max-w-md w-full p-6 shadow-2xl text-[#EEEAD7]">
        <div className="flex items-center justify-between pb-3 border-b border-[#551010]">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#EEEAD7]">
            <TableProperties className="w-4 h-4 text-[#EEEAD7]" />
            <span>Create New Timetable</span>
          </h3>
          <button
            onClick={() => setIsTimetableModalOpen(false)}
            className="p-1 text-[#757D6F] hover:text-[#EEEAD7] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-[#757D6F] mb-1">Timetable Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Fall 2026 Academic Roster or Client Shift Schedule"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-xs text-[#EEEAD7] placeholder-[#757D6F]/60 focus:outline-none focus:border-[#EEEAD7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Effective Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-xs text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Effective End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-xs text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#551010]">
            <button
              type="button"
              onClick={() => setIsTimetableModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#380505] hover:bg-[#480707] text-xs font-semibold text-[#757D6F] hover:text-[#EEEAD7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#6D0808] hover:bg-[#8F0F0F] text-xs font-bold text-[#EEEAD7] shadow-sm transition-all border border-[#EEEAD7]/30"
            >
              Create Timetable
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
