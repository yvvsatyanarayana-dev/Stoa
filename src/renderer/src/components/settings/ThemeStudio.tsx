import React, { useState, useEffect } from 'react'
import { useThemeStore } from '../../store/useThemeStore'
import { ALL_BUILT_IN_THEMES, getSeasonalPalette } from '../../theme/ThemePresets'
import { generatePaletteFromBase, hexToOklch, oklchToHex } from '../../theme/oklchEngine'
import type { ThemeConfig, ThemePalette } from '../../../../types/theme'
import {
  Palette,
  Sun,
  Leaf,
  Sun as SunIcon,
  Cloud,
  Snowflake,
  SlidersHorizontal,
  Save,
  Eye,
  Trash2,
  Check,
  X,
  Sparkles,
  RefreshCw
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
    clearCustomThemes,
    createCustomTheme,
    previewTheme,
    applyTheme,
    currentSeason,
  } = useThemeStore()

  const allAvailableThemes = themes.length > 0 ? themes : ALL_BUILT_IN_THEMES
  const activeTheme = allAvailableThemes.find(t => t.id === activeThemeId) || allAvailableThemes[0] || ALL_BUILT_IN_THEMES[0]

  const [activeTab, setActiveTab] = useState<'presets' | 'builder' | 'circadian' | 'seasonal'>('presets')
  const [filterMode, setFilterMode] = useState<'all' | 'dark' | 'light'>('all')
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Builder state
  const [builderBaseColor, setBuilderBaseColor] = useState('#6D0808')
  const [builderIsDark, setBuilderIsDark] = useState(true)
  const [builderPalette, setBuilderPalette] = useState(() => generatePaletteFromBase(hexToOklch('#6D0808'), true))
  const [builderName, setBuilderName] = useState('')

  // Update builder palette when base color changes
  useEffect(() => {
    try {
      const palette = generatePaletteFromBase(hexToOklch(builderBaseColor), builderIsDark)
      setBuilderPalette(palette)
    } catch {}
  }, [builderBaseColor, builderIsDark])

  const handleApplyTheme = async (themeId: string) => {
    setPreviewThemeId(null)
    await setActiveTheme(themeId)
  }

  const handlePreviewTheme = (theme: ThemeConfig) => {
    if (previewThemeId === theme.id) {
      setPreviewThemeId(null)
      if (activeTheme) {
        const isDark = activeTheme.basePalette.background.l < 0.5
        applyTheme(activeTheme.basePalette, isDark)
      }
    } else {
      setPreviewThemeId(theme.id)
      const isDark = theme.basePalette.background.l < 0.5
      previewTheme(theme.basePalette, isDark)
    }
  }

  const handleSaveCustomTheme = () => {
    if (!builderName.trim()) return
    const palette = generatePaletteFromBase(hexToOklch(builderBaseColor), builderIsDark)
    const newTheme = createCustomTheme(builderName.trim(), builderBaseColor, builderIsDark)
    newTheme.basePalette = palette
    addTheme(newTheme)
    setActiveTheme(newTheme.id)
    setBuilderName('')
    setActiveTab('presets')
  }

  const handleDeleteTheme = (id: string) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = (id: string) => {
    deleteTheme(id)
    setShowDeleteConfirm(null)
  }

  const handleEditName = (id: string, name: string) => {
    const theme = themes.find(t => t.id === id)
    if (theme && name.trim()) {
      updateTheme({ ...theme, name: name.trim(), updatedAt: new Date().toISOString() })
    }
    setIsEditing(null)
  }

  // Filter presets
  const presetsList = ALL_BUILT_IN_THEMES.filter(p => {
    const isDark = p.basePalette.background.l < 0.5
    if (filterMode === 'dark') return isDark
    if (filterMode === 'light') return !isDark
    return true
  })

  // Only genuine custom themes created by user
  const customThemesList = themes.filter(t => t.id.startsWith('custom-'))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent)]" />
            Theme Studio
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Engineered with OKLCH color science for uniform perceptual contrast and eye ergonomics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-default)] transition-colors">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={e => setHighContrast(e.target.checked)}
              className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-elevated)] w-3.5 h-3.5 cursor-pointer accent-[var(--accent)]"
            />
            High Contrast
          </label>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>Mode:</span>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {MODES.map(m => (
                <option key={m} value={m}>{MODE_LABELS[m]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)]">
        {[
          { id: 'presets', label: 'Preset Palettes', icon: Palette },
          { id: 'builder', label: 'Custom Builder', icon: SlidersHorizontal },
          { id: 'circadian', label: 'Circadian Light Loop', icon: Sun },
          { id: 'seasonal', label: 'Seasonal Shifts', icon: Leaf },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-[var(--radius-md)] border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--accent)] shadow-xs'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-8">
            {/* Filter buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: `All Palettes (${ALL_BUILT_IN_THEMES.length})` },
                  { id: 'dark', label: `Dark (${ALL_BUILT_IN_THEMES.filter(p => p.basePalette.background.l < 0.5).length})` },
                  { id: 'light', label: `Light (${ALL_BUILT_IN_THEMES.filter(p => p.basePalette.background.l >= 0.5).length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterMode(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                      filterMode === f.id
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] shadow-xs'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {previewThemeId && (
                <button
                  onClick={() => {
                    setPreviewThemeId(null)
                    if (activeTheme) {
                      const isDark = activeTheme.basePalette.background.l < 0.5
                      applyTheme(activeTheme.basePalette, isDark)
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Active Theme
                </button>
              )}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {presetsList.map((preset) => {
                const isActive = activeThemeId === preset.id
                const isPreview = previewThemeId === preset.id
                const isDark = preset.basePalette.background.l < 0.5

                return (
                  <div
                    key={preset.id}
                    className={`rounded-[var(--radius-lg)] border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                      isActive
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] shadow-md'
                        : isPreview
                        ? 'border-[var(--text-secondary)] ring-2 ring-[var(--text-secondary)] shadow-sm'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-sm'
                    } bg-[var(--bg-elevated)]`}
                  >
                    {/* Visual UI Mockup Preview */}
                    <ThemeCardMiniPreview palette={preset.basePalette} isDark={isDark} />

                    {/* Card Footer Details */}
                    <div className="p-3.5 space-y-3 bg-[var(--bg-elevated)]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs tracking-tight text-[var(--text-primary)] truncate">
                          {preset.name}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewTheme(preset)}
                          className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-[var(--radius-md)] border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isPreview
                              ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)]'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isPreview ? 'Previewing' : 'Preview'}
                        </button>
                        <button
                          onClick={() => handleApplyTheme(preset.id)}
                          disabled={isActive}
                          className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-60'
                              : 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] hover:opacity-90 active:scale-[0.98]'
                          }`}
                        >
                          {isActive ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Custom Themes Section */}
            {customThemesList.length > 0 && (
              <div className="pt-6 border-t border-[var(--border-subtle)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    Custom Themes ({customThemesList.length})
                  </h3>
                  <button
                    onClick={clearCustomThemes}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Custom Themes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {customThemesList.map(theme => {
                    const isActive = activeThemeId === theme.id
                    const isPreview = previewThemeId === theme.id
                    const isDark = theme.basePalette.background.l < 0.5

                    return (
                      <div
                        key={theme.id}
                        className={`rounded-[var(--radius-lg)] border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                          isActive
                            ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] shadow-md'
                            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                        } bg-[var(--bg-elevated)]`}
                      >
                        <ThemeCardMiniPreview palette={theme.basePalette} isDark={isDark} />

                        <div className="p-3.5 space-y-3 bg-[var(--bg-elevated)]">
                          {isEditing === theme.id ? (
                            <div className="flex gap-1.5">
                              <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEditName(theme.id, editName)}
                                className="flex-1 px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)] focus:outline-none"
                                autoFocus
                              />
                              <button onClick={() => handleEditName(theme.id, editName)} className="p-1 rounded bg-[var(--accent)] text-[var(--accent-text)]">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setIsEditing(null)} className="p-1 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs tracking-tight text-[var(--text-primary)] truncate">
                                {theme.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setIsEditing(theme.id); setEditName(theme.name) }}
                                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                  title="Edit Name"
                                >
                                  <SlidersHorizontal className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTheme(theme.id)}
                                  className="p-1 text-red-500 hover:text-red-600"
                                  title="Delete Theme"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePreviewTheme(theme)}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-[var(--radius-md)] border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isPreview
                                  ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                                  : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isPreview ? 'Previewing' : 'Preview'}
                            </button>
                            <button
                              onClick={() => handleApplyTheme(theme.id)}
                              disabled={isActive}
                              className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-60'
                                  : 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] hover:opacity-90 active:scale-[0.98]'
                              }`}
                            >
                              {isActive ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Builder Tab */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Base Seed Color & Luminance
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="color"
                    value={builderBaseColor}
                    onChange={e => setBuilderBaseColor(e.target.value)}
                    className="w-14 h-14 rounded-[var(--radius-md)] border border-[var(--border-default)] cursor-pointer"
                  />
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Hex Seed</label>
                    <input
                      type="text"
                      value={builderBaseColor}
                      onChange={e => setBuilderBaseColor(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={builderIsDark}
                      onChange={e => setBuilderIsDark(e.target.checked)}
                      className="rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-0 bg-[var(--bg-subtle)] w-4 h-4 cursor-pointer accent-[var(--accent)]"
                    />
                    Generate Dark Mode Base
                  </label>
                </div>
              </div>

              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Generated Harmonic Palette
                </h3>
                <PalettePreview palette={builderPalette} />
              </div>

              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Theme Name
                </h3>
                <input
                  type="text"
                  value={builderName}
                  onChange={e => setBuilderName(e.target.value)}
                  placeholder="e.g. Nordic Crimson, Obsidian Minimal"
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            {/* Builder Live Preview & Actions */}
            <div className="space-y-6">
              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Real-Time Mockup Preview
                </h3>
                <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] overflow-hidden">
                  <ThemeCardMiniPreview palette={builderPalette} isDark={builderIsDark} />
                </div>
              </div>

              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Actions
                </h3>
                <button
                  onClick={handleSaveCustomTheme}
                  disabled={!builderName.trim()}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Save & Apply Theme
                </button>
                <button
                  onClick={() => previewTheme(builderPalette, builderIsDark)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center gap-2 hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Live Preview in App
                </button>
                <button
                  onClick={() => {
                    if (activeTheme) {
                      const isDark = activeTheme.basePalette.background.l < 0.5
                      applyTheme(activeTheme.basePalette, isDark)
                    }
                  }}
                  className="w-full py-2 px-3 text-xs font-medium rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Geographic Solar Coordinates
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={circadianSettings.latitude}
                    onChange={e => setCircadianSettings({ latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={circadianSettings.longitude}
                    onChange={e => setCircadianSettings({ longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Timezone</label>
                  <input
                    type="text"
                    value={circadianSettings.timezone}
                    onChange={e => setCircadianSettings({ timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Phase Offsets
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--text-primary)]">Dawn Offset</span>
                    <span className="text-[var(--text-muted)] font-mono">{circadianSettings.dawnOffsetMinutes} min</span>
                  </label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={circadianSettings.dawnOffsetMinutes}
                    onChange={e => setCircadianSettings({ dawnOffsetMinutes: parseInt(e.target.value) })}
                    className="w-full mt-2 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--text-primary)]">Dusk Offset</span>
                    <span className="text-[var(--text-muted)] font-mono">{circadianSettings.duskOffsetMinutes} min</span>
                  </label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={circadianSettings.duskOffsetMinutes}
                    onChange={e => setCircadianSettings({ duskOffsetMinutes: parseInt(e.target.value) })}
                    className="w-full mt-2 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seasonal Tab */}
        {activeTab === 'seasonal' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Seasonal Automatic Chromatic Tuning
                </h3>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
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
                  Enable Seasonal Shifts
                </label>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Dynamically shifts the palette hue according to astronomical seasons: Spring (+15° lush), Summer (+30° sunlight warmth), Autumn (-15° amber dusk), Winter (-30° crisp cool).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Custom Theme?</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              This action cannot be undone. Are you sure you want to permanently remove this custom theme?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------
// Miniature Window Mockup Component
// ----------------------------------------------------

function ThemeCardMiniPreview({ palette, isDark }: { palette: ThemePalette; isDark: boolean }) {
  const bg = oklchToHex(palette.background)
  const surface = oklchToHex(palette.surface)
  const elevated = oklchToHex(palette.surfaceElevated)
  const primary = oklchToHex(palette.primary)
  const text = oklchToHex(palette.text)
  const textMuted = oklchToHex(palette.textMuted)
  const border = oklchToHex(palette.border)
  const primaryText = palette.primary.l > 0.6 ? '#000000' : '#FFFFFF'
  const stop2 = palette.eventStops?.[1] ? oklchToHex(palette.eventStops[1]) : primary
  const stop3 = palette.eventStops?.[2] ? oklchToHex(palette.eventStops[2]) : primary

  return (
    <div
      className="aspect-[16/10] w-full p-2.5 flex flex-col justify-between border-b select-none transition-colors"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Mini App Window */}
      <div
        className="flex-1 flex gap-1.5 rounded overflow-hidden p-1.5 border"
        style={{ backgroundColor: surface, borderColor: border }}
      >
        {/* Mini Sidebar */}
        <div className="w-1/4 flex flex-col gap-1 border-r pr-1.5 shrink-0" style={{ borderColor: border }}>
          <div className="w-full h-2 rounded-xs" style={{ backgroundColor: primary }} />
          <div className="w-3/4 h-1.5 rounded-xs" style={{ backgroundColor: textMuted, opacity: 0.5 }} />
          <div className="w-2/3 h-1.5 rounded-xs" style={{ backgroundColor: textMuted, opacity: 0.35 }} />
          <div className="w-4/5 h-1.5 rounded-xs" style={{ backgroundColor: textMuted, opacity: 0.35 }} />
        </div>

        {/* Mini Main Grid */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex justify-between items-center pb-1 border-b" style={{ borderColor: border }}>
            <div className="w-10 h-1.5 rounded-xs" style={{ backgroundColor: text, opacity: 0.8 }} />
            <div
              className="px-1.5 py-0.5 rounded-xs text-[7px] font-bold tracking-wider"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              ADD
            </div>
          </div>

          {/* Mini Event Blocks */}
          <div className="grid grid-cols-2 gap-1 flex-1">
            <div className="rounded p-1 border flex flex-col justify-between" style={{ backgroundColor: elevated, borderColor: border }}>
              <div className="w-6 h-1 rounded-xs" style={{ backgroundColor: text, opacity: 0.9 }} />
              <div className="w-full h-1.5 rounded-xs mt-1" style={{ backgroundColor: primary }} />
            </div>
            <div className="rounded p-1 border flex flex-col justify-between" style={{ backgroundColor: elevated, borderColor: border }}>
              <div className="w-8 h-1 rounded-xs" style={{ backgroundColor: text, opacity: 0.9 }} />
              <div className="w-full h-1.5 rounded-xs mt-1" style={{ backgroundColor: stop2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Palette Color Swatch Dots & Tag */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border shadow-xs"
            style={{ backgroundColor: bg, borderColor: border }}
            title="App Background"
          />
          <span
            className="w-3 h-3 rounded-full border shadow-xs"
            style={{ backgroundColor: surface, borderColor: border }}
            title="Surface"
          />
          <span
            className="w-3 h-3 rounded-full border shadow-xs"
            style={{ backgroundColor: primary, borderColor: border }}
            title="Primary Accent"
          />
          <span
            className="w-3 h-3 rounded-full border shadow-xs"
            style={{ backgroundColor: stop3, borderColor: border }}
            title="Secondary Shade"
          />
        </div>
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border"
          style={{ backgroundColor: surface, color: textMuted, borderColor: border }}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      </div>
    </div>
  )
}

function PalettePreview({ palette }: { palette: ThemePalette }) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {colors.map((c, i) => {
          const hex = oklchToHex(c.color)
          return (
            <div key={i} className="space-y-1.5 p-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
              <div
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] shadow-xs"
                style={{ backgroundColor: hex }}
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)] font-medium">{c.label}</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">{hex}</span>
              </div>
            </div>
          )
        })}
      </div>
      {palette.eventStops && palette.eventStops.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Calendar Event Stops</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {palette.eventStops.map((stop, i) => {
              const hex = oklchToHex(stop)
              return (
                <div
                  key={i}
                  className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-xs"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SeasonCard({ season, isCurrent, palette }: any) {
  const Icon = SEASON_ICONS[season as keyof typeof SEASON_ICONS]
  return (
    <div className={`p-4 rounded-[var(--radius-lg)] border text-center transition-all ${
      isCurrent
        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] bg-[var(--bg-elevated)]'
        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)]'
    }`}>
      <Icon className="w-6 h-6 mx-auto mb-2 text-[var(--accent)]" />
      <p className="font-semibold text-xs text-[var(--text-primary)] capitalize">{season}</p>
      {palette && palette.eventStops && (
        <div className="flex gap-1 justify-center mt-2.5">
          {palette.eventStops.slice(0, 3).map((stop: any, i: number) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-[var(--border-subtle)]"
              style={{ backgroundColor: oklchToHex(stop) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
