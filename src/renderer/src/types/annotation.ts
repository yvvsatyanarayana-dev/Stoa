export type AnnotationType = 'comment' | 'decision' | 'flag' | 'question' | 'highlight';
export type AnnotationStatus = 'open' | 'resolved' | 'archived';
export type CursorColor = '#888888' | '#666666' | '#aaaaaa' | '#cccccc' | '#444444';

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
  cursorColor: CursorColor;
  isOnline: boolean;
  lastSeen: string;
  currentEventId: string | null;
}

export interface AnnotationThread {
  id: string;
  eventId: string;
  eventTitle: string;
  type: AnnotationType;
  status: AnnotationStatus;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  replies: AnnotationReply[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high';
}

export interface AnnotationReply {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  editedAt?: string;
}

export interface ChangeAttribution {
  id: string;
  eventId: string;
  eventTitle: string;
  field: string; // 'title' | 'time' | 'location' | 'attendees' | 'description'
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  sessionId: string;
  reverted: boolean;
}

export interface LiveSession {
  id: string;
  startedAt: string;
  participants: string[]; // collaborator ids
  activeEventId: string | null;
  cursorPositions: Record<string, { x: number; y: number; eventId: string | null }>;
}

export interface AnnotationState {
  collaborators: Collaborator[];
  threads: AnnotationThread[];
  changeHistory: ChangeAttribution[];
  liveSession: LiveSession | null;
  selectedThreadId: string | null;
  filterEventId: string | null;
}
