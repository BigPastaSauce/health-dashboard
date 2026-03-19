import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

const BMR = 2081;

function getCalColor(calories) {
  const diff = calories - BMR;
  if (diff < 0) return '#FF8A80';
  if (diff <= 500) return '#FFD600';
  return '#69F0AE';
}

export default function CaloriesTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = useMemo(() => {
    const data = (filteredRecords || [])
      .filter(r => r.strain?.calories != null)
      .map(r => ({ date: r.date?.slice(5) || 'Today', calories: Math.round(r.strain.calories) }));
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
  const latest = chartData[chartData.length - 1]?.calories || 0;
  const latestColor = getCalColor(latest);

  const chart = (height = 'flex-1 min-h-0') => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
      className={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip isAnimationActive={false}
            contentStyle={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
            labelStyle={{ color: '#666' }} itemStyle={{ color: '#666' }}
            formatter={(value, name) => {
              if (name === 'avg') return [`${value.toLocaleString()} cal`, '7-Day Avg'];
              const color = getCalColor(value);
              return [<span style={{ color }}>{value.toLocaleString()} cal</span>, 'Burned'];
            }}
          />
          <ReferenceLine y={BMR} stroke="#FF9100" strokeDasharray="5 5" strokeWidth={1.5}
            label={{ value: `BMR ${BMR}`, position: 'right', fill: '#FF9100', fontSize: 10 }} />
          <Bar dataKey="calories" radius={[4, 4, 0, 0]} fillOpacity={0.8}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getCalColor(entry.calories)} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="avg" stroke="#FF9100" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <>
      <WidgetCard
        title="Calories Burned"
        glowColor="#FFD600"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-baseline gap-3 mb-2">
            <AnimatedNumber value={latest} duration={1200} className="text-4xl font-black font-mono tabular-nums" style={{ color: latestColor }} />
            <span className="text-sm text-gray-400 font-medium">cal today</span>
          </div>
          <div className="flex gap-4 mb-3 text-xs flex-wrap items-center">
            <span className="text-gray-500">BMR: <span className="text-[#FF9100] font-bold font-mono tabular-nums">{BMR.toLocaleString()}</span></span>
            <span className="text-gray-500">Avg: <span className="text-gray-200 font-bold font-mono tabular-nums">{avg.toLocaleString()}</span></span>
            <div className="flex items-center gap-3 ml-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF8A80] inline-block" /><span className="text-gray-400">Surplus</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFD600] inline-block" /><span className="text-gray-400">Budget</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#69F0AE] inline-block" /><span className="text-gray-400">Deficit</span></span>
            </div>
          </div>
          {chart()}
        </div>
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Calories Burned" onClose={() => setMaximized(false)}>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-black font-mono tabular-nums" style={{ color: getCalColor(avg) }}>{avg.toLocaleString()}</span>
            <span className="text-lg text-gray-500">avg cal/day</span>
            <div className="ml-auto"><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /></div>
          </div>
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
