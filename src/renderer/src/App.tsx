import React, { useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased select-none">
      {/* 1. App-Themed Frameless Titlebar with Window Controls */}
      <TitleBar />

      {/* 2. Workspace Body: Sidebar + Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main View Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-app)]">
          <Header />

          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-[var(--bg-app)]">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-app)] text-xs text-[var(--text-muted)] gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
                <span className="font-mono text-[11px] tracking-wider uppercase opacity-80">
                  Loading Workspace...
                </span>
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
      </div>

      {/* Global Interactive Modals */}
      <EventModal />
      <SlotModal />
      <CalendarModal />
      <TimetableModal />
      <SubjectModal />
    </div>
  )
}

export default App
