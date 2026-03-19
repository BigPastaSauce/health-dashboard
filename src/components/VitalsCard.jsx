import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function VitalStat({ label, value, unit, color = '#E0E0E0', delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center px-2 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
    >
      <div className="text-[10px] text-gray-500 mb-1 tracking-wide font-medium">{label}</div>
      <div className="text-lg font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[9px] text-gray-500">{unit}</div>
    </motion.div>
  );
}

function RHRChart({ chartData, height = 'flex-1 min-h-0' }) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
          <YAxis tick={{ fill: '#666', fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip isAnimationActive={false} 
            contentStyle={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
            labelStyle={{ color: '#666' }} itemStyle={{ color: '#666' }} />
          <Line type="monotone" dataKey="rhr" stroke="#FF5252" strokeWidth={2} dot={{ fill: '#FF5252', r: 2 }} name="RHR" />
          <Line type="monotone" dataKey="respRate" stroke="#69F0AE" strokeWidth={2} dot={{ fill: '#69F0AE', r: 2 }} name="Resp Rate" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VitalsCard({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const latest = records[records.length - 1];
  const recovery = latest?.recovery || {};
  const sleep = latest?.sleep || {};
  const body = latest?.body || {};

  const chartData = (filteredRecords || [])
    .filter(r => r.recovery?.resting_heart_rate != null)
    .map(r => ({
      date: r.date?.slice(5) || 'Today',
      rhr: r.recovery.resting_heart_rate,
      spo2: r.recovery.spo2_percentage,
      skinTemp: r.recovery.skin_temp_celsius,
      respRate: r.sleep?.respiratory_rate || null,
    }));

  return (
    <>
      <WidgetCard
        title="Vitals"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <VitalStat label="SpO2" value={`${recovery.spo2_percentage?.toFixed(1) || '--'}%`} unit="blood oxygen" color="#69F0AE" delay={0.2} />
          <VitalStat label="Skin Temp" value={`${recovery.skin_temp_celsius?.toFixed(1) || '--'}°`} unit="celsius" color="#FFD600" delay={0.3} />
          <VitalStat label="Resp Rate" value={sleep.respiratory_rate?.toFixed(1) || '--'} unit="breaths/min" color="#18FFFF" delay={0.4} />
        </div>
        <div className="flex justify-center mb-4">
          <VitalStat label="Max HR" value={body.max_heart_rate || '--'} unit="bpm" color="#FF5252" delay={0.5} />
        </div>
        <RHRChart chartData={chartData} />
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#FF5252]" /><span className="text-xs text-gray-500 font-medium">RHR</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#69F0AE]" /><span className="text-xs text-gray-500 font-medium">Resp Rate</span></div>
        </div>
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Vitals & Trends" onClose={() => setMaximized(false)}>
          <div className="flex items-center gap-4 mb-6">
            <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          </div>
          <div className="grid grid-cols-5 gap-6 mb-6">
            <VitalStat label="SpO2" value={`${recovery.spo2_percentage?.toFixed(1) || '--'}%`} unit="blood oxygen" color="#69F0AE" />
            <VitalStat label="Skin Temp" value={`${recovery.skin_temp_celsius?.toFixed(1) || '--'}°C`} unit="celsius" color="#FFD600" />
            <VitalStat label="Resp Rate" value={sleep.respiratory_rate?.toFixed(1) || '--'} unit="breaths/min" color="#18FFFF" />
            <VitalStat label="Max HR" value={body.max_heart_rate || '--'} unit="bpm" color="#FF5252" />
          </div>
          <RHRChart chartData={chartData} height="h-[350px]" />
        </MaximizedOverlay>
      )}
    </>
  );
}
