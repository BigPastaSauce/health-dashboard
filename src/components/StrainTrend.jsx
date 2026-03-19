import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function getStrainColor(strain) {
  if (strain >= 18) return '#00E676';
  if (strain >= 14) return '#69F0AE';
  if (strain >= 10) return '#FFD600';
  if (strain >= 6) return '#FF9100';
  return '#FF5252';
}

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={4} fill={getStrainColor(payload.strain)} stroke="#12131a" strokeWidth={2} />;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  if (val == null) return null;
  return (
    <div style={{ backgroundColor: '#1a1b25', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 12px' }}>
      <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
      <div style={{ color: getStrainColor(val), fontWeight: 'bold', fontSize: 14 }}>Strain: {val.toFixed(1)}</div>
    </div>
  );
}

function StrainChart({ chartData, height = 'flex-1 min-h-0', gradientId = 'strainGrad' }) {
  const containerRef = useRef(null);
  const [plotDims, setPlotDims] = useState({ top: 5, bottom: 300 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const h = containerRef.current.clientHeight;
        setPlotDims({ top: 5, bottom: h - 25 });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <motion.div 
      ref={containerRef} 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
      className={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1={plotDims.top} x2="0" y2={plotDims.bottom} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00E676" />
              <stop offset="14%" stopColor="#00E676" />
              <stop offset="15%" stopColor="#69F0AE" />
              <stop offset="33%" stopColor="#69F0AE" />
              <stop offset="34%" stopColor="#FFD600" />
              <stop offset="52%" stopColor="#FFD600" />
              <stop offset="53%" stopColor="#FF9100" />
              <stop offset="71%" stopColor="#FF9100" />
              <stop offset="72%" stopColor="#FF5252" />
              <stop offset="100%" stopColor="#FF5252" />
            </linearGradient>
          </defs>
          <ReferenceArea y1={0} y2={6} fill="#FF5252" fillOpacity={0.03} />
          <ReferenceArea y1={6} y2={10} fill="#FF9100" fillOpacity={0.03} />
          <ReferenceArea y1={10} y2={14} fill="#FFD600" fillOpacity={0.03} />
          <ReferenceArea y1={14} y2={18} fill="#69F0AE" fillOpacity={0.03} />
          <ReferenceArea y1={18} y2={21} fill="#00E676" fillOpacity={0.03} />
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 11 }} />
          <YAxis tick={{ fill: '#555', fontSize: 11 }} domain={[0, 21]} />
          <Tooltip isAnimationActive={false} content={<CustomTooltip />} />
          <Line type="linear" dataKey="strain" stroke={`url(#${gradientId})`} strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
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

  return (
    <>
      <WidgetCard
        title="Strain Trend"
        glowColor="#FFD600"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <AnimatedNumber value={current || 0} duration={1200} decimals={1} className="text-2xl font-bold font-mono tabular-nums" style={{ color: getStrainColor(current || 0) }} />
          <span className="text-sm text-gray-500">/21</span>
          <span className="text-sm ml-auto text-gray-500">avg: <span style={{ color: getStrainColor(avg) }} className="font-bold font-mono tabular-nums">{avg.toFixed(1)}</span></span>
        </div>
        <StrainChart chartData={chartData} gradientId="strainGradMain" />
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Strain Trend" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          <StrainChart chartData={chartData} height="h-[400px]" gradientId="strainGradMax" />
        </MaximizedOverlay>
      )}
    </>
  );
}
