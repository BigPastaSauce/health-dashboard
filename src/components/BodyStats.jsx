import WidgetCard from './WidgetCard';

export default function BodyStats({ data }) {
  if (!data?.body) return null;

  const { weight_lbs, weight_kg, height_m, max_heart_rate } = data.body;

  const age = 23;
  const heightCm = height_m * 100;
  const bmr = Math.round(10 * weight_kg + 6.25 * heightCm - 5 * age + 5);
  const bmi = (weight_kg / (height_m * height_m)).toFixed(1);

  const stats = [
    { label: 'Weight', value: `${weight_lbs}`, unit: 'lbs' },
    { label: 'Weight', value: `${weight_kg.toFixed(2)}`, unit: 'kg' },
    { label: 'Height', value: "5'8\"", unit: '' },
    { label: 'Height', value: `${(height_m * 100).toFixed(0)}`, unit: 'cm' },
    { label: 'Max HR', value: `${max_heart_rate}`, unit: 'bpm' },
    { label: 'BMR', value: `${bmr}`, unit: 'kcal' },
    { label: 'BMI', value: bmi, unit: '' },
    { label: 'Age', value: '23', unit: '' },
  ];

  return (
    <WidgetCard title="Body Stats">
      <div className="grid grid-cols-2 gap-3 h-full">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-whoop-bg rounded-lg p-4 border border-whoop-border flex flex-col justify-center">
            <div className="text-sm text-whoop-textDim mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-whoop-text">
              {stat.value}
              {stat.unit && <span className="text-sm text-whoop-textDim ml-1">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
