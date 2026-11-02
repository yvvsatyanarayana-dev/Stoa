import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
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
  clearAllAnnotations: () => void
}

export const useAnnotationStore = create<AnnotationStore>()(
  persist(
    (set) => ({
      collaborators: [],
      threads: [],
      changeHistory: [],
      liveSession: {
        id: 'mesh-session-active',
        startedAt: new Date().toISOString(),
        participants: ['collab-me'],
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

      clearAllAnnotations: () => set({ threads: [], changeHistory: [], selectedThreadId: null })
    }),
    {
      name: 'chronodesk-annotation-store-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
