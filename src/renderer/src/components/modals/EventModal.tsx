import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent, Priority, EventStatus } from '../../../../types'
import { format } from 'date-fns'
import { X, Trash2, AlertTriangle, Video, MapPin, CheckCircle, Clock, Repeat, Shield, CalendarOff } from 'lucide-react'
import type { ConflictReport } from '../../../../main/engine/conflictEngine'
import {
  RecurrenceConfig,
  buildRRuleString,
  parseRRuleString,
  getRRuleSummary
} from '../../utils/recurrenceEngine'
import { scanHolidayConflicts, detectSystemHolidayRegion } from '../../utils/holidayEngine'

export const EventModal: React.FC = () => {
  const {
    isEventModalOpen,
    setIsEventModalOpen,
    selectedEvent,
    calendars,
    categories,
    resources,
    createEvent,
    updateEvent,
    deleteEvent
  } = useAppStore()

  const [title, setTitle] = useState('')
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || '')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    return format(d, 'HH:mm')
  })
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [endTime, setEndTime] = useState(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 2)
    return format(d, 'HH:mm')
  })
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<EventStatus>('confirmed')
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null)
  const [reminderOffset, setReminderOffset] = useState<number>(15)

  // C1: Flexi-Recurrence state
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({
    freq: 'WEEKLY',
    interval: 1,
    byDay: ['MO'],
    endType: 'never'
  })

  // C4: Focus Block Shield state
  const [isFocusBlock, setIsFocusBlock] = useState<boolean>(false)

  // Real-time Holiday Collision check for startDate
  const holidayAlert = useMemo(() => {
    if (!startDate) return null
    const conflicts = scanHolidayConflicts(
      [
        {
          id: 'temp',
          calendar_id: calendarId,
          title: title || 'Event',
          start: `${startDate}T${startTime}:00`,
          end: `${endDate}T${endTime}:00`,
          all_day: false,
          timezone: 'UTC',
          priority: 'medium',
          status: 'confirmed',
          created_at: '',
          updated_at: ''
        }
      ],
      detectSystemHolidayRegion()
    )
    return conflicts.length > 0 ? conflicts[0] : null
  }, [startDate, startTime, endDate, endTime, calendarId, title])

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title || '')
      setCalendarId(selectedEvent.calendar_id || calendars[0]?.id || '')
      setCategoryId(selectedEvent.category_id || categories[0]?.id || '')
      setLocation(selectedEvent.location || '')
      setMeetingUrl(selectedEvent.meeting_url || '')
      setDescription(selectedEvent.description || '')
      setPriority(selectedEvent.priority || 'medium')
      setStatus(selectedEvent.status || 'confirmed')

      const start = new Date(selectedEvent.start)
      const end = new Date(selectedEvent.end)
      setStartDate(format(start, 'yyyy-MM-dd'))
      setStartTime(format(start, 'HH:mm'))
      setEndDate(format(end, 'yyyy-MM-dd'))
      setEndTime(format(end, 'HH:mm'))

      if (selectedEvent.resources) {
        setSelectedResourceIds(selectedEvent.resources.map((r) => r.id))
      } else {
        setSelectedResourceIds([])
      }

      if (selectedEvent.reminders && selectedEvent.reminders.length > 0) {
        setReminderOffset(selectedEvent.reminders[0].offset_minutes)
      }

      if (selectedEvent.rrule) {
        setIsRecurring(true)
        setRecurrenceConfig(parseRRuleString(selectedEvent.rrule))
      } else {
        setIsRecurring(false)
        setRecurrenceConfig({
          freq: 'WEEKLY',
          interval: 1,
          byDay: ['MO'],
          endType: 'never'
        })
      }

      const isFocus = Boolean(
        selectedEvent.title?.toLowerCase().includes('focus') ||
        selectedEvent.description?.includes('[FOCUS_BLOCK]') ||
        selectedEvent.description?.includes('[SHIELD]')
      )
      setIsFocusBlock(isFocus)
    } else {
      setTitle('')
      setCalendarId(calendars[0]?.id || '')
      setCategoryId(categories[0]?.id || '')
      setLocation('')
      setMeetingUrl('')
      setDescription('')
      setPriority('medium')
      setStatus('confirmed')
      setSelectedResourceIds([])
      setConflictReport(null)
      setIsRecurring(false)
      setIsFocusBlock(false)
      const now = new Date()
      const nextHour = new Date(now)
      nextHour.setMinutes(0, 0, 0)
      nextHour.setHours(now.getHours() + 1)
      const afterHour = new Date(nextHour)
      afterHour.setHours(nextHour.getHours() + 1)
      setStartDate(format(nextHour, 'yyyy-MM-dd'))
      setStartTime(format(nextHour, 'HH:mm'))
      setEndDate(format(afterHour, 'yyyy-MM-dd'))
      setEndTime(format(afterHour, 'HH:mm'))
      setRecurrenceConfig({
        freq: 'WEEKLY',
        interval: 1,
        byDay: ['MO'],
        endType: 'never'
      })
    }
  }, [selectedEvent, calendars, categories])

  // Real-time conflict detection check
  useEffect(() => {
    if (!isEventModalOpen || selectedResourceIds.length === 0) {
      setConflictReport(null)
      return
    }

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString()
    const endIso = new Date(`${endDate}T${endTime}:00`).toISOString()

    const timeout = setTimeout(async () => {
      try {
        const report = await window.api.events.checkConflicts(
          { start: startIso, end: endIso },
          selectedResourceIds,
          selectedEvent?.id
        )
        setConflictReport(report)
      } catch (err) {
        console.error('Conflict check error:', err)
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [startDate, startTime, endDate, endTime, selectedResourceIds, isEventModalOpen, selectedEvent])

  if (!isEventModalOpen) return null

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!title.trim()) return

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString()
    const endIso = new Date(`${endDate}T${endTime}:00`).toISOString()

    const rruleString = isRecurring ? buildRRuleString(recurrenceConfig) : undefined
    let descFinal = description.trim()
    if (isFocusBlock && !descFinal.includes('[FOCUS_BLOCK]')) {
      descFinal = `[FOCUS_BLOCK] [SHIELD: strict]\n${descFinal}`.trim()
    }

    const payload: CalendarEvent = {
      id: selectedEvent?.id || `evt-${Date.now()}`,
      calendar_id: calendarId || calendars[0]?.id || 'cal-primary',
      title: title.trim(),
      description: descFinal || undefined,
      location: location.trim() || undefined,
      meeting_url: meetingUrl.trim() || undefined,
      start: startIso,
      end: endIso,
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      rrule: rruleString,
      category_id: categoryId || undefined,
      priority: isFocusBlock ? 'high' : priority,
      status,
      created_at: selectedEvent?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reminders: [
        {
          id: `rem-${Date.now()}`,
          event_id: selectedEvent?.id || `evt-${Date.now()}`,
          offset_minutes: reminderOffset,
          channel: 'both'
        }
      ]
    }

    if (selectedEvent?.id) {
      await updateEvent(payload, selectedResourceIds)
    } else {
      await createEvent(payload, selectedResourceIds)
    }

    setIsEventModalOpen(false)
  }

  const handleDelete = async (): Promise<void> => {
    if (!selectedEvent?.id) return
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(selectedEvent.id)
      setIsEventModalOpen(false)
    }
  }

  const toggleResourceId = (id: string): void => {
    if (selectedResourceIds.includes(id)) {
      setSelectedResourceIds(selectedResourceIds.filter((rId) => rId !== id))
    } else {
      setSelectedResourceIds([...selectedResourceIds, id])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]">
          <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
            {selectedEvent?.id ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={() => setIsEventModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Event Title *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Strategy Review or Client Consultation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
            />
          </div>

          {/* Calendar & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Calendar</label>
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
              >
                {calendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">End Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Real-Time Holiday Collision Alert Banner (Feature C2) */}
          {holidayAlert && (
            <div className="p-2.5 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-400">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4 shrink-0" />
                <span>
                  Notice: Selected date falls on <strong>{holidayAlert.holiday.name}</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const shifted = new Date(holidayAlert.suggestedShiftStart)
                  setStartDate(format(shifted, 'yyyy-MM-dd'))
                  setEndDate(format(shifted, 'yyyy-MM-dd'))
                }}
                className="text-[11px] underline font-semibold hover:opacity-80 shrink-0 ml-2"
              >
                Shift to Next Business Day
              </button>
            </div>
          )}

          {/* Focus Block Protector Shield Toggle (Feature C4) */}
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <Shield className={`w-4 h-4 ${isFocusBlock ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Protect as Focus Block (Shield Active)
                </span>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Shields this block against meeting requests & fragmented interruptions.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isFocusBlock}
              onChange={(e) => setIsFocusBlock(e.target.checked)}
              className="rounded border-[var(--border-default)] accent-[var(--accent)] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Flexi-Recurrence Engine (Feature C1) */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[var(--accent)]" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Flexi-Recurrence Engine (RFC 5545)
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {getRRuleSummary(isRecurring ? buildRRuleString(recurrenceConfig) : undefined)}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-[var(--border-default)] accent-[var(--accent)] w-4 h-4"
                />
                <span>Repeats</span>
              </label>
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                      Frequency
                    </label>
                    <select
                      value={recurrenceConfig.freq}
                      onChange={(e) =>
                        setRecurrenceConfig({
                          ...recurrenceConfig,
                          freq: e.target.value as any
                        })
                      }
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                      Repeat Every
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={recurrenceConfig.interval}
                        onChange={(e) =>
                          setRecurrenceConfig({
                            ...recurrenceConfig,
                            interval: Math.max(1, parseInt(e.target.value, 10) || 1)
                          })
                        }
                        className="w-16 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] text-center focus:outline-none"
                      />
                      <span className="text-[var(--text-muted)] text-[11px] lowercase">
                        {recurrenceConfig.freq === 'DAILY'
                          ? 'day(s)'
                          : recurrenceConfig.freq === 'WEEKLY'
                          ? 'week(s)'
                          : recurrenceConfig.freq === 'MONTHLY'
                          ? 'month(s)'
                          : 'year(s)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weekly Day Selector */}
                {recurrenceConfig.freq === 'WEEKLY' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                        Repeat On Days
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setRecurrenceConfig({
                            ...recurrenceConfig,
                            byDay: ['MO', 'TU', 'WE', 'TH', 'FR']
                          })
                        }
                        className="text-[10px] text-[var(--accent)] hover:underline"
                      >
                        Weekdays (Mon–Fri)
                      </button>
                    </div>

                    <div className="flex gap-1">
                      {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => {
                        const isSelected = recurrenceConfig.byDay?.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const current = recurrenceConfig.byDay || []
                              const updated = isSelected
                                ? current.filter((d) => d !== day)
                                : [...current, day]
                              setRecurrenceConfig({
                                ...recurrenceConfig,
                                byDay: updated.length > 0 ? updated : [day]
                              })
                            }}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                              isSelected
                                ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Monthly Advanced Pattern */}
                {recurrenceConfig.freq === 'MONTHLY' && (
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                      Monthly Schedule Rule
                    </label>
                    <select
                      value={recurrenceConfig.monthlyType || 'day_of_month'}
                      onChange={(e) =>
                        setRecurrenceConfig({
                          ...recurrenceConfig,
                          monthlyType: e.target.value as any,
                          nthWeek: e.target.value === 'nth_weekday' ? 2 : undefined,
                          nthDayOfWeek: e.target.value === 'nth_weekday' ? 'TU' : undefined
                        })
                      }
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="day_of_month">Same Day of Month (e.g. 15th)</option>
                      <option value="nth_weekday">The 2nd Tuesday of Month</option>
                      <option value="last_business_day">The Last Business Day of Month (Mon-Fri)</option>
                    </select>
                  </div>
                )}

                {/* Ends Rule */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                      Ends
                    </label>
                    <select
                      value={recurrenceConfig.endType}
                      onChange={(e) =>
                        setRecurrenceConfig({
                          ...recurrenceConfig,
                          endType: e.target.value as any
                        })
                      }
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="never">Never</option>
                      <option value="until">On Specific Date</option>
                      <option value="count">After Occurrences</option>
                    </select>
                  </div>

                  {recurrenceConfig.endType === 'until' && (
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={recurrenceConfig.untilDate || format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) =>
                          setRecurrenceConfig({
                            ...recurrenceConfig,
                            untilDate: e.target.value
                          })
                        }
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  )}

                  {recurrenceConfig.endType === 'count' && (
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                        Total Times
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={recurrenceConfig.count || 10}
                        onChange={(e) =>
                          setRecurrenceConfig({
                            ...recurrenceConfig,
                            count: parseInt(e.target.value, 10) || 1
                          })
                        }
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] text-center focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Conflict Alert Warning */}
          {conflictReport && conflictReport.hasConflict && (
            <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-[var(--radius-md)] text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Scheduling Conflict Warning</span>
              </div>
              {conflictReport.conflicts.map((c, i) => (
                <div key={i} className="text-[var(--text-secondary)] text-[11px] pl-6">
                  • {c.message}
                </div>
              ))}
              {conflictReport.suggestedFreeSlots && conflictReport.suggestedFreeSlots.length > 0 && (
                <div className="pt-2 pl-6 flex items-center justify-between">
                  <div className="text-[11px] text-[var(--text-primary)] flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>
                      Alternative Free Window:{' '}
                      {format(new Date(conflictReport.suggestedFreeSlots[0].start), 'HH:mm')} -{' '}
                      {format(new Date(conflictReport.suggestedFreeSlots[0].end), 'HH:mm')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const altStart = new Date(conflictReport.suggestedFreeSlots![0].start)
                      const altEnd = new Date(conflictReport.suggestedFreeSlots![0].end)
                      setStartDate(format(altStart, 'yyyy-MM-dd'))
                      setStartTime(format(altStart, 'HH:mm'))
                      setEndDate(format(altEnd, 'yyyy-MM-dd'))
                      setEndTime(format(altEnd, 'HH:mm'))
                    }}
                    className="btn-primary text-[10px] font-semibold py-0.5 px-2.5 shadow-xs"
                  >
                    1-Click Resolve
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resources & Room Booking Selection */}
          {resources.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Allocate Rooms & Key Personnel
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                {resources.map((res) => {
                  const isSelected = selectedResourceIds.includes(res.id)
                  return (
                    <div
                      key={res.id}
                      onClick={() => toggleResourceId(res.id)}
                      className={`p-2 rounded-[var(--radius-md)] border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--border-strong)] font-semibold shadow'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-medium">{res.name}</div>
                        <div className="text-[10px] opacity-80 capitalize">{res.type}</div>
                      </div>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Meeting URL & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5" />
                <span>Virtual Meeting Link</span>
              </label>
              <input
                type="url"
                placeholder="https://zoom.us/j/... or Teams/Meet"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Physical Location / Room</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Boardroom 4A or Client HQ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>

          {/* Priority & Reminder Offset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Reminder Alert</label>
              <select
                value={reminderOffset}
                onChange={(e) => setReminderOffset(Number(e.target.value))}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              >
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Add agenda items, instructions, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition-all"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-2">
            {selectedEvent?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-secondary text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:border-red-500/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
              >
                {selectedEvent?.id ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
