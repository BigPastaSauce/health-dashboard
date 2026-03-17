import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

export default function HRVTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.recovery?.hrv_rmssd_milli != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', hrv: Math.round(r.recovery.hrv_rmssd_milli) }));

  const avg = chartData.reduce((sum, d) => sum + d.hrv, 0) / (chartData.length || 1);

  const chart = (height = 'flex-1 min-h-0') => (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#9ca3af' }} />
          <Line type="monotone" dataKey="hrv" stroke="#B388FF" strokeWidth={2} dot={{ fill: '#B388FF', r: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <WidgetCard
        title="HRV Trend"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-whoop-text">
            {chartData.length > 0 ? chartData[chartData.length - 1].hrv : '--'}
          </span>
          <span className="text-sm text-whoop-textDim">ms</span>
          <span className="text-sm text-whoop-textDim ml-auto">avg: {Math.round(avg)} ms</span>
        </div>
        {chart()}
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="HRV Trend" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
