import React, { useState } from 'react'
import {
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash2,
  BookOpen
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useAcademicStore } from '../../store/useAcademicStore'
import { useAppStore } from '../../store/useAppStore'

export const SyllabusChunkerTab: React.FC = () => {
  const {
    syllabusChunks,
    autoChunkSyllabus,
    toggleChunkCompleted,
    deleteSyllabusChunk
  } = useAcademicStore()

  const { subjects } = useAppStore()

  const [courseCode, setCourseCode] = useState('')
  const [unitName, setUnitName] = useState('')
  const [examDate, setExamDate] = useState(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
  const [rawText, setRawText] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSelectExistingSubject = (subjId: string) => {
    const subj = subjects.find((s) => s.id === subjId)
    if (subj) {
      setUnitName(`Syllabus for ${subj.name}`)
      setCourseCode(subj.name.split(/\s+/)[0].slice(0, 8).toUpperCase())
    }
  }

  const handleRunChunker = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawText.trim() || !courseCode.trim() || !examDate) return

    autoChunkSyllabus(courseCode.trim().toUpperCase(), unitName.trim() || 'Unit / Module Plan', rawText, examDate)
    setSuccessMessage(`Auto-chunked syllabus into balanced study sprints leading up to ${examDate}!`)
    setTimeout(() => setSuccessMessage(null), 3500)
    setRawText('')
  }

  const completedCount = syllabusChunks.filter((c) => c.completed).length
  const totalHours = syllabusChunks.reduce((acc, c) => acc + c.estimatedHours, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--accent)] text-[var(--accent-text)]">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Course Syllabus Auto-Chunker
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-2xl">
            Paste messy course syllabus bullet points or chapter contents. The engine chunks topics into digestible 90-minute daily study sprints distributed evenly across your remaining days.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-right">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {completedCount} / {syllabusChunks.length}
            </span>
            <p className="text-[10px] text-[var(--text-muted)]">Sprints Done</p>
          </div>
          <div className="text-right border-l border-[var(--border-subtle)] pl-3">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {totalHours}h
            </span>
            <p className="text-[10px] text-[var(--text-muted)]">Study Volume</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius-md)] text-xs font-medium text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Chunker Input Workspace */}
      <form
        onSubmit={handleRunChunker}
        className="p-5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] space-y-4 shadow-xs"
      >
        {subjects.length > 0 && (
          <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Quick-Select Timetable Subject:
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) handleSelectExistingSubject(e.target.value)
              }}
              defaultValue=""
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1 text-xs text-[var(--text-primary)] outline-hidden"
            >
              <option value="" disabled>
                -- Select a timetable course --
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
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Module / Unit Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Module 1: Distributed Algorithms"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Target Completion / Exam Date
            </label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            Raw Syllabus Topics & Sub-Chapters (Paste from course PDF / lecture slides)
          </label>
          <textarea
            rows={5}
            required
            placeholder={`Paste your syllabus chapters or topics here, e.g.:
1. Introduction & Architecture Overview
2. Memory Models & Cache Coherence
3. Locking & Synchronization Primitives
4. Failure Detection & Heartbeats`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--text-primary)] font-mono outline-hidden focus:border-[var(--accent)] resize-y"
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Auto-Chunk Syllabus into Balanced Daily Sprints</span>
        </button>
      </form>

      {/* Generated Sprints Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Structured Study Sprints ({syllabusChunks.length})</span>
        </h4>

        {syllabusChunks.length === 0 ? (
          <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
            <h5 className="text-xs font-bold text-[var(--text-primary)]">
              No syllabus chunks generated yet
            </h5>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              Paste your course topics above and click Auto-Chunk to generate structured daily revision milestones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {syllabusChunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`p-4 rounded-[var(--radius-lg)] border transition-all ${
                  chunk.completed
                    ? 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] opacity-70'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                      {chunk.courseCode}
                    </span>
                    <h5
                      className={`text-xs font-bold text-[var(--text-primary)] mt-1.5 truncate ${
                        chunk.completed ? 'line-through text-[var(--text-muted)]' : ''
                      }`}
                    >
                      {chunk.unitName}
                    </h5>
                  </div>

                  <button
                    onClick={() => deleteSyllabusChunk(chunk.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 rounded"
                    title="Remove sprint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-2.5 p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] space-y-1">
                  {chunk.topics.map((t, idx) => (
                    <p key={idx} className="text-[11px] text-[var(--text-secondary)] truncate flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                      <span>{t}</span>
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(`${chunk.scheduledDate}T00:00:00`), 'MMM d')}</span>
                    <span>• {chunk.estimatedHours}h</span>
                  </div>

                  <button
                    onClick={() => toggleChunkCompleted(chunk.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      chunk.completed
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{chunk.completed ? 'Mastered' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
