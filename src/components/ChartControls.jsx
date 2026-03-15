import { useState } from 'react';

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
    <div className="flex gap-1">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf.key}
          onClick={() => setTimeframe(tf.key)}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
            timeframe === tf.key
              ? 'bg-[#00E676]/20 text-[#00E676]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}

export function MaximizeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1 text-gray-500 hover:text-white transition-colors rounded hover:bg-white/5"
      title="Maximize"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-12" onClick={onClose}>
      <div
        className="bg-[#161b22] border border-gray-700/50 rounded-2xl w-full max-w-[1000px] max-h-[60vh] p-5 flex flex-col shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/10"
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
      </div>
    </div>
  );
}
