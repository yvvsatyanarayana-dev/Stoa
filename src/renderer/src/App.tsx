import React, { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CalendarView } from './components/calendar/CalendarView'
import { TimetableBuilderView } from './components/timetable/TimetableBuilderView'
import { ResourcesView } from './components/resources/ResourcesView'
import { DashboardView } from './components/dashboard/DashboardView'
import { NotificationsView } from './components/notifications/NotificationsView'
import { SettingsView } from './components/settings/SettingsView'
import { EventModal } from './components/modals/EventModal'
import { SlotModal } from './components/modals/SlotModal'
import { useAppStore } from './store/useAppStore'

export const App: React.FC = () => {
  const { currentView, fetchInitialData, fetchNotifications, isLoading } = useAppStore()

  useEffect(() => {
    // Hydrate initial data from SQLite main process
    fetchInitialData()

    // Listen for live reminder notifications pushed from the main process scheduler
    const unsubscribe = window.api.notifications.onReceived((data) => {
      console.log('[Live Notification]', data)
      fetchNotifications()
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-slate-950 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping mr-2" />
              Loading ChronoDesk Pro...
            </div>
          ) : (
            <>
              {currentView === 'calendar' && <CalendarView />}
              {currentView === 'timetable' && <TimetableBuilderView />}
              {currentView === 'resources' && <ResourcesView />}
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'notifications' && <NotificationsView />}
              {currentView === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <EventModal />
      <SlotModal />
    </div>
  )
}

export default App
