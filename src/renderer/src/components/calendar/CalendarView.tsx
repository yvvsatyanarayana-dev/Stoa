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
import { Clock, MapPin, Video } from 'lucide-react'

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    calendarViewType,
    events,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  // Filter events by calendar visibility
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
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Days Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="p-2 border-r border-slate-800 text-center text-[10px] text-slate-500 font-semibold uppercase">
            Time
          </div>
          {days.map((day) => {
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`py-2 px-1 text-center border-r border-slate-800 last:border-r-0 ${
                  today ? 'bg-blue-600/10' : ''
                }`}
              >
                <div className="text-[11px] font-medium text-slate-400">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-sm font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 ${
                    today ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-200'
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
            <div className="border-r border-slate-800 bg-slate-900/20">
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-14 border-b border-slate-800/60 text-right pr-2 text-[10px] text-slate-400 font-mono pt-1"
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
                  className={`border-r border-slate-800 last:border-r-0 relative ${
                    today ? 'bg-blue-950/10' : ''
                  }`}
                >
                  {/* Grid hour cells */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      onClick={() => handleSlotClick(day, h)}
                      className="h-14 border-b border-slate-800/40 hover:bg-slate-800/20 cursor-pointer transition-colors"
                    />
                  ))}

                  {/* Event Blocks positioned absolutely */}
                  {dayEvents.map((evt) => {
                    const start = new Date(evt.start)
                    const end = new Date(evt.end)
                    const startHour = start.getHours() + start.getMinutes() / 60
                    const endHour = end.getHours() + end.getMinutes() / 60

                    // Calculate top and height relative to start at 7:00
                    const top = Math.max(0, (startHour - 7) * 56)
                    const height = Math.max(28, (endHour - startHour) * 56)

                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(evt, e)}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          borderLeftColor: evt.calendar?.color || '#3b82f6'
                        }}
                        className="absolute left-1 right-1 rounded-md p-1.5 text-xs bg-slate-800/90 hover:bg-slate-750 border-l-4 border border-slate-700/60 cursor-pointer shadow-sm hover:shadow-md transition-all z-10 overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-100 truncate flex items-center gap-1">
                            {evt.meeting_url && <Video className="w-3 h-3 text-blue-400 shrink-0" />}
                            <span className="truncate">{evt.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span>
                              {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                            </span>
                          </div>
                        </div>
                        {evt.location && (
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
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
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-xs text-slate-400">
              {dayEvents.length} scheduled event{dayEvents.length === 1 ? '' : 's'} today
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[80px_1fr] relative min-h-[700px]">
            <div className="border-r border-slate-800 bg-slate-900/20">
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-16 border-b border-slate-800/60 text-right pr-3 text-xs text-slate-400 font-mono pt-1"
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
                  className="h-16 border-b border-slate-800/40 hover:bg-slate-800/20 cursor-pointer transition-colors"
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
                      height: `${height}px`,
                      borderLeftColor: evt.calendar?.color || '#3b82f6'
                    }}
                    className="absolute left-3 right-6 rounded-lg p-2.5 bg-slate-800 border-l-4 border border-slate-700 cursor-pointer shadow-md hover:bg-slate-750 transition-all z-10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 text-sm flex items-center justify-between">
                        <span>{evt.title}</span>
                        {evt.priority === 'urgent' && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-semibold border border-red-500/30">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                      </div>
                    </div>
                    {evt.location && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
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
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 py-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400">
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
                className={`border-b border-r border-slate-800 p-2 flex flex-col min-h-[100px] cursor-pointer hover:bg-slate-900/40 transition-colors ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${today ? 'bg-blue-950/15' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      today ? 'bg-blue-600 text-white' : 'text-slate-400'
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
                      className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 text-slate-200 bg-slate-800 hover:bg-slate-700"
                      style={{ borderLeft: `3px solid ${evt.calendar?.color || '#3b82f6'}` }}
                    >
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-semibold px-1">
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
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-base font-bold text-slate-100 mb-2">Upcoming Schedule Agenda</h2>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No events found for the active calendars.
            </div>
          ) : (
            sorted.map((evt) => (
              <div
                key={evt.id}
                onClick={(e) => handleEventClick(evt, e)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-1.5 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: evt.calendar?.color || '#3b82f6' }}
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{evt.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {format(new Date(evt.start), 'EEE, MMM d, yyyy • HH:mm')} -{' '}
                        {format(new Date(evt.end), 'HH:mm')}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {evt.location}
                        </span>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
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
                    className="px-3 py-1.5 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30"
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
