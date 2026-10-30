import type { ThemeConfig, ThemePalette, TimeOfDayPhase, Season } from '../../../types/theme';
import { DEFAULT_BW_PALETTE, SEASONAL_HUE_SHIFT } from '../../../types/theme';
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

/**
 * Built-in theme presets for quick selection
 */
export const BUILT_IN_PRESETS: Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ChronoDesk Classic (B&W)',
    mode: 'manual',
    basePalette: DEFAULT_BW_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
  },
  {
    name: 'Warm Sepia',
    mode: 'manual',
    basePalette: {
      ...DEFAULT_BW_PALETTE,
      background: { l: 0.97, c: 0.02, h: 45 },
      surface: { l: 0.93, c: 0.02, h: 45 },
      surfaceElevated: { l: 0.97, c: 0.02, h: 45 },
      primary: { l: 0.25, c: 0.03, h: 35 },
      primaryHover: { l: 0.35, c: 0.04, h: 35 },
      text: { l: 0.15, c: 0.02, h: 35 },
      textMuted: { l: 0.45, c: 0.02, h: 35 },
      border: { l: 0.7, c: 0.02, h: 40 },
      eventStops: [
        { l: 0.15, c: 0.03, h: 35 },
        { l: 0.3, c: 0.03, h: 35 },
        { l: 0.45, c: 0.03, h: 35 },
        { l: 0.6, c: 0.02, h: 40 },
        { l: 0.75, c: 0.02, h: 40 },
        { l: 0.95, c: 0.01, h: 45 },
      ],
    },
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
  },
  {
    name: 'Cool Slate',
    mode: 'manual',
    basePalette: {
      ...DEFAULT_BW_PALETTE,
      background: { l: 0.98, c: 0.01, h: 210 },
      surface: { l: 0.94, c: 0.01, h: 210 },
      surfaceElevated: { l: 0.98, c: 0.01, h: 210 },
      primary: { l: 0.15, c: 0.02, h: 220 },
      primaryHover: { l: 0.25, c: 0.03, h: 220 },
      text: { l: 0.1, c: 0.01, h: 220 },
      textMuted: { l: 0.5, c: 0.01, h: 220 },
      border: { l: 0.75, c: 0.01, h: 215 },
      eventStops: [
        { l: 0.1, c: 0.02, h: 220 },
        { l: 0.28, c: 0.02, h: 220 },
        { l: 0.45, c: 0.02, h: 220 },
        { l: 0.62, c: 0.01, h: 215 },
        { l: 0.78, c: 0.01, h: 215 },
        { l: 0.96, c: 0.005, h: 210 },
      ],
    },
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
  },
  {
    name: 'Forest Green',
    mode: 'manual',
    basePalette: {
      ...DEFAULT_BW_PALETTE,
      background: { l: 0.97, c: 0.015, h: 140 },
      surface: { l: 0.93, c: 0.015, h: 140 },
      surfaceElevated: { l: 0.97, c: 0.015, h: 140 },
      primary: { l: 0.2, c: 0.04, h: 150 },
      primaryHover: { l: 0.3, c: 0.05, h: 150 },
      text: { l: 0.12, c: 0.02, h: 150 },
      textMuted: { l: 0.45, c: 0.015, h: 145 },
      border: { l: 0.7, c: 0.015, h: 140 },
      eventStops: [
        { l: 0.12, c: 0.04, h: 150 },
        { l: 0.28, c: 0.035, h: 150 },
        { l: 0.44, c: 0.03, h: 148 },
        { l: 0.6, c: 0.02, h: 145 },
        { l: 0.75, c: 0.015, h: 142 },
        { l: 0.94, c: 0.01, h: 140 },
      ],
    },
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
  },
  {
    name: 'Ocean Blue',
    mode: 'manual',
    basePalette: {
      ...DEFAULT_BW_PALETTE,
      background: { l: 0.97, c: 0.015, h: 200 },
      surface: { l: 0.93, c: 0.015, h: 200 },
      surfaceElevated: { l: 0.97, c: 0.015, h: 200 },
      primary: { l: 0.25, c: 0.05, h: 210 },
      primaryHover: { l: 0.35, c: 0.06, h: 210 },
      text: { l: 0.1, c: 0.02, h: 210 },
      textMuted: { l: 0.45, c: 0.015, h: 205 },
      border: { l: 0.7, c: 0.015, h: 200 },
      eventStops: [
        { l: 0.1, c: 0.05, h: 210 },
        { l: 0.28, c: 0.045, h: 210 },
        { l: 0.44, c: 0.035, h: 208 },
        { l: 0.6, c: 0.02, h: 205 },
        { l: 0.75, c: 0.015, h: 202 },
        { l: 0.94, c: 0.01, h: 200 },
      ],
    },
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
  },
];

/**
 * Dark mode variants of built-in presets
 */
export function getDarkVariant(preset: Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'>): Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...preset,
    name: `${preset.name} (Dark)`,
    basePalette: {
      ...preset.basePalette,
      background: { l: 0.03, c: preset.basePalette.background.c, h: preset.basePalette.background.h },
      surface: { l: 0.06, c: preset.basePalette.surface.c, h: preset.basePalette.surface.h },
      surfaceElevated: { l: 0.09, c: preset.basePalette.surfaceElevated.c, h: preset.basePalette.surfaceElevated.h },
      primary: { l: 0.98, c: 0, h: 0 },
      primaryHover: { l: 0.85, c: 0, h: 0 },
      text: { l: 0.98, c: preset.basePalette.text.c, h: preset.basePalette.text.h },
      textMuted: { l: 0.6, c: preset.basePalette.textMuted.c, h: preset.basePalette.textMuted.h },
      border: { l: 0.18, c: preset.basePalette.border.c, h: preset.basePalette.border.h },
      eventStops: preset.basePalette.eventStops.map(s => ({
        l: 1 - s.l,
        c: s.c,
        h: s.h,
      })).reverse(),
    },
  };
}

/**
 * All presets including dark variants
 */
export function getAllPresets(): Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'>[] {
  const light = BUILT_IN_PRESETS;
  const dark = BUILT_IN_PRESETS.map(getDarkVariant);
  return [...light, ...dark];
}