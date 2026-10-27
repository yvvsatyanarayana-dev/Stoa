import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Settings, BellOff, Building2, Save, Sun, Moon } from 'lucide-react'

export const SettingsView: React.FC = () => {
  const { settings, updateSetting, themeMode, setThemeMode } = useAppStore()

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

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 text-[var(--text-primary)]">
      <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <span>Application & System Preferences</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Configure B&W appearance, regional settings, quiet hours, and export watermarks.
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary flex items-center gap-2 py-2 px-4 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 card bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-strong)]">
            Preferences saved successfully.
          </div>
        )}

        {/* Appearance & B/W Theme Mode */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Theme & Appearance</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Select your preferred monochromatic appearance mode:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-[var(--radius-md)] border text-left flex items-center gap-3 transition-all ${
                themeMode === 'dark'
                  ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)] shadow-sm'
                  : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center border border-neutral-700">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Dark Mode</div>
                <div className="text-[11px] text-[var(--text-muted)]">Pure black & charcoal shades</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-[var(--radius-md)] border text-left flex items-center gap-3 transition-all ${
                themeMode === 'light'
                  ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)] shadow-sm'
                  : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center border border-neutral-300">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Light Mode</div>
                <div className="text-[11px] text-[var(--text-muted)]">Clean white & crisp typography</div>
              </div>
            </button>
          </div>
        </div>

        {/* General & Regional Settings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Regional & Display Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Time Format</label>
              <select
                value={formState.time_format}
                onChange={(e) => setFormState({ ...formState, time_format: e.target.value as any })}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              >
                <option value="24h">24-hour (14:00)</option>
                <option value="12h">12-hour (2:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Week Start Day</label>
              <select
                value={formState.start_day_of_week}
                onChange={(e) => setFormState({ ...formState, start_day_of_week: Number(e.target.value) })}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              >
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Default Timezone</label>
              <input
                type="text"
                value={formState.default_timezone}
                onChange={(e) => setFormState({ ...formState, default_timezone: e.target.value })}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>
        </div>

        {/* Quiet Hours / Focus Mode */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BellOff className="w-4 h-4 text-[var(--text-secondary)]" />
                <span>Quiet Hours / Focus Mode</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Mutes popups and alert notifications during off-work hours.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formState.quiet_hours_enabled}
              onChange={(e) => setFormState({ ...formState, quiet_hours_enabled: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent)] border-[var(--border-default)] bg-[var(--bg-subtle)] focus:ring-0 cursor-pointer"
            />
          </div>

          {formState.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Time</label>
                <input
                  type="time"
                  value={formState.quiet_hours_start}
                  onChange={(e) => setFormState({ ...formState, quiet_hours_start: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">End Time</label>
                <input
                  type="time"
                  value={formState.quiet_hours_end}
                  onChange={(e) => setFormState({ ...formState, quiet_hours_end: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Corporate Branding for Timetable & PDF Exports */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Organization Branding for Exports</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Organization / Header Name</label>
              <input
                type="text"
                value={formState.company_name}
                onChange={(e) => setFormState({ ...formState, company_name: e.target.value })}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Footer Watermark / Notice</label>
              <input
                type="text"
                value={formState.company_footer}
                onChange={(e) => setFormState({ ...formState, company_footer: e.target.value })}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
