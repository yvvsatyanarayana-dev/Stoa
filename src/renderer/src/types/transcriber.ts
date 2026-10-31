export type TranscriptionStatus = 'idle' | 'recording' | 'processing' | 'complete' | 'error';
export type SpeakerRole = 'host' | 'participant' | 'guest';
export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemStatus = 'pending' | 'in-progress' | 'done';

export interface Speaker {
  id: string;
  name: string;
  role: SpeakerRole;
  color: string; // hex for avatar — use grays only: #666, #888, #aaa, #ccc
  wordCount: number;
  talkTimeSeconds: number;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
  confidence: number; // 0–1
  isKeyMoment: boolean;
  tags: string[]; // 'decision' | 'action' | 'question' | 'blocker'
}

export interface ActionItem {
  id: string;
  meetingId: string;
  text: string;
  assignee: string;
  dueDate: string; // YYYY-MM-DD
  priority: ActionItemPriority;
  status: ActionItemStatus;
  extractedAt: string;
  confidence: number; // 0–1
}

export interface AgendaItem {
  id: string;
  title: string;
  durationMinutes: number;
  order: number;
  status: 'pending' | 'active' | 'complete' | 'skipped';
  notes: string;
}

export interface MeetingTranscription {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  status: TranscriptionStatus;
  speakers: Speaker[];
  segments: TranscriptSegment[];
  actionItems: ActionItem[];
  agenda: AgendaItem[];
  summary: string;
  keyDecisions: string[];
  sentiment: 'positive' | 'neutral' | 'mixed' | 'tense';
  wordCount: number;
  aiModel: string;
}

export interface TranscriberState {
  meetings: MeetingTranscription[];
  activeMeetingId: string | null;
  recordingStatus: TranscriptionStatus;
  liveTranscriptBuffer: TranscriptSegment[];
}
