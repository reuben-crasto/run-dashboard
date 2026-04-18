import { formatDuration, formatDate } from '../lib/format.js';

// Map Strava's effort names to display labels
const DISPLAY = {
  '1k': '1 KM',
  '1 mile': '1 MILE',
  '5k': '5 KM',
  '10k': '10 KM',
};

export default function PersonalRecords({ records }) {
  return (
    <div className="pr-grid">
      {records.map((r) => (
        <div className="pr-card" key={r.distance_name}>
          <div className="label">{DISPLAY[r.distance_name] ?? r.distance_name}</div>
          {r.elapsed_time != null ? (
            <>
              <div className="time">{formatDuration(r.elapsed_time)}</div>
              <div className="meta">{formatDate(r.start_date)}</div>
              <div className="meta">{r.activity_name || 'Run details unavailable'}</div>
            </>
          ) : (
            <>
              <div className="time empty">—</div>
              <div className="meta">Not enough data</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
