import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Calendar as CalendarIcon,
  Plus,
  Sun,
  Moon,
  Zap,
  Globe,
  Sparkles,
  ShieldAlert
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
    setIsFreeSlotFinderOpen,
    setIsWorldClockOpen,
    isConflictPredictorOpen,
    setIsConflictPredictorOpen,
    setIsNlpQuickAddOpen,
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
    <header className="h-12 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between shrink-0 select-none text-[var(--text-primary)] transition-colors">
      {/* Left: View Title & Date Controls */}
      <div className="flex items-center gap-3">
        {currentView === 'calendar' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-medium rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors border border-[var(--border-subtle)] shadow-xs"
            >
              Today
            </button>
            <div className="flex items-center bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
                {formattedDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
              {currentView === 'timetable'
                ? 'Timetable Builder'
                : currentView === 'resources'
                ? 'Resource & Room Booking'
                : currentView === 'conferences'
                ? 'Conference & Multi-Track Planner'
                : currentView === 'dashboard'
                ? 'Analytics & Utilization Dashboard'
                : currentView === 'notifications'
                ? 'Notification Center'
                : 'System Settings'}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Sleek Segmented Switcher for Calendar Views */}
      {currentView === 'calendar' && (
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[11px] font-medium">
          {(['day', 'week', 'month', 'agenda'] as CalendarViewType[]).map((type) => {
            const isActive = calendarViewType === type
            return (
              <button
                key={type}
                onClick={() => setCalendarViewType(type)}
                className={`px-3 py-1 rounded-[var(--radius-sm)] capitalize transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      )}

      {/* Right: Search, Theme Toggle, Notification Bell & Quick Add */}
      <div className="flex items-center gap-2">
        {/* Search Input with modern shortcut pill */}
        <div className="relative w-44">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchEvents()
            }}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-10 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
          />
          <kbd className="absolute right-2 top-1.5 text-[9px] font-mono text-[var(--text-muted)] px-1 py-0.5 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded">
            ↵
          </kbd>
        </div>

        {/* Smart Natural Language Quick Add */}
        <button
          onClick={() => setIsNlpQuickAddOpen(true)}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title="Smart Natural Language Quick Add (Ctrl+Shift+N)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
        </button>

        {/* Conflict Predictor */}
        <button
          onClick={() => setIsConflictPredictorOpen(!isConflictPredictorOpen)}
          className={`p-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors ${
            isConflictPredictorOpen
              ? 'bg-[var(--accent)] text-[var(--accent-text)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
          title="Conflict & Fatigue Predictor"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>

        {/* Smart Free Slot Finder */}
        <button
          onClick={() => setIsFreeSlotFinderOpen(true)}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title="Smart Free Slot Finder"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
        </button>

        {/* World Clock & Timezone Planner */}
        <button
          onClick={() => setIsWorldClockOpen(true)}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title="World Clock & Cross-Timezone Planner"
        >
          <Globe className="w-3.5 h-3.5" />
        </button>

        {/* Theme Switcher Toggle (Light <-> Dark) */}
        <button
          onClick={toggleThemeMode}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {themeMode === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          )}
        </button>

        {/* Notification Icon */}
        <button
          onClick={() => setCurrentView('notifications')}
          className="relative p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors"
          title="Notification Center"
        >
          <Bell className="w-3.5 h-3.5" />
          {notificationLogs.length > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>

        {/* Quick Add Event Primary Button */}
        <button
          onClick={() => {
            setSelectedEvent(null)
            setIsEventModalOpen(true)
          }}
          className="btn-primary flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>New Event</span>
        </button>
      </div>
    </header>
  )
}
