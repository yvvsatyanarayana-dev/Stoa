import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useThemeStore } from '../store/useThemeStore';

// Types for commands
export interface Command {
  id: string;
  title: string;
  description: string;
  category: CommandCategory;
  icon?: React.ReactNode;
  keywords: string[];
  action: () => void | Promise<void>;
  shortcut?: string;
}

export type CommandCategory =
  | 'navigation'
  | 'actions'
  | 'commands'
  | 'settings'
  | 'views';

// Fuzzy search scoring
function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  if (!target) return 0;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;

  // Check word boundaries
  const words = t.split(/[\s\-_]+/);
  for (const word of words) {
    if (word.startsWith(q)) return 70;
    if (word === q) return 85;
  }

  // Character sequence matching (fuzzy)
  let ti = 0;
  let score = 0;
  let consecutive = 0;
  for (const ch of q) {
    const idx = t.indexOf(ch, ti);
    if (idx === -1) return 0;
    if (idx === ti) {
      consecutive++;
      score += 10 + consecutive * 5;
    } else {
      consecutive = 0;
      score += 5;
    }
    ti = idx + 1;
  }
  return Math.min(score, 60);
}

function computeScore(command: Command, query: string): number {
  if (!query.trim()) return 50;

  const q = query.toLowerCase().trim();

  // Check title
  const titleScore = fuzzyScore(q, command.title) * 1.5;

  // Check description
  const descScore = fuzzyScore(q, command.description) * 0.5;

  // Check keywords
  let keywordScore = 0;
  for (const keyword of command.keywords) {
    keywordScore = Math.max(keywordScore, fuzzyScore(q, keyword) * 1.2);
  }

  // Check category
  const categoryScore = fuzzyScore(q, command.category) * 0.3;

  return Math.max(titleScore, descScore, keywordScore, categoryScore);
}

