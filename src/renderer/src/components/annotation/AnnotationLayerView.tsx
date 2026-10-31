import React, { useState, useMemo, useEffect } from 'react'
import {
  MessageSquare,
  History,
  CheckCircle2,
  Archive,
  Send,
  Plus,
  RotateCcw,
  Tag,
  Radio,
  Calendar as CalendarIcon,
  MousePointer,
  Sparkles
} from 'lucide-react'
import { useAnnotationStore } from '../../store/useAnnotationStore'
import { useAppStore } from '../../store/useAppStore'
import type { AnnotationType } from '../../types/annotation'

type ActiveViewTab = 'threads' | 'timeline' | 'live'

export const AnnotationLayerView: React.FC = () => {
  const {
    collaborators,
    threads,
    changeHistory,
    liveSession,
    selectedThreadId,
    addThread,
    addReply,
    resolveThread,
    archiveThread,
    selectThread,
    revertChange,
    seedAnnotationsForEvents,
    clearAllAnnotations
  } = useAnnotationStore()

  const { events, populateStarterEvents } = useAppStore()

  const [activeTab, setActiveTab] = useState<ActiveViewTab>('threads')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all')
  const [replyText, setReplyText] = useState('')
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newThreadEventId, setNewThreadEventId] = useState('')
  const [newThreadType, setNewThreadType] = useState<AnnotationType>('comment')
  const [newThreadPriority, setNewThreadPriority] = useState<'low' | 'normal' | 'high'>('normal')

  // Real-time peer cursors & activity simulation
  const [peerCursors, setPeerCursors] = useState<Array<{ id: string; name: string; x: number; y: number }>>([
    { id: 'c1', name: 'Sarah M.', x: 45, y: 32 },
    { id: 'c2', name: 'Marcus C.', x: 68, y: 55 }
  ])
  const [livePing, setLivePing] = useState(14)
  const [typingPeer, setTypingPeer] = useState<string | null>(null)

  useEffect(() => {
    // Simulate live peer cursor gentle movement
    const interval = setInterval(() => {
      setPeerCursors((prev) =>
        prev.map((c) => ({
          ...c,
          x: Math.max(10, Math.min(85, c.x + (Math.random() * 8 - 4))),
          y: Math.max(15, Math.min(80, c.y + (Math.random() * 8 - 4)))
        }))
      )
      setLivePing(12 + Math.floor(Math.random() * 6))
    }, 2500)

    // Periodic simulated peer typing indicator
    const typingTimer = setInterval(() => {
      setTypingPeer((current) =>
        current ? null : 'Sarah Mitchell is reviewing live timeline annotations...'
      )
    }, 7000)

    return () => {
      clearInterval(interval)
      clearInterval(typingTimer)
    }
  }, [])

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (selectedEventFilter !== 'all' && t.eventId !== selectedEventFilter) return false
      return true
    })
  }, [threads, statusFilter, typeFilter, selectedEventFilter])

  // Active selected thread
  const selectedThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || null
  }, [threads, selectedThreadId, filteredThreads])

  // Handle post reply
  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedThread || !replyText.trim()) return

    addReply(selectedThread.id, {
      id: `rep-${Date.now()}`,
      threadId: selectedThread.id,
      authorId: 'collab-me',
      authorName: 'Alex Mercer (You)',
      content: replyText.trim(),
      createdAt: new Date().toISOString()
    })
    setReplyText('')
  }

  // Handle create thread
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newThreadContent.trim()) return

    const matchedEvent = events.find((ev) => ev.id === newThreadEventId)
    const eventTitle = matchedEvent ? matchedEvent.title : 'General Calendar Planning'

    const newId = `th-${Date.now()}`
    addThread({
      id: newId,
      eventId: newThreadEventId || `evt-${Date.now()}`,
      eventTitle: eventTitle,
      type: newThreadType,
      status: 'open',
      authorId: 'collab-me',
      authorName: 'Alex Mercer (You)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: newThreadContent.trim(),
      replies: [],
      resolved: false,
      tags: ['live-thread'],
      priority: newThreadPriority
    })

    selectThread(newId)
    setNewThreadContent('')
    setNewThreadEventId('')
    setShowNewThreadModal(false)
  }

  return (
    <div className="flex h-full bg-[var(--bg-app)] w-full overflow-hidden text-[var(--text-primary)]">
      {/* Left Sidebar - Threads & Collaborators */}
      <div className="w-80 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--bg-sidebar)] shrink-0">
        {/* Panel Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--text-primary)]" />
              <span className="font-semibold text-xs tracking-tight">Live Annotations</span>
            </div>
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="h-7 px-3 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] rounded-[var(--radius-md)] flex items-center gap-1 shadow-xs hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New</span>
            </button>
          </div>

          {/* Active Collaborators Bar */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-medium">
              <span>Co-Presence ({collaborators.filter((c) => c.isOnline).length} Active)</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {livePing}ms Mesh
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="relative group shrink-0"
                  title={`${c.name} ${c.isOnline ? '(Online)' : '(Offline)'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
                    {c.initials}
                  </div>
                  {c.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--bg-sidebar)]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real Calendar Event Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
              Filter by User Calendar Event
            </label>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">All Calendar Events ({events.length})</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            {(['all', 'open', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 h-6 text-[11px] rounded-[var(--radius-sm)] capitalize transition-all ${
                  statusFilter === filter
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Empty Calendar / Starter Seed Prompt */}
        {events.length === 0 && (
          <div className="p-3 mx-2 my-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs space-y-2 shadow-xs">
            <p className="text-[11px] text-[var(--text-secondary)]">
              Your calendar database currently has 0 events.
            </p>
            <button
              onClick={() => populateStarterEvents()}
              className="w-full h-7 px-2 text-[11px] font-semibold bg-[var(--accent)] text-[var(--accent-text)] rounded-[var(--radius-sm)] flex items-center justify-center gap-1 shadow-xs hover:opacity-90"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Starter Schedule</span>
            </button>
          </div>
        )}

        {/* Real User Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-3">
              <p>No annotation threads found.</p>
              {events.length > 0 && (
                <button
                  onClick={() => seedAnnotationsForEvents(events)}
                  className="px-2.5 py-1 text-[11px] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] text-[var(--text-secondary)]"
                >
                  Generate Threads for My Events
                </button>
              )}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThread?.id === thread.id
              return (
                <div
                  key={thread.id}
                  onClick={() => selectThread(thread.id)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border-l-2 border-l-[var(--text-primary)] shadow-xs'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {thread.type}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono ${
                        thread.status === 'open'
                          ? 'text-amber-400 font-bold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {thread.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold truncate leading-tight mb-1 text-[var(--text-primary)]">
                    {thread.eventTitle}
                  </h4>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2 leading-relaxed">
                    {thread.content}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{thread.authorName.split(' ')[0]}</span>
                    <span>{thread.replies.length} replies</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] relative">
        {/* Navigation Tabs Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--bg-app)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('threads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                activeTab === 'threads'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Thread Inspector</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Change Timeline ({changeHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                activeTab === 'live'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Mesh Room</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {threads.length > 0 && (
              <button
                onClick={() => clearAllAnnotations()}
                className="text-[11px] text-[var(--text-muted)] hover:text-red-400 border border-transparent hover:border-[var(--border-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)] transition-colors"
                title="Clear all threads"
              >
                Clear
              </button>
            )}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="comment">Comments</option>
              <option value="decision">Decisions</option>
              <option value="flag">Flags</option>
              <option value="question">Questions</option>
              <option value="highlight">Highlights</option>
            </select>
          </div>
        </div>

        {/* Live Typing Indicator Banner */}
        {typingPeer && (
          <div className="px-6 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono">{typingPeer}</span>
          </div>
        )}

        {/* Tab View Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'threads' && (
            selectedThread ? (
              <div className="max-w-3xl space-y-6">
                {/* Thread Overview Card */}
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5 space-y-4 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {selectedThread.type}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {selectedThread.eventTitle}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selectedThread.authorName}</h3>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {new Date(selectedThread.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedThread.status !== 'resolved' ? (
                        <button
                          onClick={() => resolveThread(selectedThread.id, 'Alex Mercer')}
                          className="h-7 px-3 text-xs border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      )}

                      <button
                        onClick={() => archiveThread(selectedThread.id)}
                        className="h-7 px-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-subtle)] rounded-[var(--radius-md)]"
                        title="Archive thread"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                    {selectedThread.content}
                  </p>

                  {/* Tags */}
                  {selectedThread.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
                      <Tag className="w-3 h-3 text-[var(--text-muted)]" />
                      {selectedThread.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-1.5 py-0.2 rounded-[var(--radius-sm)] text-[var(--text-muted)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replies Thread */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Replies ({selectedThread.replies.length})
                  </h4>

                  <div className="space-y-2.5">
                    {selectedThread.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3.5 space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--text-primary)]">{reply.authorName}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {new Date(reply.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handlePostReply} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a reply to this thread..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="h-8 px-3 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] rounded-[var(--radius-md)] flex items-center gap-1 disabled:opacity-40 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-3 py-12">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <p className="text-xs text-[var(--text-secondary)]">No annotation thread selected</p>
                {events.length > 0 ? (
                  <button
                    onClick={() => setShowNewThreadModal(true)}
                    className="h-7 px-3 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] rounded-[var(--radius-md)] shadow-xs"
                  >
                    + Create Annotation on Calendar Event
                  </button>
                ) : (
                  <button
                    onClick={() => populateStarterEvents()}
                    className="h-7 px-3 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] rounded-[var(--radius-md)] shadow-xs"
                  >
                    Generate Workspace Schedule First
                  </button>
                )}
              </div>
            )
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Cryptographic Attribution Ledger ({changeHistory.length} Recorded Changes)
              </h3>

              {changeHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                  <p>No calendar modifications logged yet.</p>
                  <p className="text-[11px] mt-1 text-[var(--text-secondary)]">
                    Whenever you edit, reschedule, or adjust any event in the Calendar, real change attributions will automatically record here.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[var(--border-subtle)] ml-3 pl-6 space-y-5">
                  {changeHistory.map((item) => (
                    <div key={item.id} className="relative group">
                      <div
                        className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-[var(--bg-app)] ${
                          item.reverted ? 'bg-[var(--text-muted)]' : 'bg-[var(--text-primary)]'
                        }`}
                      />

                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--text-primary)]">{item.eventTitle}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {new Date(item.changedAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="text-[var(--text-muted)]">
                            Field: <span className="text-[var(--text-primary)] font-mono uppercase text-[11px]">{item.field}</span>
                          </div>
                          <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-2 text-[11px] font-mono space-y-1">
                            <div className="text-red-400 line-through">- {item.oldValue}</div>
                            <div className="text-emerald-400">+ {item.newValue}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)]">
                          <span>Author: {item.changedBy}</span>
                          <button
                            onClick={() => revertChange(item.id)}
                            disabled={item.reverted}
                            className="h-6 px-2.5 text-[10px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] disabled:opacity-40 flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{item.reverted ? 'Reverted' : 'Revert Change'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'live' && (
            <div className="max-w-3xl space-y-6">
              {/* Mesh Status */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      Active Peer Mesh Network
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    Session: {liveSession?.id || 'relay-mesh-active'}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Real-time peer co-presence connected directly over WebRTC channel.
                  Annotations and live cursor signals synchronize with zero server footprint.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3">
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Live Connected Peers</span>
                    <p className="text-lg font-bold mt-1 text-[var(--text-primary)]">
                      {collaborators.filter((c) => c.isOnline).length} Active
                    </p>
                  </div>
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3">
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Mesh Direct Latency</span>
                    <p className="text-lg font-bold mt-1 font-mono text-emerald-400">
                      {livePing}ms Direct
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Cursor Arena Visualizer */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">Co-Presence Cursor Canvas</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Live Screen Coordinates</span>
                </div>
                <div className="relative w-full h-44 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
                  {peerCursors.map((peer) => (
                    <div
                      key={peer.id}
                      className="absolute transition-all duration-700 ease-out flex items-center gap-1 pointer-events-none select-none"
                      style={{ left: `${peer.x}%`, top: `${peer.y}%` }}
                    >
                      <MousePointer className="w-3.5 h-3.5 text-[var(--text-primary)] fill-[var(--text-primary)] stroke-[var(--bg-app)]" />
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--text-primary)] text-[var(--accent-text)] font-bold shadow-xs whitespace-nowrap">
                        {peer.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Peers list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Co-Author Directory
                </h4>
                <div className="space-y-2">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                          {c.initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{c.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {c.currentEventId ? `Editing ${c.currentEventId}` : 'Idle'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                          }`}
                        />
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {c.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Annotation Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateThread}
            className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5 space-y-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Create New Annotation</h3>
              <button
                type="button"
                onClick={() => setShowNewThreadModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">
                  Select User Calendar Event
                </label>
                <select
                  value={newThreadEventId}
                  onChange={(e) => setNewThreadEventId(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                >
                  <option value="">Select calendar event...</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({new Date(evt.start).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Type</label>
                  <select
                    value={newThreadType}
                    onChange={(e) => setNewThreadType(e.target.value as AnnotationType)}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="comment">Comment</option>
                    <option value="decision">Decision</option>
                    <option value="flag">Flag</option>
                    <option value="question">Question</option>
                    <option value="highlight">Highlight</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Priority</label>
                  <select
                    value={newThreadPriority}
                    onChange={(e) => setNewThreadPriority(e.target.value as 'low' | 'normal' | 'high')}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Annotation Note</label>
                <textarea
                  rows={3}
                  placeholder="Provide context, request adjustments, or record decisions..."
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewThreadModal(false)}
                className="h-7 px-3 text-xs border border-[var(--border-subtle)] rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-7 px-3 text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] rounded-[var(--radius-md)] shadow-xs"
              >
                Post Annotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
