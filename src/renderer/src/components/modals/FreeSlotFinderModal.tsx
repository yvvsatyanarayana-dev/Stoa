import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { FreeSlotOption, CalendarEvent } from '../../../../types'
import { format } from 'date-fns'
import { Zap, X, ArrowRight } from 'lucide-react'

export const FreeSlotFinderModal: React.FC = () => {
  const {
    isFreeSlotFinderOpen,
    setIsFreeSlotFinderOpen,
    resources,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  const [duration, setDuration] = useState<number>(45)
  const [daysToSearch, setDaysToSearch] = useState<number>(5)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [results, setResults] = useState<FreeSlotOption[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  if (!isFreeSlotFinderOpen) return null

  const toggleResource = (id: string): void => {
    if (selectedResourceIds.includes(id)) {
      setSelectedResourceIds(selectedResourceIds.filter((rId) => rId !== id))
    } else {
      setSelectedResourceIds([...selectedResourceIds, id])
    }
  }

  const handleSearch = async (): Promise<void> => {
    setIsSearching(true)
    setHasSearched(true)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const options = await window.api.events.findFreeSlots({
        durationMinutes: duration,
        startDate: todayStr,
        daysToSearch,
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        targetResourceIds: selectedResourceIds.length > 0 ? selectedResourceIds : undefined
      })
      setResults(options)
    } catch (err) {
      console.error('Error finding free slots:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleBookSlot = (slot: FreeSlotOption): void => {
    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: 'Common Meeting',
      start: slot.start,
      end: slot.end,
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'medium',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSelectedEvent(newEvt)
    setIsFreeSlotFinderOpen(false)
    setIsEventModalOpen(true)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center">
              <Zap className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Smart Free Slot Finder
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Calculates the optimal zero-conflict meeting windows across attendees and rooms.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFreeSlotFinderOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Options */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-subtle)]/60 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Meeting Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={90}>1.5 Hours</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Search Range
              </label>
              <select
                value={daysToSearch}
                onChange={(e) => setDaysToSearch(Number(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value={3}>Next 3 Days</option>
                <option value={5}>This Week (5 Days)</option>
                <option value={7}>Full Week (7 Days)</option>
                <option value={14}>Next 2 Weeks</option>
              </select>
            </div>
          </div>

          {/* Personnel & Room Filter */}
          {resources.length > 0 && (
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                Include Specific Staff or Rooms (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {resources.map((res) => {
                  const isSelected = selectedResourceIds.includes(res.id)
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => toggleResource(res.id)}
                      className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                          : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{res.name}</span>
                      <span className="text-[9px] opacity-70">({res.type})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            type="button"
            disabled={isSearching}
            onClick={handleSearch}
            className="btn-primary w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 stroke-[2]" />
            <span>{isSearching ? 'Calculating Free Intervals...' : 'Find Available Free Slots'}</span>
          </button>

          {/* Results List */}
          {hasSearched && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Recommended Conflict-Free Slots ({results.length})
                </span>
              </div>

              {results.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                  No common free slots found matching these constraints. Try broadening the search range.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {results.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-between transition-colors group cursor-pointer"
                      onClick={() => handleBookSlot(slot)}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {format(new Date(slot.start), 'EEE, MMM d')} • {slot.timeRange}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {slot.score}% Match
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {slot.recommendedReason}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBookSlot(slot)
                        }}
                        className="btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100"
                      >
                        <span>Schedule</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
