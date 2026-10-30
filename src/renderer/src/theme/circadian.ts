import { getTimes, getPosition } from 'suncalc';
import type { CircadianSettings, TimeOfDayPhase } from '../../../types/theme';

/**
 * Get current time-of-day phase based on sun position
 */
export function getCurrentPhase(settings: CircadianSettings): TimeOfDayPhase {
  const now = new Date();
  const times = getTimes(now, settings.latitude, settings.longitude);

  // Handle polar regions where sun times might be null
  const dawn = times.dawn ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
  const sunrise = times.sunrise ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
  const sunset = times.sunset ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
  const dusk = times.dusk ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);

  // Apply offsets
  const dawnStart = new Date(dawn.getTime() + settings.dawnOffsetMinutes * 60 * 1000);
  const duskEnd = new Date(dusk.getTime() + settings.duskOffsetMinutes * 60 * 1000);

  if (now >= dawnStart && now < sunrise) return 'dawn';
  if (now >= sunrise && now < sunset) return 'day';
  if (now >= sunset && now < duskEnd) return 'dusk';
  return 'night';
}

/**
 * Get phase transition times for today
 */
export function getPhaseTransitions(settings: CircadianSettings): Record<TimeOfDayPhase, Date> {
  const now = new Date();
  const times = getTimes(now, settings.latitude, settings.longitude);

  const dawn = times.dawn ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
  const sunrise = times.sunrise ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
  const sunset = times.sunset ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
  const dusk = times.dusk ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);

  return {
    dawn: new Date(dawn.getTime() + settings.dawnOffsetMinutes * 60 * 1000),
    day: sunrise,
    dusk: sunset,
    night: new Date(dusk.getTime() + settings.duskOffsetMinutes * 60 * 1000),
  };
}

/**
 * Get next phase transition time
 */
export function getNextTransition(settings: CircadianSettings): { phase: TimeOfDayPhase; time: Date } {
  const now = new Date();
  const transitions = getPhaseTransitions(settings);
  const phases: TimeOfDayPhase[] = ['dawn', 'day', 'dusk', 'night'];

  for (const phase of phases) {
    if (transitions[phase] > now) {
      return { phase, time: transitions[phase] };
    }
  }

  // Next day's dawn
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = getTimes(tomorrow, settings.latitude, settings.longitude);
  const tomorrowDawn = tomorrowTimes.dawn ?? new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 6, 0, 0);

  return {
    phase: 'dawn',
    time: new Date(tomorrowDawn.getTime() + settings.dawnOffsetMinutes * 60 * 1000),
  };
}

/**
 * Get time until next phase transition (milliseconds)
 */
export function getTimeUntilNextTransition(settings: CircadianSettings): number {
  const { time } = getNextTransition(settings);
  return time.getTime() - Date.now();
}

/**
 * Default circadian settings (fallback to UTC if no location)
 */
export function getDefaultCircadianSettings(): CircadianSettings {
  return {
    latitude: 0,
    longitude: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dawnOffsetMinutes: -30,
    duskOffsetMinutes: 30,
  };
}

/**
 * Validate and normalize circadian settings
 */
export function normalizeCircadianSettings(settings: Partial<CircadianSettings>): CircadianSettings {
  const defaults = getDefaultCircadianSettings();
  return {
    latitude: clamp(settings.latitude ?? defaults.latitude, -90, 90),
    longitude: clamp(settings.longitude ?? defaults.longitude, -180, 180),
    timezone: settings.timezone || defaults.timezone,
    dawnOffsetMinutes: clamp(settings.dawnOffsetMinutes ?? defaults.dawnOffsetMinutes, -120, 120),
    duskOffsetMinutes: clamp(settings.duskOffsetMinutes ?? defaults.duskOffsetMinutes, -120, 120),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get sun position for advanced calculations (elevation, azimuth)
 */
export function getSunPosition(settings: CircadianSettings, date: Date = new Date()) {
  return getPosition(date, settings.latitude, settings.longitude);
}

/**
 * Check if location is valid (not 0,0 default)
 */
export function hasValidLocation(settings: CircadianSettings): boolean {
  return settings.latitude !== 0 || settings.longitude !== 0;
}

/**
 * Format phase name for display
 */
export function formatPhaseName(phase: TimeOfDayPhase): string {
  const names: Record<TimeOfDayPhase, string> = {
    dawn: 'Dawn',
    day: 'Day',
    dusk: 'Dusk',
    night: 'Night',
  };
  return names[phase];
}

/**
 * Get phase icon
 */
export function getPhaseIcon(phase: TimeOfDayPhase): string {
  const icons: Record<TimeOfDayPhase, string> = {
    dawn: 'sunrise',
    day: 'sun',
    dusk: 'sunset',
    night: 'moon',
  };
  return icons[phase];
}