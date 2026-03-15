import { useState, useMemo } from 'react';
import WidgetCard from './WidgetCard';

function getRecoveryColor(score) {
  if (score == null) return '#1a1a2e';
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF1744';
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HealthCalendar({ records }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

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

  return (
    <WidgetCard title="Health Calendar">
      <div className="flex gap-4 h-full">
        {/* Calendar grid — fully dynamic */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-1">
            <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</span>
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

          {/* Calendar rows — flex-1 fills remaining space, each row gets equal share */}
          <div className="flex-1 flex flex-col gap-1 min-h-0">
            {weeks.map((wk, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 flex-1 min-h-0">
                {wk.map((cell, ci) => {
                  if (!cell) return <div key={ci} />;
                  const rec = cell.data?.recovery?.score;
                  const color = getRecoveryColor(rec);
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
                      style={{ backgroundColor: hasData ? color + '20' : '#1a1a2e' }}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-[#00E676]' : 'text-gray-300'}`}>{cell.day}</span>
                      {hasData && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: color }} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-1 justify-center">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00E676]" /><span className="text-[9px] text-gray-500">Green</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FFD600]" /><span className="text-[9px] text-gray-500">Yellow</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF1744]" /><span className="text-[9px] text-gray-500">Red</span></div>
          </div>
        </div>

        {/* Stats panel (right side) */}
        <div className="w-[180px] flex-shrink-0 flex flex-col justify-center">
          {selectedData ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-300 font-semibold border-b border-gray-700/50 pb-1.5">{selectedDay}</div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Recovery</div>
                <div className="text-3xl font-bold" style={{ color: getRecoveryColor(selectedData.recovery?.score) }}>
                  {selectedData.recovery?.score != null ? `${selectedData.recovery.score}%` : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Strain</div>
                <div className="text-3xl font-bold text-[#FF9100]">
                  {selectedData.strain?.strain != null ? selectedData.strain.strain.toFixed(1) : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Sleep</div>
                <div className="text-3xl font-bold text-[#448AFF]">
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
