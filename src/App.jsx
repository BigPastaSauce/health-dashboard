import { useState, useEffect, useCallback, useRef } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
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

const LAYOUT_KEY = 'health-dashboard-layout';

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'recovery',       x: 0, y: 0,  w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'strain',          x: 4, y: 0,  w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'bodyStats',       x: 8, y: 0,  w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'sleep',           x: 0, y: 5,  w: 6, h: 6, minW: 4, minH: 5 },
    { i: 'sleepDebt',       x: 6, y: 5,  w: 6, h: 6, minW: 4, minH: 5 },
    { i: 'hrvTrend',        x: 0, y: 11, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'recoveryTrend',   x: 4, y: 11, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'weightTracker',   x: 8, y: 11, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'sleepTrend',      x: 0, y: 15, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'workouts',        x: 6, y: 15, w: 6, h: 5, minW: 4, minH: 4 },
  ],
  md: [
    { i: 'recovery',       x: 0, y: 0,  w: 5, h: 5, minW: 3, minH: 4 },
    { i: 'strain',          x: 5, y: 0,  w: 5, h: 5, minW: 3, minH: 4 },
    { i: 'bodyStats',       x: 0, y: 5,  w: 5, h: 5, minW: 3, minH: 4 },
    { i: 'sleep',           x: 5, y: 5,  w: 5, h: 6, minW: 4, minH: 5 },
    { i: 'sleepDebt',       x: 0, y: 11, w: 5, h: 6, minW: 4, minH: 5 },
    { i: 'hrvTrend',        x: 5, y: 11, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'recoveryTrend',   x: 0, y: 17, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'weightTracker',   x: 5, y: 17, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'sleepTrend',      x: 0, y: 21, w: 5, h: 5, minW: 4, minH: 4 },
    { i: 'workouts',        x: 5, y: 21, w: 5, h: 5, minW: 4, minH: 4 },
  ],
  sm: [
    { i: 'recovery',       x: 0, y: 0,  w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'strain',          x: 0, y: 5,  w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'bodyStats',       x: 0, y: 10, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'sleep',           x: 0, y: 15, w: 6, h: 6, minW: 4, minH: 5 },
    { i: 'sleepDebt',       x: 0, y: 21, w: 6, h: 6, minW: 4, minH: 5 },
    { i: 'hrvTrend',        x: 0, y: 27, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'recoveryTrend',   x: 0, y: 31, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'weightTracker',   x: 0, y: 35, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'sleepTrend',      x: 0, y: 39, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'workouts',        x: 0, y: 44, w: 6, h: 5, minW: 4, minH: 4 },
  ],
};

function loadLayouts() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_LAYOUTS;
}

function App() {
  const [healthData, setHealthData] = useState([]);
  const [sleepDebt, setSleepDebt] = useState(null);
  const [sleepDebtAlltime, setSleepDebtAlltime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState(loadLayouts);
  const containerRef = useRef(null);
  const width = useContainerWidth(containerRef);

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

  const onLayoutChange = useCallback((_, allLayouts) => {
    setLayouts(allLayouts);
    if (!editMode) return;
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(allLayouts));
    } catch {}
  }, [editMode]);

  const toggleEditMode = () => {
    if (editMode) {
      // Saving layout on exit
      try {
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(layouts));
      } catch {}
    }
    setEditMode(!editMode);
  };

  const resetLayout = () => {
    setLayouts(DEFAULT_LAYOUTS);
    localStorage.removeItem(LAYOUT_KEY);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-whoop-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-whoop-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-whoop-textDim">Loading health data...</p>
        </div>
      </div>
    );
  }

  const latestData = healthData.length > 0 ? healthData[healthData.length - 1] : null;
  const dateStr = latestData?.date || 'No Data';

  return (
    <div className="min-h-screen bg-whoop-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-whoop-bg/80 backdrop-blur-md border-b border-whoop-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Health Dashboard
            </h1>
            <p className="text-sm text-whoop-textDim">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            {editMode && (
              <button
                onClick={resetLayout}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-whoop-border text-whoop-textDim hover:text-whoop-text hover:border-whoop-text/30 transition-colors"
              >
                Reset Layout
              </button>
            )}
            <button
              onClick={toggleEditMode}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                editMode
                  ? 'bg-whoop-green text-black'
                  : 'bg-whoop-card border border-whoop-border text-whoop-text hover:border-whoop-green/50'
              }`}
            >
              {editMode ? 'Save Layout' : 'Edit Layout'}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main ref={containerRef} className={`max-w-[1400px] mx-auto px-4 py-6 ${editMode ? 'edit-mode' : ''}`}>
        {width > 0 && <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 900, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={60}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={onLayoutChange}
          compactType="vertical"
          margin={[16, 16]}
        >
          <div key="recovery">
            <RecoveryRing data={latestData} />
          </div>
          <div key="strain">
            <StrainGauge data={latestData} />
          </div>
          <div key="bodyStats">
            <BodyStats data={latestData} />
          </div>
          <div key="sleep">
            <SleepSummary data={latestData} />
          </div>
          <div key="sleepDebt">
            <SleepDebtTracker sleepDebt={sleepDebt} sleepDebtAlltime={sleepDebtAlltime} />
          </div>
          <div key="hrvTrend">
            <HRVTrend records={healthData} />
          </div>
          <div key="recoveryTrend">
            <RecoveryTrend records={healthData} />
          </div>
          <div key="weightTracker">
            <WeightTracker records={healthData} />
          </div>
          <div key="sleepTrend">
            <SleepTrend records={healthData} />
          </div>
          <div key="workouts">
            <WorkoutLog records={healthData} />
          </div>
        </ResponsiveGridLayout>}
      </main>
    </div>
  );
}

export default App;
