import React, { useState, useEffect } from 'react'
import {
  Minus,
  Square,
  Copy,
  X,
  Calendar,
  Lock,
  Building2,
  Stethoscope,
  GraduationCap,
  Briefcase
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export const TitleBar: React.FC = () => {
  const { setIsWorkspaceLocked, activeProfileId, setCurrentView } = useAppStore()
  const [isMaximized, setIsMaximized] = useState(false)

  const getProfileIcon = (profileId: string) => {
    if (profileId.includes('medical')) return <Stethoscope className="w-3 h-3 text-[var(--text-secondary)]" />
    if (profileId.includes('academic')) return <GraduationCap className="w-3 h-3 text-[var(--text-secondary)]" />
    if (profileId.includes('executive')) return <Briefcase className="w-3 h-3 text-[var(--text-secondary)]" />
    return <Building2 className="w-3 h-3 text-[var(--text-secondary)]" />
  }

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
      {/* Left: Window Branding */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-2.5"
      >
        {/* Monochromatic Emblem */}
        <div className="w-5 h-5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold text-[10px] shadow-sm">
          <Calendar className="w-3 h-3 stroke-[2.2]" />
        </div>

        <div className="flex items-center">
          <span className="text-[12px] font-bold tracking-tight text-[var(--text-primary)]">
            ChronoDesk
          </span>
        </div>

        {/* Workspace Profile Pill */}
        <button
          onClick={() => setCurrentView('profiles')}
          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1.5 ml-1"
          title="Switch or Manage Workspace Profiles"
        >
          {getProfileIcon(activeProfileId)}
          <span className="capitalize">{activeProfileId.replace('prof-', '')}</span>
        </button>
      </div>

      {/* Middle: Draggable center area */}
      <div className="flex-1 h-full" />

      {/* Right: Window Control Actions matching theme */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center -mr-3 h-full"
      >
        {/* Quick Lock Button (H4) */}
        <button
          onClick={() => setIsWorkspaceLocked(true)}
          className="h-full w-9 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus:outline-none"
          title="Lock Workspace (Ctrl+Shift+L)"
          aria-label="Lock Workspace"
        >
          <Lock className="w-3 h-3" />
        </button>

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
