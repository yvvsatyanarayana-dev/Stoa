import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { X, Calendar as CalendarIcon, Check } from 'lucide-react'

const PALETTE_COLORS = [
  '#6D0808', // Crimson (User Theme)
  '#757D6F', // Sage (User Theme)
  '#8F1414',
  '#5C6356',
  '#A32E2E',
  '#3D4238',
  '#C94A4A',
  '#8A9184'
]

export const CalendarModal: React.FC = () => {
  const { isCalendarModalOpen, setIsCalendarModalOpen, createCalendar } = useAppStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6D0808')

  if (!isCalendarModalOpen) return null

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) return
    await createCalendar(name.trim(), color)
    setName('')
    setIsCalendarModalOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#2D0000] border border-[#6D0808] rounded-2xl max-w-sm w-full p-5 shadow-2xl text-[#EEEAD7]">
        <div className="flex items-center justify-between pb-3 border-b border-[#551010]">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[#EEEAD7]">
            <CalendarIcon className="w-4 h-4 text-[#EEEAD7]" />
            <span>Create New Calendar</span>
          </h3>
          <button
            onClick={() => setIsCalendarModalOpen(false)}
            className="p-1 text-[#757D6F] hover:text-[#EEEAD7] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-[#757D6F] mb-1">Calendar Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Executive Board, Training Sessions, Personal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-xs text-[#EEEAD7] placeholder-[#757D6F]/60 focus:outline-none focus:border-[#EEEAD7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#757D6F] mb-2">Calendar Color Tag</label>
            <div className="flex items-center gap-2">
              {PALETTE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-transform ${
                    color === c ? 'border-[#EEEAD7] scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                >
                  {color === c && <Check className="w-3 h-3 text-[#EEEAD7]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#551010]">
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#380505] hover:bg-[#480707] text-xs font-semibold text-[#757D6F] hover:text-[#EEEAD7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#6D0808] hover:bg-[#8F0F0F] text-xs font-bold text-[#EEEAD7] shadow-sm transition-all border border-[#EEEAD7]/30"
            >
              Add Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
