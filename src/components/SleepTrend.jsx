import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function SleepChart({ chartData, height = 'flex-1 min-h-0' }) {
  return (<div className="flex flex-col h-full">
      <div className={height}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
            <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#9ca3af' }}
              formatter={(value, name) => {
                const labels = { deep: 'Deep', rem: 'REM', light: 'Light', awake: 'Awake' };
                return [`${value.toFixed(1)}h`, labels[name] || name];
              }}
            />
            <Area type="monotone" dataKey="deep" stackId="1" stroke="#448AFF" fill="#448AFF" fillOpacity={0.8} />
            <Area type="monotone" dataKey="rem" stackId="1" stroke="#B388FF" fill="#B388FF" fillOpacity={0.8} />
            <Area type="monotone" dataKey="light" stackId="1" stroke="#18FFFF" fill="#18FFFF" fillOpacity={0.6} />
            <Area type="monotone" dataKey="awake" stackId="1" stroke="#FF1744" fill="#FF1744" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#448AFF]" /><span className="text-xs text-whoop-textDim">Deep</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#B388FF]" /><span className="text-xs text-whoop-textDim">REM</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#18FFFF]" /><span className="text-xs text-whoop-textDim">Light</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF1744]" /><span className="text-xs text-whoop-textDim">Awake</span></div>
      </div>
    </div>
  );
}

export default function SleepTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.sleep)
    .map(r => ({
      date: r.date?.slice(5) || 'Today',
      deep: r.sleep.deep_sleep_hrs,
      rem: r.sleep.rem_sleep_hrs,
      light: r.sleep.light_sleep_hrs,
      awake: r.sleep.total_awake_hrs,
      total: r.sleep.total_sleep_hrs || 0,
    }));

  const avgSleep = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length
    : 0;
  const current = chartData.length > 0 ? chartData[chartData.length - 1].total : 0;

  const formatHrs = (h) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const getSleepColor = (h) => {
    if (h >= 7.5) return '#00E676';
    if (h >= 7) return '#69F0AE';
    if (h >= 6) return '#FFD600';
    if (h >= 5) return '#FF9100';
    return '#FF1744';
  };

  return (
    <>
      <WidgetCard
        title="Sleep Trend"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold" style={{ color: getSleepColor(current) }}>
            {formatHrs(current)}
          </span>
          <span className="text-sm ml-auto">avg: <span style={{ color: getSleepColor(avgSleep) }}>{formatHrs(avgSleep)}</span></span>
        </div>
        <SleepChart chartData={chartData} />
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Sleep Trend" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          <SleepChart chartData={chartData} height="h-[400px]" />
        </MaximizedOverlay>
      )}
    </>
  );
}






