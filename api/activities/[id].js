import { stravaGet } from '../_lib/strava.js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const detail = await stravaGet(`/activities/${id}`);
    res.json({
      id:                detail.id,
      name:              detail.name,
      start_date:        detail.start_date,
      start_date_local:  detail.start_date_local,
      distance_m:        detail.distance,
      moving_time_s:     detail.moving_time,
      average_speed_mps: detail.average_speed,
      splits_metric:     detail.splits_metric  || [],
      best_efforts:      detail.best_efforts   || [],
    });
  } catch (err) {
    if (err.code === 'NOT_CONNECTED')  return res.status(401).json({ error: 'not_connected' });
    if (err.response?.status === 401)  return res.status(401).json({ error: 'strava_unauthorized' });
    console.error(err.message);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
}
