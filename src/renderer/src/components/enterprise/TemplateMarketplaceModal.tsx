import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  X,
  BookOpen,
  GraduationCap,
  Stethoscope,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Download
} from 'lucide-react'
import { TimetableSlot } from '../../../../types'
import { startOfWeek, addDays } from 'date-fns'

export interface IndustryTemplate {
  id: string
  name: string
  category: 'Education' | 'Healthcare' | 'Corporate' | 'Conferences' | 'Retail'
  icon: 'academic' | 'medical' | 'briefcase' | 'conference' | 'retail'
  description: string
  slotCount: number
  subjectCount: number
  slots: Array<{
    day: number
    start: string
    end: string
    subject: string
    color: string
    room: string
  }>
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'tpl-academic-cs',
    name: 'University Computer Science & Engineering Semester',
    category: 'Education',
    icon: 'academic',
    description: 'Complete undergraduate curriculum schedule with balanced lecture slots, lab practicums, and tutorial office hours.',
    slotCount: 14,
    subjectCount: 5,
    slots: [
      { day: 1, start: '09:00', end: '10:30', subject: 'CS301: Advanced Algorithms', color: '#3b82f6', room: 'Turing Hall A' },
      { day: 1, start: '11:00', end: '12:30', subject: 'MATH204: Linear Algebra', color: '#8b5cf6', room: 'Euler Hall 101' },
      { day: 1, start: '14:00', end: '16:00', subject: 'CS301L: Algorithms Lab', color: '#3b82f6', room: 'Hardware Lab 3' },

      { day: 2, start: '09:30', end: '11:00', subject: 'CS340: Distributed Systems', color: '#10b981', room: 'Von Neumann Auditorium' },
      { day: 2, start: '13:00', end: '14:30', subject: 'CS420: Deep Learning', color: '#f59e0b', room: 'Lovelace Room 204' },

      { day: 3, start: '09:00', end: '10:30', subject: 'CS301: Advanced Algorithms', color: '#3b82f6', room: 'Turing Hall A' },
      { day: 3, start: '11:00', end: '12:30', subject: 'MATH204: Linear Algebra', color: '#8b5cf6', room: 'Euler Hall 101' },
      { day: 3, start: '14:00', end: '16:00', subject: 'CS420L: Machine Learning Lab', color: '#f59e0b', room: 'GPU Cluster Lab' },

      { day: 4, start: '09:30', end: '11:00', subject: 'CS340: Distributed Systems', color: '#10b981', room: 'Von Neumann Auditorium' },
      { day: 4, start: '11:30', end: '13:00', subject: 'CS310: Operating Systems Internals', color: '#ec4899', room: 'Shannon Hall 2' },

      { day: 5, start: '10:00', end: '11:30', subject: 'CS310: Operating Systems Internals', color: '#ec4899', room: 'Shannon Hall 2' },
      { day: 5, start: '13:00', end: '15:00', subject: 'CS310L: Kernel Systems Lab', color: '#ec4899', room: 'Hardware Lab 3' }
    ]
  },
  {
    id: 'tpl-medical-hospital',
    name: 'Hospital & Emergency Trauma 24/7 Coverage',
    category: 'Healthcare',
    icon: 'medical',
    description: 'Rotational on-call schedule covering Emergency Room triage, ICU intensive care rounds, and surgical theater rotations.',
    slotCount: 15,
    subjectCount: 4,
    slots: [
      { day: 1, start: '07:00', end: '15:30', subject: 'Morning Trauma Ward Rounds', color: '#ef4444', room: 'ICU Wing Level 4' },
      { day: 1, start: '15:00', end: '23:30', subject: 'ER Evening Triage Lead', color: '#f97316', room: 'Emergency Bay A' },
      { day: 1, start: '23:00', end: '07:30', subject: 'Overnight Critical Care On-Call', color: '#6366f1', room: 'Resuscitation Room 1' },

      { day: 2, start: '08:00', end: '16:00', subject: 'Surgical Theater Operations', color: '#06b6d4', room: 'OR Suite 3' },
      { day: 2, start: '15:00', end: '23:30', subject: 'ER Evening Triage Lead', color: '#f97316', room: 'Emergency Bay A' },

      { day: 3, start: '07:00', end: '15:30', subject: 'Morning Trauma Ward Rounds', color: '#ef4444', room: 'ICU Wing Level 4' },
      { day: 3, start: '23:00', end: '07:30', subject: 'Overnight Critical Care On-Call', color: '#6366f1', room: 'Resuscitation Room 1' },

      { day: 4, start: '08:00', end: '16:00', subject: 'Surgical Theater Operations', color: '#06b6d4', room: 'OR Suite 3' },
      { day: 4, start: '15:00', end: '23:30', subject: 'ER Evening Triage Lead', color: '#f97316', room: 'Emergency Bay B' },

      { day: 5, start: '07:00', end: '15:30', subject: 'Morning Trauma Ward Rounds', color: '#ef4444', room: 'ICU Wing Level 4' },
      { day: 5, start: '15:00', end: '23:30', subject: 'ER Evening Triage Lead', color: '#f97316', room: 'Emergency Bay A' },
      { day: 5, start: '23:00', end: '07:30', subject: 'Overnight Critical Care On-Call', color: '#6366f1', room: 'Resuscitation Room 1' }
    ]
  },
  {
    id: 'tpl-tech-conference',
    name: '3-Day Global Developer & Architecture Summit',
    category: 'Conferences',
    icon: 'conference',
    description: 'Conference run-sheet layout with morning keynotes, dual track breakout stages, live hackathons, and sponsor networking.',
    slotCount: 12,
    subjectCount: 4,
    slots: [
      { day: 1, start: '09:00', end: '11:00', subject: 'Keynote: Next-Gen Autonomous AI', color: '#8b5cf6', room: 'Grand Amphitheater' },
      { day: 1, start: '11:30', end: '13:00', subject: 'Track A: Cloud Native Scale', color: '#3b82f6', room: 'Stage Orion' },
      { day: 1, start: '14:00', end: '16:00', subject: 'Track B: Real-Time Data Pipelines', color: '#10b981', room: 'Stage Nebula' },

      { day: 2, start: '09:30', end: '11:00', subject: 'Track A: Zero Trust Security', color: '#3b82f6', room: 'Stage Orion' },
      { day: 2, start: '11:30', end: '13:00', subject: 'Track B: Edge Computing Practicum', color: '#10b981', room: 'Stage Nebula' },
      { day: 2, start: '14:00', end: '17:00', subject: 'Interactive Hackathon Sprint', color: '#ec4899', room: 'Innovation Arena' },

      { day: 3, start: '10:00', end: '12:00', subject: 'Executive Panel: 2030 Roadmap', color: '#8b5cf6', room: 'Grand Amphitheater' },
      { day: 3, start: '13:30', end: '15:30', subject: 'Hands-On Architecture Workshop', color: '#f59e0b', room: 'Workshop Lab C' }
    ]
  },
  {
    id: 'tpl-corporate-board',
    name: 'Executive Board & Governance Week',
    category: 'Corporate',
    icon: 'briefcase',
    description: 'Structured corporate calendar with committee audit reviews, investor relations Q&A, and protected deep-strategy focus blocks.',
    slotCount: 10,
    subjectCount: 4,
    slots: [
      { day: 1, start: '09:30', end: '11:30', subject: 'Audit & Compliance Committee Review', color: '#3b82f6', room: 'Boardroom East' },
      { day: 1, start: '14:00', end: '16:30', subject: 'Protected Strategic Focus Block', color: '#10b981', room: 'Executive Suite' },

      { day: 2, start: '10:00', end: '12:30', subject: 'Quarterly Financials & Risk Sync', color: '#f59e0b', room: 'Boardroom East' },
      { day: 2, start: '14:00', end: '16:00', subject: 'Product Roadmap Alignment', color: '#8b5cf6', room: 'Innovation Room' },

      { day: 3, start: '09:00', end: '13:00', subject: 'Board of Directors Plenary Session', color: '#ef4444', room: 'Executive Penthouse' },

      { day: 4, start: '10:00', end: '12:00', subject: 'Institutional Investor Q&A', color: '#06b6d4', room: 'Conference Hall A' },
      { day: 4, start: '14:00', end: '16:30', subject: 'Protected Strategic Focus Block', color: '#10b981', room: 'Executive Suite' },

      { day: 5, start: '10:00', end: '11:30', subject: 'All-Hands Operations Townhall', color: '#6366f1', room: 'Global Stream' }
    ]
  }
]

