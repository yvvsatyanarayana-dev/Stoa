import { BrowserWindow } from 'electron';
import { getDb } from '../db';

interface CircadianSettings {
  latitude: number;
  longitude: number;
  timezone: string;
  dawnOffsetMinutes: number;
  duskOffsetMinutes: number;
}

let schedulerInterval: NodeJS.Timeout | null = null;
let mainWindowRef: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow | null): void {
  mainWindowRef = window;
}

function getCircadianSettings(): CircadianSettings {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('circadianSettings') as { value: string } | undefined;
  if (row) {
    try {
      return JSON.parse(row.value);
    } catch {
      return getDefaultSettings();
    }
  }
  return getDefaultSettings();
}

function getDefaultSettings(): CircadianSettings {
  return {
    latitude: 0,
    longitude: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dawnOffsetMinutes: -30,
    duskOffsetMinutes: 30,
  };
}

function getActiveThemeMode(): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('themeMode') as { value: string } | undefined;
  return row?.value || 'manual';
}

function hasValidLocation(settings: CircadianSettings): boolean {
  return settings.latitude !== 0 || settings.longitude !== 0;
}

/**
 * Calculate next phase transition and schedule notification
 */
function scheduleNextTransition(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  const settings = getCircadianSettings();
  const mode = getActiveThemeMode();

  if (!hasValidLocation(settings) || (mode !== 'time-of-day' && mode !== 'circadian')) {
    return;
  }

  // Check every minute for phase changes
  schedulerInterval = setInterval(() => {
    checkPhaseTransition();
  }, 60000);

  // Initial check
  checkPhaseTransition();
}

function checkPhaseTransition(): void {
  const settings = getCircadianSettings();
  const mode = getActiveThemeMode();

  if (!hasValidLocation(settings) || (mode !== 'time-of-day' && mode !== 'circadian')) {
    return;
  }

  // Calculate current phase using suncalc logic (simplified for main process)
  const now = new Date();
  const times = getSunTimes(now, settings.latitude, settings.longitude);

  const dawnStart = new Date(times.dawn.getTime() + settings.dawnOffsetMinutes * 60 * 1000);
  const sunrise = times.sunrise;
  const sunset = times.sunset;
  const duskEnd = new Date(times.dusk.getTime() + settings.duskOffsetMinutes * 60 * 1000);

  let currentPhase: 'dawn' | 'day' | 'dusk' | 'night';
  if (now >= dawnStart && now < sunrise) currentPhase = 'dawn';
  else if (now >= sunrise && now < sunset) currentPhase = 'day';
  else if (now >= sunset && now < duskEnd) currentPhase = 'dusk';
  else currentPhase = 'night';

  // Notify renderer of phase change
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('theme:phase-changed', { phase: currentPhase });
  }
}

/**
 * Simplified sun time calculation for main process (no suncalc dependency)
 * Uses approximate calculations based on latitude/longitude
 */
function getSunTimes(date: Date, lat: number, lon: number) {
  // This is a simplified approximation
  // For production, consider using suncalc in main process too
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);

  // Approximate solar noon offset from UTC (longitude based)
  const solarNoonOffset = lon / 15; // hours

  // Approximate day length variation
  const axialTilt = 23.44;
  const latRad = lat * Math.PI / 180;
  const declination = axialTilt * Math.sin(2 * Math.PI * (dayOfYear - 81) / 365) * Math.PI / 180;
  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declination));
  const dayLengthHours = 2 * hourAngle * 180 / Math.PI / 15;

  const solarNoon = new Date(date);
  solarNoon.setHours(12 - solarNoonOffset, 0, 0, 0);

  const halfDayMs = (dayLengthHours / 2) * 3600000;
  const sunrise = new Date(solarNoon.getTime() - halfDayMs);
  const sunset = new Date(solarNoon.getTime() + halfDayMs);

  // Civil dawn/dusk (sun 6° below horizon)
  const civilTwilightMs = 30 * 60000; // ~30 minutes

  return {
    dawn: new Date(sunrise.getTime() - civilTwilightMs),
    sunrise,
    sunset,
    dusk: new Date(sunset.getTime() + civilTwilightMs),
  };
}

export function startThemeScheduler(): void {
  scheduleNextTransition();

  // Also listen for settings changes
  // For now, just start the interval
  // Settings change handling can be added via IPC listeners
}

export function stopThemeScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

// Re-export for IPC handlers
export { getCircadianSettings, getDefaultSettings, getActiveThemeMode };