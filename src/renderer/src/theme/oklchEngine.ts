import { oklch, formatHex, parse, interpolate } from 'culori';
import type { OKLCHColor, ThemePalette } from '../../../types/theme';

/**
 * Convert OKLCHColor to culori OKLCH format
 */
export function toCuloriOklch(color: OKLCHColor) {
  return { mode: 'oklch' as const, l: color.l, c: color.c, h: color.h ?? 0 };
}

/**
 * Convert culori OKLCH to our OKLCHColor format
 */
export function fromCuloriOklch(color: any): OKLCHColor {
  if (!color) return { l: 0, c: 0, h: 0 };
  const asOklch = color.mode === 'oklch' ? color : oklch(color);
  return { l: asOklch?.l ?? 0, c: asOklch?.c ?? 0, h: asOklch?.h ?? 0 };
}

/**
 * Convert OKLCHColor to hex string
 */
export function oklchToHex(color: OKLCHColor): string {
  const hex = formatHex(toCuloriOklch(color));
  return hex || (color.l > 0.5 ? '#ffffff' : '#000000');
}

/**
 * Parse hex string to OKLCHColor
 */
export function hexToOklch(hex: string): OKLCHColor {
  const parsed = parse(hex);
  if (!parsed) return { l: 0, c: 0, h: 0 };
  const asOklch = parsed.mode === 'oklch' ? parsed : oklch(parsed);
  return { l: asOklch?.l ?? 0, c: asOklch?.c ?? 0, h: asOklch?.h ?? 0 };
}

/**
 * Interpolate between two OKLCH colors
 */
export function interpolateOklch(
  from: OKLCHColor,
  to: OKLCHColor,
  t: number
): OKLCHColor {
  const fromCulori = toCuloriOklch(from);
  const toCulori = toCuloriOklch(to);
  const interpolated = interpolate([fromCulori, toCulori], 'oklch')(t);
  return fromCuloriOklch(interpolated);
}

/**
 * Generate a 6-stop event shade ramp from a base color
 * Stops go from dark to light (for light theme) or light to dark (for dark theme)
 */
export function generateEventStops(base: OKLCHColor, isDark: boolean): OKLCHColor[] {
  const stops: OKLCHColor[] = [];
  const steps = 6;

  if (isDark) {
    // Dark theme: light to dark
    const lightest = { ...base, l: Math.min(base.l + 0.3, 1.0) };
    const darkest = { ...base, l: Math.max(base.l - 0.3, 0.0) };
    for (let i = 0; i < steps; i++) {
      stops.push(interpolateOklch(lightest, darkest, i / (steps - 1)));
    }
  } else {
    // Light theme: dark to light
    const darkest = { ...base, l: Math.max(base.l - 0.3, 0.0) };
    const lightest = { ...base, l: Math.min(base.l + 0.3, 1.0) };
    for (let i = 0; i < steps; i++) {
      stops.push(interpolateOklch(darkest, lightest, i / (steps - 1)));
    }
  }

  return stops;
}

/**
 * Apply hue shift to a palette (for seasonal variations)
 */
export function shiftPaletteHue(palette: ThemePalette, hueShiftDegrees: number): ThemePalette {
  const shiftHue = (color: OKLCHColor): OKLCHColor => ({
    ...color,
    h: (color.h + hueShiftDegrees + 360) % 360,
  });

  return {
    background: shiftHue(palette.background),
    surface: shiftHue(palette.surface),
    surfaceElevated: shiftHue(palette.surfaceElevated),
    primary: shiftHue(palette.primary),
    primaryHover: shiftHue(palette.primaryHover),
    text: shiftHue(palette.text),
    textMuted: shiftHue(palette.textMuted),
    border: shiftHue(palette.border),
    eventStops: palette.eventStops.map(shiftHue),
  };
}

/**
 * Apply lightness adjustment for time-of-day phases
 */
