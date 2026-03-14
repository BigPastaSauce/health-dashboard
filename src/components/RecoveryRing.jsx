import WidgetCard from './WidgetCard';

function getZoneColor(zone) {
  if (zone === 'GREEN') return '#00E676';
  if (zone === 'YELLOW') return '#FFD600';
  return '#FF1744';
}

function getZoneGlow(zone) {
  if (zone === 'GREEN') return 'rgba(0, 230, 118, 0.3)';
  if (zone === 'YELLOW') return 'rgba(255, 214, 0, 0.3)';
  return 'rgba(255, 23, 68, 0.3)';
}

export default function RecoveryRing({ data }) {
  if (!data?.recovery) return null;

  const { score, zone, resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius } = data.recovery;
  const color = getZoneColor(zone);
  const glow = getZoneGlow(zone);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const stats = [
    { label: 'RHR', value: `${resting_heart_rate}`, unit: 'bpm' },
    { label: 'HRV', value: `${Math.round(hrv_rmssd_milli)}`, unit: 'ms' },
    { label: 'SpO2', value: `${spo2_percentage}`, unit: '%' },
    { label: 'Skin Temp', value: `${skin_temp_celsius}`, unit: '°C' },
  ];

  return (
    <WidgetCard className="items-center justify-center">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative w-52 h-52 mb-4">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="#2a2a4a"
              strokeWidth="10"
            />
            {/* Progress ring */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: `drop-shadow(0 0 8px ${glow})`,
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold" style={{ color }}>{score}</span>
            <span className="text-sm text-whoop-textDim mt-1">Recovery</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 w-full mt-2">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xs text-whoop-textDim mb-1">{stat.label}</div>
              <div className="text-lg font-semibold text-whoop-text">
                {stat.value}
                <span className="text-xs text-whoop-textDim ml-0.5">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
