/**
 * Multiverse Decision Tree SVG Visualizer
 * Interactive Branching Graph showing Root Reality, CRDT Document Forks & Decision Nodes
 */

import React from 'react'
import type { ScenarioBranch } from '../../types/scenarioWorld'
import { GitBranch, Plus } from 'lucide-react'

interface MultiverseTreeGraphProps {
  branches: Record<string, ScenarioBranch>
  activeBranchId: string
  selectedBranchId: string
  onSelectBranch: (id: string) => void
  onOpenForkModal: (parentBranchId?: string) => void
}

interface NodeLayout {
  branch: ScenarioBranch
  x: number
  y: number
  depth: number
}

export const MultiverseTreeGraph: React.FC<MultiverseTreeGraphProps> = ({
  branches,
  activeBranchId,
  selectedBranchId,
  onSelectBranch,
  onOpenForkModal
}) => {
  const branchList = Object.values(branches)
  const root = branches['reality-root'] || branchList[0]

  if (!root) {
    return <div className="p-8 text-center text-xs text-[var(--text-muted)]">No active multiverse branches.</div>
  }

  // Compute hierarchical layout coordinates
  const nodeMap = new Map<string, NodeLayout>()
  const rootLayout: NodeLayout = { branch: root, x: 80, y: 160, depth: 0 }
  nodeMap.set(root.id, rootLayout)

  // Direct children of root
  const children = branchList.filter((b) => b.parentBranchId === root.id)
  const childCount = children.length

  children.forEach((child, index) => {
    const spacingY = 90
    const startY = 160 - ((childCount - 1) * spacingY) / 2
    const y = startY + index * spacingY
    nodeMap.set(child.id, { branch: child, x: 340, y, depth: 1 })

    // Grandchildren
    const subChildren = branchList.filter((b) => b.parentBranchId === child.id)
    subChildren.forEach((sub, subIdx) => {
      const subY = y + (subIdx - (subChildren.length - 1) / 2) * 60
      nodeMap.set(sub.id, { branch: sub, x: 600, y: subY, depth: 2 })
    })
  })

  // Height & width of SVG canvas
  const svgWidth = 780
  const svgHeight = Math.max(340, (childCount + 1) * 90)

  return (
    <div className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-xs space-y-4 select-none overflow-x-auto no-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              CRDT Multiverse Decision Tree
            </h3>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Every branch is a mathematically isolated Automerge document fork. Click to inspect timeline and impact.
          </p>
        </div>

        <button
          onClick={() => onOpenForkModal(selectedBranchId)}
          className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Fork New Universe</span>
        </button>
      </div>

      <div className="flex items-center justify-center overflow-x-auto no-scrollbar py-2">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          <defs>
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--border-strong)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Connecting Branch Bezier Splines */}
          {branchList.map((branch) => {
            if (!branch.parentBranchId) return null
            const parent = nodeMap.get(branch.parentBranchId)
            const current = nodeMap.get(branch.id)
            if (!parent || !current) return null

            const midX = (parent.x + current.x) / 2
            const pathD = `M ${parent.x + 90} ${parent.y} C ${midX} ${parent.y}, ${midX} ${current.y}, ${current.x - 90} ${current.y}`

            const isPathActive = branch.id === selectedBranchId || branch.id === activeBranchId

            return (
              <g key={`edge-${branch.id}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isPathActive ? branch.color : 'var(--border-default)'}
                  strokeWidth={isPathActive ? 2.5 : 1.5}
                  strokeDasharray={branch.id === activeBranchId ? undefined : isPathActive ? '4 2' : '2 3'}
                  opacity={isPathActive ? 1 : 0.45}
                  className="transition-all duration-300"
                />
              </g>
            )
          })}

          {/* Interactive Branch Nodes */}
          {Array.from(nodeMap.values()).map(({ branch, x, y }) => {
            const isSelected = branch.id === selectedBranchId
            const isReality = branch.id === 'reality-root'
            const isEnacted = branch.id === activeBranchId

            return (
              <g
                key={`node-${branch.id}`}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectBranch(branch.id)}
                className="cursor-pointer group"
              >
                {/* Node Background Capsule */}
                <rect
                  x="-85"
                  y="-26"
                  width="170"
                  height="52"
                  rx="10"
                  fill="var(--bg-app)"
                  stroke={isSelected ? branch.color : isEnacted ? 'var(--accent)' : 'var(--border-default)'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-200 group-hover:stroke-[var(--border-strong)] shadow-md"
                />

                {/* Left Colored Accent Bar */}
                <rect
                  x="-85"
                  y="-26"
                  width="4"
                  height="52"
                  rx="2"
                  fill={branch.color}
                />

                {/* Title and Tag */}
                <text
                  x="-72"
                  y="-7"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="bold"
                  className="truncate"
                >
                  {branch.name.length > 18 ? `${branch.name.slice(0, 16)}...` : branch.name}
                </text>

                {/* Subtitle / Archetype */}
                <text
                  x="-72"
                  y="8"
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isReality ? 'Baseline Reality' : `${branch.projections.weeklyScheduledHours}h/wk • $${Math.round(branch.projections.annualProjectedCompensationUsd / 1000)}k`}
                </text>

                {/* Status Badges */}
                {isEnacted && (
                  <g transform="translate(56, -18)">
                    <rect width="20" height="12" rx="3" fill="var(--accent)" />
                    <text x="3" y="9" fontSize="8" fontWeight="bold" fill="var(--accent-text)" fontFamily="monospace">LIVE</text>
                  </g>
                )}

                {/* Burnout Risk Dot */}
                <circle
                  cx="70"
                  cy="12"
                  r="4"
                  fill={
                    branch.projections.burnoutRiskIndex > 65
                      ? '#ef4444'
                      : branch.projections.burnoutRiskIndex > 45
                      ? '#f59e0b'
                      : '#10b981'
                  }
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)] font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Low Burnout
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Elevated Load
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" /> High Friction
          </span>
        </div>
        <span>Lamport Vector Forks: {branchList.length}</span>
      </div>
    </div>
  )
}
