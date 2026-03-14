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

function readJSON(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// GET /api/health — returns master-log.json contents as array
app.get('/api/health', (req, res) => {
  const data = readJSON(join(HEALTH_DATA_DIR, 'master-log.json'));
  if (!data) return res.status(404).json({ error: 'No health data found' });
  // Wrap single object in array if needed
  const records = Array.isArray(data) ? data : [data];
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

app.listen(PORT, () => {
  console.log(`Health Dashboard server running on http://localhost:${PORT}`);
});
