import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import WidgetCard from './WidgetCard';

export default function SleepDebtTracker({ sleepDebt, sleepDebtAlltime }) {
  if (!sleepDebt && !sleepDebtAlltime) return null;

  const alltime = sleepDebtAlltime || {};
  const debtEntries = Array.isArray(sleepDebt) ? sleepDebt : [];

  // Build chart data from alltime logged_dates if available
  const chartData = [];
  if (alltime.logged_dates) {
    alltime.logged_dates.forEach((date) => {
      // We only have aggregate data, simulate based on avg
      const avg = alltime.avg_daily_debt_hrs || 0;
      chartData.push({
        date: date.slice(5), // MM-DD
        debt: avg,
      });
    });
    // Add best day and worst day markers
    if (alltime.best_day) {
      const bestIdx = chartData.findIndex(d => d.date === alltime.best_day.date?.slice(5));
      if (bestIdx >= 0) chartData[bestIdx].debt = alltime.best_day.surplus_hrs;
    }
    if (alltime.worst_day) {
      const worstIdx = chartData.findIndex(d => d.date === alltime.worst_day.date?.slice(5));
      if (worstIdx >= 0) chartData[worstIdx].debt = alltime.worst_day.deficit_hrs;
    }
  }

  // Reverse to chronological
  chartData.reverse();

  const cumulativeDebt = alltime.cumulative_debt_hrs ?? (debtEntries.length > 0 ? debtEntries[debtEntries.length - 1]?.total_debt_hrs : 0);
  const severity = debtEntries.length > 0 ? debtEntries[debtEntries.length - 1]?.severity : alltime.severity || 'UNKNOWN';

  const getSeverityColor = (sev) => {
    if (sev === 'SURPLUS') return '#00E676';
    if (sev === 'MILD') return '#FFD600';
    if (sev === 'MODERATE') return '#FF9100';
    return '#FF1744';
  };

  return (
    <WidgetCard title="Sleep Debt">
      {/* Cumulative debt */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold" style={{ color: getSeverityColor(severity) }}>
          {cumulativeDebt != null ? `${cumulativeDebt > 0 ? '+' : ''}${cumulativeDebt.toFixed(1)}h` : 'N/A'}
        </span>
        <span className="text-sm text-whoop-textDim">cumulative</span>
        {severity && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: getSeverityColor(severity) + '22',
              color: getSeverityColor(severity),
            }}
          >
            {severity}
          </span>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="h-36 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
              />
              <ReferenceLine y={0} stroke="#8888AA" strokeDasharray="3 3" />
              <Bar dataKey="debt" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.debt >= 0 ? '#00E676' : '#FF1744'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {alltime.best_day && (
          <div>
            <div className="text-xs text-whoop-textDim">Best Day</div>
            <div className="text-sm font-semibold text-whoop-green">
              +{alltime.best_day.surplus_hrs}h
            </div>
            <div className="text-xs text-whoop-textDim">{alltime.best_day.date}</div>
          </div>
        )}
        {alltime.worst_day && (
          <div>
            <div className="text-xs text-whoop-textDim">Worst Day</div>
            <div className="text-sm font-semibold text-whoop-red">
              {alltime.worst_day.deficit_hrs}h
            </div>
            <div className="text-xs text-whoop-textDim">{alltime.worst_day.date}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-whoop-textDim">Deficit Streak</div>
          <div className="text-sm font-semibold text-whoop-text">
            {alltime.streak_deficit ?? 0} days
          </div>
        </div>
        <div>
          <div className="text-xs text-whoop-textDim">Days Tracked</div>
          <div className="text-sm font-semibold text-whoop-text">
            {alltime.days_tracked ?? 0}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
