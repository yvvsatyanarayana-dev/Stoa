import type { ThemeConfig, ThemePalette, TimeOfDayPhase, Season } from '../../../types/theme';
import { DEFAULT_BW_PALETTE, DEFAULT_DARK_PALETTE, SEASONAL_HUE_SHIFT } from '../../../types/theme';
import { shiftPaletteHue, adjustPaletteForPhase } from './oklchEngine';

/**
 * Get phase-specific palette for time-of-day mode
 */
export function getPhasePalette(basePalette: ThemePalette, phase: TimeOfDayPhase, isDark: boolean): ThemePalette {
  return adjustPaletteForPhase(basePalette, phase, isDark);
}

/**
 * Get seasonal palette
 */
export function getSeasonalPalette(basePalette: ThemePalette, season: Season): ThemePalette {
  const hueShift = SEASONAL_HUE_SHIFT[season];
  return shiftPaletteHue(basePalette, hueShift);
}

/**
 * Get combined phase + seasonal palette
 */
export function getCombinedPalette(
  basePalette: ThemePalette,
  phase: TimeOfDayPhase,
  season: Season,
  isDark: boolean
): ThemePalette {
  const seasonal = getSeasonalPalette(basePalette, season);
  return getPhasePalette(seasonal, phase, isDark);
}

