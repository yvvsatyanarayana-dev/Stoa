import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Settings, Save, Sun, Moon, Palette, Server, Database } from 'lucide-react'
import { ThemeStudio } from './ThemeStudio'
import { SyncStatus } from './SyncStatus'
import { WorkspaceBackup } from './WorkspaceBackup'

type SettingsTab = 'general' | 'theme' | 'sync' | 'backup'

export const SettingsView: React.FC = () => {
  const { settings, updateSetting, themeMode, setThemeMode } = useAppStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [formState, setFormState] = useState({
    theme: themeMode,
    start_day_of_week: settings?.start_day_of_week ?? 1,
    time_format: settings?.time_format || '24h',
    default_timezone: settings?.default_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    default_reminder_offset: settings?.default_reminder_offset || 15,
    quiet_hours_enabled: Boolean(settings?.quiet_hours_enabled),
    quiet_hours_start: settings?.quiet_hours_start || '22:00',
    quiet_hours_end: settings?.quiet_hours_end || '08:00',
    company_name: settings?.company_name || 'My Organization',
    company_footer: settings?.company_footer || 'Personal & Confidential'
  })

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    for (const [key, val] of Object.entries(formState)) {
      await updateSetting(key, val)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleThemeChange = (newTheme: 'dark' | 'light'): void => {
    setThemeMode(newTheme)
    setFormState({ ...formState, theme: newTheme })
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'theme', label: 'Theme Studio', icon: <Palette className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync & Offline', icon: <Server className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup & Mirrors', icon: <Database className="w-4 h-4" /> },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 text-[var(--text-primary)]">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)] mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-[var(--radius-md)] transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[var(--text-primary)]" />
                <span>System Preferences</span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Configure appearance, regional standards, notification offsets, and export branding.
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary flex items-center gap-1.5 py-1 px-3 text-xs font-medium"
            >
              <Save className="w-3.5 h-3.5 stroke-[2]" />
              <span>Save Settings</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium flex items-center justify-between">
              <span>Preferences saved successfully.</span>
              <span className="font-mono text-[10px]">OK</span>
            </div>
          )}

          {/* Theme & Appearance */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Theme & Appearance
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-[var(--radius-md)] border text-left transition-all flex items-center gap-3 ${
                  themeMode === 'dark'
                    ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)] shadow-xs'
                    : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="w-8 h-8 rounded bg-black border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Dark Mode</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Pure black & slate surfaces</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-[var(--radius-md)] border text-left transition-all flex items-center gap-3 ${
                  themeMode === 'light'
                    ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)] shadow-xs'
                    : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="w-8 h-8 rounded bg-white border border-black/20 flex items-center justify-center text-black shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Light Mode</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Clean editorial white & graphite</div>
                </div>
              </button>
            </div>
          </div>

          {/* Date & Time Settings */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Time & Region
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Week Starts On
                </label>
                <select
                  value={formState.start_day_of_week}
                  onChange={(e) => setFormState({ ...formState, start_day_of_week: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                >
                  <option value={1}>Monday (ISO Standard)</option>
                  <option value={0}>Sunday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Time Format
                </label>
                <select
                  value={formState.time_format}
                  onChange={(e) => setFormState({ ...formState, time_format: e.target.value as '12h' | '24h' })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                >
                  <option value="24h">24-hour (14:00)</option>
                  <option value="12h">12-hour (2:00 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Export Branding */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Export Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Organization / Author Header
                </label>
                <input
                  type="text"
                  value={formState.company_name}
                  onChange={(e) => setFormState({ ...formState, company_name: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Footer Notice
                </label>
                <input
                  type="text"
                  value={formState.company_footer}
                  onChange={(e) => setFormState({ ...formState, company_footer: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'theme' && (
        <ThemeStudio />
      )}

      {activeTab === 'sync' && (
        <SyncStatus />
      )}

      {activeTab === 'backup' && (
        <WorkspaceBackup />
      )}
    </div>
  )
}