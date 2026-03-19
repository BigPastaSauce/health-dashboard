import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LevelDashboard from './LevelDashboard';

export default function AchievementBar({ badges, level, challenge, streaks, gamification }) {
  const [showDashboard, setShowDashboard] = useState(false);

  if (!level) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-[#12131a]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5 mb-5 overflow-visible"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-5 flex-wrap overflow-visible">
          {/* Level — CLICKABLE */}
          <motion.div
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer group"
            onClick={() => setShowDashboard(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#B388FF]/20 to-[#448AFF]/20 border border-[#B388FF]/20 flex items-center justify-center group-hover:border-[#B388FF]/40 transition-colors group-hover:shadow-[0_0_20px_rgba(179,136,255,0.2)]">
                <span className="text-2xl font-black text-[#B388FF] font-mono tabular-nums">{level.num}</span>
              </div>
              <motion.div 
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00E676]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-[#B388FF] transition-colors">Level {level.num}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{level.name}</div>
              {/* XP Bar */}
              <div className="w-28 h-2 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#B388FF] to-[#448AFF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${level.progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="text-[9px] text-gray-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Click to view details</div>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="w-px h-12 bg-white/[0.08]" />

          {/* Streaks */}
          {streaks && (
            <div className="flex gap-3 flex-shrink-0">
              {streaks.recovery > 0 && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E676]/[0.08] border border-[#00E676]/15"
                >
                  <motion.span 
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 3 }}
                    className="text-base"
                  >🔥</motion.span>
                  <span className="text-sm font-bold text-[#00E676] font-mono tabular-nums">{streaks.recovery}d</span>
                  <span className="text-xs text-gray-400">recovery</span>
                </motion.div>
              )}
              {streaks.sleep > 0 && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.6 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#448AFF]/[0.08] border border-[#448AFF]/15"
                >
                  <span className="text-base">😴</span>
                  <span className="text-sm font-bold text-[#448AFF] font-mono tabular-nums">{streaks.sleep}d</span>
                  <span className="text-xs text-gray-400">sleep</span>
                </motion.div>
              )}
              {streaks.data > 0 && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.7 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B388FF]/[0.08] border border-[#B388FF]/15"
                >
                  <span className="text-base">📊</span>
                  <span className="text-sm font-bold text-[#B388FF] font-mono tabular-nums">{streaks.data}d</span>
                  <span className="text-xs text-gray-400">tracked</span>
                </motion.div>
              )}
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.8 }}
                className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-help ${streaks.recovery > 0 ? 'bg-[#FF6D00]/[0.08] border border-[#FF6D00]/15' : 'bg-white/[0.03] border border-white/[0.06]'}`}
              >
                <span className="text-base">{streaks.recovery > 0 ? '🔥' : '❄️'}</span>
                <span className={`text-sm font-bold font-mono tabular-nums ${streaks.recovery > 0 ? 'text-[#FF6D00]' : 'text-gray-500'}`}>{streaks.recovery}d</span>
                <span className="text-xs text-gray-400">streak</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-[#1a1b22] border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <p className="text-xs font-semibold text-white mb-1">{streaks.recovery > 0 ? `${streaks.recovery} day recovery streak!` : 'No active streak'}</p>
                  <p className="text-[10px] text-gray-400">Consecutive days with recovery above 66% (green zone)</p>
                  {streaks.recovery === 0 && <p className="text-[10px] text-gray-500 mt-0.5">Get green recovery to start a streak</p>}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1b22] border-r border-b border-white/10 rotate-45 -mt-1"></div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && <div className="w-px h-12 bg-white/[0.08]" />}
          <div className="flex gap-2.5 flex-wrap flex-1">
            <AnimatePresence>
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.8 + i * 0.1, damping: 12 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                  style={{ 
                    backgroundColor: `${badge.color}10`, 
                    borderColor: `${badge.color}20` 
                  }}
                  title={badge.desc}
                >
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: badge.color }}>{badge.name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Daily Challenge — more prominent */}
          {challenge && (
            <>
              <div className="w-px h-12 bg-white/[0.08]" />
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border flex-shrink-0"
                style={{ 
                  borderColor: `${challenge.color}25`,
                  backgroundColor: `${challenge.color}08`,
                  boxShadow: `0 0 20px ${challenge.color}10`
                }}
              >
                <motion.span 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-2xl"
                >{challenge.icon}</motion.span>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Today's Goal</div>
                  <div className="text-sm font-bold" style={{ color: challenge.color }}>{challenge.text}</div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Level Dashboard Modal */}
      <LevelDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        gamification={gamification}
      />
    </>
  );
}
