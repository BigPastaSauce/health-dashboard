import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import WidgetCard from './WidgetCard';
import { useTimeframeFilter, TimeframeSelector, MaximizeButton, MaximizedOverlay } from './ChartControls';

function getZoneColor(score) {
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF1744';
}

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={5} fill={getZoneColor(payload.recovery)} stroke="#1a1a2e" strokeWidth={2} />;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  if (val == null) return null;
  const color = getZoneColor(val);
  return (
    <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ color: '#8888AA', fontSize: 12 }}>{label}</div>
      <div style={{ color, fontWeight: 'bold', fontSize: 14 }}>Recovery: {val}%</div>
    </div>
  );
}

function RecoveryChart({ chartData, height = 'flex-1 min-h-0', gradientId = 'recoveryGrad' }) {
  const containerRef = useRef(null);
  const [plotDims, setPlotDims] = useState({ top: 5, bottom: 335 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const h = containerRef.current.clientHeight;
        // margin top=5, XAxis ~25px from bottom
        setPlotDims({ top: 5, bottom: h - 25 });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div ref={containerRef} className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1={plotDims.top} x2="0" y2={plotDims.bottom} gradientUnits="userSpaceOnUse">
              {/* Top of chart = 100% recovery (green) */}
              <stop offset="0%" stopColor="#00E676" />
              <stop offset="33%" stopColor="#00E676" />
              <stop offset="34%" stopColor="#FFD600" />
              <stop offset="66%" stopColor="#FFD600" />
              <stop offset="67%" stopColor="#FF1744" />
              <stop offset="100%" stopColor="#FF1744" />
            </linearGradient>
          </defs>
          <ReferenceArea y1={0} y2={33} fill="#FF1744" fillOpacity={0.06} />
          <ReferenceArea y1={33} y2={66} fill="#FFD600" fillOpacity={0.06} />
          <ReferenceArea y1={66} y2={100} fill="#00E676" fillOpacity={0.06} />
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
          <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="linear"
            dataKey="recovery"
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function RecoveryTrend({ records }) {
  const [maximized, setMaximized] = useState(false);
  const { timeframe, setTimeframe, filteredRecords } = useTimeframeFilter(records);

  if (!records || records.length === 0) return null;

  const chartData = (filteredRecords || [])
    .filter(r => r.recovery?.score != null)
    .map(r => ({ date: r.date?.slice(5) || 'Today', recovery: r.recovery.score }));

  return (
    <>
      <WidgetCard
        title="Recovery Trend"
        headerRight={<><TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} /><MaximizeButton onClick={() => setMaximized(true)} /></>}
      >
        <RecoveryChart chartData={chartData} gradientId="recoveryGradMain" />
      </WidgetCard>
      {maximized && (
        <MaximizedOverlay title="Recovery Trend" onClose={() => setMaximized(false)}>
          <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          <RecoveryChart chartData={chartData} height="h-[400px]" gradientId="recoveryGradMax" />
        </MaximizedOverlay>
      )}
    </>
  );
}
