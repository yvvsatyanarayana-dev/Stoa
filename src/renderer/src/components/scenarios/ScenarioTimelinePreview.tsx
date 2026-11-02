/**
 * Scenario Timeline Preview
 * Weekly Interactive Schedule Grid for Alternate Universe Timelines
 */

import React, { useState } from 'react'
import type { ScenarioBranch } from '../../types/scenarioWorld'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface ScenarioTimelinePreviewProps {
  branch: ScenarioBranch
}

export const ScenarioTimelinePreview: React.FC<ScenarioTimelinePreviewProps> = ({ branch }) => {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0)

  const events = branch.generatedEvents

  // Group events by week
  const weekEvents = events.slice(selectedWeekIdx * 5, (selectedWeekIdx + 1) * 5 + 3)

  return (
    <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
      {/* Header and Week Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Simulated Timeline Schedule
            </h3>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Procedurally generated weekly routine reflecting {branch.name}’s operating rhythm.
          </p>
        </div>

        {/* Week Selector */}
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs font-mono shrink-0">
          {[0, 1, 2, 3].map((wIdx) => (
            <button
              key={wIdx}
              onClick={() => setSelectedWeekIdx(wIdx)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                selectedWeekIdx === wIdx
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Week {wIdx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Events List / Timeline Stream */}
      <div className="space-y-2">
        {weekEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No simulated events generated for this interval.
          </div>
        ) : (
          weekEvents.map((evt) => {
            const startD = parseISO(evt.start)
            const endD = parseISO(evt.end)

            const isUrgent = evt.priority === 'urgent'
            const isHigh = evt.priority === 'high'

            return (
              <div
                key={evt.id}
                className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: branch.color }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {evt.title}
                      </span>
                      {isUrgent && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Urgent
                        </span>
                      )}
                      {isHigh && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Strategic
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(startD, 'EEE, MMM d • h:mm a')} - {format(endD, 'h:mm a')}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] sm:text-right shrink-0">
                  CRDT Record: {evt.id.split('-').pop()}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
