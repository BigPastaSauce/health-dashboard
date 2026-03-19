import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

const TIER_LIST = [
  { range: '1–2', name: 'Rookie', color: '#6B7280', minXp: 0 },
  { range: '3–4', name: 'Beginner', color: '#00E676', minXp: 24 },
  { range: '5–7', name: 'Intermediate', color: '#448AFF', minXp: 40 },
  { range: '8–10', name: 'Advanced', color: '#B388FF', minXp: 64 },
  { range: '11–14', name: 'Elite', color: '#FFD600', minXp: 88 },
  { range: '15+', name: 'Immortal', color: '#FF5252', minXp: 120 },
];

function getTierForLevel(lvl) {
  if (lvl >= 15) return TIER_LIST[5];
  if (lvl >= 11) return TIER_LIST[4];
  if (lvl >= 8) return TIER_LIST[3];
  if (lvl >= 5) return TIER_LIST[2];
  if (lvl >= 3) return TIER_LIST[1];
  return TIER_LIST[0];
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 80, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, y: 60, scale: 0.97, transition: { duration: 0.2 } },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Simple bar chart component for XP breakdown
function XpBar({ label, value, total, color, delay = 0 }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-20 text-right">{label}</span>
      <div className="flex-1 h-3 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 + delay, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono text-gray-300 w-10">{value}</span>
    </div>
  );
}

