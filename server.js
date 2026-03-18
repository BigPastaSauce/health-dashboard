import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3002;

app.use(cors());

const HEALTH_DATA_DIR = 'C:/Users/clawdbot/Health Data';
const SLEEP_DEBT_PATH = 'C:/Users/clawdbot/Projects/whoop-integration/data/sleep-debt.json';
const SLEEP_DEBT_ALLTIME_PATH = 'C:/Users/clawdbot/Projects/whoop-integration/data/sleep-debt-alltime.json';
const UNIFIED_RECORDS_PATH = join(__dirname, 'data', 'unified-records.json');

function readJSON(filePath) {
  if (!existsSync(filePath)) return null;
  let raw = readFileSync(filePath, 'utf-8');
  // Strip BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

// GET /api/health — returns unified historical records merged with daily logs
app.get('/api/health', (req, res) => {
  // Load full historical export
  let records = [];
  const unified = readJSON(UNIFIED_RECORDS_PATH);
  if (unified && Array.isArray(unified)) {
    records = unified;
  }
  
  // Also load master-log for any newer data not yet in unified
  const masterLog = readJSON(join(HEALTH_DATA_DIR, 'master-log.json'));
  if (masterLog) {
    const masterRecords = Array.isArray(masterLog) ? masterLog : [masterLog];
    const existingDates = new Set(records.map(r => r.date));
    for (const r of masterRecords) {
      if (r.date && !existingDates.has(r.date)) {
        records.push(r);
      }
    }
  }
  
  // Sort by date ascending and deduplicate
  records.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const seen = new Set();
  records = records.filter(r => {
    if (!r.date || seen.has(r.date)) return false;
    seen.add(r.date);
    return true;
  });
  
  if (records.length === 0) return res.status(404).json({ error: 'No health data found' });
  res.json(records);
});

// GET /api/health/:date — returns specific day
app.get('/api/health/:date', (req, res) => {
  const { date } = req.params;
  const filePath = join(HEALTH_DATA_DIR, 'daily-logs', `${date}.json`);
  const data = readJSON(filePath);
  if (!data) return res.status(404).json({ error: `No data for ${date}` });
  res.json(data);
});

// GET /api/sleep-debt — returns sleep debt data
app.get('/api/sleep-debt', (req, res) => {
  const data = readJSON(SLEEP_DEBT_PATH);
  if (!data) return res.status(404).json({ error: 'No sleep debt data found' });
  res.json(data);
});

// GET /api/sleep-debt/alltime — returns all-time sleep debt
app.get('/api/sleep-debt/alltime', (req, res) => {
  const data = readJSON(SLEEP_DEBT_ALLTIME_PATH);
  if (!data) return res.status(404).json({ error: 'No all-time sleep debt data found' });
  res.json(data);
});

// POST /api/refresh — pull all data from Whoop API and update unified records
app.post('/api/refresh', async (req, res) => {
  try {
    // Refresh Whoop token first
    try {
      execSync('powershell -ExecutionPolicy Bypass -File "C:/Users/clawdbot/Projects/whoop-integration/refresh-token.ps1"', { timeout: 15000 });
    } catch (e) { /* token might still be valid */ }

    const tokensPath = 'C:/Users/clawdbot/Projects/whoop-integration/tokens.json';
    const tokens = readJSON(tokensPath);
    if (!tokens?.access_token) return res.status(500).json({ error: 'No Whoop access token' });

    const headers = { 'Authorization': `Bearer ${tokens.access_token}` };
    const BASE = 'https://api.prod.whoop.com/developer/v1';

    // Load existing records
    let records = readJSON(UNIFIED_RECORDS_PATH) || [];
    const existingDates = new Set(records.map(r => r.date));

    // Determine date range: from earliest existing or 103 days ago
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 120); // go back 120 days to be safe

    // Fetch all cycles (strain data)
    let allCycles = [];
    let nextToken = null;
    do {
      const params = new URLSearchParams({ start: startDate.toISOString(), end: now.toISOString(), limit: '50' });
      if (nextToken) params.set('nextToken', nextToken);
      const resp = await fetch(`${BASE}/cycle?${params}`, { headers });
      if (!resp.ok) break;
      const data = await resp.json();
      allCycles.push(...(data.records || []));
      nextToken = data.next_token || null;
    } while (nextToken);

    // Fetch all recoveries
    let allRecoveries = [];
    nextToken = null;
    do {
      const params = new URLSearchParams({ start: startDate.toISOString(), end: now.toISOString(), limit: '50' });
      if (nextToken) params.set('nextToken', nextToken);
      const resp = await fetch(`${BASE}/recovery?${params}`, { headers });
      if (!resp.ok) break;
      const data = await resp.json();
      allRecoveries.push(...(data.records || []));
      nextToken = data.next_token || null;
    } while (nextToken);

    // Fetch all sleeps
    let allSleeps = [];
    nextToken = null;
    do {
      const params = new URLSearchParams({ start: startDate.toISOString(), end: now.toISOString(), limit: '50' });
      if (nextToken) params.set('nextToken', nextToken);
      const resp = await fetch(`${BASE}/sleep?${params}`, { headers });
      if (!resp.ok) break;
      const data = await resp.json();
      allSleeps.push(...(data.records || []));
      nextToken = data.next_token || null;
    } while (nextToken);

    // Fetch all workouts
    let allWorkouts = [];
    nextToken = null;
    do {
      const params = new URLSearchParams({ start: startDate.toISOString(), end: now.toISOString(), limit: '50' });
      if (nextToken) params.set('nextToken', nextToken);
      const resp = await fetch(`${BASE}/workout?${params}`, { headers });
      if (!resp.ok) break;
      const data = await resp.json();
      allWorkouts.push(...(data.records || []));
      nextToken = data.next_token || null;
    } while (nextToken);

    // Fetch body measurement
    let bodyData = { weight_kg: 112, weight_lbs: 246.9, height_m: 1.7272, max_heart_rate: 188 };
    try {
      const resp = await fetch(`${BASE}/body/measurement`, { headers });
      if (resp.ok) {
        const bm = await resp.json();
        if (bm.weight_kilogram) bodyData.weight_kg = bm.weight_kilogram;
        if (bm.weight_kilogram) bodyData.weight_lbs = Math.round(bm.weight_kilogram * 2.20462 * 10) / 10;
        if (bm.height_meter) bodyData.height_m = bm.height_meter;
        if (bm.max_heart_rate) bodyData.max_heart_rate = bm.max_heart_rate;
      }
    } catch (e) { /* use defaults */ }

    // Index by date
    const cyclesByDate = {};
    for (const c of allCycles) {
      const d = c.start?.slice(0, 10);
      if (d) cyclesByDate[d] = c;
    }
    const recoveryByDate = {};
    for (const r of allRecoveries) {
      const d = r.cycle?.start?.slice(0, 10) || r.created_at?.slice(0, 10);
      if (d) recoveryByDate[d] = r;
    }
    const sleepByDate = {};
    for (const s of allSleeps) {
      const d = s.start?.slice(0, 10);
      if (d && !s.nap) sleepByDate[d] = s;
    }
    const workoutsByDate = {};
    for (const w of allWorkouts) {
      const d = w.start?.slice(0, 10);
      if (!d) continue;
      if (!workoutsByDate[d]) workoutsByDate[d] = [];
      workoutsByDate[d].push(w);
    }

    // Collect all dates
    const allDates = new Set([
      ...Object.keys(cyclesByDate),
      ...Object.keys(recoveryByDate),
      ...Object.keys(sleepByDate),
      ...Object.keys(workoutsByDate)
    ]);

    let added = 0, updated = 0;
    for (const date of allDates) {
      const cycle = cyclesByDate[date];
      const recovery = recoveryByDate[date];
      const sleep = sleepByDate[date];
      const workouts = workoutsByDate[date];

      const record = { date, body: bodyData };

      if (cycle?.score) {
        record.strain = {
          strain: cycle.score.strain,
          calories: cycle.score.kilojoule ? Math.round(cycle.score.kilojoule / 4.184) : null,
          average_heart_rate: cycle.score.average_heart_rate,
          max_heart_rate: cycle.score.max_heart_rate,
          kilojoule: cycle.score.kilojoule
        };
      }

      if (recovery?.score) {
        record.recovery = {
          score: recovery.score.recovery_score,
          resting_heart_rate: recovery.score.resting_heart_rate,
          hrv_rmssd_milli: recovery.score.hrv_rmssd_milli,
          spo2_percentage: recovery.score.spo2_percentage,
          skin_temp_celsius: recovery.score.skin_temp_celsius
        };
      }

      if (sleep?.score) {
        const stage = sleep.score.stage_summary || {};
        record.sleep = {
          start: sleep.start,
          end: sleep.end,
          total_sleep_hrs: (
            (stage.total_light_sleep_time_milli || 0) +
            (stage.total_slow_wave_sleep_time_milli || 0) +
            (stage.total_rem_sleep_time_milli || 0)
          ) / 3600000,
          deep_sleep_hrs: (stage.total_slow_wave_sleep_time_milli || 0) / 3600000,
          rem_sleep_hrs: (stage.total_rem_sleep_time_milli || 0) / 3600000,
          light_sleep_hrs: (stage.total_light_sleep_time_milli || 0) / 3600000,
          total_awake_hrs: (stage.total_awake_time_milli || 0) / 3600000,
          total_in_bed_hrs: (stage.total_in_bed_time_milli || 0) / 3600000,
          sleep_efficiency: sleep.score.sleep_efficiency_percentage,
          respiratory_rate: sleep.score.respiratory_rate,
          sleep_consistency: sleep.score.sleep_consistency_percentage,
          sleep_performance: sleep.score.sleep_performance_percentage,
          sleep_cycles: stage.sleep_cycle_count,
          disturbances: stage.disturbance_count
        };
      }

      if (workouts?.length) {
        record.workouts = workouts.map(w => ({
          strain: w.score?.strain,
          max_hr: w.score?.max_heart_rate,
          avg_hr: w.score?.average_heart_rate,
          calories: w.score?.kilojoule ? Math.round(w.score.kilojoule / 4.184) : null,
          duration_min: w.score?.distance_meter ? null : (w.end && w.start ? Math.round((new Date(w.end) - new Date(w.start)) / 60000 * 10) / 10 : null),
          sport: w.sport_id?.toString(),
          start: w.start,
          end: w.end
        }));
      }

      // Replace or add
      const existingIdx = records.findIndex(r => r.date === date);
      if (existingIdx >= 0) {
        // Merge: keep existing fields, update with new data
        const existing = records[existingIdx];
        records[existingIdx] = { ...existing, ...record };
        updated++;
      } else {
        records.push(record);
        added++;
      }
    }

    // Sort
    records.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Deduplicate
    const seenDates = new Set();
    records = records.filter(r => {
      if (!r.date || seenDates.has(r.date)) return false;
      seenDates.add(r.date);
      return true;
    });

    // Save
    writeFileSync(UNIFIED_RECORDS_PATH, JSON.stringify(records), 'utf-8');

    res.json({
      success: true,
      total: records.length,
      added,
      updated,
      cycles: allCycles.length,
      recoveries: allRecoveries.length,
      sleeps: allSleeps.length,
      workouts: allWorkouts.length
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve built React app in production
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('{*path}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health Dashboard server running on http://localhost:${PORT}`);
});
server.on('error', (err) => {
  console.error('Server error:', err.message);
});
// Keep alive
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));
