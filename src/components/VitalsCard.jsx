import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';



function VitalStat({ label, value, unit, color = '#E0E0E0' }) {
  return (
    <div className="text-center">
      <div className="text-xs text-whoop-textDim mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-whoop-textDim">{unit}</div>
    </div>
  );
}

function RHRChart({ chartData, height = 'flex-1 min-h-0' }) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 10 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#9ca3af' }} />
          <Line type="monotone" dataKey="rhr" stroke="#FF5252" strokeWidth={2} dot={{ fill: '#FF5252', r: 3 }} name="RHR" />
          <Line type="monotone" dataKey="respRate" stroke="#69F0AE" strokeWidth={2} dot={{ fill: '#69F0AE', r: 3 }} name="Resp Rate" />
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
        <div className="grid grid-cols-3 gap-3 mb-4">
          <VitalStat label="SpO2" value={`${recovery.spo2_percentage?.toFixed(1) || '--'}%`} unit="blood oxygen" color="#69F0AE" />
          <VitalStat label="Skin Temp" value={`${recovery.skin_temp_celsius?.toFixed(1) || '--'}\u00B0`} unit="celsius" color="#FFD600" />
          <VitalStat label="Resp Rate" value={sleep.respiratory_rate?.toFixed(1) || '--'} unit="breaths/min" color="#18FFFF" />
        </div>
        <div className="flex justify-center mb-4">
          <VitalStat label="Max HR" value={body.max_heart_rate || '--'} unit="bpm" color="#FF5252" />
        </div>
        <RHRChart chartData={chartData} />
        <div className="flex gap-3 mt-2 justify-center">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF5252]" /><span className="text-[10px] text-whoop-textDim">RHR</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#69F0AE]" /><span className="text-[10px] text-whoop-textDim">Resp Rate</span></div>
        </div>
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Vitals & Trends" onClose={() => setMaximized(false)}>
          <div className="flex items-center gap-4 mb-6">
            <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          </div>
          <div className="grid grid-cols-5 gap-6 mb-6">
            <VitalStat label="SpO2" value={`${recovery.spo2_percentage?.toFixed(1) || '--'}%`} unit="blood oxygen" color="#69F0AE" />
            <VitalStat label="Skin Temp" value={`${recovery.skin_temp_celsius?.toFixed(1) || '--'}\u00B0C`} unit="celsius" color="#FFD600" />
            <VitalStat label="Resp Rate" value={sleep.respiratory_rate?.toFixed(1) || '--'} unit="breaths/min" color="#18FFFF" />
            <VitalStat label="Max HR" value={body.max_heart_rate || '--'} unit="bpm" color="#FF5252" />
          </div>
          <RHRChart chartData={chartData} height="h-[350px]" />
        </MaximizedOverlay>
      )}
    </>
  );
}




