import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Rss, X, DownloadCloud, CheckCircle2, AlertTriangle } from 'lucide-react'

export const FeedSubscriptionModal: React.FC = () => {
  const {
    isFeedSubscriptionModalOpen,
    setIsFeedSubscriptionModalOpen,
    importIcsFeed
  } = useAppStore()

  const [feedMode, setFeedMode] = useState<'url' | 'file'>('url')
  const [feedUrl, setFeedUrl] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [calendarName, setCalendarName] = useState('')
  const [calendarColor, setCalendarColor] = useState('#404040')

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ count: number; name: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isFeedSubscriptionModalOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    setCalendarName(file.name.replace(/\.ics$/i, ''))
    const reader = new FileReader()
    reader.onload = (evt) => {
      setRawContent(evt.target?.result as string || '')
    }
    reader.readAsText(file)
  }

  const handleSubscribe = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsSyncing(true)
    setErrorMsg(null)
    setSyncResult(null)

    try {
      if (feedMode === 'url' && !feedUrl.trim()) return
      if (feedMode === 'file' && !rawContent.trim()) return

      const res = await importIcsFeed({
        url: feedMode === 'url' ? feedUrl.trim() : undefined,
        content: feedMode === 'file' ? rawContent.trim() : undefined,
        calendarName: calendarName.trim() || undefined,
        calendarColor
      })

      setSyncResult({
        count: res.importedCount,
        name: res.calendar.name
      })

      setTimeout(() => {
        setIsFeedSubscriptionModalOpen(false)
        setFeedUrl('')
        setRawContent('')
        setSyncResult(null)
      }, 1500)
    } catch (err: any) {
      console.error('Import feed error:', err)
      setErrorMsg(err.message || 'Failed to fetch or parse calendar feed.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-md w-full p-5 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center">
              <Rss className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Subscribe to External Calendar Feed
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Sync .ics / Webcal feeds from Google, Outlook, Apple or conferences.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFeedSubscriptionModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs">
          <button
            type="button"
            onClick={() => setFeedMode('url')}
            className={`flex-1 py-1 rounded-[var(--radius-sm)] font-medium transition-all ${
              feedMode === 'url'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Webcal / ICS URL
          </button>
          <button
            type="button"
            onClick={() => setFeedMode('file')}
            className={`flex-1 py-1 rounded-[var(--radius-sm)] font-medium transition-all ${
              feedMode === 'file'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Import .ics File
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubscribe} className="space-y-3.5">
          {feedMode === 'url' ? (
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                iCalendar Feed Address *
              </label>
              <input
                type="text"
                required
                placeholder="webcal://... or https://.../calendar.ics"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Works with Google Calendar secret addresses, Outlook Webcal, and Apple iCloud links.
              </span>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Select .ics File *
              </label>
              <input
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                className="w-full text-xs text-[var(--text-secondary)] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-[var(--border-subtle)] file:text-xs file:bg-[var(--bg-subtle)] file:text-[var(--text-primary)] file:cursor-pointer"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Calendar Name
              </label>
              <input
                type="text"
                placeholder="e.g. Work Outlook Feed"
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Tag Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {['#0A0A0A', '#404040', '#737373', '#0284c7', '#059669', '#d97706'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCalendarColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      calendarColor === c ? 'ring-2 ring-[var(--accent)] scale-110' : 'opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feedback */}
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {syncResult && (
            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Successfully synced & imported {syncResult.count} events into "{syncResult.name}".
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFeedSubscriptionModalOpen(false)}
              className="btn-secondary text-xs py-1 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="btn-primary text-xs py-1 px-3.5 font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Fetching & Syncing...' : 'Subscribe & Sync'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
