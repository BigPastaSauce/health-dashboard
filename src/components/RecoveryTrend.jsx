import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function getZoneColor(score) {
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF1744';
}

export default function RecoveryTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.recovery?.score != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', recovery: r.recovery.score }));

  const avg = chartData.reduce((sum, d) => sum + d.recovery, 0) / (chartData.length || 1);
  const current = chartData.length > 0 ? chartData[chartData.length - 1].recovery : null;

  const chart = (height = 'flex-1 min-h-0') => (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>

          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={[0, 100]} />
          <Tooltip isAnimationActive={false}
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [<span style={{ color: getZoneColor(value) }}>{Math.round(value)}%</span>, <span style={{ color: '#9ca3af' }}>Recovery</span>]}
          />
          <Bar dataKey="recovery" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getZoneColor(entry.recovery)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <WidgetCard
        title="Recovery Trend"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold" style={{ color: getZoneColor(current || 0) }}>
            {current != null ? `${Math.round(current)}%` : '--'}
          </span>
          <span className="text-sm ml-auto">avg: <span style={{ color: getZoneColor(avg) }}>{Math.round(avg)}%</span></span>
        </div>
        {chart()}
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Recovery Trend" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