export function adjustPaletteForPhase(
  palette: ThemePalette,
  phase: 'dawn' | 'day' | 'dusk' | 'night',
  isDark: boolean
): ThemePalette {
  const adjustments = isDark
    ? { dawn: { bg: -0.02, text: 0.02 }, day: { bg: 0, text: 0 }, dusk: { bg: 0.02, text: -0.02 }, night: { bg: 0.05, text: -0.05 } }
    : { dawn: { bg: 0.02, text: -0.02 }, day: { bg: 0, text: 0 }, dusk: { bg: -0.02, text: 0.02 }, night: { bg: -0.05, text: 0.05 } };

  const adj = adjustments[phase];

  const adjustLightness = (color: OKLCHColor, delta: number): OKLCHColor => ({
    ...color,
    l: Math.max(0, Math.min(1, color.l + delta)),
  });

  return {
    background: adjustLightness(palette.background, adj.bg),
    surface: adjustLightness(palette.surface, adj.bg),
    surfaceElevated: adjustLightness(palette.surfaceElevated, adj.bg),
    primary: adjustLightness(palette.primary, adj.text),
    primaryHover: adjustLightness(palette.primaryHover, adj.text),
    text: adjustLightness(palette.text, adj.text),
    textMuted: adjustLightness(palette.textMuted, adj.text),
    border: adjustLightness(palette.border, adj.bg),
    eventStops: palette.eventStops.map(s => adjustLightness(s, adj.text)),
  };
}

/**
 * Generate a complete ThemePalette from a single base color
 * This is used by the Theme Studio for live preview
 */
export function generatePaletteFromBase(
  baseColor: OKLCHColor,
  isDark: boolean
): ThemePalette {
  // Determine text color based on background lightness
  const bgLightness = baseColor.l;
  const textLightness = isDark ? Math.min(bgLightness + 0.8, 1.0) : Math.max(bgLightness - 0.8, 0.0);
  const textChroma = Math.min(baseColor.c * 0.5, 0.05);

  const background = { ...baseColor };
  const surface = { ...baseColor, l: isDark ? Math.min(baseColor.l + 0.04, 1) : Math.max(baseColor.l - 0.04, 0) };
  const surfaceElevated = { ...baseColor, l: isDark ? Math.min(baseColor.l + 0.07, 1) : Math.max(baseColor.l - 0.02, 0) };

  const primary = isDark
    ? { l: 0.98, c: 0, h: 0 }  // White for dark theme
    : { l: 0.04, c: 0, h: 0 }; // Black for light theme

  const primaryHover = isDark
    ? { l: 0.85, c: 0, h: 0 }
    : { l: 0.15, c: 0, h: 0 };

  return {
    background,
    surface,
    surfaceElevated,
    primary,
    primaryHover,
    text: { l: textLightness, c: textChroma, h: baseColor.h },
    textMuted: { l: isDark ? textLightness - 0.3 : textLightness + 0.3, c: textChroma, h: baseColor.h },
    border: { l: isDark ? background.l + 0.1 : background.l - 0.1, c: baseColor.c * 0.5, h: baseColor.h },
    eventStops: generateEventStops(baseColor, isDark),
  };
}

/**
 * Convert a full ThemePalette to CSS variable map
 */
