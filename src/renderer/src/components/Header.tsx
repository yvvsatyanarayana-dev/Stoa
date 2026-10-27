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
    <header className="h-14 bg-[#2D0000] border-b border-[#551010] px-4 flex items-center justify-between shrink-0 select-none text-[#EEEAD7]">
      {/* Left: View Title & Date Controls */}
      <div className="flex items-center gap-4">
        {currentView === 'calendar' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold rounded-md bg-[#380505] hover:bg-[#480707] text-[#EEEAD7] transition-colors border border-[#551010]"
            >
              Today
            </button>
            <div className="flex items-center bg-[#1F0000] rounded-md border border-[#551010] p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-[#380505] rounded text-[#757D6F] hover:text-[#EEEAD7] transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-[#380505] rounded text-[#757D6F] hover:text-[#EEEAD7] transition-colors"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <CalendarDays className="w-4 h-4 text-[#757D6F]" />
              <span className="text-sm font-bold text-[#EEEAD7]">{formattedDate}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#EEEAD7] capitalize">
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

      {/* Middle: Calendar View Switcher */}
      {currentView === 'calendar' && (
        <div className="flex items-center bg-[#1F0000] p-0.5 rounded-lg border border-[#551010] text-xs">
          {(['day', 'week', 'month', 'agenda'] as CalendarViewType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCalendarViewType(type)}
              className={`px-3 py-1 rounded-md capitalize font-bold transition-all ${
                calendarViewType === type
                  ? 'bg-[#6D0808] text-[#EEEAD7] shadow-sm'
                  : 'text-[#757D6F] hover:text-[#EEEAD7]'
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
          <Search className="w-3.5 h-3.5 text-[#757D6F] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchEvents()
            }}
            className="w-full bg-[#1F0000] border border-[#551010] rounded-md pl-8 pr-3 py-1 text-xs text-[#EEEAD7] placeholder-[#757D6F] focus:outline-none focus:border-[#EEEAD7] transition-colors"
          />
        </div>

        {/* Notification Icon */}
        <button
          onClick={() => setCurrentView('notifications')}
          className="relative p-1.5 text-[#757D6F] hover:text-[#EEEAD7] hover:bg-[#380505] rounded-lg transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {notificationLogs.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#6D0808] border border-[#EEEAD7]" />
          )}
        </button>

        {/* Quick Add Event */}
        <button
          onClick={() => {
            setSelectedEvent(null)
            setIsEventModalOpen(true)
          }}
          className="flex items-center gap-1.5 bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all border border-[#EEEAD7]/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </header>
  )
}
