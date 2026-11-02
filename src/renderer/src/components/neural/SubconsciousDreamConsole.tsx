import React, { useState } from 'react'
import {
  MoonStar,
  Sparkles,
  Mic,
  MicOff,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { useNeuralStore } from '../../store/useNeuralStore'
import { useAppStore } from '../../store/useAppStore'

export const SubconsciousDreamConsole: React.FC = () => {
  const {
    wakeTimeStr,
    setWakeTime,
    creativityWindows,
    dreamEntries,
    addDreamEntry
  } = useNeuralStore()

  const { createEvent, calendars } = useAppStore()

  const [dreamInput, setDreamInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [scheduledFeedback, setScheduledFeedback] = useState<string | null>(null)

  const handleRecordWakeVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not natively available in this environment. You can type your dream transcript directly!')
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => setIsRecording(true)
      rec.onend = () => setIsRecording(false)
      rec.onerror = () => setIsRecording(false)

      rec.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        setDreamInput(transcript)
      }

      rec.start()
    } catch {
      setIsRecording(false)
    }
  }

  const handleSaveDream = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dreamInput.trim()) return
    addDreamEntry(dreamInput.trim())
    setDreamInput('')
  }

  const handleScheduleAction = async (title: string, targetTime: string, durMins: number) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const startIso = new Date(`${todayStr}T${targetTime}:00`).toISOString()
    const endIso = new Date(new Date(startIso).getTime() + durMins * 60 * 1000).toISOString()
    const calId = calendars[0]?.id || 'cal-primary'

    await createEvent({
      id: `evt-dream-breakthrough-${Date.now()}`,
      calendar_id: calId,
      title: `✨ Subconscious Breakthrough: ${title}`,
      description: 'Scheduled during optimal ultradian sleep spindle creativity window.',
      start: startIso,
      end: endIso,
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'high',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    setScheduledFeedback(`Scheduled "${title}" into today's peak creativity window!`)
    setTimeout(() => setScheduledFeedback(null), 4000)
  }

  return (
    <div className="space-y-6">
      {scheduledFeedback && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scheduledFeedback}</span>
        </div>
      )}

      {/* Top Wake Time Config & Sleep Spindle Explanation */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <MoonStar className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Subconscious Pattern Mining & Sleep Spindles
              </h3>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Correlates NREM sleep spindle consolidation (12-16 Hz) with next-day 90-minute ultradian creativity crests.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--text-muted)]">Wake Anchor:</span>
            <input
              type="time"
              value={wakeTimeStr}
              onChange={(e) => setWakeTime(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>
        </div>

        {/* 5 Daily Ultradian Creativity Windows Timeline */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Forecasted 90-Minute Ultradian Creativity Windows
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {creativityWindows.map((win, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25">
                    Cycle {win.ultradianCycleNumber}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {win.predictedCreativityIndex}%
                  </span>
                </div>

                <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
                  {win.windowStart} – {win.windowEnd}
                </div>

                <div className="text-[10px] font-semibold text-[var(--accent)] capitalize">
                  {win.recommendedTaskType.replace('_', ' ')}
                </div>

                <p className="text-[9px] text-[var(--text-muted)] leading-tight">
                  {win.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wake-Up Dream Audio / Thought Journal */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Wake-Up Dream & Subconscious Insight Capture
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Transcribes fleeting morning subconscious associations
          </span>
        </div>

        <form onSubmit={handleSaveDream} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              placeholder="Dictate or type your morning dream recollections or waking epiphany: e.g. 'I saw a new distributed consensus algorithm where each node votes on calendar latency...'"
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={handleRecordWakeVoice}
              className={`absolute right-3 bottom-3 p-1.5 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              }`}
              title="Dictate wake voice stream"
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {isRecording ? 'Listening to voice stream in real time...' : 'NLP extracts priority themes & schedules breakthrough work.'}
            </span>
            <button
              type="submit"
              disabled={!dreamInput.trim()}
              className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>Analyze & Mine Subconscious Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Dream Entries & Mining Output */}
      {dreamEntries.length > 0 && (
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Mined Subconscious Insights & Spindle Logs ({dreamEntries.length})
          </span>

          <div className="space-y-3">
            {dreamEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-2 py-0.2 rounded-full font-mono text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/25 capitalize font-bold">
                      {entry.sentiment} Epiphany
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                    <span>Sleep Spindle Density:</span>
                    <span className="font-bold text-emerald-400">{entry.spindleCorrelationScore}%</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] italic">
                  "{entry.transcript}"
                </p>

                {/* Subconscious Themes */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Extracted Themes:</span>
                  {entry.subconsciousThemes.map((th, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    >
                      {th}
                    </span>
                  ))}
                </div>

                {/* Action Items for Calendar */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    Recommended Schedule Actions:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {entry.recommendedActionItems.map((act, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <div className="font-semibold text-[var(--text-primary)] truncate">
                            {act.title}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {act.targetWindow} ({act.suggestedDurationMins}m)
                          </div>
                        </div>

                        <button
                          onClick={() => handleScheduleAction(act.title, act.targetWindow, act.suggestedDurationMins)}
                          className="btn-primary py-1 px-2.5 text-[10px] font-bold shrink-0 shadow-xs"
                        >
                          Schedule
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
