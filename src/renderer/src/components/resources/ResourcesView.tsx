import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Resource } from '../../../../types'
import {
  Users,
  DoorClosed,
  Laptop,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  Calendar,
  AlertOctagon,
  CalendarRange,
  UserCheck,
  FolderTree
} from 'lucide-react'

// Category D Feature Components
import { TeamAvailabilityOverlay } from './TeamAvailabilityOverlay'
import { SmartRoomSuggester } from './SmartRoomSuggester'
import { ResourceConflictDashboard } from './ResourceConflictDashboard'
import { ShiftRosterBuilder } from './ShiftRosterBuilder'
import { AttendanceTracker } from './AttendanceTracker'

export type ResourceTab =
  | 'directory'
  | 'availability'
  | 'suggester'
  | 'conflicts'
  | 'roster'
  | 'attendance'

export const ResourcesView: React.FC = () => {
  const {
    resources,
    createResource,
    updateResource,
    deleteResource,
    events,
    resourceActiveTab,
    setResourceActiveTab
  } = useAppStore()

  const activeTab = resourceActiveTab
  const setActiveTab = setResourceActiveTab
  const [filterType, setFilterType] = useState<string>('all')
  const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null)
  const [isInitializingSample, setIsInitializingSample] = useState<boolean>(false)

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

  // Quick seed helper for realistic starter enterprise resources
  const handleSeedStarterResources = async () => {
    setIsInitializingSample(true)
    const starterData: Array<{ name: string; type: Resource['type']; capacity: number }> = [
      { name: 'Dr. Sarah Chen', type: 'person', capacity: 1 },
      { name: 'Marcus Vance', type: 'person', capacity: 1 },
      { name: 'Elena Rostova', type: 'person', capacity: 1 },
      { name: 'Alex Morgan', type: 'person', capacity: 1 },
      { name: 'Executive Boardroom', type: 'room', capacity: 18 },
      { name: 'Innovation Studio', type: 'room', capacity: 10 },
      { name: 'Focus Pod Alpha', type: 'room', capacity: 4 },
      { name: 'Auditorium Zenith', type: 'room', capacity: 60 },
      { name: 'Polycom Studio X50 Video Bar', type: 'equipment', capacity: 1 },
      { name: '4K Mobile Display Rig', type: 'equipment', capacity: 1 }
    ]

    for (const item of starterData) {
      await createResource({
        id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: item.name,
        type: item.type,
        capacity: item.capacity,
        availability_json: JSON.stringify({
          workingHours: { start: '09:00', end: '17:00' },
          workingDays: [1, 2, 3, 4, 5]
        })
      })
    }
    setIsInitializingSample(false)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Navigation & Sub-Suite Tabs Bar */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'directory'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Resource Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'availability'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Availability</span>
          </button>

          <button
            onClick={() => setActiveTab('suggester')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'suggester'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>Smart Room Suggester</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'conflicts'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Conflict Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'roster'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Shift Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Attendance & Presence</span>
          </button>
        </div>

        {/* Global Resource Count Badge */}
        <span className="text-[11px] font-mono text-[var(--text-muted)] hidden lg:inline">
          {resources.length} active assets • {events.length} tracked events
        </span>
      </div>

      {/* Main Sub-view Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full">
          {/* TAB 1: DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              {/* Directory Filter & Add Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                    Resource Directory
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Rooms, medical/consulting staff, and AV equipment with automated availability limits.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
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

              {/* Resources Grid or Empty State */}
              {filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <div className="max-w-md w-full card p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                      <Users className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        No Resources in Directory
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Add rooms, personnel, and equipment to test multi-member overlay, smart room assignment, and shift rostering.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleSeedStarterResources}
                        disabled={isInitializingSample}
                        className="btn-primary w-full sm:w-auto py-1.5 px-4 text-xs inline-flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Load Sample Enterprise Assets</span>
                      </button>

                      <button
                        onClick={() =>
                          setEditingResource({
                            name: '',
                            type: 'room',
                            capacity: 8
                          })
                        }
                        className="btn-secondary w-full sm:w-auto py-1.5 px-4 text-xs inline-flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Manually</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {filtered.map((res) => {
                    let workingHours = '09:00 - 17:00'
                    let workingDays = 'Mon - Fri'
                    if (res.availability_json) {
                      try {
                        const parsed = JSON.parse(res.availability_json)
                        if (parsed.workingHours)
                          workingHours = `${parsed.workingHours.start} - ${parsed.workingHours.end}`
                        if (parsed.workingDays)
                          workingDays = `${parsed.workingDays.length} days/week`
                      } catch {}
                    }

                    return (
                      <div
                        key={res.id}
                        className="card p-4 flex flex-col justify-between hover:border-[var(--border-default)] transition-colors shadow-2xs group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                                {res.type === 'room' && <DoorClosed className="w-4 h-4" />}
                                {res.type === 'person' && <Users className="w-4 h-4" />}
                                {res.type === 'equipment' && <Laptop className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                                  {res.name}
                                </h4>
                                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                                  {res.type} • {res.capacity} {res.type === 'person' ? 'person' : 'seats'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingResource(res)}
                                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                title="Edit Resource"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteResource(res.id)}
                                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                                title="Delete Resource"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1 text-[11px] font-mono text-[var(--text-muted)]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                              <span>{workingHours}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-[var(--text-secondary)]" />
                              <span>{workingDays}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEAM AVAILABILITY OVERLAY */}
          {activeTab === 'availability' && <TeamAvailabilityOverlay />}

          {/* TAB 3: SMART ROOM SUGGESTER */}
          {activeTab === 'suggester' && <SmartRoomSuggester />}

          {/* TAB 4: RESOURCE CONFLICT DASHBOARD */}
          {activeTab === 'conflicts' && <ResourceConflictDashboard />}

          {/* TAB 5: SHIFT ROSTER BUILDER */}
          {activeTab === 'roster' && <ShiftRosterBuilder />}

          {/* TAB 6: ATTENDANCE TRACKER */}
          {activeTab === 'attendance' && <AttendanceTracker />}
        </div>
      </div>

      {/* Edit / Create Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              {editingResource.id ? 'Edit Resource' : 'Add New Resource'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Resource Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conference Room A, Dr. John Smith"
                  value={editingResource.name || ''}
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Type
                  </label>
                  <select
                    value={editingResource.type || 'room'}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        type: e.target.value as Resource['type']
                      })
                    }
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="room">Room</option>
                    <option value="person">Person</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingResource.capacity || 1}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        capacity: Number(e.target.value)
                      })
                    }
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="btn-secondary py-1 px-3 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1 px-3 text-xs">
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
