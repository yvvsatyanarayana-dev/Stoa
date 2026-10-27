import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Globe, X, Plus, Trash2, Calendar } from 'lucide-react'

interface CityTimezone {
  name: string
  zone: string
  country: string
}

const DEFAULT_CITIES: CityTimezone[] = [
  { name: 'London', zone: 'Europe/London', country: 'UK' },
  { name: 'New York', zone: 'America/New_York', country: 'US' },
  { name: 'San Francisco', zone: 'America/Los_Angeles', country: 'US' },
  { name: 'Tokyo', zone: 'Asia/Tokyo', country: 'JP' },
  { name: 'Dubai', zone: 'Asia/Dubai', country: 'UAE' },
  { name: 'Singapore', zone: 'Asia/Singapore', country: 'SG' },
  { name: 'Sydney', zone: 'Australia/Sydney', country: 'AU' },
  { name: 'Mumbai', zone: 'Asia/Kolkata', country: 'IN' },
  { name: 'Berlin', zone: 'Europe/Berlin', country: 'DE' }
]

export const WorldClockModal: React.FC = () => {
  const {
    isWorldClockOpen,
    setIsWorldClockOpen,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  const [activeCities, setActiveCities] = useState<CityTimezone[]>([
    DEFAULT_CITIES[0], // London
    DEFAULT_CITIES[1], // New York
    DEFAULT_CITIES[3], // Tokyo
    DEFAULT_CITIES[7]  // Mumbai
  ])

  // Selected UTC hour index (0 to 23)
  const [selectedUtcHour, setSelectedUtcHour] = useState<number>(14) // 14:00 UTC default

  if (!isWorldClockOpen) return null

  const getCityLocalHour = (zone: string, utcHour: number): { hour: number; dayOffset: number } => {
    try {
      const now = new Date()
      const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0))
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: 'numeric',
        hour12: false,
        day: 'numeric'
      })
      const parts = formatter.formatToParts(utcDate)
      const hourPart = parts.find((p) => p.type === 'hour')?.value || '0'
      const h = Number(hourPart) % 24
      return { hour: h, dayOffset: 0 }
    } catch {
      return { hour: utcHour, dayOffset: 0 }
    }
  }

  const getHourColorCategory = (h: number): 'work' | 'extended' | 'sleep' => {
    if (h >= 9 && h <= 17) return 'work' // 09:00 - 17:00
    if ((h >= 7 && h < 9) || (h > 17 && h <= 21)) return 'extended'
    return 'sleep'
  }

  const handleAddCity = (city: CityTimezone): void => {
    if (!activeCities.some((c) => c.zone === city.zone)) {
      setActiveCities([...activeCities, city])
    }
  }

  const handleRemoveCity = (zone: string): void => {
    if (activeCities.length > 1) {
      setActiveCities(activeCities.filter((c) => c.zone !== zone))
    }
  }

  const handleScheduleAtUtcHour = (): void => {
    const now = new Date()
    const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), selectedUtcHour, 0, 0))
    const endDate = new Date(targetDate.getTime() + 60 * 60 * 1000)

    setSelectedEvent({
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: 'Global Team Sync',
      start: targetDate.toISOString(),
      end: endDate.toISOString(),
      all_day: false,
      timezone: 'UTC',
      priority: 'medium',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    setIsWorldClockOpen(false)
    setIsEventModalOpen(true)
  }

  const hoursArray = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center">
              <Globe className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                World Clock & Cross-Timezone Visual Planner
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Visualize overlapping business hours across global cities to plan international events.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWorldClockOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick city presets picker */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mr-1">
              Add City:
            </span>
            {DEFAULT_CITIES.filter((dc) => !activeCities.some((ac) => ac.zone === dc.zone)).map((city) => (
              <button
                key={city.zone}
                type="button"
                onClick={() => handleAddCity(city)}
                className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{city.name}</span>
              </button>
            ))}
          </div>

          {/* Interactive Legend */}
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] bg-[var(--bg-subtle)]/50 p-2.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/80" />
                <span>Business Hours (09:00 - 17:00)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/70" />
                <span>Extended (07-09, 17-21)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
                <span>Night / Sleep</span>
              </div>
            </div>

            <span className="font-mono text-[10px] font-semibold text-[var(--text-primary)]">
              Selected Time: {String(selectedUtcHour).padStart(2, '0')}:00 UTC
            </span>
          </div>

          {/* Timezone Visual Matrix Grid */}
          <div className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] bg-[var(--bg-app)] overflow-hidden shadow-xs">
            {/* UTC Header Bar */}
            <div className="grid grid-cols-[140px_1fr] border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
              <div className="p-2 text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider pl-3">
                City / Zone
              </div>
              <div className="grid grid-cols-24">
                {hoursArray.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedUtcHour(h)}
                    className={`h-7 text-[10px] font-mono flex items-center justify-center transition-colors border-r border-[var(--border-subtle)] last:border-r-0 ${
                      selectedUtcHour === h
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* City Rows */}
            <div className="divide-y divide-[var(--border-subtle)]">
              {activeCities.map((city) => {
                const currentLocal = getCityLocalHour(city.zone, selectedUtcHour)
                return (
                  <div key={city.zone} className="grid grid-cols-[140px_1fr] items-center">
                    {/* City Info Column */}
                    <div className="p-2.5 pl-3 flex items-center justify-between bg-[var(--bg-sidebar)]/40">
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>{city.name}</span>
                          <span className="text-[9px] font-mono text-[var(--text-muted)]">({city.country})</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                          Local: {String(currentLocal.hour).padStart(2, '0')}:00
                        </div>
                      </div>

                      {activeCities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCity(city.zone)}
                          className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded transition-colors"
                          title="Remove city"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* 24-Hour Color Ribbon */}
                    <div className="grid grid-cols-24 h-11">
                      {hoursArray.map((utcH) => {
                        const localInfo = getCityLocalHour(city.zone, utcH)
                        const category = getHourColorCategory(localInfo.hour)
                        const isSelected = selectedUtcHour === utcH

                        let bgClass = 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                        if (category === 'work') {
                          bgClass = 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        } else if (category === 'extended') {
                          bgClass = 'bg-amber-500/15 text-amber-300'
                        }

                        return (
                          <div
                            key={utcH}
                            onClick={() => setSelectedUtcHour(utcH)}
                            className={`border-r border-[var(--border-subtle)] last:border-r-0 flex flex-col items-center justify-center cursor-pointer text-[9px] font-mono transition-all ${bgClass} ${
                              isSelected ? 'ring-2 ring-[var(--accent)] z-10' : 'hover:opacity-80'
                            }`}
                            title={`${city.name}: ${String(localInfo.hour).padStart(2, '0')}:00 (${category})`}
                          >
                            <span>{localInfo.hour}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsWorldClockOpen(false)}
            className="btn-secondary text-xs py-1 px-3"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleScheduleAtUtcHour}
            className="btn-primary flex items-center gap-1.5 py-1 px-3.5 text-xs font-semibold shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 stroke-[2]" />
            <span>Schedule at {String(selectedUtcHour).padStart(2, '0')}:00 UTC</span>
          </button>
        </div>
      </div>
    </div>
  )
}
