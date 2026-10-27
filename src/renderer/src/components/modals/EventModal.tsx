import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { CalendarEvent, Priority, EventStatus } from '../../../../types'
import { format } from 'date-fns'
import { X, Trash2, AlertTriangle, Video, MapPin, CheckCircle, Clock } from 'lucide-react'
import type { ConflictReport } from '../../../../main/engine/conflictEngine'

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
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endTime, setEndTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<EventStatus>('confirmed')
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null)
  const [reminderOffset, setReminderOffset] = useState<number>(15)

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

    const payload: CalendarEvent = {
      id: selectedEvent?.id || `evt-${Date.now()}`,
      calendar_id: calendarId || calendars[0]?.id || 'cal-primary',
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      meeting_url: meetingUrl.trim() || undefined,
      start: startIso,
      end: endIso,
      all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      category_id: categoryId || undefined,
      priority,
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-[#EEEAD7]">
      <div className="bg-[#2D0000] border border-[#6D0808] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#551010] flex items-center justify-between bg-[#380505]">
          <h2 className="text-base font-bold text-[#EEEAD7]">
            {selectedEvent?.id ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={() => setIsEventModalOpen(false)}
            className="p-1 text-[#757D6F] hover:text-[#EEEAD7] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#757D6F] mb-1">Event Title *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Strategy Review or Client Consultation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-2 text-sm text-[#EEEAD7] placeholder-[#757D6F]/60 focus:outline-none focus:border-[#EEEAD7]"
            />
          </div>

          {/* Calendar & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Calendar</label>
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
              >
                {calendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
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
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#1F0000] rounded-xl border border-[#551010]">
            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Start Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#380505] border border-[#551010] rounded-lg px-2.5 py-1.5 text-xs text-[#EEEAD7] focus:outline-none"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 bg-[#380505] border border-[#551010] rounded-lg px-2 py-1.5 text-xs text-[#EEEAD7] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">End Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#380505] border border-[#551010] rounded-lg px-2.5 py-1.5 text-xs text-[#EEEAD7] focus:outline-none"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 bg-[#380505] border border-[#551010] rounded-lg px-2 py-1.5 text-xs text-[#EEEAD7] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Conflict Alert Warning */}
          {conflictReport && conflictReport.hasConflict && (
            <div className="p-3 bg-[#6D0808]/20 border border-[#6D0808] rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#EEEAD7]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#EEEAD7]" />
                <span>Scheduling Conflict Warning</span>
              </div>
              {conflictReport.conflicts.map((c, i) => (
                <div key={i} className="text-[#C4BFAC] text-[11px] pl-6">
                  • {c.message}
                </div>
              ))}
              {conflictReport.suggestedFreeSlots && conflictReport.suggestedFreeSlots.length > 0 && (
                <div className="pt-1 text-[11px] text-[#EEEAD7] pl-6 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Suggested free slot:{' '}
                    {format(new Date(conflictReport.suggestedFreeSlots[0].start), 'HH:mm')} -{' '}
                    {format(new Date(conflictReport.suggestedFreeSlots[0].end), 'HH:mm')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Resources & Room Booking Selection */}
          {resources.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1.5">
                Allocate Rooms & Key Personnel
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-[#1F0000] rounded-xl border border-[#551010]">
                {resources.map((res) => {
                  const isSelected = selectedResourceIds.includes(res.id)
                  return (
                    <div
                      key={res.id}
                      onClick={() => toggleResourceId(res.id)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#6D0808] border-[#EEEAD7]/40 text-[#EEEAD7] font-bold shadow'
                          : 'bg-[#380505] border-[#551010] text-[#757D6F] hover:text-[#EEEAD7]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-medium">{res.name}</div>
                        <div className="text-[10px] capitalize opacity-80">{res.type}</div>
                      </div>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#EEEAD7] shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Meeting URL & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[#757D6F]" />
                <span>Virtual Meeting Link</span>
              </label>
              <input
                type="url"
                placeholder="https://zoom.us/j/... or Teams/Meet"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] placeholder-[#757D6F]/50 focus:outline-none focus:border-[#EEEAD7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#757D6F]" />
                <span>Physical Location / Room</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Boardroom 4A or Client HQ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] placeholder-[#757D6F]/50 focus:outline-none focus:border-[#EEEAD7]"
              />
            </div>
          </div>

          {/* Priority & Reminder Offset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#757D6F] mb-1">Reminder Alert</label>
              <select
                value={reminderOffset}
                onChange={(e) => setReminderOffset(Number(e.target.value))}
                className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] focus:outline-none focus:border-[#EEEAD7]"
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
            <label className="block text-xs font-semibold text-[#757D6F] mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Add agenda items, instructions, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1F0000] border border-[#551010] rounded-lg px-3 py-1.5 text-xs text-[#EEEAD7] placeholder-[#757D6F]/50 focus:outline-none focus:border-[#EEEAD7]"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#551010]">
            {selectedEvent?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#380505] hover:bg-[#500808] text-[#EEEAD7] text-xs font-bold border border-[#551010] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#380505] hover:bg-[#480707] text-[#757D6F] hover:text-[#EEEAD7] text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#6D0808] hover:bg-[#8F0F0F] text-[#EEEAD7] text-xs font-bold shadow transition-all border border-[#EEEAD7]/30"
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
