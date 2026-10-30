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
        return 'text-emerald-400'
      case 'connecting':
        return 'text-blue-400'
      case 'offline':
        return 'text-amber-400'
      case 'error':
        return 'text-red-400'
      case 'conflict':
        return 'text-orange-400'
      default:
        return 'text-slate-400'
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
    <div className="space-y-6" onMouseEnter={() => recordView('settings:sync', {})}>
      {/* Connection Status Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Sync Status
          </h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              status === 'syncing' ? 'animate-pulse bg-emerald-400' :
              isOnline ? 'bg-emerald-400' : 'bg-slate-500'
            }`} />
            <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusLabel()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Server className="w-4 h-4" />
              <span className="text-xs">Peers</span>
            </div>
            <div className="text-2xl font-bold text-slate-100">{peerCount}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs">Documents</span>
            </div>
            <div className="text-2xl font-bold text-slate-100">
              {stats.documentsSynced}/{stats.documentsTotal}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Pending</span>
            </div>
            <div className="text-2xl font-bold text-slate-100">{stats.pendingChanges}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs">Last Sync</span>
            </div>
            <div className="text-sm font-medium text-slate-300">
              {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Queue */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-400" />
            Offline Queue
          </h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${queueLength > 0 ? 'bg-amber-400' : 'bg-slate-500'}`} />
            <span className="text-sm font-medium text-slate-300">{queueLength} pending</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleManualSync}
            disabled={status === 'syncing' || !isOnline}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-100 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
            {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={handleRetryQueue}
            disabled={queueLength === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-100 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Failed
          </button>
          <button
            onClick={handleClearQueue}
            disabled={queueLength === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-100 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Synced
          </button>
        </div>

        {queueLength > 0 && (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left pb-2 text-slate-400">Type</th>
                  <th className="text-left pb-2 text-slate-400">Table</th>
                  <th className="text-left pb-2 text-slate-400">Entity</th>
                  <th className="text-left pb-2 text-slate-400">Retries</th>
                  <th className="text-left pb-2 text-slate-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {useSyncStore.getState().queue.slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/50">
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        item.type === 'create' ? 'bg-emerald-900/30 text-emerald-400' :
                        item.type === 'update' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300 font-mono text-xs">{item.table}</td>
                    <td className="py-2 text-slate-300 font-mono text-xs">{item.entityId.slice(0, 20)}...</td>
                    <td className="py-2 text-slate-400">{item.retryCount}</td>
                    <td className="py-2 text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Predictive Cache */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-400" />
            Predictive Cache
          </h3>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={config.cacheEnabled}
              onChange={(e) => handleConfigChange('cacheEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            Enabled
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Entries</div>
            <div className="text-2xl font-bold text-slate-100">{cacheStats.count}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">TTL</div>
            <div className="text-sm font-medium text-slate-300">{(config.cacheTTLMs / 60000).toFixed(0)} min</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Max Size</div>
            <div className="text-sm font-medium text-slate-300">{config.maxCacheSize}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Oldest</div>
            <div className="text-sm font-medium text-slate-300">
              {cacheStats.oldestEntry ? new Date(cacheStats.oldestEntry).toLocaleTimeString() : '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-slate-700 hover:bg-red-600 rounded-lg text-sm font-medium text-slate-100 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-slate-400" />
          Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Signaling Server URL</label>
            <input
              type="text"
              value={config.signalingUrl}
              onChange={(e) => handleConfigChange('signalingUrl', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Auto Sync</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => handleConfigChange('autoSync', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Sync Interval (ms)</label>
              <input
                type="number"
                value={config.syncIntervalMs}
                onChange={(e) => handleConfigChange('syncIntervalMs', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min={5000}
                max={300000}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Retries</label>
              <input
                type="number"
                value={config.maxRetries}
                onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Retry Backoff (ms)</label>
              <input
                type="number"
                value={config.retryBackoffMs}
                onChange={(e) => handleConfigChange('retryBackoffMs', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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