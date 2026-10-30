// SyncStatus Component - Display sync/offline status in settings

import React from 'react'
import { useSyncStore } from '../../store/useSyncStore'
import { Wifi, WifiOff, RefreshCw, Clock, Server, Database, Trash2, RotateCcw, Activity } from 'lucide-react'

export const SyncStatus: React.FC = () => {
  const {
    status,
    isOnline,
    peerCount,
    stats,
    queueLength,
    cacheStats,
    config,
    manualSync,
    clearQueue,
    retryQueue,
    clearCache,
    updateConfig,
    recordView
  } = useSyncStore()

  const handleManualSync = async () => {
    await manualSync()
  }

  const handleClearQueue = async () => {
    if (window.confirm('Clear all synced items from queue?')) {
      await clearQueue()
    }
  }

  const handleRetryQueue = async () => {
    await retryQueue()
  }

  const handleClearCache = async () => {
    if (window.confirm('Clear all cached data?')) {
      await clearCache()
    }
  }

  const handleConfigChange = async (key: keyof typeof config, value: any) => {
    await updateConfig({ [key]: value })
  }

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'text-[var(--accent)]'
      case 'connecting':
        return 'text-blue-400'
      case 'offline':
        return 'text-amber-500'
      case 'error':
        return 'text-red-500'
      case 'conflict':
        return 'text-orange-400'
      default:
        return 'text-[var(--text-muted)]'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...'
      case 'connecting':
        return 'Connecting...'
      case 'offline':
        return 'Offline'
      case 'error':
        return 'Connection Error'
      case 'conflict':
        return 'Conflicts Detected'
      default:
        return 'Idle'
    }
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]" onMouseEnter={() => recordView('settings:sync', {})}>
      {/* Connection Status Card */}
      <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            Sync & Collaboration Status
          </h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              status === 'syncing' ? 'animate-pulse bg-[var(--accent)]' :
              isOnline ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
            <span className={`text-xs font-semibold ${getStatusColor()}`}>{getStatusLabel()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Server className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Peers</span>
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{peerCount}</div>
          </div>

          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Database className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Documents</span>
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
              {stats.documentsSynced}/{stats.documentsTotal}
            </div>
          </div>

          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Pending</span>
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{stats.pendingChanges}</div>
          </div>

          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <RotateCcw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Last Sync</span>
            </div>
            <div className="text-xs font-semibold font-mono text-[var(--text-primary)] truncate">
              {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Queue */}
      <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-500" />
            Offline Resilient Queue
          </h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${queueLength > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-xs font-medium text-[var(--text-secondary)]">{queueLength} pending</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleManualSync}
            disabled={status === 'syncing' || !isOnline}
            className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
            {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={handleRetryQueue}
            disabled={queueLength === 0}
            className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center gap-1.5 hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Failed
          </button>
          <button
            onClick={handleClearQueue}
            disabled={queueLength === 0}
            className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-red-500 border border-[var(--border-subtle)] flex items-center gap-1.5 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Synced
          </button>
        </div>

        {queueLength > 0 && (
          <div className="mt-4 max-h-64 overflow-y-auto border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold">Type</th>
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold">Table</th>
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold">Entity</th>
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold">Retries</th>
                  <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {useSyncStore.getState().queue.slice(0, 20).map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'create' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' :
                        item.type === 'update' ? 'bg-blue-500/15 text-blue-500 border border-blue-500/20' :
                        'bg-red-500/15 text-red-500 border border-red-500/20'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[var(--text-secondary)] font-mono">{item.table}</td>
                    <td className="py-2 px-3 text-[var(--text-primary)] font-mono">{item.entityId.slice(0, 20)}...</td>
                    <td className="py-2 px-3 text-[var(--text-secondary)] font-mono">{item.retryCount}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)] font-mono">{new Date(item.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Predictive Cache */}
      <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[var(--accent)]" />
            Predictive Prefetch Cache
          </h3>
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={config.cacheEnabled}
              onChange={(e) => handleConfigChange('cacheEnabled', e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] cursor-pointer accent-[var(--accent)]"
            />
            Enabled
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="text-xs font-medium text-[var(--text-secondary)]">Entries</div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{cacheStats.count}</div>
          </div>
          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="text-xs font-medium text-[var(--text-secondary)]">TTL</div>
            <div className="text-xs font-semibold font-mono text-[var(--text-primary)]">{(config.cacheTTLMs / 60000).toFixed(0)} min</div>
          </div>
          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="text-xs font-medium text-[var(--text-secondary)]">Max Size</div>
            <div className="text-xs font-semibold font-mono text-[var(--text-primary)]">{config.maxCacheSize}</div>
          </div>
          <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
            <div className="text-xs font-medium text-[var(--text-secondary)]">Oldest</div>
            <div className="text-xs font-semibold font-mono text-[var(--text-primary)] truncate">
              {cacheStats.oldestEntry ? new Date(cacheStats.oldestEntry).toLocaleTimeString() : '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleClearCache}
            className="py-1.5 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-red-500 border border-[var(--border-subtle)] flex items-center gap-1.5 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cache
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <Server className="w-4 h-4 text-[var(--text-muted)]" />
          Network Protocol Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">WebRTC Signaling URL</label>
            <input
              type="text"
              value={config.signalingUrl}
              onChange={(e) => handleConfigChange('signalingUrl', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Auto Background Sync</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => handleConfigChange('autoSync', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] accent-[var(--accent)]"
                />
                <span className="text-xs text-[var(--text-primary)]">Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Interval (ms)</label>
              <input
                type="number"
                value={config.syncIntervalMs}
                onChange={(e) => handleConfigChange('syncIntervalMs', parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                min={5000}
                max={300000}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Max Retries</label>
              <input
                type="number"
                value={config.maxRetries}
                onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Backoff (ms)</label>
              <input
                type="number"
                value={config.retryBackoffMs}
                onChange={(e) => handleConfigChange('retryBackoffMs', parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                min={500}
                max={60000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
