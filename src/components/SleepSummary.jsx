import WidgetCard from './WidgetCard';

export default function SleepSummary({ data }) {
  if (!data?.sleep) return null;

  const s = data.sleep;
  const totalSleep = s.total_sleep_hrs;
  const stages = [
    { label: 'Deep', hours: s.deep_sleep_hrs, color: '#448AFF' },
    { label: 'REM', hours: s.rem_sleep_hrs, color: '#B388FF' },
    { label: 'Light', hours: s.light_sleep_hrs, color: '#18FFFF' },
    { label: 'Awake', hours: s.total_awake_hrs, color: '#FF1744' },
  ];
  const totalBar = s.total_in_bed_hrs;

  const formatHrs = (h) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <WidgetCard title="Sleep">
      {/* Total sleep */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-whoop-text">{formatHrs(totalSleep)}</span>
        <span className="text-sm text-whoop-textDim ml-2">total sleep</span>
      </div>

      {/* Stacked bar */}
      <div className="mb-3">
        <div className="flex h-6 rounded-full overflow-hidden">
          {stages.map((stage) => (
            <div
              key={stage.label}
              style={{
                width: `${(stage.hours / totalBar) * 100}%`,
                backgroundColor: stage.color,
              }}
              title={`${stage.label}: ${formatHrs(stage.hours)}`}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {stages.map((stage) => (
            <div key={stage.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-xs text-whoop-textDim">{stage.label} {formatHrs(stage.hours)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div>
          <div className="text-xs text-whoop-textDim">Performance</div>
          <div className="text-lg font-semibold text-whoop-text">{s.sleep_performance_pct}%</div>
        </div>
        <div>
          <div className="text-xs text-whoop-textDim">Efficiency</div>
          <div className="text-lg font-semibold text-whoop-text">{s.sleep_efficiency_pct}%</div>
        </div>
        <div>
          <div className="text-xs text-whoop-textDim">Consistency</div>
          <div className="text-lg font-semibold text-whoop-text">{s.sleep_consistency_pct}%</div>
        </div>
        <div>
          <div className="text-xs text-whoop-textDim">Resp. Rate</div>
          <div className="text-lg font-semibold text-whoop-text">{s.respiratory_rate}</div>
        </div>
        <div>
          <div className="text-xs text-whoop-textDim">Disturbances</div>
          <div className="text-lg font-semibold text-whoop-text">{s.disturbances}</div>
        </div>
        <div>
          <div className="text-xs text-whoop-textDim">Cycles</div>
          <div className="text-lg font-semibold text-whoop-text">{s.sleep_cycles}</div>
        </div>
      </div>

      {/* Sleep needed breakdown */}
      {s.sleep_needed && (
        <div className="mt-4 pt-3 border-t border-whoop-border">
          <div className="text-xs text-whoop-textDim mb-2">Sleep Needed Breakdown</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-whoop-textDim">Baseline</span>
              <span className="text-whoop-text">{s.sleep_needed.baseline_hrs}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-whoop-textDim">Debt</span>
              <span className="text-whoop-text">+{s.sleep_needed.from_debt_hrs}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-whoop-textDim">Strain</span>
              <span className="text-whoop-text">+{s.sleep_needed.from_strain_hrs}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-whoop-textDim">Naps</span>
              <span className="text-whoop-text">{s.sleep_needed.from_nap_hrs}h</span>
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
