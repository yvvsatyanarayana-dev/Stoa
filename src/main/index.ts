import { app, shell, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase } from './db'
import { registerIpcHandlers, setIpcMainWindow } from './ipc'
import { initScheduler, stopScheduler } from './scheduler'
import { startThemeScheduler, stopThemeScheduler, setMainWindow as setThemeSchedulerMainWindow } from './theme/ThemeScheduler'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    frame: false, // Frameless window with app-themed custom titlebar
    autoHideMenuBar: true,
    title: 'Stoa',
    icon,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Provide main window to IPC handlers for minimize, maximize, close
  setIpcMainWindow(mainWindow)
  setThemeSchedulerMainWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Start the background reminder scheduler
  initScheduler(mainWindow)
  // Start the theme scheduler for circadian/seasonal phase transitions
  startThemeScheduler()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.stoa.app')

  // Initialize SQLite database
  initDatabase()

  // Register all typed IPC handlers
  registerIpcHandlers()

  // Register global shortcut for Command Palette (⌘K / Ctrl+K)
  globalShortcut.register('CommandOrControl+K', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcuts:command-palette')
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopScheduler()
  stopThemeScheduler()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
