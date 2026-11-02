import React, { useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CalendarView } from './components/calendar/CalendarView'
import { TimetableBuilderView } from './components/timetable/TimetableBuilderView'
import { ResourcesView } from './components/resources/ResourcesView'
import { ConferenceView } from './components/conference/ConferenceView'
import { AcademicCommandCenter } from './components/academic/AcademicCommandCenter'
import { TemporalAgentSwarmView } from './components/swarm/TemporalAgentSwarmView'
import { CrossDimensionalView } from './components/cross-dimensional/CrossDimensionalView'
import { ScenarioWorldView } from './components/scenarios/ScenarioWorldView'
import { NeuralInterfaceView } from './components/neural/NeuralInterfaceView'
import { DashboardView } from './components/dashboard/DashboardView'
import { NotificationsView } from './components/notifications/NotificationsView'
import { SettingsView } from './components/settings/SettingsView'
import { WorkspaceProfilesManager } from './components/enterprise/WorkspaceProfilesManager'
import { ThemeStudio } from './components/settings/ThemeStudio'
import { AuditLogViewer } from './components/enterprise/AuditLogViewer'
import { BurnoutShieldView } from './components/burnout/BurnoutShieldView'
import { TranscriberView } from './components/transcriber/TranscriberView'
import { AnnotationLayerView } from './components/annotation/AnnotationLayerView'
import { P2PRelayView } from './components/p2p/P2PRelayView'
import { EventModal } from './components/modals/EventModal'
import { SlotModal } from './components/modals/SlotModal'
import { CalendarModal } from './components/modals/CalendarModal'
import { TimetableModal } from './components/modals/TimetableModal'
import { SubjectModal } from './components/modals/SubjectModal'
import { AutoGenerateModal } from './components/modals/AutoGenerateModal'
import { FreeSlotFinderModal } from './components/modals/FreeSlotFinderModal'
import { WorldClockPanel } from './components/calendar/WorldClockPanel'
import { FeedSubscriptionModal } from './components/modals/FeedSubscriptionModal'
import { ExportSharingHubModal } from './components/modals/ExportSharingHubModal'
import { CommandPalette } from './components/CommandPalette'
import { ConflictPredictorPanel } from './components/ai/ConflictPredictorPanel'
import { NaturalLanguageQuickAdd } from './components/ai/NaturalLanguageQuickAdd'
import { PresentationModeView } from './components/presentation/PresentationModeView'
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal'
import { PreMeetingBriefingModal } from './components/notifications/PreMeetingBriefingModal'
import { DailyDigestModal } from './components/notifications/DailyDigestModal'
import { LiveNotificationToast } from './components/notifications/LiveNotificationToast'
import { FocusTimePromptToast } from './components/neural/FocusTimePromptToast'
import { WorkspaceLockScreen } from './components/enterprise/WorkspaceLockScreen'
import { TemplateMarketplaceModal } from './components/enterprise/TemplateMarketplaceModal'
import { AuthAccountModal } from './components/modals/AuthAccountModal'
import { LiveMeetingHud } from './components/hud/LiveMeetingHud'
import { P2PCollaborationModal } from './components/p2p/P2PCollaborationModal'
import { p2pMeshService } from './services/p2pMeshService'
import { soundService } from './services/soundService'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useAppStore, AppView } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { useWorkspaceStore } from './store/useWorkspaceStore'
import { AuthGatewayView } from './components/auth/AuthGatewayView'
import { CreateWorkspaceModal } from './components/workspace/CreateWorkspaceModal'

