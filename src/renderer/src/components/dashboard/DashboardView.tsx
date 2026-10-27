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
    <div className="flex-1 overflow-y-auto bg-[#2D0000] p-6 space-y-6 text-[#EEEAD7]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Next Meeting Banner */}
        <div className="bg-[#380505] border border-[#551010] rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#757D6F] uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 text-[#EEEAD7]" />
                <span>Next Scheduled Event</span>
              </div>
              <h2 className="text-xl font-bold text-[#EEEAD7]">
                {nextEvent ? nextEvent.title : 'Schedule is Clear'}
              </h2>
              {nextEvent ? (
                <p className="text-xs text-[#C4BFAC] font-mono mt-1">
                  {format(new Date(nextEvent.start), 'HH:mm')} - {format(new Date(nextEvent.end), 'HH:mm')}
                  {nextEvent.location ? ` • ${nextEvent.location}` : ''}
                </p>
              ) : (
                <p className="text-xs text-[#757D6F] mt-1">
                  You have no upcoming events. Click "Create Event" to schedule your next appointment or session.
                </p>
              )}
            </div>

            {nextEvent ? (
              <div className="flex items-center gap-3">
                <div className="bg-[#1F0000] border border-[#551010] px-4 py-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-[#757D6F] uppercase font-bold">Starts in</div>
                  <div className="text-sm font-bold text-[#EEEAD7] font-mono">{countdown}</div>
                </div>

                {nextEvent.meeting_url && (
                  <a
                    href={nextEvent.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] rounded-xl text-xs font-bold flex items-center gap-2 shadow border border-[#EEEAD7]/30 transition-all"
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
                className="px-4 py-2 bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] rounded-xl text-xs font-bold flex items-center gap-2 shadow border border-[#EEEAD7]/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#380505] border border-[#551010] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] border border-[#EEEAD7]/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EEEAD7]">{todayEvents.length}</div>
              <div className="text-xs text-[#757D6F]">Today's Events</div>
            </div>
          </div>

          <div className="bg-[#380505] border border-[#551010] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] border border-[#EEEAD7]/20">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EEEAD7]">{roomResources.length}</div>
              <div className="text-xs text-[#757D6F]">Registered Rooms</div>
            </div>
          </div>

          <div className="bg-[#380505] border border-[#551010] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] border border-[#EEEAD7]/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EEEAD7]">{personResources.length}</div>
              <div className="text-xs text-[#757D6F]">Personnel & Staff</div>
            </div>
          </div>

          <div className="bg-[#380505] border border-[#551010] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] border border-[#EEEAD7]/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EEEAD7]">{events.length}</div>
              <div className="text-xs text-[#757D6F]">Total Scheduled Events</div>
            </div>
          </div>
        </div>

        {/* Schedule Timeline & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today Timeline */}
          <div className="lg:col-span-2 bg-[#380505] border border-[#551010] rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-[#EEEAD7] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#757D6F]" />
              <span>Today's Schedule Timeline</span>
            </h3>

            {todayEvents.length === 0 ? (
              <div className="text-center py-10 text-[#757D6F] text-xs space-y-1">
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
                    className="p-3 bg-[#1F0000] border border-[#551010] hover:border-[#6D0808] rounded-lg cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: evt.calendar?.color || '#6D0808' }}
                      />
                      <div>
                        <div className="text-xs font-bold text-[#EEEAD7]">{evt.title}</div>
                        <div className="text-[11px] text-[#757D6F] font-mono">
                          {format(new Date(evt.start), 'HH:mm')} - {format(new Date(evt.end), 'HH:mm')}
                          {evt.location ? ` • ${evt.location}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-[#6D0808] text-[#EEEAD7] border border-[#EEEAD7]/30">
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories Allocation */}
          <div className="bg-[#380505] border border-[#551010] rounded-xl p-5">
            <h3 className="text-sm font-bold text-[#EEEAD7] mb-4">Event Categories Breakdown</h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const count = events.filter((e) => e.category_id === cat.id).length
                const pct = events.length > 0 ? Math.round((count / events.length) * 100) : 0

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#EEEAD7] font-semibold flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                      <span className="text-[#757D6F] font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#1F0000] h-1.5 rounded-full overflow-hidden border border-[#551010]">
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
