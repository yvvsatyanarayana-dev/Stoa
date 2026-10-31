import React, { useState } from 'react'
import { Plus, X, Building, Clock, Palette } from 'lucide-react'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

const COLOR_SWATCHES = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1'  // indigo
]

export const CreateWorkspaceModal: React.FC = () => {
  const { isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen, createWorkspace } =
    useWorkspaceStore()

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00')
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00')

  if (!isCreateWorkspaceModalOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await createWorkspace({
      name: name.trim(),
      domain: domain.trim() || 'General Operations',
      color,
      working_hours_start: workingHoursStart,
      working_hours_end: workingHoursEnd
    })

    setName('')
    setDomain('')
    setIsCreateWorkspaceModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 select-none">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold text-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Create Workspace
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Add a new workspace to organize your schedules
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateWorkspaceModalOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">
              Workspace Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Global Operations"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">
              Department / Domain Focus
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Engineering & Production Schedules"
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Color Tag */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Workspace Accent Swatch</span>
            </label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === swatch ? 'ring-2 ring-offset-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Standard Operating Hours</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Start Time</span>
                <input
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">End Time</span>
                <input
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateWorkspaceModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create & Activate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
