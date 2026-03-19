import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function SleepChart({ chartData, height = 'flex-1 min-h-0' }) {
  return (
    <div className="flex flex-col h-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className={height}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip isAnimationActive={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const colors = { deep: '#448AFF', rem: '#B388FF', light: '#18FFFF', awake: '#FF5252' };
                const labels = { deep: 'Deep', rem: 'REM', light: 'Light', awake: 'Awake' };
                return (
                  <div style={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: colors[p.dataKey] || '#666', fontSize: 13, fontWeight: 600 }}>
                        {labels[p.dataKey] || p.dataKey}: {p.value.toFixed(1)}h
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="deep" stackId="1" fill="#448AFF" radius={[0, 0, 0, 0]} fillOpacity={0.85} />
            <Bar dataKey="rem" stackId="1" fill="#B388FF" fillOpacity={0.85} />
            <Bar dataKey="light" stackId="1" fill="#18FFFF" fillOpacity={0.85} />
            <Bar dataKey="awake" stackId="1" fill="#FF5252" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
      <div className="flex gap-3 mt-2">
        {[
          { color: '#448AFF', label: 'Deep' },
          { color: '#B388FF', label: 'REM' },
          { color: '#18FFFF', label: 'Light' },
          { color: '#FF5252', label: 'Awake' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SleepTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || []).map(r => ({
    date: r.date?.slice(5) || 'Today',
    deep: r.sleep?.deep_sleep_hrs || 0,
    rem: r.sleep?.rem_sleep_hrs || 0,
    light: r.sleep?.light_sleep_hrs || 0,
    awake: r.sleep?.total_awake_hrs || 0,
    total: r.sleep?.total_sleep_hrs || 0,
  }));

  const avgSleep = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length : 0;
  const current = chartData.length > 0 ? chartData[chartData.length - 1].total : 0;

  const formatHrs = (h) => { const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return `${hrs}h ${mins}m`; };
  const getSleepColor = (h) => h >= 7.5 ? '#00E676' : h >= 6 ? '#FFD600' : '#FF5252';

  return (
    <>
      <WidgetCard
        title="Sleep Trend"
        glowColor="#448AFF"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold font-mono tabular-nums" style={{ color: getSleepColor(current) }}>{formatHrs(current)}</span>
          <span className="text-sm ml-auto text-gray-500">avg: <span style={{ color: getSleepColor(avgSleep) }} className="font-bold font-mono tabular-nums">{formatHrs(avgSleep)}</span></span>
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
