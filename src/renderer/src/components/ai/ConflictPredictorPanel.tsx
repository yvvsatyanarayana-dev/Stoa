import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent } from '../../../../types'
import { ShieldAlert, X, CheckCircle2, AlertTriangle, AlertCircle, ExternalLink, Plane, Car, Footprints } from 'lucide-react'
import { format } from 'date-fns'
import { estimateOfflineTransit, TransitEstimate } from '../../utils/transitEngine'

interface ConflictIssue {
  id: string
  type: 'overlap' | 'back_to_back' | 'resource_conflict' | 'outside_hours' | 'travel_overlap'
  severity: 'warning' | 'error'
  eventId: string
  eventTitle: string
  message: string
  relatedEventId?: string
  transitDetails?: TransitEstimate & { origin: string; destination: string; gapMinutes: number }
}

function detectConflicts(events: CalendarEvent[]): ConflictIssue[] {
  const issues: ConflictIssue[] = []
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i]
    const evStart = new Date(ev.start).getTime()
    const evEnd = new Date(ev.end).getTime()
    const startHour = new Date(ev.start).getHours()
    const endHour = new Date(ev.end).getHours()
    const endMin = new Date(ev.end).getMinutes()

    // Outside working hours (before 8am or after 7pm)
    if (startHour < 8) {
      issues.push({
        id: `outside-early-${ev.id}`,
        type: 'outside_hours',
        severity: 'warning',
        eventId: ev.id,
        eventTitle: ev.title || '(Untitled)',
        message: `Starts before 8:00 AM (${format(new Date(ev.start), 'HH:mm')})`
      })
    }
    if (endHour > 19 || (endHour === 19 && endMin > 0)) {
      issues.push({
        id: `outside-late-${ev.id}`,
        type: 'outside_hours',
        severity: 'warning',
        eventId: ev.id,
        eventTitle: ev.title || '(Untitled)',
        message: `Ends after 7:00 PM (${format(new Date(ev.end), 'HH:mm')})`
      })
    }

    // Check against subsequent events within reasonable horizon
    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j]
      const otherStart = new Date(other.start).getTime()
      const otherEnd = new Date(other.end).getTime()

      // Stop if the other event starts > 24 hours later
      if (otherStart > evEnd + 24 * 60 * 60 * 1000) break

      // 1. Overlap: same calendar, times overlap
      if (ev.calendar_id === other.calendar_id && otherStart < evEnd && otherEnd > evStart) {
        issues.push({
          id: `overlap-${ev.id}-${other.id}`,
          type: 'overlap',
          severity: 'error',
          eventId: ev.id,
          eventTitle: ev.title || '(Untitled)',
          message: `Overlaps with "${other.title || '(Untitled)'}" on ${format(new Date(ev.start), 'MMM d')}`,
          relatedEventId: other.id
        })
      }

      // 2. Travel & Transit Shield: consecutive events with different physical locations
      if (ev.location && other.location && ev.location.trim() !== other.location.trim()) {
        const transit = estimateOfflineTransit(ev.location, other.location)
        if (transit.transitMinutes > 0) {
          const gapMs = otherStart - evEnd
          const gapMinutes = Math.round(gapMs / 60000)
          if (gapMinutes < transit.transitMinutes) {
            issues.push({
              id: `travel-${ev.id}-${other.id}`,
              type: 'travel_overlap',
              severity: gapMinutes < 0 ? 'error' : 'warning',
              eventId: ev.id,
              eventTitle: ev.title || '(Untitled)',
              message: `Insufficient transit to "${other.title || '(Untitled)'}": requires ${transit.transitMinutes}m (${transit.mode.toUpperCase()}${transit.distanceKm ? ` ~${transit.distanceKm}km` : ''}) between "${ev.location}" and "${other.location}", but available gap is ${gapMinutes < 0 ? '0' : gapMinutes}m.`,
              relatedEventId: other.id,
              transitDetails: {
                ...transit,
                origin: ev.location,
                destination: other.location,
                gapMinutes
              }
            })
          }
        }
      }

      // 3. Back-to-back: gap < 5 min between end of ev and start of other
      if (otherStart > evEnd && otherStart - evEnd < 5 * 60 * 1000) {
        issues.push({
          id: `btb-${ev.id}-${other.id}`,
          type: 'back_to_back',
          severity: 'warning',
          eventId: ev.id,
          eventTitle: ev.title || '(Untitled)',
          message: `Back-to-back with "${other.title || '(Untitled)'}" — only ${Math.round((otherStart - evEnd) / 60000)}m gap`,
          relatedEventId: other.id
        })
      }

      // 4. Resource conflict: shared resource_id at same time
      const evResources = (ev.resources || []).map((r) => r.id)
      const otherResources = (other.resources || []).map((r) => r.id)
      const sharedRes = evResources.filter((id) => otherResources.includes(id))
      if (sharedRes.length > 0 && otherStart < evEnd && otherEnd > evStart) {
        issues.push({
          id: `res-${ev.id}-${other.id}`,
          type: 'resource_conflict',
          severity: 'error',
          eventId: ev.id,
          eventTitle: ev.title || '(Untitled)',
          message: `Double-booked resource with "${other.title || '(Untitled)'}"`,
          relatedEventId: other.id
        })
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  return issues.filter((issue) => {
    if (seen.has(issue.id)) return false
    seen.add(issue.id)
    return true
  })
}