export function paletteToCssVariables(palette: ThemePalette, isDark: boolean): Record<string, string> {
  const clampL = (val: number): number => Math.max(0, Math.min(1, val));

  const vars: Record<string, string> = {
    [`--bg-app`]: oklchToHex(palette.background),
    [`--bg-sidebar`]: oklchToHex(palette.surface),
    [`--bg-elevated`]: oklchToHex(palette.surfaceElevated),
    [`--bg-subtle`]: oklchToHex({ ...palette.surface, l: clampL(isDark ? palette.surface.l + 0.05 : palette.surface.l - 0.04) }),
    [`--bg-hover`]: oklchToHex({ ...palette.surface, l: clampL(isDark ? palette.surface.l + 0.09 : palette.surface.l - 0.07) }),
    [`--bg-active`]: oklchToHex({ ...palette.surface, l: clampL(isDark ? palette.surface.l + 0.14 : palette.surface.l - 0.11) }),

    [`--text-primary`]: oklchToHex(palette.text),
    [`--text-secondary`]: oklchToHex({ ...palette.text, l: clampL(isDark ? palette.text.l - 0.25 : palette.text.l + 0.25) }),
    [`--text-muted`]: oklchToHex(palette.textMuted),
    [`--text-inverse`]: oklchToHex(isDark ? palette.background : palette.text),

    [`--border-subtle`]: oklchToHex({ ...palette.border, l: clampL(isDark ? palette.border.l - 0.06 : palette.border.l + 0.06) }),
    [`--border-default`]: oklchToHex(palette.border),
    [`--border-strong`]: oklchToHex({ ...palette.border, l: clampL(isDark ? palette.border.l + 0.14 : palette.border.l - 0.14) }),

    [`--accent`]: oklchToHex(palette.primary),
    [`--accent-hover`]: oklchToHex(palette.primaryHover),
    [`--accent-active`]: oklchToHex({ ...palette.primary, l: clampL(isDark ? palette.primary.l - 0.08 : palette.primary.l + 0.08) }),
    [`--accent-text`]: palette.primary.l > 0.6 ? '#0E0E0E' : '#FFFFFF',

    [`--focus-ring`]: `0 0 0 2px ${oklchToHex(isDark ? palette.background : { l: 1, c: 0, h: 0 })}, 0 0 0 4px ${isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'}`,

    // Calendar specifics
    [`--cal-grid-line`]: oklchToHex(palette.border),
    [`--cal-hour-line`]: oklchToHex({ ...palette.border, l: clampL(isDark ? palette.border.l + 0.08 : palette.border.l - 0.08) }),
    [`--cal-today-bg`]: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
    [`--cal-weekend-bg`]: oklchToHex({ ...palette.background, l: clampL(isDark ? palette.background.l - 0.03 : palette.background.l + 0.02) }),
    [`--cal-now-line`]: '#EF4444',
    [`--cal-selected-bg`]: oklchToHex(palette.primary),
    [`--cal-selected-text`]: palette.primary.l > 0.6 ? '#0E0E0E' : '#FFFFFF',

    // Status
    [`--status-confirmed`]: oklchToHex(palette.primary),
    [`--status-tentative`]: '#A3A3A3',
    [`--status-cancelled`]: '#737373',

    // Shadows
    [`--shadow-sm`]: `0 1px 3px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,.06)'}`,
    [`--shadow-md`]: `0 4px 16px -2px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,.10)'}`,
    [`--shadow-lg`]: `0 20px 40px -10px ${isDark ? 'rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)' : 'rgba(0,0,0,.16)'}`,

    // Scrollbars
    [`--scrollbar-thumb`]: oklchToHex(palette.border),
    [`--scrollbar-thumb-hover`]: oklchToHex({ ...palette.border, l: clampL(isDark ? palette.border.l + 0.16 : palette.border.l - 0.16) }),
    [`--scrollbar-thumb-active`]: oklchToHex(palette.textMuted),
    [`--scrollbar-track`]: 'transparent',
  };

  // Event stops
  if (palette.eventStops && palette.eventStops.length > 0) {
    palette.eventStops.forEach((stop, idx) => {
      const stopHex = oklchToHex(stop);
      const textHex = stop.l > 0.55 ? '#000000' : '#FFFFFF';
      vars[`--event-${idx + 1}-bg`] = stopHex;
      vars[`--event-${idx + 1}-text`] = textHex;
    });
  }

  return vars;
}

/**
 * High contrast variants
 */
export function getHighContrastVariables(isDark: boolean): Record<string, string> {
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