import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import WidgetCard from './WidgetCard';

export default function SleepSummary({ data, records }) {
  if (!data?.sleep) return null;

  const s = data.sleep;
  const totalSleep = s.total_sleep_hrs || 0;

  // Calculate average sleep across all records
  const sleepRecords = (records || []).filter(r => r.sleep?.total_sleep_hrs);
  const avgSleep = sleepRecords.length > 0
    ? sleepRecords.reduce((sum, r) => sum + r.sleep.total_sleep_hrs, 0) / sleepRecords.length
    : 0;
  const stages = [
    { label: 'Deep', hours: s.deep_sleep_hrs || 0, color: '#448AFF' },
    { label: 'REM', hours: s.rem_sleep_hrs || 0, color: '#B388FF' },
    { label: 'Light', hours: s.light_sleep_hrs || 0, color: '#18FFFF' },
    { label: 'Awake', hours: s.total_awake_hrs || 0, color: '#FF1744' },
  ];

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

  const pieData = stages.filter(st => st.hours > 0);

  return (
    <WidgetCard title="Sleep">
      <div className="flex flex-col h-full">
        {/* Top: total sleep */}
        <div className="mb-3 flex items-baseline">
          <span className="text-5xl font-black text-whoop-text">{formatHrs(totalSleep)}</span>
          <span className="text-base text-whoop-textDim ml-3">total sleep</span>
          {avgSleep > 0 && (
            <span className="text-sm text-whoop-textDim ml-auto">avg: <span className="font-bold text-whoop-text">{formatHrs(avgSleep)}</span></span>
          )}
        </div>

        {/* Middle: legend left, pie chart right */}
        <div className="flex items-center justify-center gap-8 flex-1 min-h-0">
          <div className="flex flex-col gap-4">
            {stages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="text-lg text-whoop-textDim">{stage.label}</span>
                <span className="text-lg font-bold text-whoop-text">{formatHrs(stage.hours)}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0 h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="hours"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="95%"
                  strokeWidth={2}
                  stroke="#161b22"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                  formatter={(value, name, props) => {
                    const color = props.payload.color;
                    const pct = Math.round((value / (totalSleep || 1)) * 100);
                    return [<span style={{ color }}>{formatHrs(value)} ({pct}%)</span>, <span style={{ color: '#9ca3af' }}>{name}</span>];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom: metrics grid */}
        <div className="grid grid-cols-4 gap-x-6 gap-y-4 mt-4 flex-shrink-0">
          <div>
            <div className="text-sm text-whoop-textDim">Asleep</div>
            <div className="text-2xl font-bold text-whoop-text">{asleepTime}</div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">Awoke</div>
            <div className="text-2xl font-bold text-whoop-text">{awokeTime}</div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">Performance</div>
            <div className="text-2xl font-bold text-whoop-text">{performance != null ? `${Math.round(performance)}%` : '--'}</div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">Efficiency</div>
            <div className="text-2xl font-bold text-whoop-text">{efficiency != null ? `${Math.round(efficiency * 10) / 10}%` : '--'}</div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">Consistency</div>
            <div className="text-2xl font-bold text-whoop-text">{consistency != null ? `${Math.round(consistency)}%` : '--'}</div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">Resp. Rate</div>
            <div className="text-2xl font-bold text-whoop-text">{respRate}<span className="text-sm text-whoop-textDim ml-1">br/m</span></div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">Cycles</div>
            <div className="text-2xl font-bold text-whoop-text">{s.sleep_cycles ?? '--'}</div>
          </div>
          <div>
            <div className="text-sm text-whoop-textDim">In Bed</div>
            <div className="text-2xl font-bold text-whoop-text">{formatHrs(s.total_in_bed_hrs)}</div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
