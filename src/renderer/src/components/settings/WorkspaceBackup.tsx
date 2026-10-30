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
  Link,
  Plus
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
    if (!window.confirm('Delete this mirror and all its history?')) return
    setLoading(true)
    try {
      await window.api.icsMirror.delete(id)
      await loadMirrors()
      setSuccess('Mirror deleted')
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
    } catch (err) {
      console.error('Failed to toggle mirror:', err)
    }
  }

  const handleMirrorSync = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.icsMirror.sync(id)
      await loadMirrors()
      if (result.status === 'success') {
        setSuccess(`Sync complete: +${result.eventsAdded} ~${result.eventsUpdated} -${result.eventsDeleted}`)
      } else if (result.status === 'no_changes') {
        setSuccess('No changes since last sync')
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
      const results = await window.api.icsMirror.syncAll(3)
      await loadMirrors()
      const totalAdded = results.reduce((a, r) => a + r.eventsAdded, 0)
      const totalUpdated = results.reduce((a, r) => a + r.eventsUpdated, 0)
      const totalDeleted = results.reduce((a, r) => a + r.eventsDeleted, 0)
      setSuccess(`All mirrors synced: +${totalAdded} ~${totalUpdated} -${totalDeleted}`)
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
      const defaultPath = await window.api.workspaceBundle.getDefaultPath(exportName || 'backup')
      const result = await window.api.workspaceBundle.exportAndSave({
        name: exportName || 'ChronoDesk Backup',
        description: exportDescription,
        password: exportPassword,
        outputPath: defaultPath
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
      // Simulate progress since we can't track real progress from IPC
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
      case 'success': return <span className="px-2 py-0.5 text-xs bg-emerald-900/30 text-emerald-400 rounded">Success</span>
      case 'error': return <span className="px-2 py-0.5 text-xs bg-red-900/30 text-red-400 rounded">Error</span>
      case 'no_changes': return <span className="px-2 py-0.5 text-xs bg-slate-900/30 text-slate-400 rounded">No Changes</span>
      default: return <span className="px-2 py-0.5 text-xs bg-slate-900/30 text-slate-400 rounded">Pending</span>
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
    <div className="space-y-6" onMouseEnter={() => recordView('settings:backup', {})}>
      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        <button
          onClick={() => setActiveSection('mirrors')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeSection === 'mirrors'
              ? 'bg-slate-800/50 text-slate-100 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Link className="w-4 h-4 mr-2 inline-block" /> ICS Mirrors
        </button>
        <button
          onClick={() => setActiveSection('bundles')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeSection === 'bundles'
              ? 'bg-slate-800/50 text-slate-100 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-4 h-4 mr-2 inline-block" /> Workspace Bundles
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {success}
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* ICS Mirrors Section */}
      {activeSection === 'mirrors' && (
        <div className="space-y-6">
          {/* Scheduler Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                Scheduler Status
              </h3>
              <button
                onClick={async () => {
                  await window.api.scheduler.initialize()
                  await loadSchedulerStatus()
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-100 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reinitialize
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${schedulerStatus?.initialized ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {schedulerStatus?.initialized ? 'Running' : 'Stopped'}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">Scheduled Mirrors</div>
                <div className="text-2xl font-bold text-slate-100">{schedulerStatus?.scheduledCount || 0}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 md:col-span-2">
                <div className="text-xs text-slate-400 mb-1">Next Runs</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {schedulerStatus?.nextRuns?.slice(0, 3).map((run: any) => (
                    <div key={run.mirrorId} className="text-sm text-slate-300 flex justify-between">
                      <span className="truncate mr-2">{run.name}</span>
                      <span className="text-slate-500">{formatDate(new Date(run.nextRun).toISOString())}</span>
                    </div>
                  )) || (
                    <div className="text-slate-500 text-sm">No scheduled mirrors</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mirror List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-400" />
                ICS Feed Mirrors
              </h3>
              <button
                onClick={() => {
                  setEditingMirror(null)
                  setMirrorForm({ calendarId: '', url: '', name: '', scheduleCron: '0 */6 * * *', enabled: true })
                  setShowMirrorForm(true)
                }}
                className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-lg text-slate-100 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Mirror
              </button>
            </div>

            {showMirrorForm && (
              <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <h4 className="text-sm font-medium text-slate-100 mb-3">{editingMirror ? 'Edit Mirror' : 'Add Mirror'}</h4>
                <form onSubmit={handleMirrorSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Calendar ID *</label>
                      <input
                        type="text"
                        value={mirrorForm.calendarId}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, calendarId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="cal-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Feed URL *</label>
                      <input
                        type="url"
                        value={mirrorForm.url}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, url: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="https://example.com/calendar.ics or webcal://..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={mirrorForm.name}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Google Calendar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Schedule (cron)</label>
                      <select
                        value={mirrorForm.scheduleCron}
                        onChange={(e) => setMirrorForm({ ...mirrorForm, scheduleCron: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="0 */6 * * *">Every 6 hours</option>
                        <option value="0 */12 * * *">Every 12 hours</option>
                        <option value="0 2 * * *">Daily at 2:00 AM</option>
                        <option value="0 3 * * 0">Weekly on Sunday at 3:00 AM</option>
                        <option value="0 0 1 * *">Monthly on 1st at midnight</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="mirror-enabled"
                      checked={mirrorForm.enabled}
                      onChange={(e) => setMirrorForm({ ...mirrorForm, enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="mirror-enabled" className="text-sm text-slate-300">Enabled</label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowMirrorForm(false); setEditingMirror(null); }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-slate-100 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingMirror ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {mirrors.length === 0 && !showMirrorForm && (
              <div className="text-center py-12 text-slate-500">
                <Link className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <p className="text-sm">No ICS mirrors configured</p>
                <p className="text-xs mt-1">Add a mirror to automatically sync external calendars</p>
              </div>
            )}

            <div className="space-y-3">
              {mirrors.map((mirror) => (
                <div key={mirror.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-slate-100">{mirror.name || 'Unnamed Mirror'}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded ${mirror.enabled ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                          {mirror.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {mirror.lastSyncStatus && getStatusBadge(mirror.lastSyncStatus)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Link className="w-3.5 h-3.5" />
                          <span className="truncate">{mirror.url}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5" />
                          <span>Calendar: {mirror.calendarId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Schedule: {cronDescriptions[mirror.scheduleCron] || mirror.scheduleCron}</span>
                        </div>
                        <div className="flex items-center gap-1 md:col-span-3">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Last sync: {formatDate(mirror.lastSyncedAt)}</span>
                          {mirror.lastSyncError && (
                            <span className="ml-4 text-red-400">Error: {mirror.lastSyncError}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mirror.enabled}
                          onChange={(e) => handleMirrorToggle(mirror.id, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-300">Active</span>
                      </label>
                      <button
                        onClick={() => handleMirrorSync(mirror.id)}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-slate-100 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Sync
                      </button>
                      <button
                        onClick={() => handleMirrorEdit(mirror)}
                        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-100 flex items-center gap-1"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMirrorDelete(mirror.id)}
                        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-red-600 rounded-lg text-slate-100 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mirrors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <button
                  onClick={handleSyncAll}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm font-medium text-slate-100 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Sync All Mirrors
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
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-emerald-400" />
              Export Workspace Bundle
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Create an encrypted .chronodesk backup file containing all calendars, events, timetables, themes, and settings.
              Uses AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations).
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleExport(); }} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Backup Name</label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="My ChronoDesk Backup"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description (optional)</label>
                <textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Description of this backup..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Encryption Password *</label>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={exporting || !exportPassword || exportPassword.length < 8}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium text-slate-100 flex items-center justify-center gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Creating Backup...' : 'Create & Save Encrypted Backup'}
              </button>
            </form>
          </div>

          {/* Import Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-blue-400" />
              Import Workspace Bundle
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Restore a previously exported .chronodesk backup. Requires the same password used during export.
              <strong className="text-slate-300"> Warning:</strong> This will overwrite existing data if "Overwrite existing" is checked.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleImport(); }} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bundle File (.chronodesk) *</label>
                <input
                  type="file"
                  accept=".chronodesk"
                  onChange={(e) => setImportFile(e.target.files?.[0] as ElectronFile || null)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-slate-100 hover:file:bg-emerald-500"
                  required
                />
                {importFile && (
                  <p className="text-xs text-slate-400 mt-1">Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Decryption Password *</label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="import-overwrite"
                  checked={importOverwrite}
                  onChange={(e) => setImportOverwrite(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="import-overwrite" className="text-sm text-slate-300">Overwrite existing data (destructive)</label>
              </div>
              <button
                type="submit"
                disabled={importing || !importFile || !importPassword || importPassword.length < 8}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-slate-100 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import & Restore
                  </>
                )}
              </button>
              {importing && <p className="text-xs text-slate-400 text-center">Progress: {importProgress}%</p>}
            </form>
          </div>

          {/* Existing Bundles List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-slate-400" />
              Previous Backups
            </h3>

            {bundles.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <p className="text-sm">No backup records found</p>
                <p className="text-xs mt-1">Create your first backup using the export section above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-slate-100">{bundle.name || 'Unnamed Backup'}</h4>
                          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">v{bundle.version}</span>
                        </div>
                        {bundle.description && (
                          <p className="text-xs text-slate-400 mb-1">{bundle.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
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
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {bundle.tablesIncluded?.length || 0} tables
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBundleDelete(bundle.id)}
                        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-red-600 rounded-lg text-slate-100 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Record
                      </button>
                    </div>
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