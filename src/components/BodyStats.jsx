import WidgetCard from './WidgetCard';

export default function BodyStats({ data }) {
  if (!data?.body) return null;

  const { weight_lbs, weight_kg, height_m, max_heart_rate } = data.body;

  // BMR calculation (Mifflin-St Jeor for male)
  // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 5 (male) // adding 5 for male
  const age = 23;
  const heightCm = height_m * 100;
  const bmr = Math.round(10 * weight_kg + 6.25 * heightCm - 5 * age + 5);

  // BMI calculation
  const bmi = (weight_kg / (height_m * height_m)).toFixed(1);

  const stats = [
    { label: 'Weight', value: `${weight_lbs}`, unit: 'lbs' },
    { label: 'Weight', value: `${weight_kg}`, unit: 'kg' },
    { label: 'Height', value: "5'8\"", unit: '' },
    { label: 'Height', value: `${(height_m * 100).toFixed(0)}`, unit: 'cm' },
    { label: 'Max HR', value: `${max_heart_rate}`, unit: 'bpm' },
    { label: 'BMR', value: `${bmr}`, unit: 'kcal' },
    { label: 'BMI', value: bmi, unit: '' },
    { label: 'Age', value: '23', unit: '' },
  ];

  return (
    <WidgetCard title="Body Stats">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-whoop-bg rounded-lg p-3 border border-whoop-border">
            <div className="text-xs text-whoop-textDim mb-1">{stat.label}</div>
            <div className="text-lg font-semibold text-whoop-text">
              {stat.value}
              {stat.unit && <span className="text-xs text-whoop-textDim ml-1">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
