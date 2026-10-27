# ChronoDesk Pro

**Professional Electron Scheduling, Timetable Builder & Event Management Desktop Application**

Built with Electron, React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, and SQLite (`node:sqlite`).

---

## 🌟 Core Features Implemented

1. **Advanced Timetable Builder (Core Module)**
   - Weekly scheduling grid (Monday to Friday/Sunday) with configurable hour slots.
   - Session slot assignment with Subject, Trainer/Person, Room badge, and A/B week rotation pattern.
   - Built-in real-time conflict detector: warns when a trainer or room is double-booked across overlapping time windows.
   - Export timetable directly to CSV and print-ready format.

2. **Full-Featured Calendar Engine**
   - **Week View:** 7-day grid with hourly rows and color-coded event cards.
   - **Day View:** High-resolution single-day agenda with hour indicators.
   - **Month View:** Calendar grid with daily event count pills.
   - **Agenda View:** Chronological event feed with direct "Join Meeting" links.
   - Multiple calendar sources with color coding and visibility toggles.

3. **Professional Event Organizer & Room Booking**
   - Event creation & editing modal with real-time conflict detection and free-slot recommendations.
   - Multi-resource allocation: assign rooms (e.g. Executive Boardroom), equipment, and key personnel.
   - Meeting URL integration (Teams, Zoom, Google Meet) with 1-click join.
   - Priority levels (`low`, `medium`, `high`, `urgent`) and status flags (`confirmed`, `tentative`, `cancelled`).

4. **Background Scheduler & Reminder System**
   - Main process timer loop polling every 10 seconds.
   - Offline catch-up: triggers missed reminders immediately upon app boot or wake from sleep.
   - Native OS notification support + in-app notification center.
   - Snooze controls (5m, 10m, 15m, 30m) and historical event notification logs.

5. **Analytics & Utilization Dashboard**
   - "Next Up" countdown card with time remaining counter and 1-click join.
   - Today's executive schedule timeline.
   - Active boardrooms, trainers/personnel count, and category distribution charts.

6. **Settings & Customization**
   - 12h / 24h clock selection, starting day of week, default timezone.
   - Quiet Hours / Focus Mode configuration to mute non-urgent alerts.
   - Export branding with custom organization name and footer watermark.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run the hot-reloading dev environment (Main + Preload + React Renderer):
```bash
npm run dev
```

### 3. Type Checking
```bash
npm run typecheck
```

### 4. Build Production Artifacts
```bash
# Build Vite bundles
npm run build

# Package desktop installer for Windows (.exe)
npm run build:win

# Package for macOS
npm run build:mac

# Package for Linux
npm run build:linux
```

---

## 🏗️ Architecture & Security

- **Strict Process Isolation:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` with a typed preload bridge (`window.api`).
- **Database:** SQLite with WAL mode (`PRAGMA journal_mode = WAL`) and foreign key constraints enabled.
- **Local-First:** All events, timetables, and resource allocations are stored locally on the user's machine with zero telemetry.
