/**
 * Scenario Fork Modal
 * Modal Dialog for Branching Alternate Timelines from Natural Language Prompts or Archetypes
 */

import React, { useState } from 'react'
import type { ScenarioWorldArchetype, ScenarioBranch } from '../../types/scenarioWorld'
import {
  GitBranch,
  X,
  Sparkles,
  Briefcase,
  Flame,
  Coffee,
  Globe,
  ArrowRight
} from 'lucide-react'

interface ScenarioForkModalProps {
  branches: Record<string, ScenarioBranch>
  initialParentId?: string
  onClose: () => void
  onFork: (params: {
    name: string
    archetype: ScenarioWorldArchetype
    parentBranchId?: string
    customPrompt?: string
  }) => void
}

export const ScenarioForkModal: React.FC<ScenarioForkModalProps> = ({
  branches,
  initialParentId,
  onClose,
  onFork
}) => {
  const [prompt, setPrompt] = useState('')
  const [branchName, setBranchName] = useState('')
  const [selectedArchetype, setSelectedArchetype] = useState<ScenarioWorldArchetype>('executive_leadership')
  const [parentBranchId, setParentBranchId] = useState(initialParentId || 'reality-root')

  const branchList = Object.values(branches)

  const archetypeOptions: Array<{
    id: ScenarioWorldArchetype
    title: string
    subtitle: string
    icon: React.ReactNode
    color: string
  }> = [
    {
      id: 'executive_leadership',
      title: 'VP / Executive Role',
      subtitle: '+85% comp, 40+ reports, executive steering, quarterly travel',
      icon: <Briefcase className="w-4 h-4 text-amber-400" />,
      color: '#f59e0b'
    },
    {
      id: 'startup_founder',
      title: 'Found Stealth Startup',
      subtitle: 'Extreme agency, deep architecture sprints, pitch demo days',
      icon: <Flame className="w-4 h-4 text-pink-400" />,
      color: '#ec4899'
    },
    {
      id: 'creative_sabbatical',
      title: 'Creative Sabbatical',
      subtitle: 'Solitary book writing, zero meetings, family & circadian reset',
      icon: <Coffee className="w-4 h-4 text-emerald-400" />,
      color: '#10b981'
    },
    {
      id: 'remote_nomad',
      title: 'Global Remote Nomad',
      subtitle: 'Asynchronous GitHub rhythm, cross-continent nomad living',
      icon: <Globe className="w-4 h-4 text-purple-400" />,
      color: '#8b5cf6'
    }
  ]

  const handleSelectArchetype = (arch: ScenarioWorldArchetype) => {
    setSelectedArchetype(arch)
    if (!branchName.trim()) {
      if (arch === 'executive_leadership') setBranchName('VP Engineering Offer')
      if (arch === 'startup_founder') setBranchName('AI Infrastructure Venture')
      if (arch === 'creative_sabbatical') setBranchName('Fellowship & Book Sabbatical')
      if (arch === 'remote_nomad') setBranchName('Remote Asynchronous Odyssey')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = branchName.trim() || prompt.trim() || 'Alternate Universe Branch'
    onFork({
      name,
      archetype: prompt ? 'custom' : selectedArchetype,
      parentBranchId,
      customPrompt: prompt.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-xs">
              <GitBranch className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Fork Generative Universe
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Natural Language Prompt */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              "What If..." Natural Language Prompt
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-[var(--accent)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value)
                  if (!branchName) setBranchName(e.target.value.slice(0, 30))
                }}
                placeholder="e.g. 'What if I took that VP role?' or 'Move to Berlin for 6 months'..."
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] focus:border-[var(--border-default)] rounded-[var(--radius-md)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              The neural generative priors engine extracts schedule constraints, travel cadence, and family impacts automatically.
            </p>
          </div>

          {/* Archetype Quick Select */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
              Or Select Universe Archetype
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {archetypeOptions.map((opt) => {
                const isSelected = selectedArchetype === opt.id && !prompt
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectArchetype(opt.id)}
                    className={`p-2.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-hover)] border-[var(--border-strong)] shadow-xs'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">{opt.icon}</div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{opt.title}</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">{opt.subtitle}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Branch Details */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Executive VP Offer"
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Parent Timeline
              </label>
              <select
                value={parentBranchId}
                onChange={(e) => setParentBranchId(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
              >
                {branchList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.archetype})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Synthesize Universe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
