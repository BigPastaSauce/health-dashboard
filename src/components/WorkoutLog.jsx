import { useState, useMemo } from 'react';
import WidgetCard from './WidgetCard';

const ZONE_COLORS = [
  '#448AFF', '#00E676', '#FFD600', '#FF9100', '#FF1744', '#D500F9',
];
const ZONE_LABELS = ['Rest', 'Light', 'Moderate', 'Elevated', 'High', 'Max'];

function WorkoutCard({ w }) {
  const totalZoneMins = Object.values(w.hr_zones || {}).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-whoop-bg rounded-lg p-3 border border-whoop-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-whoop-text capitalize">{w.sport}</span>
          <span className="text-xs text-whoop-textDim ml-2">{w.date}</span>
        </div>
        <span className="text-xs text-whoop-textDim">{w.duration_min} min</span>
      </div>
      <div className="flex gap-4 text-xs mb-2">
        <div><span className="text-whoop-textDim">Strain </span><span className="text-whoop-text font-semibold">{w.strain}</span></div>
        <div><span className="text-whoop-textDim">Cal </span><span className="text-whoop-text font-semibold">{w.calories}</span></div>
        <div><span className="text-whoop-textDim">Avg HR </span><span className="text-whoop-text font-semibold">{w.avg_hr || w.average_heart_rate}</span></div>
        <div><span className="text-whoop-textDim">Max HR </span><span className="text-whoop-text font-semibold">{w.max_hr || w.max_heart_rate}</span></div>
      </div>
      {w.hr_zones && totalZoneMins > 0 && (
        <div>
          <div className="flex h-3 rounded-full overflow-hidden">
            {Object.entries(w.hr_zones).sort(([a], [b]) => a.localeCompare(b)).map(([zone, mins], zIdx) => (
              mins > 0 ? <div key={zone} style={{ width: `${(mins / totalZoneMins) * 100}%`, backgroundColor: ZONE_COLORS[zIdx] }} title={`${ZONE_LABELS[zIdx]}: ${mins.toFixed(1)} min`} /> : null
            ))}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {Object.entries(w.hr_zones).sort(([a], [b]) => a.localeCompare(b)).map(([zone, mins], zIdx) => (
              mins > 0 ? <div key={zone} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[zIdx] }} /><span className="text-[10px] text-whoop-textDim">{ZONE_LABELS[zIdx]} {mins.toFixed(0)}m</span></div> : null
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutLog({ records }) {
  const [selectedMonth, setSelectedMonth] = useState('recent');

  if (!records || records.length === 0) return null;

  const allWorkouts = records.flatMap(r =>
    (r.workouts || []).map(w => ({ ...w, date: r.date }))
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Split: last 7 days vs older
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentWorkouts = allWorkouts.filter(w => (w.date || '') >= cutoffStr);
  const olderWorkouts = allWorkouts.filter(w => (w.date || '') < cutoffStr);

  // Group older by month
  const monthGroups = useMemo(() => {
    const groups = {};
    olderWorkouts.forEach(w => {
      const month = w.date?.slice(0, 7); // YYYY-MM
      if (!month) return;
      if (!groups[month]) groups[month] = [];
      groups[month].push(w);
    });
    return groups;
  }, [olderWorkouts.length]);

  const months = Object.keys(monthGroups).sort().reverse();

  const displayWorkouts = selectedMonth === 'recent'
    ? recentWorkouts
    : (monthGroups[selectedMonth] || []);

  if (allWorkouts.length === 0) {
    return (
      <WidgetCard title="Workouts">
        <div className="text-whoop-textDim text-sm">No workouts recorded</div>
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
      headerRight={
        months.length > 0 && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#161b22] text-xs text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-[#00E676] cursor-pointer"
          >
            <option value="recent">Last 7 Days ({recentWorkouts.length})</option>
            {months.map(m => (
              <option key={m} value={m}>{monthLabel(m)} ({monthGroups[m].length})</option>
            ))}
          </select>
        )
      }
    >
      <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
        {displayWorkouts.length > 0 ? (
          displayWorkouts.map((w, idx) => <WorkoutCard key={idx} w={w} />)
        ) : (
          <div className="text-whoop-textDim text-sm">No workouts in this period</div>
        )}
      </div>
    </WidgetCard>
  );
}
