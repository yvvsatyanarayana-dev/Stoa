import React, { useState, useMemo } from 'react'
import {
  MessageSquare,
  History,
  CheckCircle2,
  Archive,
  Send,
  Plus,
  RotateCcw,
  Tag,
  Radio
} from 'lucide-react'
import { useAnnotationStore } from '../../store/useAnnotationStore'
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
    revertChange
  } = useAnnotationStore()

  const [activeTab, setActiveTab] = useState<ActiveViewTab>('threads')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [replyText, setReplyText] = useState('')
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newThreadEventTitle, setNewThreadEventTitle] = useState('')
  const [newThreadType, setNewThreadType] = useState<AnnotationType>('comment')
  const [newThreadPriority, setNewThreadPriority] = useState<'low' | 'normal' | 'high'>('normal')

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      return true
    })
  }, [threads, statusFilter, typeFilter])

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
    if (!newThreadContent.trim() || !newThreadEventTitle.trim()) return

    const newId = `th-${Date.now()}`
    addThread({
      id: newId,
      eventId: `evt-${Date.now()}`,
      eventTitle: newThreadEventTitle.trim(),
      type: newThreadType,
      status: 'open',
      authorId: 'collab-me',
      authorName: 'Alex Mercer (You)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: newThreadContent.trim(),
      replies: [],
      resolved: false,
      tags: ['manual-note'],
      priority: newThreadPriority
    })

    selectThread(newId)
    setNewThreadContent('')
    setNewThreadEventTitle('')
    setShowNewThreadModal(false)
  }

  return (
    <div className="flex h-full bg-[var(--bg-app)] w-full overflow-hidden text-[var(--text-primary)]">
      {/* Left Sidebar - Threads & Collaborators */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-surface)] shrink-0">
        {/* Panel Header */}
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--text-primary)]" />
              <span className="font-semibold text-sm">Annotation Layer</span>
            </div>
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="h-7 px-2.5 text-xs bg-[var(--text-primary)] text-[var(--bg-app)] rounded flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Active Collaborators Bar */}
          <div className="bg-[var(--bg-app)] border border-[var(--border)] rounded-md p-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Co-Presence ({collaborators.filter((c) => c.isOnline).length} Active)</span>
              <span className="flex items-center gap-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Mesh
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="relative group shrink-0"
                  title={`${c.name} ${c.isOnline ? '(Online)' : '(Offline)'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold">
                    {c.initials}
                  </div>
                  {c.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--bg-surface)]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            {(['all', 'open', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 h-6 text-[11px] rounded capitalize transition-colors ${
                  statusFilter === filter
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No annotations found
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThread?.id === thread.id
              return (
                <div
                  key={thread.id}
                  onClick={() => selectThread(thread.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border-l-2 border-l-[var(--text-primary)]'
                      : 'hover:bg-[var(--bg-elevated)]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--text-muted)]">
                      {thread.type}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono ${
                        thread.status === 'open'
                          ? 'text-amber-400'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {thread.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold truncate leading-tight mb-1">
                    {thread.eventTitle}
                  </h4>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2 leading-relaxed">
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
        {/* Navigation Tabs Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('threads')}
              className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                activeTab === 'threads'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Thread Inspector</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Change Attribution Timeline ({changeHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                activeTab === 'live'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Mesh Room</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">All Annotation Types</option>
              <option value="comment">Comments</option>
              <option value="decision">Decisions</option>
              <option value="flag">Flags</option>
              <option value="question">Questions</option>
              <option value="highlight">Highlights</option>
            </select>
          </div>
        </div>

        {/* Tab View Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'threads' && (
            selectedThread ? (
              <div className="max-w-3xl space-y-6">
                {/* Thread Overview Card */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                          {selectedThread.type}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          Event: {selectedThread.eventTitle}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold">{selectedThread.authorName}</h3>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {new Date(selectedThread.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedThread.status !== 'resolved' ? (
                        <button
                          onClick={() => resolveThread(selectedThread.id, 'Alex Mercer')}
                          className="h-7 px-3 text-xs border border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded flex items-center gap-1.5 transition-colors"
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
                        className="h-7 px-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border)] rounded"
                        title="Archive thread"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                    {selectedThread.content}
                  </p>

                  {/* Tags */}
                  {selectedThread.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]">
                      <Tag className="w-3 h-3 text-[var(--text-muted)]" />
                      {selectedThread.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[var(--bg-app)] border border-[var(--border)] px-1.5 py-0.2 rounded text-[var(--text-muted)]"
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
                        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">{reply.authorName}</span>
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
                      className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="h-8 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-app)] rounded flex items-center gap-1 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Select or create an annotation thread</p>
              </div>
            )
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Cryptographic Attribution Ledger
              </h3>

              <div className="relative border-l-2 border-[var(--border)] ml-3 pl-6 space-y-6">
                {changeHistory.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-[var(--bg-app)] ${
                        item.reverted ? 'bg-[var(--text-muted)]' : 'bg-[var(--text-primary)]'
                      }`}
                    />

                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{item.eventTitle}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {new Date(item.changedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="text-[var(--text-muted)]">
                          Changed field: <span className="text-[var(--text-primary)] font-mono uppercase text-[11px]">{item.field}</span>
                        </div>
                        <div className="bg-[var(--bg-app)] border border-[var(--border)] rounded p-2 text-[11px] font-mono space-y-1">
                          <div className="text-red-400/80 line-through">- {item.oldValue}</div>
                          <div className="text-emerald-400">+ {item.newValue}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)]">
                        <span>Modified by: {item.changedBy}</span>
                        <button
                          onClick={() => revertChange(item.id)}
                          disabled={item.reverted}
                          className="h-6 px-2 text-[10px] rounded border border-[var(--border)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{item.reverted ? 'Reverted' : 'Revert Change'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-semibold">Active Peer-to-Peer Mesh Session</h3>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    Session ID: {liveSession?.id || 'live-mesh-001'}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Real-time co-authoring channel powered by peer WebRTC mesh with zero central server storage.
                  Cursors and annotations synchronize with cryptographic verification.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[var(--bg-app)] border border-[var(--border)] rounded p-3">
                    <span className="text-[11px] text-[var(--text-muted)]">Live Participants</span>
                    <p className="text-lg font-bold mt-1">
                      {collaborators.filter((c) => c.isOnline).length} Active
                    </p>
                  </div>
                  <div className="bg-[var(--bg-app)] border border-[var(--border)] rounded p-3">
                    <span className="text-[11px] text-[var(--text-muted)]">Mesh Latency</span>
                    <p className="text-lg font-bold mt-1 font-mono">14ms (Direct)</p>
                  </div>
                </div>
              </div>

              {/* Connected Peers list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Connected Co-Authors
                </h4>
                <div className="space-y-2">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-xs font-bold">
                          {c.initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{c.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {c.currentEventId ? `Focusing on ${c.currentEventId}` : 'Idle'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                          }`}
                        />
                        <span className="text-[11px] text-[var(--text-muted)]">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateThread}
            className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Create New Annotation</h3>
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
                <label className="text-xs text-[var(--text-muted)] block mb-1">Target Event</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Executive Strategy Summit"
                  value={newThreadEventTitle}
                  onChange={(e) => setNewThreadEventTitle(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Type</label>
                  <select
                    value={newThreadType}
                    onChange={(e) => setNewThreadType(e.target.value as AnnotationType)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="comment">Comment</option>
                    <option value="decision">Decision</option>
                    <option value="flag">Flag</option>
                    <option value="question">Question</option>
                    <option value="highlight">Highlight</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Priority</label>
                  <select
                    value={newThreadPriority}
                    onChange={(e) => setNewThreadPriority(e.target.value as 'low' | 'normal' | 'high')}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Annotation Note</label>
                <textarea
                  rows={3}
                  placeholder="Provide context, request changes, or note a decision..."
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded p-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewThreadModal(false)}
                className="h-7 px-3 text-xs border border-[var(--border)] rounded hover:bg-[var(--bg-elevated)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-7 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-app)] rounded"
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
