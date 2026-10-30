import React, { useState, useEffect } from 'react'
import { useSyncStore } from '../../store/useSyncStore'
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Shield,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Link as LinkIcon,
  Plus,
  X
} from 'lucide-react'

export const WorkspaceBackup: React.FC = () => {
  const { recordView } = useSyncStore()
  const [activeSection, setActiveSection] = useState<'mirrors' | 'bundles'>('mirrors')
  const [mirrors, setMirrors] = useState<any[]>([])
  const [bundles, setBundles] = useState<any[]>([])
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Mirror form state
  const [showMirrorForm, setShowMirrorForm] = useState(false)
  const [editingMirror, setEditingMirror] = useState<any | null>(null)
  const [mirrorForm, setMirrorForm] = useState({
    calendarId: '',
    url: '',
    name: '',
    scheduleCron: '0 */6 * * *',
    enabled: true
  })

  // Bundle export form state
  const [exportPassword, setExportPassword] = useState('')
  const [exportName, setExportName] = useState('')
  const [exportDescription, setExportDescription] = useState('')
  const [exporting, setExporting] = useState(false)

  // Bundle import form state
  interface ElectronFile extends File {
    path: string
  }
  const [importFile, setImportFile] = useState<ElectronFile | null>(null)
  const [importPassword, setImportPassword] = useState('')
  const [importOverwrite, setImportOverwrite] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  useEffect(() => {
    recordView('settings:backup', { section: activeSection })
    loadMirrors()
    loadBundles()
    loadSchedulerStatus()
  }, [activeSection, recordView])

  const loadMirrors = async () => {
    try {
      const data = await window.api.icsMirror.list()
      setMirrors(data)
    } catch (err) {
      console.error('Failed to load mirrors:', err)
    }
  }

  const loadBundles = async () => {
    try {
      const data = await window.api.workspaceBundle.list()
      setBundles(data)
    } catch (err) {
      console.error('Failed to load bundles:', err)
    }
  }

  const loadSchedulerStatus = async () => {
    try {
      const data = await window.api.scheduler.getStatus()
      setSchedulerStatus(data)
    } catch (err) {
      console.error('Failed to load scheduler status:', err)
    }
  }

  const handleMirrorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingMirror) {
        await window.api.icsMirror.update({ ...editingMirror, ...mirrorForm })
      } else {
        await window.api.icsMirror.create(mirrorForm)
      }
      setShowMirrorForm(false)
      setEditingMirror(null)
      setMirrorForm({ calendarId: '', url: '', name: '', scheduleCron: '0 */6 * * *', enabled: true })
      await loadMirrors()
      setSuccess('Mirror saved successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to save mirror')
    } finally {
      setLoading(false)
    }
  }

  const handleMirrorEdit = (mirror: any) => {
    setEditingMirror(mirror)
    setMirrorForm({
      calendarId: mirror.calendarId,
      url: mirror.url,
      name: mirror.name || '',
      scheduleCron: mirror.scheduleCron || '0 */6 * * *',
      enabled: mirror.enabled
    })
    setShowMirrorForm(true)
  }

  const handleMirrorDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this mirror?')) return
    setLoading(true)
    try {
      await window.api.icsMirror.delete(id)
      await loadMirrors()
      setSuccess('Mirror deleted successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to delete mirror')
    } finally {
      setLoading(false)
    }
  }

  const handleMirrorToggle = async (id: string, enabled: boolean) => {
    try {
      await window.api.icsMirror.toggle(id, enabled)
      await loadMirrors()
    } catch (err: any) {
      setError(err.message || 'Failed to toggle mirror')
    }
  }

  const handleMirrorSync = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.icsMirror.sync(id)
      await loadMirrors()
      if (result.status === 'success' || result.status === 'no_changes') {
        setSuccess(`Mirror synced: +${result.eventsAdded} added, ~${result.eventsUpdated} updated`)
      } else {
        setError(result.error || 'Sync failed')
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await window.api.icsMirror.syncAll()
      await loadMirrors()
      const successfulCount = results.filter(r => r.status === 'success' || r.status === 'no_changes').length
      setSuccess(`All mirrors synced: ${successfulCount}/${results.length} completed`)
    } catch (err: any) {
      setError(err.message || 'Sync all failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!exportPassword || exportPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setExporting(true)
    setError(null)
    try {
      const result = await window.api.workspaceBundle.export({
        password: exportPassword,
        name: exportName || 'ChronoDesk Backup',
        description: exportDescription
      })
      setExportPassword('')
      setExportName('')
      setExportDescription('')
      await loadBundles()
      setSuccess(`Backup created: ${result.metadata.filePath}`)
    } catch (err: any) {
      setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a .chronodesk file')
      return
    }
    if (!importPassword || importPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setImporting(true)
    setImportProgress(0)
    setError(null)
    try {
      const progressInterval = setInterval(() => {
        setImportProgress(p => Math.min(p + 10, 90))
      }, 200)

      const result = await window.api.workspaceBundle.import(
        importFile.path,
        { password: importPassword, overwrite: importOverwrite }
      )

      clearInterval(progressInterval)
      setImportProgress(100)

      if (result.success) {
        setImportFile(null)
        setImportPassword('')
        setImportOverwrite(false)
        await loadBundles()
        setSuccess(`Import complete: ${result.executed} statements executed`)
      } else {
        setError(result.errors.join(', ') || 'Import failed')
      }
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      setImporting(false)
      setImportProgress(0)
    }
  }

  const handleBundleDelete = async (id: string) => {
    if (!window.confirm('Delete this bundle record? (File will not be deleted)')) return
    try {
      await window.api.workspaceBundle.delete(id)
      await loadBundles()
      setSuccess('Bundle record deleted')
    } catch (err) {
      console.error('Failed to delete bundle:', err)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleString()
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 rounded">Success</span>
      case 'error':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/20 rounded">Error</span>
      case 'no_changes':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded">No Changes</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded">Pending</span>
    }
  }

  const cronDescriptions: Record<string, string> = {
    '0 */6 * * *': 'Every 6 hours',
    '0 */12 * * *': 'Every 12 hours',
    '0 2 * * *': 'Daily at 2:00 AM',
    '0 3 * * 0': 'Weekly on Sunday at 3:00 AM',
    '0 0 1 * *': 'Monthly on 1st at midnight'
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]" onMouseEnter={() => recordView('settings:backup', {})}>
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveSection('mirrors')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-[var(--radius-md)] border-b-2 transition-all cursor-pointer ${
            activeSection === 'mirrors'
              ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--accent)] shadow-xs'
              : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>ICS Mirrors & Calendar Sync</span>
        </button>
        <button
          onClick={() => setActiveSection('bundles')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-[var(--radius-md)] border-b-2 transition-all cursor-pointer ${
            activeSection === 'bundles'
              ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--accent)] shadow-xs'
              : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Encrypted Workspace Backups</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ICS Mirrors Section */}
      {activeSection === 'mirrors' && (
        <div className="space-y-6">
          {/* Scheduler Status */}
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[var(--accent)]" />
                Background Polling Scheduler
              </h3>
              <button
                onClick={async () => {
                  await window.api.scheduler.initialize()
                  await loadSchedulerStatus()
                }}
                disabled={loading}
                className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center gap-1.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reinitialize
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
                <div className="text-xs font-medium text-[var(--text-secondary)]">Status</div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)] flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${schedulerStatus?.initialized ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {schedulerStatus?.initialized ? 'Running' : 'Stopped'}
                </div>
              </div>

              <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
                <div className="text-xs font-medium text-[var(--text-secondary)]">Scheduled Mirrors</div>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{schedulerStatus?.scheduledCount || 0}</div>
              </div>

              <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1 md:col-span-2">
                <div className="text-xs font-medium text-[var(--text-secondary)]">Next Scheduled Runs</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {schedulerStatus?.nextRuns?.slice(0, 3).map((run: any) => (
                    <div key={run.mirrorId} className="text-xs text-[var(--text-secondary)] flex justify-between">
                      <span className="truncate mr-2 text-[var(--text-primary)] font-medium">{run.name}</span>
                      <span className="text-[var(--text-muted)] font-mono">{formatDate(new Date(run.nextRun).toISOString())}</span>
                    </div>
                  )) || (
                    <div className="text-[var(--text-muted)] text-xs">No active mirror cron jobs</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mirror List */}
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[var(--accent)]" />
                Configured ICS Feed Mirrors
              </h3>
              <button
                onClick={() => {
                  setEditingMirror(null)
                  setMirrorForm({ calendarId: '', url: '', name: '', scheduleCron: '0 */6 * * *', enabled: true })
                  setShowMirrorForm(true)
                }}
                className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Mirror
              </button>
            </div>

            {showMirrorForm && (
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {editingMirror ? 'Edit Mirror' : 'Configure New ICS Feed Mirror'}
                </h4>
                <form onSubmit={handleMirrorSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Target Calendar ID *</label>
                      <input
                        type="text"
                        value={mirrorForm.calendarId}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, calendarId: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="e.g. cal-work, cal-personal"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">ICS Feed URL *</label>
                      <input
                        type="url"
                        value={mirrorForm.url}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, url: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="https://calendar.google.com/.../basic.ics"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mirror Name</label>
                      <input
                        type="text"
                        value={mirrorForm.name}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="e.g. Team Google Calendar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Polling Interval</label>
                      <select
                        value={mirrorForm.scheduleCron}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, scheduleCron: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      >
                        <option value="0 */6 * * *">Every 6 hours</option>
                        <option value="0 */12 * * *">Every 12 hours</option>
                        <option value="0 2 * * *">Daily at 2:00 AM</option>
                        <option value="0 3 * * 0">Weekly on Sunday at 3:00 AM</option>
                        <option value="0 0 1 * *">Monthly on 1st at midnight</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="mirror-enabled"
                      checked={mirrorForm.enabled}
                      onChange={(e) => setMirrorForm({ ...mirrorForm, enabled: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-elevated)] accent-[var(--accent)] cursor-pointer"
                    />
                    <label htmlFor="mirror-enabled" className="text-xs text-[var(--text-secondary)] cursor-pointer">
                      Auto-sync enabled
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => { setShowMirrorForm(false); setEditingMirror(null); }}
                      className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] hover:opacity-90 transition-all"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingMirror ? 'Update Mirror' : 'Save Mirror'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {mirrors.length === 0 && !showMirrorForm && (
              <div className="text-center py-10 text-[var(--text-muted)] space-y-2">
                <LinkIcon className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium text-[var(--text-secondary)]">No ICS mirrors configured</p>
                <p className="text-[11px] text-[var(--text-muted)]">Add an ICS or webcal link to automatically sync external calendars</p>
              </div>
            )}

            <div className="space-y-3">
              {mirrors.map((mirror) => (
                <div
                  key={mirror.id}
                  className="p-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[var(--border-default)] transition-colors"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-semibold text-xs text-[var(--text-primary)]">{mirror.name || 'Unnamed Mirror'}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                        mirror.enabled ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                      }`}>
                        {mirror.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {mirror.lastSyncStatus && getStatusBadge(mirror.lastSyncStatus)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1 font-mono truncate">
                        <LinkIcon className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="truncate">{mirror.url}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>Calendar: {mirror.calendarId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{cronDescriptions[mirror.scheduleCron] || mirror.scheduleCron}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1.5 cursor-pointer mr-1">
                      <input
                        type="checkbox"
                        checked={mirror.enabled}
                        onChange={(e) => handleMirrorToggle(mirror.id, e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-elevated)] accent-[var(--accent)] cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">Active</span>
                    </label>
                    <button
                      onClick={() => handleMirrorSync(mirror.id)}
                      disabled={loading}
                      className="py-1.5 px-2.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /> Sync
                    </button>
                    <button
                      onClick={() => handleMirrorEdit(mirror)}
                      className="p-1.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors cursor-pointer"
                      title="Edit Configuration"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMirrorDelete(mirror.id)}
                      className="p-1.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-red-500 border border-[var(--border-subtle)] hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Delete Mirror"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {mirrors.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <button
                  onClick={handleSyncAll}
                  disabled={loading}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync All Configured Mirrors Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workspace Bundles Section */}
      {activeSection === 'bundles' && (
        <div className="space-y-6">
          {/* Export Section */}
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Download className="w-4 h-4 text-[var(--accent)]" />
                Export Encrypted Workspace Bundle
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Creates an AES-256-GCM encrypted <code className="font-mono text-[var(--text-primary)]">.chronodesk</code> backup containing calendars, events, timetables, and settings.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleExport(); }} className="space-y-3 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Backup Name</label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="e.g. Master Schedule Q4 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description (optional)</label>
                <textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="Notes about this archive..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Encryption Password (min 8 characters) *</label>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={exporting || !exportPassword || exportPassword.length < 8}
                className="py-2 px-4 bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] text-xs font-semibold rounded-[var(--radius-md)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {exporting ? 'Encrypting & Archiving...' : 'Create Encrypted Backup File'}
              </button>
            </form>
          </div>

          {/* Import Section */}
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--accent)]" />
                Restore from Workspace Bundle
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Restore data from a previously created <code className="font-mono text-[var(--text-primary)]">.chronodesk</code> file. Requires the original password.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleImport(); }} className="space-y-3 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Select .chronodesk File *</label>
                <input
                  type="file"
                  accept=".chronodesk"
                  onChange={(e) => setImportFile(e.target.files?.[0] as ElectronFile || null)}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-[var(--accent)] file:text-[var(--accent-text)] file:text-xs file:font-semibold cursor-pointer"
                  required
                />
                {importFile && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Decryption Password *</label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="import-overwrite"
                  checked={importOverwrite}
                  onChange={(e) => setImportOverwrite(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] accent-[var(--accent)] cursor-pointer"
                />
                <label htmlFor="import-overwrite" className="text-xs text-[var(--text-secondary)] cursor-pointer">
                  Overwrite existing records with matching IDs
                </label>
              </div>
              <button
                type="submit"
                disabled={importing || !importFile || !importPassword || importPassword.length < 8}
                className="py-2 px-4 bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] text-xs font-semibold rounded-[var(--radius-md)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring Workspace ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Decrypt & Restore Workspace</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing Bundles List */}
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
              <FileText className="w-4 h-4 text-[var(--text-muted)]" />
              Logged Backup Records
            </h3>

            {bundles.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] space-y-1">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium text-[var(--text-secondary)]">No backup records logged</p>
                <p className="text-[11px] text-[var(--text-muted)]">Use the export section above to generate your first backup</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="p-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-semibold text-xs text-[var(--text-primary)]">{bundle.name || 'Unnamed Backup'}</h4>
                        <span className="px-1.5 py-0.2 text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded">
                          v{bundle.version}
                        </span>
                      </div>
                      {bundle.description && (
                        <p className="text-xs text-[var(--text-secondary)]">{bundle.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          AES-256-GCM
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {bundle.fileSize ? `${(bundle.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(bundle.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBundleDelete(bundle.id)}
                      className="py-1.5 px-2.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-red-500 border border-[var(--border-subtle)] hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Record
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
