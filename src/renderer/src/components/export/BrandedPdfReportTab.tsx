import React, { useState, useMemo, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Printer } from 'lucide-react'
import { format, isSameDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

type ReportScope = 'today' | 'week' | 'month' | 'all'
type ReportTheme = 'monochrome' | 'navy' | 'emerald' | 'crimson'

export const BrandedPdfReportTab: React.FC = () => {
  const { events, settings } = useAppStore()

  // Customization Options
  const [reportTitle, setReportTitle] = useState<string>('Master Schedule & Resource Briefing')
  const [companyName, setCompanyName] = useState<string>(
    settings?.company_name || 'ChronoDesk Enterprise'
  )
  const [footerText, setFooterText] = useState<string>(
    settings?.company_footer || 'Strictly Confidential • Authorized Personnel Only'
  )
  const [scope, setScope] = useState<ReportScope>('week')
  const [themeColor, setThemeColor] = useState<ReportTheme>('monochrome')
  const includeSummary = true

  const printAreaRef = useRef<HTMLDivElement>(null)

  // Filter events based on selected scope
  const filteredEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => e.status !== 'cancelled')
      .filter((e) => {
        const eStart = new Date(e.start)
        if (scope === 'today') return isSameDay(eStart, now)
        if (scope === 'week') {
          return isWithinInterval(eStart, {
            start: startOfWeek(now, { weekStartsOn: 1 }),
            end: endOfWeek(now, { weekStartsOn: 1 })
          })
        }
        if (scope === 'month') {
          return isWithinInterval(eStart, {
            start: startOfMonth(now),
            end: endOfMonth(now)
          })
        }
        return true
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, scope])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalMinutes = 0
    const roomSet = new Set<string>()

    filteredEvents.forEach((e) => {
      const dur = (new Date(e.end).getTime() - new Date(e.start).getTime()) / (1000 * 60)
      if (dur > 0) totalMinutes += dur
      if (e.location) roomSet.add(e.location)
      e.resources?.forEach((r) => {
        if (r.type === 'room') roomSet.add(r.name)
      })
    })

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    return {
      eventCount: filteredEvents.length,
      totalHours,
      roomsBooked: roomSet.size
    }
  }, [filteredEvents])

  // Theme styling configurations
  const themeStyles = {
    monochrome: {
      headerBg: 'bg-black text-white',
      accentBorder: 'border-neutral-900',
      badge: 'bg-neutral-100 text-neutral-900 border-neutral-300'
    },
    navy: {
      headerBg: 'bg-blue-950 text-white',
      accentBorder: 'border-blue-900',
      badge: 'bg-blue-50 text-blue-900 border-blue-200'
    },
    emerald: {
      headerBg: 'bg-emerald-950 text-white',
      accentBorder: 'border-emerald-800',
      badge: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    },
    crimson: {
      headerBg: 'bg-rose-950 text-white',
      accentBorder: 'border-rose-900',
      badge: 'bg-rose-50 text-rose-900 border-rose-200'
    }
  }[themeColor]

  // Print function
  const handlePrint = () => {
    if (!printAreaRef.current) return
    const content = printAreaRef.current.innerHTML

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
            th { background-color: #f5f5f5; font-size: 11px; text-transform: uppercase; font-weight: 600; }
            .header-banner { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .kpi-container { display: flex; gap: 15px; margin-bottom: 20px; }
            .kpi-box { border: 1px solid #ddd; padding: 10px 15px; border-radius: 4px; flex: 1; }
            .kpi-label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; }
            .kpi-val { font-size: 20px; font-weight: bold; margin-top: 4px; }
            .footer-banner { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #777; display: flex; justify-content: space-between; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="space-y-4">
      {/* Configuration Controls Bar */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Report Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Document Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-semibold"
            />
          </div>

          {/* 2. Company / Organization Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Organization Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
            />
          </div>

          {/* 3. Scope */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Reporting Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ReportScope)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="today">Today's Schedule Only</option>
              <option value="week">Current Week Schedule</option>
              <option value="month">Current Month Schedule</option>
              <option value="all">Full Master Schedule</option>
            </select>
          </div>

          {/* 4. Footer Notice */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Footer Confidentiality Notice
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>
        </div>

        {/* Customization & Toggles Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          {/* Color theme selectors */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">Theme Accent:</span>
            {(['monochrome', 'navy', 'emerald', 'crimson'] as ReportTheme[]).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => setThemeColor(theme)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium capitalize border transition-all ${
                  themeColor === theme
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-semibold shadow-xs'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>

          {/* Print / Save Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Print Preview Container */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-inner">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
          <span>Live Document Preview (A4 / Letter Format)</span>
          <span>{filteredEvents.length} events included</span>
        </div>

        {/* Paper Container */}
        <div
          ref={printAreaRef}
          className="bg-white text-black p-8 rounded-[var(--radius-sm)] shadow-md max-w-4xl mx-auto space-y-6 min-h-[500px]"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Header Banner */}
          <div className={`border-b-2 ${themeStyles.accentBorder} pb-4 flex items-start justify-between`}>
            <div>
              <div className="text-xl font-black uppercase tracking-tight text-neutral-900">
                {companyName}
              </div>
              <div className="text-sm font-semibold text-neutral-700 mt-0.5">
                {reportTitle}
              </div>
              <div className="text-xs text-neutral-500 mt-1 font-mono">
                Scope: {scope.toUpperCase()} • Generated on {format(new Date(), 'MMMM d, yyyy • HH:mm')}
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-2.5 py-1 text-[11px] font-mono font-bold uppercase border rounded ${themeStyles.badge}`}>
                Official Report
              </span>
            </div>
          </div>

          {/* Summary KPIs */}
          {includeSummary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-neutral-200 rounded bg-neutral-50">
                <div className="text-[10px] font-bold uppercase text-neutral-500 font-mono">
                  Total Commitments
                </div>
                <div className="text-2xl font-black text-neutral-900 mt-0.5">
                  {summaryMetrics.eventCount}
                </div>
              </div>

              <div className="p-3 border border-neutral-200 rounded bg-neutral-50">
                <div className="text-[10px] font-bold uppercase text-neutral-500 font-mono">
                  Allocated Hours
                </div>
                <div className="text-2xl font-black text-neutral-900 mt-0.5">
                  {summaryMetrics.totalHours} hrs
                </div>
              </div>

              <div className="p-3 border border-neutral-200 rounded bg-neutral-50">
                <div className="text-[10px] font-bold uppercase text-neutral-500 font-mono">
                  Rooms & Venues
                </div>
                <div className="text-2xl font-black text-neutral-900 mt-0.5">
                  {summaryMetrics.roomsBooked} active
                </div>
              </div>
            </div>
          )}

          {/* Schedule Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Scheduled Itinerary
            </div>

            {filteredEvents.length > 0 ? (
              <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-800 text-[10px] uppercase font-bold border-b border-neutral-300">
                    <th className="p-2 border-r border-neutral-300">Date & Time</th>
                    <th className="p-2 border-r border-neutral-300">Session / Title</th>
                    <th className="p-2 border-r border-neutral-300">Location / Room</th>
                    <th className="p-2 border-r border-neutral-300">Priority</th>
                    <th className="p-2">Attendees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredEvents.map((evt) => {
                    const s = new Date(evt.start)
                    const e = new Date(evt.end)

                    return (
                      <tr key={evt.id} className="text-neutral-800">
                        <td className="p-2 border-r border-neutral-200 font-mono text-[11px] whitespace-nowrap">
                          {format(s, 'EEE, MMM d • HH:mm')} – {format(e, 'HH:mm')}
                        </td>
                        <td className="p-2 border-r border-neutral-200 font-bold">
                          {evt.title}
                        </td>
                        <td className="p-2 border-r border-neutral-200 text-neutral-600">
                          {evt.location || '—'}
                        </td>
                        <td className="p-2 border-r border-neutral-200 uppercase font-mono text-[10px]">
                          {evt.priority}
                        </td>
                        <td className="p-2 text-neutral-600 font-mono">
                          {evt.attendees?.length || 0} person(s)
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center border border-dashed border-neutral-300 text-neutral-500 text-xs">
                No events found matching scope.
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="pt-6 border-t border-neutral-200 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
            <span>{footerText}</span>
            <span>ChronoDesk Pro • Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}
