import { useState, useMemo } from 'react';
import WidgetCard from './WidgetCard';

// Composite day score: considers recovery (40%), sleep (35%), strain (25%)
// Rule: if a day has data (e.g. strain) but NO sleep/recovery, it means
// the user didn't sleep — treat as 0 sleep and 0 recovery (bad day)
function getDayScore(data) {
  if (!data) return null;

  const hasAnyData = data.recovery || data.sleep || data.strain;
  if (!hasAnyData) return null;

  // If day has data but missing sleep → didn't sleep = 0
  const missingSleep = !data.sleep?.total_sleep_hrs;
  // If day has data but missing recovery → no recovery recorded = 0
  const missingRecovery = data.recovery?.score == null;

  // Recovery score (0-100), default 0 if missing but day has other data
  const recoveryScore = missingRecovery ? 0 : data.recovery.score;

  // Sleep score
  let sleepScore = 0;
  if (!missingSleep) {
    const hrs = data.sleep.total_sleep_hrs;
    if (hrs >= 7.5 && hrs <= 9) sleepScore = 100;
    else if (hrs >= 7) sleepScore = 85;
    else if (hrs >= 6) sleepScore = 65;
    else if (hrs >= 5) sleepScore = 45;
    else if (hrs >= 4) sleepScore = 25;
    else sleepScore = 10;
  }
  // missingSleep stays 0 — no sleep is bad

  // Strain score (10-18 is ideal)
  let strainScore = 50; // neutral default
  if (data.strain?.strain != null) {
    const s = data.strain.strain;
    if (s >= 10 && s <= 18) strainScore = 100;
    else if (s >= 8) strainScore = 80;
    else if (s >= 6) strainScore = 60;
    else if (s >= 4) strainScore = 40;
    else strainScore = 20;
  }

  const total = recoveryScore * 0.4 + sleepScore * 0.35 + strainScore * 0.25;
  return Math.round(total);
}

// Smooth red → orange → yellow → green gradient
function getDayColor(score) {
  if (score == null) return '#1a1a2e';
  if (score >= 90) return '#00E676'; // Bright green
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 70) return '#8BC34A'; // Light green
  if (score >= 60) return '#CDDC39'; // Yellow-green
  if (score >= 50) return '#FFD600'; // Yellow
  if (score >= 40) return '#FFAB00'; // Amber
  if (score >= 30) return '#FF9100'; // Orange
  if (score >= 20) return '#FF5722'; // Deep orange
  return '#FF1744';                   // Red
}

