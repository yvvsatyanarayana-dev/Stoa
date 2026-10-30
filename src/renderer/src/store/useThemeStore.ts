import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeConfig, ThemePalette, ThemeMode, TimeOfDayPhase, CircadianSettings } from '../../../types/theme';
import { PRESET_THEMES } from '../../../types/theme';
import { getCurrentPhase, normalizeCircadianSettings } from '../theme/circadian';
import { getPhasePalette, getSeasonalPalette, getCombinedPalette, getCurrentSeason } from '../theme/ThemePresets';
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
      themes: [],
      activeThemeId: null,
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
      activeTheme: null,
      effectivePalette: null,
      isDark: true,
      currentPhase: null,
      currentSeason: 'winter',

      // Initialize from IPC
      initialize: async () => {
        try {
          const [themes, activeId, circadian, contrast, mode] = await Promise.all([
            window.api.theme.list(),
            window.api.settings.get().then(s => s.activeThemeId),
            window.api.theme.circadian.get(),
            window.api.settings.get().then(s => s.highContrast),
            window.api.settings.get().then(s => s.themeMode),
          ]);

          const normalizedCircadian = normalizeCircadianSettings(circadian);
          const initialThemes = themes.length > 0 ? themes : PRESET_THEMES.map((p, i) => ({
            ...p,
            id: `preset-${i}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          set({
            themes: initialThemes,
            activeThemeId: activeId || initialThemes[0].id,
            circadianSettings: normalizedCircadian,
            highContrast: contrast || false,
            mode: mode || 'manual',
          });

          get().updateComputed();
        } catch (error) {
          console.error('Failed to initialize theme store:', error);
          // Fallback to defaults
          const fallbackThemes = PRESET_THEMES.map((p, i) => ({
            ...p,
            id: `preset-${i}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          set({ themes: fallbackThemes, activeThemeId: fallbackThemes[0].id });
          get().updateComputed();
        }
      },

      setThemes: (themes) => set({ themes }),

      addTheme: (theme) => set((state) => ({ themes: [...state.themes, theme] })),

      updateTheme: (theme) => set((state) => ({
        themes: state.themes.map((t) => (t.id === theme.id ? theme : t)),
      })),

      deleteTheme: (id) => set((state) => {
        const newThemes = state.themes.filter((t) => t.id !== id);
        const newActiveId = state.activeThemeId === id ? newThemes[0]?.id || null : state.activeThemeId;
        return { themes: newThemes, activeThemeId: newActiveId };
      }),

      setActiveTheme: async (id) => {
        await window.api.theme.setActive(id);
        set({ activeThemeId: id });
        get().updateComputed();
      },

      setMode: async (mode) => {
        await window.api.settings.set('themeMode', mode);
        set({ mode });
        get().updateComputed();
      },

      setHighContrast: async (enabled) => {
        await window.api.settings.set('highContrast', enabled);
        set({ highContrast: enabled });
        const { activeTheme, isDark } = get();
        if (activeTheme) {
          applyPaletteToDOM(activeTheme.basePalette, isDark, enabled);
        }
      },

      setCircadianSettings: async (settings) => {
        const normalized = normalizeCircadianSettings({ ...get().circadianSettings, ...settings });
        await window.api.theme.circadian.set(normalized);
        set({ circadianSettings: normalized });
        get().updateComputed();
      },

      applyTheme: (palette, isDark) => {
        applyPaletteToDOM(palette, isDark, get().highContrast);
        set({ effectivePalette: palette, isDark });
      },

      updateComputed: () => {
        const { themes, activeThemeId, mode, circadianSettings, highContrast } = get();
        const activeTheme = themes.find((t) => t.id === activeThemeId) || themes[0] || null;

        if (!activeTheme) {
          set({ activeTheme: null, effectivePalette: null, isDark: true, currentPhase: null, currentSeason: 'winter' });
          return;
        }

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
  // Update every minute for time-of-day changes
  setInterval(() => {
    const { mode } = useThemeStore.getState();
    if (mode === 'time-of-day' || mode === 'circadian') {
      useThemeStore.getState().updateComputed();
    }
  }, 60000);
}