export interface ExamItem {
  id: string
  courseCode: string
  courseName: string
  examDate: string // YYYY-MM-DD
  examTime: string // HH:mm
  room?: string
  targetGrade: string
  difficulty: 'moderate' | 'challenging' | 'critical'
  syllabusTopics: string[]
}

export interface SpacedRepetitionSession {
  id: string
  examId: string
  courseCode: string
  topic: string
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:mm
  durationMinutes: number
  intervalStep: number // 1, 3, 7, 14, 28
  repetitionPhase: 'initial' | 'reinforce' | 'mastery' | 'final_rehearsal'
  completed: boolean
  calendarEventId?: string
}

export interface AttendanceCourse {
  id: string
  courseCode: string
  courseName: string
  totalConducted: number
  attended: number
  targetPercentage: number // e.g. 75
  scheduleDays: number[] // 1=Mon..5=Fri
  creditHours: number
}

export interface SyllabusChunk {
  id: string
  courseCode: string
  unitName: string
  topics: string[]
  estimatedHours: number
  scheduledDate: string
  completed: boolean
}

export interface AssignmentItem {
  id: string
  courseCode: string
  title: string
  dueDate: string // YYYY-MM-DD
  weightPercentage: number
  estimatedHours: number
  hoursSpent: number
  completed: boolean
  priority: 'urgent' | 'high' | 'medium' | 'low'
}