/**
 * Current season based on date
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';  // Mar-May
  if (month >= 5 && month <= 7) return 'summer';  // Jun-Aug
  if (month >= 8 && month <= 10) return 'autumn'; // Sep-Nov
  return 'winter'; // Dec-Feb
}

// ----------------------------------------------------
// Core Palettes (Light & Dark)
// ----------------------------------------------------

// User's Crimson & Linen Palette (#6D0808, #2D0000, #757D6F, #EEEAD7)
export const CRIMSON_DARK_PALETTE: ThemePalette = {
  background: { l: 0.12, c: 0.05, h: 28 },         // Deep wine night
  surface: { l: 0.18, c: 0.07, h: 29 },            // #2D0000 Dark Burgundy
  surfaceElevated: { l: 0.23, c: 0.08, h: 29 },    // Rich elevated burgundy
  primary: { l: 0.58, c: 0.20, h: 28 },            // Vibrant Ruby Crimson (#6D0808 tuned for dark contrast)
  primaryHover: { l: 0.68, c: 0.22, h: 28 },
  text: { l: 0.94, c: 0.025, h: 97 },              // Linen Cream (#EEEAD7)
  textMuted: { l: 0.65, c: 0.025, h: 130 },        // Sage (#757D6F)
  border: { l: 0.28, c: 0.04, h: 29 },
  eventStops: [
    { l: 0.62, c: 0.22, h: 28 },  // Crimson
    { l: 0.52, c: 0.16, h: 45 },  // Amber Wine
    { l: 0.65, c: 0.06, h: 130 }, // Sage Slate (#757D6F)
    { l: 0.40, c: 0.12, h: 20 },  // Dark Cherry
    { l: 0.75, c: 0.14, h: 32 },  // Coral
    { l: 0.92, c: 0.03, h: 97 },  // Linen
  ],
};

export const CRIMSON_LIGHT_PALETTE: ThemePalette = {
  background: { l: 0.95, c: 0.025, h: 97 },        // Linen Cream (#EEEAD7)
  surface: { l: 0.90, c: 0.03, h: 97 },            // Soft Linen
  surfaceElevated: { l: 0.98, c: 0.015, h: 97 },   // Crisp Cream
  primary: { l: 0.35, c: 0.14, h: 28 },            // Deep Crimson Red (#6D0808)
  primaryHover: { l: 0.45, c: 0.16, h: 28 },
  text: { l: 0.18, c: 0.075, h: 29 },              // Deep Burgundy (#2D0000)
  textMuted: { l: 0.48, c: 0.025, h: 130 },        // Sage Slate (#757D6F)
  border: { l: 0.78, c: 0.02, h: 100 },
  eventStops: [
    { l: 0.35, c: 0.14, h: 28 },  // Crimson (#6D0808)
    { l: 0.48, c: 0.15, h: 45 },  // Rich Amber
    { l: 0.45, c: 0.04, h: 130 }, // Sage (#757D6F)
    { l: 0.28, c: 0.10, h: 20 },  // Burgundy
    { l: 0.58, c: 0.16, h: 32 },  // Terracotta
    { l: 0.22, c: 0.06, h: 29 },  // Espresso
  ],
};

// Forest Green
export const FOREST_DARK_PALETTE: ThemePalette = {
  background: { l: 0.14, c: 0.025, h: 150 },
  surface: { l: 0.18, c: 0.03, h: 150 },
  surfaceElevated: { l: 0.22, c: 0.035, h: 150 },
  primary: { l: 0.72, c: 0.18, h: 150 },           // Vibrant Emerald (#32c364)
  primaryHover: { l: 0.80, c: 0.19, h: 150 },
  text: { l: 0.96, c: 0.01, h: 150 },
  textMuted: { l: 0.65, c: 0.02, h: 145 },
  border: { l: 0.27, c: 0.025, h: 150 },
  eventStops: [
    { l: 0.72, c: 0.18, h: 150 }, // Vivid Emerald
    { l: 0.65, c: 0.14, h: 175 }, // Mint Cyan
    { l: 0.68, c: 0.15, h: 120 }, // Lime Moss
    { l: 0.50, c: 0.12, h: 155 }, // Forest Pine
    { l: 0.82, c: 0.12, h: 145 }, // Pale Sage
    { l: 0.35, c: 0.08, h: 150 }, // Deep Cypress
  ],
};

export const FOREST_LIGHT_PALETTE: ThemePalette = {
  background: { l: 0.98, c: 0.015, h: 140 },
  surface: { l: 0.94, c: 0.02, h: 140 },
  surfaceElevated: { l: 1.0, c: 0, h: 0 },
  primary: { l: 0.38, c: 0.14, h: 150 },            // Deep Pine Green
  primaryHover: { l: 0.48, c: 0.15, h: 150 },
  text: { l: 0.12, c: 0.025, h: 150 },
  textMuted: { l: 0.48, c: 0.02, h: 145 },
  border: { l: 0.78, c: 0.02, h: 140 },
  eventStops: [
    { l: 0.38, c: 0.14, h: 150 },
    { l: 0.45, c: 0.12, h: 175 },
    { l: 0.42, c: 0.13, h: 120 },
    { l: 0.55, c: 0.10, h: 155 },
    { l: 0.65, c: 0.08, h: 145 },
    { l: 0.28, c: 0.08, h: 150 },
  ],
};

// Ocean Blue
export const OCEAN_DARK_PALETTE: ThemePalette = {
  background: { l: 0.14, c: 0.03, h: 225 },
  surface: { l: 0.18, c: 0.035, h: 225 },
  surfaceElevated: { l: 0.22, c: 0.04, h: 225 },
  primary: { l: 0.70, c: 0.18, h: 220 },            // Electric Sky Blue (#00b5eb)
  primaryHover: { l: 0.78, c: 0.19, h: 220 },
  text: { l: 0.96, c: 0.015, h: 220 },
  textMuted: { l: 0.65, c: 0.02, h: 215 },
  border: { l: 0.27, c: 0.03, h: 225 },
  eventStops: [
    { l: 0.70, c: 0.18, h: 220 }, // Sky Blue
    { l: 0.65, c: 0.15, h: 260 }, // Indigo
    { l: 0.68, c: 0.15, h: 195 }, // Cyan
    { l: 0.50, c: 0.14, h: 235 }, // Royal Blue
    { l: 0.82, c: 0.12, h: 210 }, // Ice Blue
    { l: 0.35, c: 0.09, h: 230 }, // Midnight
  ],
};

export const OCEAN_LIGHT_PALETTE: ThemePalette = {
  background: { l: 0.98, c: 0.015, h: 215 },
  surface: { l: 0.94, c: 0.02, h: 215 },
  surfaceElevated: { l: 1.0, c: 0, h: 0 },
  primary: { l: 0.40, c: 0.16, h: 225 },            // Deep Cobalt
  primaryHover: { l: 0.50, c: 0.17, h: 225 },
  text: { l: 0.12, c: 0.025, h: 220 },
  textMuted: { l: 0.48, c: 0.02, h: 215 },
  border: { l: 0.78, c: 0.02, h: 215 },
  eventStops: [
    { l: 0.40, c: 0.16, h: 225 },
    { l: 0.46, c: 0.14, h: 260 },
    { l: 0.44, c: 0.13, h: 195 },
    { l: 0.56, c: 0.11, h: 235 },
    { l: 0.68, c: 0.09, h: 210 },
    { l: 0.28, c: 0.08, h: 230 },
  ],
};

// Warm Sepia / Amber
export const SEPIA_DARK_PALETTE: ThemePalette = {
  background: { l: 0.14, c: 0.025, h: 50 },
  surface: { l: 0.18, c: 0.03, h: 50 },
  surfaceElevated: { l: 0.22, c: 0.035, h: 50 },
  primary: { l: 0.76, c: 0.16, h: 55 },             // Golden Amber (#fd923e)
  primaryHover: { l: 0.84, c: 0.17, h: 55 },
  text: { l: 0.96, c: 0.015, h: 50 },
  textMuted: { l: 0.65, c: 0.025, h: 45 },
  border: { l: 0.27, c: 0.025, h: 50 },
  eventStops: [
    { l: 0.76, c: 0.16, h: 55 },  // Gold
    { l: 0.68, c: 0.18, h: 35 },  // Warm Orange
    { l: 0.72, c: 0.12, h: 80 },  // Olive Amber
    { l: 0.52, c: 0.14, h: 40 },  // Bronze
    { l: 0.85, c: 0.10, h: 60 },  // Wheat
    { l: 0.35, c: 0.08, h: 45 },  // Dark Roast
  ],
};

export const SEPIA_LIGHT_PALETTE: ThemePalette = {
  background: { l: 0.97, c: 0.02, h: 55 },
  surface: { l: 0.93, c: 0.025, h: 55 },
  surfaceElevated: { l: 1.0, c: 0.01, h: 55 },
  primary: { l: 0.42, c: 0.14, h: 45 },             // Warm Bronze Amber
  primaryHover: { l: 0.52, c: 0.15, h: 45 },
  text: { l: 0.14, c: 0.025, h: 45 },
  textMuted: { l: 0.48, c: 0.02, h: 45 },
  border: { l: 0.76, c: 0.02, h: 50 },
  eventStops: [
    { l: 0.42, c: 0.14, h: 45 },
    { l: 0.48, c: 0.15, h: 35 },
    { l: 0.46, c: 0.11, h: 80 },
    { l: 0.58, c: 0.12, h: 50 },
    { l: 0.68, c: 0.09, h: 55 },
    { l: 0.26, c: 0.07, h: 40 },
  ],
};

// Cool Slate
export const SLATE_DARK_PALETTE: ThemePalette = {
  background: { l: 0.13, c: 0.015, h: 220 },
  surface: { l: 0.17, c: 0.02, h: 220 },
  surfaceElevated: { l: 0.21, c: 0.025, h: 220 },
  primary: { l: 0.76, c: 0.12, h: 225 },            // Ice Slate Blue
  primaryHover: { l: 0.84, c: 0.13, h: 225 },
  text: { l: 0.96, c: 0.01, h: 220 },
  textMuted: { l: 0.65, c: 0.015, h: 215 },
  border: { l: 0.26, c: 0.02, h: 220 },
  eventStops: [
    { l: 0.76, c: 0.12, h: 225 },
    { l: 0.68, c: 0.10, h: 250 },
    { l: 0.72, c: 0.09, h: 190 },
    { l: 0.52, c: 0.10, h: 230 },
    { l: 0.85, c: 0.08, h: 215 },
    { l: 0.35, c: 0.06, h: 220 },
  ],
};

export const SLATE_LIGHT_PALETTE: ThemePalette = {
  background: { l: 0.98, c: 0.01, h: 215 },
  surface: { l: 0.94, c: 0.015, h: 215 },
  surfaceElevated: { l: 1.0, c: 0, h: 0 },
  primary: { l: 0.35, c: 0.08, h: 225 },            // Steel Slate
  primaryHover: { l: 0.45, c: 0.09, h: 225 },
  text: { l: 0.12, c: 0.015, h: 220 },
  textMuted: { l: 0.48, c: 0.015, h: 215 },
  border: { l: 0.78, c: 0.015, h: 215 },
  eventStops: [
    { l: 0.35, c: 0.08, h: 225 },
    { l: 0.45, c: 0.09, h: 250 },
    { l: 0.42, c: 0.07, h: 190 },
    { l: 0.55, c: 0.07, h: 230 },
    { l: 0.68, c: 0.05, h: 215 },
    { l: 0.25, c: 0.05, h: 220 },
  ],
};

// ----------------------------------------------------
// Complete List of All Built-In Themes
// ----------------------------------------------------

export const ALL_BUILT_IN_THEMES: ThemeConfig[] = [
  // 1. ChronoDesk Dark (Monochrome B&W)
  {
    id: 'preset-classic-dark',
    name: 'ChronoDesk Dark (Monochrome)',
    mode: 'manual',
    basePalette: DEFAULT_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 2. ChronoDesk Classic B&W (Light)
  {
    id: 'preset-classic-light',
    name: 'ChronoDesk Classic (Light B&W)',
    mode: 'manual',
    basePalette: DEFAULT_BW_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 3. Crimson & Linen (Dark) - User Palette (#6D0808, #2D0000, #757D6F, #EEEAD7)
  {
    id: 'preset-crimson-dark',
    name: 'Crimson & Linen (Dark)',
    mode: 'manual',
    basePalette: CRIMSON_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 4. Crimson & Linen (Light)
  {
    id: 'preset-crimson-light',
    name: 'Crimson & Linen (Light)',
    mode: 'manual',
    basePalette: CRIMSON_LIGHT_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 5. Forest Green (Dark)
  {
    id: 'preset-forest-dark',
    name: 'Forest Green (Dark)',
    mode: 'manual',
    basePalette: FOREST_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 6. Forest Green (Light)
  {
    id: 'preset-forest-light',
    name: 'Forest Green (Light)',
    mode: 'manual',
    basePalette: FOREST_LIGHT_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 7. Ocean Blue (Dark)
  {
    id: 'preset-ocean-dark',
    name: 'Ocean Blue (Dark)',
    mode: 'manual',
    basePalette: OCEAN_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 8. Ocean Blue (Light)
  {
    id: 'preset-ocean-light',
    name: 'Ocean Blue (Light)',
    mode: 'manual',
    basePalette: OCEAN_LIGHT_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 9. Warm Sepia (Dark)
  {
    id: 'preset-sepia-dark',
    name: 'Warm Sepia (Dark)',
    mode: 'manual',
    basePalette: SEPIA_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 10. Warm Sepia (Light)
  {
    id: 'preset-sepia-light',
    name: 'Warm Sepia (Light)',
    mode: 'manual',
    basePalette: SEPIA_LIGHT_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 11. Cool Slate (Dark)
  {
    id: 'preset-slate-dark',
    name: 'Cool Slate (Dark)',
    mode: 'manual',
    basePalette: SLATE_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // 12. Cool Slate (Light)
  {
    id: 'preset-slate-light',
    name: 'Cool Slate (Light)',
    mode: 'manual',
    basePalette: SLATE_LIGHT_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const BUILT_IN_PRESETS = ALL_BUILT_IN_THEMES;

export function getAllPresets(): ThemeConfig[] {
  return ALL_BUILT_IN_THEMES;
}
