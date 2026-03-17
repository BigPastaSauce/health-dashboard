import { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

// Nami's BMR (Mifflin-St Jeor): 2,081
const BMR = 2081;

function getCalColor(calories) {
  const diff = calories - BMR;
  if (diff < 0) return '#FF8A80';      // Below BMR = surplus (red)
  if (diff <= 500) return '#FFD600';    // 0-500 above = budget (yellow)
  return '#69F0AE';                      // 500+ above = deficit (green)
}

export default function CaloriesTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = useMemo(() => {
    const data = (filteredRecords || [])
      .filter(r => r.strain?.calories != null)
      .map(r => ({
        date: r.date?.slice(5) || 'Today',
        calories: Math.round(r.strain.calories),
      }));
    // Compute rolling average
    const window = 7;
    return data.map((d, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      const avg = Math.round(slice.reduce((s, x) => s + x.calories, 0) / slice.length);
      return { ...d, avg };
    });
  }, [filteredRecords]);

  if (chartData.length === 0) return null;

  const avg = Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length);
  const max = Math.max(...chartData.map(d => d.calories));
  const min = Math.min(...chartData.map(d => d.calories));
  const total = chartData.reduce((sum, d) => sum + d.calories, 0);
  const latest = chartData[chartData.length - 1]?.calories || 0;
  const latestColor = getCalColor(latest);

  const chart = (height = 'flex-1 min-h-0') => (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#9ca3af' }}
            formatter={(value, name) => {
              if (name === 'avg') return [`${value.toLocaleString()} cal`, '7-Day Avg'];
              const color = getCalColor(value);
              const diff = value - BMR;
              const label = diff < 0 ? 'Surplus' : diff <= 500 ? 'Budget' : 'Deficit';
              return [<span style={{ color }}>{value.toLocaleString()} cal ({label})</span>, 'Burned'];
            }}
          />
          <ReferenceLine y={BMR} stroke="#FF9100" strokeDasharray="5 5" strokeWidth={2}
            label={{ value: `BMR ${BMR}`, position: 'right', fill: '#FF9100', fontSize: 10 }} />
          <ReferenceLine y={BMR + 500} stroke="#69F0AE" strokeDasharray="3 3" strokeWidth={1}
            label={{ value: 'Deficit zone', position: 'right', fill: '#69F0AE', fontSize: 9 }} />
          <Bar dataKey="calories" radius={[4, 4, 0, 0]} fillOpacity={0.85}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getCalColor(entry.calories)} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="avg" stroke="#FF9100" strokeWidth={2} dot={false} strokeDasharray="0" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <WidgetCard
        title="Calories Burned"
        headerRight={
          <div className="flex items-center gap-2">
            <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
            <MaximizeButton onClick={() => setMaximized(true)} />
          </div>
        }
      >
        <div className="flex flex-col h-full">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-black" style={{ color: latestColor }}>{latest.toLocaleString()}</span>
            <span className="text-sm text-whoop-textDim">cal today</span>
          </div>
          <div className="flex gap-3 mb-3 text-xs text-whoop-textDim flex-wrap">
            <span>BMR: <span className="text-[#FF9100] font-semibold">{BMR.toLocaleString()}</span></span>
            <span>Avg: <span className="text-whoop-text font-semibold">{avg.toLocaleString()}</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF8A80] inline-block"></span> Surplus</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFD600] inline-block"></span> Budget</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#69F0AE] inline-block"></span> Deficit</span>
          </div>
          {chart()}
        </div>
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Calories Burned" onClose={() => setMaximized(false)}>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-black" style={{ color: getCalColor(avg) }}>{avg.toLocaleString()}</span>
            <span className="text-lg text-gray-400">avg cal/day</span>
            <span className="text-sm text-gray-500 ml-auto">Total: {total.toLocaleString()} cal</span>
          </div>
          <div className="flex gap-4 mb-4 text-sm text-gray-400 flex-wrap">
            <span>BMR: <span className="text-[#FF9100] font-semibold">{BMR.toLocaleString()}</span></span>
            <span>High: <span className="text-[#69F0AE] font-semibold">{max.toLocaleString()}</span></span>
            <span>Low: <span className="text-[#FF8A80] font-semibold">{min.toLocaleString()}</span></span>
            <span>Days: <span className="text-white font-semibold">{chartData.length}</span></span>
            <div className="ml-auto">
              <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
            </div>
          </div>
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
