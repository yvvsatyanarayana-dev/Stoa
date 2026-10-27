import { Notification, shell, BrowserWindow } from 'electron'
import { notificationLogDb, reminderDb, settingsDb } from './db'
import type { CalendarEvent, Reminder } from '../types'

export function showReminderNotification(reminder: Reminder, event: CalendarEvent, mainWindow?: BrowserWindow | null): void {
  const settings = settingsDb.get()

  // Quiet hours check
  if (settings.quiet_hours_enabled && settings.quiet_hours_start && settings.quiet_hours_end) {
    const now = new Date()
    const currentH = now.getHours()
    const currentM = now.getMinutes()
    const currentTimeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`

    if (settings.quiet_hours_start < settings.quiet_hours_end) {
      if (currentTimeStr >= settings.quiet_hours_start && currentTimeStr <= settings.quiet_hours_end) {
        console.log(`[Notification] Suppressed due to quiet hours (${settings.quiet_hours_start} - ${settings.quiet_hours_end})`)
        return
      }
    } else {
      // Over midnight
      if (currentTimeStr >= settings.quiet_hours_start || currentTimeStr <= settings.quiet_hours_end) {
        console.log(`[Notification] Suppressed due to quiet hours (${settings.quiet_hours_start} - ${settings.quiet_hours_end})`)
        return
      }
    }
  }

  const startTimeStr = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const subtitle = `Starting at ${startTimeStr}${event.location ? ` • ${event.location}` : ''}`
  const body = event.description ? `${subtitle}\n${event.description}` : subtitle

  // Show native notification
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: event.title,
      subtitle: subtitle,
      body: body,
      urgency: event.priority === 'urgent' ? 'critical' : 'normal',
      timeoutType: 'never',
      actions: [
        ...(event.meeting_url ? [{ type: 'button' as const, text: 'Join Meeting' }] : []),
        { type: 'button' as const, text: 'Snooze 10m' },
        { type: 'button' as const, text: 'Dismiss' }
      ]
    })

    notif.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      notificationLogDb.add({
        id: `notif-${Date.now()}`,
        event_id: event.id,
        title: event.title,
        body: body,
        shown_at: new Date().toISOString(),
        action_taken: 'opened'
      })
    })

    notif.on('action', (_, index) => {
      if (event.meeting_url && index === 0) {
        shell.openExternal(event.meeting_url)
        reminderDb.dismiss(reminder.id)
        notificationLogDb.add({
          id: `notif-${Date.now()}`,
          event_id: event.id,
          title: event.title,
          body: body,
          shown_at: new Date().toISOString(),
          action_taken: 'joined'
        })
      } else {
        // Snooze or Dismiss
        const isSnooze = event.meeting_url ? index === 1 : index === 0
        if (isSnooze) {
          reminderDb.snooze(reminder.id, 10)
          notificationLogDb.add({
            id: `notif-${Date.now()}`,
            event_id: event.id,
            title: event.title,
            body: body,
            shown_at: new Date().toISOString(),
            action_taken: 'snoozed'
          })
        } else {
          reminderDb.dismiss(reminder.id)
          notificationLogDb.add({
            id: `notif-${Date.now()}`,
            event_id: event.id,
            title: event.title,
            body: body,
            shown_at: new Date().toISOString(),
            action_taken: 'dismissed'
          })
        }
      }
    })

    notif.show()
  }

  // Always log to notifications table
  notificationLogDb.add({
    id: `notif-${Date.now()}`,
    event_id: event.id,
    title: event.title,
    body: body,
    shown_at: new Date().toISOString(),
    action_taken: 'shown' as any
  })

  // Broadcast to renderer in-app notification center
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notification:received', {
      reminder,
      event,
      timestamp: new Date().toISOString()
    })
  }
}
