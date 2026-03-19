import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WidgetCard from './WidgetCard';

const ZONE_COLORS = ['#448AFF', '#00E676', '#FFD600', '#FF9100', '#FF5252', '#B388FF'];
const ZONE_LABELS = ['Rest', 'Light', 'Moderate', 'Elevated', 'High', 'Max'];

const SPORT_ICONS = {
  running: '🏃', cycling: '🚴', swimming: '🏊', weightlifting: '🏋️', yoga: '🧘',
  hiking: '🥾', walking: '🚶', basketball: '🏀', soccer: '⚽', tennis: '🎾',
  boxing: '🥊', crossfit: '💪', rowing: '🚣', skiing: '⛷️', climbing: '🧗',
  functional_fitness: '🏋️', strength_trainer: '🏋️', hiit: '⚡',
  default: '🏋️',
};

function WorkoutCard({ w, index }) {
  const totalZoneMins = Object.values(w.hr_zones || {}).reduce((a, b) => a + b, 0);
  const sportKey = (w.sport || '').toLowerCase().replace(/\s+/g, '_');
  const icon = SPORT_ICONS[sportKey] || SPORT_ICONS.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.1] transition-all hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-lg">
            {icon}
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-200 capitalize">{w.sport}</span>
            <span className="text-xs text-gray-500 ml-2">{w.date}</span>
          </div>
        </div>
        <span className="text-sm text-gray-400 font-bold font-mono tabular-nums">{w.duration_min} <span className="text-xs text-gray-500 font-sans font-normal">min</span></span>
      </div>
      <div className="flex gap-5 text-xs mb-3">
        <div><span className="text-gray-500">Strain </span><span className="text-gray-200 font-bold font-mono tabular-nums">{w.strain}</span></div>
        <div><span className="text-gray-500">Cal </span><span className="text-[#FFD600] font-bold font-mono tabular-nums">{w.calories}</span></div>
        <div><span className="text-gray-500">Avg HR </span><span className="text-[#FF5252] font-bold font-mono tabular-nums">{w.avg_hr || w.average_heart_rate}</span></div>
        <div><span className="text-gray-500">Max HR </span><span className="text-[#FF8A80] font-bold font-mono tabular-nums">{w.max_hr || w.max_heart_rate}</span></div>
      </div>
      {w.hr_zones && totalZoneMins > 0 && (
        <div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.02]">
            {Object.entries(w.hr_zones).sort(([a], [b]) => a.localeCompare(b)).map(([zone, mins], zIdx) => (
              mins > 0 ? (
                <motion.div 
                  key={zone} 
                  initial={{ width: 0 }}
                  animate={{ width: `${(mins / totalZoneMins) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ backgroundColor: ZONE_COLORS[zIdx] }} 
                  title={`${ZONE_LABELS[zIdx]}: ${mins.toFixed(1)} min`} 
                />
              ) : null
            ))}
          </div>
          <div className="flex gap-2.5 mt-2 flex-wrap">
            {Object.entries(w.hr_zones).sort(([a], [b]) => a.localeCompare(b)).map(([zone, mins], zIdx) => (
              mins > 0 ? (
                <div key={zone} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[zIdx] }} />
                  <span className="text-[10px] text-gray-400 font-medium">{ZONE_LABELS[zIdx]} <span className="font-mono tabular-nums">{mins.toFixed(0)}m</span></span>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function WorkoutLog({ records }) {
  const [selectedMonth, setSelectedMonth] = useState('recent');

  if (!records || records.length === 0) return null;

  const allWorkouts = records.flatMap(r =>
    (r.workouts || []).map(w => ({ ...w, date: r.date }))
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentWorkouts = allWorkouts.filter(w => (w.date || '') >= cutoffStr);
  const olderWorkouts = allWorkouts.filter(w => (w.date || '') < cutoffStr);

  const monthGroups = useMemo(() => {
    const groups = {};
    olderWorkouts.forEach(w => {
      const month = w.date?.slice(0, 7);
      if (!month) return;
      if (!groups[month]) groups[month] = [];
      groups[month].push(w);
    });
    return groups;
  }, [olderWorkouts.length]);

  const months = Object.keys(monthGroups).sort().reverse();
  const displayWorkouts = selectedMonth === 'recent' ? recentWorkouts : (monthGroups[selectedMonth] || []);

  if (allWorkouts.length === 0) {
    return (
      <WidgetCard title="Workouts">
        <div className="text-gray-600 text-sm">No workouts recorded</div>
      </WidgetCard>
    );
  }

  const monthLabel = (m) => {
    const [y, mo] = m.split('-');
    const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${names[parseInt(mo)]} ${y}`;
  };

  return (
    <WidgetCard
      title="Workouts"
      glowColor="#FF5252"
      headerRight={
        months.length > 0 && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white/[0.03] text-xs text-gray-400 border border-white/[0.06] rounded-lg px-2 py-1 outline-none focus:border-[#00E676]/30 cursor-pointer"
          >
            <option value="recent">Last 7 Days ({recentWorkouts.length})</option>
            {months.map(m => (
              <option key={m} value={m}>{monthLabel(m)} ({monthGroups[m].length})</option>
            ))}
          </select>
        )
      }
    >
      <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {displayWorkouts.length > 0 ? (
            displayWorkouts.map((w, idx) => <WorkoutCard key={`${w.date}-${idx}`} w={w} index={idx} />)
          ) : (
            <div className="text-gray-600 text-sm">No workouts in this period</div>
          )}
        </AnimatePresence>
      </div>
    </WidgetCard>
  );
}
