import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  QrCode,
  Download,
  Printer,
  Calendar,
  MapPin,
  Smartphone
} from 'lucide-react'
import { format } from 'date-fns'
import QRCode from 'qrcode'

export const QrEventCardTab: React.FC = () => {
  const { events, settings } = useAppStore()

  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const cardRef = useRef<HTMLDivElement>(null)

  // Active eligible events
  const eligibleEvents = useMemo(() => {
    return [...events]
      .filter((e) => e.status !== 'cancelled')
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  }, [events])

  // Select default event
  useEffect(() => {
    if (eligibleEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(eligibleEvents[0].id)
    }
  }, [eligibleEvents, selectedEventId])

  const selectedEvent = useMemo(() => {
    return eligibleEvents.find((e) => e.id === selectedEventId) || null
  }, [eligibleEvents, selectedEventId])

  // Generate VEVENT QR payload & Data URL
  useEffect(() => {
    if (!selectedEvent) return

    const formatIcsTime = (iso: string) => {
      const d = new Date(iso)
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const qrPayload = [
      'BEGIN:VEVENT',
      `SUMMARY:${selectedEvent.title}`,
      `DTSTART:${formatIcsTime(selectedEvent.start)}`,
      `DTEND:${formatIcsTime(selectedEvent.end)}`,
      selectedEvent.location ? `LOCATION:${selectedEvent.location}` : '',
      selectedEvent.description ? `DESCRIPTION:${selectedEvent.description}` : 'DESCRIPTION:Stoa Event',
      'END:VEVENT'
    ]
      .filter(Boolean)
      .join('\n')

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err))
  }, [selectedEvent])

  const handleDownloadQrPng = () => {
    if (!qrDataUrl || !selectedEvent) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `QR_${selectedEvent.title.replace(/\s+/g, '_')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintCard = () => {
    if (!cardRef.current || !selectedEvent) return
    const content = cardRef.current.innerHTML

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedEvent.title} - Event Pass</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; background: #fafafa; }
            .print-card { border: 2px solid #000; padding: 24px; border-radius: 12px; width: 340px; text-align: center; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .print-title { font-size: 16px; font-weight: 800; margin-bottom: 8px; }
            .print-meta { font-size: 11px; color: #555; margin-bottom: 16px; font-family: monospace; }
            .print-qr { width: 200px; height: 200px; margin: 0 auto; display: block; }
            .print-footer { font-size: 10px; color: #777; margin-top: 16px; border-top: 1px dashed #ccc; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="print-card">
            ${content}
          </div>
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
      {/* Event Selection & Actions */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                QR Code Event Cards & Smart Passes
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Scan with any iPhone or Android camera to instantly add the event directly to your phone's native calendar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadQrPng}
              disabled={!qrDataUrl}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save QR (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCard}
              disabled={!selectedEvent}
              className="px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Event Card</span>
            </button>
          </div>
        </div>

        {/* Event Select Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Select Scheduled Event for QR Pass:</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-semibold"
          >
            {eligibleEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({format(new Date(evt.start), 'MMM d, yyyy • HH:mm')}) {evt.location ? `• ${evt.location}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Badge Preview Display */}
      {selectedEvent && (
        <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>iOS / Android Camera Ready • Scan to Auto-Add to Phone Calendar</span>
          </div>

          {/* Printable Event Pass Card */}
          <div
            ref={cardRef}
            className="w-full max-w-sm rounded-[var(--radius-lg)] bg-white text-black p-6 border-2 border-neutral-900 shadow-2xl text-center space-y-4"
          >
            {/* Organization Tag */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-800">
                {settings?.company_name || 'Stoa'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-bold uppercase">
                Event Pass
              </span>
            </div>

            {/* Event Name & Metadata */}
            <div>
              <h3 className="text-base font-black text-neutral-900 tracking-tight leading-snug">
                {selectedEvent.title}
              </h3>
              <div className="text-xs font-mono text-neutral-600 mt-1">
                {format(new Date(selectedEvent.start), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-xs font-mono font-bold text-neutral-900 mt-0.5">
                {format(new Date(selectedEvent.start), 'HH:mm')} – {format(new Date(selectedEvent.end), 'HH:mm')}
              </div>
              {selectedEvent.location && (
                <div className="text-xs text-neutral-700 mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {/* High-Res QR Code Image */}
            <div className="flex justify-center p-2 bg-neutral-50 rounded-lg border border-neutral-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${selectedEvent.title}`}
                  className="w-48 h-48 rounded"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="pt-2 border-t border-dashed border-neutral-300 text-[10px] text-neutral-500 font-mono">
              Scan with smartphone camera to add to calendar
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
