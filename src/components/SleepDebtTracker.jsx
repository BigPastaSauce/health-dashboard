import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import WidgetCard from './WidgetCard';
import { MaximizeButton, MaximizedOverlay } from './ChartControls';

function getSeverityColor(sev) {
  if (sev === 'SURPLUS') return '#00E676';
  if (sev === 'MILD') return '#FFD600';
  if (sev === 'MODERATE') return '#FF9100';
  return '#FF1744';
}

function DebtChart({ chartData, height = 'h-[280px]' }) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#9ca3af' }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => {
              const color = value >= 0 ? '#69F0AE' : '#FF8A80';
              return [<span style={{ color }}>{value > 0 ? '+' : ''}{value.toFixed(1)}h</span>, <span style={{ color: '#9ca3af' }}>Sleep Debt</span>];
            }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <ReferenceLine y={0} stroke="#8888AA" strokeDasharray="3 3" />
          <Bar dataKey="debt" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.debt >= 0 ? '#69F0AE' : '#FF8A80'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SleepDebtTracker({ sleepDebt, sleepDebtAlltime, records }) {
  const [maximized, setMaximized] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('latest');

  // Build per-day sleep debt from unified records
  const allChartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    // Get all dates in range, fill gaps with 0 sleep
    const sorted = [...records].filter(r => r.date).sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return [];

    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted[sorted.length - 1].date);
    // Also include today if not present
    const today = new Date().toISOString().slice(0, 10);
    if (today > sorted[sorted.length - 1].date) {
      endDate.setTime(new Date(today).getTime());
    }

    const byDate = {};
    sorted.forEach(r => {
      if (r.sleep && r.sleep.total_sleep_hrs != null) {
        const slept = r.sleep.total_sleep_hrs;
        // Use 8h as standard sleep need — simple, reliable
        const needed = 8;
        const debt = Math.max(-8, Math.min(slept - needed, 16)); // clamp: max -8h debt, max +16h surplus per day
        byDate[r.date] = { slept, needed, debt: +debt.toFixed(1) };
      }
    });

    const data = [];
    const d = new Date(startDate);
    while (d <= endDate) {
      const dateStr = d.toISOString().slice(0, 10);
      if (byDate[dateStr]) {
        data.push({ date: dateStr.slice(5), fullDate: dateStr, debt: byDate[dateStr].debt });
      } else {
        // No data = 0 hours sleep, assume 8h needed
        data.push({ date: dateStr.slice(5), fullDate: dateStr, debt: -8 });
      }
      d.setDate(d.getDate() + 1);
    }
    return data;
  }, [records]);

  // Stats from chart data
  const stats = useMemo(() => {
    if (allChartData.length === 0) return {};
    let cumulative = 0;
    let bestDay = null, worstDay = null;
    let streak = 0;
    allChartData.forEach(d => {
      cumulative += d.debt;
      if (!bestDay || d.debt > bestDay.debt) bestDay = d;
      if (!worstDay || d.debt < worstDay.debt) worstDay = d;
    });
    // Count deficit streak from end
    for (let i = allChartData.length - 1; i >= 0; i--) {
      if (allChartData[i].debt < 0) streak++;
      else break;
    }
    const severity = cumulative >= 0 ? 'SURPLUS' : cumulative > -10 ? 'MILD' : cumulative > -20 ? 'MODERATE' : 'SEVERE';
    return { cumulative: +cumulative.toFixed(1), severity, bestDay, worstDay, streak, daysTracked: allChartData.length };
  }, [allChartData]);

  // Build week options
  const weeks = useMemo(() => {
    if (allChartData.length === 0) return [];
    const w = [];
    for (let i = 0; i < allChartData.length; i += 7) {
      const chunk = allChartData.slice(i, i + 7);
      const start = chunk[0]?.fullDate || '';
      const end = chunk[chunk.length - 1]?.fullDate || '';
      w.push({ key: `${i}`, label: `${start.slice(5)} – ${end.slice(5)}`, start: i, end: i + 7 });
    }
    return w;
  }, [allChartData]);

  // Filter to selected week
  const chartData = useMemo(() => {
    if (selectedWeek === 'all') return allChartData;
    if (selectedWeek === 'latest' && weeks.length > 0) {
      const last = weeks[weeks.length - 1];
      return allChartData.slice(last.start, last.end);
    }
    const week = weeks.find(w => w.key === selectedWeek);
    if (week) return allChartData.slice(week.start, week.end);
    return allChartData;
  }, [selectedWeek, allChartData, weeks]);

  const cumulativeDebt = stats.cumulative ?? 0;
  const severity = stats.severity || 'UNKNOWN';
  const alltime = {
    best_day: stats.bestDay ? { surplus_hrs: stats.bestDay.debt, date: stats.bestDay.fullDate } : null,
    worst_day: stats.worstDay ? { deficit_hrs: stats.worstDay.debt, date: stats.worstDay.fullDate } : null,
    streak_deficit: stats.streak,
    days_tracked: stats.daysTracked,
  };

  if (allChartData.length === 0) return null;

  return (
    <>
      <WidgetCard
        title="Sleep Debt"
        headerRight={
          <div className="flex items-center gap-2">
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="bg-[#161b22] text-[10px] text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-[#00E676] cursor-pointer"
            >
              <option value="latest">Latest Week</option>
              <option value="all">All Time</option>
              {weeks.map(w => (
                <option key={w.key} value={w.key}>{w.label}</option>
              ))}
            </select>
            <MaximizeButton onClick={() => setMaximized(true)} />
          </div>
        }
      >
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-4xl font-black" style={{ color: getSeverityColor(severity) }}>
            {cumulativeDebt != null ? `${cumulativeDebt > 0 ? '+' : ''}${cumulativeDebt.toFixed(1)}h` : 'N/A'}
          </span>
          <span className="text-base text-whoop-textDim">cumulative</span>
          {severity && (
            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: getSeverityColor(severity) + '22', color: getSeverityColor(severity) }}>
              {severity}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            {chartData.length > 0 && <DebtChart chartData={chartData} />}
          </div>
          <div className="w-[120px] flex-shrink-0 flex flex-col justify-center gap-4">
            {alltime.best_day && (
              <div>
                <div className="text-[10px] text-whoop-textDim uppercase">Best Day</div>
                <div className="text-xl font-bold text-[#00E676]">+{alltime.best_day.surplus_hrs}h</div>
                <div className="text-[10px] text-whoop-textDim">{alltime.best_day.date}</div>
              </div>
            )}
            {alltime.worst_day && (
              <div>
                <div className="text-[10px] text-whoop-textDim uppercase">Worst Day</div>
                <div className="text-xl font-bold text-[#FF1744]">{alltime.worst_day.deficit_hrs}h</div>
                <div className="text-[10px] text-whoop-textDim">{alltime.worst_day.date}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] text-whoop-textDim uppercase">Deficit Streak</div>
              <div className="text-xl font-bold text-whoop-text">{alltime.streak_deficit ?? 0} days</div>
            </div>
            <div>
              <div className="text-[10px] text-whoop-textDim uppercase">Days Tracked</div>
              <div className="text-xl font-bold text-whoop-text">{alltime.days_tracked ?? 0}</div>
            </div>
          </div>
        </div>
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Sleep Debt Tracker" onClose={() => setMaximized(false)}>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-5xl font-black" style={{ color: getSeverityColor(severity) }}>
              {cumulativeDebt != null ? `${cumulativeDebt > 0 ? '+' : ''}${cumulativeDebt.toFixed(1)}h` : 'N/A'}
            </span>
            <span className="text-lg text-gray-400">cumulative</span>
            {severity && (
              <span className="text-base font-bold px-3 py-1 rounded-full" style={{ backgroundColor: getSeverityColor(severity) + '22', color: getSeverityColor(severity) }}>
                {severity}
              </span>
            )}
            <div className="ml-auto">
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="bg-[#161b22] text-xs text-gray-300 border border-gray-600 rounded px-3 py-1.5 outline-none focus:border-[#00E676] cursor-pointer"
              >
                <option value="latest">Latest Week</option>
                <option value="all">All Time</option>
                {weeks.map(w => (
                  <option key={w.key} value={w.key}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>
          {chartData.length > 0 && <DebtChart chartData={chartData} height="h-[200px]" />}
          <div className="grid grid-cols-4 gap-6 mt-4">
            {alltime.best_day && (
              <div>
                <div className="text-xs text-gray-500">Best Day</div>
                <div className="text-2xl font-bold text-[#00E676]">+{alltime.best_day.surplus_hrs}h</div>
                <div className="text-xs text-gray-500">{alltime.best_day.date}</div>
              </div>
            )}
            {alltime.worst_day && (
              <div>
                <div className="text-xs text-gray-500">Worst Day</div>
                <div className="text-2xl font-bold text-[#FF1744]">{alltime.worst_day.deficit_hrs}h</div>
                <div className="text-xs text-gray-500">{alltime.worst_day.date}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500">Deficit Streak</div>
              <div className="text-2xl font-bold text-white">{alltime.streak_deficit ?? 0} days</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Days Tracked</div>
              <div className="text-2xl font-bold text-white">{alltime.days_tracked ?? 0}</div>
            </div>
          </div>
        </MaximizedOverlay>
      )}
    </>
  );
}
