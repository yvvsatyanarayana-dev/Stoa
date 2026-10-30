import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useGlobalShortcuts(): void {
  const {
    currentView,
    setCurrentView,
    setSelectedDate,
    setCalendarViewType,
    setIsEventModalOpen,
    setSelectedEvent,
    setIsNlpQuickAddOpen,
    setIsExportHubOpen,
    isPresentationModeOpen,
    setIsPresentationModeOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isDashboardCustomizerOpen,
    setIsDashboardCustomizerOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isEventModalOpen,
    isSlotModalOpen,
    setIsSlotModalOpen,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    isTimetableModalOpen,
    setIsTimetableModalOpen,
    isSubjectModalOpen,
    setIsSubjectModalOpen,
    isFreeSlotFinderOpen,
    setIsFreeSlotFinderOpen,
    isWorldClockOpen,
    setIsWorldClockOpen,
    isFeedSubscriptionModalOpen,
    setIsFeedSubscriptionModalOpen,
    isExportHubOpen,
    isDailyDigestOpen,
    setIsDailyDigestOpen,
    preMeetingBriefingEvent,
    setPreMeetingBriefingEvent
  } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isInputActive =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement ||
        (document.activeElement as HTMLElement)?.isContentEditable

      const isCtrlOrCmd = e.ctrlKey || e.metaKey

      // Escape key handles closing modals in priority order
      if (e.key === 'Escape') {
        if (preMeetingBriefingEvent) {
          setPreMeetingBriefingEvent(null)
          return
        }
        if (isDailyDigestOpen) {
          setIsDailyDigestOpen(false)
          return
        }
        if (isPresentationModeOpen) {
          setIsPresentationModeOpen(false)
          return
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false)
          return
        }
        if (isDashboardCustomizerOpen) {
          setIsDashboardCustomizerOpen(false)
          return
        }
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false)
          return
        }
        if (isExportHubOpen) {
          setIsExportHubOpen(false)
          return
        }
        if (isFreeSlotFinderOpen) {
          setIsFreeSlotFinderOpen(false)
          return
        }
        if (isWorldClockOpen) {
          setIsWorldClockOpen(false)
          return
        }
        if (isFeedSubscriptionModalOpen) {
          setIsFeedSubscriptionModalOpen(false)
          return
        }
        if (isEventModalOpen) {
          setIsEventModalOpen(false)
          return
        }
        if (isSlotModalOpen) {
          setIsSlotModalOpen(false)
          return
        }
        if (isCalendarModalOpen) {
          setIsCalendarModalOpen(false)
          return
        }
        if (isTimetableModalOpen) {
          setIsTimetableModalOpen(false)
          return
        }
        if (isSubjectModalOpen) {
          setIsSubjectModalOpen(false)
          return
        }
        return
      }

      // F11: Fullscreen Presentation Mode toggle
      if (e.key === 'F11') {
        e.preventDefault()
        setIsPresentationModeOpen(!isPresentationModeOpen)
        return
      }

      // Ctrl / Cmd combinations (work globally even inside inputs)
      if (isCtrlOrCmd) {
        // Ctrl+K: Command Palette
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault()
          setIsCommandPaletteOpen(!isCommandPaletteOpen)
          return
        }

        // Ctrl+Shift+N: NLP Quick Add
        if (e.shiftKey && e.key.toLowerCase() === 'n') {
          e.preventDefault()
          setIsNlpQuickAddOpen(true)
          return
        }

        // Ctrl+N: Create New Event
        if (!e.shiftKey && e.key.toLowerCase() === 'n') {
          e.preventDefault()
          setSelectedEvent(null)
          setIsEventModalOpen(true)
          return
        }

        // Ctrl+E: Export & Sharing Hub
        if (e.key.toLowerCase() === 'e') {
          e.preventDefault()
          setIsExportHubOpen(true)
          return
        }

        // Ctrl+P: Wallboard Presentation Mode
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault()
          setIsPresentationModeOpen(true)
          return
        }

        // Ctrl+,: Settings
        if (e.key === ',') {
          e.preventDefault()
          setCurrentView('settings')
          return
        }

        // Ctrl+1: Calendar View
        if (e.key === '1') {
          e.preventDefault()
          setCurrentView('calendar')
          return
        }

        // Ctrl+2: Timetable View
        if (e.key === '2') {
          e.preventDefault()
          setCurrentView('timetable')
          return
        }

        // Ctrl+3: Resources View
        if (e.key === '3') {
          e.preventDefault()
          setCurrentView('resources')
          return
        }

        // Ctrl+4: Conferences View
        if (e.key === '4') {
          e.preventDefault()
          setCurrentView('conferences')
          return
        }

        // Ctrl+5: Dashboard View
        if (e.key === '5') {
          e.preventDefault()
          setCurrentView('dashboard')
          return
        }

        // Ctrl+6: Notifications View
        if (e.key === '6') {
          e.preventDefault()
          setCurrentView('notifications')
          return
        }
      }

      // Single-key shortcuts (active ONLY when not typing in an input)
      if (!isInputActive && !isCtrlOrCmd && !e.altKey) {
        // ? : Keyboard shortcuts modal
        if (e.key === '?') {
          e.preventDefault()
          setIsShortcutsModalOpen(true)
          return
        }

        // T: Jump to Today
        if (e.key.toLowerCase() === 't') {
          e.preventDefault()
          setSelectedDate(new Date())
          if (currentView !== 'calendar') {
            setCurrentView('calendar')
          }
          return
        }

        // D: Day View
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault()
          setCalendarViewType('day')
          if (currentView !== 'calendar') {
            setCurrentView('calendar')
          }
          return
        }

        // W: Week View
        if (e.key.toLowerCase() === 'w') {
          e.preventDefault()
          setCalendarViewType('week')
          if (currentView !== 'calendar') {
            setCurrentView('calendar')
          }
          return
        }

        // M: Month View
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault()
          setCalendarViewType('month')
          if (currentView !== 'calendar') {
            setCurrentView('calendar')
          }
          return
        }

        // A: Agenda View
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault()
          setCalendarViewType('agenda')
          if (currentView !== 'calendar') {
            setCurrentView('calendar')
          }
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentView,
    setCurrentView,
    setSelectedDate,
    setCalendarViewType,
    setIsEventModalOpen,
    setSelectedEvent,
    setIsNlpQuickAddOpen,
    setIsExportHubOpen,
    isPresentationModeOpen,
    setIsPresentationModeOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isDashboardCustomizerOpen,
    setIsDashboardCustomizerOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isEventModalOpen,
    isSlotModalOpen,
    setIsSlotModalOpen,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    isTimetableModalOpen,
    setIsTimetableModalOpen,
    isSubjectModalOpen,
    setIsSubjectModalOpen,
    isFreeSlotFinderOpen,
    setIsFreeSlotFinderOpen,
    isWorldClockOpen,
    setIsWorldClockOpen,
    isFeedSubscriptionModalOpen,
    setIsFeedSubscriptionModalOpen,
    isExportHubOpen
  ])
}
