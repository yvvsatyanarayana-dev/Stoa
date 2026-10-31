import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Download,
  Upload,
  Database,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import { format } from 'date-fns'

export const DataPortabilityTab: React.FC = () => {
  const { events, calendars, resources, fetchInitialData, fetchEvents } = useAppStore()

  const [importing, setImporting] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 1. Export Master JSON
  const handleExportJson = async () => {
    setExporting(true)
    try {
      const data = await window.api.data.exportAll()
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stoa-workspace-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatusMessage('Full workspace JSON backup exported successfully!')
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (e: any) {
      setErrorMessage(`Export failed: ${e.message || String(e)}`)
    } finally {
      setExporting(false)
    }
  }

  // 2. Export RFC-5545 iCal File (.ics)
  const handleExportIcs = () => {
    try {
      const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Stoa//Master Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ]

      events.forEach((evt) => {
        if (evt.status === 'cancelled') return
        const s = new Date(evt.start)
        const e = new Date(evt.end)
        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        lines.push('BEGIN:VEVENT')
        lines.push(`UID:${evt.id}@stoa.local`)
        lines.push(`DTSTAMP:${fmt(new Date())}`)
        lines.push(`DTSTART:${fmt(s)}`)
        lines.push(`DTEND:${fmt(e)}`)
        lines.push(`SUMMARY:${evt.title.replace(/\n/g, ' ')}`)
        if (evt.description) lines.push(`DESCRIPTION:${evt.description.replace(/\n/g, '\\n')}`)
        if (evt.location) lines.push(`LOCATION:${evt.location}`)
        lines.push('END:VEVENT')
      })

      lines.push('END:VCALENDAR')
      const icsBlob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' })
      const url = URL.createObjectURL(icsBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `all-schedules-${format(new Date(), 'yyyy-MM-dd')}.ics`
      a.click()
      URL.revokeObjectURL(url)
      setStatusMessage('All calendars exported as RFC-5545 iCal (.ics) feed!')
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (e: any) {
      setErrorMessage(`iCal export failed: ${e.message || String(e)}`)
    }
  }

  // 3. Export CSV Bundle
  const handleExportCsv = () => {
    try {
      const headers = ['ID', 'Title', 'Start', 'End', 'Location', 'Meeting URL', 'Priority', 'Status']
      const rows = events.map((e) => [
        e.id,
        `"${e.title.replace(/"/g, '""')}"`,
        e.start,
        e.end,
        `"${(e.location || '').replace(/"/g, '""')}"`,
        e.meeting_url || '',
        e.priority,
        e.status
      ])
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `events-table-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setStatusMessage('Events spreadsheet table exported as CSV!')
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (e: any) {
      setErrorMessage(`CSV export failed: ${e.message || String(e)}`)
    }
  }

  // 4. Import Handler (supports .json and .ics)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const text = await file.text()

      if (file.name.endsWith('.json')) {
        const payload = JSON.parse(text)
        const res = await window.api.data.importAll(payload, { overwrite: overwriteMode })
        await fetchInitialData()
        await fetchEvents()
        setStatusMessage(
          `Successfully imported JSON backup: ${res.importedCounts.events} events, ${res.importedCounts.resources} resources, ${res.importedCounts.calendars} calendars.`
        )
      } else if (file.name.endsWith('.ics') || file.name.endsWith('.ical')) {
        await window.api.events.importIcs({
          content: text,
          calendarName: `Imported (${file.name.replace(/\.[^/.]+$/, '')})`,
          calendarColor: '#3b82f6'
        })
        await fetchInitialData()
        await fetchEvents()
        setStatusMessage(`Successfully imported iCal calendar file "${file.name}"!`)
      } else {
        throw new Error('Unsupported format. Please upload a .json backup or .ics calendar file.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Import failed. Check file format.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--accent)]" />
          <span>Enterprise Data Portability & Universal Migration</span>
        </h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
          Zero vendor lock-in. Full system backup, multi-format exports, and universal import from Google Calendar, Apple, or Outlook.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Export Hub */}
      <div className="card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Universal Data Export
          </h4>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {events.length} events • {calendars.length} calendars • {resources.length} resources
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* JSON Master */}
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-[var(--text-primary)]">Full System JSON</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Complete database snapshot including timetables, subjects, and preferences.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              disabled={exporting}
              className="btn-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export JSON Backup'}</span>
            </button>
          </div>

          {/* iCal Feed */}
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-[var(--text-primary)]">All Calendars iCal</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                RFC-5545 standard file importable into Google Calendar, Outlook, and Apple iCal.
              </p>
            </div>
            <button
              onClick={handleExportIcs}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .ICS File</span>
            </button>
          </div>

          {/* CSV Spreadsheet */}
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-[var(--text-primary)]">Spreadsheet Table</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tabular CSV format formatted for Microsoft Excel, Google Sheets, or data analysis.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Events CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Universal Import */}
      <div className="card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Universal Data Import & Restore
          </h4>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Supports .json and .ics / .ical
          </span>
        </div>

        {/* Overwrite mode checkbox */}
        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-[var(--text-primary)]">Overwrite Existing Workspace</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              When checked, completely replaces all local data with the imported file. Otherwise merges cleanly.
            </div>
          </div>
          <input
            type="checkbox"
            checked={overwriteMode}
            onChange={(e) => setOverwriteMode(e.target.checked)}
            className="w-4 h-4 accent-red-500 rounded cursor-pointer"
          />
        </div>

        {/* Upload Dropzone */}
        <label className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-[var(--radius-md)] p-8 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center space-y-1">
            <div className="text-xs font-bold text-[var(--text-primary)]">
              {importing ? 'Processing & Validating...' : 'Click to Upload or Drag File Here'}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono">
              Upload Stoa .json backup or external .ics / .ical calendar
            </div>
          </div>
          <input
            type="file"
            accept=".json,.ics,.ical"
            disabled={importing}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}
