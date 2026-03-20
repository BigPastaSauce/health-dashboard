import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';
import { MaximizeButton, MaximizedOverlay } from './ChartControls';

function getSeverityColor(sev) {
  if (sev === 'SURPLUS') return '#00E676';
  if (sev === 'MILD') return '#FFD600';
  if (sev === 'MODERATE') return '#FF9100';
  return '#FF5252';
}

function DebtChart({ chartData, height = 'h-[280px]' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
      className={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip isAnimationActive={false}
            contentStyle={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
            labelStyle={{ color: '#666' }}
            formatter={(value) => {
              const color = value >= 0 ? '#69F0AE' : '#FF8A80';
              return [<span style={{ color }}>{value > 0 ? '+' : ''}{value.toFixed(1)}h</span>, <span style={{ color: '#666' }}>Sleep Debt</span>];
            }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <Bar dataKey="debt" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.debt >= 0 ? '#69F0AE' : '#FF8A80'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default function SleepDebtTracker({ sleepDebt, sleepDebtAlltime, records }) {
  const [maximized, setMaximized] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('latest');

  const allChartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    const sorted = [...records].filter(r => r.date).sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return [];

    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted[sorted.length - 1].date);
    const today = new Date().toISOString().slice(0, 10);
    if (today > sorted[sorted.length - 1].date) endDate.setTime(new Date(today).getTime());

    const byDate = {};
    sorted.forEach(r => {
      if (r.sleep && r.sleep.total_sleep_hrs != null) {
        const slept = r.sleep.total_sleep_hrs;
        const needed = 7; // Mayo Clinic: adults need 7+ hours
        const debt = Math.max(-7, Math.min(slept - needed, 16)); // Cap deficit at -7h
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
        data.push({ date: dateStr.slice(5), fullDate: dateStr, debt: -7 });
      }
      d.setDate(d.getDate() + 1);
    }
    return data;
  }, [records]);

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
    for (let i = allChartData.length - 1; i >= 0; i--) {
      if (allChartData[i].debt < 0) streak++;
      else break;
    }
    const severity = cumulative >= 0 ? 'SURPLUS' : cumulative > -10 ? 'MILD' : cumulative > -20 ? 'MODERATE' : 'SEVERE';
    return { cumulative: +cumulative.toFixed(1), severity, bestDay, worstDay, streak, daysTracked: allChartData.length };
  }, [allChartData]);

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

  const chartData = useMemo(() => {
    if (selectedWeek === 'all') return allChartData;
    if (selectedWeek === 'latest') return allChartData.slice(-7);
    const week = weeks.find(w => w.key === selectedWeek);
    if (week) return allChartData.slice(week.start, week.end);
    return allChartData;
  }, [selectedWeek, allChartData, weeks]);

  // Calculate stats based on the SELECTED time period, not always all-time
  const periodStats = useMemo(() => {
    if (chartData.length === 0) return { cumulative: 0, severity: 'UNKNOWN', bestDay: null, worstDay: null, streak: 0, daysTracked: 0 };
    let cumulative = 0;
    let bestDay = null, worstDay = null;
    let streak = 0;
    chartData.forEach(d => {
      cumulative += d.debt;
      if (!bestDay || d.debt > bestDay.debt) bestDay = d;
      if (!worstDay || d.debt < worstDay.debt) worstDay = d;
    });
    // Cap worst day display at -7
    if (worstDay && worstDay.debt < -7) worstDay = { ...worstDay, debt: -7 };
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].debt < 0) streak++;
      else break;
    }
    const sev = cumulative >= 0 ? 'SURPLUS' : cumulative > -10 ? 'MILD' : cumulative > -20 ? 'MODERATE' : 'SEVERE';
    return { cumulative: +cumulative.toFixed(1), severity: sev, bestDay, worstDay, streak, daysTracked: chartData.length };
  }, [chartData]);

  const cumulativeDebt = periodStats.cumulative ?? 0;
  const severity = periodStats.severity || 'UNKNOWN';
  const alltime = {
    best_day: periodStats.bestDay ? { surplus_hrs: periodStats.bestDay.debt, date: periodStats.bestDay.fullDate } : null,
    worst_day: periodStats.worstDay ? { deficit_hrs: periodStats.worstDay.debt, date: periodStats.worstDay.fullDate } : null,
    streak_deficit: periodStats.streak,
    days_tracked: periodStats.daysTracked,
  };

  if (allChartData.length === 0) return null;

  const sevColor = getSeverityColor(severity);
  const isSevere = severity === 'SEVERE';

  return (
    <>
      <WidgetCard
        title="Sleep Debt"
        glowColor={sevColor}
        headerRight={
          <div className="flex items-center gap-2">
            <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}
              className="bg-white/[0.03] text-[10px] text-gray-400 border border-white/[0.06] rounded-lg px-2 py-1 outline-none focus:border-[#00E676]/30 cursor-pointer">
              <option value="latest">Latest Week</option>
              <option value="all">All Time</option>
              {weeks.map(w => (<option key={w.key} value={w.key}>{w.label}</option>))}
            </select>
            <MaximizeButton onClick={() => setMaximized(true)} />
          </div>
        }
      >
        <div className="flex items-baseline gap-3 mb-4">
          <AnimatedNumber value={cumulativeDebt} duration={1200} decimals={1} className="text-4xl font-black font-mono tabular-nums" style={{ color: sevColor }} />
          <span className="text-lg font-bold" style={{ color: sevColor }}>h</span>
          <span className="text-sm text-gray-500">cumulative</span>
          {severity && (
            <motion.span 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ 
                backgroundColor: isSevere ? 'rgba(255, 82, 82, 0.2)' : `${sevColor}12`, 
                color: sevColor, 
                border: `1px solid ${isSevere ? 'rgba(255, 82, 82, 0.4)' : `${sevColor}20`}`,
                boxShadow: isSevere ? '0 0 12px rgba(255, 82, 82, 0.3)' : 'none',
              }}
            >
              {severity}
            </motion.span>
          )}
        </div>
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            {chartData.length > 0 && <DebtChart chartData={chartData} />}
          </div>
          <div className="w-[120px] flex-shrink-0 flex flex-col justify-center gap-4">
            {alltime.best_day && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Best Day</div>
                <div className="text-lg font-bold text-[#00E676] font-mono tabular-nums">+{alltime.best_day.surplus_hrs}h</div>
                <div className="text-[10px] text-gray-500">{alltime.best_day.date}</div>
              </motion.div>
            )}
            {alltime.worst_day && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Worst Day</div>
                <div className="text-lg font-bold text-[#FF5252] font-mono tabular-nums">{alltime.worst_day.deficit_hrs}h</div>
                <div className="text-[10px] text-gray-500">{alltime.worst_day.date}</div>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Deficit Streak</div>
              <div className="text-lg font-bold text-gray-200 font-mono tabular-nums">{alltime.streak_deficit ?? 0} <span className="text-xs text-gray-500 font-sans">days</span></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Tracked</div>
              <div className="text-lg font-bold text-gray-200 font-mono tabular-nums">{alltime.days_tracked ?? 0} <span className="text-xs text-gray-500 font-sans">days</span></div>
            </motion.div>
          </div>
        </div>
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Sleep Debt Tracker" onClose={() => setMaximized(false)}>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-5xl font-black font-mono tabular-nums" style={{ color: sevColor }}>
              {cumulativeDebt != null ? `${cumulativeDebt > 0 ? '+' : ''}${cumulativeDebt.toFixed(1)}h` : 'N/A'}
            </span>
            <span className="text-lg text-gray-500">cumulative</span>
            <div className="ml-auto">
              <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}
                className="bg-white/[0.03] text-xs text-gray-400 border border-white/[0.06] rounded-lg px-3 py-1.5 outline-none focus:border-[#00E676]/30 cursor-pointer">
                <option value="latest">Latest Week</option>
                <option value="all">All Time</option>
                {weeks.map(w => (<option key={w.key} value={w.key}>{w.label}</option>))}
              </select>
            </div>
          </div>
          {chartData.length > 0 && <DebtChart chartData={chartData} height="h-[200px]" />}
          <div className="grid grid-cols-4 gap-6 mt-4">
            {alltime.best_day && (<div><div className="text-xs text-gray-500">Best Day</div><div className="text-2xl font-bold text-[#00E676] font-mono tabular-nums">+{alltime.best_day.surplus_hrs}h</div><div className="text-xs text-gray-500">{alltime.best_day.date}</div></div>)}
            {alltime.worst_day && (<div><div className="text-xs text-gray-500">Worst Day</div><div className="text-2xl font-bold text-[#FF5252] font-mono tabular-nums">{alltime.worst_day.deficit_hrs}h</div><div className="text-xs text-gray-500">{alltime.worst_day.date}</div></div>)}
            <div><div className="text-xs text-gray-500">Deficit Streak</div><div className="text-2xl font-bold text-white font-mono tabular-nums">{alltime.streak_deficit ?? 0} days</div></div>
            <div><div className="text-xs text-gray-500">Days Tracked</div><div className="text-2xl font-bold text-white font-mono tabular-nums">{alltime.days_tracked ?? 0}</div></div>
          </div>
        </MaximizedOverlay>
      )}
    </>
  );
}
