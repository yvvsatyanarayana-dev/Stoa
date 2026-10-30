import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeConfig, ThemePalette, ThemeMode, TimeOfDayPhase, CircadianSettings } from '../../../types/theme';
import { getCurrentPhase, normalizeCircadianSettings } from '../theme/circadian';
import { ALL_BUILT_IN_THEMES, getPhasePalette, getSeasonalPalette, getCombinedPalette, getCurrentSeason } from '../theme/ThemePresets';
import { generatePaletteFromBase, hexToOklch, paletteToCssVariables } from '../theme/oklchEngine';

interface ThemeState {
  // Config
  themes: ThemeConfig[];
  activeThemeId: string | null;
  circadianSettings: CircadianSettings;
  highContrast: boolean;
  mode: ThemeMode;

  // Computed
  activeTheme: ThemeConfig | null;
  effectivePalette: ThemePalette | null;
  isDark: boolean;
  currentPhase: TimeOfDayPhase | null;
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter';

  // Actions
  initialize: () => Promise<void>;
  setThemes: (themes: ThemeConfig[]) => void;
  addTheme: (theme: ThemeConfig) => void;
  updateTheme: (theme: ThemeConfig) => void;
  deleteTheme: (id: string) => void;
  clearCustomThemes: () => void;
  setActiveTheme: (id: string) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setCircadianSettings: (settings: Partial<CircadianSettings>) => Promise<void>;
  applyTheme: (palette: ThemePalette, isDark: boolean) => void;
  updateComputed: () => void;
  createCustomTheme: (name: string, baseColor: string, isDark: boolean) => ThemeConfig;
  previewTheme: (palette: ThemePalette, isDark: boolean) => void;
}

const STORAGE_KEY = 'chronodesk-theme-store';

// Helper to apply CSS variables from palette to DOM
function applyPaletteToDOM(palette: ThemePalette, isDark: boolean, highContrast: boolean): void {
  const cssVars = paletteToCssVariables(palette, isDark);
  const hcVars = highContrast ? getHighContrastVariables(isDark) : {};
  const allVars = { ...cssVars, ...hcVars };

  const root = document.documentElement;
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  for (const [key, value] of Object.entries(allVars)) {
    root.style.setProperty(key, value);
  }
}

