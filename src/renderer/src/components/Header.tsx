import React, { useState, useRef, useEffect } from 'react'
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
  Share2,
  Sparkles,
  ShieldAlert,
  Tv,
  AppWindow,
  Keyboard,
  Timer,
  Radio,
  MoreHorizontal
} from 'lucide-react'
import { useAppStore, CalendarViewType } from '../store/useAppStore'
import { useP2PStore } from '../store/useP2PStore'
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
    setIsExportHubOpen,
    isConflictPredictorOpen,
    setIsConflictPredictorOpen,
    isLiveMeetingHudOpen,
    setIsLiveMeetingHudOpen,
    isMissionControlOpen,
    toggleMissionControl,
    isP2PCollaborationModalOpen,
    toggleP2PCollaborationModal,
    setIsNlpQuickAddOpen,
    setIsPresentationModeOpen,
    setIsShortcutsModalOpen,
    themeMode,
    toggleThemeMode
  } = useAppStore()

  const { peers } = useP2PStore()
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)
  const toolsMenuRef = useRef<HTMLDivElement>(null)

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false)
      }
    }
    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isToolsMenuOpen])

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
    <header className="h-12 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between shrink-0 select-none text-[var(--text-primary)] transition-colors gap-3">
      {/* Left: View Title & Date Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
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
            <div className="flex items-center gap-1.5 ml-1">
              <CalendarIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap">
              {currentView === 'timetable'
                ? 'Timetable Builder'
                : currentView === 'resources'
                ? 'Resource & Room Booking'
                : currentView === 'conferences'
                ? 'Conference & Multi-Track Planner'
                : currentView === 'academic'
                ? 'Academic Mastery & Exam Hub'
                : currentView === 'temporal-swarm'
                ? 'Temporal AI Agent Swarm'
                : currentView === 'cross-dimensional'
                ? 'Cross-Dimensional 6D Life Optimizer'
                : currentView === 'neural-interface'
                ? 'Neural Calendar BCI Interface'
                : currentView === 'scenario-worlds'
                ? 'Generative Schedule Worlds & Multiverse'
                : currentView === 'burnout-shield'
                ? 'Predictive Burnout Shield & Biometrics'
                : currentView === 'transcriber'
                ? 'AI NLP Meeting Transcriber'
                : currentView === 'annotation-layer'
                ? 'Live Collaborative Annotation Layer'
                : currentView === 'dashboard'
                ? 'Analytics & Utilization Dashboard'
                : currentView === 'notifications'
                ? 'Notification Center'
                : currentView === 'profiles'
                ? 'Workspace Profiles'
                : currentView === 'theme-studio'
                ? 'Theme Studio'
                : currentView === 'audit-log'
                ? 'Security & Audit Log'
                : currentView === 'p2p-relay'
                ? 'Decentralized P2P Mesh & Vault'
                : 'System Settings'}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Sleek Segmented Switcher for Calendar Views */}
      {currentView === 'calendar' && (
        <div className="hidden md:flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[11px] font-medium shrink-0">
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

      {/* Right: Cleanly Grouped Search, HUD Docks, P2P Pill, Tools & New Event */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="relative w-36 lg:w-44 flex items-center shrink-0">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchEvents()
            }}
            className="w-full h-7 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-6 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all shadow-xs"
          />
          <kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center h-4 min-w-[14px] px-1 text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] leading-none select-none">
            ↵
          </kbd>
        </div>

        {/* NLP Quick Add */}
        <button
          onClick={() => setIsNlpQuickAddOpen(true)}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors shrink-0"
          title="Smart Natural Language Quick Add (Ctrl+Shift+N)"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-0.5" />

        {/* Live HUD & Mission Control Docks Pill */}
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] shrink-0 gap-0.5">
          {/* Live Meeting HUD Clock */}
          <button
            onClick={() => setIsLiveMeetingHudOpen(!isLiveMeetingHudOpen)}
            className={`p-1 rounded-[var(--radius-sm)] transition-all ${
              isLiveMeetingHudOpen
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
            }`}
            title="Toggle Live Meeting HUD Clock"
          >
            <Timer className="w-3.5 h-3.5" />
          </button>

          {/* Mission Control Dock */}
          <button
            onClick={toggleMissionControl}
            className={`p-1 rounded-[var(--radius-sm)] transition-all ${
              isMissionControlOpen
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
            }`}
            title="Toggle Mission Control Modular Dock (Ctrl+B)"
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>

        {/* True Offline-First P2P CRDT Collaboration Mesh Pill */}
        <button
          onClick={toggleP2PCollaborationModal}
          className={`h-7 px-2 rounded-[var(--radius-md)] border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
            isP2PCollaborationModalOpen
              ? 'bg-neutral-800 text-white border-neutral-600 shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)]'
          }`}
          title="True Offline-First P2P Mesh Collaboration (Zero Server • E2E Encrypted)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold">P2P</span>
          <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
            {peers.length}
          </span>
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-0.5" />

        {/* More Tools Dropdown Menu (Consolidates 6 auxiliary utilities) */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className={`p-1.5 rounded-[var(--radius-md)] border transition-all shrink-0 ${
              isToolsMenuOpen
                ? 'bg-[var(--bg-hover)] text-white border-neutral-600'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)]'
            }`}
            title="More Calendar & System Utilities"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {isToolsMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-2xl z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                Calendar Utilities & Tools
              </div>

              <button
                onClick={() => {
                  setIsConflictPredictorOpen(!isConflictPredictorOpen)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Conflict Predictor</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsFreeSlotFinderOpen(true)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Smart Free Slot Finder</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsWorldClockOpen(true)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>World Clock Planner</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsExportHubOpen(true)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Export & Public Hub</span>
                </div>
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-1 rounded border border-[var(--border-subtle)]">
                  Ctrl+E
                </kbd>
              </button>

              <button
                onClick={() => {
                  setIsPresentationModeOpen(true)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Wallboard Presentation</span>
                </div>
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-1 rounded border border-[var(--border-subtle)]">
                  Ctrl+P
                </kbd>
              </button>

              <div className="my-1 border-t border-[var(--border-subtle)]" />

              <button
                onClick={() => {
                  window.api?.window?.openSecondary(currentView)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <AppWindow className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Detach Window</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsShortcutsModalOpen(true)
                  setIsToolsMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Keyboard Shortcuts</span>
                </div>
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-1 rounded border border-[var(--border-subtle)]">
                  ?
                </kbd>
              </button>
            </div>
          )}
        </div>

        {/* Theme Switcher Toggle (Light <-> Dark) */}
        <button
          onClick={toggleThemeMode}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors shrink-0"
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
          className="relative p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors shrink-0"
          title="Notification Center"
        >
          <Bell className="w-3.5 h-3.5" />
          {notificationLogs.length > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>

        {/* Quick Add Event Primary High-Contrast Button */}
        <button
          onClick={() => {
            setSelectedEvent(null)
            setIsEventModalOpen(true)
          }}
          className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap flex items-center gap-1.5 ml-1"
        >
          <Plus className="w-3.5 h-3.5 text-black stroke-[2.5] shrink-0" />
          <span className="text-black font-bold whitespace-nowrap">New Event</span>
        </button>
      </div>
    </header>
  )
}
