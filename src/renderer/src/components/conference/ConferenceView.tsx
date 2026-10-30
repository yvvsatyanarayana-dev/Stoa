import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Conference, ConferenceTrack, ConferenceSession, RunSheetItem } from '../../../../types'
import {
  Presentation,
  Plus,
  Trash2,
  Edit3,
  Clock,
  User,
  MapPin,
  PlayCircle,
  CheckCircle2,
  Timer
} from 'lucide-react'

export const ConferenceView: React.FC = () => {
  const {
    conferences,
    activeConferenceId,
    setActiveConferenceId,
    createConference,
    updateConference,
    deleteConference
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'tracks' | 'runsheet'>('tracks')
  const [isCreatingConf, setIsCreatingConf] = useState(false)
  const [newConfTitle, setNewConfTitle] = useState('')
  const [newConfDate, setNewConfDate] = useState(new Date().toISOString().split('T')[0])
  const [newConfVenue, setNewConfVenue] = useState('')

  // Modal for new session
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Partial<ConferenceSession> | null>(null)

  // Modal for new run-sheet item
  const [isRunSheetModalOpen, setIsRunSheetModalOpen] = useState(false)
  const [editingRunSheetItem, setEditingRunSheetItem] = useState<Partial<RunSheetItem> | null>(null)

  const activeConf = conferences.find((c) => c.id === activeConferenceId) || conferences[0]

  useEffect(() => {
    if (!activeConferenceId && conferences.length > 0) {
      setActiveConferenceId(conferences[0].id)
    }
  }, [conferences, activeConferenceId])

  const handleCreateConf = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newConfTitle.trim()) return

    const defaultTracks: ConferenceTrack[] = [
      { id: 'track-1', name: 'Main Auditorium', room: 'Hall A', color: '#0A0A0A' },
      { id: 'track-2', name: 'Engineering & Tech', room: 'Lab 2', color: '#404040' },
      { id: 'track-3', name: 'Executive Workshops', room: 'Boardroom', color: '#737373' }
    ]

    const newConf: Conference = {
      id: `conf-${Date.now()}`,
      title: newConfTitle.trim(),
      date: newConfDate,
      venue: newConfVenue.trim() || undefined,
      tracks_json: JSON.stringify(defaultTracks),
      sessions_json: JSON.stringify([]),
      runsheet_json: JSON.stringify([]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await createConference(newConf)
    setIsCreatingConf(false)
    setNewConfTitle('')
    setNewConfVenue('')
  }

  const handleAddTrack = async (): Promise<void> => {
    if (!activeConf) return
    const tracks: ConferenceTrack[] = activeConf.tracks || []
    const trackNum = tracks.length + 1
    const newTrack: ConferenceTrack = {
      id: `track-${Date.now()}`,
      name: `Track ${trackNum}`,
      room: `Stage ${trackNum}`
    }

    const updatedConf: Conference = {
      ...activeConf,
      tracks_json: JSON.stringify([...tracks, newTrack])
    }
    await updateConference(updatedConf)
  }

  const handleSaveSession = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!activeConf || !editingSession || !editingSession.title) return

    const sessions: ConferenceSession[] = activeConf.sessions || []
    let updatedSessions: ConferenceSession[] = []

    if (editingSession.id) {
      updatedSessions = sessions.map((s) => (s.id === editingSession.id ? (editingSession as ConferenceSession) : s))
    } else {
      const newSess: ConferenceSession = {
        id: `sess-${Date.now()}`,
        track_id: editingSession.track_id || activeConf.tracks?.[0]?.id || 'track-1',
        title: editingSession.title,
        speaker: editingSession.speaker || 'TBD',
        speaker_role: editingSession.speaker_role || 'Keynote Speaker',
        start: editingSession.start || '09:00',
        end: editingSession.end || '10:00',
        description: editingSession.description
      }
      updatedSessions = [...sessions, newSess]
    }

    const updatedConf: Conference = {
      ...activeConf,
      sessions_json: JSON.stringify(updatedSessions)
    }
    await updateConference(updatedConf)
    setIsSessionModalOpen(false)
    setEditingSession(null)
  }

  const handleDeleteSession = async (sessId: string): Promise<void> => {
    if (!activeConf) return
    const sessions = (activeConf.sessions || []).filter((s) => s.id !== sessId)
    const updatedConf: Conference = {
      ...activeConf,
      sessions_json: JSON.stringify(sessions)
    }
    await updateConference(updatedConf)
  }

  const handleSaveRunSheetItem = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!activeConf || !editingRunSheetItem || !editingRunSheetItem.title) return

    const items: RunSheetItem[] = activeConf.runsheet || []
    let updatedItems: RunSheetItem[] = []

    if (editingRunSheetItem.id) {
      updatedItems = items.map((item) =>
        item.id === editingRunSheetItem.id ? (editingRunSheetItem as RunSheetItem) : item
      )
    } else {
      const newItem: RunSheetItem = {
        id: `cue-${Date.now()}`,
        time: editingRunSheetItem.time || '08:30',
        title: editingRunSheetItem.title,
        lead_person: editingRunSheetItem.lead_person || 'AV Lead',
        status: editingRunSheetItem.status || 'upcoming',
        notes: editingRunSheetItem.notes
      }
      updatedItems = [...items, newItem].sort((a, b) => a.time.localeCompare(b.time))
    }

    const updatedConf: Conference = {
      ...activeConf,
      runsheet_json: JSON.stringify(updatedItems)
    }
    await updateConference(updatedConf)
    setIsRunSheetModalOpen(false)
    setEditingRunSheetItem(null)
  }

  const toggleRunSheetStatus = async (item: RunSheetItem): Promise<void> => {
    if (!activeConf) return
    const nextStatus = item.status === 'upcoming' ? 'live' : item.status === 'live' ? 'completed' : 'upcoming'
    const items = (activeConf.runsheet || []).map((i) => (i.id === item.id ? { ...i, status: nextStatus as any } : i))

    const updatedConf: Conference = {
      ...activeConf,
      runsheet_json: JSON.stringify(items)
    }
    await updateConference(updatedConf)
  }

  if (conferences.length === 0 && !isCreatingConf) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)] p-6 text-[var(--text-primary)]">
        <div className="max-w-md w-full card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-primary)] shadow-xs">
            <Presentation className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Conference & Multi-Track Planner
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Organize multi-stage summits, track sessions with speaker rosters, and manage event-day minute-by-minute run-sheets.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingConf(true)}
            className="btn-primary w-full py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Conference</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header Bar */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Event:
            </span>
            <select
              value={activeConf?.id || ''}
              onChange={(e) => setActiveConferenceId(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            >
              {conferences.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.date})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreatingConf(true)}
            className="p-1 px-2.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 stroke-[2]" />
            <span>New Conference</span>
          </button>

          {activeConf && (
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 opacity-60" />
                <span>{activeConf.date}</span>
              </span>
              {activeConf.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 opacity-60" />
                  <span>{activeConf.venue}</span>
                </span>
              )}
              <button
                onClick={() => {
                  if (confirm(`Delete conference "${activeConf.title}"?`)) {
                    deleteConference(activeConf.id)
                  }
                }}
                className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded transition-colors ml-1"
                title="Delete Conference"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* View Mode Switcher (Parallel Tracks vs Live Run-Sheet) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[11px]">
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-3 py-1 rounded-[var(--radius-sm)] font-medium transition-all ${
                activeTab === 'tracks'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Parallel Tracks ({activeConf?.tracks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('runsheet')}
              className={`px-3 py-1 rounded-[var(--radius-sm)] font-medium transition-all ${
                activeTab === 'runsheet'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Live Event Run-Sheet ({activeConf?.runsheet?.length || 0})
            </button>
          </div>

          {activeTab === 'tracks' ? (
            <button
              onClick={() => {
                setEditingSession({
                  track_id: activeConf?.tracks?.[0]?.id || 'track-1',
                  start: '09:00',
                  end: '10:00'
                })
                setIsSessionModalOpen(true)
              }}
              className="btn-primary flex items-center gap-1.5 py-1 px-3 text-xs font-medium shadow-xs"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Add Session</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRunSheetItem({ time: '09:00', status: 'upcoming' })
                setIsRunSheetModalOpen(true)
              }}
              className="btn-primary flex items-center gap-1.5 py-1 px-3 text-xs font-medium shadow-xs"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Add Cue Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      {activeTab === 'tracks' ? (
        <div className="flex-1 overflow-x-auto p-5">
          <div className="flex gap-4 min-w-full h-full items-start">
            {(activeConf?.tracks || []).map((track) => {
              const trackSessions = (activeConf?.sessions || [])
                .filter((s) => s.track_id === track.id)
                .sort((a, b) => a.start.localeCompare(b.start))

              return (
                <div
                  key={track.id}
                  className="w-80 shrink-0 bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex flex-col max-h-full overflow-hidden shadow-xs"
                >
                  {/* Track Column Header */}
                  <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text-primary)]">{track.name}</h3>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{track.room || 'Main Stage'}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-bold">
                      {trackSessions.length}
                    </span>
                  </div>

                  {/* Sessions List */}
                  <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                    {trackSessions.length === 0 ? (
                      <div className="p-6 text-center text-[11px] text-[var(--text-muted)] italic">
                        No sessions scheduled yet for this track.
                      </div>
                    ) : (
                      trackSessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-app)] border border-[var(--border-subtle)] border-l-[3px] border-l-[var(--accent)] hover:border-[var(--border-strong)] transition-all shadow-xs group"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-mono font-semibold text-[var(--text-muted)]">
                              {sess.start} - {sess.end}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingSession(sess)
                                  setIsSessionModalOpen(true)
                                }}
                                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(sess.id)}
                                className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-semibold text-[var(--text-primary)] mt-1">
                            {sess.title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] mt-2 pt-2 border-t border-[var(--border-subtle)]">
                            <User className="w-3 h-3 opacity-60" />
                            <span className="font-medium truncate">{sess.speaker}</span>
                            {sess.speaker_role && (
                              <span className="text-[9px] text-[var(--text-muted)] truncate">
                                • {sess.speaker_role}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}

            {/* Add Track Button Column */}
            <button
              onClick={handleAddTrack}
              className="w-48 shrink-0 h-32 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] flex flex-col items-center justify-center text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stage / Track</span>
            </button>
          </div>
        </div>
      ) : (
        /* Live Run-Sheet Cue Mode */
        <div className="flex-1 overflow-y-auto p-6 w-full space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                Event-Day Live Run-Sheet
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Sequential cue sheet for stage managers, audio/visual engineers, and organizers.
              </p>
            </div>
          </div>

          {(activeConf?.runsheet || []).length === 0 ? (
            <div className="card p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
              <Timer className="w-6 h-6 mx-auto stroke-[1.8] opacity-60" />
              <p>No run-sheet cue items added yet.</p>
              <button
                onClick={() => {
                  setEditingRunSheetItem({ time: '08:30', status: 'upcoming' })
                  setIsRunSheetModalOpen(true)
                }}
                className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 shadow-xs mt-2"
              >
                <Plus className="w-3 h-3" />
                <span>Add First Run-Sheet Cue</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {(activeConf?.runsheet || []).map((item) => (
                <div
                  key={item.id}
                  className={`card p-3 flex items-center justify-between transition-all ${
                    item.status === 'live'
                      ? 'border-emerald-500/60 bg-emerald-500/5 shadow-xs'
                      : item.status === 'completed'
                      ? 'opacity-60 bg-[var(--bg-subtle)]/40'
                      : 'hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)] w-14">
                      {item.time}
                    </span>

                    <button
                      onClick={() => toggleRunSheetStatus(item)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider transition-colors ${
                        item.status === 'live'
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : item.status === 'completed'
                          ? 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {item.status}
                    </button>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-2 mt-0.5">
                        <span>Lead: {item.lead_person || 'Lead Coordinator'}</span>
                        {item.notes && <span className="truncate opacity-80">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRunSheetStatus(item)}
                      className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      title="Toggle status (Upcoming -> Live -> Completed)"
                    >
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Conference */}
      {isCreatingConf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Create New Conference / Event
            </h3>
            <form onSubmit={handleCreateConf} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Conference Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Tech Summit 2026"
                  value={newConfTitle}
                  onChange={(e) => setNewConfTitle(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={newConfDate}
                  onChange={(e) => setNewConfDate(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Convention Center"
                  value={newConfVenue}
                  onChange={(e) => setNewConfVenue(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingConf(false)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1 px-3 font-semibold">
                  Create Conference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Session */}
      {isSessionModalOpen && editingSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              {editingSession.id ? 'Edit Session' : 'Add Track Session'}
            </h3>
            <form onSubmit={handleSaveSession} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keynote: The Future of Distributed Systems"
                  value={editingSession.title || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Stage / Track
                  </label>
                  <select
                    value={editingSession.track_id}
                    onChange={(e) => setEditingSession({ ...editingSession, track_id: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    {(activeConf?.tracks || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Time (Start - End)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={editingSession.start || '09:00'}
                      onChange={(e) => setEditingSession({ ...editingSession, start: e.target.value })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                    <span className="text-[var(--text-muted)]">-</span>
                    <input
                      type="time"
                      value={editingSession.end || '10:00'}
                      onChange={(e) => setEditingSession({ ...editingSession, end: e.target.value })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Speaker Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Alex Mercer"
                    value={editingSession.speaker || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, speaker: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Speaker Role / Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Engineering"
                    value={editingSession.speaker_role || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, speaker_role: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1 px-3 font-semibold">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Run-Sheet Item */}
      {isRunSheetModalOpen && editingRunSheetItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Add Run-Sheet Cue Item
            </h3>
            <form onSubmit={handleSaveRunSheetItem} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Cue Item / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doors Open & Attendee Badging"
                  value={editingRunSheetItem.title || ''}
                  onChange={(e) => setEditingRunSheetItem({ ...editingRunSheetItem, title: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={editingRunSheetItem.time || '08:30'}
                    onChange={(e) => setEditingRunSheetItem({ ...editingRunSheetItem, time: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                    Lead Lead / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Registration Lead"
                    value={editingRunSheetItem.lead_person || ''}
                    onChange={(e) => setEditingRunSheetItem({ ...editingRunSheetItem, lead_person: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Stage Notes / Cues
                </label>
                <input
                  type="text"
                  placeholder="e.g. Play walk-in background track, test microphones"
                  value={editingRunSheetItem.notes || ''}
                  onChange={(e) => setEditingRunSheetItem({ ...editingRunSheetItem, notes: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRunSheetModalOpen(false)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1 px-3 font-semibold">
                  Add Cue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
