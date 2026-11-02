import React from 'react'
import type { DimensionVector } from '../../types/crossDimensional'

interface RadarChart6DProps {
  baseline: DimensionVector
  simulated?: DimensionVector
  isSimulating?: boolean
  size?: number
}

interface AxisDef {
  key: string
  label: string
  unit: string
  getScore: (v: DimensionVector) => number // 0 to 100
  getRawText: (v: DimensionVector) => string
}

const AXES: AxisDef[] = [
  {
    key: 'time',
    label: 'Time Balance',
    unit: 'hrs',
    getScore: (v) => Math.min(100, Math.round((v.timeDeepWorkHours / Math.max(1, v.timeScheduledHours)) * 100)),
    getRawText: (v) => `${v.timeScheduledHours}h Work`
  },
  {
    key: 'energy',
    label: 'Energy Battery',
    unit: '%',
    getScore: (v) => v.energyBatteryPct,
    getRawText: (v) => `${v.energyBatteryPct}% Battery`
  },
  {
    key: 'attention',
    label: 'Attention Depth',
    unit: 'pts',
    getScore: (v) => v.attentionFocusPoints,
    getRawText: (v) => `${v.attentionFocusPoints} Focus Pts`
  },
  {
    key: 'money',
    label: 'Economic Yield',
    unit: '$',
    getScore: (v) => Math.min(100, Math.round((v.moneyGrossValueUsd / Math.max(1000, (v.moneyHourlyEffectiveRate || 150) * 40)) * 100)),
    getRawText: (v) => `$${v.moneyGrossValueUsd}`
  },
  {
    key: 'relationships',
    label: 'Trust Capital',
    unit: 'trust',
    getScore: (v) => v.relationshipTrustCapital,
    getRawText: (v) => `${v.relationshipTrustCapital} Trust`
  },
  {
    key: 'health',
    label: 'Vitality / Low Stress',
    unit: 'index',
    getScore: (v) => 100 - v.healthStressLoad,
    getRawText: (v) => `${100 - v.healthStressLoad} Vitality`
  }
]

export const RadarChart6D: React.FC<RadarChart6DProps> = ({
  baseline,
  simulated,
  isSimulating = false,
  size = 380
}) => {
  const center = size / 2
  const radius = size * 0.38
  const totalAxes = AXES.length

  // Calculate coordinates for a polygon given a vector
  const getCoordinates = (vec: DimensionVector) => {
    return AXES.map((axis, i) => {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2
      const score = Math.max(10, Math.min(100, axis.getScore(vec)))
      const r = (score / 100) * radius
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)
      return { x, y, score, raw: axis.getRawText(vec), label: axis.label }
    })
  }

  const baseCoords = getCoordinates(baseline)
  const basePolygonPath = baseCoords.map((c) => `${c.x},${c.y}`).join(' ')

  const simCoords = simulated ? getCoordinates(simulated) : null
  const simPolygonPath = simCoords ? simCoords.map((c) => `${c.x},${c.y}`).join(' ') : null

  // Rings for 20%, 40%, 60%, 80%, 100%
  const ringLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background concentric reference webs */}
        {ringLevels.map((lvl, idx) => {
          const ringPoints = AXES.map((_, i) => {
            const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2
            const r = lvl * radius
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
          }).join(' ')

          return (
            <polygon
              key={idx}
              points={ringPoints}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth={idx === 4 ? '1.5' : '1'}
              strokeDasharray={idx < 4 ? '3 3' : undefined}
              opacity={0.6}
            />
          )
        })}

        {/* Radial Axis Spokes */}
        {AXES.map((axis, i) => {
          const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2
          const endX = center + radius * Math.cos(angle)
          const endY = center + radius * Math.sin(angle)

          // Label placement offset
          const labelDist = radius + 24
          const labelX = center + labelDist * Math.cos(angle)
          const labelY = center + labelDist * Math.sin(angle)

          return (
            <g key={axis.key}>
              <line
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-bold fill-[var(--text-secondary)]"
              >
                {axis.label}
              </text>
            </g>
          )
        })}

        {/* Baseline Schedule Polygon (Teal/Neutral) */}
        <polygon
          points={basePolygonPath}
          fill="rgba(56, 189, 248, 0.15)"
          stroke="#38bdf8"
          strokeWidth="2"
          className="transition-all duration-300"
        />

        {baseCoords.map((c, i) => (
          <circle
            key={`base-${i}`}
            cx={c.x}
            cy={c.y}
            r="3.5"
            fill="#38bdf8"
            className="transition-all duration-300"
          >
            <title>{`${c.label}: ${c.raw} (${c.score}/100)`}</title>
          </circle>
        ))}

        {/* Simulated / Pareto Optimization Polygon (Emerald/Amber) */}
        {simPolygonPath && isSimulating && (
          <>
            <polygon
              points={simPolygonPath}
              fill="rgba(16, 185, 129, 0.22)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              className="transition-all duration-300 animate-in fade-in"
            />
            {simCoords?.map((c, i) => (
              <circle
                key={`sim-${i}`}
                cx={c.x}
                cy={c.y}
                r="4"
                fill="#10b981"
                className="transition-all duration-300"
              >
                <title>{`Simulated ${c.label}: ${c.raw} (${c.score}/100)`}</title>
              </circle>
            ))}
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#38bdf8]/30 border border-[#38bdf8]" />
          <span className="text-[var(--text-secondary)]">Current Schedule</span>
        </div>
        {isSimulating && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#10b981]/40 border border-[#10b981]" />
            <span className="text-emerald-400 font-bold">Simulated Pareto Target</span>
          </div>
        )}
      </div>
    </div>
  )
}