export const App: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setIsPresentationModeOpen,
    fetchInitialData,
    fetchNotifications,
    events,
    preMeetingBriefingEvent,
    setPreMeetingBriefingEvent,
    isLoading
  } = useAppStore()

  const { isAuthenticated } = useAuthStore()

  // F5: Global Keyboard Shortcuts Listener
  useGlobalShortcuts()

  useEffect(() => {
    useWorkspaceStore.getState().sanitizeWorkspaces()
    fetchInitialData()
    p2pMeshService.init()

    // F4: Multi-Window view routing (?view=...)
    const params = new URLSearchParams(window.location.search)
    const targetView = params.get('view')
    if (targetView) {
      if (targetView === 'presentation') {
        setIsPresentationModeOpen(true)
      } else if (
        ['calendar', 'timetable', 'resources', 'conferences', 'dashboard', 'notifications', 'profiles', 'theme-studio', 'audit-log', 'settings'].includes(targetView)
      ) {
        setCurrentView(targetView as AppView)
      }
    }

    const unsubscribe = window.api?.notifications?.onReceived
      ? window.api.notifications.onReceived((data) => {
          console.log('[Live Notification]', data)
          fetchNotifications()
        })
      : undefined

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // G2: Background pre-meeting scanner (checks for meetings starting in <= 5 minutes)
  useEffect(() => {
    const checkUpcomingMeetings = () => {
      const now = Date.now()
      const fiveMinsMs = 5 * 60 * 1000

      const upcomingSoon = events.find((evt) => {
        if (evt.status === 'cancelled') return false
        const startTs = new Date(evt.start).getTime()
        const diff = startTs - now
        return diff > 0 && diff <= fiveMinsMs
      })

      if (upcomingSoon && !preMeetingBriefingEvent) {
        const lastBriefingKey = `briefing_shown_${upcomingSoon.id}`
        if (!sessionStorage.getItem(lastBriefingKey)) {
          sessionStorage.setItem(lastBriefingKey, 'true')
          setPreMeetingBriefingEvent(upcomingSoon)
          soundService.play()
        }
      }
    }

    const interval = setInterval(checkUpcomingMeetings, 20000)
    return () => clearInterval(interval)
  }, [events, preMeetingBriefingEvent, setPreMeetingBriefingEvent])

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased select-none">
        {/* 1. App-Themed Frameless Titlebar with Window Controls */}
        <TitleBar />

        {!isAuthenticated ? (
          <AuthGatewayView />
        ) : (
          /* 2. Workspace Body: Sidebar + Main Content */
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
                    {currentView === 'conferences' && <ConferenceView />}
                    {currentView === 'academic' && <AcademicCommandCenter />}
                    {currentView === 'temporal-swarm' && <TemporalAgentSwarmView />}
                    {currentView === 'cross-dimensional' && <CrossDimensionalView />}
                    {currentView === 'scenario-worlds' && <ScenarioWorldView />}
                    {currentView === 'neural-interface' && <NeuralInterfaceView />}
                    {currentView === 'burnout-shield' && <BurnoutShieldView />}
                    {currentView === 'transcriber' && <TranscriberView />}
                    {currentView === 'annotation-layer' && <AnnotationLayerView />}
                    {currentView === 'dashboard' && <DashboardView />}
                    {currentView === 'notifications' && <NotificationsView />}
                    {currentView === 'profiles' && (
                      <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 text-[var(--text-primary)] w-full">
                        <WorkspaceProfilesManager />
                      </div>
                    )}
                    {currentView === 'theme-studio' && <ThemeStudio />}
                    {currentView === 'audit-log' && (
                      <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 text-[var(--text-primary)] w-full">
                        <AuditLogViewer />
                      </div>
                    )}
                    {currentView === 'p2p-relay' && <P2PRelayView />}
                    {currentView === 'settings' && <SettingsView />}
                  </>
                )}
              </main>
            </div>
          </div>
        )}

        {/* Global Interactive Modals */}
        <EventModal />
        <SlotModal />
        <CalendarModal />
        <TimetableModal />
        <SubjectModal />
        <AutoGenerateModal />
        <FreeSlotFinderModal />
        <WorldClockPanel />
        <FeedSubscriptionModal />
        <ExportSharingHubModal />

        {/* AI Panels */}
        <ConflictPredictorPanel />
        <NaturalLanguageQuickAdd />

        {/* Global Command Palette */}
        <CommandPalette />

        {/* Category F: Distraction-Free Presentation Mode & Shortcuts Modal */}
        <PresentationModeView />
        <KeyboardShortcutsModal />

        {/* Category G: Advanced Notifications Suite */}
        <PreMeetingBriefingModal />
        <DailyDigestModal />
        <LiveNotificationToast />
        <FocusTimePromptToast />

        {/* Category H: Enterprise Suite (Lock Screen & Template Marketplace) */}
        <TemplateMarketplaceModal />
        <WorkspaceLockScreen />
        <CreateWorkspaceModal />
        <AuthAccountModal />

        {/* Dynamic Live Meeting HUD & Smart Agenda Clock */}
        <LiveMeetingHud />

        {/* True Offline-First Peer-to-Peer CRDT Collaboration Suite */}
        <P2PCollaborationModal />
      </div>
    </ErrorBoundary>
  )
}

export default App