// Default commands factory
function createDefaultCommands(
  appStore: ReturnType<typeof useAppStore.getState>,
  themeStore: ReturnType<typeof useThemeStore.getState>
): Command[] {
  const {
    setCurrentView,
    setSelectedDate,
    setCalendarViewType,
    toggleThemeMode,
    setThemeMode,
    updateSetting,
    fetchInitialData,
  } = appStore;

  const {
    themes,
    activeThemeId,
    setActiveTheme,
    setMode,
    setHighContrast,
    mode,
    highContrast,
  } = themeStore;

  const commands: Command[] = [
    // Navigation Commands
    {
      id: 'nav:today',
      title: 'Go to Today',
      description: 'Jump to current date in calendar',
      category: 'navigation',
      keywords: ['today', 'current', 'date', 'now', 'jump'],
      shortcut: 'T',
      action: () => setSelectedDate(new Date()),
    },
    {
      id: 'nav:yesterday',
      title: 'Go to Yesterday',
      description: 'Jump to previous day',
      category: 'navigation',
      keywords: ['yesterday', 'previous', 'day', 'back'],
      action: () => setSelectedDate(new Date(Date.now() - 86400000)),
    },
    {
      id: 'nav:tomorrow',
      title: 'Go to Tomorrow',
      description: 'Jump to next day',
      category: 'navigation',
      keywords: ['tomorrow', 'next', 'day', 'forward'],
      action: () => setSelectedDate(new Date(Date.now() + 86400000)),
    },
    {
      id: 'nav:jump-date',
      title: 'Jump to Date…',
      description: 'Open date picker to navigate to specific date',
      category: 'navigation',
      keywords: ['jump', 'date', 'goto', 'navigate', 'pick', 'calendar'],
      shortcut: 'G',
      action: () => {
        // This will be handled by opening a date picker modal
        const dateStr = prompt('Enter date (YYYY-MM-DD):');
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        }
      },
    },
    {
      id: 'nav:day-view',
      title: 'Day View',
      description: 'Switch calendar to day view',
      category: 'navigation',
      keywords: ['day', 'view', 'daily', 'schedule'],
      shortcut: '1',
      action: () => {
        setCalendarViewType('day');
        setCurrentView('calendar');
      },
    },
    {
      id: 'nav:week-view',
      title: 'Week View',
      description: 'Switch calendar to week view',
      category: 'navigation',
      keywords: ['week', 'view', 'weekly', 'schedule'],
      shortcut: '2',
      action: () => {
        setCalendarViewType('week');
        setCurrentView('calendar');
      },
    },
    {
      id: 'nav:month-view',
      title: 'Month View',
      description: 'Switch calendar to month view',
      category: 'navigation',
      keywords: ['month', 'view', 'monthly', 'schedule'],
      shortcut: '3',
      action: () => {
        setCalendarViewType('month');
        setCurrentView('calendar');
      },
    },
    {
      id: 'nav:agenda-view',
      title: 'Agenda View',
      description: 'Switch calendar to agenda view',
      category: 'navigation',
      keywords: ['agenda', 'view', 'list', 'schedule'],
      shortcut: '4',
      action: () => {
        setCalendarViewType('agenda');
        setCurrentView('calendar');
      },
    },
    {
      id: 'nav:timetable-view',
      title: 'Timetable Builder',
      description: 'Open timetable builder view',
      category: 'navigation',
      keywords: ['timetable', 'builder', 'schedule', 'class'],
      shortcut: '5',
      action: () => setCurrentView('timetable'),
    },
    {
      id: 'nav:dashboard-view',
      title: 'Dashboard Overview',
      description: 'Open operational dashboard and timeline',
      category: 'navigation',
      keywords: ['dashboard', 'overview', 'home', 'summary'],
      shortcut: '6',
      action: () => setCurrentView('dashboard'),
    },
    {
      id: 'nav:analytics-view',
      title: 'Analytics & Insights',
      description: 'Open Time-Use Heatmap, Health Score & Team Bottlenecks',
      category: 'navigation',
      keywords: ['analytics', 'insights', 'heatmap', 'health', 'bottlenecks', 'reports', 'metrics'],
      shortcut: '7',
      action: () => setCurrentView('dashboard'),
    },
    {
      id: 'nav:resources-view',
      title: 'Resources',
      description: 'Manage resources and rooms',
      category: 'navigation',
      keywords: ['resources', 'rooms', 'manage'],
      action: () => setCurrentView('resources'),
    },
    {
      id: 'nav:conferences-view',
      title: 'Conferences',
      description: 'Manage conferences and run-sheets',
      category: 'navigation',
      keywords: ['conferences', 'runsheet', 'events', 'manage'],
      action: () => setCurrentView('conferences'),
    },
    {
      id: 'nav:notifications-view',
      title: 'Notifications',
      description: 'View notification history',
      category: 'navigation',
      keywords: ['notifications', 'history', 'alerts', 'reminders'],
      action: () => setCurrentView('notifications'),
    },
    {
      id: 'nav:settings-view',
      title: 'Settings',
      description: 'Open settings panel',
      category: 'navigation',
      keywords: ['settings', 'preferences', 'config', 'options'],
      shortcut: '⌘,',
      action: () => setCurrentView('settings'),
    },

    // Action Commands
    {
      id: 'action:new-event',
      title: 'Create New Event',
      description: 'Create a new calendar event',
      category: 'actions',
      keywords: ['new', 'create', 'event', 'appointment', 'meeting', 'add'],
      shortcut: '⌘N',
      action: () => {
        setCurrentView('calendar');
        // The event modal will be opened via store
        appStore.setIsEventModalOpen(true);
      },
    },
    {
      id: 'action:new-timetable-slot',
      title: 'Create Timetable Slot',
      description: 'Add a new slot to active timetable',
      category: 'actions',
      keywords: ['new', 'create', 'slot', 'timetable', 'class', 'session'],
      shortcut: '⌘⇧N',
      action: () => {
        if (appStore.activeTimetableId) {
          appStore.setIsSlotModalOpen(true);
        } else {
          alert('Please select a timetable first');
        }
      },
    },
    {
      id: 'action:nlp-quick-add',
      title: 'AI Quick-Add Event',
      description: 'Create an event using natural language',
      category: 'actions',
      keywords: ['nlp', 'natural', 'language', 'ai', 'quick', 'add', 'create', 'smart'],
      shortcut: 'Ctrl+Shift+N',
      action: () => {
        appStore.setIsNlpQuickAddOpen(true);
      },
    },
    {
      id: 'action:conflict-predictor',
      title: 'Conflict Predictor',
      description: 'Scan and predict scheduling conflicts & overlaps',
      category: 'actions',
      keywords: ['conflict', 'predictor', 'overlap', 'double', 'booking', 'fatigue', 'ai'],
      action: () => {
        appStore.setIsConflictPredictorOpen(!appStore.isConflictPredictorOpen);
      },
    },
    {
      id: 'action:meeting-load-analyzer',
      title: 'Meeting Load Analyzer',
      description: 'View weekly meeting saturation and focus score',
      category: 'actions',
      keywords: ['analytics', 'load', 'analyzer', 'focus', 'fatigue', 'metrics'],
      action: () => {
        setCurrentView('dashboard');
      },
    },
    {
      id: 'action:fix-my-week',
      title: 'Fix My Week Optimizer',
      description: 'Cluster meetings and recover uninterrupted focus blocks',
      category: 'actions',
      keywords: ['fix', 'week', 'optimizer', 'cluster', 'focus', 'defrag', 'ai'],
      action: () => {
        setCurrentView('calendar');
      },
    },
    {
      id: 'action:holiday-reschedule',
      title: 'Holiday-Aware Auto-Reschedule',
      description: 'Scan and shift appointments colliding with public holidays',
      category: 'actions',
      keywords: ['holiday', 'reschedule', 'shift', 'bank', 'vacation'],
      action: () => {
        setCurrentView('calendar');
      },
    },
    {
      id: 'action:focus-shield',
      title: 'Shield 2h Focus Block',
      description: 'Block out and protect a 2-hour deep work window today',
      category: 'actions',
      keywords: ['focus', 'shield', 'block', 'deep', 'work', 'protect'],
      action: () => {
        const now = new Date();
        const start = new Date(now);
        start.setMinutes(start.getMinutes() >= 30 ? 60 : 30, 0, 0);
        const end = new Date(start.getTime() + 2 * 3600000);
        appStore.createEvent({
          id: `evt-${Date.now()}`,
          calendar_id: appStore.calendars[0]?.id || 'cal-primary',
          title: 'Deep Focus Block (Protected 2h)',
          description: '[FOCUS_BLOCK] [SHIELD: strict]\nProtected uninterrupted deep work window.',
          start: start.toISOString(),
          end: end.toISOString(),
          all_day: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          priority: 'high',
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      },
    },
    {
      id: 'action:quick-capture',
      title: 'Quick Capture Schedule',
      description: 'Quickly schedule an event note',
      category: 'actions',
      keywords: ['quick', 'capture', 'note', 'idea', 'inbox'],
      shortcut: '⌘⇧C',
      action: () => {
        const note = prompt('Quick capture:');
        if (note) {
          // Could integrate with a notes system
          console.log('Quick capture:', note);
          // For now, create an event with the note
          const now = new Date();
          const event = {
            id: `evt-${Date.now()}`,
            calendar_id: appStore.calendars[0]?.id || 'default',
            title: note,
            description: 'Quick capture note',
            location: '',
            meeting_url: '',
            start: now.toISOString(),
            end: new Date(now.getTime() + 3600000).toISOString(),
            all_day: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            rrule: undefined,
            category_id: undefined,
            priority: 'medium' as const,
            status: 'tentative' as const,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          };
          appStore.createEvent(event);
        }
      },
    },
    {
      id: 'action:new-timetable',
      title: 'Create New Timetable',
      description: 'Create a new timetable',
      category: 'actions',
      keywords: ['new', 'create', 'timetable', 'schedule'],
      action: () => {
        const name = prompt('Timetable name:');
        if (name) {
          const startDate = new Date().toISOString().split('T')[0];
          const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
          appStore.createTimetable(name, startDate, endDate);
        }
      },
    },
    {
      id: 'action:auto-generate',
      title: 'Auto-Generate Timetable',
      description: 'Generate timetable using constraint solver',
      category: 'actions',
      keywords: ['auto', 'generate', 'timetable', 'solver', 'constraint'],
      action: () => {
        appStore.setIsAutoGenerateModalOpen(true);
      },
    },
    {
      id: 'action:free-slot-finder',
      title: 'Find Free Slots',
      description: 'Find available time slots across calendars',
      category: 'actions',
      keywords: ['free', 'slots', 'available', 'finder', 'meeting'],
      action: () => {
        appStore.setIsFreeSlotFinderOpen(true);
      },
    },
    {
      id: 'action:world-clock',
      title: 'World Clock Planner',
      description: 'Plan across time zones',
      category: 'actions',
      keywords: ['world', 'clock', 'timezone', 'planner', 'meeting'],
      action: () => {
        appStore.setIsWorldClockOpen(true);
      },
    },
    {
      id: 'action:feed-subscription',
      title: 'Subscribe to ICS Feed',
      description: 'Add an external calendar feed',
      category: 'actions',
      keywords: ['feed', 'ics', 'subscribe', 'calendar', 'import', 'webcal'],
      action: () => {
        appStore.setIsFeedSubscriptionModalOpen(true);
      },
    },
    // Category D Actions
    {
      id: 'action:team-availability',
      title: 'Team Availability Overlay',
      description: 'Side-by-side multi-member heatmaps and overlap matrix',
      category: 'actions',
      keywords: ['team', 'availability', 'overlay', 'heatmap', 'matrix', 'staff', 'members'],
      action: () => {
        appStore.setCurrentView('resources');
        appStore.setResourceActiveTab('availability');
      },
    },
    {
      id: 'action:room-suggester',
      title: 'Smart Room Suggester',
      description: 'Auto-match venue based on headcount, equipment and audio/video',
      category: 'actions',
      keywords: ['room', 'suggester', 'smart', 'venue', 'capacity', 'equipment'],
      action: () => {
        appStore.setCurrentView('resources');
        appStore.setResourceActiveTab('suggester');
      },
    },
    {
      id: 'action:conflict-dashboard',
      title: 'Resource Conflict Dashboard',
      description: 'Enterprise double-booking audit and instant one-click reassign',
      category: 'actions',
      keywords: ['resource', 'conflict', 'dashboard', 'double', 'booking', 'audit', 'reassign'],
      action: () => {
        appStore.setCurrentView('resources');
        appStore.setResourceActiveTab('conflicts');
      },
    },
    {
      id: 'action:shift-roster',
      title: 'Shift Roster Builder',
      description: 'Weekly team coverage planner with rotation templates',
      category: 'actions',
      keywords: ['shift', 'roster', 'builder', 'coverage', 'rotation', 'shifts'],
      action: () => {
        appStore.setCurrentView('resources');
        appStore.setResourceActiveTab('roster');
      },
    },
    {
      id: 'action:attendance-tracker',
      title: 'Attendance Tracker',
      description: 'Live RSVP verification and check-in headcount',
      category: 'actions',
      keywords: ['attendance', 'tracker', 'rsvp', 'checkin', 'headcount', 'present'],
      action: () => {
        appStore.setCurrentView('resources');
        appStore.setResourceActiveTab('attendance');
      },
    },

    // Category E Actions (Export, Sharing & Feeds)
    {
      id: 'action:export-hub',
      title: 'Export & Sharing Hub',
      description: 'Export PDF, Excel rosters, public share links, iCal & QR cards',
      category: 'actions',
      shortcut: 'Ctrl+E',
      keywords: ['export', 'share', 'pdf', 'excel', 'ical', 'feed', 'qr', 'cards'],
      action: () => {
        appStore.setIsExportHubOpen(true);
      },
    },
    {
      id: 'action:export-pdf',
      title: 'Export Branded PDF Report',
      description: 'Generate high-resolution printable agenda and executive schedule',
      category: 'actions',
      keywords: ['pdf', 'report', 'print', 'branded', 'agenda', 'export'],
      action: () => {
        appStore.setExportHubInitialTab('pdf');
        appStore.setIsExportHubOpen(true);
      },
    },
    {
      id: 'action:export-share-link',
      title: 'Generate Public Share Link',
      description: 'Create read-only tokenized link with expiration and passcode protection',
      category: 'actions',
      keywords: ['share', 'public', 'link', 'token', 'passcode', 'web'],
      action: () => {
        appStore.setExportHubInitialTab('share');
        appStore.setIsExportHubOpen(true);
      },
    },
    {
      id: 'action:export-excel',
      title: 'Export Excel & CSV Roster',
      description: 'Formatted multi-column table export with duration and attendance statistics',
      category: 'actions',
      keywords: ['excel', 'csv', 'spreadsheet', 'roster', 'export', 'download'],
      action: () => {
        appStore.setExportHubInitialTab('excel');
        appStore.setIsExportHubOpen(true);
      },
    },
    {
      id: 'action:export-ical-feed',
      title: 'Subscribe to iCal / .ics Live Feed',
      description: 'RFC-5545 live calendar subscription endpoint for Apple, Google and Outlook',
      category: 'actions',
      keywords: ['ical', 'ics', 'webcal', 'subscription', 'feed', 'apple', 'google', 'outlook'],
      action: () => {
        appStore.setExportHubInitialTab('ical');
        appStore.setIsExportHubOpen(true);
      },
    },
    {
      id: 'action:export-qr-cards',
      title: 'Export QR Code Event Cards',
      description: 'High-contrast scannable passes and physical signages for attendees',
      category: 'actions',
      keywords: ['qr', 'code', 'cards', 'badge', 'signage', 'pass'],
      action: () => {
        appStore.setExportHubInitialTab('qr');
        appStore.setIsExportHubOpen(true);
      },
    },

    // Category F Actions (UI/UX Power Features)
    {
      id: 'action:presentation-mode',
      title: 'Wallboard Presentation Mode',
      description: 'Distraction-free wall-mounted conference display with live clock & progress',
      category: 'actions',
      shortcut: 'Ctrl+P',
      keywords: ['presentation', 'display', 'wallboard', 'kiosk', 'conference', 'full', 'screen'],
      action: () => {
        appStore.setIsPresentationModeOpen(true);
      },
    },
    {
      id: 'action:customize-dashboard',
      title: 'Customize Dashboard Layout',
      description: 'Reorder widgets and toggle visibility to personalize operational dashboard',
      category: 'actions',
      keywords: ['customize', 'dashboard', 'layout', 'widgets', 'order'],
      action: () => {
        appStore.setCurrentView('dashboard');
        appStore.setIsDashboardCustomizerOpen(true);
      },
    },
    {
      id: 'action:keyboard-shortcuts',
      title: 'Keyboard Shortcuts Cheat Sheet',
      description: 'View full cheat sheet of keyboard hotkeys and productivity shortcuts',
      category: 'actions',
      shortcut: '?',
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'cheat', 'sheet', 'help'],
      action: () => {
        appStore.setIsShortcutsModalOpen(true);
      },
    },
    {
      id: 'action:open-new-window',
      title: 'Open Calendar in New Window',
      description: 'Spawn independent native window for multi-monitor setups',
      category: 'actions',
      keywords: ['window', 'secondary', 'multi', 'monitor', 'screen', 'detach'],
      action: () => {
        window.api?.window?.openSecondary('calendar');
      },
    },
    {
      id: 'action:open-presentation-window',
      title: 'Open Presentation in New Window',
      description: 'Project presentation wallboard onto external TV or conference monitor',
      category: 'actions',
      keywords: ['presentation', 'window', 'projector', 'tv', 'display', 'screen'],
      action: () => {
        window.api?.window?.openSecondary('presentation');
      },
    },

    // Command Commands
    {
      id: 'cmd:toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      category: 'commands',
      keywords: ['toggle', 'theme', 'dark', 'light', 'mode', 'switch'],
      shortcut: '⌘⇧T',
      action: () => toggleThemeMode(),
    },
    {
      id: 'cmd:set-dark-theme',
      title: 'Set Dark Theme',
      description: 'Force dark theme',
      category: 'commands',
      keywords: ['dark', 'theme', 'night', 'mode'],
      action: () => setThemeMode('dark'),
    },
    {
      id: 'cmd:set-light-theme',
      title: 'Set Light Theme',
      description: 'Force light theme',
      category: 'commands',
      keywords: ['light', 'theme', 'day', 'mode'],
      action: () => setThemeMode('light'),
    },
    {
      id: 'cmd:toggle-high-contrast',
      title: 'Toggle High Contrast',
      description: 'Enable/disable high contrast mode',
      category: 'commands',
      keywords: ['high', 'contrast', 'accessibility', 'a11y'],
      action: () => setHighContrast(!highContrast),
    },
    {
      id: 'cmd:export-workspace',
      title: 'Export Workspace',
      description: 'Export all data as workspace bundle',
      category: 'commands',
      keywords: ['export', 'backup', 'workspace', 'bundle', 'save'],
      action: async () => {
        try {
          const password = prompt('Enter encryption password for export:');
          if (!password) return;
          await window.api?.workspaceBundle?.exportAndSave({ password });
          alert('Workspace exported successfully');
        } catch (e) {
          alert('Export failed: ' + (e instanceof Error ? e.message : String(e)));
        }
      },
    },
    {
      id: 'cmd:import-workspace',
      title: 'Import Workspace',
      description: 'Import workspace from bundle file',
      category: 'commands',
      keywords: ['import', 'restore', 'workspace', 'bundle', 'load'],
      action: async () => {
        // This would need a file picker
        alert('Use File > Import Workspace from menu');
      },
    },
    {
      id: 'cmd:sync-now',
      title: 'Sync Now',
      description: 'Trigger immediate sync with peers',
      category: 'commands',
      keywords: ['sync', 'synchronize', 'push', 'pull', 'update'],
      shortcut: '⌘S',
      action: async () => {
        try {
          await window.api?.sync?.manualSync();
          alert('Sync completed');
        } catch (e) {
          alert('Sync failed: ' + (e instanceof Error ? e.message : String(e)));
        }
      },
    },
    {
      id: 'cmd:focus-mode',
      title: 'Toggle Focus Mode',
      description: 'Toggle distraction-free focus mode',
      category: 'commands',
      keywords: ['focus', 'distraction', 'zen', 'mode', 'minimal'],
      action: () => {
        const current = document.body.classList.toggle('focus-mode');
        updateSetting('focusMode', current);
      },
    },
    {
      id: 'cmd:refresh-data',
      title: 'Refresh Data',
      description: 'Reload all data from database',
      category: 'commands',
      keywords: ['refresh', 'reload', 'update', 'fetch', 'data'],
      shortcut: '⌘R',
      action: () => fetchInitialData(),
    },
    {
      id: 'cmd:clear-notifications',
      title: 'Clear Notifications',
      description: 'Clear all notification history',
      category: 'commands',
      keywords: ['clear', 'notifications', 'history', 'dismiss', 'all'],
      action: async () => {
        if (confirm('Clear all notification history?')) {
          await window.api?.notifications?.clear();
          appStore.fetchNotifications();
        }
      },
    },

    // Settings Commands - Theme Presets
    ...themes.map((theme) => ({
      id: `settings:theme:${theme.id}`,
      title: `Theme: ${theme.name}`,
      description: theme.id === activeThemeId ? 'Current theme (active)' : 'Switch to this theme',
      category: 'settings' as CommandCategory,
      keywords: ['theme', 'preset', theme.name.toLowerCase(), 'color', 'style'],
      action: () => setActiveTheme(theme.id),
    })),

    // Settings Commands - Theme Modes
    {
      id: 'settings:mode:manual',
      title: 'Theme Mode: Manual',
      description: mode === 'manual' ? 'Current mode (active)' : 'Switch to manual theme mode',
      category: 'settings',
      keywords: ['theme', 'mode', 'manual', 'static', 'fixed'],
      action: () => setMode('manual'),
    },
    {
      id: 'settings:mode:time-of-day',
      title: 'Theme Mode: Time of Day',
      description: mode === 'time-of-day' ? 'Current mode (active)' : 'Switch to time-of-day theme mode',
      category: 'settings',
      keywords: ['theme', 'mode', 'time', 'day', 'automatic', 'dawn', 'dusk'],
      action: () => setMode('time-of-day'),
    },
    {
      id: 'settings:mode:circadian',
      title: 'Theme Mode: Circadian',
      description: mode === 'circadian' ? 'Current mode (active)' : 'Switch to circadian theme mode',
      category: 'settings',
      keywords: ['theme', 'mode', 'circadian', 'biological', 'rhythm', 'auto'],
      action: () => setMode('circadian'),
    },
    {
      id: 'settings:mode:seasonal',
      title: 'Theme Mode: Seasonal',
      description: mode === 'seasonal' ? 'Current mode (active)' : 'Switch to seasonal theme mode',
      category: 'settings',
      keywords: ['theme', 'mode', 'seasonal', 'season', 'spring', 'summer', 'autumn', 'winter'],
      action: () => setMode('seasonal'),
    },

    // Settings - General
    {
      id: 'settings:language',
      title: 'Language',
      description: 'Change application language',
      category: 'settings',
      keywords: ['language', 'locale', 'i18n', 'translation'],
      action: () => {
        const lang = prompt('Language code (en, es, fr, de, ja, zh, ko):', 'en');
        if (lang) updateSetting('language', lang);
      },
    },
    {
      id: 'settings:first-day-week',
      title: 'First Day of Week',
      description: 'Set first day of week (Sunday/Monday)',
      category: 'settings',
      keywords: ['week', 'first', 'day', 'sunday', 'monday', 'start'],
      action: () => {
        const day = prompt('First day of week (0=Sunday, 1=Monday):', '1');
        if (day !== null) updateSetting('firstDayOfWeek', parseInt(day, 10));
      },
    },
    {
      id: 'settings:time-format',
      title: 'Time Format',
      description: 'Toggle 12/24 hour time format',
      category: 'settings',
      keywords: ['time', 'format', '12', '24', 'hour', 'clock'],
      action: () => {
        const format = prompt('Time format (12 or 24):', '24');
        if (format) updateSetting('timeFormat', format === '12' ? '12h' : '24h');
      },
    },
    {
      id: 'settings:default-calendar',
      title: 'Default Calendar',
      description: 'Set default calendar for new events',
      category: 'settings',
      keywords: ['default', 'calendar', 'new', 'event', 'create'],
      action: () => {
        const calendars = appStore.calendars.map(c => `${c.id}: ${c.name}`).join('\n');
        const choice = prompt(`Select calendar ID:\n${calendars}`);
        if (choice) updateSetting('defaultCalendarId', choice.trim());
      },
    },
    {
      id: 'settings:notifications-enabled',
      title: 'Enable Notifications',
      description: 'Toggle desktop notifications',
      category: 'settings',
      keywords: ['notifications', 'enable', 'disable', 'desktop', 'alerts'],
      action: () => {
        const enabled = confirm('Enable desktop notifications?');
        updateSetting('notificationsEnabled', enabled);
      },
    },
    {
      id: 'settings:reminder-default',
      title: 'Default Reminder',
      description: 'Set default reminder time for new events',
      category: 'settings',
      keywords: ['reminder', 'default', 'time', 'alert', 'before', 'event'],
      action: () => {
        const minutes = prompt('Default reminder (minutes before):', '15');
        if (minutes !== null) updateSetting('defaultReminderMinutes', parseInt(minutes, 10));
      },
    },
  ];

  return commands;
}

