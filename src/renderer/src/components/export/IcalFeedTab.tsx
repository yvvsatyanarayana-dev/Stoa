import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Download,
  Copy,
  Check,
  Rss,
  Code2,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'

export const IcalFeedTab: React.FC = () => {
  const { events, calendars } = useAppStore()

  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all')
  const [copiedFeed, setCopiedFeed] = useState<boolean>(false)
  const [copiedIcs, setCopiedIcs] = useState<boolean>(false)
  const [showRawIcs, setShowRawIcs] = useState<boolean>(false)

  // Filter events
  const targetEvents = useMemo(() => {
    return events
      .filter((e) => e.status !== 'cancelled')
      .filter((e) => (selectedCalendarId === 'all' ? true : e.calendar_id === selectedCalendarId))
  }, [events, selectedCalendarId])

  // Generate RFC 5545 compliant iCalendar string
  const icsContent = useMemo(() => {
    const formatDateToIcs = (dateStr: string) => {
      const d = new Date(dateStr)
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const escapeIcsText = (str: string) => {
      return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
    }

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChronoDesk//Scheduling Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:ChronoDesk Master Schedule',
      `X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}`
    ]

    targetEvents.forEach((evt) => {
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${evt.id}@chronodesk.internal`)
      lines.push(`DTSTAMP:${formatDateToIcs(new Date().toISOString())}`)
      lines.push(`DTSTART:${formatDateToIcs(evt.start)}`)
      lines.push(`DTEND:${formatDateToIcs(evt.end)}`)
      lines.push(`SUMMARY:${escapeIcsText(evt.title)}`)
      if (evt.description) lines.push(`DESCRIPTION:${escapeIcsText(evt.description)}`)
      if (evt.location) lines.push(`LOCATION:${escapeIcsText(evt.location)}`)
      if (evt.rrule) lines.push(`RRULE:${evt.rrule}`)
      lines.push(`STATUS:${evt.status.toUpperCase()}`)
      lines.push('END:VEVENT')
    })

    lines.push('END:VCALENDAR')
    return lines.join('\r\n')
  }, [targetEvents])

  // Live Subscription URL
  const subscriptionFeedUrl = useMemo(() => {
    return `webcal://chronodesk.internal/feed/${selectedCalendarId}.ics`
  }, [selectedCalendarId])

  const handleCopyFeed = () => {
    navigator.clipboard.writeText(subscriptionFeedUrl)
    setCopiedFeed(true)
    setTimeout(() => setCopiedFeed(false), 2500)
  }

  const handleCopyRawIcs = () => {
    navigator.clipboard.writeText(icsContent)
    setCopiedIcs(true)
    setTimeout(() => setCopiedIcs(false), 2500)
  }

  const handleDownloadIcsFile = () => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ChronoDesk_Schedule_${format(new Date(), 'yyyyMMdd')}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Feed & Download Configuration */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)]">
              <Rss className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                iCal / .ics Live Feed & Universal Calendar Sync
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                RFC 5545 compliant calendar export and live subscription URLs for Apple Calendar, Google Calendar & Outlook.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadIcsFile}
              className="px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ics File</span>
            </button>
          </div>
        </div>

        {/* Filter by Calendar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">Source Calendar:</span>
          <button
            type="button"
            onClick={() => setSelectedCalendarId('all')}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors ${
              selectedCalendarId === 'all'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-semibold shadow-xs'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
          >
            All Calendars ({events.length} events)
          </button>

          {calendars.map((cal) => (
            <button
              key={cal.id}
              type="button"
              onClick={() => setSelectedCalendarId(cal.id)}
              className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                selectedCalendarId === cal.id
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-semibold shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cal.color }} />
              <span>{cal.name}</span>
            </button>
          ))}
        </div>

        {/* Live Webcal URL Box */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Live Subscription Feed URL</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Real-time sync enabled
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1 font-mono text-xs text-[var(--text-primary)] select-all truncate bg-[var(--bg-elevated)] p-1.5 px-2.5 rounded border border-[var(--border-subtle)]">
              {subscriptionFeedUrl}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyFeed}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  copiedFeed
                    ? 'bg-emerald-500 text-black shadow-xs'
                    : 'bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90'
                }`}
              >
                {copiedFeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFeed ? 'Copied Feed URL!' : 'Copy Feed URL'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRawIcs(!showRawIcs)}
                className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showRawIcs ? 'Hide Raw Code' : 'Inspect .ics Syntax'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Instructions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Apple Calendar */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
          <div className="text-xs font-bold text-[var(--text-primary)]">
            Apple Calendar (Mac / iOS)
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            In Calendar app, select <strong>File → New Calendar Subscription</strong>, paste the Feed URL, and click Subscribe.
          </p>
        </div>

        {/* Google Calendar */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
          <div className="text-xs font-bold text-[var(--text-primary)]">
            Google Calendar
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Under "Other calendars", click <strong>+ → From URL</strong>, paste the Feed URL, and click Add Calendar.
          </p>
        </div>

        {/* Outlook */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
          <div className="text-xs font-bold text-[var(--text-primary)]">
            Microsoft Outlook
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Click <strong>Add Calendar → Subscribe from web</strong>, paste the Feed URL, and select Import.
          </p>
        </div>
      </div>

      {/* Raw iCalendar RFC 5545 Inspector */}
      {showRawIcs && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>RFC 5545 RAW ICALENDAR OUTPUT ({targetEvents.length} VEVENT ENTRIES)</span>
            <button
              type="button"
              onClick={handleCopyRawIcs}
              className="text-[var(--accent)] hover:underline flex items-center gap-1 font-sans text-xs font-medium"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedIcs ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] overflow-x-auto max-h-48 overflow-y-auto select-all">
            {icsContent}
          </pre>
        </div>
      )}
    </div>
  )
}
