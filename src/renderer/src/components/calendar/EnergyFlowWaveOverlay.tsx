import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useBurnoutStore } from '../../store/useBurnoutStore'
import { Zap, Flame, BatteryCharging } from 'lucide-react'

interface EnergyZone {
  startHour: number
  endHour: number
  title: string
  subtitle: string
  gradient: string
  borderStyle: string
  badgeBg: string
  badgeText: string
  icon: React.ReactNode
}

function parseTimeToHour(timeStr?: string, defaultHour: number = 9): number {
  if (!timeStr) return defaultHour
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10))
  if (isNaN(h)) return defaultHour
  return h + (isNaN(m) ? 0 : m / 60)
}

export const EnergyFlowWaveOverlay: React.FC = () => {
  const { isEnergyFlowWaveVisible } = useAppStore()
  const { profile } = useBurnoutStore()

  // Dynamically calculate biological ultradian energy curves from real user biometric profile
  const zones: EnergyZone[] = useMemo(() => {
    const peakStart = parseTimeToHour(profile?.peakFocusStart, 9.0)
    const peakEnd = parseTimeToHour(profile?.peakFocusEnd, 12.0)
    const secStart = parseTimeToHour(profile?.secondaryPeakStart, 15.0)
    const secEnd = parseTimeToHour(profile?.secondaryPeakEnd, 17.5)

    const recoveryStart = peakEnd + 0.5
    const recoveryEnd = Math.min(secStart, recoveryStart + 1.5)

    return [
      {
        startHour: peakStart,
        endHour: peakEnd,
        title: `${profile?.chronotype ? `${profile.chronotype.toUpperCase()} ` : ''}Peak Cognitive Flow`,
        subtitle: 'High logic, deep architecture & flow',
        gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        borderStyle: 'border-emerald-500/20',
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-400',
        icon: <Zap className="w-2.5 h-2.5 shrink-0" />
      },
      {
        startHour: recoveryStart,
        endHour: recoveryEnd,
        title: 'Post-Prandial Recovery',
        subtitle: 'Low willpower — shallow work & 1:1s',
        gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
        borderStyle: 'border-amber-500/20',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        icon: <BatteryCharging className="w-2.5 h-2.5 shrink-0" />
      },
      {
        startHour: secStart,
        endHour: secEnd,
        title: 'Secondary Energy Surge',
        subtitle: 'Strategic alignment & team execution',
        gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
        borderStyle: 'border-indigo-500/20',
        badgeBg: 'bg-indigo-500/15',
        badgeText: 'text-indigo-400',
        icon: <Flame className="w-2.5 h-2.5 shrink-0" />
      }
    ]
  }, [profile])

  if (!isEnergyFlowWaveVisible) return null

  // Hour 7:00 is offset 0px, 1 hour = 56px
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {zones.map((zone, idx) => {
        const top = Math.max(0, (zone.startHour - 7) * 56)
        const height = Math.max(28, (zone.endHour - zone.startHour) * 56)

        return (
          <div
            key={idx}
            style={{ top: `${top}px`, height: `${height}px` }}
            className={`absolute left-0 right-0 bg-gradient-to-r ${zone.gradient} border-y ${zone.borderStyle} flex items-start justify-end pr-3 pt-1.5 opacity-80`}
          >
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${zone.badgeBg} ${zone.badgeText} text-[9px] font-mono tracking-wider backdrop-blur-xs shadow-xs`}
            >
              {zone.icon}
              <span className="font-semibold uppercase">{zone.title}</span>
              <span className="opacity-60 hidden xl:inline">· {zone.subtitle}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
