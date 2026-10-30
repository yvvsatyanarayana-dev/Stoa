import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent } from '../../../../types'
import { Shield, ShieldAlert, Zap, AlertTriangle } from 'lucide-react'

export const FocusBlockProtector: React.FC = () => {
  const { events, calendars, createEvent, updateEvent } = useAppStore()

  // Find all protected focus blocks
  const focusBlocks = useMemo(() => {
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes('focus') ||
        e.description?.includes('[FOCUS_BLOCK]') ||
        e.description?.includes('[SHIELD]')
    )
  }, [events])

  // Check collisions between non-focus events and protected focus blocks
  const collisions = useMemo(() => {
    const list: Array<{ focusBlock: CalendarEvent; overlappingEvent: CalendarEvent }> = []

    focusBlocks.forEach((fb) => {
      const fbStart = new Date(fb.start).getTime()
      const fbEnd = new Date(fb.end).getTime()

      events.forEach((ev) => {
        if (ev.id === fb.id || ev.all_day) return
        const evStart = new Date(ev.start).getTime()
        const evEnd = new Date(ev.end).getTime()

        // Overlap test
        if (evStart < fbEnd && evEnd > fbStart) {
          list.push({ focusBlock: fb, overlappingEvent: ev })
        }
      })
    })

    return list
  }, [focusBlocks, events])

  // Quick 1-click shield creator
  const handleQuickShield = async (type: 'today_2h' | 'tomorrow_morning'): Promise<void> => {
    const now = new Date()
    let start: Date
    let end: Date
    let title = 'Deep Work Focus Block'

    if (type === 'today_2h') {
      start = new Date(now)
      // Round to next half hour
      const minutes = start.getMinutes()
      start.setMinutes(minutes >= 30 ? 60 : 30, 0, 0)
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
      title = 'Deep Focus Block (Protected 2h)'
    } else {
      start = new Date(now)
      start.setDate(start.getDate() + 1)
      start.setHours(9, 0, 0, 0)
      end = new Date(start)
      end.setHours(12, 0, 0, 0)
      title = 'Morning Focus Block (Shielded)'
    }

    const focusEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title,
      description: '[FOCUS_BLOCK] [SHIELD: strict]\nProtected uninterrupted deep work window. Auto-shields against meeting fragments.',
      start: start.toISOString(),
      end: end.toISOString(),
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'high',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await createEvent(focusEvent)
  }

  const handleResolveCollision = async (collision: { focusBlock: CalendarEvent; overlappingEvent: CalendarEvent }): Promise<void> => {
    // Shift overlapping event right after the focus block ends
    const fbEnd = new Date(collision.focusBlock.end).getTime()
    const evStart = new Date(collision.overlappingEvent.start).getTime()
    const evEnd = new Date(collision.overlappingEvent.end).getTime()
    const durMs = evEnd - evStart

    const newStart = new Date(fbEnd + 5 * 60 * 1000) // 5 min buffer
    const newEnd = new Date(newStart.getTime() + durMs)

    await updateEvent({
      ...collision.overlappingEvent,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  return (
    <div className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      {/* Left: Shield Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
          <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Focus Block Shield (C4):</span>
        </div>

        <span className="text-[11px] text-[var(--text-muted)] font-mono">
          {focusBlocks.length} protected block(s) active
        </span>

        {collisions.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            {collisions.length} Collision Detected
          </span>
        )}
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {collisions.length > 0 ? (
          <button
            type="button"
            onClick={() => handleResolveCollision(collisions[0])}
            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Shift Meeting Past Focus Shield</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => handleQuickShield('today_2h')}
          className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
          title="Shield a 2-hour deep work block today"
        >
          <Zap className="w-3 h-3 text-[var(--accent)]" />
          <span>+2h Focus Today</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickShield('tomorrow_morning')}
          className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
          title="Shield 9am - 12pm tomorrow morning"
        >
          <Shield className="w-3 h-3 text-[var(--accent)]" />
          <span>Shield Tomorrow Morning</span>
        </button>
      </div>
    </div>
  )
}
