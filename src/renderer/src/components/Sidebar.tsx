import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  TableProperties,
  Users,
  Presentation,
  LayoutDashboard,
  Bell,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Rss,
  Building2,
  Palette,
  ShieldCheck,
  Box,
  Network,
  Shield,
  Mic,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react'
import { useAppStore, AppView } from '../store/useAppStore'

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    calendars,
    toggleCalendar,
    deleteCalendar,
    notificationLogs,
    unreadNotificationsCount,
    setIsEventModalOpen,
    setSelectedEvent,
    setIsCalendarModalOpen,
    setIsFeedSubscriptionModalOpen,
    settings,
    setIsWorkspaceLocked
  } = useAppStore()

  // Collapsible section states
  const [isCoreOpen, setIsCoreOpen] = useState(true)
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(true)
  const [isOpsOpen, setIsOpsOpen] = useState(true)
  const [isSystemOpen, setIsSystemOpen] = useState(true)
  const [isCalendarsOpen, setIsCalendarsOpen] = useState(true)

  // 1. Core Scheduling
  const coreNavItems: Array<{ id: AppView; label: string; icon: React.ReactNode; shortcut?: string }> = [
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-3.5 h-3.5" />, shortcut: '1' },
    { id: 'timetable', label: 'Timetable Builder', icon: <TableProperties className="w-3.5 h-3.5" />, shortcut: '2' },
    { id: 'resources', label: 'Resources & Rooms', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'conferences', label: 'Conferences & Tracks', icon: <Presentation className="w-3.5 h-3.5" /> }
  ]

  // 2. Intelligence & Advanced Suites
  const intelligenceNavItems: Array<{ id: AppView; label: string; icon: React.ReactNode; isNew?: boolean }> = [
    { id: 'spatial-canvas', label: 'Spatial 3D Floor Plan', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'burnout-shield', label: 'Predictive Burnout Shield', icon: <Shield className="w-3.5 h-3.5" />, isNew: true },
    { id: 'transcriber', label: 'AI Meeting Transcriber', icon: <Mic className="w-3.5 h-3.5" />, isNew: true },
    { id: 'annotation-layer', label: 'Live Collaborative Layer', icon: <MessageSquare className="w-3.5 h-3.5" />, isNew: true }
  ]

  // 3. Analytics & Notifications
  const opsNavItems: Array<{ id: AppView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Analytics & Reports', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: <Bell className="w-3.5 h-3.5" />,
      badge: unreadNotificationsCount || (notificationLogs.length > 0 ? notificationLogs.length : undefined)
    }
  ]

  // 4. System & Security
  const systemNavItems: Array<{ id: AppView; label: string; icon: React.ReactNode }> = [
    { id: 'p2p-relay', label: 'P2P Mesh & Vault', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'profiles', label: 'Workspace Profiles', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'theme-studio', label: 'Theme Studio', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'audit-log', label: 'Security & Audit Log', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon className="w-3.5 h-3.5" /> }
  ]

  const handleNewEvent = (): void => {
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const renderNavGroup = (
    title: string,
    isOpen: boolean,
    toggleOpen: () => void,
    items: Array<{ id: AppView; label: string; icon: React.ReactNode; badge?: number; isNew?: boolean; shortcut?: string }>
  ) => (
    <div className="space-y-0.5">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
      >
        <span>{title}</span>
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
      </button>

      {isOpen && (
        <nav className="space-y-0.5 pt-0.5">
          {items.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`transition-colors shrink-0 ${
                      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate text-xs">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.isNew && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      PRO
                    </span>
                  )}
                  {item.badge !== undefined && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut && !isActive && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )

  return (
    <aside className="w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col h-full select-none shrink-0 text-[var(--text-primary)] transition-colors">
      {/* 1. Sleek Enterprise Workspace Banner */}
      <div className="p-3 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              CD
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">
                {settings?.company_name || 'ChronoDesk Enterprise'}
              </h2>
              <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Mesh Active
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('profiles')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded transition-colors"
            title="Switch Workspace Profile"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2.5">
          <button
            onClick={handleNewEvent}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* 2. Scrollable Navigation Hierarchy */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Core Scheduling */}
        {renderNavGroup('Core Scheduling', isCoreOpen, () => setIsCoreOpen(!isCoreOpen), coreNavItems)}

        {/* Next-Gen Intelligence */}
        {renderNavGroup('Advanced Intelligence', isIntelligenceOpen, () => setIsIntelligenceOpen(!isIntelligenceOpen), intelligenceNavItems)}

        {/* Analytics & Operations */}
        {renderNavGroup('Operations & Insights', isOpsOpen, () => setIsOpsOpen(!isOpsOpen), opsNavItems)}

        {/* System & Tools */}
        {renderNavGroup('Security & Infrastructure', isSystemOpen, () => setIsSystemOpen(!isSystemOpen), systemNavItems)}

        {/* Active Calendars List */}
        <div className="space-y-0.5 pt-1 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-2 py-1">
            <button
              onClick={() => setIsCalendarsOpen(!isCalendarsOpen)}
              className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
            >
              <span>Calendars</span>
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                {isCalendarsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsFeedSubscriptionModalOpen(true)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="Subscribe to External Feed (.ics / Webcal)"
              >
                <Rss className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsCalendarModalOpen(true)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="Create Custom Calendar"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isCalendarsOpen && (
            <div className="space-y-0.5 pt-0.5">
              {calendars.map((cal) => (
                <div
                  key={cal.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] cursor-pointer text-xs transition-colors group"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={cal.visible}
                      onChange={() => toggleCalendar(cal.id)}
                      className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] w-3.5 h-3.5 cursor-pointer accent-[var(--accent)]"
                    />
                    <span
                      className="w-2 h-2 rounded-full shrink-0 border border-current opacity-80"
                      style={{ backgroundColor: cal.color || 'var(--text-primary)' }}
                    />
                    <span className="truncate text-[var(--text-primary)] font-medium text-xs">
                      {cal.name}
                    </span>
                  </label>

                  {calendars.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete calendar "${cal.name}"?`)) deleteCalendar(cal.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-red-400 transition-opacity"
                      title="Delete Calendar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Executive Identity & Status Footer */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
        <div className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)]">
                AM
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--bg-elevated)]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                Alex Mercer
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                Administrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsWorkspaceLocked(true)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors"
              title="Lock ChronoDesk Workspace"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentView('theme-studio')}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors"
              title="Open Theme Studio"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
