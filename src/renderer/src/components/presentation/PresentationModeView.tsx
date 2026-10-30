import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  X,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
  MapPin,
  Users,
  Tv
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'

export const PresentationModeView: React.FC = () => {
  const { isPresentationModeOpen, setIsPresentationModeOpen, events, settings } = useAppStore()

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Real-time ticking clock every 1 second
  useEffect(() => {
    if (!isPresentationModeOpen) return
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isPresentationModeOpen])

  // Esc key listener to exit
  useEffect(() => {
    if (!isPresentationModeOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
        setIsPresentationModeOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPresentationModeOpen, setIsPresentationModeOpen])

  // Today's events
  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e.status !== 'cancelled' && isSameDay(new Date(e.start), currentTime))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, currentTime])

  // Current live ongoing session (if any)
  const currentLiveSession = useMemo(() => {
    const nowTs = currentTime.getTime()
    return (
      todayEvents.find((e) => {
        const s = new Date(e.start).getTime()
        const end = new Date(e.end).getTime()
        return nowTs >= s && nowTs <= end
      }) || null
    )
  }, [todayEvents, currentTime])

  // Next upcoming session
  const nextSession = useMemo(() => {
    const nowTs = currentTime.getTime()
    return todayEvents.find((e) => new Date(e.start).getTime() > nowTs) || null
  }, [todayEvents, currentTime])

  // Elapsed progress percentage of live session
  const liveProgressPercent = useMemo(() => {
    if (!currentLiveSession) return 0
    const start = new Date(currentLiveSession.start).getTime()
    const end = new Date(currentLiveSession.end).getTime()
    const now = currentTime.getTime()
    const total = end - start
    if (total <= 0) return 0
    const elapsed = Math.max(0, Math.min(total, now - start))
    return Math.round((elapsed / total) * 100)
  }, [currentLiveSession, currentTime])

  // Minutes remaining in live session
  const liveRemainingMins = useMemo(() => {
    if (!currentLiveSession) return 0
    const end = new Date(currentLiveSession.end).getTime()
    const diff = Math.max(0, end - currentTime.getTime())
    return Math.ceil(diff / (1000 * 60))
  }, [currentLiveSession, currentTime])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  if (!isPresentationModeOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col p-8 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
            <Tv className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase text-neutral-100">
              {settings?.company_name || 'ChronoDesk Enterprise'}
            </h1>
            <p className="text-[11px] font-mono text-neutral-400">
              Live Conference & Session Presentation Display
            </p>
          </div>
        </div>

        {/* Presentation Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Toggle Native Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen()
              setIsPresentationModeOpen(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
            title="Exit Presentation Mode (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Exit Mode</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 py-6 min-h-0 overflow-hidden">
        {/* Left Column: Huge Live Clock & Current Live Session */}
        <div className="flex-1 flex flex-col justify-between space-y-6 min-h-0">
          {/* Big Digital Clock & Date */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-2xl space-y-1">
            <div className="text-[12px] font-mono uppercase tracking-widest text-neutral-400">
              Official Reference Time
            </div>
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-base font-medium text-neutral-300 font-mono pt-1">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>

          {/* Current Live Session Spotlight Card */}
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 font-mono">
                    {currentLiveSession ? 'Happening Right Now' : 'Schedule Standby'}
                  </span>
                </div>

                {currentLiveSession && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {liveRemainingMins}m remaining
                  </span>
                )}
              </div>

              {currentLiveSession ? (
                <div className="space-y-3 pt-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    {currentLiveSession.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>
                        {format(new Date(currentLiveSession.start), 'HH:mm')} –{' '}
                        {format(new Date(currentLiveSession.end), 'HH:mm')}
                      </span>
                    </div>

                    {currentLiveSession.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{currentLiveSession.location}</span>
                      </div>
                    )}

                    {currentLiveSession.attendees && currentLiveSession.attendees.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-neutral-400" />
                        <span>{currentLiveSession.attendees.length} Attendees</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-2">
                  <h2 className="text-2xl font-bold text-neutral-300">
                    No Session Currently Active
                  </h2>
                  <p className="text-sm text-neutral-400">
                    {nextSession
                      ? `Next Session: "${nextSession.title}" starts at ${format(new Date(nextSession.start), 'HH:mm')}`
                      : 'All scheduled sessions for today have concluded.'}
                  </p>
                </div>
              )}
            </div>

            {/* Live Progress Bar */}
            {currentLiveSession && (
              <div className="space-y-1.5 pt-4 relative z-10">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Session Elapsed</span>
                  <span>{liveProgressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${liveProgressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Agenda Rail */}
        <div className="w-full lg:w-[420px] rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-6 flex flex-col min-h-0 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-black uppercase tracking-wider text-neutral-200">
                Today's Itinerary
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {todayEvents.length} session(s)
            </span>
          </div>

          {/* Scrollable list of sessions */}
          <div className="flex-1 overflow-y-auto space-y-3 pt-4 pr-1">
            {todayEvents.length > 0 ? (
              todayEvents.map((evt) => {
                const s = new Date(evt.start)
                const e = new Date(evt.end)
                const isLive = currentLiveSession?.id === evt.id
                const isPast = e.getTime() < currentTime.getTime()

                return (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isLive
                        ? 'bg-neutral-800/90 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : isPast
                        ? 'bg-neutral-950/40 border-neutral-850/60 opacity-50'
                        : 'bg-neutral-900/80 border-neutral-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-xs font-mono font-bold text-neutral-400 flex items-center gap-1.5">
                          <span>{format(s, 'HH:mm')} – {format(e, 'HH:mm')}</span>
                          {isLive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500 text-black">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white leading-snug">
                          {evt.title}
                        </div>
                      </div>

                      {evt.location && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                          {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                No events scheduled on today's calendar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
