import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Settings,
  Save,
  Server,
  Database,
  Lock,
  BookOpen,
  ArrowRight,
  Briefcase,
  Palette,
  ShieldCheck
} from 'lucide-react'
import { SyncStatus } from './SyncStatus'
import { WorkspaceBackup } from './WorkspaceBackup'
import { DataPortabilityTab } from '../enterprise/DataPortabilityTab'

type SettingsTab =
  | 'general'
  | 'security'
  | 'portability'
  | 'sync'
  | 'backup'

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSetting,
    themeMode,
    setThemeMode,
    setIsWorkspaceLocked,
    setIsTemplateMarketplaceOpen,
    setCurrentView
  } = useAppStore()

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
    company_footer: settings?.company_footer || 'Personal & Confidential',
    workspace_pin: (settings as any)?.workspace_pin || '1234',
    workspace_lock_enabled: (settings as any)?.workspace_lock_enabled !== false,
    workspace_lock_timeout: (settings as any)?.workspace_lock_timeout || '15'
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
    { id: 'security', label: 'Security & PIN', icon: <Lock className="w-4 h-4" /> },
    { id: 'portability', label: 'Data Portability', icon: <Database className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync & Offline', icon: <Server className="w-4 h-4" /> },
    { id: 'backup', label: 'Mirrors & Bundles', icon: <Database className="w-4 h-4" /> }
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 text-[var(--text-primary)]">
      {/* Quick Jump to Dedicated Sidebar Management Views */}
      <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Dedicated Sidebar Tools:</span>
          <span>Access high-level administration views directly from the sidebar.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentView('profiles')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-[11px] font-medium"
          >
            <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Profiles</span>
            <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('theme-studio')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-[11px] font-medium"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Theme Studio</span>
            <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('audit-log')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-[11px] font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Security Log</span>
            <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] mb-6 overflow-x-auto pb-0.5">
        <div className="flex gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-[var(--radius-md)] transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-b-2 border-[var(--accent)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Template Marketplace button */}
        <button
          onClick={() => setIsTemplateMarketplaceOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] transition-colors shrink-0 shadow-xs ml-4"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>
      </div>

      {/* TAB 1: GENERAL */}
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
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center justify-between">
              <span>Preferences saved successfully.</span>
              <span className="font-mono text-[10px]">OK</span>
            </div>
          )}

          {/* Theme & Appearance */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Theme Mode
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-[var(--radius-sm)] border text-left flex items-center justify-between transition-colors ${
                  formState.theme === 'dark'
                    ? 'border-[var(--accent)] bg-[var(--bg-subtle)]'
                    : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Dark Mode</div>
                  <div className="text-[10px] text-[var(--text-muted)]">OLED-grade high contrast</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-700" />
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-[var(--radius-sm)] border text-left flex items-center justify-between transition-colors ${
                  formState.theme === 'light'
                    ? 'border-[var(--accent)] bg-[var(--bg-subtle)]'
                    : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Light Mode</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Pure crisp high-key contrast</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-neutral-100 border border-neutral-300" />
              </button>
            </div>
          </div>

          {/* Regional Standards */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Regional & Time Standards
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Start Day of Week
                </label>
                <select
                  value={formState.start_day_of_week}
                  onChange={(e) => setFormState({ ...formState, start_day_of_week: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
                >
                  <option value={1}>Monday (ISO Standard)</option>
                  <option value={0}>Sunday (US / Standard)</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Time Display Format
                </label>
                <select
                  value={formState.time_format}
                  onChange={(e) => setFormState({ ...formState, time_format: e.target.value as '12h' | '24h' })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
                >
                  <option value="24h">24-Hour (14:30)</option>
                  <option value="12h">12-Hour (2:30 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Export & Document Branding */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Export & Document Header Branding
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Organization / Author Header
                </label>
                <input
                  type="text"
                  value={formState.company_name}
                  onChange={(e) => setFormState({ ...formState, company_name: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
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
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB: SECURITY & PIN LOCK */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--accent)]" />
                <span>Password-Protected Workspace & PIN Lock</span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Lock your schedule when stepping away. Requires a security PIN to resume viewing.
              </p>
            </div>

            <button
              onClick={() => setIsWorkspaceLocked(true)}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Now</span>
            </button>
          </div>

          <div className="card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Enable Workspace PIN Protection</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Enforces security lock screen on timeout or manual lock trigger.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formState.workspace_lock_enabled}
                onChange={(e) => setFormState({ ...formState, workspace_lock_enabled: e.target.checked })}
                className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Security PIN Code (4–6 digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={formState.workspace_pin}
                  onChange={(e) => setFormState({ ...formState, workspace_pin: e.target.value })}
                  className="w-full max-w-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm tracking-widest"
                />
                <span className="text-[10px] text-[var(--text-muted)] font-mono mt-1 block">
                  Current configured PIN: <span className="font-bold text-[var(--text-secondary)]">{formState.workspace_pin}</span>
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Inactivity Auto-Lock Timeout
                </label>
                <select
                  value={formState.workspace_lock_timeout}
                  onChange={(e) => setFormState({ ...formState, workspace_lock_timeout: e.target.value })}
                  className="w-full max-w-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs"
                >
                  <option value="0">Never (Manual lock only)</option>
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await updateSetting('workspace_pin', formState.workspace_pin)
                    await updateSetting('workspace_lock_enabled', formState.workspace_lock_enabled)
                    await updateSetting('workspace_lock_timeout', formState.workspace_lock_timeout)
                    alert('Security PIN settings saved successfully.')
                  }}
                  className="btn-primary text-xs py-1.5 px-4 shadow-xs"
                >
                  Save PIN Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DATA PORTABILITY */}
      {activeTab === 'portability' && (
        <div className="max-w-4xl mx-auto">
          <DataPortabilityTab />
        </div>
      )}

      {/* TAB: SYNC */}
      {activeTab === 'sync' && <SyncStatus />}

      {/* TAB: BACKUP */}
      {activeTab === 'backup' && <WorkspaceBackup />}
    </div>
  )
}
