import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Collaborator,
  AnnotationThread,
  AnnotationReply,
  ChangeAttribution,
  LiveSession,
  AnnotationState
} from '../types/annotation'

interface AnnotationStore extends AnnotationState {
  addThread: (thread: AnnotationThread) => void
  addReply: (threadId: string, reply: AnnotationReply) => void
  resolveThread: (threadId: string, resolvedBy: string) => void
  archiveThread: (threadId: string) => void
  selectThread: (id: string | null) => void
  setFilterEvent: (eventId: string | null) => void
  revertChange: (changeId: string) => void
  updateCollaboratorStatus: (id: string, isOnline: boolean) => void
}

const defaultCollaborators: Collaborator[] = [
  {
    id: 'collab-1',
    name: 'Sarah Mitchell',
    initials: 'SM',
    cursorColor: '#aaaaaa',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    currentEventId: 'evt-q4-planning'
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
  },
  {
    id: 'collab-4',
    name: 'Tobias Renn',
    initials: 'TR',
    cursorColor: '#444444',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    currentEventId: null
  }
]

const defaultThreads: AnnotationThread[] = [
  {
    id: 'thread-1',
    eventId: 'evt-q4-planning',
    eventTitle: 'Q4 Planning Session',
    type: 'comment',
    status: 'open',
    authorId: 'collab-1',
    authorName: 'Sarah Mitchell',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    content:
      'We should invite the finance team leads to this session. The budget allocation discussion will need their sign-off before we can finalize any of the Q4 targets.',
    replies: [
      {
        id: 'reply-1-1',
        threadId: 'thread-1',
        authorId: 'collab-2',
        authorName: 'Marcus Chen',
        content: 'Agreed — I\'ll ping Diane from Finance this afternoon to confirm attendance.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'reply-1-2',
        threadId: 'thread-1',
        authorId: 'collab-3',
        authorName: 'Priya Anand',
        content: 'Also suggest adding the legal rep for the contract review portion. Let me know if that\'s in scope.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ],
    resolved: false,
    tags: ['attendees', 'finance', 'q4'],
    priority: 'high'
  },
  {
    id: 'thread-2',
    eventId: 'evt-q4-planning',
    eventTitle: 'Q4 Planning Session',
    type: 'decision',
    status: 'resolved',
    authorId: 'collab-2',
    authorName: 'Marcus Chen',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    content:
      'Decision: Move the Q4 Planning Session from the main boardroom to the satellite conference room B to accommodate remote attendees via the upgraded AV system.',
    replies: [
      {
        id: 'reply-2-1',
        threadId: 'thread-2',
        authorId: 'collab-1',
        authorName: 'Sarah Mitchell',
        content: 'Room B has been booked. Facilities confirmed the AV upgrade is complete.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ],
    resolved: true,
    resolvedBy: 'Marcus Chen',
    resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    tags: ['location', 'decision', 'av'],
    priority: 'normal'
  },
  {
    id: 'thread-3',
    eventId: 'evt-design-sprint',
    eventTitle: 'Design Sprint — Week 2',
    type: 'flag',
    status: 'open',
    authorId: 'collab-3',
    authorName: 'Priya Anand',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    content:
      '⚑ This event overlaps with the All-Hands town hall on Thursday. We risk low attendance if both run simultaneously — please review the scheduling conflict.',
    replies: [
      {
        id: 'reply-3-1',
        threadId: 'thread-3',
        authorId: 'collab-4',
        authorName: 'Tobias Renn',
        content: 'I can push the sprint to Friday afternoon. @Sarah can you check team availability?',
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
      }
    ],
    resolved: false,
    tags: ['conflict', 'scheduling', 'urgent'],
    priority: 'high'
  },
  {
    id: 'thread-4',
    eventId: 'evt-design-sprint',
    eventTitle: 'Design Sprint — Week 2',
    type: 'question',
    status: 'open',
    authorId: 'collab-4',
    authorName: 'Tobias Renn',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      'Who is the designated facilitator for each sprint day? The agenda doc lists "TBD" for Wednesday and Thursday. We need names confirmed so participants can reach out beforehand.',
    replies: [
      {
        id: 'reply-4-1',
        threadId: 'thread-4',
        authorId: 'collab-1',
        authorName: 'Sarah Mitchell',
        content: 'Wednesday will be me. Thursday is still open — Tobias, would you be able to cover?',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'reply-4-2',
        threadId: 'thread-4',
        authorId: 'collab-4',
        authorName: 'Tobias Renn',
        content: 'Yes, I\'ll take Thursday. Updating the doc now.',
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      }
    ],
    resolved: false,
    tags: ['facilitator', 'agenda'],
    priority: 'normal'
  },
  {
    id: 'thread-5',
    eventId: 'evt-client-review',
    eventTitle: 'Client Review: Horizon Launch',
    type: 'decision',
    status: 'open',
    authorId: 'collab-2',
    authorName: 'Marcus Chen',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    content:
      'Proposal: shorten the client review to 45 minutes and use the remaining 15 for internal debrief. Client confirmed they only need to see the final three milestones, not the full roadmap.',
    replies: [],
    resolved: false,
    tags: ['client', 'agenda', 'time'],
    priority: 'normal'
  },
  {
    id: 'thread-6',
    eventId: 'evt-client-review',
    eventTitle: 'Client Review: Horizon Launch',
    type: 'comment',
    status: 'archived',
    authorId: 'collab-3',
    authorName: 'Priya Anand',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      'Remember to enable the guest lobby in Zoom so external attendees don\'t join the pre-session internal prep. This happened last time.',
    replies: [
      {
        id: 'reply-6-1',
        threadId: 'thread-6',
        authorId: 'collab-2',
        authorName: 'Marcus Chen',
        content: 'Good catch — lobby enabled and waiting room text updated.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
      }
    ],
    resolved: false,
    tags: ['zoom', 'setup', 'external'],
    priority: 'low'
  },
  {
    id: 'thread-7',
    eventId: 'evt-team-offsite',
    eventTitle: 'Team Offsite — Q1 Kickoff',
    type: 'flag',
    status: 'open',
    authorId: 'collab-1',
    authorName: 'Sarah Mitchell',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      '⚑ Catering order deadline is 72 hours before the event. We\'re approaching that window — dietary requirements haven\'t been collected from all attendees yet.',
    replies: [
      {
        id: 'reply-7-1',
        threadId: 'thread-7',
        authorId: 'collab-4',
        authorName: 'Tobias Renn',
        content: 'Sent the dietary form to all confirmed attendees. Awaiting 4 responses.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'reply-7-2',
        threadId: 'thread-7',
        authorId: 'collab-3',
        authorName: 'Priya Anand',
        content: 'I\'ll follow up with the outstanding ones by EOD tomorrow.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    resolved: false,
    tags: ['offsite', 'catering', 'deadline'],
    priority: 'high'
  },
  {
    id: 'thread-8',
    eventId: 'evt-team-offsite',
    eventTitle: 'Team Offsite — Q1 Kickoff',
    type: 'question',
    status: 'resolved',
    authorId: 'collab-4',
    authorName: 'Tobias Renn',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      'Is the venue handling AV or should we bring our own equipment? The venue spec sheet is ambiguous about whether the projector is included in the base booking.',
    replies: [
      {
        id: 'reply-8-1',
        threadId: 'thread-8',
        authorId: 'collab-1',
        authorName: 'Sarah Mitchell',
        content: 'Confirmed with the venue: projector, screen, and microphones are included. No need to bring our own.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    resolved: true,
    resolvedBy: 'Sarah Mitchell',
    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['av', 'venue', 'logistics'],
    priority: 'low'
  }
]

const defaultChangeHistory: ChangeAttribution[] = [
  {
    id: 'chg-1',
    eventId: 'evt-q4-planning',
    eventTitle: 'Q4 Planning Session',
    field: 'time',
    oldValue: '2026-11-05T09:00:00Z',
    newValue: '2026-11-05T10:30:00Z',
    changedBy: 'Sarah Mitchell',
    changedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    sessionId: 'session-live-1',
    reverted: false
  },
  {
    id: 'chg-2',
    eventId: 'evt-q4-planning',
    eventTitle: 'Q4 Planning Session',
    field: 'location',
    oldValue: 'Main Boardroom',
    newValue: 'Conference Room B',
    changedBy: 'Marcus Chen',
    changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-live-1',
    reverted: false
  },
  {
    id: 'chg-3',
    eventId: 'evt-design-sprint',
    eventTitle: 'Design Sprint — Week 2',
    field: 'title',
    oldValue: 'Design Sprint — Week 1',
    newValue: 'Design Sprint — Week 2',
    changedBy: 'Priya Anand',
    changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-1',
    reverted: false
  },
  {
    id: 'chg-4',
    eventId: 'evt-design-sprint',
    eventTitle: 'Design Sprint — Week 2',
    field: 'attendees',
    oldValue: 'Sarah Mitchell, Marcus Chen',
    newValue: 'Sarah Mitchell, Marcus Chen, Tobias Renn, Priya Anand',
    changedBy: 'Tobias Renn',
    changedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-1',
    reverted: false
  },
  {
    id: 'chg-5',
    eventId: 'evt-client-review',
    eventTitle: 'Client Review: Horizon Launch',
    field: 'time',
    oldValue: '2026-11-08T14:00:00Z',
    newValue: '2026-11-08T15:00:00Z',
    changedBy: 'Marcus Chen',
    changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-1',
    reverted: false
  },
  {
    id: 'chg-6',
    eventId: 'evt-client-review',
    eventTitle: 'Client Review: Horizon Launch',
    field: 'description',
    oldValue: 'Review of launch milestones with client stakeholders.',
    newValue: 'Review of final three launch milestones. Internal debrief to follow.',
    changedBy: 'Marcus Chen',
    changedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    sessionId: 'session-live-1',
    reverted: false
  },
  {
    id: 'chg-7',
    eventId: 'evt-team-offsite',
    eventTitle: 'Team Offsite — Q1 Kickoff',
    field: 'location',
    oldValue: 'Lakeside Conference Centre, Room 3',
    newValue: 'Lakeside Conference Centre, Grand Hall',
    changedBy: 'Sarah Mitchell',
    changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-2',
    reverted: false
  },
  {
    id: 'chg-8',
    eventId: 'evt-team-offsite',
    eventTitle: 'Team Offsite — Q1 Kickoff',
    field: 'attendees',
    oldValue: 'Core team (8 people)',
    newValue: 'Core team + extended stakeholders (14 people)',
    changedBy: 'Priya Anand',
    changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-2',
    reverted: true
  },
  {
    id: 'chg-9',
    eventId: 'evt-q4-planning',
    eventTitle: 'Q4 Planning Session',
    field: 'attendees',
    oldValue: 'Sarah Mitchell, Marcus Chen, Priya Anand',
    newValue: 'Sarah Mitchell, Marcus Chen, Priya Anand, Tobias Renn, Diane Kim (Finance)',
    changedBy: 'Marcus Chen',
    changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-live-1',
    reverted: false
  },
  {
    id: 'chg-10',
    eventId: 'evt-design-sprint',
    eventTitle: 'Design Sprint — Week 2',
    field: 'time',
    oldValue: '2026-11-07T09:00:00Z',
    newValue: '2026-11-07T13:00:00Z',
    changedBy: 'Tobias Renn',
    changedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-1',
    reverted: false
  },
  {
    id: 'chg-11',
    eventId: 'evt-client-review',
    eventTitle: 'Client Review: Horizon Launch',
    field: 'title',
    oldValue: 'Client Review: Horizon',
    newValue: 'Client Review: Horizon Launch',
    changedBy: 'Sarah Mitchell',
    changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-1',
    reverted: false
  },
  {
    id: 'chg-12',
    eventId: 'evt-team-offsite',
    eventTitle: 'Team Offsite — Q1 Kickoff',
    field: 'time',
    oldValue: '2027-01-10T08:00:00Z',
    newValue: '2027-01-12T09:00:00Z',
    changedBy: 'Tobias Renn',
    changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: 'session-prev-2',
    reverted: false
  }
]

const defaultLiveSession: LiveSession = {
  id: 'session-live-1',
  startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  participants: ['collab-1', 'collab-2'],
  activeEventId: 'evt-q4-planning',
  cursorPositions: {
    'collab-1': { x: 420, y: 310, eventId: 'evt-q4-planning' },
    'collab-2': { x: 200, y: 150, eventId: 'evt-q4-planning' }
  }
}

export const useAnnotationStore = create<AnnotationStore>()(
  persist(
    (set) => ({
      collaborators: defaultCollaborators,
      threads: defaultThreads,
      changeHistory: defaultChangeHistory,
      liveSession: defaultLiveSession,
      selectedThreadId: null,
      filterEventId: null,

      addThread: (thread) =>
        set((state) => ({ threads: [thread, ...state.threads] })),

      addReply: (threadId, reply) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? { ...t, replies: [...t.replies, reply], updatedAt: new Date().toISOString() }
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
        }))
    }),
    {
      name: 'chronodesk-annotation-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
