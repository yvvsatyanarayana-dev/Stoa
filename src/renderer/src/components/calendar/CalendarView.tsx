import React from 'react'
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
import { Clock, MapPin, Video, Plus } from 'lucide-react'

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    calendarViewType,
    events,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  const visibleCalendarIds = new Set(calendars.filter((c) => c.visible).map((c) => c.id))
  const filteredEvents = events.filter((e) => visibleCalendarIds.has(e.calendar_id))

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
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  // ---------------- Render Views ----------------

  const renderWeekView = (): React.ReactElement => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00 to 20:00

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        {/* Days Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
          <div className="p-2 border-r border-[var(--border-subtle)] text-center text-[10px] text-[var(--text-muted)] font-bold uppercase">
            Time
          </div>
          {days.map((day) => {
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`py-2 px-1 text-center border-r border-[var(--border-subtle)] last:border-r-0 ${
                  today ? 'bg-[var(--cal-today-bg)]' : ''
                }`}
              >
                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-sm font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 ${
                    today
                      ? 'bg-[var(--cal-selected-bg)] text-[var(--cal-selected-text)] shadow'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time Grid with scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative min-h-[700px]">
            {/* Time labels column */}
            <div className="border-r border-[var(--cal-grid-line)] bg-[var(--bg-sidebar)]">
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
              const dayEvents = filteredEvents.filter((e) => isSameDay(new Date(e.start), day))
              const today = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-[var(--cal-grid-line)] last:border-r-0 relative ${
                    today ? 'bg-[var(--cal-today-bg)]/40' : ''
                  }`}
                >
                  {/* Grid hour cells */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      onClick={() => handleSlotClick(day, h)}
                      className="h-14 border-b border-[var(--cal-grid-line)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    />
                  ))}

                  {/* Event Blocks positioned absolutely */}
                  {dayEvents.map((evt) => {
                    const start = new Date(evt.start)
                    const end = new Date(evt.end)
                    const startHour = start.getHours() + start.getMinutes() / 60
                    const endHour = end.getHours() + end.getMinutes() / 60

                    const top = Math.max(0, (startHour - 7) * 56)
                    const height = Math.max(28, (endHour - startHour) * 56)

                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(evt, e)}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`
                        }}
                        className={`event-block absolute left-1 right-1 rounded-[var(--radius-sm)] bg-[var(--event-1-bg)] text-[var(--event-1-text)] cursor-pointer shadow-sm transition-all z-10 overflow-hidden flex flex-col justify-between ${
                          evt.status === 'tentative' ? 'tentative' : evt.status === 'cancelled' ? 'cancelled' : ''
                        }`}
                      >
                        <div>
                          <div className="font-semibold truncate flex items-center gap-1">
                            {evt.meeting_url && <Video className="w-3 h-3 shrink-0 opacity-80" />}
                            <span className="truncate">{evt.title}</span>
                          </div>
                          <div className="text-[10px] opacity-80 font-mono mt-0.5 truncate flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            <span>
                              {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                            </span>
                          </div>
                        </div>
                        {evt.location && (
                          <div className="text-[10px] opacity-80 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
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

  const renderDayView = (): React.ReactElement => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7)
    const dayEvents = filteredEvents.filter((e) => isSameDay(new Date(e.start), selectedDate))

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {dayEvents.length} scheduled event{dayEvents.length === 1 ? '' : 's'} today
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[80px_1fr] relative min-h-[700px]">
            <div className="border-r border-[var(--cal-grid-line)] bg-[var(--bg-sidebar)]">
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-16 border-b border-[var(--cal-hour-line)] text-right pr-3 text-xs text-[var(--text-muted)] font-mono pt-1"
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => handleSlotClick(selectedDate, h)}
                  className="h-16 border-b border-[var(--cal-grid-line)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                />
              ))}
              {dayEvents.map((evt) => {
                const start = new Date(evt.start)
                const end = new Date(evt.end)
                const startHour = start.getHours() + start.getMinutes() / 60
                const endHour = end.getHours() + end.getMinutes() / 60
                const top = Math.max(0, (startHour - 7) * 64)
                const height = Math.max(36, (endHour - startHour) * 64)

                return (
                  <div
                    key={evt.id}
                    onClick={(e) => handleEventClick(evt, e)}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`
                    }}
                    className={`event-block absolute left-3 right-6 rounded-[var(--radius-md)] p-2.5 bg-[var(--event-1-bg)] text-[var(--event-1-text)] cursor-pointer shadow-md transition-all z-10 flex flex-col justify-between ${
                      evt.status === 'tentative' ? 'tentative' : evt.status === 'cancelled' ? 'cancelled' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm flex items-center justify-between">
                        <span>{evt.title}</span>
                        {evt.priority === 'urgent' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-current">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-80 font-mono mt-1">
                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                      </div>
                    </div>
                    {evt.location && (
                      <div className="text-xs opacity-80 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{evt.location}</span>
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

  const renderMonthView = (): React.ReactElement => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] py-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-bold text-[var(--text-secondary)]">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {days.map((day) => {
            const dayEvents = filteredEvents.filter((e) => isSameDay(new Date(e.start), day))
            const today = isToday(day)
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth()

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleSlotClick(day, 9)}
                className={`border-b border-r border-[var(--cal-grid-line)] p-2 flex flex-col min-h-[100px] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${today ? 'bg-[var(--cal-today-bg)]' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      today ? 'bg-[var(--cal-selected-bg)] text-[var(--cal-selected-text)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1 overflow-y-auto flex-1">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => handleEventClick(evt, e)}
                      className="event-block text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] truncate font-semibold bg-[var(--event-1-bg)] text-[var(--event-1-text)]"
                    >
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-[var(--text-muted)] font-bold px-1">
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

  const renderAgendaView = (): React.ReactElement => {
    const sorted = [...filteredEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    return (
      <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-app)] text-[var(--text-primary)]">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Upcoming Schedule Agenda</h2>
            <button
              onClick={() => {
                setSelectedEvent(null)
                setIsEventModalOpen(true)
              }}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16 card p-8 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Your schedule is completely clear.</p>
              <p className="text-xs text-[var(--text-muted)]">Click "+ Create Event" or click any slot on the calendar grid to add your first event.</p>
              <button
                onClick={() => {
                  setSelectedEvent(null)
                  setIsEventModalOpen(true)
                }}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Event</span>
              </button>
            </div>
          ) : (
            sorted.map((evt) => (
              <div
                key={evt.id}
                onClick={(e) => handleEventClick(evt, e)}
                className="card p-4 cursor-pointer hover:border-[var(--border-strong)] transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-12 rounded-full bg-[var(--border-strong)] shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{evt.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        {format(new Date(evt.start), 'EEE, MMM d, yyyy • HH:mm')} -{' '}
                        {format(new Date(evt.end), 'HH:mm')}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          {evt.location}
                        </span>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2">
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
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join</span>
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (calendarViewType === 'day') return renderDayView()
  if (calendarViewType === 'month') return renderMonthView()
  if (calendarViewType === 'agenda') return renderAgendaView()
  return renderWeekView()
}
