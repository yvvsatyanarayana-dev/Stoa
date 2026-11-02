import React, { useEffect, useRef } from 'react'
import { useCommandPalette, Command } from '../hooks/useCommandPalette'
import {
  Command as CommandIcon,
  Search,
  X,
  ChevronRight,
  Calendar,
  Clock,
  CalendarDays,
  Table,
  LayoutDashboard,
  Users,
  Video,
  GraduationCap,
  Bot,
  Compass,
  Brain,
  Flame,
  Mic,
  PenTool,
  Palette,
  Settings,
  Bell,
  Share2,
  FileText,
  Zap,
  Layers,
  Globe
} from 'lucide-react'

function getCommandIcon(cmd: Command): React.ReactNode {
  if (cmd.icon) return cmd.icon

  const id = cmd.id.toLowerCase()
  if (id.includes('today') || id.includes('jump-date') || id.includes('calendar')) {
    return <Calendar className="w-3.5 h-3.5" />
  }
  if (id.includes('tomorrow') || id.includes('yesterday')) {
    return <Clock className="w-3.5 h-3.5" />
  }
  if (id.includes('day-view') || id.includes('week-view') || id.includes('month-view') || id.includes('agenda')) {
    return <CalendarDays className="w-3.5 h-3.5" />
  }
  if (id.includes('timetable')) return <Table className="w-3.5 h-3.5" />
  if (id.includes('dashboard') || id.includes('analytics')) return <LayoutDashboard className="w-3.5 h-3.5" />
  if (id.includes('resource')) return <Users className="w-3.5 h-3.5" />
  if (id.includes('conference')) return <Video className="w-3.5 h-3.5" />
  if (id.includes('academic')) return <GraduationCap className="w-3.5 h-3.5" />
  if (id.includes('temporal') || id.includes('swarm')) return <Bot className="w-3.5 h-3.5" />
  if (id.includes('cross-dimensional')) return <Compass className="w-3.5 h-3.5" />
  if (id.includes('scenario') || id.includes('multiverse')) return <Globe className="w-3.5 h-3.5" />
  if (id.includes('neural')) return <Brain className="w-3.5 h-3.5" />
  if (id.includes('burnout')) return <Flame className="w-3.5 h-3.5" />
  if (id.includes('transcriber')) return <Mic className="w-3.5 h-3.5" />
  if (id.includes('annotation')) return <PenTool className="w-3.5 h-3.5" />
  if (id.includes('theme') || id.includes('palette')) return <Palette className="w-3.5 h-3.5" />
  if (id.includes('settings')) return <Settings className="w-3.5 h-3.5" />
  if (id.includes('notif')) return <Bell className="w-3.5 h-3.5" />
  if (id.includes('p2p') || id.includes('sync')) return <Share2 className="w-3.5 h-3.5" />
  if (id.includes('audit')) return <FileText className="w-3.5 h-3.5" />
  if (cmd.category === 'actions') return <Zap className="w-3.5 h-3.5" />
  if (cmd.category === 'views') return <Layers className="w-3.5 h-3.5" />
  return <Search className="w-3.5 h-3.5" />
}

const CATEGORY_TITLES: Record<string, string> = {
  navigation: 'Navigation',
  actions: 'Actions & Quick Tools',
  commands: 'System & Shortcuts',
  views: 'Workspace Views',
  settings: 'Preferences & Themes'
}

function CommandItem({
  command,
  isSelected,
  onClick
}: {
  command: Command
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      data-command-item
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={`mx-2 my-0.5 px-3 py-2 rounded-[var(--radius-md)] flex items-center gap-2.5 transition-all text-xs cursor-pointer select-none ${
        isSelected
          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold shadow-xs'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-[var(--accent)] text-[var(--accent-text)]'
            : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
        }`}
      >
        {getCommandIcon(command)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate">{command.title}</span>
        </div>
        {command.description && (
          <p className="text-[10px] text-[var(--text-muted)] truncate font-normal mt-0.5">
            {command.description}
          </p>
        )}
      </div>

      {command.shortcut && (
        <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)] shrink-0">
          {command.shortcut}
        </kbd>
      )}

      {isSelected && <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />}
    </div>
  )
}

export function CommandPalette() {
  const {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    filteredCommands,
    inputRef,
    listRef,
    handleKeyDown,
    handleKeyDownCapture,
    close,
    executeCommand
  } = useCommandPalette()

  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Group commands by category for display
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd, idx) => {
      if (!acc[cmd.category]) acc[cmd.category] = []
      acc[cmd.category].push({ ...cmd, originalIndex: idx })
      return acc
    },
    {} as Record<string, (Command & { originalIndex: number })[]>
  )

  const categoryOrder: string[] = ['navigation', 'actions', 'commands', 'views', 'settings']

  const handleKeyDownWrapper = (e: React.KeyboardEvent) => {
    handleKeyDownCapture(e)
    handleKeyDown(e)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150"
        onClick={close}
        aria-hidden="true"
      />

      {/* Palette Modal Panel - Perfectly matches Natural Language Quick Add style */}
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col">
        {/* Sleek Top Header Bar */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center gap-2.5 select-none">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0 shadow-xs">
            <CommandIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Command Palette
          </span>
          <kbd className="ml-auto text-[9px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded">
            Ctrl+K
          </kbd>
          <button
            onClick={close}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors ml-1 cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" size={15} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDownWrapper}
              placeholder="Type a command or search..."
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-10 pr-9 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-0 focus:border-[var(--border-strong)] transition-all font-medium"
              autoComplete="off"
              spellCheck={false}
              aria-label="Command palette search"
              aria-autocomplete="list"
              aria-controls="command-list"
              role="combobox"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          aria-label="Available commands"
          className="max-h-80 overflow-y-auto no-scrollbar py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--text-muted)]">
              <Search className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" size={24} />
              <p className="text-xs font-medium">No matching commands found</p>
              <p className="text-[10px] mt-1 text-[var(--text-muted)]">
                Try typing a view name, tool, or shortcut
              </p>
            </div>
          ) : (
            categoryOrder.map((category) => {
              const commands = groupedCommands[category]
              if (!commands || commands.length === 0) return null

              return (
                <div key={category} className="mb-2">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold select-none">
                    {CATEGORY_TITLES[category] || category}
                  </div>
                  {commands.map(({ originalIndex, ...cmd }) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      isSelected={originalIndex === selectedIndex}
                      onClick={() => {
                        setQuery('')
                        executeCommand(cmd)
                      }}
                    />
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* Minimal Footer Info Bar */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[9px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[9px]">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[9px]">
                Esc
              </kbd>
              Close
            </span>
          </div>

          <span className="text-[10px] text-[var(--text-muted)]">
            {filteredCommands.length} command{filteredCommands.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
