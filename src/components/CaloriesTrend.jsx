import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function CaloriesChart({ chartData, height = 'h-56' }) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#9ca3af' }}
            formatter={(value) => [`${value.toLocaleString()} cal`, 'Calories']}
          />
          <Bar dataKey="calories" fill="#FF9100" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CaloriesTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.strain?.calories != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', calories: r.strain.calories }));

  const avg = Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / (chartData.length || 1));
  const total = chartData.reduce((sum, d) => sum + d.calories, 0);

  return (
    <>
      <WidgetCard
        title="Calories Burned"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-[#FF9100]">
            {chartData.length > 0 ? chartData[chartData.length - 1].calories.toLocaleString() : '--'}
          </span>
          <span className="text-sm text-whoop-textDim">cal today</span>
          <span className="text-xs text-whoop-textDim ml-auto">avg: {avg.toLocaleString()}</span>
        </div>
        <CaloriesChart chartData={chartData} />
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Calories Burned" onClose={() => setMaximized(false)}>
          <div className="flex items-center gap-4 mb-4">
            <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
            <span className="text-sm text-gray-400 ml-auto">Avg: {avg.toLocaleString()} cal/day | Total: {total.toLocaleString()} cal</span>
          </div>
          <CaloriesChart chartData={chartData} height="h-[400px]" />
        </MaximizedOverlay>
      )}
    </>
  );
}

