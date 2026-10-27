import React, { useState, useEffect } from 'react'
import { Minus, Square, Copy, X, Calendar, ShieldCheck } from 'lucide-react'

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMax = async (): Promise<void> => {
      try {
        if (window.api?.window) {
          const max = await window.api.window.isMaximized()
          setIsMaximized(max)
        }
      } catch {}
    }
    checkMax()

    const onResize = (): void => {
      checkMax()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleMinimize = (): void => {
    window.api?.window?.minimize()
  }

  const handleMaximize = async (): Promise<void> => {
    if (window.api?.window) {
      await window.api.window.maximize()
      const max = await window.api.window.isMaximized()
      setIsMaximized(max)
    }
  }

  const handleClose = (): void => {
    window.api?.window?.close()
  }

  return (
    <div
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      onDoubleClick={handleMaximize}
      className="h-9 bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] flex items-center justify-between select-none shrink-0 px-3 z-50 text-[var(--text-primary)] transition-colors"
    >
      {/* Left: Window Branding & State */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-2.5"
      >
        {/* Monochromatic Emblem */}
        <div className="w-5 h-5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold text-[10px] shadow-sm">
          <Calendar className="w-3 h-3 stroke-[2.2]" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold tracking-tight text-[var(--text-primary)]">
            ChronoDesk<span className="font-normal opacity-60 ml-1">Pro</span>
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium tracking-wide bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 opacity-70" />
            <span>LOCAL</span>
          </span>
        </div>
      </div>

      {/* Middle: Subtle center breadcrumb indicator */}
      <div className="flex items-center gap-2 opacity-50 text-[11px] font-mono tracking-wider">
        <span>TIMETABLE & CALENDAR SUITE</span>
      </div>

      {/* Right: Window Control Actions matching theme */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center -mr-3 h-full"
      >
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="h-full w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] transition-colors duration-100 focus:outline-none"
          title="Minimize"
          aria-label="Minimize Window"
        >
          <Minus className="w-3.5 h-3.5 stroke-[1.8]" />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={handleMaximize}
          className="h-full w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] transition-colors duration-100 focus:outline-none"
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label="Maximize or Restore Window"
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 stroke-[1.8]" />
          ) : (
            <Square className="w-3 h-3 stroke-[1.8]" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="h-full w-12 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[#c92a2a] active:bg-[#a61e1e] transition-colors duration-100 focus:outline-none"
          title="Close"
          aria-label="Close Window"
        >
          <X className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  )
}
