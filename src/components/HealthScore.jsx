import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import WidgetCard from './WidgetCard';
import { MaximizeButton, MaximizedOverlay, useTimeframeFilter, TimeframeSelector } from './ChartControls';

const AGE = 23;

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function scoreHRV(hrv) {
  if (hrv >= 100) return 100;
  if (hrv >= 80) return 85 + (hrv - 80) * 0.75;
  if (hrv >= 60) return 65 + (hrv - 60) * 1.0;
  if (hrv >= 40) return 40 + (hrv - 40) * 1.25;
  if (hrv >= 20) return 10 + (hrv - 20) * 1.5;
  return hrv * 0.5;
}

function scoreRHR(rhr) {
  if (rhr <= 45) return 100;
  if (rhr <= 50) return 90 + (50 - rhr) * 2;
  if (rhr <= 55) return 80 + (55 - rhr) * 2;
  if (rhr <= 60) return 70 + (60 - rhr) * 2;
  if (rhr <= 70) return 50 + (70 - rhr) * 2;
  if (rhr <= 80) return 30 + (80 - rhr) * 2;
  if (rhr <= 90) return 10 + (90 - rhr) * 2;
  return Math.max(0, 10 - (rhr - 90));
}

function scoreSleep(sleep) {
  if (!sleep) return 0;
  let s = 0;
  const dur = sleep.total_sleep_hrs || 0;
  if (dur >= 7.5 && dur <= 9) s += 40;
  else if (dur >= 7) s += 35;
  else if (dur >= 6) s += 25;
  else if (dur >= 5) s += 15;
  else s += 5;
  const deepPct = dur > 0 ? (sleep.deep_sleep_hrs / dur) * 100 : 0;
  if (deepPct >= 15) s += 20; else if (deepPct >= 12) s += 15; else if (deepPct >= 8) s += 10; else s += 5;
  const remPct = dur > 0 ? (sleep.rem_sleep_hrs / dur) * 100 : 0;
  if (remPct >= 20) s += 20; else if (remPct >= 15) s += 15; else if (remPct >= 10) s += 10; else s += 5;
  const eff = sleep.sleep_efficiency || 0;
  if (eff >= 90) s += 20; else if (eff >= 85) s += 15; else if (eff >= 75) s += 10; else s += 5;
  return s;
}

function scoreSleepDebt(debtHrs) {
  const abs = Math.abs(debtHrs || 0);
  if (abs <= 1) return 100; if (abs <= 3) return 85; if (abs <= 5) return 70;
  if (abs <= 8) return 55; if (abs <= 12) return 40; if (abs <= 18) return 25;
  if (abs <= 25) return 15; return 5;
}

function scoreSpO2(spo2) {
  if (!spo2) return 50;
  if (spo2 >= 98) return 100; if (spo2 >= 96) return 90; if (spo2 >= 95) return 75;
  if (spo2 >= 93) return 50; if (spo2 >= 90) return 25; return 10;
}

function scoreBMI(weightKg, heightM) {
  if (!weightKg || !heightM) return 50;
  const bmi = weightKg / (heightM * heightM);
  if (bmi >= 18.5 && bmi <= 24.9) return 100;
  if (bmi >= 25 && bmi <= 27) return 75; if (bmi >= 27 && bmi <= 30) return 55;
  if (bmi >= 30 && bmi <= 35) return 35; if (bmi >= 35 && bmi <= 40) return 20;
  if (bmi > 40) return 10; if (bmi < 18.5) return 60; return 30;
}

function scoreStrainConsistency(strainValues) {
  if (!strainValues || strainValues.length < 3) return 50;
  let score = 0;
  const recent = strainValues.slice(-14);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg >= 10 && avg <= 16) score += 50; else if (avg >= 8 && avg <= 18) score += 40;
  else if (avg >= 6) score += 25; else score += 10;
  const std = Math.sqrt(recent.reduce((s, v) => s + (v - avg) ** 2, 0) / recent.length);
  const cv = std / (avg || 1);
  if (cv < 0.2) score += 50; else if (cv < 0.3) score += 40; else if (cv < 0.5) score += 25; else score += 10;
  return score;
}

