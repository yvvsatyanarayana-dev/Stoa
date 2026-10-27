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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#2D0000] p-6 text-[#EEEAD7]">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        {/* Header and Filter */}
        <div className="flex items-center justify-between pb-6 border-b border-[#551010]">
          <div>
            <h2 className="text-xl font-bold text-[#EEEAD7]">Resource & Room Directory</h2>
            <p className="text-xs text-[#757D6F] mt-1">
              Add and organize personnel, meeting rooms, and equipment with availability limits and conflict detection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#1F0000] border border-[#551010] rounded-lg p-0.5 text-xs">
              {['all', 'room', 'person', 'equipment'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-md capitalize font-bold transition-all ${
                    filterType === t ? 'bg-[#6D0808] text-[#EEEAD7]' : 'text-[#757D6F] hover:text-[#EEEAD7]'
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
              className="flex items-center gap-2 bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition-all border border-[#EEEAD7]/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Resources Grid / Empty State */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="max-w-md w-full bg-[#380505] border border-[#551010] rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-[#6D0808] border border-[#EEEAD7]/30 flex items-center justify-center mx-auto text-[#EEEAD7]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#EEEAD7]">No Resources Added Yet</h3>
                <p className="text-xs text-[#757D6F] mt-1">
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
                className="w-full py-2.5 px-4 bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] text-xs font-bold rounded-xl shadow border border-[#EEEAD7]/30 inline-flex items-center justify-center gap-2"
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
                  className="bg-[#380505] border border-[#551010] rounded-xl p-4 flex flex-col justify-between hover:border-[#6D0808] transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] border border-[#EEEAD7]/20">
                          {res.type === 'room' ? (
                            <DoorClosed className="w-4 h-4" />
                          ) : res.type === 'person' ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#EEEAD7]">{res.name}</h3>
                          <span className="text-[10px] text-[#757D6F] uppercase font-bold tracking-wider">
                            {res.type} • Capacity: {res.capacity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingResource(res)}
                          className="p-1.5 text-[#757D6F] hover:text-[#EEEAD7] hover:bg-[#1F0000] rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${res.name}?`)) deleteResource(res.id)
                          }}
                          className="p-1.5 text-[#757D6F] hover:text-[#EEEAD7] hover:bg-[#6D0808]/40 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#551010] space-y-1 text-xs text-[#757D6F]">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-[#C4BFAC]">
                        <Clock className="w-3.5 h-3.5 text-[#757D6F]" />
                        <span>{workingHours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#C4BFAC]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#757D6F]" />
                        <span>{workingDays}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#551010] flex items-center justify-between text-[11px] text-[#757D6F]">
                    <span className="text-[#EEEAD7] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#757D6F]" />
                      Active
                    </span>
                    <span className="font-mono text-[#757D6F]">#{res.id.slice(0, 8)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSave}
            className="bg-[#2D0000] border border-[#6D0808] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#EEEAD7]"
          >
            <h3 className="text-base font-bold text-[#EEEAD7]">
              {editingResource.id ? 'Edit Resource' : 'Add New Resource'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Name</label>
              <input
                type="text"
                required
                value={editingResource.name || ''}
                onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-sm text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
                placeholder="e.g. Conference Room Beta or Dr. Jane Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#757D6F] mb-1">Type</label>
                <select
                  value={editingResource.type || 'room'}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, type: e.target.value as ResourceType })
                  }
                  className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-sm text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
                >
                  <option value="room">Room</option>
                  <option value="person">Person</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#757D6F] mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={editingResource.capacity || 1}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, capacity: Number(e.target.value) })
                  }
                  className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-sm text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#551010]">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 rounded-lg bg-[#380505] hover:bg-[#480707] text-[#757D6F] hover:text-[#EEEAD7] text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] text-xs font-bold shadow transition-all border border-[#EEEAD7]/30"
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
