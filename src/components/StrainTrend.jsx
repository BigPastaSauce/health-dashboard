import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function getStrainColor(strain) {
  if (strain >= 18) return '#FF1744';
  if (strain >= 14) return '#FF9100';
  if (strain >= 10) return '#FFD600';
  return '#00E676';
}

export default function StrainTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.strain?.strain != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', strain: r.strain.strain }));

  const avg = chartData.reduce((sum, d) => sum + d.strain, 0) / (chartData.length || 1);
  const current = chartData.length > 0 ? chartData[chartData.length - 1].strain : null;

  const chart = (height = 'flex-1 min-h-0') => (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={[0, 21]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [`${value.toFixed(1)}`, 'Strain']}
          />
          <Bar dataKey="strain" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getStrainColor(entry.strain)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <WidgetCard
        title="Strain Trend"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold" style={{ color: getStrainColor(current || 0) }}>
            {current?.toFixed(1) || '--'}
          </span>
          <span className="text-sm text-whoop-textDim">/21</span>
          <span className="text-xs text-whoop-textDim ml-auto">avg: {avg.toFixed(1)}</span>
        </div>
        {chart()}
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Strain Trend" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
