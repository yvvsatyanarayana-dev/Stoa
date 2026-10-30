import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { X, Search, Keyboard, Command } from 'lucide-react'

interface ShortcutItem {
  id: string
  keys: string[]
  description: string
  category: 'General & Navigation' | 'Calendar & Views' | 'Creation & Actions' | 'Power Features & Displays'
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  // General & Navigation
  { id: 'palette', keys: ['Ctrl', 'K'], description: 'Open Universal Command Palette', category: 'General & Navigation' },
  { id: 'shortcuts', keys: ['?'], description: 'Show Keyboard Shortcuts Reference', category: 'General & Navigation' },
  { id: 'settings', keys: ['Ctrl', ','], description: 'Open Application Settings', category: 'General & Navigation' },
  { id: 'notifications', keys: ['Ctrl', '6'], description: 'Go to Notification Center', category: 'General & Navigation' },
  { id: 'escape', keys: ['Esc'], description: 'Close active dialog, palette or presentation', category: 'General & Navigation' },

  // Calendar & Views
  { id: 'nav-cal', keys: ['Ctrl', '1'], description: 'Switch to Calendar View', category: 'Calendar & Views' },
  { id: 'nav-time', keys: ['Ctrl', '2'], description: 'Switch to Timetable Builder View', category: 'Calendar & Views' },
  { id: 'nav-res', keys: ['Ctrl', '3'], description: 'Switch to Resources & Staff View', category: 'Calendar & Views' },
  { id: 'nav-conf', keys: ['Ctrl', '4'], description: 'Switch to Conference Run-Sheets View', category: 'Calendar & Views' },
  { id: 'nav-dash', keys: ['Ctrl', '5'], description: 'Switch to Operational Dashboard', category: 'Calendar & Views' },
  { id: 'view-today', keys: ['T'], description: 'Jump to Today in Calendar', category: 'Calendar & Views' },
  { id: 'view-day', keys: ['D'], description: 'Switch to Day View', category: 'Calendar & Views' },
  { id: 'view-week', keys: ['W'], description: 'Switch to Week View', category: 'Calendar & Views' },
  { id: 'view-month', keys: ['M'], description: 'Switch to Month View', category: 'Calendar & Views' },
  { id: 'view-agenda', keys: ['A'], description: 'Switch to Agenda List View', category: 'Calendar & Views' },

  // Creation & Actions
  { id: 'new-event', keys: ['Ctrl', 'N'], description: 'Schedule New Calendar Event', category: 'Creation & Actions' },
  { id: 'nlp-add', keys: ['Ctrl', 'Shift', 'N'], description: 'AI Natural Language Quick-Add Event', category: 'Creation & Actions' },
  { id: 'export-hub', keys: ['Ctrl', 'E'], description: 'Open Export, Sharing & iCal Hub', category: 'Creation & Actions' },

  // Power Features & Displays
  { id: 'presentation', keys: ['Ctrl', 'P'], description: 'Launch Wallboard Presentation Mode', category: 'Power Features & Displays' },
  { id: 'fullscreen', keys: ['F11'], description: 'Toggle Distraction-Free Fullscreen', category: 'Power Features & Displays' },
]

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen } = useAppStore()
  const [filterQuery, setFilterQuery] = useState('')

  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  }, [])

  const filteredShortcuts = useMemo(() => {
    if (!filterQuery.trim()) return SHORTCUTS_DATA
    const q = filterQuery.toLowerCase()
    return SHORTCUTS_DATA.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        item.keys.some((k) => k.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [filterQuery])

  if (!isShortcutsModalOpen) return null

  const categories = Array.from(new Set(filteredShortcuts.map((s) => s.category)))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)] animate-in fade-in duration-150">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-xl w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
              <Keyboard className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Every tool and view in ChronoDesk Pro is accessible via hotkey.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
            autoFocus
          />
        </div>

        {/* Shortcuts list grouped by category */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No shortcuts found matching &quot;{filterQuery}&quot;
            </div>
          ) : (
            categories.map((category) => (
              <div key={category} className="space-y-2">
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {category}
                </div>
                <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-subtle)]">
                  {filteredShortcuts
                    .filter((s) => s.category === category)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-[var(--text-primary)] font-medium">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k, idx) => {
                            const displayKey = isMac && k === 'Ctrl' ? '⌘' : k
                            return (
                              <React.Fragment key={idx}>
                                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs">
                                  {displayKey}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className="text-[10px] text-[var(--text-muted)]">+</span>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5 font-mono">
            <Command className="w-3 h-3" />
            Press <kbd className="px-1 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">?</kbd> anywhere to open
          </span>
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="px-3 py-1 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
