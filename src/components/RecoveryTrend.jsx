import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function getZoneColor(score) {
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF5252';
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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
      className={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={[0, 100]} />
          <Tooltip isAnimationActive={false}
            contentStyle={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
            labelStyle={{ color: '#666' }}
            formatter={(value) => [<span style={{ color: getZoneColor(value) }}>{Math.round(value)}%</span>, <span style={{ color: '#666' }}>Recovery</span>]}
          />
          <Bar dataKey="recovery" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getZoneColor(entry.recovery)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <>
      <WidgetCard
        title="Recovery Trend"
        glowColor="#00E676"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <AnimatedNumber value={current || 0} duration={1200} className="text-2xl font-bold font-mono tabular-nums" style={{ color: getZoneColor(current || 0) }} />
          <span className="text-sm font-bold" style={{ color: getZoneColor(current || 0) }}>%</span>
          <span className="text-sm ml-auto text-gray-500">avg: <span style={{ color: getZoneColor(avg) }} className="font-bold font-mono tabular-nums">{Math.round(avg)}%</span></span>
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