export const TemplateMarketplaceModal: React.FC = () => {
  const {
    isTemplateMarketplaceOpen,
    setIsTemplateMarketplaceOpen,
    activeTimetableId,
    applyAutoGeneratedSlots,
    createEvent,
    calendars,
    fetchEvents,
    setCurrentView
  } = useAppStore()

  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate>(INDUSTRY_TEMPLATES[0])
  const [applying, setApplying] = useState<boolean>(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  if (!isTemplateMarketplaceOpen) return null

  // 1-Click Apply to Timetable Builder
  const handleApplyToTimetable = async () => {
    setApplying(true)
    try {
      const generatedSlots: TimetableSlot[] = selectedTemplate.slots.map((s, idx) => ({
        id: `slot-tpl-${Date.now()}-${idx}`,
        timetable_id: activeTimetableId || 'tt-primary',
        subject_id: `subj-${s.subject.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        day: s.day,
        start: s.start,
        end: s.end,
        room: s.room,
        week_pattern: 'all'
      }))

      await applyAutoGeneratedSlots(generatedSlots)
      setSuccessNotice(`Template "${selectedTemplate.name}" applied to active timetable!`)
      setTimeout(() => {
        setSuccessNotice(null)
        setIsTemplateMarketplaceOpen(false)
        setCurrentView('timetable')
      }, 1500)
    } catch (err: any) {
      alert(`Failed to apply template: ${err.message || String(err)}`)
    } finally {
      setApplying(false)
    }
  }

  // 1-Click Schedule as Real Live Calendar Events
  const handleScheduleAsCalendarEvents = async () => {
    setApplying(true)
    try {
      const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
      const calId = calendars[0]?.id || 'cal-primary'

      for (const slot of selectedTemplate.slots) {
        const targetDate = addDays(monday, slot.day - 1)
        const dateStr = targetDate.toISOString().split('T')[0]
        const startIso = new Date(`${dateStr}T${slot.start}:00`).toISOString()
        const endIso = new Date(`${dateStr}T${slot.end}:00`).toISOString()

        await createEvent({
          id: `evt-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          calendar_id: calId,
          title: slot.subject,
          description: `Generated from template "${selectedTemplate.name}"\nLocation: ${slot.room}`,
          location: slot.room,
          start: startIso,
          end: endIso,
          all_day: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          priority: 'medium',
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      await fetchEvents()
      setSuccessNotice(`Scheduled ${selectedTemplate.slots.length} live calendar events for this week!`)
      setTimeout(() => {
        setSuccessNotice(null)
        setIsTemplateMarketplaceOpen(false)
        setCurrentView('calendar')
      }, 1500)
    } catch (err: any) {
      alert(`Failed to schedule template events: ${err.message || String(err)}`)
    } finally {
      setApplying(false)
    }
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'academic':
        return <GraduationCap className="w-5 h-5 text-blue-400" />
      case 'medical':
        return <Stethoscope className="w-5 h-5 text-emerald-400" />
      case 'conference':
        return <Layers className="w-5 h-5 text-purple-400" />
      default:
        return <Briefcase className="w-5 h-5 text-amber-400" />
    }
  }

  const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)] animate-in fade-in duration-150">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 stroke-[2]" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Timetable & Schedule Template Marketplace
              </h2>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Turnkey industry schedules designed for higher education, healthcare, conferences, and corporate governance.
            </p>
          </div>

          <button
            onClick={() => setIsTemplateMarketplaceOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successNotice && (
          <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Content Body: Sidebar list + Detail Preview */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 overflow-hidden">
          {/* Templates List Sidebar */}
          <div className="w-full md:w-72 shrink-0 flex flex-col space-y-2 overflow-y-auto pr-1 border-r border-[var(--border-subtle)] md:pr-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Curated Enterprise Templates
            </span>

            {INDUSTRY_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-3 rounded-[var(--radius-md)] border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shrink-0">
                      {renderIcon(tpl.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] leading-tight truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1 flex items-center gap-2">
                        <span>{tpl.category}</span>
                        <span>•</span>
                        <span>{tpl.slotCount} sessions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Template Detail & Slot Matrix Preview */}
          <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto pl-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-[var(--accent)] text-[var(--accent-text)]">
                  {selectedTemplate.category}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {selectedTemplate.slotCount} weekly sessions • {selectedTemplate.subjectCount} subjects
                </span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {selectedTemplate.name}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {selectedTemplate.description}
              </p>
            </div>

            {/* Slots Breakdown Table */}
            <div className="space-y-2 flex-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Included Schedule Slots & Venues
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {selectedTemplate.slots.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="truncate">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {s.subject}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {s.room}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px]">
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {DAY_NAMES[s.day]}
                      </span>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {s.start} – {s.end}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Ready to load into your operational workspace database.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScheduleAsCalendarEvents}
              disabled={applying}
              className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Schedule template sessions directly as live calendar events"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Schedule Live on Calendar</span>
            </button>

            <button
              onClick={handleApplyToTimetable}
              disabled={applying}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Apply slots and subjects to active timetable"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{applying ? 'Applying...' : 'Load into Timetable'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
