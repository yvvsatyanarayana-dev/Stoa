import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  RotateCcw,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from 'lucide-react'
import { format } from 'date-fns'

interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string
  entity_title: string
  action: 'create' | 'update' | 'delete' | 'reschedule' | 'rollback'
  previous_payload?: string
  new_payload?: string
  user_actor: string
  timestamp: string
}

export const AuditLogViewer: React.FC = () => {
  const { fetchEvents, fetchInitialData } = useAppStore()

  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [rollingBackId, setRollingBackId] = useState<string | null>(null)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    try {
      if (window.api?.audit) {
        const data = await window.api.audit.list(250)
        setLogs(data)
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchAction = filterAction === 'all' || log.action === filterAction
      const matchQuery =
        !searchQuery.trim() ||
        log.entity_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_actor?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchAction && matchQuery
    })
  }, [logs, filterAction, searchQuery])

  const handleRollback = async (log: AuditEntry) => {
    if (!window.confirm(`Are you sure you want to rollback "${log.entity_title}" (${log.action})?`)) {
      return
    }

    setRollingBackId(log.id)
    try {
      await window.api.audit.rollback(log.id)
      await fetchEvents()
      await fetchInitialData()
      await loadLogs()
      setStatusMessage(`Successfully rolled back change: "${log.entity_title}"`)
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (err: any) {
      alert(`Rollback failed: ${err.message || String(err)}`)
    } finally {
      setRollingBackId(null)
    }
  }

  const handleClearAudit = async () => {
    if (!window.confirm('Clear all historical audit logs? This cannot be undone.')) return
    try {
      await window.api.audit.clear()
      await loadLogs()
    } catch {}
  }

  const handleExportCSV = () => {
    if (logs.length === 0) return
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Entity Title']
    const rows = logs.map((l) => [
      l.timestamp,
      `"${l.user_actor || 'User'}"`,
      l.action,
      l.entity_type,
      `"${l.entity_id}"`,
      `"${l.entity_title.replace(/"/g, '""')}"`
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Create</span>
      case 'update':
        return <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Update</span>
      case 'delete':
        return <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Delete</span>
      case 'rollback':
        return <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Reversion</span>
      default:
        return <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">{action}</span>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--accent)]" />
            <span>Immutable Audit Log & Instant Rollback</span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Cryptographic change audit records with state snapshotting and one-click rollback.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleClearAudit}
              className="btn-secondary text-xs py-1 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Clear all audit entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-[var(--radius-sm)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by title, entity, or actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <div className="flex bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-0.5 text-xs font-medium">
            {['all', 'create', 'update', 'delete', 'rollback'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded-[var(--radius-sm)] capitalize transition-all ${
                  filterAction === act
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card p-0 overflow-hidden shadow-xs border border-[var(--border-subtle)]">
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Loading audit history...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-1">
            <Clock className="w-6 h-6 mx-auto opacity-40 mb-2" />
            <div className="font-medium text-[var(--text-secondary)]">No audit logs found</div>
            <div className="text-[11px] opacity-75">
              Any changes made to appointments or resources will appear here automatically.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id
              const hasDiff = log.previous_payload || log.new_payload
              const canRollback = log.action !== 'rollback'

              return (
                <div key={log.id} className="p-3.5 hover:bg-[var(--bg-subtle)]/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0 mt-0.5">{getActionBadge(log.action)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {log.entity_title}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                            {log.entity_type}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                          {format(new Date(log.timestamp), 'PPpp')} • Actor: {log.user_actor}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasDiff && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2 py-1 text-[10px] font-mono rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Payload' : 'Inspect Diff'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}

                      {canRollback && (
                        <button
                          onClick={() => handleRollback(log)}
                          disabled={rollingBackId === log.id}
                          className="px-2.5 py-1 text-[10px] font-semibold rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Restore event or state before this change"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{rollingBackId === log.id ? 'Reverting...' : 'Rollback'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Diff Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          Previous State Payload
                        </div>
                        <pre className="p-2.5 rounded bg-black/40 border border-[var(--border-subtle)] text-[10px] overflow-x-auto max-h-40 text-neutral-400">
                          {log.previous_payload
                            ? JSON.stringify(JSON.parse(log.previous_payload), null, 2)
                            : '(None / Initial Creation)'}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          New Resulting State Payload
                        </div>
                        <pre className="p-2.5 rounded bg-black/40 border border-[var(--border-subtle)] text-[10px] overflow-x-auto max-h-40 text-emerald-400">
                          {log.new_payload
                            ? JSON.stringify(JSON.parse(log.new_payload), null, 2)
                            : '(None / Entity Deleted)'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
