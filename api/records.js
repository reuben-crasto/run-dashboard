import { stravaGet } from './_lib/strava.js';

const DISTANCES = ['1k', '1 mile', '5k', '10k'];

export default async function handler(req, res) {
  try {
    const all  = await stravaGet('/athlete/activities', { per_page: 20, page: 1 });
    const runs = (all || []).filter((a) => a.type === 'Run' || a.sport_type === 'Run');

    // Fetch all details in parallel (sequential would hit Vercel's 10s timeout)
    const details = await Promise.all(
      runs.map((r) => stravaGet(`/activities/${r.id}`))
    );

    const best = {};
    for (const detail of details) {
      for (const effort of detail.best_efforts || []) {
        if (!DISTANCES.includes(effort.name)) continue;
        const prev = best[effort.name];
        if (!prev || effort.elapsed_time < prev.elapsed_time) {
          best[effort.name] = {
            distance_name: effort.name,
            elapsed_time:  effort.elapsed_time,
            start_date:    effort.start_date,
            activity_id:   detail.id,
            activity_name: detail.name,
          };
        }
      }
    }

    res.json(DISTANCES.map((name) => best[name] ?? { distance_name: name, elapsed_time: null }));
  } catch (err) {
    if (err.code === 'NOT_CONNECTED')  return res.status(401).json({ error: 'not_connected' });
    if (err.response?.status === 401)  return res.status(401).json({ error: 'strava_unauthorized' });
    console.error(err.message);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
}
