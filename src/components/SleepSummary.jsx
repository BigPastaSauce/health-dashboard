import { motion } from 'framer-motion';
import WidgetCard from './WidgetCard';
import { AnimatedNumber } from '../hooks/useCountUp';

export default function SleepSummary({ data, records, comparison }) {
  if (!data?.sleep) return (
    <WidgetCard title="Sleep" className="items-center justify-center">
      <div className="text-gray-600 text-sm">No sleep data</div>
    </WidgetCard>
  );

  const s = data.sleep;
  const totalSleep = s.total_sleep_hrs || 0;
  const totalHrs = Math.floor(totalSleep);
  const totalMins = Math.round((totalSleep - totalHrs) * 60);

  const sleepRecords = (records || []).filter(r => r.sleep?.total_sleep_hrs);
  const avgSleep = sleepRecords.length > 0
    ? sleepRecords.reduce((sum, r) => sum + r.sleep.total_sleep_hrs, 0) / sleepRecords.length
    : 0;

  const stages = [
    { label: 'Deep', hours: s.deep_sleep_hrs || 0, color: '#448AFF', icon: '💎' },
    { label: 'REM', hours: s.rem_sleep_hrs || 0, color: '#B388FF', icon: '🧠' },
    { label: 'Light', hours: s.light_sleep_hrs || 0, color: '#18FFFF', icon: '💤' },
    { label: 'Awake', hours: s.total_awake_hrs || 0, color: '#FF5252', icon: '👁' },
  ];

  const totalStageHrs = stages.reduce((s, st) => s + st.hours, 0) || 1;

  const formatHrs = (h) => {
    if (h == null) return '--';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const performance = s.sleep_performance ?? s.sleep_performance_pct;
  const efficiency = s.sleep_efficiency ?? s.sleep_efficiency_pct;
  const consistency = s.sleep_consistency ?? s.sleep_consistency_pct;
  const respRate = s.respiratory_rate != null ? Math.round(s.respiratory_rate * 10) / 10 : '--';

  const formatTime = (iso) => {
    if (!iso) return '--';
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  const asleepTime = formatTime(s.start);
  const awokeTime = formatTime(s.end);

  const sleepColor = totalSleep >= 7.5 ? '#00E676' : totalSleep >= 6 ? '#FFD600' : '#FF5252';

  // Efficiency ring
  const effValue = efficiency || 0;
  const effRadius = 85;
  const effCircumference = 2 * Math.PI * effRadius;
  const effOffset = effCircumference - (effValue / 100) * effCircumference;
  const effColor = effValue >= 90 ? '#00E676' : effValue >= 75 ? '#FFD600' : '#FF5252';

  return (
    <WidgetCard title="Sleep" glowColor="#448AFF">
      <div className="flex flex-col h-full">
        {/* Top: total sleep + efficiency ring side by side */}
        <div className="flex items-stretch gap-6 mb-4">
          {/* Left: sleep stats */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={totalHrs} duration={1200} className="text-6xl font-black font-mono tabular-nums" style={{ color: sleepColor }} />
              <span className="text-3xl font-bold text-gray-500">h</span>
              <AnimatedNumber value={totalMins} duration={1200} className="text-4xl font-bold font-mono tabular-nums" style={{ color: sleepColor }} />
              <span className="text-xl font-bold text-gray-500">m</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-base font-semibold text-gray-300 font-mono tabular-nums">{asleepTime}</span>
              <span className="text-sm text-gray-500">→</span>
              <span className="text-base font-semibold text-gray-300 font-mono tabular-nums">{awokeTime}</span>
              {comparison && (
                <motion.span 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  className="text-xs font-semibold"
                  style={{ color: comparison.improved ? '#00E676' : '#FF5252' }}
                >
                  {comparison.improved ? '↑' : '↓'} {Math.abs(comparison.diff)}h
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm text-gray-500">total sleep</span>
              {avgSleep > 0 && (
                <span className="text-sm text-gray-500">avg: <span className="font-bold text-gray-300 font-mono tabular-nums">{formatHrs(avgSleep)}</span></span>
              )}
            </div>
          </div>

          {/* Efficiency ring — full height of top section */}
          <div className="relative flex-shrink-0 aspect-square self-stretch" style={{ minWidth: 160, maxWidth: 220, width: '35%', marginTop: -8 }}>
            <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
              <circle cx="110" cy="110" r={effRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <motion.circle
                cx="110" cy="110" r={effRadius} fill="none"
                stroke={effColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={effCircumference}
                initial={{ strokeDashoffset: effCircumference }}
                animate={{ strokeDashoffset: effOffset }}
                transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black font-mono tabular-nums" style={{ color: effColor }}>{Math.round(effValue)}%</span>
              <span className="text-base text-gray-400 font-semibold tracking-wide">Efficiency</span>
            </div>
          </div>
        </div>

        {/* Sleep stages bars */}
        <div className="mb-4">
          {/* Stacked bar */}
          <div className="flex h-6 rounded-full overflow-hidden mb-3 bg-white/[0.02]">
            {stages.map((stage, i) => {
              const pct = (stage.hours / totalStageHrs) * 100;
              if (pct <= 0) return null;
              return (
                <motion.div
                  key={stage.label}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ backgroundColor: stage.color }}
                  title={`${stage.label}: ${formatHrs(stage.hours)}`}
                />
              );
            })}
          </div>
          {/* Stage labels — more readable */}
          <div className="grid grid-cols-4 gap-2">
            {stages.map((stage, i) => (
              <motion.div 
                key={stage.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm text-gray-400 font-medium">{stage.label}</span>
                </div>
                <span className="text-base font-bold text-gray-200 font-mono tabular-nums">{formatHrs(stage.hours)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom metrics */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-3 mt-auto flex-shrink-0">
          {[
            { label: 'Performance', value: performance != null ? `${Math.round(performance)}%` : '--' },
            { label: 'Consistency', value: consistency != null ? `${Math.round(consistency)}%` : '--' },
            { label: 'Resp. Rate', value: `${respRate}`, unit: 'br/m' },
            { label: 'Cycles', value: s.sleep_cycles ?? '--' },
            { label: 'In Bed', value: formatHrs(s.total_in_bed_hrs) },
            { label: 'Deep %', value: totalSleep > 0 ? `${Math.round((s.deep_sleep_hrs / totalSleep) * 100)}%` : '--' },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            >
              <div className="text-sm text-gray-500 tracking-wide font-medium">{item.label}</div>
              <div className="text-xl font-bold text-gray-200 font-mono tabular-nums">
                {item.value}
                {item.unit && <span className="text-xs text-gray-500 ml-1 font-sans">{item.unit}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
