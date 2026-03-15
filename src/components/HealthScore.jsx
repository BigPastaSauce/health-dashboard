import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import WidgetCard from './WidgetCard';

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

export default function HealthScore({ records, sleepDebtAlltime }) {
  const computed = useMemo(() => {
    if (!records || records.length === 0) return null;
    const latest = records[records.length - 1];
    const recovery = latest?.recovery || {};
    const sleep = latest?.sleep || {};
    const body = latest?.body || {};

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
    let overall = Math.round(weightedSum / totalWeight);
    const hrvValues = records.filter(r => r.recovery?.hrv_rmssd_milli).map(r => r.recovery.hrv_rmssd_milli);
    const trendBonus = calculateTrendBonus(hrvValues);
    overall = clamp(overall + trendBonus, 1, 100);
    const physAge = estimatePhysiologicalAge(overall, AGE);
    const ageDiff = physAge - AGE;
    return { overall, components, physAge, ageDiff, trendBonus };
  }, [records, sleepDebtAlltime]);

  if (!computed) return null;
  const { overall, components, physAge, ageDiff, trendBonus } = computed;
  const scoreColor = getScoreColor(overall);
  const ageColor = ageDiff <= 0 ? '#00E676' : ageDiff <= 3 ? '#FFD600' : '#FF1744';
  const sorted = Object.values(components).sort((a, b) => b.weight - a.weight);

  return (
    <WidgetCard title="Health Score">
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
          {trendBonus !== 0 && (
            <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendBonus > 0 ? 'bg-[#00E676]/15 text-[#00E676]' : 'bg-[#FF1744]/15 text-[#FF1744]'}`}>
              {trendBonus > 0 ? '📈' : '📉'} {trendBonus > 0 ? '+' : ''}{trendBonus} trend
            </div>
          )}
          <div className="text-[10px] text-whoop-textDim mt-1.5 leading-tight">
            {ageDiff <= -3 ? 'Aging significantly slower' : ageDiff <= 0 ? 'Aging slower than average' : ageDiff <= 3 ? 'Aging slightly faster' : 'Focus on recovery & sleep'}
          </div>
        </div>
      </div>

      {/* Component bars */}
      <div className="space-y-1.5">
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
  );
}
