import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Settings, BellOff, Building2, Save } from 'lucide-react'

export const SettingsView: React.FC = () => {
  const { settings, updateSetting } = useAppStore()

  const [formState, setFormState] = useState({
    theme: settings?.theme || 'dark',
    start_day_of_week: settings?.start_day_of_week ?? 1,
    time_format: settings?.time_format || '24h',
    default_timezone: settings?.default_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    default_reminder_offset: settings?.default_reminder_offset || 15,
    quiet_hours_enabled: Boolean(settings?.quiet_hours_enabled),
    quiet_hours_start: settings?.quiet_hours_start || '22:00',
    quiet_hours_end: settings?.quiet_hours_end || '08:00',
    company_name: settings?.company_name || 'ChronoDesk Enterprise',
    company_footer: settings?.company_footer || 'Confidential & Proprietary'
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

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
      <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Application & System Preferences</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure calendar regional settings, quiet hours, and branded export watermarks.
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold">
            Preferences saved successfully.
          </div>
        )}

        {/* General & Regional Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Regional & Display Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Time Format</label>
              <select
                value={formState.time_format}
                onChange={(e) => setFormState({ ...formState, time_format: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="24h">24-hour (14:00)</option>
                <option value="12h">12-hour (2:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Week Start Day</label>
              <select
                value={formState.start_day_of_week}
                onChange={(e) => setFormState({ ...formState, start_day_of_week: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Default Timezone</label>
              <input
                type="text"
                value={formState.default_timezone}
                onChange={(e) => setFormState({ ...formState, default_timezone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quiet Hours / Focus Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BellOff className="w-4 h-4 text-purple-400" />
                <span>Quiet Hours / Focus Mode</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mutes non-urgent popups and alert notifications during off-work hours.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formState.quiet_hours_enabled}
              onChange={(e) => setFormState({ ...formState, quiet_hours_enabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 border-slate-700 bg-slate-950 focus:ring-0"
            />
          </div>

          {formState.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formState.quiet_hours_start}
                  onChange={(e) => setFormState({ ...formState, quiet_hours_start: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={formState.quiet_hours_end}
                  onChange={(e) => setFormState({ ...formState, quiet_hours_end: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Corporate Branding for Timetable & PDF Exports */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Corporate Branding for Exports</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Organization Name</label>
              <input
                type="text"
                value={formState.company_name}
                onChange={(e) => setFormState({ ...formState, company_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Footer Watermark / Notice</label>
              <input
                type="text"
                value={formState.company_footer}
                onChange={(e) => setFormState({ ...formState, company_footer: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
