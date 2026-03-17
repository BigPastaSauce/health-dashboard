import { useState, useEffect, useCallback, useRef } from 'react';
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

// 1=1col, 2=2col, 3=3col, 4=4col(1row), 8=4col(2rows)
// Using fixed row height of 160px with gap 16px
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
      frozen.push({
        el: w,
        top: rect.top - gridRect.top,
        left: rect.left - gridRect.left,
        width: rect.width,
        height: rect.height,
      });
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
      // Use absolute width change regardless of which edge
      const desiredWidth = startWidth + Math.abs(deltaX) * (deltaX > 0 ? 1 : -1);
      // For left/right edges, just track total desired cols
      const desiredCols = Math.max(1, Math.min(4, Math.round(desiredWidth / colWidth)));
      // For shrinking from left edge, deltaX is negative but we still want fewer cols
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          unfreezeWidgets();
        });
      });
      setPreview(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [widgetKey, gridRef, onResize, currentSize, freezeOtherWidgets, unfreezeWidgets]);

  const edgeClass = `absolute z-10 opacity-0 hover:opacity-100 transition-opacity ${dragging ? 'opacity-100' : ''}`;
  const edgeHighlight = 'bg-[#00E676]/20';

  return (
    <>
      {/* Left edge */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} left-0 top-2 bottom-2 w-2 cursor-ew-resize rounded-l-md`} />
      {/* Right edge */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} right-0 top-2 bottom-2 w-2 cursor-ew-resize rounded-r-md`} />
      {/* Top edge */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} top-0 left-2 right-2 h-2 cursor-ns-resize rounded-t-md`} />
      {/* Bottom edge */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} bottom-0 left-2 right-2 h-2 cursor-ns-resize rounded-b-md`} />
      {/* Top-left corner */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} top-0 left-0 w-4 h-4 cursor-nwse-resize rounded-tl-xl`} />
      {/* Top-right corner */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} top-0 right-0 w-4 h-4 cursor-nesw-resize rounded-tr-xl`} />
      {/* Bottom-left corner */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} bottom-0 left-0 w-4 h-4 cursor-nesw-resize rounded-bl-xl`} />
      {/* Bottom-right corner */}
      <div onMouseDown={startResize} className={`${edgeClass} ${edgeHighlight} bottom-0 right-0 w-4 h-4 cursor-nwse-resize rounded-br-xl`} />
      {/* Size badge */}
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

    const EDGE = 80;
    const SPEED = 12;
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
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget({ key: null, side: null });
    }
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
    const insertIdx = side === 'left' ? toIdx : toIdx + 1;
    newOrder.splice(insertIdx, 0, draggedKey);

    setWidgetOrder(newOrder);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(newOrder));
    dragItem.current = null;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    dragItem.current = null;
    dragOverItem.current = null;
    setDropTarget({ key: null, side: null });
    if (scrollRaf.current) {
      cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading health data...</p>
        </div>
      </div>
    );
  }

  const latestData = healthData.length > 0 ? healthData[healthData.length - 1] : null;
  const dateStr = latestData?.date || 'No Data';

  const renderWidget = (key) => {
    switch (key) {
      case 'recovery': return <RecoveryRing data={latestData} />;
      case 'strain': return <StrainGauge data={latestData} />;
      case 'bodyStats': return <BodyStats data={latestData} />;
      case 'sleep': return <SleepSummary data={latestData} records={healthData} />;
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
    <div className="min-h-screen bg-[#0d1117]">
      <header className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Health Dashboard</h1>
            <p className="text-sm text-gray-500">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            {editMode && (
              <button
                onClick={resetLayout}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                Reset Layout
              </button>
            )}
            <button
              onClick={toggleEditMode}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                editMode
                  ? 'bg-[#00E676] text-black'
                  : 'bg-[#161b22] border border-gray-700 text-gray-300 hover:border-[#00E676]/50'
              }`}
            >
              {editMode ? '✓ Save Layout' : '✎ Edit Layout'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridAutoRows: '160px', gridAutoFlow: 'dense', transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
          {widgetOrder.filter(key => DEFAULT_ORDER.includes(key)).map((key, idx) => {
            const size = widgetSizes[key] || 1;
            return (
              <div
                key={key}
                data-widget-key={key}
                className={`${SIZE_CLASSES[size]} relative ${
                  editMode ? 'cursor-grab active:cursor-grabbing' : ''
                } ${editMode ? 'ring-2 ring-dashed ring-gray-600 hover:ring-[#00E676]/50 rounded-2xl' : ''}`}
                style={{ minHeight: 0, gridRow: `span ${size === 8 ? 6 : 3}`, transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, key)}
                onDragOver={(e) => handleDragOver(e, key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, key)}
                onDragEnd={handleDragEnd}
              >
                {/* Drop indicator - left */}
                {editMode && dropTarget.key === key && dropTarget.side === 'left' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00E676] rounded-full z-20 shadow-[0_0_8px_#00E676]" />
                )}
                {/* Drop indicator - right */}
                {editMode && dropTarget.key === key && dropTarget.side === 'right' && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#00E676] rounded-full z-20 shadow-[0_0_8px_#00E676]" />
                )}
                {renderWidget(key)}
                {editMode && (
                  <>
                    {/* Size indicator badge */}
                    <div className="absolute top-2 left-2 z-10 bg-[#1a1a2e]/90 border border-gray-600 rounded-md px-2 py-0.5 text-[10px] font-mono text-gray-400">
                      {SIZE_LABELS[size]}
                    </div>
                    {/* Size picker dropdown */}
                    <div className="absolute top-2 right-2 z-10">
                      <select
                        value={size}
                        onChange={(e) => handleResize(key, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1a1a2e] text-[11px] text-gray-300 border border-gray-600 rounded-md px-2 py-1 outline-none focus:border-[#00E676] cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        {SIZE_STEPS.map(s => (
                          <option key={s} value={s}>{SIZE_LABELS[s]}</option>
                        ))}
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
