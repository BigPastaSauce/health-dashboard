import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WidgetCard from './WidgetCard';

function getDayScore(data) {
  if (!data) return null;
  const hasAnyData = data.recovery || data.sleep || data.strain;
  if (!hasAnyData) return null;

  const missingSleep = !data.sleep?.total_sleep_hrs;
  const missingRecovery = data.recovery?.score == null;
  const recoveryScore = missingRecovery ? 0 : data.recovery.score;

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

  let strainScore = 50;
  if (data.strain?.strain != null) {
    const s = data.strain.strain;
    if (s >= 10 && s <= 18) strainScore = 100;
    else if (s >= 8) strainScore = 80;
    else if (s >= 6) strainScore = 60;
    else if (s >= 4) strainScore = 40;
    else strainScore = 20;
  }

  return Math.round(recoveryScore * 0.4 + sleepScore * 0.35 + strainScore * 0.25);
}

function getDayColor(score) {
  if (score == null) return 'rgba(255,255,255,0.02)';
  if (score >= 90) return '#00E676';
  if (score >= 80) return '#4CAF50';
  if (score >= 70) return '#8BC34A';
  if (score >= 60) return '#CDDC39';
  if (score >= 50) return '#FFD600';
  if (score >= 40) return '#FFAB00';
  if (score >= 30) return '#FF9100';
  if (score >= 20) return '#FF5722';
  return '#FF5252';
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

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getRecoveryColor(score) { return score == null ? '#555' : score >= 67 ? '#00E676' : score >= 34 ? '#FFD600' : '#FF5252'; }
function getSleepColor(hrs) { return hrs == null ? '#555' : hrs >= 7.5 ? '#00E676' : hrs >= 6 ? '#FFD600' : '#FF5252'; }
function getStrainColor(s) { return s == null ? '#555' : s >= 14 ? '#00E676' : s >= 10 ? '#FFD600' : '#FF9100'; }

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
      <div className="flex gap-5 h-full">
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Month nav — more visible */}
          <div className="flex items-center justify-center gap-5 mb-3 relative">
            <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="text-sm font-bold text-gray-200 hover:text-[#00E676] transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-white/[0.04]">
              {MONTH_NAMES[month]} {year}
            </button>
            {showMonthPicker && (
              <div className="absolute z-50 mt-1 top-10 bg-[#12131a] border border-white/[0.08] rounded-xl p-4 shadow-2xl" style={{ left: '50%', transform: 'translateX(-50%)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {MONTH_NAMES.map((m, i) => {
                    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                    const hasData = Object.keys(dataByDate).some(d => d.startsWith(key));
                    return (
                      <button key={i}
                        onClick={() => { if (hasData) { setMonth(i); setShowMonthPicker(false); setSelectedDay(null); } }}
                        disabled={!hasData}
                        className={`px-3 py-2 text-xs rounded-lg transition-all ${
                          i === month ? 'bg-[#00E676]/10 text-[#00E676] font-bold border border-[#00E676]/15'
                          : hasData ? 'text-gray-400 hover:text-white hover:bg-white/[0.04] cursor-pointer'
                          : 'text-gray-700 cursor-not-allowed'
                        }`}>{m.slice(0, 3)}</button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-3 border-t border-white/[0.06] pt-2">
                  {Object.keys(dataByDate).some(d => d.startsWith(`${year - 1}-`)) ? (
                    <button onClick={() => setYear(y => y - 1)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.04]">← {year - 1}</button>
                  ) : (<span className="text-xs text-gray-700 px-2 py-1">← {year - 1}</span>)}
                  <span className="text-xs font-bold text-white">{year}</span>
                  {Object.keys(dataByDate).some(d => d.startsWith(`${year + 1}-`)) ? (
                    <button onClick={() => setYear(y => y + 1)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.04]">{year + 1} →</button>
                  ) : (<span className="text-xs text-gray-700 px-2 py-1">{year + 1} →</span>)}
                </div>
              </div>
            )}
            <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] text-gray-500 font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Calendar rows */}
          <div className="flex-1 flex flex-col gap-1.5 min-h-0">
            {weeks.map((wk, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5 flex-1 min-h-0">
                {wk.map((cell, ci) => {
                  if (!cell) return <div key={ci} />;
                  const dayScore = getDayScore(cell.data);
                  const color = getDayColor(dayScore);
                  const isSelected = selectedDay === cell.date;
                  const isToday = cell.date === today.toISOString().split('T')[0];
                  const hasData = cell.data != null;
                  return (
                    <motion.button
                      key={ci}
                      whileHover={hasData ? { scale: 1.08 } : {}}
                      whileTap={hasData ? { scale: 0.95 } : {}}
                      onClick={() => hasData && setSelectedDay(isSelected ? null : cell.date)}
                      className={`rounded-lg flex flex-col items-center justify-center relative transition-all h-full ${
                        hasData ? 'cursor-pointer' : 'cursor-default opacity-25'
                      } ${isSelected ? 'ring-2 ring-white/60' : ''}`}
                      style={{ backgroundColor: hasData ? `${color}25` : 'rgba(255,255,255,0.01)' }}
                    >
                      <span className={`text-xs font-semibold ${isToday ? 'text-[#00E676]' : hasData ? 'text-gray-300' : 'text-gray-600'}`}>{cell.day}</span>
                      {hasData && (
                        <motion.div 
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full mt-0.5" style={{ backgroundColor: color }} 
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Stats panel */}
        <div className="w-[180px] flex-shrink-0 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {selectedData ? (
              <motion.div 
                key={selectedDay}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-3"
              >
                <div className="text-sm text-gray-200 font-bold border-b border-white/[0.08] pb-2">
                  {selectedDay}
                  {selectedScore != null && (
                    <span className="ml-2 text-xs font-bold" style={{ color: getDayColor(selectedScore) }}>
                      {selectedScore} — {getDayLabel(selectedScore)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Recovery</div>
                  <div className="text-3xl font-black font-mono tabular-nums" style={{ color: getRecoveryColor(selectedData.recovery?.score) }}>
                    {selectedData.recovery?.score != null ? `${selectedData.recovery.score}%` : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Strain</div>
                  <div className="text-3xl font-black font-mono tabular-nums" style={{ color: getStrainColor(selectedData.strain?.strain) }}>
                    {selectedData.strain?.strain != null ? selectedData.strain.strain.toFixed(1) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Sleep</div>
                  <div className="text-3xl font-black font-mono tabular-nums" style={{ color: getSleepColor(selectedData.sleep?.total_sleep_hrs) }}>
                    {selectedData.sleep?.total_sleep_hrs != null ? `${selectedData.sleep.total_sleep_hrs.toFixed(1)}h` : '--'}
                  </div>
                </div>
                <div className="border-t border-white/[0.08] pt-3 space-y-2.5">
                  {[
                    { label: 'HRV', value: selectedData.recovery?.hrv_rmssd_milli != null ? `${Math.round(selectedData.recovery.hrv_rmssd_milli)}ms` : '--', color: '#B388FF' },
                    { label: 'RHR', value: selectedData.recovery?.resting_heart_rate != null ? `${selectedData.recovery.resting_heart_rate}bpm` : '--', color: '#FF5252' },
                    { label: 'SpO2', value: selectedData.recovery?.spo2_percentage != null ? `${selectedData.recovery.spo2_percentage.toFixed(1)}%` : '--', color: '#69F0AE' },
                    { label: 'Workouts', value: selectedData.workouts?.length || 0, color: '#18FFFF' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm font-bold font-mono tabular-nums" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="text-sm mb-1 text-gray-400 font-medium">Select a day</div>
                <div className="text-xs text-gray-600">Click a date to view stats</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WidgetCard>
  );
}
