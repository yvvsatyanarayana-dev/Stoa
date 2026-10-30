import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Globe, X, Plus, Trash2, Sun, Moon, Calendar, Search, Clock } from 'lucide-react'

interface CityTimezone {
  name: string
  zone: string
  country: string
  cityCode: string
}

const GLOBAL_CITIES: CityTimezone[] = [
  { name: 'London', zone: 'Europe/London', country: 'UK', cityCode: 'LON' },
  { name: 'New York', zone: 'America/New_York', country: 'USA', cityCode: 'NYC' },
  { name: 'San Francisco', zone: 'America/Los_Angeles', country: 'USA', cityCode: 'SFO' },
  { name: 'Tokyo', zone: 'Asia/Tokyo', country: 'Japan', cityCode: 'TYO' },
  { name: 'Singapore', zone: 'Asia/Singapore', country: 'Singapore', cityCode: 'SIN' },
  { name: 'Dubai', zone: 'Asia/Dubai', country: 'UAE', cityCode: 'DXB' },
  { name: 'Mumbai', zone: 'Asia/Kolkata', country: 'India', cityCode: 'BOM' },
  { name: 'Sydney', zone: 'Australia/Sydney', country: 'Australia', cityCode: 'SYD' },
  { name: 'Paris', zone: 'Europe/Paris', country: 'France', cityCode: 'PAR' },
  { name: 'Berlin', zone: 'Europe/Berlin', country: 'Germany', cityCode: 'BER' },
  { name: 'Zurich', zone: 'Europe/Zurich', country: 'Switzerland', cityCode: 'ZUR' },
  { name: 'Hong Kong', zone: 'Asia/Hong_Kong', country: 'HK', cityCode: 'HKG' },
  { name: 'Toronto', zone: 'America/Toronto', country: 'Canada', cityCode: 'YYZ' },
  { name: 'Seoul', zone: 'Asia/Seoul', country: 'South Korea', cityCode: 'ICN' }
]

export const WorldClockPanel: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { calendars, setSelectedEvent, setIsEventModalOpen } = useAppStore()

  const [activeCities, setActiveCities] = useState<CityTimezone[]>([
    GLOBAL_CITIES[0], // London
    GLOBAL_CITIES[1], // New York
    GLOBAL_CITIES[3], // Tokyo
    GLOBAL_CITIES[6]  // Mumbai
  ])

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sliderUtcHour, setSliderUtcHour] = useState<number>(new Date().getUTCHours())

  // Ticking clock every 1 second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const availableCities = useMemo(() => {
    return GLOBAL_CITIES.filter(
      (c) =>
        !activeCities.some((ac) => ac.zone === c.zone) &&
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [activeCities, searchQuery])

  if (!isOpen) return null

  const getCityTime = (zone: string, date: Date) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      const parts = formatter.formatToParts(date)
      const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
      const minute = parts.find((p) => p.type === 'minute')?.value || '00'
      const second = parts.find((p) => p.type === 'second')?.value || '00'
      const isDaytime = hour >= 6 && hour < 18
      return { hour, minute, second, isDaytime, timeStr: `${String(hour).padStart(2, '0')}:${minute}:${second}` }
    } catch {
      return { hour: date.getHours(), minute: '00', second: '00', isDaytime: true, timeStr: '12:00:00' }
    }
  }

  const handleAddCity = (city: CityTimezone) => {
    setActiveCities([...activeCities, city])
    setSearchQuery('')
  }

  const handleRemoveCity = (zone: string) => {
    if (activeCities.length > 1) {
      setActiveCities(activeCities.filter((c) => c.zone !== zone))
    }
  }

  const handleScheduleFromCity = (city: CityTimezone) => {
    const now = new Date()
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), sliderUtcHour, 0, 0))
    const end = new Date(target.getTime() + 60 * 60 * 1000)

    setSelectedEvent({
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: `Global Meeting (${city.name} Sync)`,
      start: target.toISOString(),
      end: end.toISOString(),
      all_day: false,
      timezone: city.zone,
      priority: 'medium',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    onClose()
    setIsEventModalOpen(true)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs" onClick={onClose} />

      {/* Slide-in Panel */}
      <div
        className="fixed top-0 right-0 h-full w-96 z-50 flex flex-col bg-[var(--bg-elevated)] border-l border-[var(--border-subtle)] shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ top: '72px' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                World Clock Live Panel (C3)
              </span>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                Real-Time Ticking Multi-Zone Clock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Time Scrubber / Converter */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Cross-Zone Time Scrubber</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-[var(--accent)]">
                {String(sliderUtcHour).padStart(2, '0')}:00 UTC
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={sliderUtcHour}
              onChange={(e) => setSliderUtcHour(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Active Cities List */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Tracked City Clocks ({activeCities.length})
            </span>

            <div className="space-y-2">
              {activeCities.map((city) => {
                const live = getCityTime(city.zone, currentTime)
                const scrubDate = new Date(Date.UTC(2026, 0, 1, sliderUtcHour, 0, 0))
                const scrubHour = getCityTime(city.zone, scrubDate).hour

                return (
                  <div
                    key={city.zone}
                    className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2 transition-colors hover:border-[var(--border-default)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {live.isDaytime ? (
                          <Sun className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Moon className="w-4 h-4 text-indigo-400" />
                        )}
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">
                            {city.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {city.country} • {city.cityCode}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                            {live.timeStr}
                          </div>
                          <div className="text-[9px] font-mono text-[var(--text-muted)]">
                            Scrubbed: {String(scrubHour).padStart(2, '0')}:00
                          </div>
                        </div>

                        {activeCities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCity(city.zone)}
                            className="p-1 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors"
                            title="Remove city"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleScheduleFromCity(city)}
                      className="w-full py-1 text-[10px] font-semibold rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-3 h-3 text-[var(--accent)]" />
                      <span>Book at {String(scrubHour).padStart(2, '0')}:00 {city.name} Time</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add City Section */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Add Global City
            </span>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search city or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>

            {availableCities.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                {availableCities.map((city) => (
                  <button
                    key={city.zone}
                    type="button"
                    onClick={() => handleAddCity(city)}
                    className="px-2 py-1 rounded text-[10px] font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{city.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
