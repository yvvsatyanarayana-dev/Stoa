import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { FreeSlotOption, CalendarEvent } from '../../../../types'
import { format } from 'date-fns'
import { Zap, X, ArrowRight, Search, Star } from 'lucide-react'
import { parseSlotQuery } from '../../utils/nlpParser'

function computeQualityScore(slot: FreeSlotOption): number {
  const start = new Date(slot.start)
  const end = new Date(slot.end)
  const startH = start.getHours()
  const endH = end.getHours()
  const dow = start.getDay() // 0=Sun, 1=Mon

  let score = slot.score ?? 100

  if (startH < 9) score -= 10
  if (endH > 18) score -= 10
  if (dow === 1 && startH >= 8 && startH < 10) score -= 5
  if (dow === 5 && startH >= 15 && startH < 18) score -= 5
  if (startH >= 12 && endH <= 13) score -= 15

  return Math.max(0, Math.min(100, score))
}

function ScoreRing({ score }: { score: number }) {
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference

  const colorClass =
    score >= 80
      ? 'text-[var(--score-green,oklch(0.72_0.18_145))]'
      : score >= 60
      ? 'text-[var(--score-yellow,oklch(0.82_0.18_80))]'
      : 'text-[var(--score-red,oklch(0.65_0.22_25))]'

  const strokeColor =
    score >= 80
      ? 'oklch(0.72 0.18 145)'
      : score >= 60
      ? 'oklch(0.82 0.18 80)'
      : 'oklch(0.65 0.22 25)'

  return (
    <div className="relative inline-flex items-center justify-center w-9 h-9 shrink-0">
      <svg width="36" height="36" className="-rotate-90">
        <circle
          cx="18" cy="18" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-[var(--border-subtle)] opacity-40"
        />
        <circle
          cx="18" cy="18" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-[9px] font-bold font-mono ${colorClass}`}>{score}</span>
    </div>
  )
}

function TimelineStrip({ slot }: { slot: FreeSlotOption }) {
  const start = new Date(slot.start)
  const end = new Date(slot.end)
  const dayStart = 8 * 60
  const dayEnd = 19 * 60
  const slotStartMin = start.getHours() * 60 + start.getMinutes()
  const slotEndMin = end.getHours() * 60 + end.getMinutes()
  const leftPct = Math.max(0, ((slotStartMin - dayStart) / (dayEnd - dayStart)) * 100)
  const widthPct = Math.min(100 - leftPct, ((slotEndMin - slotStartMin) / (dayEnd - dayStart)) * 100)

  return (
    <div className="relative h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden w-full mt-1">
      <div
        className="absolute top-0 h-full rounded-full bg-[var(--accent)] opacity-80"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
    </div>
  )
}

export const FreeSlotFinderModal: React.FC = () => {
  const {
    isFreeSlotFinderOpen,
    setIsFreeSlotFinderOpen,
    resources,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  const [nlpQuery, setNlpQuery] = useState('')
  const [duration, setDuration] = useState<number>(45)
  const [daysToSearch, setDaysToSearch] = useState<number>(5)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [results, setResults] = useState<FreeSlotOption[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [queryParsedInfo, setQueryParsedInfo] = useState<string | null>(null)

  if (!isFreeSlotFinderOpen) return null

  const toggleResource = (id: string): void => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    )
  }

  const handleNlpParse = (): void => {
    if (!nlpQuery.trim()) return
    const parsed = parseSlotQuery(nlpQuery)
    setDuration(parsed.durationMinutes)
    setDaysToSearch(parsed.daysToSearch)
    setQueryParsedInfo(
      `Parsed: ${parsed.durationMinutes} min, ${parsed.daysToSearch} day(s) search, ${parsed.attendeeCount} person(s)`
    )
  }

  const handleSearch = async (): Promise<void> => {
    setIsSearching(true)
    setHasSearched(true)
    try {
      const todayStr = new Date().toISOString().slice(0, 10)
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

  const scoredResults = useMemo(
    () =>
      results
        .map((slot) => ({ ...slot, qualityScore: computeQualityScore(slot) }))
        .sort((a, b) => b.qualityScore - a.qualityScore),
    [results]
  )

  const bestIdx = scoredResults.length > 0 ? 0 : -1

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
                AI Meeting Finder
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Optimal zero-conflict windows with quality scoring.
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
          {/* NLP Query Box */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Natural Language Query
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={nlpQuery}
                  onChange={(e) => setNlpQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNlpParse()}
                  placeholder='e.g. "Find 2 free hours this week for 3 people"'
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-default)]"
                />
              </div>
              <button
                type="button"
                onClick={handleNlpParse}
                className="btn-secondary text-xs py-1.5 px-3 shrink-0"
              >
                Parse
              </button>
            </div>
            {queryParsedInfo && (
              <p className="text-[10px] text-[var(--accent)] mt-1 ml-0.5">{queryParsedInfo}</p>
            )}
          </div>

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
                <option value={1}>Today Only</option>
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
                  Conflict-Free Slots ({scoredResults.length})
                </span>
              </div>

              {scoredResults.length === 0 ? (
                <div className="p-6 text-center space-y-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                  <div className="text-2xl">📭</div>
                  <p className="text-xs text-[var(--text-muted)]">No common free slots found.</p>
                  <p className="text-[11px] text-[var(--text-muted)] opacity-70">
                    Try: broader search range, shorter duration, or fewer resource filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {scoredResults.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-[var(--radius-sm)] border transition-colors group cursor-pointer ${
                        idx === bestIdx
                          ? 'bg-[var(--accent)]/8 border-[var(--accent)]/30 hover:bg-[var(--accent)]/12'
                          : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)]'
                      }`}
                      onClick={() => handleBookSlot(slot)}
                      style={{ background: idx === bestIdx ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : undefined }}
                    >
                      <div className="flex items-start gap-3">
                        <ScoreRing score={slot.qualityScore} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                              {format(new Date(slot.start), 'EEE, MMM d')} • {slot.timeRange}
                            </span>
                            {idx === bestIdx && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 uppercase tracking-wider">
                                <Star className="w-2.5 h-2.5 fill-current" /> Best Pick
                              </span>
                            )}
                          </div>
                          <TimelineStrip slot={slot} />
                          <div className="text-[10px] text-[var(--text-muted)] mt-1">
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
                          <span>Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
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
