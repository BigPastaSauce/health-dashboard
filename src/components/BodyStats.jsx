import { motion } from 'framer-motion';
import WidgetCard from './WidgetCard';

export default function BodyStats({ data }) {
  if (!data?.body) return null;

  const { weight_lbs, weight_kg, height_m, max_heart_rate } = data.body;
  const age = 23;
  const heightCm = height_m * 100;
  const bmr = Math.round(10 * weight_kg + 6.25 * heightCm - 5 * age + 5);
  const bmi = (weight_kg / (height_m * height_m)).toFixed(1);

  const stats = [
    { label: 'Weight', value: `${weight_lbs}`, unit: 'lbs', color: '#18FFFF' },
    { label: 'Weight', value: `${weight_kg.toFixed(1)}`, unit: 'kg', color: '#18FFFF' },
    { label: 'Height', value: "5'8\"", unit: '', color: '#B388FF' },
    { label: 'Height', value: `${(height_m * 100).toFixed(0)}`, unit: 'cm', color: '#B388FF' },
    { label: 'Max HR', value: `${max_heart_rate}`, unit: 'bpm', color: '#FF5252' },
    { label: 'BMR', value: `${bmr}`, unit: 'kcal', color: '#FFD600' },
    { label: 'BMI', value: bmi, unit: '', color: '#69F0AE' },
    { label: 'Age', value: '23', unit: '', color: '#448AFF' },
  ];

  return (
    <WidgetCard title="Body Stats">
      <div className="grid grid-cols-2 gap-2.5 h-full">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] flex flex-col justify-center hover:border-white/[0.1] transition-all"
          >
            <div className="text-sm text-gray-500 mb-1 tracking-wide font-medium">{stat.label}</div>
            <div className="text-3xl font-bold font-mono tabular-nums" style={{ color: stat.color }}>
              {stat.value}
              {stat.unit && <span className="text-sm text-gray-500 ml-1.5 font-sans">{stat.unit}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </WidgetCard>
  );
}