export function useCommandPalette() {
  const appStore = useAppStore();
  const themeStore = useThemeStore();

  const isOpen = appStore.isCommandPaletteOpen;
  const setIsOpen = appStore.setIsCommandPaletteOpen;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands list
  const allCommands = useMemo(
    () => createDefaultCommands(appStore, themeStore),
    [
      appStore.currentView,
      appStore.calendars.length,
      appStore.activeTimetableId,
      themeStore.themes.length,
      themeStore.activeThemeId,
      themeStore.mode,
      themeStore.highContrast,
    ]
  );

  // Filter and sort commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands first, then all commands grouped by category
      const recent = allCommands.filter(c => recentCommands.includes(c.id));
      const others = allCommands.filter(c => !recentCommands.includes(c.id));
      return [...recent, ...others];
    }

    const scored = allCommands
      .map(cmd => ({ cmd, score: computeScore(cmd, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);

    return scored;
  }, [query, allCommands, recentCommands]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedIndex(filteredCommands.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        executeSelected();
        break;
      case '/':
        // Vim-style search - focus input
        if (e.target !== inputRef.current) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        break;
      case 'j':
        // Vim-style navigation down
        if (e.target === inputRef.current) return;
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'k':
        // Vim-style navigation up
        if (e.target === inputRef.current) return;
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'g':
        // Vim-style gg for first
        if (e.target === inputRef.current) return;
        // Check for double-g
        break;
      case 'G':
        // Vim-style G for last
        if (e.target === inputRef.current) return;
        e.preventDefault();
        setSelectedIndex(filteredCommands.length - 1);
        break;
    }
  }, [filteredCommands.length]);

  // Handle double-g for first item
  const lastKeyRef = useRef<string>('');
  const handleKeyDownCapture = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'g' && lastKeyRef.current === 'g' && e.target !== inputRef.current) {
      e.preventDefault();
      setSelectedIndex(0);
      lastKeyRef.current = '';
    } else {
      lastKeyRef.current = e.key;
    }
  }, []);

  // Open palette
  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [setIsOpen]);

  // Close palette
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    // Return focus to main app
    document.body.focus();
  }, [setIsOpen]);

  // Execute a specific command
  const executeCommand = useCallback((cmd: Command) => {
    // Add to recent
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== cmd.id);
      return [cmd.id, ...filtered].slice(0, 10);
    });
    cmd.action();
    close();
  }, [close]);

  // Execute selected command (by index)
  const executeSelected = useCallback(() => {
    const cmd = filteredCommands[selectedIndex];
    if (cmd) {
      executeCommand(cmd);
    }
  }, [filteredCommands, selectedIndex, executeCommand]);

  // Toggle palette
  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  // Handle global shortcut from main process
  useEffect(() => {
    const handleShortcut = () => toggle();
    window.api?.shortcuts?.onCommandPalette?.(handleShortcut);
    return () => {
      window.api?.shortcuts?.offCommandPalette?.(handleShortcut);
    };
  }, [toggle]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-command-item]');
      const selected = items[selectedIndex];
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    filteredCommands,
    inputRef,
    listRef,
    handleKeyDown,
    handleKeyDownCapture,
    open,
    close,
    toggle,
    executeCommand,
  };
}