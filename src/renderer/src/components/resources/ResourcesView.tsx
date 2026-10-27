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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-6">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        {/* Header and Filter */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Resource & Room Directory</h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage personnel, executive boardrooms, and equipment with availability limits and conflict prevention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              {['all', 'room', 'person', 'equipment'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-md capitalize font-medium transition-all ${
                    filterType === t ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Resources Grid */}
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
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
                        {res.type === 'room' ? (
                          <DoorClosed className="w-4 h-4" />
                        ) : res.type === 'person' ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <Laptop className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{res.name}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                          {res.type} • Capacity: {res.capacity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingResource(res)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${res.name}?`)) deleteResource(res.id)
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{workingHours}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{workingDays}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Available for Booking
                  </span>
                  <span className="font-mono text-slate-400">#{res.id.slice(0, 8)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-100">
              {editingResource.id ? 'Edit Resource' : 'Add New Resource'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
              <input
                type="text"
                required
                value={editingResource.name || ''}
                onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Conference Room Beta or Dr. Jane Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                <select
                  value={editingResource.type || 'room'}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, type: e.target.value as ResourceType })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="room">Room</option>
                  <option value="person">Person</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={editingResource.capacity || 1}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, capacity: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
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
