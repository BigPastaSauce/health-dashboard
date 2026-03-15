import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  
  // Sort by date ascending
  records.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  
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