export default function LevelDashboard({ isOpen, onClose, gamification }) {
  const scrollRef = useRef(null);

  const { level, streaks, allBadges, xpBreakdown, longestStreak, daysTracked, challenge } = gamification || {};

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!level) return null;

  const tier = getTierForLevel(level.num);
  const xpToNext = level.xpForNextLevel - level.xpInLevel;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            ref={scrollRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 mx-4 rounded-3xl border border-white/[0.08]"
            style={{
              background: 'linear-gradient(145deg, #12131a 0%, #0d0e15 100%)',
              boxShadow: `0 0 80px ${tier.color}15, 0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all"
            >
              ✕
            </button>

            <div className="p-8 space-y-8">
              {/* ====== HEADER ====== */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center">
                {/* Level badge */}
                <motion.div
                  className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mx-auto mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${tier.color}25, ${tier.color}10)`,
                    border: `2px solid ${tier.color}40`,
                    boxShadow: `0 0 40px ${tier.color}20, 0 0 80px ${tier.color}08`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 20px ${tier.color}15, 0 0 40px ${tier.color}05`,
                      `0 0 40px ${tier.color}30, 0 0 80px ${tier.color}10`,
                      `0 0 20px ${tier.color}15, 0 0 40px ${tier.color}05`,
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <span className="text-5xl font-black font-mono" style={{ color: tier.color }}>
                    {level.num}
                  </span>
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-1">
                  Level {level.num} — <span style={{ color: tier.color }}>{level.name}</span>
                </h2>
                <p className="text-sm text-gray-400 mb-4">{tier.name} Tier</p>

                {/* XP Progress bar */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{level.xpInLevel} XP</span>
                    <span>{level.xpForNextLevel} XP</span>
                  </div>
                  <div className="h-4 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${tier.color}, ${tier.color}CC)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${level.progress}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    <span className="font-bold" style={{ color: tier.color }}>{xpToNext} XP</span> to next level
                  </p>
                </div>
              </motion.div>

              {/* ====== STATS OVERVIEW ====== */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {[
                  { label: 'Total XP', value: xpBreakdown?.total || level.xp, icon: '⚡', color: '#FFD600' },
                  { label: 'Days Tracked', value: daysTracked || 0, icon: '📅', color: '#448AFF' },
                  { label: 'Current Streak', value: `${streaks?.data || 0}d`, icon: '🔥', color: '#FF5252' },
                  { label: 'Longest Streak', value: `${longestStreak || 0}d`, icon: '🏆', color: '#00E676' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeUp}
                    className="rounded-2xl p-4 text-center border border-white/[0.06]"
                    style={{
                      background: `linear-gradient(135deg, ${stat.color}08, transparent)`,
                    }}
                  >
                    <span className="text-2xl block mb-1">{stat.icon}</span>
                    <div className="text-xl font-bold text-white font-mono">{stat.value}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* ====== BADGES SECTION ====== */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  🏅 Badges
                  <span className="text-xs text-gray-500 font-normal">
                    {allBadges?.filter(b => b.earned).length || 0}/{allBadges?.length || 0} earned
                  </span>
                </h3>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {(allBadges || []).map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      variants={fadeUp}
                      whileHover={badge.earned ? { scale: 1.02 } : { x: [0, -2, 2, -2, 0], transition: { duration: 0.3 } }}
                      className="relative rounded-2xl p-4 border overflow-hidden"
                      style={{
                        borderColor: badge.earned ? `${badge.color}30` : 'rgba(255,255,255,0.04)',
                        background: badge.earned
                          ? `linear-gradient(135deg, ${badge.color}10, ${badge.color}05)`
                          : 'rgba(255,255,255,0.01)',
                        boxShadow: badge.earned ? `0 0 20px ${badge.color}10` : 'none',
                      }}
                    >
                      {/* Lock overlay for locked badges */}
                      {!badge.earned && (
                        <div className="absolute top-3 right-3 text-gray-600 text-lg">🔒</div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Badge icon */}
                        <div
                          className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl"
                          style={{
                            background: badge.earned ? `${badge.color}15` : 'rgba(255,255,255,0.03)',
                            filter: badge.earned ? 'none' : 'grayscale(1) opacity(0.4)',
                          }}
                        >
                          {badge.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="text-sm font-bold"
                              style={{ color: badge.earned ? badge.color : '#6B7280' }}
                            >
                              {badge.name}
                            </span>
                            {badge.earned && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#00E676]/15 text-[#00E676] font-bold uppercase">
                                Earned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{badge.desc}</p>

                          {/* Progress bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: badge.earned ? badge.color : '#4B5563',
                                }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min((badge.progress.current / badge.progress.target) * 100, 100)}%`,
                                }}
                                transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 flex-shrink-0">
                              {badge.progress.current}/{badge.progress.target}
                            </span>
                          </div>

                          {badge.earned && badge.earnedDate && (
                            <span className="text-[9px] text-gray-600 mt-1 block">
                              Earned {badge.earnedDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* ====== LEVEL PROGRESSION ====== */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  📈 Level Progression
                </h3>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {TIER_LIST.map((t, i) => {
                    const isCurrent = t.name === tier.name;
                    return (
                      <motion.div
                        key={t.name}
                        variants={fadeUp}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                        style={{
                          borderColor: isCurrent ? `${t.color}40` : 'rgba(255,255,255,0.04)',
                          background: isCurrent
                            ? `linear-gradient(90deg, ${t.color}12, ${t.color}05)`
                            : 'rgba(255,255,255,0.01)',
                          boxShadow: isCurrent ? `0 0 30px ${t.color}15` : 'none',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: `${t.color}20`,
                            color: t.color,
                          }}
                        >
                          {t.range}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-bold" style={{ color: isCurrent ? t.color : '#9CA3AF' }}>
                            {t.name}
                          </span>
                          {isCurrent && (
                            <motion.span
                              className="ml-2 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase"
                              style={{ backgroundColor: `${t.color}20`, color: t.color }}
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              You are here
                            </motion.span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 font-mono">{t.minXp}+ XP</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* ====== XP BREAKDOWN ====== */}
              {xpBreakdown && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    📊 XP Breakdown
                  </h3>
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl p-5 border border-white/[0.06] space-y-3"
                    style={{ background: 'rgba(255,255,255,0.01)' }}
                  >
                    <XpBar label="Recovery" value={xpBreakdown.recovery} total={xpBreakdown.total} color="#00E676" delay={0} />
                    <XpBar label="Sleep" value={xpBreakdown.sleep} total={xpBreakdown.total} color="#448AFF" delay={0.1} />
                    <XpBar label="Consistency" value={xpBreakdown.consistency} total={xpBreakdown.total} color="#B388FF" delay={0.2} />
                    <XpBar label="Badges" value={xpBreakdown.badges} total={xpBreakdown.total} color="#FFD600" delay={0.3} />
                    <XpBar label="Streaks" value={xpBreakdown.streaks} total={xpBreakdown.total} color="#FF5252" delay={0.4} />
                    <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                      <span className="text-sm font-bold text-white font-mono">Total: {xpBreakdown.total} XP</span>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* ====== DAILY CHALLENGE ====== */}
              {challenge && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    🎯 Daily Challenge
                  </h3>
                  <div
                    className="rounded-2xl p-5 border"
                    style={{
                      borderColor: `${challenge.color}25`,
                      background: `linear-gradient(135deg, ${challenge.color}08, transparent)`,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <motion.span
                        className="text-4xl"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        {challenge.icon}
                      </motion.span>
                      <div>
                        <div className="text-sm font-bold text-white">{challenge.text}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                          Today's Goal
                        </div>
                      </div>
                    </div>
                    {/* Challenge progress */}
                    <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: challenge.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(challenge.progress || 0, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-gray-500">Progress: {challenge.progress || 0}%</span>
                      <span className="text-[10px] text-gray-500">
                        {challenge.completedCount || 0} challenges completed all-time
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
