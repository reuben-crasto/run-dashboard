import { useEffect, useMemo, useState } from 'react';
import PaceTrendChart from '../components/PaceTrendChart.jsx';
import PersonalRecords from '../components/PersonalRecords.jsx';
import RunsList from '../components/RunsList.jsx';
import { getActivities, getRecords } from '../lib/api.js';

const RANGES = [
  { key: '30d',  label: '30d',  days: 30 },
  { key: '90d',  label: '90d',  days: 90 },
  { key: '6mo',  label: '6mo',  days: 182 },
  { key: 'all',  label: 'All',  days: Infinity },
];

export default function Dashboard() {
  const [runs, setRuns] = useState(null);
  const [records, setRecords] = useState(null);
  const [err, setErr] = useState(null);
  const [range, setRange] = useState('90d');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getActivities(), getRecords()])
      .then(([a, r]) => {
        if (cancelled) return;
        setRuns(a);
        setRecords(r);
      })
      .catch((e) => !cancelled && setErr(e.message || 'Failed to load'));
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!runs) return [];
    const r = RANGES.find((x) => x.key === range);
    if (!r || r.days === Infinity) return runs;
    const cutoff = Date.now() - r.days * 24 * 60 * 60 * 1000;
    return runs.filter((run) => new Date(run.start_date).getTime() >= cutoff);
  }, [runs, range]);

  if (err) return <div className="empty-state">Error: {err}</div>;
  if (!runs || !records) return <div className="empty-state">Loading runs…</div>;

  return (
    <>
      <section className="panel">
        <h2>Pace Trend</h2>
        <PaceTrendChart runs={filtered} />
        <div className="range-tabs" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-pressed={range === r.key}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid-two">
        <section className="panel">
          <h2>Personal Records</h2>
          <PersonalRecords records={records} />
        </section>
        <section className="panel">
          <h2>Recent Runs</h2>
          <RunsList runs={runs} />
        </section>
      </div>
    </>
  );
}
