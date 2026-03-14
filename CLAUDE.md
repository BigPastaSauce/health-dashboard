# Health Dashboard — Build Instructions

## What to Build
A **Whoop-style health dashboard** web app that displays all of Nami's health metrics from his Whoop device. This is a LOCAL dashboard that reads from JSON files on the computer.

## Tech Stack
- **React + Vite** (NOT Next.js — keep it simple and fast)
- **Tailwind CSS** for styling
- **Recharts** for charts/graphs
- **react-grid-layout** for draggable/reorganizable widgets
- **Framer Motion** for animations
- **Express** backend to serve health data from JSON files

## Design Requirements — WHOOP STYLE
- **Dark theme** — near-black background (#1a1a2e or similar dark navy/charcoal)
- **Whoop's signature colors**: Green (#00E676 / #16DB65) for recovery, Yellow (#FFD600) for moderate, Red (#FF1744) for low
- **Clean, modern fonts** — use Inter or similar sans-serif
- **Circular progress rings** for recovery score (like Whoop app)
- **Smooth gradients** on charts
- **Card-based layout** with subtle borders and shadows
- **Minimalist** — lots of breathing room, no clutter

## Data Source
Health data JSON files are at: `C:\Users\clawdbot\Health Data\`
- `master-log.json` — array of all daily records
- `daily-logs/YYYY-MM-DD.json` — individual day files
- Sleep debt data: `C:\Users\clawdbot\Projects\whoop-integration\data\sleep-debt.json`
- All-time sleep debt: `C:\Users\clawdbot\Projects\whoop-integration\data\sleep-debt-alltime.json`

### Sample data structure (one day):
```json
{
  "date": "2026-03-14",
  "logged_at": "2026-03-14T00:32:42Z",
  "recovery": {
    "score": 94,
    "zone": "GREEN",
    "resting_heart_rate": 53,
    "hrv_rmssd_milli": 80.9,
    "spo2_percentage": 97.0,
    "skin_temp_celsius": 33.0,
    "user_calibrating": false
  },
  "sleep": {
    "total_sleep_hrs": 10.22,
    "total_in_bed_hrs": 10.88,
    "total_awake_hrs": 0.66,
    "deep_sleep_hrs": 1.9,
    "rem_sleep_hrs": 1.6,
    "light_sleep_hrs": 6.72,
    "sleep_cycles": 9,
    "disturbances": 9,
    "respiratory_rate": 16.4,
    "sleep_performance_pct": 76,
    "sleep_consistency_pct": 15,
    "sleep_efficiency_pct": 94.1,
    "sleep_needed": {
      "baseline_hrs": 7.8,
      "from_debt_hrs": 2.1,
      "from_strain_hrs": 0.2,
      "from_nap_hrs": -5.4
    }
  },
  "strain": {
    "strain": 14.0,
    "calories": 2754,
    "kilojoule": 11522.9,
    "average_heart_rate": 73,
    "max_heart_rate": 170
  },
  "workouts": [
    {
      "sport": "activity",
      "duration_min": 63,
      "strain": 9.3,
      "average_heart_rate": 121,
      "max_heart_rate": 170,
      "calories": 467,
      "hr_zones": {
        "zone0_min": 1.7,
        "zone1_min": 49,
        "zone2_min": 11.4,
        "zone3_min": 0.6,
        "zone4_min": 0.3,
        "zone5_min": 0
      }
    }
  ],
  "body": {
    "weight_lbs": 246.9,
    "weight_kg": 112.0,
    "height_m": 1.7272,
    "max_heart_rate": 188
  }
}
```

## Dashboard Widgets (ALL required)

### 1. Recovery Ring (Hero Widget)
- Large circular progress ring showing recovery % (like Whoop app)
- Color: green/yellow/red based on zone
- Show recovery score big in center
- Below: RHR, HRV, SpO2, Skin Temp in a row

### 2. Sleep Summary
- Horizontal stacked bar showing sleep stages (deep=blue, REM=purple, light=cyan, awake=red)
- Total sleep hours prominently displayed
- Sleep performance %, efficiency %, consistency %
- Respiratory rate
- Disturbances count
- Sleep needed breakdown

### 3. Strain Gauge
- Circular or arc gauge showing strain (0-21 scale)
- Calories burned
- Avg HR, Max HR

### 4. Sleep Debt Tracker
- Show 7-day rolling debt with bar chart (green for surplus, red for deficit days)
- All-time cumulative number prominently displayed
- Best day / worst day
- Current streak

### 5. HRV Trend
- Line chart showing HRV over time (as data accumulates)
- 7-day average line overlay

### 6. Weight Tracker
- Line chart showing weight over time
- Current weight prominently displayed

### 7. Workout Log
- List of recent workouts with sport, duration, strain, calories
- HR zone breakdown bar for each workout

### 8. Recovery Trend
- Line chart showing recovery score over time
- Color-coded dots (green/yellow/red)

### 9. Sleep Trend
- Area chart showing sleep hours over time
- Stacked by stage

### 10. Body Stats Card
- Height, weight, max HR, current BMR calculation

## Edit Mode (Drag & Reorganize)
- **Edit button** in top-right corner (pencil icon or "Edit Layout")
- When toggled ON:
  - Widgets get a subtle dashed border
  - Widgets become draggable and resizable
  - Grid snapping for clean alignment
- When toggled OFF:
  - Layout saves to localStorage
  - Widgets lock in place
- Use **react-grid-layout** for this

## Server
Create a simple Express server that:
- Serves the React app
- Has API endpoint: `GET /api/health` — returns master-log.json contents
- Has API endpoint: `GET /api/health/:date` — returns specific day
- Has API endpoint: `GET /api/sleep-debt` — returns sleep debt data
- Has API endpoint: `GET /api/sleep-debt/alltime` — returns all-time sleep debt
- Runs on port **3002** (3000 is Deli, 3001 is crypto bot dashboard)

## Critical Rules
- NO mistakes — test everything works before committing
- Use port 3002
- Dark theme ONLY (no light mode needed)
- All charts must handle 1 day of data gracefully (we only have 1 day so far)
- Responsive layout
- MUST include the edit/drag feature
- Commit when done

## User Info (for body stats calculation)
- Name: Nami
- Age: 23
- Height: 5'8" (173cm)
- Weight: ~247 lbs (112 kg)
- Max HR: 188 bpm
