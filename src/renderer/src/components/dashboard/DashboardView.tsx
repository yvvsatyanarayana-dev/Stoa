import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { format, isToday } from 'date-fns'
import { Clock, Users, DoorClosed, TrendingUp, Calendar as CalendarIcon, Video, CheckCircle2, Plus } from 'lucide-react'

export const DashboardView: React.FC = () => {
  const { events, resources, categories, setSelectedEvent, setIsEventModalOpen } = useAppStore()
  const [countdown, setCountdown] = useState<string>('')

  // Filter today's events
  const todayEvents = events.filter((e) => isToday(new Date(e.start)))
  todayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  // Find next upcoming event
  const now = new Date().getTime()
  const nextEvent = events.find((e) => new Date(e.start).getTime() > now)

  useEffect(() => {
    const updateTimer = (): void => {
      if (!nextEvent) {
        setCountdown('No upcoming events')
        return
      }
      const diffMs = new Date(nextEvent.start).getTime() - Date.now()
      if (diffMs <= 0) {
        setCountdown('In Progress')
        return
      }
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000)
      setCountdown(
        `${diffHours > 0 ? `${diffHours}h ` : ''}${diffMinutes}m ${diffSeconds}s remaining`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [nextEvent])

  const roomResources = resources.filter((r) => r.type === 'room')
  const personResources = resources.filter((r) => r.type === 'person')

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 space-y-6 text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Next Meeting Banner */}
        <div className="card p-6 relative overflow-hidden shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 text-[var(--accent)]" />
                <span>Next Scheduled Event</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {nextEvent ? nextEvent.title : 'Schedule is Clear'}
              </h2>
              {nextEvent ? (
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                  {format(new Date(nextEvent.start), 'HH:mm')} - {format(new Date(nextEvent.end), 'HH:mm')}
                  {nextEvent.location ? ` • ${nextEvent.location}` : ''}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  You have no upcoming events. Click "Create Event" to schedule your next appointment or session.
                </p>
              )}
            </div>

            {nextEvent ? (
              <div className="flex items-center gap-3">
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-4 py-2.5 rounded-[var(--radius-md)] text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Starts in</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] font-mono">{countdown}</div>
                </div>

                {nextEvent.meeting_url && (
                  <a
                    href={nextEvent.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Call</span>
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedEvent(null)
                  setIsEventModalOpen(true)
                }}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{todayEvents.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Today's Events</div>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)]">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{roomResources.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Registered Rooms</div>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{personResources.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Personnel & Staff</div>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{events.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Total Scheduled Events</div>
            </div>
          </div>
        </div>

        {/* Schedule Timeline & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today Timeline */}
          <div className="lg:col-span-2 card p-5 flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
              <span>Today's Schedule Timeline</span>
            </h3>

            {todayEvents.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-muted)] text-xs space-y-1">
                <p>No events scheduled for today.</p>
                <p>Click any slot in the Calendar view to book a time.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedEvent(evt)
                      setIsEventModalOpen(true)
                    }}
                    className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full bg-[var(--border-strong)]" />
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">{evt.title}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                          {format(new Date(evt.start), 'HH:mm')} - {format(new Date(evt.end), 'HH:mm')}
                          {evt.location ? ` • ${evt.location}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]">
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories Allocation */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Event Categories Breakdown</h3>
            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const count = events.filter((e) => e.category_id === cat.id).length
                const pct = events.length > 0 ? Math.round((count / events.length) * 100) : 0
                const shade = idx % 2 === 0 ? 'var(--text-primary)' : 'var(--text-secondary)'

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full border border-current" />
                        {cat.name}
                      </span>
                      <span className="text-[var(--text-muted)] font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--bg-subtle)] h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: shade }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
