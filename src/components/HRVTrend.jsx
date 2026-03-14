import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';

export default function HRVTrend({ records }) {
  if (!records || records.length === 0) return null;

  const chartData = records
    .filter(r => r.recovery?.hrv_rmssd_milli != null)
    .map(r => ({
      date: r.date?.slice(5) || 'Today',
      hrv: Math.round(r.recovery.hrv_rmssd_milli),
    }));

  // Calculate 7-day average
  const avg = chartData.reduce((sum, d) => sum + d.hrv, 0) / chartData.length;

  return (
    <WidgetCard title="HRV Trend">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-whoop-text">
          {chartData.length > 0 ? chartData[chartData.length - 1].hrv : '--'}
        </span>
        <span className="text-sm text-whoop-textDim">ms</span>
        <span className="text-xs text-whoop-textDim ml-auto">
          7d avg: {Math.round(avg)} ms
        </span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
            />
            <Line
              type="monotone"
              dataKey="hrv"
              stroke="#B388FF"
              strokeWidth={2}
              dot={{ fill: '#B388FF', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}
