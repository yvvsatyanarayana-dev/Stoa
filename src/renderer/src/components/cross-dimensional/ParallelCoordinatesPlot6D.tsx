import React, { useMemo } from 'react'
import type { DimensionVector } from '../../types/crossDimensional'

interface ParallelCoordinatesPlot6DProps {
  baseline: DimensionVector
  simulated?: DimensionVector
  isSimulating?: boolean
  width?: number
  height?: number
}

interface AxisDimension {
  id: string
  label: string
  min: number
  max: number
  unit: string
  getValue: (v: DimensionVector) => number
  formatValue: (val: number) => string
}

export const ParallelCoordinatesPlot6D: React.FC<ParallelCoordinatesPlot6DProps> = ({
  baseline,
  simulated,
  isSimulating = false,
  width = 720,
  height = 260
}) => {
  const maxMoney = Math.max(
    4000,
    Math.ceil((Math.max(baseline.moneyGrossValueUsd, simulated?.moneyGrossValueUsd || 0) * 1.25) / 1000) * 1000
  )
  const maxHours = Math.max(
    50,
    Math.ceil((Math.max(baseline.timeScheduledHours, simulated?.timeScheduledHours || 0) * 1.2) / 10) * 10
  )

  const axes: AxisDimension[] = useMemo(
    () => [
      {
        id: 'time',
        label: 'Work Load',
        min: 0,
        max: maxHours,
        unit: 'hrs',
        getValue: (v) => v.timeScheduledHours,
        formatValue: (val) => `${val.toFixed(0)}h`
      },
      {
        id: 'energy',
        label: 'Energy Batt',
        min: 0,
        max: 100,
        unit: '%',
        getValue: (v) => v.energyBatteryPct,
        formatValue: (val) => `${val}%`
      },
      {
        id: 'attention',
        label: 'Attention',
        min: 0,
        max: 100,
        unit: 'pts',
        getValue: (v) => v.attentionFocusPoints,
        formatValue: (val) => `${val}`
      },
      {
        id: 'money',
        label: 'Gross Yield',
        min: 0,
        max: maxMoney,
        unit: '$',
        getValue: (v) => v.moneyGrossValueUsd,
        formatValue: (val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
      },
      {
        id: 'relationships',
        label: 'Trust Capital',
        min: 0,
        max: 100,
        unit: 'trust',
        getValue: (v) => v.relationshipTrustCapital,
        formatValue: (val) => `${val}`
      },
      {
        id: 'health',
        label: 'Stress Load',
        min: 0,
        max: 100,
        unit: 'stress',
        getValue: (v) => v.healthStressLoad,
        formatValue: (val) => `${val}`
      }
    ],
    [maxHours, maxMoney]
  )

  const paddingX = 60
  const paddingTop = 45
  const paddingBottom = 45
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingTop - paddingBottom
  const numAxes = axes.length
  const axisSpacing = plotWidth / (numAxes - 1)

  // Map value to Y coordinate (inverted SVG coordinate space: max is at top)
  const getY = (axis: AxisDimension, val: number): number => {
    const clamped = Math.max(axis.min, Math.min(axis.max, val))
    const ratio = (clamped - axis.min) / (axis.max - axis.min)
    return paddingTop + plotHeight * (1 - ratio)
  }

  // Generate smooth path connecting values across all parallel axes
  const generatePath = (v: DimensionVector): string => {
    return axes.map((axis, i) => {
      const x = paddingX + i * axisSpacing
      const y = getY(axis, axis.getValue(v))
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  const basePath = generatePath(baseline)
  const simPath = simulated ? generatePath(simulated) : null

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 select-none overflow-x-auto no-scrollbar">
      <svg width={width} height={height} className="max-w-full">
        {/* Background Grid Lines (25%, 50%, 75%, 100%) */}
        {[0.25, 0.5, 0.75, 1.0].map((pct, idx) => {
          const y = paddingTop + plotHeight * (1 - pct)
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--border-subtle)"
              strokeDasharray="2 3"
              strokeWidth="1"
              opacity={0.5}
            />
          )
        })}

        {/* 6 Parallel Vertical Axes */}
        {axes.map((axis, i) => {
          const x = paddingX + i * axisSpacing
          return (
            <g key={axis.id}>
              {/* Vertical Spine */}
              <line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={paddingTop + plotHeight}
                stroke="var(--border-strong)"
                strokeWidth="2"
              />

              {/* Axis Header Label */}
              <text
                x={x}
                y={paddingTop - 18}
                textAnchor="middle"
                className="text-[11px] font-bold fill-[var(--text-primary)]"
              >
                {axis.label}
              </text>
              <text
                x={x}
                y={paddingTop - 6}
                textAnchor="middle"
                className="text-[9px] font-mono fill-[var(--text-muted)]"
              >
                ({axis.unit})
              </text>

              {/* Ticks: Top Max & Bottom Min */}
              <text
                x={x + 4}
                y={paddingTop + 6}
                textAnchor="start"
                className="text-[9px] font-mono fill-[var(--text-muted)]"
              >
                {axis.formatValue(axis.max)}
              </text>
              <text
                x={x + 4}
                y={paddingTop + plotHeight - 2}
                textAnchor="start"
                className="text-[9px] font-mono fill-[var(--text-muted)]"
              >
                {axis.formatValue(axis.min)}
              </text>

              {/* Baseline Value Marker Dot */}
              <circle
                cx={x}
                cy={getY(axis, axis.getValue(baseline))}
                r="4"
                fill="#38bdf8"
                stroke="var(--bg-elevated)"
                strokeWidth="1.5"
              />

              {/* Value label next to dot */}
              <text
                x={x - 6}
                y={getY(axis, axis.getValue(baseline)) + 3}
                textAnchor="end"
                className="text-[10px] font-mono font-bold fill-[#38bdf8]"
              >
                {axis.formatValue(axis.getValue(baseline))}
              </text>

              {/* Simulated Value Marker Dot if active */}
              {simulated && isSimulating && (
                <>
                  <circle
                    cx={x}
                    cy={getY(axis, axis.getValue(simulated))}
                    r="4.5"
                    fill="#10b981"
                    stroke="var(--bg-elevated)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + 6}
                    y={getY(axis, axis.getValue(simulated)) + 3}
                    textAnchor="start"
                    className="text-[10px] font-mono font-bold fill-emerald-400"
                  >
                    {axis.formatValue(axis.getValue(simulated))}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* Baseline Path Curve */}
        <path
          d={basePath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
          className="transition-all duration-300"
        />

        {/* Simulated Pareto Path Curve */}
        {simPath && isSimulating && (
          <path
            d={simPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
            className="transition-all duration-300 animate-in fade-in"
          />
        )}
      </svg>
    </div>
  )
}
