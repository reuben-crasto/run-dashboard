import { useNavigate } from 'react-router-dom';
import { formatDate, formatKm, formatDuration, mpsToSecPerKm, formatPace } from '../lib/format.js';

export default function RunsList({ runs, loggedIds = new Set(), onLog }) {
  const navigate = useNavigate();

  if (runs.length === 0) return <div className="empty-state">No runs yet.</div>;

  return (
    <div className="runs-list">
      {runs.map((r) => {
        const isLogged = loggedIds.has(String(r.id));
        return (
          <div
            className="run-row"
            key={r.id}
            onClick={() => navigate(`/run/${r.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/run/${r.id}`)}
          >
            <span className="date">{formatDate(r.start_date)}</span>
            <span className="name">{r.name}</span>
            <span className="num">{formatKm(r.distance_m, 2)}</span>
            <span className="num">{formatDuration(r.moving_time_s)}</span>
            <span className="num">{formatPace(mpsToSecPerKm(r.average_speed_mps))}</span>
            <span className="log-cell" onClick={(e) => e.stopPropagation()}>
              {isLogged
                ? <span className="log-check" title="Logged">✓</span>
                : <button
                    className="log-btn"
                    onClick={() => onLog && onLog(r)}
                    title="Log this run"
                  >+</button>
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}
