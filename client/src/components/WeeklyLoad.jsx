import { useMemo } from 'react';
import { mpsToSecPerKm, formatPace } from '../lib/format.js';

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // days back to Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekStats(runs) {
  if (runs.length === 0) return { km: 0, avgPaceSec: null, count: 0 };
  const km = runs.reduce((s, r) => s + r.distance_m / 1000, 0);
  const paces = runs.map((r) => mpsToSecPerKm(r.average_speed_mps)).filter(Boolean);
  const avgPaceSec = paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : null;
  return { km, avgPaceSec, count: runs.length };
}

export default function WeeklyLoad({ runs }) {
  const { thisWeek, lastWeek, kmPct, paceDiff, bothIncreasing } = useMemo(() => {
    const now = new Date();
    const thisStart = getWeekStart(now);
    const lastStart = new Date(thisStart);
    lastStart.setDate(lastStart.getDate() - 7);

    const thisRuns = runs.filter((r) => new Date(r.start_date) >= thisStart);
    const lastRuns = runs.filter((r) => {
      const d = new Date(r.start_date);
      return d >= lastStart && d < thisStart;
    });

    const thisWeek = weekStats(thisRuns);
    const lastWeek = weekStats(lastRuns);

    // % change in km
    const kmPct = lastWeek.km > 0
      ? ((thisWeek.km - lastWeek.km) / lastWeek.km) * 100
      : null;

    // pace diff in sec/km — negative = getting faster
    const paceDiff = (thisWeek.avgPaceSec != null && lastWeek.avgPaceSec != null)
      ? thisWeek.avgPaceSec - lastWeek.avgPaceSec
      : null;

    // Injury flag: both volume UP and pace FASTER simultaneously
    const kmIncreasing    = kmPct != null && kmPct > 0;
    const paceImproving   = paceDiff != null && paceDiff < 0; // faster = lower sec/km
    const bothIncreasing  = kmIncreasing && paceImproving;

    return { thisWeek, lastWeek, kmPct, paceDiff, bothIncreasing };
  }, [runs]);

  const kmColor   = kmPct   == null ? '' : (bothIncreasing ? 'var(--bad)' : (kmPct > 0 ? 'var(--good)' : 'var(--text-dim)'));
  const paceColor = paceDiff == null ? '' : (bothIncreasing ? 'var(--bad)' : (paceDiff < 0 ? 'var(--good)' : 'var(--text-dim)'));

  const kmArrow   = kmPct   == null ? '' : (kmPct   > 0 ? '↑' : '↓');
  const paceArrow = paceDiff == null ? '' : (paceDiff < 0 ? '↑' : '↓'); // ↑ = faster = good

  return (
    <div className="weekly-load">
      <div className="wl-stats">
        <div className="wl-stat">
          <div className="wl-label">This week</div>
          <div className="wl-value">{thisWeek.km.toFixed(1)} km</div>
          <div className="wl-sub">{thisWeek.count} run{thisWeek.count !== 1 ? 's' : ''}</div>
        </div>

        <div className="wl-stat">
          <div className="wl-label">vs last week</div>
          <div className="wl-value" style={{ color: kmColor }}>
            {kmPct == null ? '—' : `${kmArrow} ${Math.abs(kmPct).toFixed(0)}%`}
          </div>
          <div className="wl-sub">{lastWeek.km.toFixed(1)} km prior</div>
        </div>

        <div className="wl-stat">
          <div className="wl-label">Avg pace this week</div>
          <div className="wl-value">
            {thisWeek.avgPaceSec ? formatPace(thisWeek.avgPaceSec) : '—'}
          </div>
          <div className="wl-sub">
            {lastWeek.avgPaceSec ? formatPace(lastWeek.avgPaceSec) + ' prior' : 'no prior data'}
          </div>
        </div>

        <div className="wl-stat">
          <div className="wl-label">Pace change</div>
          <div className="wl-value" style={{ color: paceColor }}>
            {paceDiff == null
              ? '—'
              : `${paceArrow} ${Math.abs(paceDiff).toFixed(0)}s/km`}
          </div>
          <div className="wl-sub">{paceDiff == null ? '' : (paceDiff < 0 ? 'faster' : 'slower')}</div>
        </div>
      </div>

      {bothIncreasing && (
        <div className="wl-warning">
          ⚠ You increased both distance and pace this week — pick one to avoid injury
        </div>
      )}
    </div>
  );
}
