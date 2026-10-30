import React, { useState, useEffect } from 'react'
import { useThemeStore } from '../../store/useThemeStore'
import { BUILT_IN_PRESETS, getAllPresets, getSeasonalPalette } from '../../theme/ThemePresets'
import { formatPhaseName, hasValidLocation, getNextTransition } from '../../theme/circadian'
import { generatePaletteFromBase, hexToOklch, oklchToHex } from '../../theme/oklchEngine'
import {
  Palette,
  Sun,
  Moon,
  CloudSun,
  Leaf,
  Sun as SunIcon,
  Cloud,
  Snowflake,
  SlidersHorizontal,
  Save,
  Eye,
  Trash2,
  MapPin,
  Check,
  X
} from 'lucide-react'

const MODES = ['manual', 'time-of-day', 'circadian', 'seasonal'] as const

const MODE_LABELS: Record<string, string> = {
  manual: 'Manual',
  'time-of-day': 'Time of Day',
  circadian: 'Circadian',
  seasonal: 'Seasonal',
}

const SEASON_ICONS = {
  spring: Leaf,
  summer: SunIcon,
  autumn: Cloud,
  winter: Snowflake,
}

const PHASE_ICONS = {
  dawn: CloudSun,
  day: Sun,
  dusk: CloudSun,
  night: Moon,
}

