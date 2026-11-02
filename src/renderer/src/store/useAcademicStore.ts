import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, format, differenceInCalendarDays } from 'date-fns'
import type {
  ExamItem,
  SpacedRepetitionSession,
  AttendanceCourse,
  SyllabusChunk,
  AssignmentItem
} from '../types/academic'
import { useAppStore } from './useAppStore'

export interface AcademicStoreState {
  exams: ExamItem[]
  spacedSessions: SpacedRepetitionSession[]
  attendanceCourses: AttendanceCourse[]
  syllabusChunks: SyllabusChunk[]
  assignments: AssignmentItem[]

  // Exam Actions
  addExam: (exam: Omit<ExamItem, 'id'>) => void
  deleteExam: (id: string) => void
  generateSpacedSessionsForExam: (examId: string) => void
  toggleSessionCompleted: (sessionId: string) => void

  // Attendance Actions
  addAttendanceCourse: (course: Omit<AttendanceCourse, 'id'>) => void
  updateAttendance: (courseId: string, type: 'attend' | 'miss') => void
  deleteAttendanceCourse: (courseId: string) => void

  // Syllabus Actions
  addSyllabusChunk: (chunk: Omit<SyllabusChunk, 'id'>) => void
  autoChunkSyllabus: (courseCode: string, unitName: string, rawText: string, examDateStr: string) => void
  toggleChunkCompleted: (chunkId: string) => void
  deleteSyllabusChunk: (chunkId: string) => void

  // Assignment Actions
  addAssignment: (assignment: Omit<AssignmentItem, 'id'>) => void
  logAssignmentHours: (id: string, hours: number) => void
  toggleAssignmentCompleted: (id: string) => void
  deleteAssignment: (id: string) => void

  // Calendar & Timetable Sync
  syncStudySessionsToCalendar: () => Promise<number>
  importFromTimetable: () => number
  clearAllAcademicData: () => void
}

// SM-2 Spaced Repetition interval steps in days
const SM2_INTERVALS = [
  { step: 1, phase: 'initial' as const, dayOffset: 1, duration: 60 },
  { step: 2, phase: 'reinforce' as const, dayOffset: 3, duration: 45 },
  { step: 3, phase: 'mastery' as const, dayOffset: 7, duration: 45 },
  { step: 4, phase: 'final_rehearsal' as const, dayOffset: 14, duration: 90 }
]

