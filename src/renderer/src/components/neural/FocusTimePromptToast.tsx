import React from 'react'
import { useNeuralStore } from '../../store/useNeuralStore'
import { Sparkles, X, Check, Clock } from 'lucide-react'

export const FocusTimePromptToast: React.FC = () => {
  const { pendingFocusPrompt, confirmFocusBlock, dismissFocusPrompt } = useNeuralStore()

  if (!pendingFocusPrompt) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200 select-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              Deep Focus Detected
            </h4>
            <p className="text-[10px] text-emerald-400 font-medium">
              Productive work flow active
            </p>
          </div>
        </div>

        <button
          onClick={dismissFocusPrompt}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mt-2.5 leading-relaxed">
        Would you like to reserve the next <span className="font-semibold text-[var(--text-primary)]">60 minutes</span> as uninterrupted <span className="font-semibold text-[var(--text-primary)]">Focus Time (Do Not Disturb)</span> on your calendar?
      </p>

      <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <button
          onClick={dismissFocusPrompt}
          className="px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
        >
          Not Now
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => confirmFocusBlock(30)}
            className="px-2 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all flex items-center gap-1 cursor-pointer"
            title="Block 30 minutes"
          >
            <Clock className="w-3 h-3 text-[var(--text-muted)]" />
            <span>30m</span>
          </button>

          <button
            onClick={() => confirmFocusBlock(60)}
            className="px-3 py-1.5 text-xs font-bold bg-white text-black hover:bg-neutral-200 active:scale-[0.98] rounded-[var(--radius-md)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>Block 60m Focus</span>
          </button>
        </div>
      </div>
    </div>
  )
}
