import { motion } from 'framer-motion';
import { AnimatedNumber } from '../hooks/useCountUp';

function getStrainColor(strain) {
  if (strain < 7) return '#448AFF';
  if (strain < 14) return '#00E676';
  if (strain < 18) return '#FFD600';
  return '#FF5252';
}

function getStrainGlow(strain) {
  if (strain < 7) return 'rgba(68, 138, 255, 0.4)';
  if (strain < 14) return 'rgba(0, 230, 118, 0.4)';
  if (strain < 18) return 'rgba(255, 214, 0, 0.4)';
  return 'rgba(255, 82, 82, 0.4)';
}

function getStrainLabel(strain) {
  if (strain < 7) return 'Light';
  if (strain < 14) return 'Moderate';
  if (strain < 18) return 'High';
  return 'Overreaching';
}

export default function StrainGauge({ data, comparison }) {
  if (!data?.strain) return (
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-600 text-sm">No strain data</div>
    </div>
  );

  const { strain, calories, average_heart_rate, max_heart_rate } = data.strain;
  const color = getStrainColor(strain);
  const glow = getStrainGlow(strain);
  const percentage = (strain / 21) * 100;
  const needleAngle = -180 + (percentage / 100) * 180;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative bg-[#12131a]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] h-full overflow-hidden"
      style={{ boxShadow: `0 0 30px ${glow}10, 0 4px 24px rgba(0,0,0,0.4)` }}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 20px ${glow}` }} />

      <div className="flex flex-col items-center justify-between h-full p-5">
        {/* Gauge — slightly below top */}
        <div className="flex-1 flex items-start justify-center w-full pt-14">
          <div className="relative" style={{ width: '100%', maxWidth: 260 }}>
            {/* Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{
              width: '80%', height: '50%',
              background: `radial-gradient(ellipse at center bottom, ${glow} 0%, transparent 70%)`,
              filter: 'blur(15px)',
            }} />
            
            <svg viewBox="0 0 200 130" className="w-full h-auto relative z-10">
              <defs>
                <linearGradient id="strainGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#448AFF" stopOpacity="0.9" />
                  <stop offset="30%" stopColor="#00E676" stopOpacity="1" />
                  <stop offset="60%" stopColor="#FFD600" stopOpacity="1" />
                  <stop offset="85%" stopColor="#FF9100" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FF5252" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Background arc — semicircle, center at (100,110), radius 80 */}
              <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
              {/* Filled arc */}
              <motion.path 
                d="M 20 110 A 80 80 0 0 1 180 110" 
                fill="none" stroke="url(#strainGaugeGrad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={Math.PI * 80}
                initial={{ strokeDashoffset: Math.PI * 80 }}
                animate={{ strokeDashoffset: Math.PI * 80 * (1 - percentage / 100) }}
                transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
              />
              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map(pct => {
                const angle = Math.PI - (pct / 100) * Math.PI;
                const outerR = 92;
                const innerR = 85;
                const x1 = 100 + outerR * Math.cos(angle);
                const y1 = 110 - outerR * Math.sin(angle);
                const x2 = 100 + innerR * Math.cos(angle);
                const y2 = 110 - innerR * Math.sin(angle);
                return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />;
              })}
              {/* Needle — from center (100,110) to arc edge, rotates like a real gauge */}
              {(() => {
                const needleAngleRad = Math.PI - (percentage / 100) * Math.PI;
                const needleLen = 65;
                const tipX = 100 + needleLen * Math.cos(needleAngleRad);
                const tipY = 110 - needleLen * Math.sin(needleAngleRad);
                return (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <motion.line
                      x1="100" y1="110"
                      initial={{ x2: 100 - needleLen, y2: 110 }}
                      animate={{ x2: tipX, y2: tipY }}
                      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"
                    />
                  </motion.g>
                );
              })()}
              {/* Center pivot — big dot anchored above the number */}
              <circle cx="100" cy="110" r="7" fill="#1a1b22" stroke="white" strokeWidth="2.5" opacity="0.95" />
              <circle cx="100" cy="110" r="3" fill="white" opacity="0.9" />
              {/* Scale labels */}
              <text x="12" y="124" textAnchor="start" fill="#555" fontSize="9" fontFamily="monospace">0</text>
              <text x="188" y="124" textAnchor="end" fill="#555" fontSize="9" fontFamily="monospace">21</text>
            </svg>

            {/* Number + label BELOW the gauge */}
            <div className="flex flex-col items-center mt-1">
              <AnimatedNumber value={strain} duration={1500} decimals={1} className="text-5xl font-black font-mono tabular-nums" style={{ color }} />
              <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Strain</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 font-mono">/ 21.0</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                  {getStrainLabel(strain)}
                </span>
              </div>
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
            <span className="text-sm text-gray-400">{Math.abs(comparison.diff)} vs last week</span>
          </motion.div>
        )}

        {/* Stats row — pinned to bottom */}
        <div className="grid grid-cols-3 gap-2 w-full flex-shrink-0">
          {[
            { label: 'Calories', value: calories?.toLocaleString(), color: '#FFD600' },
            { label: 'Avg HR', value: average_heart_rate, color: '#FF5252' },
            { label: 'Max HR', value: max_heart_rate, color: '#FF8A80' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="text-center px-1 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="text-[9px] text-gray-500 mb-0.5 tracking-wide font-medium">{stat.label}</div>
              <div className="text-sm font-bold font-mono tabular-nums" style={{ color: stat.color }}>
                {stat.value || '--'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
