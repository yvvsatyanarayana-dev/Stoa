import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  Flame,
  Brain,
  GraduationCap
} from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { useAcademicStore } from '../../store/useAcademicStore'
import { useAppStore } from '../../store/useAppStore'

export const SpacedRepetitionTab: React.FC = () => {
  const {
    exams,
    spacedSessions,
    addExam,
    deleteExam,
    generateSpacedSessionsForExam,
    toggleSessionCompleted,
    syncStudySessionsToCalendar
  } = useAcademicStore()

  const { subjects } = useAppStore()

  const [isAddingExam, setIsAddingExam] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examTime, setExamTime] = useState('09:00')
  const [targetGrade, setTargetGrade] = useState('A')
  const [difficulty, setDifficulty] = useState<'moderate' | 'challenging' | 'critical'>('challenging')
  const [topicsInput, setTopicsInput] = useState('')
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  const handleSelectExistingSubject = (subjId: string) => {
    const subj = subjects.find((s) => s.id === subjId)
    if (subj) {
      setCourseName(subj.name)
      setCourseCode(subj.name.split(/\s+/)[0].slice(0, 8).toUpperCase())
    }
  }

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseCode.trim() || !courseName.trim() || !examDate) return

    const parsedTopics = topicsInput
      .split(/[\n,;•]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2)

    addExam({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      examDate,
      examTime,
      targetGrade: targetGrade.trim(),
      difficulty,
      syllabusTopics: parsedTopics.length > 0 ? parsedTopics : ['General Mastery & Problem Solving']
    })

    setCourseCode('')
    setCourseName('')
    setExamDate('')
    setTopicsInput('')
    setIsAddingExam(false)
  }

  const handleSyncToCalendar = async () => {
    const scheduled = await syncStudySessionsToCalendar()
    setSyncNotice(`Scheduled ${scheduled} spaced retention study block(s) into your master calendar!`)
    setTimeout(() => setSyncNotice(null), 4000)
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const dueToday = spacedSessions.filter((s) => s.scheduledDate === todayStr && !s.completed)
  const upcomingSessions = spacedSessions.filter((s) => s.scheduledDate > todayStr && !s.completed)

  const phaseColors: Record<string, string> = {
    initial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    reinforce: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    mastery: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    final_rehearsal: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & 1-Click Sync */}
      <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--accent)] text-[var(--accent-text)]">
              <Brain className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              SuperMemo SM-2 Spaced Repetition Engine
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-2xl">
            Calculates human memory decay curves ($R = e^{'{'}-t/S{'}'}$) and automatically schedules review intervals (1d, 3d, 7d, 14d) leading up to your exam day to prevent late-night cramming.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingExam(!isAddingExam)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam</span>
          </button>
          <button
            onClick={handleSyncToCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Sync Study Slots to Calendar</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius-md)] text-xs font-medium text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Add Exam Modal Form */}
      {isAddingExam && (
        <form
          onSubmit={handleCreateExam}
          className="p-5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] space-y-4 shadow-lg animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Add Target Exam & Syllabus
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingExam(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>

          {subjects && subjects.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Quick Select from Timetable Subjects
              </label>
              <select
                onChange={(e) => handleSelectExistingSubject(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
              >
                <option value="">-- Or choose an existing subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS301"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Course Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Systems"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Exam Date & Time
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
                />
                <input
                  type="time"
                  required
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className="w-24 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Difficulty Level & Target Grade
              </label>
              <div className="flex gap-2">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
                >
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                  <option value="critical">Critical / High Stakes</option>
                </select>
                <input
                  type="text"
                  placeholder="Target Grade (A+)"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-32 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Syllabus Topics (One per line)
              </label>
              <textarea
                rows={3}
                placeholder="Raft Consensus&#10;Vector Clocks&#10;CRDTs"
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)] resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Create Exam & Auto-Generate Spaced Study Schedule
          </button>
        </form>
      )}

      {/* Exam Countdown Cards */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Active Exam Countdowns ({exams.length})</span>
        </h4>

        {exams.length === 0 ? (
          <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-3">
            <GraduationCap className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
            <h5 className="text-xs font-bold text-[var(--text-primary)]">
              No exams scheduled yet
            </h5>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              Add your upcoming course finals or midterms to calculate SM-2 spaced repetition decay curves and lock retention review blocks directly into your calendar.
            </p>
            <button
              onClick={() => setIsAddingExam(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Your First Exam</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((exam) => {
              const daysLeft = differenceInCalendarDays(
                new Date(`${exam.examDate}T00:00:00`),
                new Date()
              )
              const isUrgent = daysLeft <= 7

              return (
                <div
                  key={exam.id}
                  className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-xs"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isUrgent ? 'bg-amber-500' : 'bg-[var(--accent)]'
                    }`}
                  />

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                        {exam.courseCode}
                      </span>
                      <h5 className="text-sm font-bold text-[var(--text-primary)] mt-1 line-clamp-1">
                        {exam.courseName}
                      </h5>
                      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(`${exam.examDate}T00:00:00`), 'EEE, MMM d')} at {exam.examTime}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-[var(--text-primary)]">
                        {Math.max(0, daysLeft)}d
                      </span>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                        remaining
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[var(--text-muted)]">Target: <strong className="text-[var(--text-primary)]">{exam.targetGrade}</strong></span>
                      <span className="text-[var(--text-muted)]">• Topics: <strong className="text-[var(--text-primary)]">{exam.syllabusTopics.length}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => generateSpacedSessionsForExam(exam.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
                        title="Re-calculate Spaced Repetition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-hover)] rounded"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Due Today Spaced Repetition Session Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Spaced Repetition Due Today ({dueToday.length})</span>
          </h4>
        </div>

        {dueToday.length === 0 ? (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
            ✨ You are all caught up on retention reviews for today!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {dueToday.map((session) => (
              <div
                key={session.id}
                className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={session.completed}
                    onChange={() => toggleSessionCompleted(session.id)}
                    className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                        {session.courseCode}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${
                          phaseColors[session.repetitionPhase] || 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {session.repetitionPhase.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate mt-0.5">
                      {session.topic}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {session.scheduledTime}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {session.durationMinutes} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Repetition Roadmap */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Spaced Review Roadmap ({upcomingSessions.length})</span>
        </h4>

        {upcomingSessions.length === 0 ? (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
            No upcoming review sessions. When you schedule an exam, your SM-2 spaced repetition roadmap will be automatically plotted here.
          </div>
        ) : (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] divide-y divide-[var(--border-subtle)] overflow-hidden shadow-xs">
            {upcomingSessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={session.completed}
                    onChange={() => toggleSessionCompleted(session.id)}
                    className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--accent)] cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {session.topic}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        ({session.courseCode})
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Phase: <strong className="text-[var(--text-secondary)]">{session.repetitionPhase.replace('_', ' ')}</strong> (Step {session.intervalStep}d)
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    {format(new Date(`${session.scheduledDate}T00:00:00`), 'MMM d')} • {session.scheduledTime}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {session.durationMinutes} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
