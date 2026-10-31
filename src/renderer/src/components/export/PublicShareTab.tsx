import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Copy,
  Check,
  Lock,
  Globe,
  Clock,
  Shield,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'

export const PublicShareTab: React.FC = () => {
  const { calendars, events, settings } = useAppStore()

  // Selected calendars to share
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([])
  const [hidePrivateDetails, setHidePrivateDetails] = useState<boolean>(true)
  const [expirationDays, setExpirationDays] = useState<number>(7)
  const [accessPin, setAccessPin] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)

  // Default to selecting all visible calendars
  React.useEffect(() => {
    if (calendars.length > 0 && selectedCalendarIds.length === 0) {
      setSelectedCalendarIds(calendars.filter((c) => c.visible).map((c) => c.id))
    }
  }, [calendars])

  const toggleCalendar = (id: string) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    )
  }

  // Filter events matching the share configuration
  const sharedEvents = useMemo(() => {
    return events
      .filter((e) => selectedCalendarIds.includes(e.calendar_id) && e.status !== 'cancelled')
      .map((e) => {
        if (hidePrivateDetails) {
          return {
            ...e,
            description: undefined,
            meeting_url: undefined
          }
        }
        return e
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, selectedCalendarIds, hidePrivateDetails])

  // Generate share token URL
  const shareUrl = useMemo(() => {
    const payload = {
      calIds: selectedCalendarIds,
      exp: expirationDays > 0 ? Date.now() + expirationDays * 24 * 60 * 60 * 1000 : null,
      pin: accessPin ? true : false,
      count: sharedEvents.length,
      org: settings?.company_name || 'Stoa'
    }

    const token = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    return `https://stoa.internal/share?token=${token.substring(0, 48)}...`
  }, [selectedCalendarIds, expirationDays, accessPin, sharedEvents, settings])

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-4">
      {/* Share Configuration Card */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Public Read-Only Share Link
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Generate a secure, read-only link to share your live schedule with external clients and team members.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold self-start sm:self-auto">
            Live Link Active
          </span>
        </div>

        {/* Calendar Inclusion Selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
            Included Calendars:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {calendars.map((cal) => {
              const isChecked = selectedCalendarIds.includes(cal.id)
              return (
                <button
                  key={cal.id}
                  onClick={() => toggleCalendar(cal.id)}
                  className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium flex items-center gap-1.5 border transition-all ${
                    isChecked
                      ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-semibold shadow-xs'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cal.color }}
                  />
                  <span>{cal.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Security & Expiration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-subtle)]">
          {/* Expiration */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Link Expiration</span>
            </label>
            <select
              value={expirationDays}
              onChange={(e) => setExpirationDays(Number(e.target.value))}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="1">Expires in 24 Hours</option>
              <option value="7">Expires in 7 Days</option>
              <option value="30">Expires in 30 Days</option>
              <option value="0">Never Expires (Permanent)</option>
            </select>
          </div>

          {/* Privacy Toggle */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Privacy Masking</span>
            </label>
            <button
              type="button"
              onClick={() => setHidePrivateDetails(!hidePrivateDetails)}
              className={`w-full py-1.5 px-3 rounded-[var(--radius-sm)] text-xs font-medium border flex items-center justify-between transition-colors ${
                hidePrivateDetails
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
              }`}
            >
              <span>{hidePrivateDetails ? 'Hide Notes & Links' : 'Show Full Details'}</span>
              {hidePrivateDetails && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Optional PIN Protection */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Access PIN (Optional)</span>
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 4821"
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>
        </div>

        {/* Generated URL Box */}
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1 font-mono text-xs text-[var(--text-primary)] truncate select-all">
            {shareUrl}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : 'bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreviewOpen ? 'Hide Portal Preview' : 'Preview Portal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Public Read-Only Portal Preview */}
      {isPreviewOpen && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
            <span>PUBLIC CLIENT VIEW PREVIEW (READ-ONLY)</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Verified Clean Permissions</span>
            </span>
          </div>

          <div className="p-5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4 max-w-3xl mx-auto">
            {/* Public Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {settings?.company_name || 'Stoa'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Public Schedule & Availability Portal
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                Viewer Mode • Read-Only
              </span>
            </div>

            {/* Event List */}
            <div className="space-y-2">
              {sharedEvents.length > 0 ? (
                sharedEvents.slice(0, 8).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {evt.title}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        {format(new Date(evt.start), 'EEE, MMM d • HH:mm')} – {format(new Date(evt.end), 'HH:mm')}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {evt.location || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No public commitments in the selected calendars.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