function getDayLabel(score) {
  if (score == null) return '';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Above Avg';
  if (score >= 40) return 'Average';
  if (score >= 25) return 'Below Avg';
  return 'Poor';
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getRecoveryColor(score) {
  if (score == null) return '#666';
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF1744';
}

function getSleepColor(hrs) {
  if (hrs == null) return '#666';
  if (hrs >= 7.5) return '#00E676';
  if (hrs >= 7) return '#69F0AE';
  if (hrs >= 6) return '#FFD600';
  if (hrs >= 5) return '#FF9100';
  return '#FF1744';
}

function getStrainColor(s) {
  if (s == null) return '#666';
  if (s >= 18) return '#00E676';
  if (s >= 14) return '#69F0AE';
  if (s >= 10) return '#FFD600';
  if (s >= 6) return '#FF9100';
  return '#FF1744';
}

export default function HealthCalendar({ records }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const dataByDate = useMemo(() => {
    const map = {};
    if (records) records.forEach(r => { if (r.date) map[r.date] = r; });
    return map;
  }, [records]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let week = new Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    week.push({ day: d, date: dateStr, data: dataByDate[dateStr] || null });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

  const selectedData = selectedDay ? dataByDate[selectedDay] : null;
  const selectedScore = selectedData ? getDayScore(selectedData) : null;

  return (
    <WidgetCard title="Health Calendar">
      <div className="flex gap-4 h-full">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Month nav */}
          <div className="flex items-center justify-center gap-4 mb-1 relative">
            <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="text-sm font-semibold text-white hover:text-[#00E676] transition-colors cursor-pointer">
              {MONTH_NAMES[month]} {year}
            </button>
            {showMonthPicker && (
              <div className="absolute z-50 mt-1 top-8 bg-[#161b22] border border-gray-700 rounded-xl p-3 shadow-2xl shadow-black/50" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {MONTH_NAMES.map((m, i) => {
                    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                    const hasData = Object.keys(dataByDate).some(d => d.startsWith(key));
                    return (
                      <button key={i}
                        onClick={() => { if (hasData) { setMonth(i); setShowMonthPicker(false); setSelectedDay(null); } }}
                        disabled={!hasData}
                        className={`px-2 py-1.5 text-xs rounded-lg transition-all ${
                          i === month ? 'bg-[#00E676]/20 text-[#00E676] font-bold'
                          : hasData ? 'text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer'
                          : 'text-gray-700 cursor-not-allowed'
                        }`}>{m.slice(0, 3)}</button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-3 border-t border-gray-700 pt-2">
                  {Object.keys(dataByDate).some(d => d.startsWith(`${year - 1}-`)) ? (
                    <button onClick={() => setYear(y => y - 1)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5">← {year - 1}</button>
                  ) : (
                    <span className="text-xs text-gray-700 px-2 py-1">← {year - 1}</span>
                  )}
                  <span className="text-xs font-semibold text-white">{year}</span>
                  {Object.keys(dataByDate).some(d => d.startsWith(`${year + 1}-`)) ? (
                    <button onClick={() => setYear(y => y + 1)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5">{year + 1} →</button>
                  ) : (
                    <span className="text-xs text-gray-700 px-2 py-1">{year + 1} →</span>
                  )}
                </div>
              </div>
            )}
            <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[9px] text-gray-500 font-medium py-0.5">{d}</div>
            ))}
          </div>

          {/* Calendar rows */}
          <div className="flex-1 flex flex-col gap-1 min-h-0">
            {weeks.map((wk, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 flex-1 min-h-0">
                {wk.map((cell, ci) => {
                  if (!cell) return <div key={ci} />;
                  const dayScore = getDayScore(cell.data);
                  const color = getDayColor(dayScore);
                  const isSelected = selectedDay === cell.date;
                  const isToday = cell.date === today.toISOString().split('T')[0];
                  const hasData = cell.data != null;
                  return (
                    <button
                      key={ci}
                      onClick={() => hasData && setSelectedDay(isSelected ? null : cell.date)}
                      className={`rounded-md flex flex-col items-center justify-center relative transition-all h-full ${
                        hasData ? 'cursor-pointer hover:ring-1 hover:ring-white/30' : 'cursor-default opacity-40'
                      } ${isSelected ? 'ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: hasData ? color + '35' : '#1a1a2e' }}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-[#00E676]' : 'text-gray-300'}`}>{cell.day}</span>
                      {hasData && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: color }} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Stats panel (right side) */}
        <div className="w-[180px] flex-shrink-0 flex flex-col justify-center">
          {selectedData ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-300 font-semibold border-b border-gray-700/50 pb-1.5">
                {selectedDay}
                {selectedScore != null && (
                  <span className="ml-2 text-xs font-bold" style={{ color: getDayColor(selectedScore) }}>
                    {selectedScore} — {getDayLabel(selectedScore)}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Recovery</div>
                <div className="text-3xl font-bold" style={{ color: getRecoveryColor(selectedData.recovery?.score) }}>
                  {selectedData.recovery?.score != null ? `${selectedData.recovery.score}%` : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Strain</div>
                <div className="text-3xl font-bold" style={{ color: getStrainColor(selectedData.strain?.strain) }}>
                  {selectedData.strain?.strain != null ? selectedData.strain.strain.toFixed(1) : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Sleep</div>
                <div className="text-3xl font-bold" style={{ color: getSleepColor(selectedData.sleep?.total_sleep_hrs) }}>
                  {selectedData.sleep?.total_sleep_hrs != null ? `${selectedData.sleep.total_sleep_hrs.toFixed(1)}h` : '--'}
                </div>
              </div>
              <div className="border-t border-gray-700/50 pt-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">HRV</span>
                  <span className="text-sm font-bold text-[#B388FF]">{selectedData.recovery?.hrv_rmssd_milli != null ? `${Math.round(selectedData.recovery.hrv_rmssd_milli)}ms` : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">RHR</span>
                  <span className="text-sm font-bold text-[#FF5252]">{selectedData.recovery?.resting_heart_rate != null ? `${selectedData.recovery.resting_heart_rate}bpm` : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">SpO2</span>
                  <span className="text-sm font-bold text-[#69F0AE]">{selectedData.recovery?.spo2_percentage != null ? `${selectedData.recovery.spo2_percentage.toFixed(1)}%` : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Workouts</span>
                  <span className="text-sm font-bold text-[#18FFFF]">{selectedData.workouts?.length || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-sm mb-1 text-gray-400">Select a day</div>
              <div className="text-xs text-gray-400">Click a date to view stats</div>
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