export const ThemeStudio: React.FC = () => {
  const {
    themes,
    activeThemeId,
    mode,
    circadianSettings,
    highContrast,
    setActiveTheme,
    setMode,
    setHighContrast,
    setCircadianSettings,
    addTheme,
    updateTheme,
    deleteTheme,
    createCustomTheme,
    previewTheme,
    applyTheme,
    currentPhase,
    currentSeason,
  } = useThemeStore()

  const activeTheme = themes.find(t => t.id === activeThemeId)
  const [activeTab, setActiveTab] = useState<'presets' | 'builder' | 'circadian' | 'seasonal'>('presets')
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const customBaseColor = '#6D0808'
  const customIsDark = true
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Builder state
  const [builderBaseColor, setBuilderBaseColor] = useState('#6D0808')
  const [builderIsDark, setBuilderIsDark] = useState(true)
  const [builderPalette, setBuilderPalette] = useState(() => generatePaletteFromBase(hexToOklch('#6D0808'), true))
  const [builderName, setBuilderName] = useState('')

  useEffect(() => {
    if (previewThemeId) {
      const theme = themes.find(t => t.id === previewThemeId)
      if (theme) {
        previewTheme(theme.basePalette, true)
      }
    }
  }, [previewThemeId, themes, previewTheme])

  // Update builder palette when base color changes
  useEffect(() => {
    const palette = generatePaletteFromBase(hexToOklch(builderBaseColor), builderIsDark)
    setBuilderPalette(palette)
  }, [builderBaseColor, builderIsDark])

  const handleApplyPreset = (preset: typeof BUILT_IN_PRESETS[0]) => {
    const newTheme = createCustomTheme(preset.name, customBaseColor, customIsDark)
    newTheme.basePalette = preset.basePalette
    newTheme.mode = preset.mode
    newTheme.circadianOffsetMinutes = preset.circadianOffsetMinutes
    newTheme.seasonalEnabled = preset.seasonalEnabled
    addTheme(newTheme)
    setActiveTheme(newTheme.id)
  }

  const handleSaveCustomTheme = () => {
    if (!builderName.trim()) return
    const palette = generatePaletteFromBase(hexToOklch(builderBaseColor), builderIsDark)
    const newTheme = createCustomTheme(builderName, builderBaseColor, builderIsDark)
    newTheme.basePalette = palette
    addTheme(newTheme)
    setActiveTheme(newTheme.id)
    setBuilderName('')
    setActiveTab('presets')
  }

  const handlePreviewTheme = (theme: typeof themes[0]) => {
    if (previewThemeId === theme.id) {
      setPreviewThemeId(null)
      if (activeTheme) {
        applyTheme(activeTheme.basePalette, true)
      }
    } else {
      setPreviewThemeId(theme.id)
      previewTheme(theme.basePalette, true)
    }
  }

  const handleDeleteTheme = (id: string) => {
    if (themes.length <= 1) return
    setShowDeleteConfirm(id)
  }

  const confirmDelete = (id: string) => {
    deleteTheme(id)
    setShowDeleteConfirm(null)
  }

  const handleEditName = (id: string, name: string) => {
    const theme = themes.find(t => t.id === id)
    if (theme) {
      updateTheme({ ...theme, name, updatedAt: new Date().toISOString() })
    }
    setIsEditing(null)
  }

  const allPresets = getAllPresets()

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Theme Studio</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Create, customize, and manage themes with OKLCH color precision
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={e => setHighContrast(e.target.checked)}
              className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] w-4 h-4 cursor-pointer accent-[var(--accent)]"
            />
            High Contrast
          </label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as any)}
            className="px-3 py-1.5 text-sm bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          >
            {MODES.map(m => (
              <option key={m} value={m}>{MODE_LABELS[m]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {[
          { id: 'presets', label: 'Presets', icon: Palette },
          { id: 'builder', label: 'Builder', icon: SlidersHorizontal },
          { id: 'circadian', label: 'Circadian', icon: Sun },
          { id: 'seasonal', label: 'Seasonal', icon: Leaf },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-[var(--radius-md)] transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Built-in Presets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPresets.map((preset, i) => (
                  <ThemePresetCard
                    key={`preset-${i}`}
                    preset={preset}
                    isActive={activeThemeId === `preset-${i}`}
                    isPreview={previewThemeId === `preset-${i}`}
                    onApply={() => handleApplyPreset(preset)}
                    onPreview={() => handlePreviewTheme({ ...preset, id: `preset-${i}` } as any)}
                  />
                ))}
              </div>
            </div>

            {themes.filter(t => t.id.startsWith('custom-')).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Custom Themes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.filter(t => t.id.startsWith('custom-')).map(theme => (
                    <CustomThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={activeThemeId === theme.id}
                      isPreview={previewThemeId === theme.id}
                      isEditing={isEditing === theme.id}
                      editName={editName}
                      onApply={() => setActiveTheme(theme.id)}
                      onPreview={() => handlePreviewTheme(theme)}
                      onEdit={() => { setIsEditing(theme.id); setEditName(theme.name); }}
                      onSave={() => handleEditName(theme.id, editName)}
                      onCancel={() => { setIsEditing(null); setEditName(''); }}
                      onDelete={() => handleDeleteTheme(theme.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Builder Tab */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                  Base Color
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={builderBaseColor}
                    onChange={e => setBuilderBaseColor(e.target.value)}
                    className="w-16 h-16 rounded-[var(--radius-md)] border border-[var(--border-default)] cursor-pointer"
                  />
                  <div className="flex-1">
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Hex Color</label>
                    <input
                      type="text"
                      value={builderBaseColor}
                      onChange={e => setBuilderBaseColor(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={builderIsDark}
                      onChange={e => setBuilderIsDark(e.target.checked)}
                      className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] w-4 h-4 cursor-pointer accent-[var(--accent)]"
                    />
                    Dark Mode Base
                  </label>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                  Generated Palette Preview
                </h3>
                <PalettePreview palette={builderPalette} isDark={builderIsDark} />
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                  Theme Name
                </h3>
                <input
                  type="text"
                  value={builderName}
                  onChange={e => setBuilderName(e.target.value)}
                  placeholder="My Custom Theme"
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleSaveCustomTheme}
                  disabled={!builderName.trim()}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Theme
                </button>
                <button
                  onClick={() => {
                    const palette = generatePaletteFromBase(hexToOklch(builderBaseColor), builderIsDark)
                    previewTheme(palette, builderIsDark)
                  }}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Live Preview
                </button>
                <button
                  onClick={() => {
                    if (activeTheme) applyTheme(activeTheme.basePalette, true)
                  }}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset to Active
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Circadian Tab */}
        {activeTab === 'circadian' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                Location Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                  <div className="flex-1">
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={circadianSettings.latitude}
                      onChange={e => setCircadianSettings({ latitude: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                  <div className="flex-1">
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={circadianSettings.longitude}
                      onChange={e => setCircadianSettings({ longitude: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                  <div className="flex-1">
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Timezone</label>
                    <input
                      type="text"
                      value={circadianSettings.timezone}
                      onChange={e => setCircadianSettings({ timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                Phase Offsets
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]">Dawn Offset</span>
                    <span className="text-[var(--text-muted)]">{circadianSettings.dawnOffsetMinutes} min</span>
                  </label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={circadianSettings.dawnOffsetMinutes}
                    onChange={e => setCircadianSettings({ dawnOffsetMinutes: parseInt(e.target.value) })}
                    className="w-full mt-2 accent-[var(--accent)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Negative = earlier, Positive = later relative to civil dawn
                  </p>
                </div>
                <div>
                  <label className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]">Dusk Offset</span>
                    <span className="text-[var(--text-muted)]">{circadianSettings.duskOffsetMinutes} min</span>
                  </label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={circadianSettings.duskOffsetMinutes}
                    onChange={e => setCircadianSettings({ duskOffsetMinutes: parseInt(e.target.value) })}
                    className="w-full mt-2 accent-[var(--accent)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Negative = earlier, Positive = later relative to civil dusk
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6 lg:col-span-2">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                Current Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatusCard
                  label="Current Phase"
                  value={currentPhase ? formatPhaseName(currentPhase) : '—'}
                  icon={currentPhase ? PHASE_ICONS[currentPhase] : Sun}
                />
                <StatusCard
                  label="Current Season"
                  value={currentSeason ? currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1) : '—'}
                  icon={currentSeason ? SEASON_ICONS[currentSeason as keyof typeof SEASON_ICONS] : Sun}
                />
                <StatusCard
                  label="Mode"
                  value={MODE_LABELS[mode]}
                  icon={SlidersHorizontal}
                />
                <StatusCard
                  label="Location"
                  value={hasValidLocation(circadianSettings) ? 'Set' : 'Not Set (UTC)'}
                  icon={MapPin}
                />
              </div>
              {hasValidLocation(circadianSettings) && (
                <div className="mt-4 p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-md)]">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Next transition: <strong>{getNextTransitionLabel(circadianSettings)}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seasonal Tab */}
        {activeTab === 'seasonal' && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Seasonal Variations
                </h3>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={activeTheme?.seasonalEnabled || false}
                    onChange={e => {
                      if (activeTheme) {
                        updateTheme({ ...activeTheme, seasonalEnabled: e.target.checked })
                      }
                    }}
                    className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] w-4 h-4 cursor-pointer accent-[var(--accent)]"
                  />
                  Enable Seasonal Palettes
                </label>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                When enabled, the theme automatically adjusts hue based on the current season.
                Each season shifts the base hue: Spring +15°, Summer +30°, Autumn -15°, Winter -30°.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['spring', 'summer', 'autumn', 'winter'] as const).map(season => (
                  <SeasonCard
                    key={season}
                    season={season}
                    isCurrent={currentSeason === season}
                    palette={activeTheme ? getSeasonalPalette(activeTheme.basePalette, season) : null}
                  />
                ))}
              </div>
            </div>

            {activeTheme?.customSeasonalPalettes && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                  Custom Seasonal Palettes
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Custom palettes override automatic seasonal shifts.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Delete Theme</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete this theme? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={() => confirmDelete(showDeleteConfirm)} className="btn-primary bg-red-600 border-red-600 hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper components
function ThemePresetCard({ preset, isActive, isPreview, onApply, onPreview }: any) {
  return (
    <div className={`card relative overflow-hidden transition-all ${
      isActive ? 'ring-2 ring-[var(--accent)]' : ''
    } ${isPreview ? 'ring-2 ring-[var(--text-muted)]' : ''}`}>
      <div className="aspect-[16/10] bg-gradient-to-br from-[var(--bg-app)] to-[var(--bg-sidebar)]" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--text-primary)]">{preset.name}</span>
          {isActive && <Check className="w-5 h-5 text-[var(--accent)]" />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className={`btn-secondary flex-1 flex items-center justify-center gap-1 ${isPreview ? 'bg-[var(--accent)] text-[var(--accent-text)]' : ''}`}
          >
            <Eye className="w-3.5 h-3.5" />
            {isPreview ? 'Previewing' : 'Preview'}
          </button>
          <button
            onClick={onApply}
            disabled={isActive}
            className="btn-primary flex-1"
          >
            {isActive ? 'Active' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomThemeCard({ theme, isActive, isPreview, isEditing, editName, onApply, onPreview, onEdit, onSave, onCancel, onDelete }: any) {
  return (
    <div className={`card relative overflow-hidden transition-all ${isActive ? 'ring-2 ring-[var(--accent)]' : ''}`}>
      <div className="aspect-[16/10] bg-gradient-to-br from-[var(--bg-app)] to-[var(--bg-sidebar)]" />
      <div className="p-4 space-y-3">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              value={editName}
              onChange={e => onSave(e.target.value)}
              onBlur={onCancel}
              onKeyDown={e => e.key === 'Enter' && onSave(editName)}
              className="flex-1 px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-[var(--text-primary)] text-sm"
              autoFocus
            />
            <button onClick={() => onSave(editName)} className="btn-secondary p-1"><Check className="w-4 h-4" /></button>
            <button onClick={onCancel} className="btn-secondary p-1"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--text-primary)] truncate">{theme.name}</span>
              {isActive && <Check className="w-5 h-5 text-[var(--accent)]" />}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onPreview}
                className={`btn-secondary flex-1 flex items-center justify-center gap-1 ${isPreview ? 'bg-[var(--accent)] text-[var(--accent-text)]' : ''}`}
              >
                <Eye className="w-3.5 h-3.5" />
                {isPreview ? 'Previewing' : 'Preview'}
              </button>
              <button
                onClick={onApply}
                disabled={isActive}
                className="btn-primary flex-1"
              >
                {isActive ? 'Active' : 'Apply'}
              </button>
            </div>
            <div className="flex gap-1">
              <button onClick={onEdit} className="btn-secondary flex-1 p-1"><SlidersHorizontal className="w-4 h-4" /></button>
              <button onClick={onDelete} className="btn-secondary flex-1 p-1 text-red-400 hover:bg-red-900/20 hover:border-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PalettePreview({ palette }: any) {
  const colors = [
    { label: 'Background', color: palette.background },
    { label: 'Surface', color: palette.surface },
    { label: 'Elevated', color: palette.surfaceElevated },
    { label: 'Primary', color: palette.primary },
    { label: 'Text', color: palette.text },
    { label: 'Border', color: palette.border },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {colors.map((c, i) => (
          <div key={i} className="space-y-1">
            <div
              className="h-10 rounded-[var(--radius-md)] border border-[var(--border-default)]"
              style={{ backgroundColor: oklchToHex(c.color) }}
            />
            <span className="text-xs text-[var(--text-muted)]">{c.label}</span>
            <span className="text-xs font-mono text-[var(--text-primary)]">{oklchToHex(c.color)}</span>
          </div>
        ))}
      </div>
      <div>
        <span className="text-xs text-[var(--text-muted)]">Event Stops</span>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {palette.eventStops.map((stop, i) => (
            <div key={i} className="flex-shrink-0 w-12 h-12 rounded-[var(--radius-md)] border border-[var(--border-default)]"
              style={{ backgroundColor: oklchToHex(stop) }}
              title={oklchToHex(stop)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusCard({ label, value, icon: Icon }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-1">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function SeasonCard({ season, isCurrent, palette }: any) {
  const Icon = SEASON_ICONS[season as keyof typeof SEASON_ICONS]
  return (
    <div className={`card relative ${isCurrent ? 'ring-2 ring-[var(--accent)]' : ''}`}>
      {isCurrent && <div className="absolute top-2 right-2"><Check className="w-4 h-4 text-[var(--accent)]" /></div>}
      <div className="p-4 text-center">
        <Icon className="w-8 h-8 mx-auto mb-2 text-[var(--text-primary)]" />
        <p className="font-medium text-[var(--text-primary)]">{season.charAt(0).toUpperCase() + season.slice(1)}</p>
        {palette && (
          <div className="flex gap-1 justify-center mt-3">
            {palette.eventStops.slice(0, 3).map((stop, i) => (
              <div key={i} className="w-6 h-6 rounded border border-[var(--border-default)]"
                style={{ backgroundColor: oklchToHex(stop) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Helpers
function getNextTransitionLabel(settings: any) {
  const next = getNextTransition(settings)
  if (!next) return 'Calculating...'
  const time = next.time.toLocaleTimeString()
  return `${next.phase.charAt(0).toUpperCase() + next.phase.slice(1)} at ${time}`
}