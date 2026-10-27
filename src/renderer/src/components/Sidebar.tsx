import React from 'react'
import {
  Calendar as CalendarIcon,
  TableProperties,
  Users,
  LayoutDashboard,
  Bell,
  Settings as SettingsIcon,
  Plus
} from 'lucide-react'
import { useAppStore, AppView } from '../store/useAppStore'

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    calendars,
    toggleCalendar,
    notificationLogs,
    setIsEventModalOpen,
    setSelectedEvent
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* App Branding */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              ChronoDesk <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">PRO</span>
            </h1>
            <p className="text-[11px] text-slate-400">Enterprise Scheduling</p>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          onClick={handleNewEvent}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded-full border border-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Calendars Filter List */}
      <div className="mt-4 px-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Calendars</span>
        </div>
        <div className="space-y-1">
          {calendars.map((cal) => (
            <label
              key={cal.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-800/40 cursor-pointer text-xs text-slate-300 transition-colors"
            >
              <input
                type="checkbox"
                checked={cal.visible}
                onChange={() => toggleCalendar(cal.id)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3.5 h-3.5"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cal.color }}
              />
              <span className="truncate">{cal.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Offline-First (Active)</span>
        </div>
        <span className="text-[10px] text-slate-400">v1.0</span>
      </div>
    </aside>
  )
}
