import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecoveryRing from './components/RecoveryRing';
import SleepSummary from './components/SleepSummary';
import StrainGauge from './components/StrainGauge';
import SleepDebtTracker from './components/SleepDebtTracker';
import HRVTrend from './components/HRVTrend';
import WeightTracker from './components/WeightTracker';
import WorkoutLog from './components/WorkoutLog';
import RecoveryTrend from './components/RecoveryTrend';
import SleepTrend from './components/SleepTrend';
import BodyStats from './components/BodyStats';
import StrainTrend from './components/StrainTrend';
import VitalsCard from './components/VitalsCard';
import HealthScore from './components/HealthScore';
import HealthCalendar from './components/HealthCalendar';
import CaloriesTrend from './components/CaloriesTrend';
import AchievementBar from './components/AchievementBar';
import { useGamification } from './hooks/useGamification';

const LAYOUT_KEY = 'health-dashboard-order';
const SIZES_KEY = 'health-dashboard-sizes';

const DEFAULT_ORDER = [
  'healthScore',
  'recovery', 'strain', 'bodyStats', 'vitals',
  'sleep', 'sleepDebt',
  'hrvTrend', 'recoveryTrend', 'weightTracker', 'strainTrend',
  'sleepTrend', 'workouts',
  'caloriesTrend', 'calendar'
];

const DEFAULT_SIZES = {
  healthScore: 2, recovery: 1, strain: 1, bodyStats: 1, vitals: 1,
  sleep: 2, sleepDebt: 2, hrvTrend: 1, recoveryTrend: 1, weightTracker: 1,
  strainTrend: 1, sleepTrend: 2, workouts: 2, caloriesTrend: 2, calendar: 2,
};

const SIZE_CLASSES = {
  1: 'col-span-1',
  2: 'col-span-1 lg:col-span-2',
  3: 'col-span-1 lg:col-span-3',
  4: 'col-span-1 lg:col-span-4',
  8: 'col-span-1 lg:col-span-4',
};

const SIZE_LABELS = { 1: '1×1', 2: '2×1', 3: '3×1', 4: '4×1', 8: '4×2' };
const SIZE_STEPS = [1, 2, 3, 4, 8];

function loadOrder() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) {
      const order = JSON.parse(saved);
      const missing = DEFAULT_ORDER.filter(w => !order.includes(w));
      if (missing.length > 0) return [...missing, ...order];
      return order;
    }
  } catch {}
  return DEFAULT_ORDER;
}

