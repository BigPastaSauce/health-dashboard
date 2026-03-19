import { motion } from 'framer-motion';
import { AnimatedNumber } from '../hooks/useCountUp';

function getZoneColor(score) {
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF5252';
}

function getZoneGlow(score) {
  if (score >= 67) return 'rgba(0, 230, 118, 0.4)';
  if (score >= 34) return 'rgba(255, 214, 0, 0.3)';
  return 'rgba(255, 82, 82, 0.3)';
}

function getZoneLabel(score) {
  if (score >= 67) return 'Green';
  if (score >= 34) return 'Yellow';
  return 'Red';
}

export default function RecoveryRing({ data, comparison }) {
  if (!data?.recovery) return (
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-600 text-sm">No recovery data</div>
    </div>
  );

  const { score, zone, resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius } = data.recovery;
  const color = getZoneColor(score);
  const glow = getZoneGlow(score);
  const isGoodRecovery = score > 60;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const stats = [
    { label: 'RHR', value: resting_heart_rate, unit: 'bpm', color: '#FF5252' },
    { label: 'HRV', value: hrv_rmssd_milli != null ? Math.round(hrv_rmssd_milli) : null, unit: 'ms', color: '#B388FF' },
    { label: 'SpO2', value: spo2_percentage != null ? Math.round(spo2_percentage * 10) / 10 : null, unit: '%', color: '#69F0AE' },
    { label: 'Skin', value: skin_temp_celsius != null ? Math.round(skin_temp_celsius * 10) / 10 : null, unit: '°C', color: '#FFD600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative bg-[#12131a]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] h-full overflow-hidden"
      style={{ boxShadow: `0 0 30px ${glow}10, 0 4px 24px rgba(0,0,0,0.4)` }}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 20px ${glow}` }} />

      <div className="flex flex-col items-center justify-between h-full p-5">
        {/* Ring — centered */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative" style={{ width: 260, height: 260 }}>
            {/* Glow */}
            <motion.div 
              className="absolute inset-0 rounded-full" 
              style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, filter: 'blur(20px)', transform: 'scale(1.2)' }}
              animate={isGoodRecovery ? { opacity: [0.6, 1, 0.6], scale: [1.2, 1.35, 1.2] } : {}}
              transition={isGoodRecovery ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : {}}
            />
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 relative z-10">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <motion.circle
                cx="100" cy="100" r={radius} fill="none"
                stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <AnimatedNumber value={score} duration={1500} className="text-7xl font-black font-mono tabular-nums" style={{ color }} />
              <span className="text-sm text-gray-400 mt-2 font-semibold tracking-[0.2em] uppercase">Recovery</span>
              <span className="text-xs font-semibold mt-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                {getZoneLabel(score)}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison */}
        {comparison && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 py-2"
          >
            <motion.span animate={{ y: comparison.improved ? [-1, 1, -1] : [1, -1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="text-sm font-bold" style={{ color: comparison.improved ? '#00E676' : '#FF5252' }}
            >
              {comparison.improved ? '↑' : '↓'}
            </motion.span>
            <span className="text-base text-gray-400">{Math.abs(comparison.diff)}% vs last week</span>
          </motion.div>
        )}

        {/* Stats row — pinned to bottom */}
        <div className="grid grid-cols-4 gap-2 w-full flex-shrink-0">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="text-center px-1 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="text-xs text-gray-500 mb-0.5 tracking-wide font-medium">{stat.label}</div>
              <div className="text-lg font-bold font-mono tabular-nums" style={{ color: stat.color }}>
                {stat.value ?? '--'}<span className="text-[10px] text-gray-500 ml-1">{stat.unit}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
