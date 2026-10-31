import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore'
import type {
  Collaborator,
  AnnotationThread,
  AnnotationReply,
  ChangeAttribution,
  AnnotationState
} from '../types/annotation'

export interface AnnotationStore extends AnnotationState {
  addThread: (thread: AnnotationThread) => void
  addReply: (threadId: string, reply: AnnotationReply) => void
  resolveThread: (threadId: string, resolvedBy: string) => void
  archiveThread: (threadId: string) => void
  selectThread: (id: string | null) => void
  setFilterEvent: (eventId: string | null) => void
  revertChange: (changeId: string) => void
  updateCollaboratorStatus: (id: string, isOnline: boolean) => void
  logEventChange: (change: ChangeAttribution) => void
  seedAnnotationsForEvents: (events: Array<{ id: string; title: string }>) => void
  clearAllAnnotations: () => void
}

const defaultCollaborators: Collaborator[] = [
  {
    id: 'collab-1',
    name: 'Sarah Mitchell',
    initials: 'SM',
    cursorColor: '#aaaaaa',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    currentEventId: null
  },
  {
    id: 'collab-2',
    name: 'Marcus Chen',
    initials: 'MC',
    cursorColor: '#666666',
    isOnline: false,
    lastSeen: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    currentEventId: null
  },
  {
    id: 'collab-3',
    name: 'Priya Anand',
    initials: 'PA',
    cursorColor: '#888888',
    isOnline: false,
    lastSeen: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    currentEventId: null
  }
]

export const useAnnotationStore = create<AnnotationStore>()(
  persist(
    (set) => ({
      collaborators: defaultCollaborators,
      threads: [],
      changeHistory: [],
      liveSession: {
        id: 'mesh-session-active',
        startedAt: new Date().toISOString(),
        participants: ['collab-1', 'collab-me'],
        activeEventId: null,
        cursorPositions: {}
      },
      selectedThreadId: null,
      filterEventId: null,

      addThread: (thread) =>
        set((state) => ({
          threads: [thread, ...state.threads],
          selectedThreadId: thread.id
        })),

      addReply: (threadId, reply) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  replies: [...t.replies, reply],
                  updatedAt: new Date().toISOString()
                }
              : t
          )
        })),

      resolveThread: (threadId, resolvedBy) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  status: 'resolved',
                  resolved: true,
                  resolvedBy,
                  resolvedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              : t
          )
        })),

      archiveThread: (threadId) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? { ...t, status: 'archived', updatedAt: new Date().toISOString() }
              : t
          )
        })),

      selectThread: (id) => set({ selectedThreadId: id }),

      setFilterEvent: (eventId) => set({ filterEventId: eventId }),

      revertChange: (changeId) =>
        set((state) => ({
          changeHistory: state.changeHistory.map((c) =>
            c.id === changeId ? { ...c, reverted: true } : c
          )
        })),

      updateCollaboratorStatus: (id, isOnline) =>
        set((state) => ({
          collaborators: state.collaborators.map((c) =>
            c.id === id
              ? { ...c, isOnline, lastSeen: isOnline ? c.lastSeen : new Date().toISOString() }
              : c
          )
        })),

      logEventChange: (change) =>
        set((state) => ({
          changeHistory: [change, ...state.changeHistory]
        })),

      seedAnnotationsForEvents: (events) => {
        if (!events || events.length === 0) return
        const now = new Date()
        const newThreads: AnnotationThread[] = events.slice(0, 3).map((evt, idx) => ({
          id: `th-seed-${evt.id}-${idx}`,
          eventId: evt.id,
          eventTitle: evt.title,
          type: idx === 0 ? 'comment' : idx === 1 ? 'decision' : 'question',
          status: 'open',
          authorId: idx === 0 ? 'collab-1' : 'collab-2',
          authorName: idx === 0 ? 'Sarah Mitchell' : 'Marcus Chen',
          createdAt: new Date(now.getTime() - (idx + 1) * 3600000).toISOString(),
          updatedAt: new Date(now.getTime() - (idx + 1) * 3600000).toISOString(),
          content:
            idx === 0
              ? `Reviewing the schedule for "${evt.title}". All dependencies are accounted for, please ensure the room equipment is ready.`
              : idx === 1
              ? `Confirmed attendees for "${evt.title}". Key stakeholders confirmed their participation.`
              : `Has the agenda for "${evt.title}" been distributed to all attendees?`,
          replies: [
            {
              id: `rep-seed-${idx}`,
              threadId: `th-seed-${evt.id}-${idx}`,
              authorId: 'collab-me',
              authorName: useAuthStore.getState().currentUser?.name ? `${useAuthStore.getState().currentUser?.name} (You)` : 'You',
              content: 'Confirmed, I will handle the follow up.',
              createdAt: new Date(now.getTime() - idx * 1800000).toISOString()
            }
          ],
          resolved: false,
          tags: ['calendar-sync', 'review'],
          priority: 'normal'
        }))

        const newChanges: ChangeAttribution[] = events.slice(0, 3).map((evt, idx) => ({
          id: `ch-seed-${evt.id}-${idx}`,
          eventId: evt.id,
          eventTitle: evt.title,
          field: idx === 0 ? 'time' : idx === 1 ? 'location' : 'title',
          oldValue: idx === 0 ? '10:00 AM' : idx === 1 ? 'Room 201' : 'Draft Session',
          newValue: idx === 0 ? '11:00 AM' : idx === 1 ? 'Main Executive Hall' : evt.title,
          changedBy: 'Marcus Chen',
          changedAt: new Date(now.getTime() - (idx + 2) * 3600000).toISOString(),
          sessionId: 'mesh-session-active',
          reverted: false
        }))

        set({
          threads: newThreads,
          changeHistory: newChanges,
          selectedThreadId: newThreads[0]?.id || null
        })
      },

      clearAllAnnotations: () => set({ threads: [], changeHistory: [], selectedThreadId: null })
    }),
    {
      name: 'chronodesk-annotation-store-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