function loadSizes() {
  try {
    const saved = localStorage.getItem(SIZES_KEY);
    if (saved) return { ...DEFAULT_SIZES, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_SIZES };
}

function ResizeHandles({ widgetKey, currentSize, gridRef, onResize }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const frozenRef = useRef(null);

  const freezeOtherWidgets = useCallback(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const gridRect = gridEl.getBoundingClientRect();
    const widgets = gridEl.querySelectorAll('[data-widget-key]');
    const frozen = [];
    widgets.forEach(w => {
      if (w.dataset.widgetKey === widgetKey) return;
      const rect = w.getBoundingClientRect();
      frozen.push({ el: w, top: rect.top - gridRect.top, left: rect.left - gridRect.left, width: rect.width, height: rect.height });
    });
    frozen.forEach(f => {
      f.el.style.position = 'absolute';
      f.el.style.top = f.top + 'px';
      f.el.style.left = f.left + 'px';
      f.el.style.width = f.width + 'px';
      f.el.style.height = f.height + 'px';
      f.el.style.transition = 'none';
      f.el.style.zIndex = '1';
    });
    gridEl.style.position = 'relative';
    frozenRef.current = frozen;
  }, [gridRef, widgetKey]);

  const unfreezeWidgets = useCallback(() => {
    if (!frozenRef.current) return;
    frozenRef.current.forEach(f => {
      f.el.style.position = '';
      f.el.style.top = '';
      f.el.style.left = '';
      f.el.style.width = '';
      f.el.style.height = '';
      f.el.style.transition = '';
      f.el.style.zIndex = '';
    });
    const gridEl = gridRef.current;
    if (gridEl) gridEl.style.position = '';
    frozenRef.current = null;
  }, [gridRef]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const startX = e.clientX;
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const gridRect = gridEl.getBoundingClientRect();
    const colWidth = gridRect.width / 4;
    const widgetEl = e.target.closest('[data-widget-key]');
    if (!widgetEl) return;
    const startRect = widgetEl.getBoundingClientRect();
    const startWidth = startRect.width;

    freezeOtherWidgets();
    let latestSize = currentSize;

    const onMouseMove = (ev) => {
      const deltaX = ev.clientX - startX;
      const actualCols = Math.max(1, Math.min(4, Math.round((startWidth + deltaX) / colWidth)));
      const newSize = actualCols;
      if (newSize !== latestSize) {
        latestSize = newSize;
        setPreview(newSize);
        onResize(widgetKey, newSize);
      }
    };

    const onMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      requestAnimationFrame(() => { requestAnimationFrame(() => { unfreezeWidgets(); }); });
      setPreview(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [widgetKey, gridRef, onResize, currentSize, freezeOtherWidgets, unfreezeWidgets]);

  const edgeClass = `absolute z-10 opacity-0 hover:opacity-100 transition-opacity ${dragging ? 'opacity-100' : ''}`;
  const edgeHighlight = 'bg-[#00E676]/15';

  return (
    <>
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} left-0 top-2 bottom-2 w-2 cursor-ew-resize rounded-l-md`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} right-0 top-2 bottom-2 w-2 cursor-ew-resize rounded-r-md`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} top-0 left-2 right-2 h-2 cursor-ns-resize rounded-t-md`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} bottom-0 left-2 right-2 h-2 cursor-ns-resize rounded-b-md`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} top-0 left-0 w-4 h-4 cursor-nwse-resize rounded-tl-xl`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} top-0 right-0 w-4 h-4 cursor-nesw-resize rounded-tr-xl`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} bottom-0 left-0 w-4 h-4 cursor-nesw-resize rounded-bl-xl`} />
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} bottom-0 right-0 w-4 h-4 cursor-nwse-resize rounded-br-xl`} />
      {dragging && preview && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00E676] text-black text-sm font-bold px-3 py-1 rounded-lg shadow-lg z-20">
          {SIZE_LABELS[preview]}
        </div>
      )}
    </>
  );
}

