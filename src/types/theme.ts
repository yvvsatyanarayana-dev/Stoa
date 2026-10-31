export type ThemeMode = 'manual' | 'time-of-day' | 'circadian' | 'seasonal';
export type TimeOfDayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type DensityMode = 'compact' | 'comfy' | 'spacious';
export type MotionPreference = 'reduce' | 'normal';

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

export interface TypographyScale {
  fontScale: number;           // Global font size multiplier (default: 1)
  lineHeightScale: number;     // Global line height multiplier (default: 1)
  fontFamilyBase: string;      // Base font family
  fontFamilyMono: string;      // Monospace font family
  fontFamilyHeading?: string;  // Optional heading font family
}

export interface SpacingScale {
  spaceUnit: number;           // Base spacing unit in px (default: 4)
  radiusBase: number;          // Base border radius in px (default: 8)
  radiusSm: number;            // Small border radius multiplier (default: 0.5)
  radiusLg: number;            // Large border radius multiplier (default: 1.5)
  radiusXl: number;            // Extra large border radius multiplier (default: 2)
}

export interface MotionScale {
  motionReduce: boolean;       // Respect prefers-reduced-motion
  transitionFast: number;      // Fast transition duration in ms (default: 150)
  transitionNormal: number;    // Normal transition duration in ms (default: 250)
  transitionSlow: number;      // Slow transition duration in ms (default: 350)
}

export interface ComponentThemeOverride {
  componentId: string;
  palette?: Partial<ThemePalette>;
  typography?: Partial<TypographyScale>;
  spacing?: Partial<SpacingScale>;
  motion?: Partial<MotionScale>;
  customCss?: string;
}

export interface ThemedVariants {
  print?: Partial<ThemePalette>;
  highContrast?: Partial<ThemePalette>;
  sepia?: Partial<ThemePalette>;
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

  // Optional advanced styling settings
  density?: DensityMode;
  typography?: TypographyScale;
  spacing?: SpacingScale;
  motion?: MotionScale;
  componentOverrides?: ComponentThemeOverride[];
  themedVariants?: ThemedVariants;
  customCss?: string;

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
  background: { l: 0.16, c: 0, h: 0 },         // #0E0E0E Deep Matte Canvas
  surface: { l: 0.11, c: 0, h: 0 },            // #080808 Grounded Sidebar
  surfaceElevated: { l: 0.21, c: 0, h: 0 },    // #181818 Elevated Card / Modal
  primary: { l: 0.98, c: 0, h: 0 },            // #F9F9F9 Crisp White Monochromatic Accent
  primaryHover: { l: 0.88, c: 0, h: 0 },       // #E0E0E0
  text: { l: 0.98, c: 0, h: 0 },              // #F9F9F9 Primary White Text
  textMuted: { l: 0.55, c: 0, h: 0 },         // #737373 Neutral Gray Muted
  border: { l: 0.35, c: 0, h: 0 },            // #383838 Crisp, Visible Borders & Grid Lines
  eventStops: [
    { l: 0.98, c: 0, h: 0 }, // #F9F9F9 Crisp White
    { l: 0.83, c: 0, h: 0 }, // #D4D4D4 Light Gray
    { l: 0.65, c: 0, h: 0 }, // #A3A3A3 Mid Gray
    { l: 0.48, c: 0, h: 0 }, // #737373 Neutral Slate Gray
    { l: 0.35, c: 0, h: 0 }, // #4A4A4A Dark Slate Gray
    { l: 0.22, c: 0, h: 0 }, // #282828 Charcoal Gray
  ],
};

export const DEFAULT_TYPOGRAPHY: TypographyScale = {
  fontScale: 1,
  lineHeightScale: 1,
  fontFamilyBase: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  fontFamilyMono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
};

export const DEFAULT_SPACING: SpacingScale = {
  spaceUnit: 4,
  radiusBase: 8,
  radiusSm: 0.5,
  radiusLg: 1.5,
  radiusXl: 2,
};

export const DEFAULT_MOTION: MotionScale = {
  motionReduce: false,
  transitionFast: 150,
  transitionNormal: 250,
  transitionSlow: 350,
};

export const DEFAULT_THEMED_VARIANTS: ThemedVariants = {
  print: {},
  highContrast: {},
  sepia: {},
};

// Density mode multipliers
export const DENSITY_MULTIPLIERS: Record<DensityMode, { space: number; radius: number; fontSize: number; lineHeight: number }> = {
  compact: { space: 0.75, radius: 0.75, fontSize: 0.875, lineHeight: 1.25 },
  comfy: { space: 1, radius: 1, fontSize: 1, lineHeight: 1.5 },
  spacious: { space: 1.5, radius: 1.25, fontSize: 1.125, lineHeight: 1.75 },
};

// Preset theme configurations
export const PRESET_THEMES: Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Stoa Dark (Monochrome)',
    mode: 'manual',
    basePalette: DEFAULT_DARK_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    density: 'comfy',
    typography: DEFAULT_TYPOGRAPHY,
    spacing: DEFAULT_SPACING,
    motion: DEFAULT_MOTION,
    componentOverrides: [],
    themedVariants: DEFAULT_THEMED_VARIANTS,
    customCss: '',
  },
  {
    name: 'Stoa Light (Monochrome)',
    mode: 'manual',
    basePalette: DEFAULT_BW_PALETTE,
    circadianOffsetMinutes: 0,
    seasonalEnabled: false,
    density: 'comfy',
    typography: DEFAULT_TYPOGRAPHY,
    spacing: DEFAULT_SPACING,
    motion: DEFAULT_MOTION,
    componentOverrides: [],
    themedVariants: DEFAULT_THEMED_VARIANTS,
    customCss: '',
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
    density: 'comfy',
    typography: DEFAULT_TYPOGRAPHY,
    spacing: DEFAULT_SPACING,
    motion: DEFAULT_MOTION,
    componentOverrides: [],
    themedVariants: DEFAULT_THEMED_VARIANTS,
    customCss: '',
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
    density: 'comfy',
    typography: DEFAULT_TYPOGRAPHY,
    spacing: DEFAULT_SPACING,
    motion: DEFAULT_MOTION,
    componentOverrides: [],
    themedVariants: DEFAULT_THEMED_VARIANTS,
    customCss: '',
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