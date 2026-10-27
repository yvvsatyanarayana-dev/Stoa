import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  CalendarDays,
  Plus
} from 'lucide-react'
import { useAppStore, CalendarViewType } from '../store/useAppStore'
import { format, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from 'date-fns'

export const Header: React.FC = () => {
  const {
    currentView,
    selectedDate,
    setSelectedDate,
    calendarViewType,
    setCalendarViewType,
    searchQuery,
    setSearchQuery,
    fetchEvents,
    notificationLogs,
    setCurrentView,
    setIsEventModalOpen,
    setSelectedEvent
  } = useAppStore()

  const handlePrev = (): void => {
    if (calendarViewType === 'day') setSelectedDate(subDays(selectedDate, 1))
    else if (calendarViewType === 'week') setSelectedDate(subWeeks(selectedDate, 1))
    else if (calendarViewType === 'month') setSelectedDate(subMonths(selectedDate, 1))
  }

  const handleNext = (): void => {
    if (calendarViewType === 'day') setSelectedDate(addDays(selectedDate, 1))
    else if (calendarViewType === 'week') setSelectedDate(addWeeks(selectedDate, 1))
    else if (calendarViewType === 'month') setSelectedDate(addMonths(selectedDate, 1))
  }

  const handleToday = (): void => {
    setSelectedDate(new Date())
  }

  const formattedDate = format(selectedDate, 'MMMM yyyy')

  return (
    <header className="h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left: View Title & Date Controls */}
      <div className="flex items-center gap-4">
        {currentView === 'calendar' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            >
              Today
            </button>
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-slate-100">{formattedDate}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100 capitalize">
              {currentView === 'timetable'
                ? 'Timetable Builder'
                : currentView === 'resources'
                ? 'Resource & Room Booking'
                : currentView === 'dashboard'
                ? 'Analytics & Utilization Dashboard'
                : currentView === 'notifications'
                ? 'Notification Center'
                : 'System Settings'}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Calendar View Switcher (when on calendar view) */}
      {currentView === 'calendar' && (
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          {(['day', 'week', 'month', 'agenda'] as CalendarViewType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCalendarViewType(type)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                calendarViewType === type
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Right: Search, Notification Bell & Quick Add */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search events... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchEvents()
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Notification Icon */}
        <button
          onClick={() => setCurrentView('notifications')}
          className="relative p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {notificationLogs.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>

        {/* Quick Add */}
        <button
          onClick={() => {
            setSelectedEvent(null)
            setIsEventModalOpen(true)
          }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </header>
  )
}
