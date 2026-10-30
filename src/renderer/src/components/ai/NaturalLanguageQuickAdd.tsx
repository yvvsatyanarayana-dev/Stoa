import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent } from '../../../../types'
import { parseNaturalLanguage, ParsedEvent } from '../../utils/nlpParser'
import { Sparkles, X, Calendar, Clock, MapPin, RotateCcw, Plus, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const PLACEHOLDER_EXAMPLES = [
  'Board meeting tomorrow at 3pm for 1 hour',
  'Team standup every Monday at 9:30am',
  'Client call with Sarah next Friday at 2pm in Room B',
  'Design review this Wednesday at 11am for 90 minutes',
  'Q4 planning in Conference Room 1 next Monday at 10am'
]

function formatPreviewDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  try {
    return format(parseISO(dateStr), 'EEE, MMM d yyyy')
  } catch {
    return dateStr
  }
}

function formatPreviewTime(timeStr: string | null): string {
  if (!timeStr) return 'No time set'
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'oklch(0.72 0.18 145)'
      : score >= 40
      ? 'oklch(0.82 0.18 80)'
      : 'oklch(0.65 0.22 25)'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  )
}

interface InterpretationChip {
  label: string
  parsed: ParsedEvent
}

function generateAlternatives(input: string, main: ParsedEvent): InterpretationChip[] {
  const alternatives: InterpretationChip[] = []

  // If time is ambiguous (no am/pm), suggest both interpretations
  if (main.time && !input.match(/\b(am|pm)\b/i)) {
    const [h, m] = main.time.split(':').map(Number)
    if (h >= 12) {
      // Offer AM variant
      const amParsed = { ...main, time: `${String(h - 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
      alternatives.push({ label: `at ${formatPreviewTime(amParsed.time)}`, parsed: amParsed })
    } else {
      // Offer PM variant
      const pmParsed = { ...main, time: `${String(h + 12).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
      alternatives.push({ label: `at ${formatPreviewTime(pmParsed.time)}`, parsed: pmParsed })
    }
  }

  // If duration is default (60), offer alternatives
  if (main.durationMinutes === 60 && !input.match(/\bfor\b/i)) {
    alternatives.push({ label: '30 min', parsed: { ...main, durationMinutes: 30 } })
    alternatives.push({ label: '2 hours', parsed: { ...main, durationMinutes: 120 } })
  }

  return alternatives.slice(0, 3)
}

export const NaturalLanguageQuickAdd: React.FC = () => {
  const {
    isNlpQuickAddOpen,
    setIsNlpQuickAddOpen,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedEvent | null>(null)
  const [alternatives, setAlternatives] = useState<InterpretationChip[]>([])
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cycle placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isNlpQuickAddOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isNlpQuickAddOpen])

  // Global keyboard shortcut Ctrl+Shift+N
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setIsNlpQuickAddOpen(true)
      }
      if (e.key === 'Escape' && isNlpQuickAddOpen) {
        setIsNlpQuickAddOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isNlpQuickAddOpen, setIsNlpQuickAddOpen])

  // Parse as user types
  useEffect(() => {
    if (!input.trim()) {
      setParsed(null)
      setAlternatives([])
      return
    }
    const result = parseNaturalLanguage(input)
    setParsed(result)
    setAlternatives(generateAlternatives(input, result))
  }, [input])

  const handleClose = useCallback((): void => {
    setIsNlpQuickAddOpen(false)
    setInput('')
    setParsed(null)
    setAlternatives([])
  }, [setIsNlpQuickAddOpen])

  const buildEventFromParsed = (p: ParsedEvent): CalendarEvent => {
    const now = new Date()
    let startDate = p.date ? new Date(p.date + 'T00:00:00') : new Date(now)

    if (p.time) {
      const [h, m] = p.time.split(':').map(Number)
      startDate.setHours(h, m, 0, 0)
    } else {
      startDate.setHours(9, 0, 0, 0)
    }

    const endDate = new Date(startDate.getTime() + p.durationMinutes * 60 * 1000)

    return {
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: p.title || 'New Event',
      description: '',
      location: p.location || undefined,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'medium',
      status: 'confirmed',
      rrule: p.rrule || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const handleCreate = (overrideParsed?: ParsedEvent): void => {
    const p = overrideParsed || parsed
    if (!p) return
    const evt = buildEventFromParsed(p)
    setSelectedEvent(evt)
    handleClose()
    setIsEventModalOpen(true)
  }

  if (!isNlpQuickAddOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">Natural Language Quick Add</span>
          <kbd className="ml-auto text-[9px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded">
            Ctrl+Shift+N
          </kbd>
          <button
            onClick={handleClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && parsed) handleCreate()
                if (e.key === 'Escape') handleClose()
              }}
              placeholder={`Try: ${PLACEHOLDER_EXAMPLES[placeholderIdx]}`}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-default)] transition-all"
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Preview */}
        {parsed && input.trim() && (
          <div className="px-4 pb-4 space-y-3">
            {/* Parsed fields card */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Parsed Event Preview
                </span>
                <ConfidenceBar score={parsed.confidence} />
              </div>

              <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {parsed.title || 'Untitled Event'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span>{formatPreviewDate(parsed.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span>{formatPreviewTime(parsed.time)} · {formatDuration(parsed.durationMinutes)}</span>
                </div>
                {parsed.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{parsed.location}</span>
                  </div>
                )}
                {parsed.rrule && (
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate font-mono text-[10px]">{parsed.rrule}</span>
                  </div>
                )}
              </div>

              {/* Ambiguities */}
              {parsed.ambiguities.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-0.5">
                  {parsed.ambiguities.map((amb, i) => (
                    <p key={i} className="text-[10px] text-[var(--text-muted)]">⚠ {amb}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold tracking-wider mb-1.5">
                  Interpretations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {alternatives.map((alt, i) => (
                    <button
                      key={i}
                      onClick={() => handleCreate(alt.parsed)}
                      className="px-2.5 py-1 text-[11px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {alt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create button */}
            <button
              onClick={() => handleCreate()}
              className="btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Event in Calendar</span>
            </button>
          </div>
        )}

        {/* Empty state with examples */}
        {!input.trim() && (
          <div className="px-4 pb-4">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold tracking-wider mb-2">
              Examples
            </p>
            <div className="space-y-1">
              {PLACEHOLDER_EXAMPLES.slice(0, 3).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setInput(ex)}
                  className="w-full text-left text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="text-[var(--text-muted)] mr-1.5">→</span>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
