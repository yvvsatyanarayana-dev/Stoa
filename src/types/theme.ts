export type ThemeMode = 'manual' | 'time-of-day' | 'circadian' | 'seasonal';
export type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface OKLCHColor {
  l: number;  // 0-1
  c: number;  // 0-0.4
  h: number;  // 0-360
}

export interface ThemePalette {
  // Semantic roles (mapped to CSS variables)
  background: OKLCHColor;
  surface: OKLCHColor;
  surfaceElevated: OKLCHColor;
  primary: OKLCHColor;
  primaryHover: OKLCHColor;
  text: OKLCHColor;
  textMuted: OKLCHColor;
  border: OKLCHColor;
  // Event shades (6-stop ramp)
  eventStops: OKLCHColor[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: ThemeMode;
  basePalette: ThemePalette;
  circadianOffsetMinutes?: number;
  seasonalEnabled: boolean;
  customPhasePalettes?: Partial<Record<TimeOfDayPhase, ThemePalette>>;
  customSeasonalPalettes?: Partial<Record<Season, ThemePalette>>;
  createdAt: string;
  updatedAt: string;
}

export interface CircadianSettings {
  latitude: number;
  longitude: number;
  timezone: string;
  dawnOffsetMinutes: number;
  duskOffsetMinutes: number;
}

// Default B&W theme (matches current theme.css)
export const DEFAULT_BW_PALETTE: ThemePalette = {
  background: { l: 1.0, c: 0, h: 0 },        // #FFFFFF
  surface: { l: 0.96, c: 0, h: 0 },           // #F7F7F7
  surfaceElevated: { l: 1.0, c: 0, h: 0 },    // #FFFFFF
  primary: { l: 0.04, c: 0, h: 0 },           // #0A0A0A
  primaryHover: { l: 0.15, c: 0, h: 0 },      // #262626
  text: { l: 0.04, c: 0, h: 0 },              // #0A0A0A
  textMuted: { l: 0.54, c: 0, h: 0 },         // #8A8A8A
  border: { l: 0.81, c: 0, h: 0 },            // #CFCFCF
  eventStops: [
    { l: 0.04, c: 0, h: 0 },   // #0A0A0A
    { l: 0.25, c: 0, h: 0 },   // #404040
    { l: 0.45, c: 0, h: 0 },   // #737373
    { l: 0.64, c: 0, h: 0 },   // #A3A3A3
    { l: 0.83, c: 0, h: 0 },   // #D4D4D4
    { l: 1.0, c: 0, h: 0 },    // #FFFFFF (outlined)
  ],
};

export const DEFAULT_DARK_PALETTE: ThemePalette = {
  background: { l: 0.0, c: 0, h: 0 },         // #000000
  surface: { l: 0.04, c: 0, h: 0 },           // #0A0A0A
  surfaceElevated: { l: 0.07, c: 0, h: 0 },   // #111111
  primary: { l: 1.0, c: 0, h: 0 },            // #FFFFFF
  primaryHover: { l: 0.9, c: 0, h: 0 },       // #E5E5E5
  text: { l: 0.98, c: 0, h: 0 },              // #FAFAFA
  textMuted: { l: 0.45, c: 0, h: 0 },         // #737373
  border: { l: 0.18, c: 0, h: 0 },            // #2E2E2E
  eventStops: [
    { l: 1.0, c: 0, h: 0 },    // #FFFFFF
    { l: 0.83, c: 0, h: 0 },   // #D4D4D4
    { l: 0.64, c: 0, h: 0 },   // #A3A3A3
    { l: 0.45, c: 0, h: 0 },   // #737373
    { l: 0.25, c: 0, h: 0 },   // #404040
    { l: 0.0, c: 0, h: 0 },    // #000000 (outlined)
  ],
};

// Preset theme configurations
export const PRESET_THEMES: Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ChronoDesk Dark (B&W)',
    mode: 'manual',
    basePalette: DEFAULT_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
  },
  {
    name: 'ChronoDesk Light (B&W)',
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
];

// Seasonal hue shifts (degrees)
export const SEASONAL_HUE_SHIFT: Record<Season, number> = {
  spring: 15,    // slightly greener
  summer: 30,    // warmer
  autumn: -15,   // warmer/oranger
  winter: -30,   // cooler/bluer
};

// Time-of-day lightness adjustments
export const PHASE_LIGHTNESS_ADJUSTMENT: Record<TimeOfDayPhase, { bg: number; text: number }> = {
  dawn: { bg: 0.02, text: -0.02 },    // slightly lighter bg, darker text
  day: { bg: 0, text: 0 },            // base
  dusk: { bg: -0.02, text: 0.02 },    // slightly darker bg, lighter text
  night: { bg: -0.05, text: 0.05 },   // darker bg, lighter text (for dark mode feel)
};