const typeLabels: Record<ConflictIssue['type'], string> = {
  overlap: 'Overlap',
  travel_overlap: 'Transit Shield',
  back_to_back: 'Back-to-Back',
  resource_conflict: 'Resource Conflict',
  outside_hours: 'Outside Hours'
}

export const ConflictPredictorPanel: React.FC = () => {
  const { events, isConflictPredictorOpen, setIsConflictPredictorOpen, setSelectedEvent, setIsEventModalOpen } = useAppStore()

  const issues = useMemo(() => detectConflicts(events), [events])

  const openEvent = (eventId: string): void => {
    const ev = events.find((e) => e.id === eventId)
    if (ev) {
      setSelectedEvent(ev)
      setIsEventModalOpen(true)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isConflictPredictorOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsConflictPredictorOpen(false)}
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col bg-[var(--bg-elevated)] border-l border-[var(--border-subtle)] shadow-xl transition-transform duration-300 ${
          isConflictPredictorOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '72px' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Conflict Predictor</span>
            {issues.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                {issues.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsConflictPredictorOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" style={{ color: 'oklch(0.72 0.18 145)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">No Conflicts Detected</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Your schedule looks clean and conflict-free.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold tracking-wider px-1">
                {issues.filter((i) => i.severity === 'error').length} errors ·{' '}
                {issues.filter((i) => i.severity === 'warning').length} warnings
              </p>
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-[var(--radius-md)] border text-xs space-y-1.5 ${
                    issue.severity === 'error'
                      ? 'bg-[var(--bg-subtle)] border-[var(--border-default)]'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {issue.severity === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'oklch(0.65 0.22 25)' }} />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'oklch(0.82 0.18 80)' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[var(--text-primary)] truncate">{issue.eventTitle}</span>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)] uppercase">
                          {typeLabels[issue.type]}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] mt-0.5">{issue.message}</p>
                      {issue.transitDetails && (
                        <div className="mt-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent)]">
                            {issue.transitDetails.mode === 'flight' && <Plane className="w-3 h-3" />}
                            {issue.transitDetails.mode === 'drive' && <Car className="w-3 h-3" />}
                            {issue.transitDetails.mode === 'walk' && <Footprints className="w-3 h-3" />}
                            <span className="font-semibold uppercase">{issue.transitDetails.mode} Transit Required</span>
                            <span>• {issue.transitDetails.transitMinutes} min</span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                            <span>Origin: {issue.transitDetails.origin}</span>
                            <span>Dest: {issue.transitDetails.destination}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openEvent(issue.eventId)}
                    className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline ml-5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Jump to Event
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
          <p className="text-[10px] text-[var(--text-muted)] text-center">
            Auto-updates as events change · {events.length} events scanned
          </p>
        </div>
      </div>
    </>
  )
}
