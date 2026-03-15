import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

export default function WeightTracker({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.body?.weight_lbs != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', weight: r.body.weight_lbs }));

  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : null;

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
          <Line type="monotone" dataKey="weight" stroke="#18FFFF" strokeWidth={2} dot={{ fill: '#18FFFF', r: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <WidgetCard
        title="Weight"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-whoop-text">
            {currentWeight != null ? currentWeight.toFixed(1) : '--'}
          </span>
          <span className="text-sm text-whoop-textDim">lbs</span>
        </div>
        {chart()}
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Weight Tracker" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
