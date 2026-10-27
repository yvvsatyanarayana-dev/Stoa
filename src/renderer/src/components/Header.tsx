import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  CalendarDays,
  Plus,
  Sun,
  Moon
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
    setSelectedEvent,
    themeMode,
    toggleThemeMode
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
    <header className="h-14 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between shrink-0 select-none text-[var(--text-primary)]">
      {/* Left: View Title & Date Controls */}
      <div className="flex items-center gap-4">
        {currentView === 'calendar' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
            >
              Today
            </button>
            <div className="flex items-center bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-default)] p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <CalendarDays className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">{formattedDate}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
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
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs">
          {(['day', 'week', 'month', 'agenda'] as CalendarViewType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCalendarViewType(type)}
              className={`px-3 py-1 rounded-[var(--radius-sm)] capitalize font-semibold transition-all ${
                calendarViewType === type
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Right: Search, Theme Toggle, Notification Bell & Quick Add */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search events... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchEvents()
            }}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
          />
        </div>

        {/* Theme Switcher Toggle (Light <-> Dark) */}
        <button
          onClick={toggleThemeMode}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {themeMode === 'dark' ? (
            <Sun className="w-4 h-4 text-[var(--text-primary)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--text-primary)]" />
          )}
        </button>

        {/* Notification Icon */}
        <button
          onClick={() => setCurrentView('notifications')}
          className="relative p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {notificationLogs.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
          )}
        </button>

        {/* Quick Add Event */}
        <button
          onClick={() => {
            setSelectedEvent(null)
            setIsEventModalOpen(true)
          }}
          className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </header>
  )
}
