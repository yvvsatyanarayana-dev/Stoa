import React, { useState, useMemo } from 'react'
import {
  Mic,
  MicOff,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Sparkles,
  Filter,
  Trash2,
  ListChecks,
  FileText
} from 'lucide-react'
import { useTranscriberStore } from '../../store/useTranscriberStore'
import type { ActionItem, ActionItemPriority, ActionItemStatus } from '../../types/transcriber'

type ActiveTab = 'summary' | 'transcript' | 'actions' | 'agenda'

export const TranscriberView: React.FC = () => {
  const {
    meetings,
    activeMeetingId,
    recordingStatus,
    selectMeeting,
    addActionItem,
    updateActionItem,
    updateAgendaItem,
    startRecording,
    stopRecording,
    deleteMeeting
  } = useTranscriberStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary')
  const [transcriptFilter, setTranscriptFilter] = useState<'all' | 'key' | string>('all')
  const [showAddActionModal, setShowAddActionModal] = useState(false)
  const [newActionText, setNewActionText] = useState('')
  const [newActionAssignee, setNewActionAssignee] = useState('')
  const [newActionPriority, setNewActionPriority] = useState<ActionItemPriority>('medium')
  const [newActionDueDate, setNewActionDueDate] = useState('')

  // Filter meetings by search query
  const filteredMeetings = useMemo(() => {
    return meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.summary.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [meetings, searchQuery])

  // Active meeting
  const activeMeeting = useMemo(() => {
    return meetings.find((m) => m.id === activeMeetingId) || meetings[0] || null
  }, [meetings, activeMeetingId])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle new action item submission
  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeMeeting || !newActionText.trim()) return

    const newItem: ActionItem = {
      id: `ai-${Date.now()}`,
      meetingId: activeMeeting.id,
      text: newActionText.trim(),
      assignee: newActionAssignee.trim() || 'Unassigned',
      dueDate: newActionDueDate || new Date().toISOString().split('T')[0],
      priority: newActionPriority,
      status: 'pending',
      extractedAt: new Date().toISOString(),
      confidence: 1.0
    }

    addActionItem(activeMeeting.id, newItem)
    setNewActionText('')
    setNewActionAssignee('')
    setShowAddActionModal(false)
  }

  // Filter segments
  const displayedSegments = useMemo(() => {
    if (!activeMeeting) return []
    if (transcriptFilter === 'key') {
      return activeMeeting.segments.filter((s) => s.isKeyMoment)
    }
    if (transcriptFilter !== 'all') {
      return activeMeeting.segments.filter((s) => s.speakerId === transcriptFilter)
    }
    return activeMeeting.segments
  }, [activeMeeting, transcriptFilter])

  return (
    <div className="flex h-full bg-[var(--bg-app)] w-full overflow-hidden text-[var(--text-primary)]">
      {/* Left Sidebar - Meetings List */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-surface)] shrink-0">
        {/* Panel Header */}
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[var(--text-primary)]" />
              <span className="font-semibold text-sm">Meeting Transcriber</span>
            </div>
            <button
              onClick={() => {
                if (recordingStatus === 'recording') {
                  stopRecording()
                } else {
                  startRecording()
                }
              }}
              className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                recordingStatus === 'recording'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'
                  : 'bg-[var(--bg-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)]'
              }`}
            >
              {recordingStatus === 'recording' ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record</span>
                </>
              )}
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search transcriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Meeting List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {filteredMeetings.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No meetings found
            </div>
          ) : (
            filteredMeetings.map((mtg) => {
              const isSelected = activeMeeting?.id === mtg.id
              return (
                <div
                  key={mtg.id}
                  onClick={() => selectMeeting(mtg.id)}
                  className={`p-3.5 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border-l-2 border-l-[var(--text-primary)]'
                      : 'hover:bg-[var(--bg-elevated)]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-semibold truncate leading-tight">{mtg.title}</h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        mtg.status === 'complete'
                          ? 'border border-[var(--border)] text-[var(--text-muted)]'
                          : mtg.status === 'recording'
                          ? 'text-red-400 border border-red-500/30'
                          : 'border border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {mtg.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {mtg.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(mtg.duration / 60)}m
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {mtg.speakers.length}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] bg-[var(--bg-app)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                      {mtg.actionItems.length} actions
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {mtg.aiModel}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Panel */}
      {activeMeeting ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)] shrink-0 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight">{activeMeeting.title}</h2>
                  <span className="text-xs border border-[var(--border)] text-[var(--text-muted)] px-2 py-0.5 rounded capitalize">
                    {activeMeeting.sentiment} sentiment
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-1.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeMeeting.date} ({activeMeeting.startTime} - {activeMeeting.endTime})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.round(activeMeeting.duration / 60)} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {activeMeeting.aiModel}
                  </span>
                </div>
              </div>

              <button
                onClick={() => deleteMeeting(activeMeeting.id)}
                className="h-7 px-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 flex items-center gap-1 transition-colors"
                title="Delete recording"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Summary & Insights</span>
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                  activeTab === 'transcript'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Full Transcript ({activeMeeting.segments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                  activeTab === 'actions'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Action Items ({activeMeeting.actionItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('agenda')}
                className={`h-7 px-3 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                  activeTab === 'agenda'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-app)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Agenda ({activeMeeting.agenda.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Total Word Count</span>
                    <p className="text-xl font-bold mt-1 font-mono">
                      {activeMeeting.wordCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Active Speakers</span>
                    <p className="text-xl font-bold mt-1 font-mono">
                      {activeMeeting.speakers.length}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Extracted Actions</span>
                    <p className="text-xl font-bold mt-1 font-mono">
                      {activeMeeting.actionItems.length}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Key Decisions</span>
                    <p className="text-xl font-bold mt-1 font-mono">
                      {activeMeeting.keyDecisions.length}
                    </p>
                  </div>
                </div>

                {/* AI Summary Box */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--text-primary)]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider">
                      Executive Summary
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {activeMeeting.summary}
                  </p>
                </div>

                {/* Key Decisions */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Key Decisions</h3>
                  <div className="space-y-2">
                    {activeMeeting.keyDecisions.map((decision, index) => (
                      <div key={index} className="flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0 mt-0.5" />
                        <span className="leading-normal">{decision}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Speaker Distribution */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Speaker Talk-Time Distribution
                  </h3>
                  <div className="space-y-2.5">
                    {activeMeeting.speakers.map((spk) => {
                      const percentage = Math.round(
                        (spk.talkTimeSeconds / (activeMeeting.duration || 1)) * 100
                      )
                      return (
                        <div key={spk.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{spk.name} ({spk.role})</span>
                            <span className="text-[var(--text-muted)] font-mono">
                              {Math.round(spk.talkTimeSeconds / 60)}m ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--text-primary)] rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-4">
                {/* Transcript Filters */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">Filter:</span>
                    <button
                      onClick={() => setTranscriptFilter('all')}
                      className={`h-6 px-2.5 text-xs rounded transition-colors ${
                        transcriptFilter === 'all'
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] font-medium'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All Segments
                    </button>
                    <button
                      onClick={() => setTranscriptFilter('key')}
                      className={`h-6 px-2.5 text-xs rounded transition-colors ${
                        transcriptFilter === 'key'
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] font-medium'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Key Moments Only
                    </button>
                  </div>

                  <select
                    value={transcriptFilter}
                    onChange={(e) => setTranscriptFilter(e.target.value)}
                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="all">All Speakers</option>
                    {activeMeeting.speakers.map((spk) => (
                      <option key={spk.id} value={spk.id}>
                        {spk.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Segments Stream */}
                <div className="space-y-3">
                  {displayedSegments.map((segment) => {
                    const speaker = activeMeeting.speakers.find((s) => s.id === segment.speakerId)
                    return (
                      <div
                        key={segment.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          segment.isKeyMoment
                            ? 'bg-[var(--bg-surface)] border-l-4 border-l-[var(--text-primary)] border-[var(--border)]'
                            : 'bg-[var(--bg-surface)]/60 border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold">
                              {speaker?.name.charAt(0) || 'U'}
                            </div>
                            <span className="text-xs font-semibold">{speaker?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {formatTime(segment.startSeconds)} - {formatTime(segment.endSeconds)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {segment.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 bg-[var(--bg-app)] border border-[var(--border)] rounded text-[var(--text-muted)]"
                              >
                                {tag}
                              </span>
                            ))}
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              {Math.round(segment.confidence * 100)}%
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-7">
                          {segment.text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Extracted Action Items
                  </h3>
                  <button
                    onClick={() => setShowAddActionModal(true)}
                    className="h-7 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-app)] rounded flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Action Items List */}
                <div className="space-y-2">
                  {activeMeeting.actionItems.map((item) => {
                    const isDone = item.status === 'done'
                    const isInProgress = item.status === 'in-progress'
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border border-[var(--border)] flex items-center justify-between gap-4 transition-all ${
                          isDone
                            ? 'bg-[var(--bg-surface)]/40 opacity-60'
                            : 'bg-[var(--bg-surface)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => {
                              const nextStatus: ActionItemStatus =
                                item.status === 'pending'
                                  ? 'in-progress'
                                  : item.status === 'in-progress'
                                  ? 'done'
                                  : 'pending'
                              updateActionItem(item.id, { status: nextStatus })
                            }}
                            className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                isDone
                                  ? 'text-[var(--text-primary)] fill-[var(--text-primary)]'
                                  : isInProgress
                                  ? 'text-amber-400'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs truncate ${
                              isDone ? 'line-through text-[var(--text-muted)]' : 'font-medium'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <span className="text-[var(--text-muted)] flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.assignee}
                          </span>
                          <span className="text-[var(--text-muted)] flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3 h-3" />
                            {item.dueDate}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                              item.priority === 'high'
                                ? 'text-red-400 border border-red-500/30'
                                : item.priority === 'medium'
                                ? 'border border-[var(--border)] text-[var(--text-muted)]'
                                : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Simple Add Modal */}
                {showAddActionModal && (
                  <form
                    onSubmit={handleCreateAction}
                    className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-3"
                  >
                    <h4 className="text-xs font-semibold">New Action Item</h4>
                    <input
                      type="text"
                      placeholder="Task description..."
                      value={newActionText}
                      onChange={(e) => setNewActionText(e.target.value)}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Assignee"
                        value={newActionAssignee}
                        onChange={(e) => setNewActionAssignee(e.target.value)}
                        className="bg-[var(--bg-app)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                      <input
                        type="date"
                        value={newActionDueDate}
                        onChange={(e) => setNewActionDueDate(e.target.value)}
                        className="bg-[var(--bg-app)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                      <select
                        value={newActionPriority}
                        onChange={(e) => setNewActionPriority(e.target.value as ActionItemPriority)}
                        className="bg-[var(--bg-app)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddActionModal(false)}
                        className="h-7 px-3 text-xs border border-[var(--border)] rounded hover:bg-[var(--bg-elevated)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="h-7 px-3 text-xs bg-[var(--text-primary)] text-[var(--bg-app)] rounded"
                      >
                        Save Action
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Agenda Progression
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {activeMeeting.agenda.filter((a) => a.status === 'complete').length} of{' '}
                    {activeMeeting.agenda.length} completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeMeeting.agenda.map((ag) => (
                    <div
                      key={ag.id}
                      className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] font-mono text-[11px] flex items-center justify-center shrink-0">
                          {ag.order}
                        </span>
                        <div>
                          <h4 className="text-xs font-medium">{ag.title}</h4>
                          {ag.notes && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-1">{ag.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          {ag.durationMinutes}m
                        </span>
                        <button
                          onClick={() => {
                            const next =
                              ag.status === 'pending'
                                ? 'active'
                                : ag.status === 'active'
                                ? 'complete'
                                : 'pending'
                            updateAgendaItem(activeMeeting.id, ag.id, { status: next })
                          }}
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border transition-colors ${
                            ag.status === 'complete'
                              ? 'border border-[var(--border)] text-[var(--text-muted)]'
                              : ag.status === 'active'
                              ? 'border border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                              : 'border border-[var(--border)] text-[var(--text-muted)]'
                          }`}
                        >
                          {ag.status}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
          <Mic className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">Select or record a meeting transcription</p>
        </div>
      )}
    </div>
  )
}
