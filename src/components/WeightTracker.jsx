import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

export default function WeightTracker({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.body?.weight_lbs != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', weight: r.body.weight_lbs }));

  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : null;
  const minWeight = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) : 0;
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0;
  const weightChange = chartData.length >= 2 ? (chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1) : null;
  const changeColor = weightChange > 0 ? '#FF9100' : weightChange < 0 ? '#00E676' : '#9ca3af';

  const chart = (height = 'flex-1 min-h-0') => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
      className={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#18FFFF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#18FFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip isAnimationActive={false} 
            contentStyle={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
            labelStyle={{ color: '#666' }}
            formatter={(value) => [<span style={{ color: '#18FFFF' }}>{value.toFixed(1)} lbs</span>, 'Weight']}
          />
          <Area type="monotone" dataKey="weight" fill="url(#weightGrad)" stroke="none" />
          <Line type="monotone" dataKey="weight" stroke="#18FFFF" strokeWidth={2.5} dot={{ fill: '#18FFFF', r: 2.5 }} activeDot={{ r: 5, fill: '#18FFFF', stroke: '#18FFFF33', strokeWidth: 8 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <>
      <WidgetCard
        title="Weight"
        glowColor="#18FFFF"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <AnimatedNumber value={currentWeight || 0} duration={1200} decimals={1} className="text-4xl font-black text-gray-100 font-mono tabular-nums" />
          <span className="text-base text-gray-500 font-medium">lbs</span>
          {weightChange && (
            <span className="text-sm font-bold ml-2" style={{ color: changeColor }}>
              {weightChange > 0 ? '+' : ''}{weightChange} lbs
            </span>
          )}
        </div>
        {chart()}
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Weight Tracker" onClose={() => setMaximized(false)}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-4xl font-black text-gray-100 font-mono tabular-nums">{currentWeight?.toFixed(1) || '--'}</span>
            <span className="text-lg text-gray-500">lbs</span>
            <div className="ml-auto"><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /></div>
          </div>
          {chart('h-[400px]')}
        </MaximizedOverlay>
      )}
    </>
  );
}