function calculateTrendBonus(values) {
  if (!values || values.length < 7) return 0;
  const recent7 = values.slice(-7);
  const prev7 = values.slice(-14, -7);
  if (prev7.length < 3) return 0;
  const recentAvg = recent7.reduce((a, b) => a + b, 0) / recent7.length;
  const prevAvg = prev7.reduce((a, b) => a + b, 0) / prev7.length;
  const change = ((recentAvg - prevAvg) / (prevAvg || 1)) * 100;
  if (change > 10) return 3; if (change > 5) return 2;
  if (change < -10) return -3; if (change < -5) return -2;
  return 0;
}

function getScoreColor(score) {
  if (score >= 80) return '#00E676'; if (score >= 60) return '#69F0AE';
  if (score >= 40) return '#FFD600'; if (score >= 25) return '#FF9100'; return '#FF1744';
}

function getScoreLabel(score) {
  if (score >= 90) return 'Excellent'; if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good'; if (score >= 60) return 'Above Average';
  if (score >= 50) return 'Average'; if (score >= 40) return 'Below Average';
  if (score >= 30) return 'Poor'; return 'Critical';
}

function estimatePhysiologicalAge(score, age) {
  const agingRate = 1.5 - (score / 100) * 0.8;
  return Math.round(age * agingRate);
}

function calculateDailyScore(record, records, sleepDebtAlltime) {
  const recovery = record?.recovery || {};
  const sleep = record?.sleep || {};
  const body = record?.body || {};

  const components = {
    hrv: { score: clamp(Math.round(scoreHRV(recovery.hrv_rmssd_milli || 0)), 0, 100), weight: 20, label: 'HRV' },
    recovery: { score: clamp(Math.round(recovery.score || 0), 0, 100), weight: 15, label: 'Recovery' },
    rhr: { score: clamp(Math.round(scoreRHR(recovery.resting_heart_rate || 70)), 0, 100), weight: 15, label: 'Resting HR' },
    sleep: { score: clamp(Math.round(scoreSleep(sleep)), 0, 100), weight: 15, label: 'Sleep' },
    sleepDebt: { score: clamp(Math.round(scoreSleepDebt(sleepDebtAlltime?.cumulative_debt_hrs)), 0, 100), weight: 10, label: 'Sleep Debt' },
    bmi: { score: clamp(Math.round(scoreBMI(body.weight_kg, body.height_m)), 0, 100), weight: 10, label: 'Body Comp' },
    strain: { score: clamp(Math.round(scoreStrainConsistency(records.filter(r => r.strain?.strain != null).map(r => r.strain.strain))), 0, 100), weight: 10, label: 'Activity' },
    spo2: { score: clamp(Math.round(scoreSpO2(recovery.spo2_percentage)), 0, 100), weight: 5, label: 'SpO2' },
  };

  let totalWeight = 0, weightedSum = 0;
  Object.values(components).forEach(c => { weightedSum += c.score * c.weight; totalWeight += c.weight; });
  const overall = clamp(Math.round(weightedSum / totalWeight), 1, 100);
  return { overall, components };
}

function calculateCumulativeScore(records, sleepDebtAlltime) {
  if (!records || records.length === 0) return { cumulative: 50, trend: 0, streak: 0 };

  const alpha = 0.1; // EMA decay — lower = more smoothing
  let ema = 50; // start at neutral
  let streak = 0;
  const dailyScores = [];

  for (let i = 0; i < records.length; i++) {
    const { overall } = calculateDailyScore(records[i], records.slice(0, i + 1), sleepDebtAlltime);
    dailyScores.push(overall);

    // Update EMA
    ema = alpha * overall + (1 - alpha) * ema;

    // Track streak of good days (score >= 60)
    if (overall >= 60) {
      streak++;
    } else {
      streak = 0;
    }
  }

  // Streak bonus: +1 per 7 consecutive good days, max +8
  const streakBonus = Math.min(Math.floor(streak / 7) * 2, 8);

  // Trend: compare last 7-day EMA vs previous 7-day EMA
  let trend = 0;
  if (dailyScores.length >= 14) {
    const recent7 = dailyScores.slice(-7);
    const prev7 = dailyScores.slice(-14, -7);
    const recentAvg = recent7.reduce((a, b) => a + b, 0) / recent7.length;
    const prevAvg = prev7.reduce((a, b) => a + b, 0) / prev7.length;
    trend = recentAvg - prevAvg;
  } else if (dailyScores.length >= 4) {
    const half = Math.floor(dailyScores.length / 2);
    const recent = dailyScores.slice(-half);
    const prev = dailyScores.slice(0, half);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
    trend = recentAvg - prevAvg;
  }

  const cumulative = clamp(Math.round(ema + streakBonus), 1, 100);
  return { cumulative, trend: Math.round(trend * 10) / 10, streak };
}

