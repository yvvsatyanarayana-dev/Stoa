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
  Lock,
  LogOut,
  Check,
  Building
} from 'lucide-react'
import { useAppStore, AppView } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'

export const Sidebar: React.FC = () => {
  const { currentUser, setIsAuthModalOpen, logout } = useAuthStore()
  const {
    workspaces,
    activeWorkspaceId,
    getActiveWorkspace,
    setActiveWorkspaceId,
    setIsCreateWorkspaceModalOpen
  } = useWorkspaceStore()

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const activeWorkspace = getActiveWorkspace()
  const wsInitials =
    activeWorkspace.name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'WS'
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
  const intelligenceNavItems: Array<{ id: AppView; label: string; icon: React.ReactNode }> = [
    { id: 'spatial-canvas', label: 'Spatial 3D Floor Plan', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'burnout-shield', label: 'Predictive Burnout Shield', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'transcriber', label: 'AI Meeting Transcriber', icon: <Mic className="w-3.5 h-3.5" /> },
    { id: 'annotation-layer', label: 'Live Collaborative Layer', icon: <MessageSquare className="w-3.5 h-3.5" /> }
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
    items: Array<{ id: AppView; label: string; icon: React.ReactNode; badge?: number; shortcut?: string }>
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
      <div className="p-3 pb-2 border-b border-[var(--border-subtle)] relative">
        <div
          onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
          className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--border-default)] transition-all cursor-pointer group"
          title="Click to Switch or Create Real-Time Workspaces"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs text-white"
              style={{ backgroundColor: activeWorkspace.color || 'var(--accent)' }}
            >
              {wsInitials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight group-hover:underline">
                {activeWorkspace.name}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {activeWorkspace.domain || 'Workspace'}
              </p>
            </div>
          </div>
          <div className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] p-1 rounded transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Real-time Workspace Popover Dropdown */}
        {isWorkspaceDropdownOpen && (
          <div className="absolute top-14 left-3 right-3 z-50 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span>Workspaces</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{workspaces.length} total</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5 py-0.5">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id)
                      setIsWorkspaceDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold border border-[var(--border-subtle)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ws.color }}
                      />
                      <span className="truncate text-xs">{ws.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="pt-1.5 border-t border-[var(--border-subtle)] space-y-1">
              <button
                onClick={() => {
                  setIsWorkspaceDropdownOpen(false)
                  setIsCreateWorkspaceModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Workspace</span>
              </button>

              <button
                onClick={() => {
                  setIsWorkspaceDropdownOpen(false)
                  setCurrentView('profiles')
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Workspace Settings</span>
              </button>
            </div>
          </div>
        )}

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
        {renderNavGroup('Schedule', isCoreOpen, () => setIsCoreOpen(!isCoreOpen), coreNavItems)}

        {/* Tools & Advanced Intelligence */}
        {renderNavGroup('Tools', isIntelligenceOpen, () => setIsIntelligenceOpen(!isIntelligenceOpen), intelligenceNavItems)}

        {/* Reports & Operations */}
        {renderNavGroup('Reports', isOpsOpen, () => setIsOpsOpen(!isOpsOpen), opsNavItems)}

        {/* System & Settings */}
        {renderNavGroup('System', isSystemOpen, () => setIsSystemOpen(!isSystemOpen), systemNavItems)}

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
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity group cursor-pointer"
            title="Manage User Account or Sign In with Google"
          >
            <div className="relative shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)]">
                  {currentUser?.initials || 'U'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--bg-elevated)]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:underline">
                {currentUser?.name || 'Account'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                {currentUser?.role || 'Guest'}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-0.5 shrink-0">
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
            <button
              onClick={logout}
              className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-subtle)] rounded transition-colors"
              title="Sign Out / Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