function getHighContrastVariables(isDark: boolean): Record<string, string> {
  if (isDark) {
    return {
      '--text-secondary': '#FAFAFA',
      '--text-muted': '#D4D4D4',
      '--border-default': '#FAFAFA',
    };
  }
  return {
    '--text-secondary': '#0A0A0A',
    '--text-muted': '#262626',
    '--border-default': '#0A0A0A',
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      themes: ALL_BUILT_IN_THEMES,
      activeThemeId: ALL_BUILT_IN_THEMES[0].id,
      circadianSettings: {
        latitude: 0,
        longitude: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        dawnOffsetMinutes: -30,
        duskOffsetMinutes: 30,
      },
      highContrast: false,
      mode: 'manual',

      // Computed
      activeTheme: ALL_BUILT_IN_THEMES[0],
      effectivePalette: ALL_BUILT_IN_THEMES[0].basePalette,
      isDark: true,
      currentPhase: null,
      currentSeason: 'winter',

      // Initialize from IPC
      initialize: async () => {
        try {
          const [dbThemes, activeId, circadian, contrast, mode] = await Promise.all([
            window.api?.theme?.list().catch(() => []) ?? [],
            window.api?.settings?.get().then(s => s.activeThemeId).catch(() => null),
            window.api?.theme?.circadian?.get().catch(() => null),
            window.api?.settings?.get().then(s => s.highContrast).catch(() => false),
            window.api?.settings?.get().then(s => s.themeMode).catch(() => 'manual'),
          ]);

          const normalizedCircadian = normalizeCircadianSettings(circadian || get().circadianSettings);
          
          // Merge custom themes from DB with built-ins (avoid duplicates)
          const customThemes = (dbThemes || []).filter((dt: ThemeConfig) => 
            !ALL_BUILT_IN_THEMES.some(bt => bt.id === dt.id)
          );

          // Filter out accidental duplicate custom themes from earlier sessions
          const stateThemes = get().themes || [];
          const existingCustom = stateThemes.filter(t => t.id.startsWith('custom-') && !t.name.endsWith('(Dark)'));

          const mergedThemes = [...ALL_BUILT_IN_THEMES, ...customThemes, ...existingCustom];
          const uniqueThemes = Array.from(new Map(mergedThemes.map(t => [t.id, t])).values());

          const targetActiveId = activeId || get().activeThemeId || ALL_BUILT_IN_THEMES[0].id;
          const resolvedActiveId = uniqueThemes.some(t => t.id === targetActiveId)
            ? targetActiveId
            : ALL_BUILT_IN_THEMES[0].id;

          set({
            themes: uniqueThemes,
            activeThemeId: resolvedActiveId,
            circadianSettings: normalizedCircadian,
            highContrast: Boolean(contrast),
            mode: (mode as ThemeMode) || 'manual',
          });

          get().updateComputed();
        } catch (error) {
          console.error('Failed to initialize theme store:', error);
          set({ themes: ALL_BUILT_IN_THEMES, activeThemeId: ALL_BUILT_IN_THEMES[0].id });
          get().updateComputed();
        }
      },

      setThemes: (themes) => set({ themes }),

      addTheme: (theme) => {
        set((state) => ({ themes: [...state.themes, theme] }));
        if (window.api?.theme?.create) {
          window.api.theme.create(theme).catch(() => {});
        }
      },

      updateTheme: (theme) => {
        set((state) => ({
          themes: state.themes.map((t) => (t.id === theme.id ? theme : t)),
        }));
        if (window.api?.theme?.update) {
          window.api.theme.update(theme).catch(() => {});
        }
      },

      deleteTheme: (id) => {
        set((state) => {
          const newThemes = state.themes.filter((t) => t.id !== id);
          const newActiveId = state.activeThemeId === id ? ALL_BUILT_IN_THEMES[0].id : state.activeThemeId;
          return { themes: newThemes, activeThemeId: newActiveId };
        });
        if (window.api?.theme?.delete) {
          window.api.theme.delete(id).catch(() => {});
        }
        get().updateComputed();
      },

      clearCustomThemes: () => {
        set((state) => {
          const onlyBuiltIns = state.themes.filter(t => !t.id.startsWith('custom-'));
          const fallbackId = ALL_BUILT_IN_THEMES[0].id;
          return {
            themes: onlyBuiltIns.length > 0 ? onlyBuiltIns : ALL_BUILT_IN_THEMES,
            activeThemeId: state.activeThemeId?.startsWith('custom-') ? fallbackId : state.activeThemeId,
          };
        });
        get().updateComputed();
      },

      setActiveTheme: async (id) => {
        try {
          if (window.api?.theme?.setActive) {
            await window.api.theme.setActive(id);
          }
        } catch {}
        set({ activeThemeId: id });
        get().updateComputed();
      },

      setMode: async (mode) => {
        try {
          if (window.api?.settings?.set) {
            await window.api.settings.set('themeMode', mode);
          }
        } catch {}
        set({ mode });
        get().updateComputed();
      },

      setHighContrast: async (enabled) => {
        try {
          if (window.api?.settings?.set) {
            await window.api.settings.set('highContrast', enabled);
          }
        } catch {}
        set({ highContrast: enabled });
        const { activeTheme, isDark } = get();
        if (activeTheme) {
          applyPaletteToDOM(activeTheme.basePalette, isDark, enabled);
        }
      },

      setCircadianSettings: async (settings) => {
        const normalized = normalizeCircadianSettings({ ...get().circadianSettings, ...settings });
        try {
          if (window.api?.theme?.circadian?.set) {
            await window.api.theme.circadian.set(normalized);
          }
        } catch {}
        set({ circadianSettings: normalized });
        get().updateComputed();
      },

      applyTheme: (palette, isDark) => {
        applyPaletteToDOM(palette, isDark, get().highContrast);
        set({ effectivePalette: palette, isDark });
      },

      updateComputed: () => {
        const { themes, activeThemeId, mode, circadianSettings, highContrast } = get();
        const allAvailable = themes.length > 0 ? themes : ALL_BUILT_IN_THEMES;
        const activeTheme = allAvailable.find((t) => t.id === activeThemeId) || allAvailable[0] || ALL_BUILT_IN_THEMES[0];

        let effectivePalette = activeTheme.basePalette;
        let isDark = effectivePalette.background.l < 0.5;

        if (mode === 'time-of-day' || mode === 'circadian') {
          const phase = getCurrentPhase(circadianSettings);
          const season = mode === 'circadian' && activeTheme.seasonalEnabled ? getCurrentSeason() : null;

          if (season) {
            effectivePalette = getCombinedPalette(activeTheme.basePalette, phase, season, isDark);
          } else {
            effectivePalette = getPhasePalette(activeTheme.basePalette, phase, isDark);
          }
          set({ currentPhase: phase });
        } else if (mode === 'seasonal' && activeTheme.seasonalEnabled) {
          const season = getCurrentSeason();
          effectivePalette = getSeasonalPalette(activeTheme.basePalette, season);
        }

        isDark = effectivePalette.background.l < 0.5;

        set({
          activeTheme,
          effectivePalette,
          isDark,
          currentSeason: getCurrentSeason(),
        });

        // Apply to DOM
        applyPaletteToDOM(effectivePalette, isDark, highContrast);
      },

      createCustomTheme: (name, baseColor, isDark) => {
        const baseOklch = hexToOklch(baseColor);
        const palette = generatePaletteFromBase(baseOklch, isDark);
        return {
          id: `custom-${Date.now()}`,
          name,
          mode: 'manual',
          basePalette: palette,
          circadianOffsetMinutes: 0,
          seasonalEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },

      previewTheme: (palette, isDark) => {
        applyPaletteToDOM(palette, isDark, get().highContrast);
        set({ effectivePalette: palette, isDark });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        circadianSettings: state.circadianSettings,
        highContrast: state.highContrast,
        mode: state.mode,
      }),
    }
  )
);

// Auto-update computed when mode/circadian changes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { mode } = useThemeStore.getState();
    if (mode === 'time-of-day' || mode === 'circadian') {
      useThemeStore.getState().updateComputed();
    }
  }, 60000);
}
