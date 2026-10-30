import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  X,
  Sliders,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check
} from 'lucide-react'

export interface DashboardWidgetConfig {
  id: string
  label: string
  description: string
  visible: boolean
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'next_event', label: 'Next Scheduled Meeting Banner', description: 'Countdown timer, meeting link & direct join action', visible: true },
  { id: 'metrics', label: 'Key Metric Counters', description: "Today's events, rooms, staff count & total schedules", visible: true },
  { id: 'load_analyzer', label: 'Meeting Load Analyzer', description: 'Weekly meeting saturation score and focus recovery', visible: true },
  { id: 'today_timeline', label: "Today's Agenda Timeline", description: 'Hourly breakdown of current day appointments', visible: true },
  { id: 'category_distribution', label: 'Category Allocation Distribution', description: 'Visual breakdown by appointment category', visible: true }
]

export const DashboardCustomizerModal: React.FC<{
  widgets: DashboardWidgetConfig[]
  onUpdateWidgets: (widgets: DashboardWidgetConfig[]) => void
}> = ({ widgets, onUpdateWidgets }) => {
  const { isDashboardCustomizerOpen, setIsDashboardCustomizerOpen } = useAppStore()

  if (!isDashboardCustomizerOpen) return null

  const handleToggleVisible = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    onUpdateWidgets(updated)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= widgets.length) return
    const updated = [...widgets]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    onUpdateWidgets(updated)
  }

  const handleReset = () => {
    onUpdateWidgets(DEFAULT_DASHBOARD_WIDGETS)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)] animate-in fade-in duration-150">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-md w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Customize Dashboard Layout
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Reorder widgets and toggle visibility to personalize your workspace.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDashboardCustomizerOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Widgets List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {widgets.map((widget, idx) => (
            <div
              key={widget.id}
              className={`p-3 rounded-[var(--radius-sm)] border flex items-center justify-between gap-3 transition-colors ${
                widget.visible
                  ? 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
                  : 'bg-[var(--bg-subtle)]/40 border-dashed border-[var(--border-subtle)] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleVisible(widget.id)}
                  className={`p-1.5 rounded transition-colors ${
                    widget.visible
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}
                  title={widget.visible ? 'Hide Widget' : 'Show Widget'}
                >
                  {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {widget.label}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                    {widget.description}
                  </div>
                </div>
              </div>

              {/* Up / Down Order Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 rounded hover:bg-[var(--bg-hover)] transition-colors"
                  title="Move Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={idx === widgets.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 rounded hover:bg-[var(--bg-hover)] transition-colors"
                  title="Move Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDashboardCustomizerOpen(false)}
            className="px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Layout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
