import React, { useState } from 'react'
import {
  Brain,
  Mic,
  MicOff,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  Send
} from 'lucide-react'
import { useNeuralStore } from '../../store/useNeuralStore'
import { useAppStore } from '../../store/useAppStore'

export const ThoughtIntentConsole: React.FC = () => {
  const {
    parseThought,
    activeDraft,
    acceptDraftToCalendar,
    dismissDraft,
    draftHistory
  } = useNeuralStore()
  const { resources, subjects } = useAppStore()

  const [thoughtInput, setThoughtInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduledSuccess, setScheduledSuccess] = useState<string | null>(null)

  const handleParse = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!thoughtInput.trim()) return
    parseThought(thoughtInput.trim())
    setThoughtInput('')
  }

  // Web Speech API Voice Thought Capture
  const toggleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not natively supported in this runtime environment. You can type thoughts directly!')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setThoughtInput(transcript)
        parseThought(transcript)
      }

      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  const handleAccept = async (draftId: string) => {
    setIsSubmitting(true)
    const success = await acceptDraftToCalendar(draftId)
    setIsSubmitting(false)
    if (success) {
      setScheduledSuccess('Scheduled directly into your master calendar!')
      setTimeout(() => setScheduledSuccess(null), 3500)
    }
  }

  // Real-time dynamic stream presets derived from actual SQLite team members and subjects
  const teamMember1 = resources.find((r) => r.type === 'person')?.name || 'Team'
  const teamMember2 = resources.filter((r) => r.type === 'person')[1]?.name || 'Lead Architect'
  const focusSubject = subjects[0]?.name || 'Deep Architecture'

  const thoughtPresets = [
    `Meeting with ${teamMember1} tomorrow at 2pm for 45 minutes`,
    `2 hour ${focusSubject} block tomorrow morning at 9am`,
    `Architecture sync with ${teamMember2} on Friday at 10am`,
    'Urgent emergency incident review this afternoon at 4pm'
  ]

  return (
    <div className="space-y-5">
      {scheduledSuccess && (
        <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scheduledSuccess}</span>
        </div>
      )}

      {/* Thought Stream Input Bar */}
      <form onSubmit={handleParse} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={thoughtInput}
            onChange={(e) => setThoughtInput(e.target.value)}
            placeholder="Think or dictate: e.g. 'Meeting with Sarah tomorrow at 2pm for 45 minutes'..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[var(--radius-lg)] pl-10 pr-12 py-3 text-xs text-[var(--text-primary)] shadow-sm outline-none transition-all placeholder:text-[var(--text-muted)]"
          />
          <Brain className="w-4 h-4 text-[var(--accent)] absolute left-3.5 top-3.5" />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleSpeech}
            className={`absolute right-3 top-2.5 p-1 rounded-md transition-colors ${
              isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Dictate thought via microphone"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={!thoughtInput.trim()}
          className="btn-primary py-3 px-4 text-xs inline-flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-40"
        >
          <span>Parse Intent</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Quick Thought Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-[var(--text-muted)] mr-1">
          Stream Presets:
        </span>
        {thoughtPresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setThoughtInput(preset)
              parseThought(preset)
            }}
            className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] text-[10px] font-mono transition-colors"
          >
            "{preset}"
          </button>
        ))}
      </div>

      {/* Active Neural Intent Card (Parsed Thought Draft) */}
      {activeDraft && (
        <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
                  Decoded Neural Intent
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">
                  {activeDraft.confidenceScore}% Bayesian Confidence
                </span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {activeDraft.extractedTitle}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                Thought stream: "{activeDraft.rawThoughtStream}"
              </p>
            </div>

            <button
              onClick={() => dismissDraft(activeDraft.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-subtle)]"
              title="Dismiss draft"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-0.5">
              <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" /> Date
              </span>
              <span className="font-bold text-[var(--text-primary)]">{activeDraft.suggestedDate}</span>
            </div>

            <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-0.5">
              <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Time
              </span>
              <span className="font-bold text-[var(--text-primary)]">{activeDraft.suggestedTime}</span>
            </div>

            <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-0.5">
              <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Duration
              </span>
              <span className="font-bold text-[var(--text-primary)]">{activeDraft.durationMinutes} mins</span>
            </div>

            <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-0.5">
              <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                <UserCheck className="w-2.5 h-2.5" /> Attendees
              </span>
              <span className="font-bold text-[var(--text-primary)] truncate block">
                {activeDraft.attendees.length > 0 ? activeDraft.attendees.join(', ') : 'Solo Focus'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Decoded from cognitive state: <strong className="text-[var(--text-secondary)]">{activeDraft.sourceCognitiveState.replace('_', ' ')}</strong>
            </span>

            <button
              onClick={() => handleAccept(activeDraft.id)}
              disabled={isSubmitting}
              className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{isSubmitting ? 'Scheduling...' : 'Accept & Add to Calendar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Neural Drafts History */}
      {draftHistory.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Recent Neural Decoded Intents ({draftHistory.length})
          </span>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {draftHistory.map((draft) => (
              <div
                key={draft.id}
                className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">
                    {draft.extractedTitle}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-2 mt-0.5">
                    <span>{draft.suggestedDate} at {draft.suggestedTime}</span>
                    <span>•</span>
                    <span>{draft.durationMinutes}m</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{draft.confidenceScore}% conf</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAccept(draft.id)}
                  className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--accent)] shrink-0 transition-colors"
                >
                  Schedule
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
