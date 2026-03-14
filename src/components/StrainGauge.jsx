import WidgetCard from './WidgetCard';

function getStrainColor(strain) {
  if (strain < 7) return '#448AFF';
  if (strain < 14) return '#00E676';
  if (strain < 18) return '#FFD600';
  return '#FF1744';
}

export default function StrainGauge({ data }) {
  if (!data?.strain) return null;

  const { strain, calories, average_heart_rate, max_heart_rate } = data.strain;
  const color = getStrainColor(strain);
  const percentage = (strain / 21) * 100;

  // Arc gauge: 180-degree arc
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <WidgetCard title="Strain" className="items-center">
      <div className="flex flex-col items-center justify-center h-full">
        {/* Arc gauge */}
        <div className="relative w-48 h-28 mb-2">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="#2a2a4a"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: `drop-shadow(0 0 6px ${color}44)`,
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-4xl font-bold" style={{ color }}>{strain.toFixed(1)}</span>
            <span className="text-xs text-whoop-textDim">/ 21.0</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 w-full mt-4">
          <div className="text-center">
            <div className="text-xs text-whoop-textDim">Calories</div>
            <div className="text-xl font-semibold text-whoop-text">{calories.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-whoop-textDim">Avg HR</div>
            <div className="text-xl font-semibold text-whoop-text">{average_heart_rate}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-whoop-textDim">Max HR</div>
            <div className="text-xl font-semibold text-whoop-text">{max_heart_rate}</div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
