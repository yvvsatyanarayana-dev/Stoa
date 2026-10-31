import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  MeetingTranscription,
  ActionItem,
  AgendaItem,
  TranscriptionStatus,
  TranscriptSegment
} from '../types/transcriber'

interface TranscriberStore {
  meetings: MeetingTranscription[]
  activeMeetingId: string | null
  recordingStatus: TranscriptionStatus
  liveTranscriptBuffer: TranscriptSegment[]

  selectMeeting: (id: string) => void
  addMeeting: (meeting: MeetingTranscription) => void
  addActionItem: (meetingId: string, item: ActionItem) => void
  updateActionItem: (id: string, partial: Partial<ActionItem>) => void
  updateAgendaItem: (meetingId: string, itemId: string, partial: Partial<AgendaItem>) => void
  startRecording: () => void
  stopRecording: () => void
  deleteMeeting: (id: string) => void
  clearAllMeetings: () => void
}

export const useTranscriberStore = create<TranscriberStore>()(
  persist(
    (set) => ({
      meetings: [],
      activeMeetingId: null,
      recordingStatus: 'idle',
      liveTranscriptBuffer: [],

      selectMeeting: (id) => set({ activeMeetingId: id }),

      addMeeting: (meeting) =>
        set((state) => ({
          meetings: [meeting, ...state.meetings],
          activeMeetingId: meeting.id
        })),

      addActionItem: (meetingId, item) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId
              ? { ...m, actionItems: [item, ...m.actionItems] }
              : m
          ),
        })),

      updateActionItem: (id, partial) =>
        set((state) => ({
          meetings: state.meetings.map((m) => ({
            ...m,
            actionItems: m.actionItems.map((ai) =>
              ai.id === id ? { ...ai, ...partial } : ai
            ),
          })),
        })),

      updateAgendaItem: (meetingId, itemId, partial) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  agenda: m.agenda.map((ag) =>
                    ag.id === itemId ? { ...ag, ...partial } : ag
                  ),
                }
              : m
          ),
        })),

      startRecording: () =>
        set({ recordingStatus: 'recording', liveTranscriptBuffer: [] }),

      stopRecording: () =>
        set({ recordingStatus: 'idle', liveTranscriptBuffer: [] }),

      deleteMeeting: (id) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
          activeMeetingId: state.activeMeetingId === id ? null : state.activeMeetingId,
        })),

      clearAllMeetings: () => set({ meetings: [], activeMeetingId: null })
    }),
    {
      name: 'chronodesk-transcriber-store-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
