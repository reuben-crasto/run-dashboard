import { stravaGet } from './_lib/strava.js';

export default async function handler(req, res) {
  try {
    const all  = await stravaGet('/athlete/activities', { per_page: 50, page: 1 });
    const runs = (all || []).filter((a) => a.type === 'Run' || a.sport_type === 'Run');
    res.json(runs.map((a) => ({
      id:                  a.id,
      name:                a.name,
      start_date:          a.start_date,
      start_date_local:    a.start_date_local,
      distance_m:          a.distance,
      moving_time_s:       a.moving_time,
      elapsed_time_s:      a.elapsed_time,
      average_speed_mps:   a.average_speed,
      total_elevation_gain: a.total_elevation_gain,
    })));
  } catch (err) {
    handleError(err, res);
  }
}

function handleError(err, res) {
  if (err.code === 'NOT_CONNECTED')    return res.status(401).json({ error: 'not_connected' });
  if (err.response?.status === 401)    return res.status(401).json({ error: 'strava_unauthorized' });
  console.error(err.message);
  res.status(500).json({ error: 'internal_error', message: err.message });
}