export default function HealthScore({ records, sleepDebtAlltime }) {
  const [maximized, setMaximized] = useState(false);
  const [showCumulative, setShowCumulative] = useState(true);
  const [showDaily, setShowDaily] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  const computed = useMemo(() => {
    if (!records || records.length === 0) return null;
    const latest = records[records.length - 1];
    const { overall: dailyScore, components } = calculateDailyScore(latest, records, sleepDebtAlltime);
    const { cumulative, trend, streak } = calculateCumulativeScore(records, sleepDebtAlltime);
    const hrvValues = records.filter(r => r.recovery?.hrv_rmssd_milli).map(r => r.recovery.hrv_rmssd_milli);
    const trendBonus = calculateTrendBonus(hrvValues);
    const physAge = estimatePhysiologicalAge(cumulative, AGE);
    const ageDiff = physAge - AGE;
    return { overall: cumulative, dailyScore, components, physAge, ageDiff, trendBonus, trend, streak };
  }, [records, sleepDebtAlltime]);

  // Build chart data for expanded view
  const chartData = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) return [];
    const alpha = 0.1;
    let ema = 50;
    let streakCount = 0;

    return filteredRecords.map((r, i) => {
      const { overall: daily } = calculateDailyScore(r, filteredRecords.slice(0, i + 1), sleepDebtAlltime);
      ema = alpha * daily + (1 - alpha) * ema;
      if (daily >= 60) streakCount++; else streakCount = 0;
      const bonus = Math.min(Math.floor(streakCount / 7) * 2, 8);
      const cumul = clamp(Math.round(ema + bonus), 1, 100);
      return { date: r.date?.slice(5) || '', daily, cumulative: cumul };
    });
  }, [filteredRecords, sleepDebtAlltime]);

  if (!computed) return null;
  const { overall, dailyScore, components, physAge, ageDiff, trendBonus, trend, streak } = computed;
  const scoreColor = getScoreColor(overall);
  const dailyColor = getScoreColor(dailyScore);
  const ageColor = ageDiff <= 0 ? '#00E676' : ageDiff <= 3 ? '#FFD600' : '#FF1744';
  const trendArrow = trend > 1 ? '↑' : trend < -1 ? '↓' : '→';
  const trendColor = trend > 1 ? '#00E676' : trend < -1 ? '#FF1744' : '#9ca3af';
  const sorted = Object.values(components).sort((a, b) => b.weight - a.weight);

  const modeButtons = (
    <div className="flex gap-3 mr-2">
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" checked={showCumulative} onChange={() => setShowCumulative(!showCumulative)}
          className="w-3 h-3 accent-[#00E676] cursor-pointer" />
        <span className={`text-[11px] font-medium ${showCumulative ? 'text-[#00E676]' : 'text-gray-500'}`}>Cumulative</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" checked={showDaily} onChange={() => setShowDaily(!showDaily)}
          className="w-3 h-3 accent-[#448AFF] cursor-pointer" />
        <span className={`text-[11px] font-medium ${showDaily ? 'text-[#448AFF]' : 'text-gray-500'}`}>Daily</span>
      </label>
    </div>
  );

  const scoreChart = (height = 'h-[350px]') => (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value, name) => [
              <span style={{ color: name === 'cumulative' ? '#00E676' : '#448AFF' }}>{Math.round(value)}</span>,
              <span style={{ color: '#9ca3af' }}>{name === 'cumulative' ? 'Cumulative' : 'Daily'}</span>
            ]}
          />
          {showCumulative && (
            <Line type="monotone" dataKey="cumulative" stroke="#00E676" strokeWidth={2} dot={false} />
          )}
          {showDaily && (
            <Line type="monotone" dataKey="daily" stroke="#448AFF" strokeWidth={1.5} dot={false} />
          )}
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
            formatter={(value) => value === 'cumulative' ? 'Cumulative' : 'Daily'}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <WidgetCard title="Health Score" headerRight={<MaximizeButton onClick={() => setMaximized(true)} />}>
        {/* Top section: ring + physio age side by side */}
        <div className="flex items-center gap-10 mb-3">
          {/* Score ring */}
          <div className="relative flex-shrink-0" style={{ width: 170, height: 170 }}>
            <svg width={170} height={170} className="transform -rotate-90">
              <circle cx={85} cy={85} r={72} fill="none" stroke="#2a2a4a" strokeWidth="8" />
              <motion.circle
                cx={85} cy={85} r={72} fill="none"
                stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 72}
                initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - overall / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span className="text-4xl font-black" style={{ color: scoreColor }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {overall}
              </motion.span>
              <span className="text-[9px] text-whoop-textDim uppercase tracking-wider font-semibold">{getScoreLabel(overall)}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-bold" style={{ color: trendColor }}>{trendArrow}</span>
                <span className="text-[9px] text-whoop-textDim">cumulative</span>
              </div>
            </div>
          </div>

          {/* Physio age + trend */}
          <div className="flex-1">
            <div className="text-[10px] text-whoop-textDim uppercase tracking-wider mb-1">Physiological Age</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black" style={{ color: ageColor }}>{physAge}</span>
              <span className="text-sm text-whoop-textDim">yrs</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-bold ${ageDiff <= 0 ? 'text-[#00E676]' : 'text-[#FF1744]'}`}>
                {ageDiff <= 0 ? '↓' : '↑'} {Math.abs(ageDiff)} {ageDiff <= 0 ? 'younger' : 'older'}
              </span>
              <span className="text-[10px] text-whoop-textDim">vs actual {AGE}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-whoop-textDim">Today</span>
                <span className="text-lg font-bold" style={{ color: dailyColor }}>{dailyScore}</span>
              </div>
              {streak >= 3 && (
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E676]/15 text-[#00E676]">
                  🔥 {streak}d streak
                </div>
              )}
              {trend !== 0 && (
                <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-[#00E676]/15 text-[#00E676]' : 'bg-[#FF1744]/15 text-[#FF1744]'}`}>
                  {trendArrow} {trend > 0 ? '+' : ''}{trend}
                </div>
              )}
            </div>
            <div className="text-[10px] text-whoop-textDim mt-1.5 leading-tight">
              {ageDiff <= -3 ? 'Aging significantly slower' : ageDiff <= 0 ? 'Aging slower than average' : ageDiff <= 3 ? 'Aging slightly faster' : 'Focus on recovery & sleep'}
            </div>
          </div>
        </div>

        {/* Component bars */}
        <div className="space-y-1.5 mt-6">
          {sorted.map(c => {
            const barColor = getScoreColor(c.score);
            return (
              <div key={c.label} className="flex items-center gap-2">
                <div className="w-20 text-xs text-whoop-textDim truncate">{c.label}</div>
                <div className="flex-1 bg-[#1a1a2e] rounded-full h-1.5 overflow-hidden relative">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }} animate={{ width: `${c.score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
                <div className="w-8 text-sm font-bold text-right" style={{ color: barColor }}>{c.score}</div>
              </div>
            );
          })}
        </div>
      </WidgetCard>

      {maximized && (
        <MaximizedOverlay title="Health Score History" onClose={() => setMaximized(false)}>
          <div className="flex items-center gap-2 mb-3">
            {modeButtons}
            <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          </div>
          {scoreChart()}
        </MaximizedOverlay>
      )}
    </>
  );
}
