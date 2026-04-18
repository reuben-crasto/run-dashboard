import { Link } from 'react-router-dom';
import { formatDate, formatKm, formatDuration, mpsToSecPerKm, formatPace } from '../lib/format.js';

export default function RunsList({ runs }) {
  if (runs.length === 0) return <div className="empty-state">No runs yet.</div>;
  return (
    <div className="runs-list">
      {runs.map((r) => (
        <Link to={`/run/${r.id}`} className="run-row" key={r.id}>
          <span className="date">{formatDate(r.start_date)}</span>
          <span className="name">{r.name}</span>
          <span className="num">{formatKm(r.distance_m, 2)}</span>
          <span className="num">{formatDuration(r.moving_time_s)}</span>
          <span className="num">{formatPace(mpsToSecPerKm(r.average_speed_mps))}</span>
        </Link>
      ))}
    </div>
  );
}
