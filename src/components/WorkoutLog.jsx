import WidgetCard from './WidgetCard';

const ZONE_COLORS = [
  '#448AFF', // Zone 0 - Light
  '#00E676', // Zone 1 - Moderate
  '#FFD600', // Zone 2 - Elevated
  '#FF9100', // Zone 3 - High
  '#FF1744', // Zone 4 - Max
  '#D500F9', // Zone 5 - Peak
];

const ZONE_LABELS = ['Rest', 'Light', 'Moderate', 'Elevated', 'High', 'Max'];

export default function WorkoutLog({ records }) {
  if (!records || records.length === 0) return null;

  // Collect all workouts from all records
  const allWorkouts = records.flatMap(r =>
    (r.workouts || []).map(w => ({
      ...w,
      date: r.date,
    }))
  );

  if (allWorkouts.length === 0) {
    return (
      <WidgetCard title="Workouts">
        <div className="text-whoop-textDim text-sm">No workouts recorded</div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Workouts">
      <div className="space-y-4 overflow-y-auto max-h-full">
        {allWorkouts.map((w, idx) => {
          const totalZoneMins = Object.values(w.hr_zones || {}).reduce((a, b) => a + b, 0);

          return (
            <div key={idx} className="bg-whoop-bg rounded-lg p-3 border border-whoop-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-whoop-text capitalize">
                    {w.sport}
                  </span>
                  <span className="text-xs text-whoop-textDim ml-2">{w.date}</span>
                </div>
                <span className="text-xs text-whoop-textDim">{w.duration_min} min</span>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-xs mb-2">
                <div>
                  <span className="text-whoop-textDim">Strain </span>
                  <span className="text-whoop-text font-semibold">{w.strain}</span>
                </div>
                <div>
                  <span className="text-whoop-textDim">Cal </span>
                  <span className="text-whoop-text font-semibold">{w.calories}</span>
                </div>
                <div>
                  <span className="text-whoop-textDim">Avg HR </span>
                  <span className="text-whoop-text font-semibold">{w.average_heart_rate}</span>
                </div>
                <div>
                  <span className="text-whoop-textDim">Max HR </span>
                  <span className="text-whoop-text font-semibold">{w.max_heart_rate}</span>
                </div>
              </div>

              {/* HR Zone bar */}
              {w.hr_zones && totalZoneMins > 0 && (
                <div>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    {Object.entries(w.hr_zones)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([zone, mins], zIdx) => (
                        mins > 0 ? (
                          <div
                            key={zone}
                            style={{
                              width: `${(mins / totalZoneMins) * 100}%`,
                              backgroundColor: ZONE_COLORS[zIdx],
                            }}
                            title={`${ZONE_LABELS[zIdx]}: ${mins.toFixed(1)} min`}
                          />
                        ) : null
                      ))}
                  </div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {Object.entries(w.hr_zones)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([zone, mins], zIdx) => (
                        mins > 0 ? (
                          <div key={zone} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[zIdx] }} />
                            <span className="text-[10px] text-whoop-textDim">{ZONE_LABELS[zIdx]} {mins.toFixed(0)}m</span>
                          </div>
                        ) : null
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
