import { BrowserWindow } from 'electron'
import { reminderDb } from './db'
import { showReminderNotification } from './notifications'

let timerInterval: NodeJS.Timeout | null = null
let mainWindowRef: BrowserWindow | null = null

export function initScheduler(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow

  // Immediate catch-up check for reminders that became due while offline/sleeping
  runReminderCheck()

  // Run periodic check every 10 seconds
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    runReminderCheck()
  }, 10000)

  console.log('[Scheduler] Reminder engine started (10-second polling interval + sleep catch-up)')
}

export function stopScheduler(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

export function runReminderCheck(): void {
  try {
    const dueList = reminderDb.getDueReminders()
    if (dueList.length > 0) {
      console.log(`[Scheduler] Firing ${dueList.length} due reminders...`)
      for (const { reminder, event } of dueList) {
        showReminderNotification(reminder, event, mainWindowRef)
        reminderDb.markFired(reminder.id)
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error during reminder poll:', err)
  }
}
