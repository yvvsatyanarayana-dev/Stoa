import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { X, BookOpen, Check } from 'lucide-react'

const GRAYSCALE_SHADES = [
  '#0A0A0A',
  '#262626',
  '#404040',
  '#525252',
  '#737373',
  '#8A8A8A',
  '#A3A3A3',
  '#D4D4D4'
]

export const SubjectModal: React.FC = () => {
  const { isSubjectModalOpen, setIsSubjectModalOpen, createSubject } = useAppStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0A0A0A')

  if (!isSubjectModalOpen) return null

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) return
    await createSubject(name.trim(), color)
    setName('')
    setIsSubjectModalOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] max-w-sm w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <BookOpen className="w-4 h-4" />
            <span>Add Subject / Module</span>
          </h3>
          <button
            onClick={() => setIsSubjectModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Clinical Pathology or Systems Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Subject Shade</label>
            <div className="flex items-center gap-2">
              {GRAYSCALE_SHADES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-transform ${
                    color === c ? 'border-[var(--border-strong)] scale-110 shadow-md ring-2 ring-[var(--accent)]' : 'border-neutral-500 hover:scale-105'
                  }`}
                >
                  {color === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="btn-secondary text-xs py-1.5 px-3.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-1.5 px-4"
            >
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
