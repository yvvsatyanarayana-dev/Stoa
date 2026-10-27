import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Resource } from '../../../../types'
import { Users, DoorClosed, Laptop, Plus, Trash2, Edit3, Clock, CheckCircle } from 'lucide-react'

export const ResourcesView: React.FC = () => {
  const { resources, createResource, updateResource, deleteResource } = useAppStore()
  const [filterType, setFilterType] = useState<string>('all')
  const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null)

  const filtered = filterType === 'all' ? resources : resources.filter((r) => r.type === filterType)

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!editingResource || !editingResource.name) return

    if (editingResource.id) {
      await updateResource(editingResource as Resource)
    } else {
      await createResource({
        id: `res-${Date.now()}`,
        name: editingResource.name,
        type: editingResource.type || 'person',
        capacity: Number(editingResource.capacity) || 1,
        availability_json: JSON.stringify({
          workingHours: { start: '09:00', end: '17:00' },
          workingDays: [1, 2, 3, 4, 5]
        })
      })
    }
    setEditingResource(null)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] p-6 text-[var(--text-primary)]">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
        {/* Header and Filter */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Resource & Room Directory
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Manage rooms, personnel, and equipment with availability limits and automated conflict detection.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-0.5 text-[11px]">
              {['all', 'room', 'person', 'equipment'].map((t) => {
                const isActive = filterType === t
                return (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-[var(--radius-sm)] capitalize font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() =>
                setEditingResource({
                  name: '',
                  type: 'room',
                  capacity: 10
                })
              }
              className="btn-primary flex items-center gap-1.5 py-1 px-3 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Resources Grid / Empty State */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="max-w-sm w-full card p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">No Resources Added Yet</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Add rooms, doctors, consultants, or equipment to allocate them to events and timetable slots.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingResource({
                    name: '',
                    type: 'room',
                    capacity: 8
                  })
                }
                className="btn-primary w-full py-1.5 px-3 text-xs inline-flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add First Resource</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-5 overflow-y-auto flex-1">
            {filtered.map((res) => {
              let workingHours = '09:00 - 17:00'
              let workingDays = 'Mon - Fri'
              if (res.availability_json) {
                try {
                  const parsed = JSON.parse(res.availability_json)
                  if (parsed.workingHours) workingHours = `${parsed.workingHours.start} - ${parsed.workingHours.end}`
                  if (parsed.workingDays) workingDays = `Days ${parsed.workingDays.join(', ')}`
                } catch {}
              }

              return (
                <div
                  key={res.id}
                  className="card p-3.5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                          {res.type === 'room' ? (
                            <DoorClosed className="w-3.5 h-3.5" />
                          ) : res.type === 'person' ? (
                            <Users className="w-3.5 h-3.5" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-[var(--text-primary)]">{res.name}</h3>
                          <span className="text-[9px] text-[var(--text-muted)] uppercase font-mono tracking-wider">
                            {res.type} • Cap: {res.capacity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingResource(res)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${res.name}?`)) deleteResource(res.id)
                          }}
                          className="p-1 text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-hover)] rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] space-y-1 text-[11px] text-[var(--text-muted)] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{workingHours}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 opacity-60" />
                        <span>{workingDays}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal for adding/editing resource */}
        {editingResource && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="card max-w-sm w-full p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                {editingResource.id ? 'Edit Resource' : 'New Resource'}
              </h3>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingResource.name || ''}
                    onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    placeholder="e.g. Conference Room A, Dr. Jane"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Resource Type
                  </label>
                  <select
                    value={editingResource.type || 'room'}
                    onChange={(e) => setEditingResource({ ...editingResource, type: e.target.value as any })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  >
                    <option value="room">Room / Venue</option>
                    <option value="person">Person / Trainer</option>
                    <option value="equipment">Equipment / Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingResource.capacity || 1}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, capacity: Number(e.target.value) })
                    }
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingResource(null)}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs py-1 px-3">
                    Save Resource
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
