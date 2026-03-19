import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

export default function HRVTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.recovery?.hrv_rmssd_milli != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', hrv: Math.round(r.recovery.hrv_rmssd_milli) }));

  const avg = chartData.reduce((sum, d) => sum + d.hrv, 0) / (chartData.length || 1);
  const current = chartData.length > 0 ? chartData[chartData.length - 1].hrv : 0;

  const chart = (height = 'flex-1 min-h-0') => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ delay: 0.3, duration: 0.5 }}
      className={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip isAnimationActive={false} 
            contentStyle={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
            labelStyle={{ color: '#666' }} itemStyle={{ color: '#666' }} />
          <Line type="monotone" dataKey="hrv" stroke="#B388FF" strokeWidth={2} dot={{ fill: '#B388FF', r: 2 }} activeDot={{ r: 5, fill: '#B388FF', stroke: '#B388FF33', strokeWidth: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <>
      <WidgetCard
        title="HRV Trend"
        glowColor="#B388FF"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <AnimatedNumber value={current} duration={1200} className="text-2xl font-bold text-gray-200 font-mono tabular-nums" />
          <span className="text-sm text-gray-500">ms</span>
          <span className="text-sm text-gray-500 ml-auto">avg: <span className="text-[#B388FF] font-bold font-mono tabular-nums">{Math.round(avg)}</span> ms</span>
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
