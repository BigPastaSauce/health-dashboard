import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';

export default function SleepTrend({ records }) {
  if (!records || records.length === 0) return null;

  const chartData = records
    .filter(r => r.sleep)
    .map(r => ({
      date: r.date?.slice(5) || 'Today',
      deep: r.sleep.deep_sleep_hrs,
      rem: r.sleep.rem_sleep_hrs,
      light: r.sleep.light_sleep_hrs,
      awake: r.sleep.total_awake_hrs,
    }));

  return (
    <WidgetCard title="Sleep Trend">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
              formatter={(value) => [`${value.toFixed(1)}h`]}
            />
            <Area type="monotone" dataKey="deep" stackId="1" stroke="#448AFF" fill="#448AFF" fillOpacity={0.8} />
            <Area type="monotone" dataKey="rem" stackId="1" stroke="#B388FF" fill="#B388FF" fillOpacity={0.8} />
            <Area type="monotone" dataKey="light" stackId="1" stroke="#18FFFF" fill="#18FFFF" fillOpacity={0.6} />
            <Area type="monotone" dataKey="awake" stackId="1" stroke="#FF1744" fill="#FF1744" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#448AFF]" />
          <span className="text-xs text-whoop-textDim">Deep</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#B388FF]" />
          <span className="text-xs text-whoop-textDim">REM</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#18FFFF]" />
          <span className="text-xs text-whoop-textDim">Light</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#FF1744]" />
          <span className="text-xs text-whoop-textDim">Awake</span>
        </div>
      </div>
    </WidgetCard>
  );
}
