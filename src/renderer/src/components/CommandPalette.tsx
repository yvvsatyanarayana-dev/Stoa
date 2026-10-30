import React, { useEffect, useRef } from 'react';
import { useCommandPalette, Command } from '../hooks/useCommandPalette';
import { ChevronRight, Search, Keyboard, X, Zap, LayoutDashboard, Settings, Command as CommandIcon } from 'lucide-react';

interface CategoryInfo {
  label: string;
  icon: React.ReactNode;
  color: string;
}

const categoryInfo: Record<string, CategoryInfo> = {
  navigation: { label: 'Navigation', icon: <Compass size={14} />, color: 'var(--accent)' },
  actions: { label: 'Actions', icon: <Zap size={14} />, color: 'var(--accent)' },
  commands: { label: 'Commands', icon: <Keyboard size={14} />, color: 'var(--accent)' },
  settings: { label: 'Settings', icon: <Settings size={14} />, color: 'var(--text-muted)' },
  views: { label: 'Views', icon: <LayoutDashboard size={14} />, color: 'var(--text-muted)' },
};

function Compass({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 2 15 6.5 12 12 9 6.5" />
      <polygon points="22 12 17.5 15 12 12 17.5 9" />
      <polygon points="12 22 9 17.5 12 12 15 17.5" />
      <polygon points="2 12 6.5 9 12 12 6.5 15" />
    </svg>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const info = categoryInfo[category] || categoryInfo.navigation;
  return (
    <span style={{ color: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>{info.icon}</span>
  );
}

function CommandItem({ command, isSelected, onClick }: { command: Command; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      data-command-item
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
      }`}
      style={{
        borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
      }}
    >
      <CategoryIcon category={command.category} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{command.title}</span>
          {command.shortcut && (
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)] whitespace-nowrap">
              {command.shortcut}
            </kbd>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] truncate">{command.description}</p>
      </div>
      {isSelected && <ChevronRight size={16} style={{ color: 'var(--accent)' }} />}
    </div>
  );
}

function CategoryHeader({ category }: { category: string }) {
  const info = categoryInfo[category];
  return (
    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
      <span style={{ color: info.color }}>{info.icon}</span>
      {info.label}
    </div>
  );
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
    executeCommand,
  } = useCommandPalette();

  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Group commands by category for display
  const groupedCommands = filteredCommands.reduce((acc, cmd, idx) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push({ ...cmd, originalIndex: idx });
    return acc;
  }, {} as Record<string, (Command & { originalIndex: number })[]>);

  const categoryOrder: string[] = ['navigation', 'actions', 'commands', 'views', 'settings'];

  const handleKeyDownWrapper = (e: React.KeyboardEvent) => {
    handleKeyDownCapture(e);
    handleKeyDown(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-16 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={close}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div
        className="relative w-full max-w-2xl pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDownWrapper}
              placeholder="Type a command or search…"
              className="w-full h-10 pl-10 pr-4 bg-transparent border-0 outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-base font-medium"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <kbd className="px-2 py-1 text-[10px] font-mono bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)] hidden sm:inline-flex">
            <CommandIcon size={12} className="mr-1" />K
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          aria-label="Available commands"
          className="max-h-[60vh] overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-12 text-center text-[var(--text-muted)]">
              <Search className="mx-auto mb-2 text-[var(--text-muted)]" size={32} opacity={0.5} />
              <p className="text-sm">No commands found</p>
              <p className="text-[11px] mt-1">Try a different search term</p>
            </div>
          ) : (
            categoryOrder.map((category) => {
              const commands = groupedCommands[category];
              if (!commands || commands.length === 0) return null;

              return (
                <div key={category}>
                  <CategoryHeader category={category} />
                  {commands.map(({ originalIndex, ...cmd }) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      isSelected={originalIndex === selectedIndex}
                      onClick={() => {
                        setQuery('');
                        executeCommand(cmd);
                      }}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)]">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded font-mono">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded font-mono">Enter</kbd>
            <span>Execute</span>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded font-mono">Esc</kbd>
            <span>Close</span>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded font-mono">j/k</kbd>
            <span>Vim nav</span>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded font-mono">gg/G</kbd>
            <span>First/Last</span>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded font-mono">/</kbd>
            <span>Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;