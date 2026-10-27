import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Resource, ResourceType } from '../../../../types'
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
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        {/* Header and Filter */}
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Resource & Room Directory</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Add and organize personnel, meeting rooms, and equipment with availability limits and conflict detection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-0.5 text-xs">
              {['all', 'room', 'person', 'equipment'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-[var(--radius-sm)] capitalize font-semibold transition-all ${
                    filterType === t
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setEditingResource({
                  name: '',
                  type: 'room',
                  capacity: 10
                })
              }
              className="btn-primary flex items-center gap-2 py-1.5 px-3.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Resources Grid / Empty State */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="max-w-md w-full card p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center mx-auto shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Resources Added Yet</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
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
                className="btn-primary w-full py-2.5 px-4 text-xs inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Resource</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 overflow-y-auto flex-1">
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
                  className="card p-4 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)]">
                          {res.type === 'room' ? (
                            <DoorClosed className="w-4 h-4" />
                          ) : res.type === 'person' ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">{res.name}</h3>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                            {res.type} • Capacity: {res.capacity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingResource(res)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${res.name}?`)) deleteResource(res.id)
                          }}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-1 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{workingHours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{workingDays}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                      Active
                    </span>
                    <span className="font-mono text-[var(--text-muted)]">#{res.id.slice(0, 8)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSave}
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] max-w-md w-full p-6 shadow-2xl space-y-4 text-[var(--text-primary)]"
          >
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {editingResource.id ? 'Edit Resource' : 'Add New Resource'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Name</label>
              <input
                type="text"
                required
                value={editingResource.name || ''}
                onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                placeholder="e.g. Conference Room Beta or Dr. Jane Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type</label>
                <select
                  value={editingResource.type || 'room'}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, type: e.target.value as ResourceType })
                  }
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                >
                  <option value="room">Room</option>
                  <option value="person">Person</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={editingResource.capacity || 1}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, capacity: Number(e.target.value) })
                  }
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-4 py-2 text-xs"
              >
                Save Resource
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
