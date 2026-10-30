import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { startOfWeek, addDays, isSameDay } from 'date-fns'
import { CheckCircle, AlertTriangle, Lightbulb, HeartPulse } from 'lucide-react'

interface HealthIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  text: string
  recommendation: string
}

export const CalendarHealthScore: React.FC = () => {
  const { events, selectedDate } = useAppStore()

  const { score, letterGrade, metrics, issues } = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 7)

    const weekEvents = events.filter((e) => {
      if (e.all_day) return false
      const s = new Date(e.start)
      return s >= weekStart && s < weekEnd
    })

    let baseScore = 100
    const detectedIssues: HealthIssue[] = []

    // 1. Back-to-Back Meeting Count (< 5 min gap)
    let btbCount = 0
    // 2. Out of hours count (before 8:30 or after 18:30)
    let outOfHoursCount = 0
    // 3. Lunch infringements (meetings active between 12:00 and 13:30)
    let lunchInfringements = 0
    // 4. Overloaded days (> 6 hours)
    let overloadedDaysCount = 0
    // 5. Fragmented days (at least 3 meetings, all gaps < 30 mins)
    let fragmentedDaysCount = 0

    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const currentDay = addDays(weekStart, dayIdx)
      const dayEvents = weekEvents
        .filter((e) => isSameDay(new Date(e.start), currentDay))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

      let dayDurationMins = 0

      for (let j = 0; j < dayEvents.length; j++) {
        const ev = dayEvents[j]
        const s = new Date(ev.start)
        const e = new Date(ev.end)
        const sHour = s.getHours() + s.getMinutes() / 60
        const eHour = e.getHours() + e.getMinutes() / 60

        dayDurationMins += Math.max(0, (e.getTime() - s.getTime()) / 60000)

        // Check boundary
        if (sHour < 8.5 || eHour > 18.5) {
          outOfHoursCount++
        }

        // Check lunch (12.0 - 13.5)
        if (sHour < 13.5 && eHour > 12.0) {
          lunchInfringements++
        }

        // Check btb with next event
        if (j < dayEvents.length - 1) {
          const nextEv = dayEvents[j + 1]
          const gap = (new Date(nextEv.start).getTime() - e.getTime()) / 60000
          if (gap <= 5) {
            btbCount++
          }
        }
      }

      if (dayDurationMins > 360) {
        overloadedDaysCount++
      }

      if (dayEvents.length >= 3) {
        let hasLongGap = false
        for (let k = 0; k < dayEvents.length - 1; k++) {
          const gap =
            (new Date(dayEvents[k + 1].start).getTime() - new Date(dayEvents[k].end).getTime()) / 60000
          if (gap >= 60) {
            hasLongGap = true
            break
          }
        }
        if (!hasLongGap && dayDurationMins > 180) {
          fragmentedDaysCount++
        }
      }
    }

    // Deduct points
    if (btbCount > 0) {
      const penalty = Math.min(20, btbCount * 5)
      baseScore -= penalty
      detectedIssues.push({
        id: 'issue-btb',
        severity: btbCount >= 3 ? 'high' : 'medium',
        text: `${btbCount} back-to-back meeting(s) with zero buffer time.`,
        recommendation: 'Add 10-15 minute breathing buffers to allow context switching and prevent fatigue.'
      })
    }

    if (lunchInfringements > 0) {
      const penalty = Math.min(15, lunchInfringements * 4)
      baseScore -= penalty
      detectedIssues.push({
        id: 'issue-lunch',
        severity: 'medium',
        text: `${lunchInfringements} event(s) scheduled directly over lunch hour (12:00 - 1:30 PM).`,
        recommendation: 'Protect a 45-minute midday pause for rest and recharge.'
      })
    }

    if (outOfHoursCount > 0) {
      const penalty = Math.min(15, outOfHoursCount * 5)
      baseScore -= penalty
      detectedIssues.push({
        id: 'issue-hours',
        severity: 'medium',
        text: `${outOfHoursCount} booking(s) fall outside standard working boundaries.`,
        recommendation: 'Shift appointments into standard hours (8:30 AM - 6:30 PM) to protect work-life balance.'
      })
    }

    if (overloadedDaysCount > 0) {
      const penalty = Math.min(20, overloadedDaysCount * 10)
      baseScore -= penalty
      detectedIssues.push({
        id: 'issue-overload',
        severity: 'high',
        text: `${overloadedDaysCount} day(s) exceed 6 hours of scheduled sessions.`,
        recommendation: 'Redistribute meetings to lighter days or decline non-essential check-ins.'
      })
    }

    if (fragmentedDaysCount > 0) {
      const penalty = Math.min(10, fragmentedDaysCount * 5)
      baseScore -= penalty
      detectedIssues.push({
        id: 'issue-fragmented',
        severity: 'low',
        text: `${fragmentedDaysCount} fragmented day(s) without meaningful deep work gaps.`,
        recommendation: 'Consolidate short meetings into back-to-back clusters or dedicated meeting afternoons.'
      })
    }

    const finalScore = Math.max(10, Math.min(100, baseScore))

    let grade = 'A+'
    if (finalScore < 60) grade = 'D'
    else if (finalScore < 70) grade = 'C'
    else if (finalScore < 80) grade = 'B'
    else if (finalScore < 90) grade = 'A'

    return {
      score: finalScore,
      letterGrade: grade,
      metrics: {
        btbCount,
        lunchInfringements,
        outOfHoursCount,
        overloadedDaysCount,
        fragmentedDaysCount
      },
      issues: detectedIssues
    }
  }, [events, selectedDate])

  const getScoreColor = (sc: number): string => {
    if (sc >= 85) return 'oklch(0.72 0.18 145)' // Green
    if (sc >= 70) return 'oklch(0.82 0.18 80)'  // Yellow
    return 'oklch(0.65 0.22 25)'                // Red
  }

  const scoreColor = getScoreColor(score)

  return (
    <div className="card p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <HeartPulse className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Calendar Health Score & Fatigue Index (B4)
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Composite audit evaluating buffer adequacy, lunch protection, working boundaries, and burnout risks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold font-mono px-3 py-1 rounded-[var(--radius-md)] border"
            style={{
              borderColor: scoreColor,
              color: scoreColor,
              background: 'color-mix(in oklch, currentColor 10%, transparent)'
            }}
          >
            {letterGrade} ({score}/100)
          </span>
        </div>
      </div>

      {/* 5 Pillar Health Audit Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Buffer Gaps</div>
          <div className={`font-bold font-mono text-sm mt-0.5 ${metrics.btbCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.btbCount === 0 ? '✓ Healthy' : `${metrics.btbCount} Back-to-Back`}
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Lunch Pause</div>
          <div className={`font-bold font-mono text-sm mt-0.5 ${metrics.lunchInfringements === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.lunchInfringements === 0 ? '✓ Protected' : `${metrics.lunchInfringements} Conflict`}
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Boundaries</div>
          <div className={`font-bold font-mono text-sm mt-0.5 ${metrics.outOfHoursCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.outOfHoursCount === 0 ? '✓ Respected' : `${metrics.outOfHoursCount} Late/Early`}
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Max Load</div>
          <div className={`font-bold font-mono text-sm mt-0.5 ${metrics.overloadedDaysCount === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.overloadedDaysCount === 0 ? '✓ Balanced' : `${metrics.overloadedDaysCount} >6h Days`}
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Fragmentation</div>
          <div className={`font-bold font-mono text-sm mt-0.5 ${metrics.fragmentedDaysCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.fragmentedDaysCount === 0 ? '✓ Cohesive' : `${metrics.fragmentedDaysCount} Scattered`}
          </div>
        </div>
      </div>

      {/* Dynamic Actionable Suggestions List */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Real-Time Optimization Recommendations ({issues.length})</span>
        </div>

        {issues.length === 0 ? (
          <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Flawless schedule hygiene! No fatigue points or boundary violations detected for this week.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="w-3.5 h-3.5 shrink-0"
                    style={{
                      color: issue.severity === 'high' ? 'oklch(0.65 0.22 25)' : 'oklch(0.82 0.18 80)'
                    }}
                  />
                  <span className="font-semibold text-[var(--text-primary)]">{issue.text}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] pl-5.5">
                  <span className="text-[var(--text-muted)]">Suggested Fix: </span>
                  {issue.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
