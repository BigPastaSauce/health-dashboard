# Changelog

All notable changes to the Health Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-19 — Premium Redesign + Gamification

### Added

- **Gamification System**
  - Level system with XP (Rookie → Immortal, 15+ levels)
  - 10 achievement badges: Iron Sleeper, Recovery King, Beast Mode, Consistent, Zen Master, Early Bird, Night Owl, Hydrated, Marathon, Comeback
  - Badge progress tracking (e.g., "5/7 days")
  - Daily streak counter with flame icon (recovery streak)
  - Data tracking streak badge
  - Daily challenges based on weak areas
  - Level Dashboard popup (click level badge to open)
    - Full badge grid with earned/locked states
    - Level tier progression visualization
    - XP breakdown by source
    - Streak tracking (current + longest)

- **Animations (Framer Motion)**
  - Stagger-in on page load for all cards
  - Recovery ring animated stroke fill with radial glow pulse (>60%)
  - Strain gauge with animated needle (real gauge behavior)
  - Count-up animation on all big numbers
  - Charts fade-in with scale-up
  - Card hover lift + border glow
  - Badge spring entrance with rotation
  - Comparison arrows with infinite bounce
  - Tab switching with animated pill indicator

- **Visual Redesign**
  - Deep dark theme (#0a0a0f) with radial gradient overlays
  - Glass morphism cards (backdrop-blur-xl, translucent borders)
  - Consistent color system: green (recovery), blue (sleep), orange/red (strain), purple (HRV)
  - Monospace tabular-nums on all numeric displays
  - Hover glow effects on all cards

- Sport-specific emoji icons for workouts (commuting, activity, functional fitness, etc.)
- Streak badge always visible (🔥 active / ❄️ inactive)
- Tooltip on streak badge explaining requirements
- Achievement bar with level, streaks, badges, daily goal

### Changed

- Recovery Ring: enlarged to 260px, text-7xl score, centered layout with stats pinned to bottom
- Strain Gauge: real gauge behavior with pivot dot, needle swings from 0-21, "Strain" label below number
- Sleep Summary: bigger text throughout (6xl hours, base times, lg metrics)
- Body Stats: 3xl values, sm labels, increased padding
- All charts: better axis readability, no cut-off labels
- Sleep Debt: red SEVERE badge with glow
- Calories: bigger total number, better bar spacing
- Workouts: more padding, icons in containers
- Calendar: better nav buttons, improved contrast
- Weight: huge number display, gradient area fill
- WidgetCard: increased padding (p-6), consistent spacing

### Fixed

- Recovery ring and strain gauge centering in grid cells
- Chart axis labels getting cut off
- Quick stats row readability
- Sleep stage time readability

## [0.1.0] - Initial Build

### Added

- Whoop health data integration via REST API
- Recovery, Sleep, Strain tracking with trend charts
- HRV trend chart
- Sleep debt tracker with severity levels
- Health score composite calculation
- Health calendar with day-by-day data
- Workout log with activity tracking
- Vitals card (RHR, HRV, SpO2, Skin Temp)
- Weight tracker
- Calories burned breakdown (Activity + BMR)
- Body stats display
- Draggable widget grid layout
- Chart timeframe controls (7D/30D/90D/1Y)
- Backend Express server on port 3003
- Frontend Vite dev server on port 5173
