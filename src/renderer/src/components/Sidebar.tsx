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
    <aside className="w-64 bg-[#2D0000] border-r border-[#551010] flex flex-col h-screen select-none shrink-0 text-[#EEEAD7]">
      {/* App Branding */}
      <div className="p-4 border-b border-[#551010] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6D0808] border border-[#EEEAD7]/30 flex items-center justify-center shadow-md">
            <CalendarIcon className="w-4 h-4 text-[#EEEAD7]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#EEEAD7] flex items-center gap-1.5">
              ChronoDesk <span className="text-[10px] bg-[#6D0808] text-[#EEEAD7] font-bold px-1.5 py-0.5 rounded border border-[#EEEAD7]/30">PRO</span>
            </h1>
            <p className="text-[11px] text-[#757D6F]">Professional Scheduling</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={handleNewEvent}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#6D0808] hover:bg-[#8F0F0F] active:bg-[#500606] text-[#EEEAD7] text-xs font-bold rounded-lg shadow transition-all border border-[#EEEAD7]/20"
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#6D0808] text-[#EEEAD7] shadow-sm'
                  : 'text-[#757D6F] hover:bg-[#380505] hover:text-[#EEEAD7]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#EEEAD7]' : 'text-[#757D6F]'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-[10px] bg-[#380505] text-[#EEEAD7] font-bold px-1.5 py-0.5 rounded-full border border-[#551010]">
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
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#757D6F]">My Calendars</span>
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="p-1 text-[#757D6F] hover:text-[#EEEAD7] hover:bg-[#380505] rounded transition-colors"
            title="Create Custom Calendar"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {calendars.map((cal) => (
            <div
              key={cal.id}
              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#380505] cursor-pointer text-xs transition-colors group"
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1 truncate">
                <input
                  type="checkbox"
                  checked={cal.visible}
                  onChange={() => toggleCalendar(cal.id)}
                  className="rounded border-[#551010] text-[#6D0808] focus:ring-0 bg-[#1F0000] w-3.5 h-3.5"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#EEEAD7]/30"
                  style={{ backgroundColor: cal.color }}
                />
                <span className="truncate text-[#EEEAD7] font-medium">{cal.name}</span>
              </label>

              {calendars.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete calendar "${cal.name}"?`)) deleteCalendar(cal.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#757D6F] hover:text-[#EEEAD7] transition-opacity"
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
      <div className="p-3 border-t border-[#551010] bg-[#1F0000] flex items-center justify-between text-[11px] text-[#757D6F]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#757D6F] animate-pulse" />
          <span>Local-First SQLite</span>
        </div>
        <span className="text-[10px] text-[#757D6F] font-mono">ChronoDesk</span>
      </div>
    </aside>
  )
}
