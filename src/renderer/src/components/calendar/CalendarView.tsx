import React, { useState, useEffect, useMemo } from 'react'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth
} from 'date-fns'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent } from '../../../../types'
import {
  Clock,
  MapPin,
  Video,
  Plus,
  Calendar as CalendarIcon,
  Globe,
  CalendarOff,
  Sparkles,
  Shield,
  Repeat,
  Share2,
  QrCode,
  Zap,
  Radio,
  Check,
  Activity
} from 'lucide-react'
import { expandRecurringEvents } from '../../utils/recurrenceEngine'
import { getHolidaysForYear, scanHolidayConflicts, detectSystemHolidayRegion } from '../../utils/holidayEngine'
import { FocusBlockProtector } from './FocusBlockProtector'
import { HolidayRescheduleModal } from '../modals/HolidayRescheduleModal'
import { FixMyWeekModal } from '../modals/FixMyWeekModal'
import { DayFlowOptimizerModal } from '../optimizer/DayFlowOptimizerModal'
import { EnergyFlowWaveOverlay } from './EnergyFlowWaveOverlay'
import { MissionControlDock } from '../mission-control/MissionControlDock'

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    calendarViewType,
    events,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen,
    setIsWorldClockOpen,
    setIsExportHubOpen,
    setExportHubInitialTab,
    isMissionControlOpen,
    toggleMissionControl,
    isEnergyFlowWaveVisible,
    toggleEnergyFlowWave,
    isDayFlowOptimizerOpen,
    setIsDayFlowOptimizerOpen,
    toggleP2PCollaborationModal
  } = useAppStore()

  // Track live current time for the red "now" indicator line
  const [currentTime, setCurrentTime] = useState(new Date())

  // Modal / panel states for Category C features
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false)
  const [isFixMyWeekOpen, setIsFixMyWeekOpen] = useState<boolean>(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const visibleCalendarIds = new Set(calendars.filter((c) => c.visible).map((c) => c.id))
  const filteredEvents = events.filter((e) => visibleCalendarIds.has(e.calendar_id))

  // Compute view bounds
  const currentViewRange = useMemo(() => {
    if (calendarViewType === 'day') {
      const start = new Date(selectedDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(selectedDate)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (calendarViewType === 'month') {
      const monthStart = startOfMonth(selectedDate)
      const monthEnd = endOfMonth(monthStart)
      const start = startOfWeek(monthStart, { weekStartsOn: 1 })
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
      return { start, end }
    }
    // Week or Agenda
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return { start, end }
  }, [selectedDate, calendarViewType])

  // C1: Flexi-Recurrence expanded events in real time
  const expandedEvents = useMemo(() => {
    return expandRecurringEvents(filteredEvents, currentViewRange.start, currentViewRange.end)
  }, [filteredEvents, currentViewRange])

  // C2: Public holidays for current year
  const publicHolidays = useMemo(() => {
    const year = selectedDate.getFullYear()
    return getHolidaysForYear(year, detectSystemHolidayRegion())
  }, [selectedDate])

  const holidayConflicts = useMemo(() => {
    return scanHolidayConflicts(events, detectSystemHolidayRegion())
  }, [events])

  const getCalendarColor = (calId: string): string => {
    const cal = calendars.find((c) => c.id === calId)
    return cal?.color || 'var(--accent)'
  }

  const handleSlotClick = (date: Date, hour: number): void => {
    const start = new Date(date)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1, 0, 0, 0)

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'medium',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSelectedEvent(newEvent)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent): void => {
    e.stopPropagation()
    // If it's an expanded occurrence, find original event
    const origId = event.id.includes('_occ_') ? event.id.split('_occ_')[0] : event.id
    const origEvent = events.find((ev) => ev.id === origId) || event
    setSelectedEvent(origEvent)
    setIsEventModalOpen(true)
  }

  // ---------------- Render Week View ----------------
  const renderWeekView = (): React.ReactElement => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 to 21:00

    // Current time position in pixels
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
    const nowTop = (currentHour - 7) * 56
    const isNowVisible = currentHour >= 7 && currentHour <= 22

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        {/* Days Header */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/80 shrink-0 select-none backdrop-blur-xs">
          <div className="p-2 border-r border-[var(--border-default)] flex items-center justify-center text-[10px] text-[var(--text-muted)] font-mono font-medium tracking-wider">
            GMT
          </div>
          {days.map((day) => {
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`py-2 px-1 text-center border-r border-[var(--border-default)] last:border-r-0 transition-colors ${
                  today ? 'bg-[var(--cal-today-bg)]' : ''
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 transition-all ${
                    today
                      ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm font-black'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {/* Holiday Badge (Feature C2) */}
                {(() => {
                  const hDay = publicHolidays.find((h) => isSameDay(new Date(`${h.date}T00:00:00`), day))
                  return hDay ? (
                    <div className="mt-0.5 px-1 py-0.2 rounded-xs bg-amber-500/10 text-amber-500 text-[8px] font-semibold truncate flex items-center justify-center gap-0.5" title={hDay.name}>
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{hDay.name}</span>
                    </div>
                  ) : null
                })()}

                {/* Cognitive Flow & Fragmentation Radar Badge */}
                {(() => {
                  const dayEvents = expandedEvents.filter((e) => isSameDay(new Date(e.start), day) && e.status !== 'cancelled')
                  if (dayEvents.length >= 4) {
                    return (
                      <div className="mt-0.5 px-1 py-0.2 rounded-xs bg-rose-500/10 text-rose-400 text-[8px] font-mono font-semibold truncate flex items-center justify-center gap-0.5" title={`${dayEvents.length} meetings — high context switching`}>
                        <Activity className="w-2.5 h-2.5 shrink-0" />
                        <span>{dayEvents.length} Mts</span>
                      </div>
                    )
                  }
                  if (dayEvents.length > 0) {
                    return (
                      <div className="mt-0.5 px-1 py-0.2 rounded-xs bg-indigo-500/10 text-indigo-400 text-[8px] font-mono font-semibold truncate flex items-center justify-center gap-0.5" title="Balanced cognitive pace">
                        <Zap className="w-2.5 h-2.5 shrink-0" />
                        <span>{dayEvents.length} Mts</span>
                      </div>
                    )
                  }
                  return (
                    <div className="mt-0.5 px-1 py-0.2 rounded-xs bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-semibold truncate flex items-center justify-center gap-0.5" title="Unbroken deep focus runway">
                      <Check className="w-2.5 h-2.5 shrink-0" />
                      <span>Deep Flow</span>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Time Grid with smooth scroll */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] relative min-h-[840px]">
            {/* Neuro-Cognitive Ultradian Energy Flow Waveform Overlay */}
            <EnergyFlowWaveOverlay />

            {/* Time labels column */}
            <div className="border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] select-none">
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-14 border-b border-[var(--cal-hour-line)] text-right pr-2 text-[10px] text-[var(--text-muted)] font-mono pt-1"
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayEvents = expandedEvents.filter((e) => isSameDay(new Date(e.start), day))
              const today = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-[var(--cal-grid-line)] last:border-r-0 relative ${
                    today ? 'bg-[var(--cal-today-bg)]/20' : ''
                  }`}
                >
                  {/* Grid hour cells */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      onClick={() => handleSlotClick(day, h)}
                      className="h-14 border-b border-[var(--cal-grid-line)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                      title={`Click to schedule at ${String(h).padStart(2, '0')}:00`}
                    />
                  ))}

                  {/* Live Now Indicator Line */}
                  {today && isNowVisible && (
                    <div
                      style={{ top: `${nowTop}px` }}
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-sm animate-pulse" />
                      <div className="flex-1 h-[1.5px] bg-rose-500" />
                    </div>
                  )}

                  {/* Event Blocks */}
                  {dayEvents.map((evt) => {
                    const start = new Date(evt.start)
                    const end = new Date(evt.end)
                    const startHour = start.getHours() + start.getMinutes() / 60
                    const endHour = end.getHours() + end.getMinutes() / 60

                    const top = Math.max(0, (startHour - 7) * 56)
                    const height = Math.max(26, (endHour - startHour) * 56)
                    const calColor = getCalendarColor(evt.calendar_id)
                    const isFocus = Boolean(
                      evt.title?.toLowerCase().includes('focus') ||
                      evt.description?.includes('[FOCUS_BLOCK]') ||
                      evt.description?.includes('[SHIELD]')
                    )
                    const isRecur = Boolean(evt.rrule || evt.id.includes('_occ_'))

                    // Clean title: strip leading emojis/symbols and verbose tags
                    let displayTitle = (evt.title || '(Untitled Event)')
                      .replace(/^[\s🎯🛡️🛡️\u200B\uFE0F]+/, '')
                      .trim()
                    if (isFocus && displayTitle.includes('(Do Not Disturb)')) {
                      displayTitle = displayTitle.replace(/\s*\(Do Not Disturb\)/i, '').trim()
                    }
                    if (!displayTitle) displayTitle = isFocus ? 'Focus Time' : '(Untitled Event)'

                    const accentColor = isFocus ? '#818cf8' : calColor
                    const bgStyle = isFocus
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'var(--bg-elevated)'

                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(evt, e)}
                        title={`${displayTitle} (${format(start, 'HH:mm')} - ${format(end, 'HH:mm')})`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          borderLeftColor: accentColor,
                          backgroundColor: bgStyle
                        }}
                        className={`absolute left-1 right-1 rounded-md p-2 border border-[var(--border-subtle)]/80 border-l-[3px] text-[var(--text-primary)] cursor-pointer shadow-xs hover:shadow-md hover:border-[var(--border-strong)] transition-all z-10 overflow-hidden flex flex-col justify-between select-none ${
                          evt.status === 'tentative'
                            ? 'opacity-75 border-dashed'
                            : evt.status === 'cancelled'
                            ? 'line-through opacity-40'
                            : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold truncate flex items-center gap-1.5 leading-tight">
                            {isFocus ? (
                              <Shield className="w-2.5 h-2.5 shrink-0 text-indigo-400" />
                            ) : isRecur ? (
                              <Repeat className="w-2.5 h-2.5 shrink-0 text-[var(--text-muted)]" />
                            ) : evt.meeting_url ? (
                              <Video className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                            ) : null}
                            <span className="truncate">{displayTitle}</span>
                          </div>
                          {height >= 36 && (
                            <div className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5 truncate flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 shrink-0 opacity-60" />
                              <span>
                                {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                              </span>
                            </div>
                          )}
                        </div>

                        {evt.location && height >= 50 && (
                          <div className="text-[9px] text-[var(--text-secondary)] truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0 opacity-60" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------------- Render Day View ----------------
  const renderDayView = (): React.ReactElement => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 7)
    const dayEvents = expandedEvents.filter((e) => isSameDay(new Date(e.start), selectedDate))
    const today = isToday(selectedDate)

    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
    const nowTop = (currentHour - 7) * 64
    const isNowVisible = currentHour >= 7 && currentHour <= 22

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        {/* Day Header */}
        <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'} scheduled
            </p>
          </div>
          <button
            onClick={() => {
              handleSlotClick(selectedDate, 9)
            }}
            className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Day Schedule Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[64px_1fr] relative min-h-[960px]">
            {/* Time labels column */}
            <div className="border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] select-none">
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-16 border-b border-[var(--cal-hour-line)] text-right pr-3 text-[11px] text-[var(--text-muted)] font-mono pt-1"
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Event slots column */}
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => handleSlotClick(selectedDate, h)}
                  className="h-16 border-b border-[var(--cal-grid-line)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                />
              ))}

              {/* Live Now Indicator */}
              {today && isNowVisible && (
                <div
                  style={{ top: `${nowTop}px` }}
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 -ml-1.5 shadow-sm animate-pulse" />
                  <div className="flex-1 h-[2px] bg-rose-500" />
                </div>
              )}

              {/* Day Events */}
              {dayEvents.map((evt) => {
                const start = new Date(evt.start)
                const end = new Date(evt.end)
                const startHour = start.getHours() + start.getMinutes() / 60
                const endHour = end.getHours() + end.getMinutes() / 60
                const top = Math.max(0, (startHour - 7) * 64)
                const height = Math.max(38, (endHour - startHour) * 64)
                const calColor = getCalendarColor(evt.calendar_id)
                const isFocus = Boolean(
                  evt.title?.toLowerCase().includes('focus') ||
                  evt.description?.includes('[FOCUS_BLOCK]') ||
                  evt.description?.includes('[SHIELD]')
                )
                const isRecur = Boolean(evt.rrule || evt.id.includes('_occ_'))

                let displayTitle = (evt.title || '(Untitled Event)')
                  .replace(/^[\s🎯🛡️🛡️\u200B\uFE0F]+/, '')
                  .trim()
                if (isFocus && displayTitle.includes('(Do Not Disturb)')) {
                  displayTitle = displayTitle.replace(/\s*\(Do Not Disturb\)/i, '').trim()
                }
                if (!displayTitle) displayTitle = isFocus ? 'Focus Time' : '(Untitled Event)'

                const accentColor = isFocus ? '#818cf8' : calColor
                const bgStyle = isFocus
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'var(--bg-elevated)'

                return (
                  <div
                    key={evt.id}
                    onClick={(e) => handleEventClick(evt, e)}
                    title={`${displayTitle} (${format(start, 'HH:mm')} - ${format(end, 'HH:mm')})`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      borderLeftColor: accentColor,
                      backgroundColor: bgStyle
                    }}
                    className={`absolute left-3 right-6 rounded-md p-3 border border-[var(--border-subtle)]/80 border-l-4 text-[var(--text-primary)] cursor-pointer shadow-xs hover:shadow-md hover:border-[var(--border-strong)] transition-all z-10 flex flex-col justify-between ${
                      evt.status === 'tentative'
                        ? 'opacity-75 border-dashed'
                        : evt.status === 'cancelled'
                        ? 'line-through opacity-40'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          {isFocus ? (
                            <Shield className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                          ) : isRecur ? (
                            <Repeat className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                          ) : evt.meeting_url ? (
                            <Video className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          ) : null}
                          <span className="truncate">{displayTitle}</span>
                        </div>
                        {evt.priority === 'urgent' && (
                          <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-70" />
                        <span>
                          {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    {evt.location && (
                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 opacity-70" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- Render Month View ----------------
  const renderMonthView = (): React.ReactElement => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] py-2 select-none">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {days.map((day) => {
            const dayEvents = expandedEvents.filter((e) => isSameDay(new Date(e.start), day))
            const today = isToday(day)
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
            const hDay = publicHolidays.find((h) => isSameDay(new Date(`${h.date}T00:00:00`), day))

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleSlotClick(day, 9)}
                className={`border-b border-r border-[var(--cal-grid-line)] p-1.5 flex flex-col min-h-[90px] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${today ? 'bg-[var(--cal-today-bg)]/30' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      today
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {hDay && (
                    <span className="text-[8px] font-bold text-amber-500 uppercase truncate max-w-[80px] flex items-center gap-0.5" title={hDay.name}>
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{hDay.name}</span>
                    </span>
                  )}
                </div>
                <div className="space-y-1 overflow-y-auto flex-1">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const isFocus = Boolean(
                      evt.title?.toLowerCase().includes('focus') ||
                      evt.description?.includes('[FOCUS_BLOCK]') ||
                      evt.description?.includes('[SHIELD]')
                    )
                    const calColor = isFocus ? '#818cf8' : getCalendarColor(evt.calendar_id)
                    let displayTitle = (evt.title || '(Untitled)')
                      .replace(/^[\s🎯🛡️🛡️\u200B\uFE0F]+/, '')
                      .trim()
                    if (isFocus && displayTitle.includes('(Do Not Disturb)')) {
                      displayTitle = displayTitle.replace(/\s*\(Do Not Disturb\)/i, '').trim()
                    }
                    if (!displayTitle) displayTitle = isFocus ? 'Focus Time' : '(Untitled)'

                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(evt, e)}
                        title={displayTitle}
                        className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] truncate font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center gap-1 hover:border-[var(--border-strong)] transition-colors"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: calColor }}
                        />
                        <span className="truncate text-[var(--text-primary)]">
                          {displayTitle}
                        </span>
                      </div>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-[var(--text-muted)] font-mono font-medium px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------------- Render Agenda View ----------------
  const renderAgendaView = (): React.ReactElement => {
    const sorted = [...expandedEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    return (
      <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-app)] text-[var(--text-primary)] w-full">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Upcoming Agenda
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                {sorted.length} scheduled item{sorted.length === 1 ? '' : 's'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEvent(null)
                setIsEventModalOpen(true)
              }}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Create Event</span>
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16 card p-8 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <CalendarIcon className="w-5 h-5 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Your schedule is clean and empty
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                No events currently scheduled. Click below or pick any slot on the calendar grid to build your schedule.
              </p>
              <button
                onClick={() => {
                  setSelectedEvent(null)
                  setIsEventModalOpen(true)
                }}
                className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create First Event</span>
              </button>
            </div>
          ) : (
            sorted.map((evt) => {
              const calColor = getCalendarColor(evt.calendar_id)
              const isFocus = Boolean(
                evt.title?.toLowerCase().includes('focus') ||
                evt.description?.includes('[FOCUS_BLOCK]') ||
                evt.description?.includes('[SHIELD]')
              )
              const isRecur = Boolean(evt.rrule || evt.id.includes('_occ_'))

              let displayTitle = (evt.title || '(Untitled Event)')
                .replace(/^[\s🎯🛡️🛡️\u200B\uFE0F]+/, '')
                .trim()
              if (isFocus && displayTitle.includes('(Do Not Disturb)')) {
                displayTitle = displayTitle.replace(/\s*\(Do Not Disturb\)/i, '').trim()
              }
              if (!displayTitle) displayTitle = isFocus ? 'Focus Time' : '(Untitled Event)'

              const accentColor = isFocus ? '#818cf8' : calColor

              return (
                <div
                  key={evt.id}
                  onClick={(e) => handleEventClick(evt, e)}
                  title={displayTitle}
                  className="card p-3.5 cursor-pointer hover:border-[var(--border-strong)] transition-all flex items-start justify-between group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-1 h-10 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isFocus ? (
                          <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : isRecur ? (
                          <Repeat className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        ) : evt.meeting_url ? (
                          <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : null}
                        <h3 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {displayTitle}
                        </h3>
                        {evt.priority === 'urgent' && (
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-60" />
                          {format(new Date(evt.start), 'EEE, MMM d • HH:mm')} -{' '}
                          {format(new Date(evt.end), 'HH:mm')}
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <MapPin className="w-3 h-3 opacity-60" />
                            <span className="truncate">{evt.location}</span>
                          </span>
                        )}
                      </div>
                      {evt.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-1">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {evt.meeting_url && (
                    <a
                      href={evt.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 shrink-0 ml-3"
                    >
                      <Video className="w-3 h-3" />
                      <span>Join</span>
                    </a>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Stoa Nexus Power Toolbar */}
      <div className="bg-[var(--bg-subtle)]/50 backdrop-blur-xs border-b border-[var(--border-subtle)] px-4 py-1.5 flex items-center justify-between gap-2 shrink-0 select-none text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Autonomous Nexus Day-Flow Optimizer */}
          <button
            type="button"
            onClick={() => setIsDayFlowOptimizerOpen(true)}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-white text-black font-bold flex items-center gap-1.5 hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
            title="Autonomous schedule compaction & Deep Work recovery"
          >
            <Sparkles className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span className="text-black font-bold">Nexus Optimizer</span>
          </button>

          {/* Neuro-Cognitive Energy Flow Waves Toggle */}
          <button
            type="button"
            onClick={toggleEnergyFlowWave}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] border font-medium flex items-center gap-1.5 transition-colors ${
              isEnergyFlowWaveVisible
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
            }`}
            title="Toggle circadian & ultradian peak energy curve overlays"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Flow Waves</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFixMyWeekOpen(true)}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Cluster fragmented meetings and recover deep work"
          >
            <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Cluster Week</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHolidayModalOpen(true)}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] border font-medium flex items-center gap-1.5 transition-colors ${
              holidayConflicts.length > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
            }`}
            title="Scan & shift appointments colliding with public holidays"
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Holiday Reschedule</span>
            {holidayConflicts.length > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-black">
                {holidayConflicts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsWorldClockOpen(true)}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1.5 transition-colors"
            title="Open live multi-city world clock"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>World Clock</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExportHubInitialTab('pdf')
              setIsExportHubOpen(true)
            }}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1.5 transition-colors"
            title="Open Export, Reports & Share Hub"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export & Share</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExportHubInitialTab('qr')
              setIsExportHubOpen(true)
            }}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1.5 transition-colors"
            title="Generate Smart QR Event Pass"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Pass</span>
          </button>

          {/* True Offline-First P2P Mesh Collaboration */}
          <button
            type="button"
            onClick={toggleP2PCollaborationModal}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-emerald-400 font-medium flex items-center gap-1.5 transition-colors"
            title="True Offline-First P2P Collaboration (Zero Server • CRDT Sync & QR Invite)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>P2P Sync</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] hidden xl:inline">
            {expandedEvents.length} events active
          </span>

          {/* Toggle Mission Control Split Dock */}
          <button
            type="button"
            onClick={toggleMissionControl}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] border font-medium flex items-center gap-1.5 transition-all ${
              isMissionControlOpen
                ? 'bg-white text-black border-white font-bold shadow-sm hover:bg-neutral-200'
                : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
            }`}
            title="Toggle Mission Control Dock (Ctrl+B)"
          >
            <Radio className={`w-3.5 h-3.5 ${isMissionControlOpen ? 'text-black stroke-[2.5]' : ''}`} />
            <span className={isMissionControlOpen ? 'text-black font-bold' : ''}>Mission Control</span>
          </button>
        </div>
      </div>

      {/* Focus Block Protector Bar */}
      <FocusBlockProtector />

      {/* Main Calendar View Body + Split Mission Control Dock */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {calendarViewType === 'day' && renderDayView()}
          {calendarViewType === 'month' && renderMonthView()}
          {calendarViewType === 'agenda' && renderAgendaView()}
          {calendarViewType === 'week' && renderWeekView()}
        </div>

        {/* Mission Control Modular Dock */}
        <MissionControlDock />
      </div>

      {/* Interactive Panels & Modals */}
      <HolidayRescheduleModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
      />
      <FixMyWeekModal
        isOpen={isFixMyWeekOpen}
        onClose={() => setIsFixMyWeekOpen(false)}
      />
      <DayFlowOptimizerModal
        isOpen={isDayFlowOptimizerOpen}
        onClose={() => setIsDayFlowOptimizerOpen(false)}
      />
    </div>
  )
}
