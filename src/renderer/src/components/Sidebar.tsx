import React from 'react'
import {
  Calendar as CalendarIcon,
  TableProperties,
  Users,
  LayoutDashboard,
  Bell,
  Settings as SettingsIcon,
  Plus,
  Trash2
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
    setIsEventModalOpen,
    setSelectedEvent,
    setIsCalendarModalOpen
  } = useAppStore()

  const navItems: Array<{ id: AppView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    { id: 'timetable', label: 'Timetable Builder', icon: <TableProperties className="w-3.5 h-3.5" /> },
    { id: 'resources', label: 'Resources & Rooms', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'dashboard', label: 'Dashboard & Reports', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: <Bell className="w-3.5 h-3.5" />,
      badge: notificationLogs.length > 0 ? notificationLogs.length : undefined
    },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-3.5 h-3.5" /> }
  ]

  const handleNewEvent = (): void => {
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  return (
    <aside className="w-56 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col h-full select-none shrink-0 text-[var(--text-primary)] transition-colors">
      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={handleNewEvent}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Navigation Section */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)] px-2">
          Workspace
        </span>
      </div>
      <nav className="px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User's Calendars List */}
      <div className="mt-5 px-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
            Calendars
          </span>
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="Create Custom Calendar"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-0.5">
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
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity"
                  title="Delete Calendar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
