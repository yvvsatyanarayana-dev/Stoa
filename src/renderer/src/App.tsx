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
import { CalendarModal } from './components/modals/CalendarModal'
import { TimetableModal } from './components/modals/TimetableModal'
import { SubjectModal } from './components/modals/SubjectModal'
import { useAppStore } from './store/useAppStore'

export const App: React.FC = () => {
  const { currentView, fetchInitialData, fetchNotifications, isLoading } = useAppStore()

  useEffect(() => {
    fetchInitialData()

    const unsubscribe = window.api.notifications.onReceived((data) => {
      console.log('[Live Notification]', data)
      fetchNotifications()
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[var(--bg-app)]">
        <Header />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-[var(--bg-app)]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)] text-xs text-[var(--text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping mr-2" />
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
      <CalendarModal />
      <TimetableModal />
      <SubjectModal />
    </div>
  )
}

export default App
