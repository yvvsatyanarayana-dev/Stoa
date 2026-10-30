import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Globe,
  X,
  Plus,
  Trash2,
  Sun,
  Moon,
  Calendar,
  Search,
  RotateCcw,
  Clock,
  Sparkles
} from 'lucide-react'

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
  isOpen?: boolean
  onClose?: () => void
}> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    isWorldClockOpen,
    setIsWorldClockOpen,
    calendars,
    setSelectedEvent,
    setIsEventModalOpen
  } = useAppStore()

  // Determine visibility: props take precedence if provided, otherwise store
  const isOpen = propIsOpen !== undefined ? propIsOpen : isWorldClockOpen
  const handleClose = propOnClose !== undefined ? propOnClose : () => setIsWorldClockOpen(false)

  const [activeCities, setActiveCities] = useState<CityTimezone[]>([
    GLOBAL_CITIES[0], // London
    GLOBAL_CITIES[1], // New York
    GLOBAL_CITIES[3], // Tokyo
    GLOBAL_CITIES[6]  // Mumbai
  ])

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false)
  const [sliderHour, setSliderHour] = useState<number>(new Date().getHours())

  // Ticking clock every 1 second
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      if (!isScrubbing) {
        setSliderHour(now.getHours())
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, isScrubbing])

  // Filter available cities for search
  const availableCities = useMemo(() => {
    return GLOBAL_CITIES.filter(
      (c) =>
        !activeCities.some((ac) => ac.zone === c.zone) &&
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.cityCode.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [activeCities, searchQuery])

  // Reference date calculation - ALWAYS calculated at hook level before any conditional return!
  const referenceDate = useMemo(() => {
    if (!isScrubbing) return currentTime
    const d = new Date(currentTime)
    d.setHours(sliderHour, 0, 0, 0)
    return d
  }, [currentTime, isScrubbing, sliderHour])

  // SAFE EARLY RETURN AFTER ALL HOOKS
  if (!isOpen) return null

  const getCityInfo = (zone: string, date: Date) => {
    try {
      // 1. Format 12-hour display string
      const formatter12 = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      const time12 = formatter12.format(date)

      // 2. Extract numeric 24-hour component for business status
      const formatter24 = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: 'numeric',
        hour12: false
      })
      const hour24 = parseInt(formatter24.format(date), 10) || 0

      // 3. Day comparison (e.g. Today, Tomorrow, Yesterday)
      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        weekday: 'short'
      })
      const localDayFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'short'
      })
      const weekday = dayFormatter.format(date)
      const localWeekday = localDayFormatter.format(date)
      const dayLabel = weekday === localWeekday ? 'Today' : weekday

      // 4. Business status
      const isDay = hour24 >= 6 && hour24 < 18
      let statusLabel = 'Off-Hours'
      let statusColor = 'text-[var(--text-muted)] bg-[var(--bg-hover)] border-[var(--border-subtle)]'

      if (hour24 >= 9 && hour24 < 17) {
        statusLabel = 'Working'
        statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 font-medium'
      } else if ((hour24 >= 7 && hour24 < 9) || (hour24 >= 17 && hour24 < 20)) {
        statusLabel = 'Extended'
        statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20 font-medium'
      }

      // 5. Offset calculation via Intl formatToParts (avoids string parsing errors)
      const targetParts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(date)

      const localParts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(date)

      const getNum = (parts: Intl.DateTimeFormatPart[], type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value || '0', 10)

      const targetMs = Date.UTC(
        getNum(targetParts, 'year'),
        getNum(targetParts, 'month') - 1,
        getNum(targetParts, 'day'),
        getNum(targetParts, 'hour'),
        getNum(targetParts, 'minute')
      )

      const localMs = Date.UTC(
        getNum(localParts, 'year'),
        getNum(localParts, 'month') - 1,
        getNum(localParts, 'day'),
        getNum(localParts, 'hour'),
        getNum(localParts, 'minute')
      )

      const diffHours = Math.round(((targetMs - localMs) / (1000 * 60 * 60)) * 10) / 10

      let offsetLabel = 'Local'
      if (!isNaN(diffHours)) {
        if (diffHours > 0) offsetLabel = `+${diffHours}h`
        else if (diffHours < 0) offsetLabel = `${diffHours}h`
      }

      return {
        time12,
        hour24,
        dayLabel,
        isDay,
        statusLabel,
        statusColor,
        offsetLabel
      }
    } catch (err) {
      console.error('Error formatting city time:', err)
      return {
        time12: '12:00 PM',
        hour24: 12,
        dayLabel: 'Today',
        isDay: true,
        statusLabel: 'Working',
        statusColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        offsetLabel: 'Local'
      }
    }
  }

  const handleAddCity = (city: CityTimezone) => {
    setActiveCities((prev) => [...prev, city])
    setSearchQuery('')
  }

  const handleRemoveCity = (zone: string) => {
    if (activeCities.length > 1) {
      setActiveCities((prev) => prev.filter((c) => c.zone !== zone))
    }
  }

  const handleResetToNow = () => {
    setIsScrubbing(false)
    setSliderHour(new Date().getHours())
  }

  const handleScheduleAtCurrent = (specificCity?: CityTimezone) => {
    const start = new Date(referenceDate)
    const end = new Date(start.getTime() + 45 * 60 * 1000)

    setSelectedEvent({
      id: `evt-${Date.now()}`,
      calendar_id: calendars[0]?.id || 'cal-primary',
      title: specificCity ? `Sync with ${specificCity.name}` : 'Cross-Zone Meeting',
      start: start.toISOString(),
      end: end.toISOString(),
      all_day: false,
      timezone: specificCity?.zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      priority: 'medium',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    handleClose()
    setIsEventModalOpen(true)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed top-0 right-0 h-full w-[380px] max-w-[90vw] z-50 flex flex-col bg-[var(--bg-elevated)] border-l border-[var(--border-subtle)] shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ top: '72px' }}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)]/10 text-[var(--accent)]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  World Clock
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  {activeCities.length} zones
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Global time zones & overlap planner
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Time Scrubber */}
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Time Scrubber</span>
                {isScrubbing && (
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
                    Previewing
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {isScrubbing && (
                  <button
                    onClick={handleResetToNow}
                    className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline font-medium"
                    title="Reset to current time"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Now</span>
                  </button>
                )}
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                  {referenceDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="23"
                value={sliderHour}
                onChange={(e) => {
                  setIsScrubbing(true)
                  setSliderHour(Number(e.target.value))
                }}
                className="w-full h-1.5 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1.5">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </div>
          </div>

          {/* Active Cities List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] px-1">
              <span>LOCATION & STATUS</span>
              <span>TIME & OFFSET</span>
            </div>

            <div className="space-y-2">
              {activeCities.map((city) => {
                const info = getCityInfo(city.zone, referenceDate)

                return (
                  <div
                    key={city.zone}
                    className="group relative p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side: City & Status */}
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {info.isDay ? (
                            <Sun className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Moon className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                              {city.name}
                            </span>
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                              {city.cityCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${info.statusColor}`}>
                              {info.statusLabel}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {info.dayLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Time & Offset */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-base font-bold font-mono tracking-tight text-[var(--text-primary)]">
                            {info.time12}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            {info.offsetLabel}
                          </div>
                        </div>

                        {/* Quick action buttons on hover */}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            type="button"
                            onClick={() => handleScheduleAtCurrent(city)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] rounded hover:bg-[var(--bg-hover)] transition-colors"
                            title={`Schedule meeting in ${city.name}`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          {activeCities.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCity(city.zone)}
                              className="p-1 text-[var(--text-muted)] hover:text-red-400 rounded hover:bg-[var(--bg-hover)] transition-colors"
                              title="Remove city"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add City Section */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              Add Global City
            </span>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search city, code or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
              />
            </div>

            {availableCities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1 pr-1">
                {availableCities.map((city) => (
                  <button
                    key={city.zone}
                    type="button"
                    onClick={() => handleAddCity(city)}
                    className="px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 group"
                  >
                    <Plus className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                    <span>{city.name}</span>
                    <span className="text-[9px] font-mono text-[var(--text-muted)]">
                      {city.cityCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unified Footer Action */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
          <button
            type="button"
            onClick={() => handleScheduleAtCurrent()}
            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 flex items-center justify-center gap-2 shadow-xs transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Schedule Meeting at{' '}
              {referenceDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
