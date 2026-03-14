import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetCard from './WidgetCard';

function getZoneColor(score) {
  if (score >= 67) return '#00E676';
  if (score >= 34) return '#FFD600';
  return '#FF1744';
}

function CustomDot(props) {
  const { cx, cy, payload } = props;
  const color = getZoneColor(payload.recovery);
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#1a1a2e" strokeWidth={2} />
  );
}

export default function RecoveryTrend({ records }) {
  if (!records || records.length === 0) return null;

  const chartData = records
    .filter(r => r.recovery?.score != null)
    .map(r => ({
      date: r.date?.slice(5) || 'Today',
      recovery: r.recovery.score,
    }));

  return (
    <WidgetCard title="Recovery Trend">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis dataKey="date" tick={{ fill: '#8888AA', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#E0E0E0' }}
              formatter={(value) => [`${value}%`, 'Recovery']}
            />
            <Line
              type="monotone"
              dataKey="recovery"
              stroke="#00E676"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}
