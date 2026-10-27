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
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable Builder', icon: <TableProperties className="w-4 h-4" /> },
    { id: 'resources', label: 'Resources & Rooms', icon: <Users className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard & Reports', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: <Bell className="w-4 h-4" />,
      badge: notificationLogs.length > 0 ? notificationLogs.length : undefined
    },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> }
  ]

  const handleNewEvent = (): void => {
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col h-screen select-none shrink-0 text-[var(--text-primary)]">
      {/* App Branding */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-sm">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              ChronoDesk <span className="text-[10px] bg-[var(--accent)] text-[var(--accent-text)] font-bold px-1.5 py-0.2 rounded">PRO</span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">Professional Scheduling</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={handleNewEvent}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2 px-3 text-xs shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 py-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[var(--accent-text)] text-[var(--accent)]' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User's Calendars List */}
      <div className="mt-4 px-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--text-muted)]">My Calendars</span>
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="Create Custom Calendar"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {calendars.map((cal) => (
            <div
              key={cal.id}
              className="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] cursor-pointer text-xs transition-colors group"
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1 truncate">
                <input
                  type="checkbox"
                  checked={cal.visible}
                  onChange={() => toggleCalendar(cal.id)}
                  className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] w-3.5 h-3.5 cursor-pointer"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-[var(--border-strong)]"
                  style={{ backgroundColor: cal.color || 'var(--accent)' }}
                />
                <span className="truncate text-[var(--text-primary)] font-medium">{cal.name}</span>
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

      {/* Footer Status */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--border-strong)] animate-pulse" />
          <span>Offline-First (Active)</span>
        </div>
        <span className="text-[10px] font-mono">B&W Monochrome</span>
      </div>
    </aside>
  )
}
