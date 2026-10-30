import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { format, isToday } from 'date-fns'
import {
  Clock,
  Users,
  DoorClosed,
  TrendingUp,
  Calendar as CalendarIcon,
  Video,
  CheckCircle2,
  Plus,
  LayoutDashboard,
  BarChart2
} from 'lucide-react'
import { MeetingLoadAnalyzer } from '../ai/MeetingLoadAnalyzer'
import { TimeUseHeatmap } from '../analytics/TimeUseHeatmap'
import { MeetingFocusRatio } from '../analytics/MeetingFocusRatio'
import { ResourceUtilizationReport } from '../analytics/ResourceUtilizationReport'
import { CalendarHealthScore } from '../analytics/CalendarHealthScore'
import { TeamBottleneckDetector } from '../analytics/TeamBottleneckDetector'

export const DashboardView: React.FC = () => {
  const { events, resources, categories, setSelectedEvent, setIsEventModalOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
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
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 space-y-5 text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Segmented Tab Switcher */}
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Operations Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics & Insights</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                Live
              </span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
            Real-Time User Intelligence • {events.length} Live Schedules
          </span>
        </div>

        {/* TAB 1: OPERATIONS OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Next Meeting Banner */}
            <div className="card p-5 relative overflow-hidden shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>Next Scheduled Event</span>
                  </div>
                  <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                    {nextEvent ? nextEvent.title : 'Schedule is Clear'}
                  </h2>
                  {nextEvent ? (
                    <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                      {format(new Date(nextEvent.start), 'HH:mm')} - {format(new Date(nextEvent.end), 'HH:mm')}
                      {nextEvent.location ? ` • ${nextEvent.location}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      You have no upcoming events. Click below to schedule your next appointment or session.
                    </p>
                  )}
                </div>

                {nextEvent ? (
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-[var(--radius-md)] text-center">
                      <div className="text-[9px] text-[var(--text-muted)] uppercase font-mono tracking-wider">Starts in</div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] font-mono mt-0.5">{countdown}</div>
                    </div>

                    {nextEvent.meeting_url && (
                      <a
                        href={nextEvent.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
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
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create Event</span>
                  </button>
                )}
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="card p-3.5 flex items-center gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{todayEvents.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Today's Events</div>
                </div>
              </div>

              <div className="card p-3.5 flex items-center gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                  <DoorClosed className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{roomResources.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Rooms & Venues</div>
                </div>
              </div>

              <div className="card p-3.5 flex items-center gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{personResources.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Staff & Trainers</div>
                </div>
              </div>

              <div className="card p-3.5 flex items-center gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{events.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Total Schedules</div>
                </div>
              </div>
            </div>

            {/* AI Meeting Load Analyzer */}
            <MeetingLoadAnalyzer />

            {/* Schedule Timeline & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Today Timeline */}
              <div className="lg:col-span-2 card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Today's Timeline
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </span>
                </div>

                {todayEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No events scheduled for today.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          setSelectedEvent(evt)
                          setIsEventModalOpen(true)
                        }}
                        className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {evt.title || '(Untitled Event)'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                            {format(new Date(evt.start), 'HH:mm')} - {format(new Date(evt.end), 'HH:mm')}
                            {evt.location ? ` • ${evt.location}` : ''}
                          </div>
                        </div>
                        {evt.status === 'confirmed' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Summary */}
              <div className="card p-4 space-y-3 shadow-xs">
                <div className="pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Categories
                  </h3>
                </div>

                {categories.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No categories defined yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || 'var(--accent)' }}
                          />
                          <span className="text-[var(--text-primary)] font-medium">{cat.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* B1: Time-Use Heatmap */}
            <TimeUseHeatmap />

            {/* B2: Meeting vs. Focus Ratio */}
            <MeetingFocusRatio />

            {/* B4: Calendar Health Score */}
            <CalendarHealthScore />

            {/* B3: Resource Utilization Report */}
            <ResourceUtilizationReport />

            {/* B5: Team Bottleneck Detector */}
            <TeamBottleneckDetector />
          </div>
        )}
      </div>
    </div>
  )
}
