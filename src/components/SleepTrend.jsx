import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function SleepChart({ chartData, height = 'flex-1 min-h-0' }) {
  return (<div className="flex flex-col h-full">
      <div className={height}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
            <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
            <Tooltip isAnimationActive={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const colors = { deep: '#448AFF', rem: '#B388FF', light: '#18FFFF', awake: '#FF1744' };
                const labels = { deep: 'Deep', rem: 'REM', light: 'Light', awake: 'Awake' };
                return (
                  <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: colors[p.dataKey] || '#9ca3af', fontSize: 13, fontWeight: 600 }}>
                        {labels[p.dataKey] || p.dataKey}: {p.value.toFixed(1)}h
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="deep" stackId="1" fill="#448AFF" radius={[0, 0, 0, 0]} />
            <Bar dataKey="rem" stackId="1" fill="#B388FF" />
            <Bar dataKey="light" stackId="1" fill="#18FFFF" />
            <Bar dataKey="awake" stackId="1" fill="#FF1744" radius={[3, 3, 0, 0]} />
          </BarChart>
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
    .map(r => ({
      date: r.date?.slice(5) || 'Today',
      deep: r.sleep?.deep_sleep_hrs || 0,
      rem: r.sleep?.rem_sleep_hrs || 0,
      light: r.sleep?.light_sleep_hrs || 0,
      awake: r.sleep?.total_awake_hrs || 0,
      total: r.sleep?.total_sleep_hrs || 0,
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
