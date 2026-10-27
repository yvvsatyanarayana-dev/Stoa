import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { format, isToday } from 'date-fns'
import { Clock, Users, DoorClosed, TrendingUp, Calendar as CalendarIcon, Video, CheckCircle2 } from 'lucide-react'

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
        setCountdown('No upcoming events today')
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

  // Utilization calculation
  const roomResources = resources.filter((r) => r.type === 'room')
  const personResources = resources.filter((r) => r.type === 'person')

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Next Meeting Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 animate-spin-slow" />
                <span>Next Scheduled Event</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {nextEvent ? nextEvent.title : 'All caught up for now'}
              </h2>
              {nextEvent && (
                <p className="text-xs text-slate-300 font-mono mt-1">
                  {format(new Date(nextEvent.start), 'HH:mm')} - {format(new Date(nextEvent.end), 'HH:mm')}
                  {nextEvent.location ? ` • ${nextEvent.location}` : ''}
                </p>
              )}
            </div>

            {nextEvent && (
              <div className="flex items-center gap-3">
                <div className="bg-slate-950/80 border border-blue-500/30 px-4 py-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Starts in</div>
                  <div className="text-sm font-bold text-blue-400 font-mono">{countdown}</div>
                </div>

                {nextEvent.meeting_url && (
                  <a
                    href={nextEvent.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Call</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{todayEvents.length}</div>
              <div className="text-xs text-slate-400">Today's Sessions</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{roomResources.length}</div>
              <div className="text-xs text-slate-400">Active Boardrooms</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{personResources.length}</div>
              <div className="text-xs text-slate-400">Trainers & Doctors</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">92%</div>
              <div className="text-xs text-slate-400">Schedule Efficiency</div>
            </div>
          </div>
        </div>

        {/* Schedule Timeline & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today Timeline */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Today's Executive Schedule Timeline</span>
            </h3>

            {todayEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No events scheduled for today. Enjoy your day!
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
                    className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: evt.calendar?.color || '#3b82f6' }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-100">{evt.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {format(new Date(evt.start), 'HH:mm')} - {format(new Date(evt.end), 'HH:mm')}
                          {evt.location ? ` • ${evt.location}` : ''}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        evt.status === 'confirmed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories Allocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-100 mb-4">Event Categories Breakdown</h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const count = events.filter((e) => e.category_id === cat.id).length
                const pct = events.length > 0 ? Math.round((count / events.length) * 100) : 0

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
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
