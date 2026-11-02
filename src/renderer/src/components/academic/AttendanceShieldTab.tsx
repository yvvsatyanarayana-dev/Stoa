import React, { useState } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  TrendingUp,
  Percent,
  Calendar
} from 'lucide-react'
import { useAcademicStore } from '../../store/useAcademicStore'
import { useAppStore } from '../../store/useAppStore'
import type { AttendanceCourse } from '../../types/academic'

export const AttendanceShieldTab: React.FC = () => {
  const {
    attendanceCourses,
    addAttendanceCourse,
    updateAttendance,
    deleteAttendanceCourse,
    importFromTimetable
  } = useAcademicStore()

  const { subjects } = useAppStore()

  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [targetPercentage, setTargetPercentage] = useState(75)
  const [creditHours, setCreditHours] = useState(3)
  const [totalConducted, setTotalConducted] = useState(0)
  const [attended, setAttended] = useState(0)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  const handleSelectExistingSubject = (subjId: string) => {
    const subj = subjects.find((s) => s.id === subjId)
    if (subj) {
      setCourseName(subj.name)
      setCourseCode(subj.name.split(/\s+/)[0].slice(0, 8).toUpperCase())
    }
  }

  const handleImportTimetable = () => {
    const count = importFromTimetable()
    if (count > 0) {
      setImportNotice(`Imported ${count} active subject(s) from your timetable schedule!`)
    } else {
      setImportNotice('All current timetable subjects are already synced in your roster.')
    }
    setTimeout(() => setImportNotice(null), 3500)
  }

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseCode.trim() || !courseName.trim()) return

    addAttendanceCourse({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      totalConducted: Math.max(0, totalConducted),
      attended: Math.min(totalConducted, Math.max(0, attended)),
      targetPercentage,
      creditHours,
      scheduleDays: [1, 3, 5]
    })

    setCourseCode('')
    setCourseName('')
    setAttended(0)
    setTotalConducted(0)
    setIsAddingCourse(false)
  }

  const computeMargin = (course: AttendanceCourse) => {
    const { totalConducted: total, attended: att, targetPercentage: target } = course
    if (total === 0) return { percent: 100, safeBunks: 0, classesNeeded: 0, isSafe: true }

    const percent = Math.round((att / total) * 100)
    const isSafe = percent >= target

    if (isSafe) {
      // Safe bunks: floor((attended * 100 - target * total) / target)
      const safeBunks = Math.floor((att * 100 - target * total) / target)
      return { percent, safeBunks: Math.max(0, safeBunks), classesNeeded: 0, isSafe }
    } else {
      // Classes needed: ceil((target * total - 100 * attended) / (100 - target))
      const divisor = 100 - target
      const needed = divisor > 0 ? Math.ceil((target * total - 100 * att) / divisor) : 1
      return { percent, safeBunks: 0, classesNeeded: Math.max(1, needed), isSafe }
    }
  }

  // Summary Metrics
  const overallConducted = attendanceCourses.reduce((acc, c) => acc + c.totalConducted, 0)
  const overallAttended = attendanceCourses.reduce((acc, c) => acc + c.attended, 0)
  const averagePercent =
    overallConducted > 0 ? Math.round((overallAttended / overallConducted) * 100) : 100

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--accent)] text-[var(--accent-text)]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Attendance Margin Shield & Safe Absence Engine
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-2xl">
            Monitors university & institutional mandatory attendance thresholds (75% or 85%). Calculates the exact number of classes you can safely miss without penalty, or the exact consecutive attendance streak needed to recover.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {subjects.length > 0 && (
            <button
              onClick={handleImportTimetable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Import Timetable ({subjects.length})</span>
            </button>
          )}
          <button
            onClick={() => setIsAddingCourse(!isAddingCourse)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course Roster</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius-md)] text-xs font-medium text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Overall Academic Attendance
            </p>
            <h4 className="text-2xl font-black font-mono text-[var(--text-primary)] mt-1">
              {averagePercent}%
            </h4>
          </div>
          <span className={`p-2 rounded-full ${averagePercent >= 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <Percent className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Lectures Tracked
            </p>
            <h4 className="text-2xl font-black font-mono text-[var(--text-primary)] mt-1">
              {overallAttended} / {overallConducted}
            </h4>
          </div>
          <span className="p-2 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
            <Calendar className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Enrolled Courses
            </p>
            <h4 className="text-2xl font-black font-mono text-[var(--text-primary)] mt-1">
              {attendanceCourses.length} Subjects
            </h4>
          </div>
          <span className="p-2 rounded-full bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Add Course Form */}
      {isAddingCourse && (
        <form
          onSubmit={handleAddCourse}
          className="p-5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] space-y-4 shadow-lg animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Track New Course Attendance
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingCourse(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>

          {subjects.length > 0 && (
            <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Quick-Fill from Timetable Subject:
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectExistingSubject(e.target.value)
                }}
                defaultValue=""
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1 text-xs text-[var(--text-primary)] outline-hidden"
              >
                <option value="" disabled>
                  -- Select a subject to auto-fill course info --
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS420"
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
                placeholder="e.g. Deep Learning"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Credits
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={creditHours}
                onChange={(e) => setCreditHours(Number(e.target.value))}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Target Threshold (%)
              </label>
              <select
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(Number(e.target.value))}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
              >
                <option value={75}>75% (Standard)</option>
                <option value={80}>80% (Strict)</option>
                <option value={85}>85% (Professional)</option>
                <option value={60}>60% (Lenient)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Held / Attended
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={attended}
                  onChange={(e) => setAttended(Number(e.target.value))}
                  placeholder="Attended"
                  className="w-1/2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
                />
                <input
                  type="number"
                  min={1}
                  value={totalConducted}
                  onChange={(e) => setTotalConducted(Number(e.target.value))}
                  placeholder="Total"
                  className="w-1/2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Add Course to Attendance Shield
          </button>
        </form>
      )}

      {/* Course Attendance Shield Cards */}
      {attendanceCourses.length === 0 ? (
        <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-3">
          <ShieldCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
          <h5 className="text-xs font-bold text-[var(--text-primary)]">
            No courses tracked in Attendance Shield yet
          </h5>
          <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
            {subjects.length > 0
              ? `You have ${subjects.length} course(s) in your timetable. Auto-import them to immediately monitor mandatory attendance minimums and safe bunks.`
              : 'Add your enrolled courses to calculate exact safe cuts and consecutive recovery streaks required to sit for exams.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {subjects.length > 0 && (
              <button
                onClick={handleImportTimetable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Import from Timetable</span>
              </button>
            )}
            <button
              onClick={() => setIsAddingCourse(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendanceCourses.map((course) => {
            const { percent, safeBunks, classesNeeded, isSafe } = computeMargin(course)

            return (
              <div
                key={course.id}
                className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-4 shadow-xs relative overflow-hidden group"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    percent >= course.targetPercentage
                      ? 'bg-emerald-500'
                      : percent >= course.targetPercentage - 5
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                      {course.courseCode}
                    </span>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">
                      {course.courseName}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Target: {course.targetPercentage}% • {course.creditHours} Credits
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-2xl font-black font-mono ${
                        isSafe ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {percent}%
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">
                      {course.attended} / {course.totalConducted}
                    </p>
                  </div>
                </div>

                {/* Safe Absence Margin Alert Pill */}
                <div
                  className={`p-2.5 rounded-[var(--radius-md)] border text-xs flex items-center gap-2 ${
                    isSafe
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}
                >
                  {isSafe ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0">
                    {isSafe ? (
                      <p className="font-semibold leading-tight">
                        Safe Zone: You can safely miss{' '}
                        <span className="font-bold underline">{safeBunks}</span> more class(es).
                      </p>
                    ) : (
                      <p className="font-semibold leading-tight">
                        Danger: Attend next{' '}
                        <span className="font-bold underline">{classesNeeded}</span> consecutive
                        class(es) to recover.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Log Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => updateAttendance(course.id, 'attend')}
                    className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>+ Attended</span>
                  </button>
                  <button
                    onClick={() => updateAttendance(course.id, 'miss')}
                    className="flex-1 py-1.5 rounded-[var(--radius-sm)] bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>+ Missed</span>
                  </button>
                  <button
                    onClick={() => deleteAttendanceCourse(course.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-subtle)] rounded transition-colors"
                    title="Remove Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
