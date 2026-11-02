import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  HolidayRegion,
  scanHolidayConflicts,
  HolidayConflict,
  detectSystemHolidayRegion
} from '../../utils/holidayEngine'
import { format } from 'date-fns'
import { CalendarOff, X, ArrowRight, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react'

export const HolidayRescheduleModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { events, updateEvent } = useAppStore()
  const [region, setRegion] = useState<HolidayRegion>(() => detectSystemHolidayRegion())
  const [isApplying, setIsApplying] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSelectRegion = (reg: HolidayRegion) => {
    setRegion(reg)
    try {
      localStorage.setItem('stoa_holiday_region', reg)
    } catch {}
  }

  const conflicts: HolidayConflict[] = useMemo(() => {
    return scanHolidayConflicts(events, region)
  }, [events, region])

  if (!isOpen) return null

  const handleShiftOne = async (conflict: HolidayConflict): Promise<void> => {
    const existing = events.find((e) => e.id === conflict.eventId)
    if (!existing) return

    await updateEvent({
      ...existing,
      start: conflict.suggestedShiftStart,
      end: conflict.suggestedShiftEnd,
      updated_at: new Date().toISOString()
    })
  }

  const handleShiftAll = async (): Promise<void> => {
    if (conflicts.length === 0) return
    setIsApplying(true)
    setSuccessMessage(null)

    try {
      for (const conflict of conflicts) {
        const existing = events.find((e) => e.id === conflict.eventId)
        if (existing) {
          await updateEvent({
            ...existing,
            start: conflict.suggestedShiftStart,
            end: conflict.suggestedShiftEnd,
            updated_at: new Date().toISOString()
          })
        }
      }
      setSuccessMessage(`Successfully shifted ${conflicts.length} event(s) to the next valid business day.`)
    } catch (err) {
      console.error('Error shifting events:', err)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
              <CalendarOff className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Holiday-Aware Auto-Reschedule
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Detects appointments colliding with national holidays and shifts them to valid business days.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Region Picker */}
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Regional Public Calendar
              </label>
              <span className="text-xs text-[var(--text-primary)] font-medium">
                Select your holiday jurisdiction:
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
              {(['US', 'UK', 'IN', 'DE', 'CA', 'AU', 'INTL'] as HolidayRegion[]).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => handleSelectRegion(reg)}
                  className={`px-2 py-1 rounded-xs text-xs font-semibold transition-all ${
                    region === reg
                      ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-[var(--radius-sm)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Conflicts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Detected Holiday Conflicts ({conflicts.length})
              </span>
            </div>

            {conflicts.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Zero Holiday Collisions
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  None of your active events land on public holidays in the {region} calendar.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.eventId}
                    className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-semibold text-[var(--text-primary)]">
                            {conflict.eventTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-400/90 font-mono mt-0.5 pl-5.5">
                          Lands on: {conflict.holiday.name} ({format(new Date(conflict.eventStart), 'EEE, MMM d')})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleShiftOne(conflict)}
                        className="btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1 shrink-0"
                      >
                        <span>Shift</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Proposed Shift Indicator */}
                    <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--text-muted)]">Shift to:</span>
                        <span className="font-semibold text-emerald-400">
                          {format(new Date(conflict.suggestedShiftStart), 'EEE, MMM d, yyyy • HH:mm')}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">(Next Business Day)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center justify-between">
          <button type="button" onClick={onClose} className="btn-secondary text-xs py-1 px-3">
            Dismiss
          </button>

          {conflicts.length > 0 && (
            <button
              type="button"
              disabled={isApplying}
              onClick={handleShiftAll}
              className="btn-primary flex items-center gap-1.5 py-1 px-3.5 text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              <span>Shift All ({conflicts.length}) to Next Business Day</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
