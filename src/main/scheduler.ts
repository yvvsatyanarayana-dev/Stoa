import { app, BrowserWindow } from 'electron'
import { icsMirrorDb } from './db'
import { syncMirror, syncAllMirrors } from './engine/icsMirror'
import type { ICSMirrorConfig } from '../types/sync'

function parseCronNextRun(cron: string): number {
  const now = Date.now()
  const parts = cron.trim().split(/\s+/)

  if (parts.length !== 5) {
    return now + 6 * 60 * 60 * 1000 // Default 6 hours
  }

  const [minute, hour] = parts

  // Simple implementation for common patterns
  // "0 */6 * * *" -> every 6 hours
  if (minute === '0' && hour.startsWith('*/')) {
    const intervalHours = parseInt(hour.substring(2), 10)
    return now + intervalHours * 60 * 60 * 1000
  }

  // "0 2 * * *" -> daily at 2:00
  if (minute === '0' && !isNaN(parseInt(hour, 10))) {
    const targetHour = parseInt(hour, 10)
    const nextRun = new Date()
    nextRun.setHours(targetHour, 0, 0, 0)
    if (nextRun.getTime() <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
    return nextRun.getTime()
  }

  // Default fallback
  return now + 6 * 60 * 60 * 1000
}

interface ScheduledMirror {
  mirror: ICSMirrorConfig
  timeoutId: NodeJS.Timeout | null
  nextRun: number
}

const scheduledMirrors = new Map<string, ScheduledMirror>()
let isInitialized = false

/**
 * Schedules a single mirror for periodic sync
 */
function scheduleMirror(mirror: ICSMirrorConfig): void {
  if (!mirror.enabled) return

  const existing = scheduledMirrors.get(mirror.id)
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId)
  }

  const nextRun = parseCronNextRun(mirror.scheduleCron)
  const delay = Math.max(0, nextRun - Date.now())

  const timeoutId = setTimeout(async () => {
    try {
      console.log(`[Scheduler] Running scheduled sync for mirror: ${mirror.name || mirror.id}`)
      await syncMirror(mirror)
    } catch (error) {
      console.error(`[Scheduler] Sync failed for mirror ${mirror.id}:`, error)
    } finally {
      // Reschedule
      const updatedMirror = icsMirrorDb.get(mirror.id)
      if (updatedMirror?.enabled) {
        scheduleMirror(updatedMirror)
      }
    }
  }, delay)

  scheduledMirrors.set(mirror.id, { mirror, timeoutId, nextRun })
  console.log(`[Scheduler] Scheduled mirror ${mirror.id} to run in ${Math.round(delay / 1000)}s`)
}

/**
 * Initializes the scheduler - loads all enabled mirrors
 */
export function initScheduler(_mainWindow: BrowserWindow): void {
  if (isInitialized) return

  const mirrors = icsMirrorDb.list(true) // enabled only
  for (const mirror of mirrors) {
    scheduleMirror(mirror)
  }

  isInitialized = true
  console.log(`[Scheduler] Initialized with ${mirrors.length} enabled mirrors`)
}

/**
 * Adds or updates a mirror in the scheduler
 */
export function scheduleMirrorSync(mirror: ICSMirrorConfig): void {
  if (!isInitialized) initScheduler({} as any)
  scheduleMirror(mirror)
}

/**
 * Removes a mirror from the scheduler
 */
export function unscheduleMirror(mirrorId: string): void {
  const existing = scheduledMirrors.get(mirrorId)
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId)
    scheduledMirrors.delete(mirrorId)
    console.log(`[Scheduler] Unscheduled mirror ${mirrorId}`)
  }
}

/**
 * Triggers immediate sync for a mirror
 */
export async function triggerMirrorSync(mirrorId: string): Promise<any> {
  const mirror = icsMirrorDb.get(mirrorId)
  if (!mirror) {
    throw new Error(`Mirror not found: ${mirrorId}`)
  }
  return syncMirror(mirror)
}

/**
 * Triggers immediate sync for all enabled mirrors
 */
export async function triggerAllMirrorsSync(maxConcurrent = 3): Promise<any[]> {
  return syncAllMirrors(maxConcurrent)
}

/**
 * Gets scheduler status for UI
 */
export function getSchedulerStatus(): {
  initialized: boolean
  scheduledCount: number
  nextRuns: Array<{ mirrorId: string; name: string; nextRun: number }>
} {
  const nextRuns = Array.from(scheduledMirrors.values()).map(({ mirror, nextRun }) => ({
    mirrorId: mirror.id,
    name: mirror.name || mirror.url,
    nextRun
  }))

  return {
    initialized: isInitialized,
    scheduledCount: scheduledMirrors.size,
    nextRuns: nextRuns.sort((a, b) => a.nextRun - b.nextRun)
  }
}

/**
 * Shuts down the scheduler
 */
export function stopScheduler(): void {
  for (const [, { timeoutId }] of scheduledMirrors) {
    if (timeoutId) clearTimeout(timeoutId)
  }
  scheduledMirrors.clear()
  isInitialized = false
  console.log('[Scheduler] Shutdown complete')
}

// Auto-initialize when app is ready (but only if not already initialized by main)
if (typeof app !== 'undefined') {
  app.whenReady().then(() => {
    // Don't auto-initialize here - main/index.ts will call initScheduler with the window
  })

  app.on('will-quit', () => {
    stopScheduler()
  })
}