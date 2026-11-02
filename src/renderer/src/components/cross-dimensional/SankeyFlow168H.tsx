import React from 'react'
import type { DimensionVector } from '../../types/crossDimensional'
import { useBurnoutStore } from '../../store/useBurnoutStore'

interface SankeyFlow168HProps {
  vector: DimensionVector
  width?: number
  height?: number
}

interface SankeyNode {
  id: string
  label: string
  value: number
  color: string
  x: number
  y: number
  h: number
}

export const SankeyFlow168H: React.FC<SankeyFlow168HProps> = ({
  vector,
  width = 720,
  height = 320
}) => {
  const { profile } = useBurnoutStore()

  // Layout 3 vertical columns
  const col1X = 20
  const col2X = 260
  const col3X = 520
  const nodeWidth = 14

  // Node tallies dynamically derived from chronotype and real schedule
  const dailySleep = profile?.chronotype === 'early-bird' ? 8 : profile?.chronotype === 'night-owl' ? 7.5 : 7.8
  const sleep = Math.round(dailySleep * 7)
  const work = Math.max(5, vector.timeScheduledHours)
  const discretionary = Math.max(5, 168 - sleep - work)

  const deepWork = Math.max(2, vector.timeDeepWorkHours)
  const billable = Math.max(2, vector.moneyBillableHours)
  const meetings = Math.max(2, vector.timeMeetingHours)

  const social = Math.max(2, vector.relationshipOneOnOneHours)
  const healthSports = Math.max(4, Math.round(discretionary * 0.35))

  const scale = (height - 60) / 168

  // Level 1: Root Node
  const rootNode: SankeyNode = {
    id: 'root',
    label: '168h Total Weekly Life Budget',
    value: 168,
    color: '#38bdf8',
    x: col1X,
    y: 30,
    h: 168 * scale
  }

  // Level 2: Primary Allocations
  const l2Nodes: SankeyNode[] = [
    {
      id: 'sleep',
      label: `Sleep & Recovery (${sleep}h)`,
      value: sleep,
      color: '#0284c7',
      x: col2X,
      y: 30,
      h: sleep * scale
    },
    {
      id: 'work',
      label: `Scheduled Work (${work.toFixed(0)}h)`,
      value: work,
      color: '#8b5cf6',
      x: col2X,
      y: 30 + (sleep * scale) + 12,
      h: work * scale
    },
    {
      id: 'rest',
      label: `Discretionary Rest (${discretionary.toFixed(0)}h)`,
      value: discretionary,
      color: '#10b981',
      x: col2X,
      y: 30 + (sleep * scale) + (work * scale) + 24,
      h: discretionary * scale
    }
  ]

  // Level 3: Detailed Channels
  let currY3 = 30
  const l3WorkNodes: SankeyNode[] = [
    {
      id: 'deep',
      label: `Deep Focus Architecture (${deepWork.toFixed(0)}h)`,
      value: deepWork,
      color: '#6366f1',
      x: col3X,
      y: (currY3 += 0),
      h: Math.max(8, deepWork * scale)
    },
    {
      id: 'billable',
      label: `Client Billable ($) (${billable.toFixed(0)}h)`,
      value: billable,
      color: '#eab308',
      x: col3X,
      y: (currY3 += Math.max(8, deepWork * scale) + 8),
      h: Math.max(8, billable * scale)
    },
    {
      id: 'syncs',
      label: `Internal Meetings (${meetings.toFixed(0)}h)`,
      value: meetings,
      color: '#f97316',
      x: col3X,
      y: (currY3 += Math.max(8, billable * scale) + 8),
      h: Math.max(8, meetings * scale)
    },
    {
      id: 'social',
      label: `1:1 Social Trust (${social.toFixed(0)}h)`,
      value: social,
      color: '#ec4899',
      x: col3X,
      y: (currY3 += Math.max(8, meetings * scale) + 12),
      h: Math.max(8, social * scale)
    },
    {
      id: 'health',
      label: `Vitality & Active Health (${healthSports.toFixed(0)}h)`,
      value: healthSports,
      color: '#10b981',
      x: col3X,
      y: (currY3 += Math.max(8, social * scale) + 8),
      h: Math.max(8, healthSports * scale)
    }
  ]

  // Helper to draw ribbon path between two nodes
  const drawRibbon = (
    x0: number,
    y0: number,
    h0: number,
    x1: number,
    y1: number,
    h1: number,
    color: string
  ) => {
    const dx = (x1 - x0) * 0.5
    return (
      <path
        d={`
          M ${x0} ${y0}
          C ${x0 + dx} ${y0}, ${x1 - dx} ${y1}, ${x1} ${y1}
          L ${x1} ${y1 + h1}
          C ${x1 - dx} ${y1 + h1}, ${x0 + dx} ${y0 + h0}, ${x0} ${y0 + h0}
          Z
        `}
        fill={color}
        opacity={0.3}
        className="transition-all duration-300 hover:opacity-60 cursor-pointer"
      />
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 select-none overflow-x-auto">
      <svg width={width} height={height} className="max-w-full overflow-visible">
        {/* Flows from Root -> Level 2 */}
        {drawRibbon(
          rootNode.x + nodeWidth,
          rootNode.y,
          l2Nodes[0].h,
          l2Nodes[0].x,
          l2Nodes[0].y,
          l2Nodes[0].h,
          l2Nodes[0].color
        )}
        {drawRibbon(
          rootNode.x + nodeWidth,
          rootNode.y + l2Nodes[0].h,
          l2Nodes[1].h,
          l2Nodes[1].x,
          l2Nodes[1].y,
          l2Nodes[1].h,
          l2Nodes[1].color
        )}
        {drawRibbon(
          rootNode.x + nodeWidth,
          rootNode.y + l2Nodes[0].h + l2Nodes[1].h,
          l2Nodes[2].h,
          l2Nodes[2].x,
          l2Nodes[2].y,
          l2Nodes[2].h,
          l2Nodes[2].color
        )}

        {/* Flows from Work -> Detailed Channels */}
        {drawRibbon(
          l2Nodes[1].x + nodeWidth,
          l2Nodes[1].y,
          l3WorkNodes[0].h,
          l3WorkNodes[0].x,
          l3WorkNodes[0].y,
          l3WorkNodes[0].h,
          l3WorkNodes[0].color
        )}
        {drawRibbon(
          l2Nodes[1].x + nodeWidth,
          l2Nodes[1].y + l3WorkNodes[0].h,
          l3WorkNodes[1].h,
          l3WorkNodes[1].x,
          l3WorkNodes[1].y,
          l3WorkNodes[1].h,
          l3WorkNodes[1].color
        )}
        {drawRibbon(
          l2Nodes[1].x + nodeWidth,
          l2Nodes[1].y + l3WorkNodes[0].h + l3WorkNodes[1].h,
          l3WorkNodes[2].h,
          l3WorkNodes[2].x,
          l3WorkNodes[2].y,
          l3WorkNodes[2].h,
          l3WorkNodes[2].color
        )}

        {/* Flows from Rest -> Social & Health */}
        {drawRibbon(
          l2Nodes[2].x + nodeWidth,
          l2Nodes[2].y,
          l3WorkNodes[3].h,
          l3WorkNodes[3].x,
          l3WorkNodes[3].y,
          l3WorkNodes[3].h,
          l3WorkNodes[3].color
        )}
        {drawRibbon(
          l2Nodes[2].x + nodeWidth,
          l2Nodes[2].y + l3WorkNodes[3].h,
          l3WorkNodes[4].h,
          l3WorkNodes[4].x,
          l3WorkNodes[4].y,
          l3WorkNodes[4].h,
          l3WorkNodes[4].color
        )}

        {/* Root Node Bar */}
        <rect
          x={rootNode.x}
          y={rootNode.y}
          width={nodeWidth}
          height={rootNode.h}
          rx={3}
          fill={rootNode.color}
        />
        <text
          x={rootNode.x}
          y={rootNode.y - 10}
          className="text-[10px] font-bold font-mono fill-[var(--text-primary)]"
        >
          {rootNode.label}
        </text>

        {/* Level 2 Node Bars & Labels */}
        {l2Nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={nodeWidth}
              height={Math.max(6, n.h)}
              rx={3}
              fill={n.color}
            />
            <text
              x={n.x}
              y={n.y - 6}
              className="text-[10px] font-semibold font-mono fill-[var(--text-secondary)]"
            >
              {n.label}
            </text>
          </g>
        ))}

        {/* Level 3 Node Bars & Labels */}
        {l3WorkNodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={nodeWidth}
              height={Math.max(6, n.h)}
              rx={3}
              fill={n.color}
            />
            <text
              x={n.x + nodeWidth + 6}
              y={n.y + Math.max(6, n.h) / 2 + 3}
              className="text-[10px] font-semibold font-mono fill-[var(--text-primary)]"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
