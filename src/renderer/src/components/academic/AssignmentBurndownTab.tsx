import React, { useState } from 'react'
import {
  ListTodo,
  Clock,
  Plus,
  Trash2,
  TrendingDown,
  Award
} from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { useAcademicStore } from '../../store/useAcademicStore'
import { useAppStore } from '../../store/useAppStore'

export const AssignmentBurndownTab: React.FC = () => {
  const {
    assignments,
    addAssignment,
    logAssignmentHours,
    toggleAssignmentCompleted,
    deleteAssignment
  } = useAcademicStore()

  const { subjects } = useAppStore()

  const [isAdding, setIsAdding] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [weightPercentage, setWeightPercentage] = useState(15)
  const [estimatedHours, setEstimatedHours] = useState(6)
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high')

  const handleSelectExistingSubject = (subjId: string) => {
    const subj = subjects.find((s) => s.id === subjId)
    if (subj) {
      setCourseCode(subj.name.split(/\s+/)[0].slice(0, 8).toUpperCase())
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseCode.trim() || !title.trim() || !dueDate) return

    addAssignment({
      courseCode: courseCode.trim().toUpperCase(),
      title: title.trim(),
      dueDate,
      weightPercentage: Number(weightPercentage),
      estimatedHours: Number(estimatedHours),
      hoursSpent: 0,
      completed: false,
      priority
    })

    setCourseCode('')
    setTitle('')
    setDueDate('')
    setIsAdding(false)
  }

  // Summary Metrics
  const activeAssignments = assignments.filter((a) => !a.completed)
  const totalWeightPending = activeAssignments.reduce((acc, a) => acc + a.weightPercentage, 0)
  const totalHoursRemaining = activeAssignments.reduce(
    (acc, a) => acc + Math.max(0, a.estimatedHours - a.hoursSpent),
    0
  )

  const priorityStyles: Record<string, string> = {
    urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    low: 'bg-neutral-800 text-neutral-400 border-neutral-700'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--accent)] text-[var(--accent-text)]">
              <TrendingDown className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Assignment Burn-Down & Weight Trajectory
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-2xl">
            Weights assignments by course grading impact (e.g. 15% Midterm vs 5% Problem Set). Tracks hours remaining to prevent bottleneck pileups before submission midnight.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Assignment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Grading Weight At Stake
            </p>
            <h4 className="text-2xl font-black font-mono text-[var(--text-primary)] mt-1">
              {totalWeightPending}%
            </h4>
          </div>
          <span className="p-2 rounded-full bg-amber-500/10 text-amber-400">
            <Award className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Study Hours Remaining
            </p>
            <h4 className="text-2xl font-black font-mono text-[var(--text-primary)] mt-1">
              {totalHoursRemaining.toFixed(1)}h
            </h4>
          </div>
          <span className="p-2 rounded-full bg-blue-500/10 text-blue-400">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Pending Deliverables
            </p>
            <h4 className="text-2xl font-black font-mono text-[var(--text-primary)] mt-1">
              {activeAssignments.length} Active
            </h4>
          </div>
          <span className="p-2 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
            <ListTodo className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Add Assignment Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] space-y-4 shadow-lg animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Create Course Deliverable
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>

          {subjects.length > 0 && (
            <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Quick-Select Subject:
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectExistingSubject(e.target.value)
                }}
                defaultValue=""
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1 text-xs text-[var(--text-primary)] outline-hidden"
              >
                <option value="" disabled>
                  -- Select a course from timetable --
                </option>
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
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Assignment / Project Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Lock Manager with Raft"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Grade Weight (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={weightPercentage}
                onChange={(e) => setWeightPercentage(Number(e.target.value))}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-hidden"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Add Assignment to Burndown Roster
          </button>
        </form>
      )}

      {/* Assignment List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
          <ListTodo className="w-3.5 h-3.5" />
          <span>Active Burndown Queue ({assignments.length})</span>
        </h4>

        {assignments.length === 0 ? (
          <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-3">
            <ListTodo className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
            <h5 className="text-xs font-bold text-[var(--text-primary)]">
              No course assignments or projects logged yet
            </h5>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              Add your upcoming course homework, lab deliverables, or term projects to track cumulative grading weight and prevent last-minute study crunches.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Deliverable</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignments.map((asg) => {
              const daysLeft = differenceInCalendarDays(
                new Date(`${asg.dueDate}T00:00:00`),
                new Date()
              )
              const progress = Math.min(100, Math.round((asg.hoursSpent / asg.estimatedHours) * 100))
              const isOverdue = daysLeft < 0 && !asg.completed
              const isImminent = daysLeft <= 2 && !asg.completed

              return (
                <div
                  key={asg.id}
                  className={`p-4 rounded-[var(--radius-lg)] border transition-all ${
                    asg.completed
                      ? 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] opacity-70'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={asg.completed}
                        onChange={() => toggleAssignmentCompleted(asg.id)}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--accent)] cursor-pointer mt-1"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                            {asg.courseCode}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${
                              priorityStyles[asg.priority] || ''
                            }`}
                          >
                            {asg.priority}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {asg.weightPercentage}% of Grade
                          </span>
                        </div>

                        <h4
                          className={`text-sm font-bold text-[var(--text-primary)] mt-1.5 truncate ${
                            asg.completed ? 'line-through text-[var(--text-muted)]' : ''
                          }`}
                        >
                          {asg.title}
                        </h4>

                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                          <span className={isOverdue ? 'text-red-400 font-bold' : isImminent ? 'text-amber-400 font-bold' : ''}>
                            Due: {format(new Date(`${asg.dueDate}T00:00:00`), 'EEE, MMM d')} ({isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})
                          </span>
                          <span>•</span>
                          <span>
                            {asg.hoursSpent}h / {asg.estimatedHours}h logged
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!asg.completed && (
                        <button
                          onClick={() => logAssignmentHours(asg.id, 1)}
                          className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
                          title="Log 1 hour of study towards this deliverable"
                        >
                          + 1h Work
                        </button>
                      )}
                      <button
                        onClick={() => deleteAssignment(asg.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-subtle)] rounded transition-colors"
                        title="Remove deliverable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          asg.completed
                            ? 'bg-emerald-500'
                            : progress >= 80
                            ? 'bg-emerald-400'
                            : progress >= 40
                            ? 'bg-blue-400'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                      {progress}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
