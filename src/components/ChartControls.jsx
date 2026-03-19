import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIMEFRAMES = [
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '1M' },
  { key: '90d', label: '3M' },
  { key: '180d', label: '6M' },
  { key: '365d', label: '1Y' },
  { key: 'all', label: 'All' },
];

export function useTimeframeFilter(records, dateField = 'date') {
  const [timeframe, setTimeframe] = useState('all');

  const filteredRecords = (() => {
    if (timeframe === 'all' || !records || records.length === 0) return records;
    const days = parseInt(timeframe);
    if (isNaN(days)) return records;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return records.filter(r => (r[dateField] || '') >= cutoffStr);
  })();

  return { timeframe, setTimeframe, filteredRecords };
}

export function TimeframeSelector({ timeframe, setTimeframe }) {
  return (
    <div className="flex gap-0.5 bg-white/[0.02] rounded-lg p-0.5">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf.key}
          onClick={() => setTimeframe(tf.key)}
          className={`relative px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
            timeframe === tf.key
              ? 'text-[#00E676]'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          {timeframe === tf.key && (
            <motion.div
              layoutId="timeframe-bg"
              className="absolute inset-0 bg-[#00E676]/10 rounded-md border border-[#00E676]/15"
              transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            />
          )}
          <span className="relative z-10">{tf.label}</span>
        </button>
      ))}
    </div>
  );
}

export function MaximizeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/[0.04]"
      title="Maximize"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    </button>
  );
}

export function MaximizedOverlay({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-12" 
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-[#12131a] border border-white/[0.06] rounded-2xl w-full max-w-[1000px] max-h-[60vh] p-6 flex flex-col"
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-h-0" style={{ height: 'calc(100% - 40px)' }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
