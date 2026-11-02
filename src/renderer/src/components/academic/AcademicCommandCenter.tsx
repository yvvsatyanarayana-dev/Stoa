import React, { useState } from 'react'
import {
  GraduationCap,
  Brain,
  ShieldCheck,
  BookOpen,
  TrendingDown
} from 'lucide-react'
import { SpacedRepetitionTab } from './SpacedRepetitionTab'
import { AttendanceShieldTab } from './AttendanceShieldTab'
import { SyllabusChunkerTab } from './SyllabusChunkerTab'
import { AssignmentBurndownTab } from './AssignmentBurndownTab'
import { useAcademicStore } from '../../store/useAcademicStore'

export type AcademicTab = 'spaced-repetition' | 'attendance-shield' | 'syllabus-chunker' | 'assignments'

export const AcademicCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AcademicTab>('spaced-repetition')
  const { attendanceCourses, spacedSessions, assignments } = useAcademicStore()

  // Summary tallies
  const pendingReviewsToday = spacedSessions.filter(
    (s) => s.scheduledDate === new Date().toISOString().split('T')[0] && !s.completed
  ).length

  const coursesBelowThreshold = attendanceCourses.filter(
    (c) => c.totalConducted > 0 && (c.attended / c.totalConducted) * 100 < c.targetPercentage
  ).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header & Sub-Suite Navigation */}
      <div className="bg-[var(--bg-sidebar)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none no-scrollbar">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold shadow-xs shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
              Academic Mastery & Exam Hub
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs sm:max-w-md">
              SuperMemo SM-2 • Attendance Margin Shield • Syllabus Chunker • Burndown
            </p>
          </div>
        </div>

        {/* View Switcher Tabs - Sleek Segmented Control */}
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] text-xs shrink-0 no-scrollbar overflow-x-auto gap-0.5 max-w-full">
          <button
            onClick={() => setActiveTab('spaced-repetition')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'spaced-repetition'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Spaced Repetition</span>
            {pendingReviewsToday > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingReviewsToday}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attendance-shield')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'attendance-shield'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Attendance Shield</span>
            {coursesBelowThreshold > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                {coursesBelowThreshold} risk
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('syllabus-chunker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'syllabus-chunker'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Syllabus Chunker</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border-default)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Burndown Queue</span>
            {assignments.filter((a) => !a.completed).length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {assignments.filter((a) => !a.completed).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'spaced-repetition' && <SpacedRepetitionTab />}
          {activeTab === 'attendance-shield' && <AttendanceShieldTab />}
          {activeTab === 'syllabus-chunker' && <SyllabusChunkerTab />}
          {activeTab === 'assignments' && <AssignmentBurndownTab />}
        </div>
      </div>
    </div>
  )
}