export const useAcademicStore = create<AcademicStoreState>()(
  persist(
    (set, get) => ({
      exams: [],
      spacedSessions: [],
      attendanceCourses: [],
      syllabusChunks: [],
      assignments: [],

      addExam: (examData) => {
        const id = `exam-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`
        const newExam: ExamItem = { id, ...examData }
        set((state) => ({ exams: [...state.exams, newExam] }))
        get().generateSpacedSessionsForExam(id)
      },

      deleteExam: (id) => {
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
          spacedSessions: state.spacedSessions.filter((s) => s.examId !== id)
        }))
      },

      generateSpacedSessionsForExam: (examId) => {
        const exam = get().exams.find((e) => e.id === examId)
        if (!exam) return

        const examDate = new Date(`${exam.examDate}T00:00:00`)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const daysUntilExam = differenceInCalendarDays(examDate, today)
        if (daysUntilExam <= 0) return

        const generatedSessions: SpacedRepetitionSession[] = []

        exam.syllabusTopics.forEach((topic, topicIdx) => {
          SM2_INTERVALS.forEach((interval) => {
            // Distribute topics with staggered initial offset
            const offset = interval.dayOffset + topicIdx * 2
            if (offset < daysUntilExam) {
              const sessionDate = addDays(today, offset)
              const timeSlot = topicIdx % 2 === 0 ? '16:00' : '18:30'

              generatedSessions.push({
                id: `sm2-${exam.id}-${topicIdx}-${interval.step}`,
                examId: exam.id,
                courseCode: exam.courseCode,
                topic,
                scheduledDate: format(sessionDate, 'yyyy-MM-dd'),
                scheduledTime: timeSlot,
                durationMinutes: interval.duration,
                intervalStep: interval.step,
                repetitionPhase: interval.phase,
                completed: false
              })
            }
          })

          // Mandatory final cram/rehearsal 1 day before exam
          if (daysUntilExam >= 2) {
            const finalDate = addDays(examDate, -1)
            generatedSessions.push({
              id: `sm2-${exam.id}-${topicIdx}-final`,
              examId: exam.id,
              courseCode: exam.courseCode,
              topic: `${topic} (Final Exam Drill)`,
              scheduledDate: format(finalDate, 'yyyy-MM-dd'),
              scheduledTime: '17:00',
              durationMinutes: 45,
              intervalStep: 5,
              repetitionPhase: 'final_rehearsal',
              completed: false
            })
          }
        })

        // Merge with existing sessions (keep completed ones untouched)
        set((state) => {
          const untouched = state.spacedSessions.filter((s) => s.examId !== examId || s.completed)
          const newToAdd = generatedSessions.filter(
            (ns) => !untouched.some((u) => u.id === ns.id)
          )
          return { spacedSessions: [...untouched, ...newToAdd] }
        })
      },

      toggleSessionCompleted: (sessionId) => {
        set((state) => ({
          spacedSessions: state.spacedSessions.map((s) =>
            s.id === sessionId ? { ...s, completed: !s.completed } : s
          )
        }))
      },

      addAttendanceCourse: (courseData) => {
        const id = `att-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`
        set((state) => ({
          attendanceCourses: [...state.attendanceCourses, { id, ...courseData }]
        }))
      },

      updateAttendance: (courseId, type) => {
        set((state) => ({
          attendanceCourses: state.attendanceCourses.map((c) => {
            if (c.id !== courseId) return c
            const newTotal = c.totalConducted + 1
            const newAttended = type === 'attend' ? c.attended + 1 : c.attended
            return {
              ...c,
              totalConducted: newTotal,
              attended: newAttended
            }
          })
        }))
      },

      deleteAttendanceCourse: (courseId) => {
        set((state) => ({
          attendanceCourses: state.attendanceCourses.filter((c) => c.id !== courseId)
        }))
      },

      addSyllabusChunk: (chunkData) => {
        const id = `chk-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`
        set((state) => ({
          syllabusChunks: [...state.syllabusChunks, { id, ...chunkData }]
        }))
      },

      autoChunkSyllabus: (courseCode, unitName, rawText, examDateStr) => {
        const rawLines = rawText
          .split(/[\n,;•\-\d+\.]/)
          .map((l) => l.trim())
          .filter((l) => l.length > 3)

        if (rawLines.length === 0) return

        const examDate = new Date(`${examDateStr}T00:00:00`)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const totalDays = Math.max(1, differenceInCalendarDays(examDate, today) - 2)

        // Chunk lines into clusters of 2-3 topics
        const chunkSize = Math.max(1, Math.ceil(rawLines.length / Math.min(totalDays, 10)))
        const chunks: SyllabusChunk[] = []

        for (let i = 0; i < rawLines.length; i += chunkSize) {
          const slice = rawLines.slice(i, i + chunkSize)
          const dayIndex = Math.floor((i / rawLines.length) * totalDays)
          const targetDate = addDays(today, dayIndex + 1)

          chunks.push({
            id: `chk-${Date.now()}-${i}-${crypto.randomUUID().slice(0, 4)}`,
            courseCode,
            unitName: `${unitName} - Sprint ${Math.floor(i / chunkSize) + 1}`,
            topics: slice,
            estimatedHours: slice.length * 1.5,
            scheduledDate: format(targetDate, 'yyyy-MM-dd'),
            completed: false
          })
        }

        set((state) => ({ syllabusChunks: [...state.syllabusChunks, ...chunks] }))
      },

      toggleChunkCompleted: (chunkId) => {
        set((state) => ({
          syllabusChunks: state.syllabusChunks.map((c) =>
            c.id === chunkId ? { ...c, completed: !c.completed } : c
          )
        }))
      },

      deleteSyllabusChunk: (chunkId) => {
        set((state) => ({
          syllabusChunks: state.syllabusChunks.filter((c) => c.id !== chunkId)
        }))
      },

      addAssignment: (asgData) => {
        const id = `asg-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`
        set((state) => ({
          assignments: [...state.assignments, { id, ...asgData }]
        }))
      },

      logAssignmentHours: (id, hours) => {
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, hoursSpent: Math.max(0, a.hoursSpent + hours) } : a
          )
        }))
      },

      toggleAssignmentCompleted: (id) => {
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, completed: !a.completed } : a
          )
        }))
      },

      deleteAssignment: (id) => {
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id)
        }))
      },

      // 1-Click Sync to Local SQLite Calendar
      syncStudySessionsToCalendar: async () => {
        const sessions = get().spacedSessions.filter((s) => !s.completed && !s.calendarEventId)
        if (sessions.length === 0) return 0

        const appState = useAppStore.getState()
        const targetCalId = appState.calendars[0]?.id || 'cal-primary'
        let scheduledCount = 0

        for (const session of sessions) {
          const [h, m] = session.scheduledTime.split(':').map(Number)
          const start = new Date(`${session.scheduledDate}T00:00:00`)
          start.setHours(h, m, 0, 0)
          const end = new Date(start.getTime() + session.durationMinutes * 60000)

          const newEvt = {
            id: `evt-study-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            calendar_id: targetCalId,
            title: `📚 ${session.courseCode}: ${session.topic}`,
            description: `[STOA_SPACED_REPETITION]\nPhase: ${session.repetitionPhase.toUpperCase()}\nInterval Step: ${session.intervalStep}d\nExam prep via SuperMemo SM-2 human retention curve.`,
            start: start.toISOString(),
            end: end.toISOString(),
            all_day: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            priority: session.repetitionPhase === 'final_rehearsal' ? ('urgent' as const) : ('high' as const),
            status: 'confirmed' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          try {
            await window.api.events.create(newEvt)
            session.calendarEventId = newEvt.id
            scheduledCount++
          } catch (e) {
            console.error('Failed to schedule study session to calendar:', e)
          }
        }

        await appState.fetchEvents()
        set((state) => ({ spacedSessions: [...state.spacedSessions] }))
        return scheduledCount
      },

      importFromTimetable: () => {
        const subjects = useAppStore.getState().subjects
        const slots = useAppStore.getState().activeTimetableSlots
        if (!subjects || subjects.length === 0) return 0

        const existingCourses = get().attendanceCourses
        let addedCount = 0
        const newCourses: AttendanceCourse[] = []

        subjects.forEach((subj) => {
          const alreadyExists = existingCourses.some(
            (c) =>
              c.courseName.toLowerCase() === subj.name.toLowerCase() ||
              c.courseCode.toLowerCase() === subj.name.toLowerCase()
          )
          if (!alreadyExists) {
            const subjSlots = slots.filter((s) => s.subject_id === subj.id)
            const scheduledDays = Array.from(new Set(subjSlots.map((s) => s.day)))
            const creditHours = Math.max(1, Math.round(subj.weekly_hours || subjSlots.length || 3))

            newCourses.push({
              id: `att-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
              courseCode: subj.name.split(/\s+/)[0].slice(0, 8).toUpperCase(),
              courseName: subj.name,
              totalConducted: 0,
              attended: 0,
              targetPercentage: 75,
              scheduleDays: scheduledDays.length > 0 ? scheduledDays : [1, 3, 5],
              creditHours
            })
            addedCount++
          }
        })

        if (newCourses.length > 0) {
          set((state) => ({ attendanceCourses: [...state.attendanceCourses, ...newCourses] }))
        }
        return addedCount
      },

      clearAllAcademicData: () => {
        set({
          exams: [],
          spacedSessions: [],
          attendanceCourses: [],
          syllabusChunks: [],
          assignments: []
        })
      }
    }),
    {
      name: 'stoa_academic_hub'
    }
  )
)
