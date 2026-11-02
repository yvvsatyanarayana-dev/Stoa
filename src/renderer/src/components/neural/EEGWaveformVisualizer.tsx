import React, { useEffect, useRef } from 'react'
import type { EEGTelemetryPacket } from '../../types/neuralInterface'

interface EEGWaveformVisualizerProps {
  telemetry: EEGTelemetryPacket
  width?: number
  height?: number
}

export const EEGWaveformVisualizer: React.FC<EEGWaveformVisualizerProps> = ({
  telemetry,
  width = 680,
  height = 180
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offsetRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = () => {
      offsetRef.current += 1.5
      const offset = offsetRef.current

      ctx.clearRect(0, 0, width, height)

      // Frequency Bands specifications
      const bands = [
        { name: 'Gamma (30-100Hz)', power: telemetry.gamma, color: '#f43f5e', y: 30, freq: 0.12, amp: 14 },
        { name: 'Beta (13-30Hz)', power: telemetry.beta, color: '#8b5cf6', y: 65, freq: 0.08, amp: 12 },
        { name: 'Alpha (8-12Hz)', power: telemetry.alpha, color: '#06b6d4', y: 100, freq: 0.04, amp: 10 },
        { name: 'Theta (4-8Hz)', power: telemetry.theta, color: '#10b981', y: 135, freq: 0.025, amp: 8 },
        { name: 'Delta (0.5-4Hz)', power: telemetry.delta, color: '#64748b', y: 165, freq: 0.012, amp: 6 }
      ]

      bands.forEach((b) => {
        ctx.beginPath()
        ctx.strokeStyle = b.color
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.85

        const ampScale = (b.power / 50) * b.amp

        for (let x = 0; x < width; x += 3) {
          const wave1 = Math.sin((x + offset) * b.freq) * ampScale
          const wave2 = Math.cos((x - offset * 0.7) * (b.freq * 1.5)) * (ampScale * 0.35)
          const y = b.y + wave1 + wave2

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()

        // Label on left
        ctx.fillStyle = b.color
        ctx.font = '10px monospace'
        ctx.fillText(`${b.name}: ${Math.round(b.power)}%`, 8, b.y - 4)
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [telemetry, width, height])

  return (
    <div className="w-full flex flex-col items-center justify-center relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto max-w-full block"
      />
    </div>
  )
}