function App() {
  const [healthData, setHealthData] = useState([]);
  const [sleepDebt, setSleepDebt] = useState(null);
  const [sleepDebtAlltime, setSleepDebtAlltime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [widgetOrder, setWidgetOrder] = useState(loadOrder);
  const [widgetSizes, setWidgetSizes] = useState(loadSizes);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/health').then(r => r.json()).catch(() => []),
      fetch('/api/sleep-debt').then(r => r.json()).catch(() => null),
      fetch('/api/sleep-debt/alltime').then(r => r.json()).catch(() => null),
    ]).then(([health, debt, debtAlltime]) => {
      setHealthData(Array.isArray(health) ? health : [health]);
      setSleepDebt(debt);
      setSleepDebtAlltime(debtAlltime);
      setLoading(false);
    });
  }, []);

  const gamification = useGamification(healthData, sleepDebtAlltime);

  const toggleEditMode = () => {
    if (editMode) {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(widgetOrder));
      localStorage.setItem(SIZES_KEY, JSON.stringify(widgetSizes));
    }
    setEditMode(!editMode);
  };

  const resetLayout = () => {
    setWidgetOrder([...DEFAULT_ORDER]);
    setWidgetSizes({ ...DEFAULT_SIZES });
    localStorage.removeItem(LAYOUT_KEY);
    localStorage.removeItem(SIZES_KEY);
  };

  const handleResize = useCallback((key, newSize) => {
    setWidgetSizes(prev => {
      const updated = { ...prev, [key]: newSize };
      localStorage.setItem(SIZES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [dropTarget, setDropTarget] = useState({ key: null, side: null });
  const scrollRaf = useRef(null);

  const handleDragStart = (e, key) => {
    dragItem.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    const el = e.currentTarget;
    setTimeout(() => el.style.opacity = '0.4', 0);
    const EDGE = 80, SPEED = 12;
    const tick = () => {
      const y = lastDragY.current;
      if (y < EDGE) window.scrollBy(0, -SPEED);
      else if (y > window.innerHeight - EDGE) window.scrollBy(0, SPEED);
      scrollRaf.current = requestAnimationFrame(tick);
    };
    scrollRaf.current = requestAnimationFrame(tick);
  };

  const lastDragY = useRef(0);

  const handleDragOver = (e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    lastDragY.current = e.clientY;
    if (!dragItem.current || dragItem.current === key) {
      setDropTarget({ key: null, side: null });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const side = e.clientX < midX ? 'left' : 'right';
    setDropTarget({ key, side });
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget({ key: null, side: null });
  };

  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    const draggedKey = dragItem.current;
    if (!draggedKey || draggedKey === targetKey) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const side = e.clientX < midX ? 'left' : 'right';
    const newOrder = [...widgetOrder];
    const fromIdx = newOrder.indexOf(draggedKey);
    if (fromIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    const toIdx = newOrder.indexOf(targetKey);
    if (toIdx === -1) return;
    newOrder.splice(side === 'left' ? toIdx : toIdx + 1, 0, draggedKey);
    setWidgetOrder(newOrder);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(newOrder));
    dragItem.current = null;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    dragItem.current = null;
    dragOverItem.current = null;
    setDropTarget({ key: null, side: null });
    if (scrollRaf.current) { cancelAnimationFrame(scrollRaf.current); scrollRaf.current = null; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-16 h-16 border-3 border-[#00E676]/30 border-t-[#00E676] rounded-full mx-auto mb-4"
          />
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-gray-500 text-sm"
          >Loading health data...</motion.p>
        </div>
      </div>
    );
  }

  const latestData = healthData.length > 0 ? healthData[healthData.length - 1] : null;
  const dateStr = latestData?.date || 'No Data';

  const renderWidget = (key) => {
    switch (key) {
      case 'recovery': return <RecoveryRing data={latestData} comparison={gamification.comparisons?.recovery} />;
      case 'strain': return <StrainGauge data={latestData} comparison={gamification.comparisons?.strain} />;
      case 'bodyStats': return <BodyStats data={latestData} />;
      case 'sleep': return <SleepSummary data={latestData} records={healthData} comparison={gamification.comparisons?.sleep} />;
      case 'sleepDebt': return <SleepDebtTracker sleepDebt={sleepDebt} sleepDebtAlltime={sleepDebtAlltime} records={healthData} />;
      case 'hrvTrend': return <HRVTrend records={healthData} />;
      case 'recoveryTrend': return <RecoveryTrend records={healthData} />;
      case 'weightTracker': return <WeightTracker records={healthData} />;
      case 'sleepTrend': return <SleepTrend records={healthData} />;
      case 'workouts': return <WorkoutLog records={healthData} />;
      case 'strainTrend': return <StrainTrend records={healthData} />;
      case 'vitals': return <VitalsCard records={healthData} />;
      case 'healthScore': return <HealthScore records={healthData} sleepDebtAlltime={sleepDebtAlltime} />;
      case 'caloriesTrend': return <CaloriesTrend records={healthData} />;
      case 'calendar': return <HealthCalendar records={healthData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 230, 118, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(68, 138, 255, 0.02) 0%, transparent 40%)',
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-[1920px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Pulse indicator */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 rounded-full bg-[#00E676]"
              />
              <h1 className="text-lg font-bold text-white tracking-tight">Health Dashboard</h1>
            </div>
            <span className="text-xs text-gray-600 font-mono">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                setRefreshing(true);
                try {
                  const resp = await fetch('/api/refresh', { method: 'POST' });
                  const data = await resp.json();
                  if (data.success) {
                    setRefreshMsg(`Updated! ${data.total} days (${data.added} new, ${data.updated} updated)`);
                    const healthResp = await fetch('/api/health');
                    if (healthResp.ok) {
                      const newData = await healthResp.json();
                      setHealthData(newData);
                    }
                  } else {
                    setRefreshMsg(`Error: ${data.error}`);
                  }
                } catch (e) {
                  setRefreshMsg(`Failed: ${e.message}`);
                }
                setRefreshing(false);
                setTimeout(() => setRefreshMsg(''), 5000);
              }}
              disabled={refreshing}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                refreshing
                  ? 'bg-white/[0.02] border border-white/[0.04] text-gray-600 cursor-wait'
                  : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:border-[#448AFF]/30 hover:text-[#448AFF]'
              }`}
            >
              {refreshing ? (
                <span className="flex items-center gap-1.5">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⟳</motion.span>
                  Refreshing...
                </span>
              ) : '⟳ Refresh'}
            </motion.button>
            <AnimatePresence>
              {refreshMsg && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className={`text-[10px] ${refreshMsg.startsWith('Error') || refreshMsg.startsWith('Failed') ? 'text-[#FF5252]' : 'text-[#00E676]'}`}
                >
                  {refreshMsg}
                </motion.span>
              )}
            </AnimatePresence>
            {editMode && (
              <button onClick={resetLayout} className="px-3 py-1.5 text-[10px] font-medium rounded-xl border border-white/[0.06] text-gray-500 hover:text-white hover:border-white/[0.1] transition-colors">
                Reset
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleEditMode}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                editMode
                  ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/20'
                  : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:border-[#00E676]/20'
              }`}
            >
              {editMode ? '✓ Save' : '✎ Edit'}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-5 relative z-10">
        {/* Achievement Bar */}
        {!editMode && (
          <AchievementBar 
            badges={gamification.badges} 
            level={gamification.level} 
            challenge={gamification.challenge}
            streaks={gamification.streaks}
            gamification={gamification}
          />
        )}

        {/* Widget Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridAutoRows: '160px', gridAutoFlow: 'dense', transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
          {widgetOrder.filter(key => DEFAULT_ORDER.includes(key)).map((key, idx) => {
            const size = widgetSizes[key] || 1;
            return (
              <div
                key={key}
                data-widget-key={key}
                className={`${SIZE_CLASSES[size]} relative ${
                  editMode ? 'cursor-grab active:cursor-grabbing' : ''
                } ${editMode ? 'ring-1 ring-dashed ring-white/10 hover:ring-[#00E676]/30 rounded-2xl' : ''}`}
                style={{ minHeight: 0, gridRow: `span ${size === 8 ? 6 : 3}`, transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, key)}
                onDragOver={(e) => handleDragOver(e, key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, key)}
                onDragEnd={handleDragEnd}
              >
                {editMode && dropTarget.key === key && dropTarget.side === 'left' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00E676] rounded-full z-20 shadow-[0_0_12px_#00E676]" />
                )}
                {editMode && dropTarget.key === key && dropTarget.side === 'right' && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#00E676] rounded-full z-20 shadow-[0_0_12px_#00E676]" />
                )}
                {renderWidget(key)}
                {editMode && (
                  <>
                    <div className="absolute top-2 left-2 z-10 bg-[#0a0a0f]/90 border border-white/[0.06] rounded-lg px-2 py-0.5 text-[9px] font-mono text-gray-500">
                      {SIZE_LABELS[size]}
                    </div>
                    <div className="absolute top-2 right-2 z-10">
                      <select
                        value={size}
                        onChange={(e) => handleResize(key, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0a0a0f] text-[10px] text-gray-400 border border-white/[0.06] rounded-lg px-2 py-1 outline-none focus:border-[#00E676]/30 cursor-pointer"
                      >
                        {SIZE_STEPS.map(s => (<option key={s} value={s}>{SIZE_LABELS[s]}</option>))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
