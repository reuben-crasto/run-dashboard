import { Router } from 'express';
import { stravaGet } from '../lib/strava.js';
import { readTokens } from '../lib/tokens.js';

const router = Router();

// Simple in-memory cache to stay inside Strava's rate limits during dev.
const cache = new Map();
const TTL_MS = 2 * 60 * 1000; // 2 minutes

async function cached(key, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = await fetcher();
  cache.set(key, { value, at: Date.now() });
  return value;
}

// Auth status — used by the client to decide whether to show "Connect to Strava"
router.get('/status', async (req, res) => {
  const tokens = await readTokens();
  if (!tokens) return res.json({ connected: false });
  res.json({
    connected: true,
    athlete: tokens.athlete ?? null,
  });
});

// Last 50 runs
router.get('/activities', async (req, res, next) => {
  try {
    const all = await cached('activities:50', () =>
      stravaGet('/athlete/activities', { per_page: 50, page: 1 })
    );
    const runs = (all || []).filter((a) => a.type === 'Run' || a.sport_type === 'Run');
    const summary = runs.map((a) => ({
      id: a.id,
      name: a.name,
      start_date: a.start_date,
      start_date_local: a.start_date_local,
      distance_m: a.distance,
      moving_time_s: a.moving_time,
      elapsed_time_s: a.elapsed_time,
      average_speed_mps: a.average_speed,
      total_elevation_gain: a.total_elevation_gain,
    }));
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// Full detail for a single run (includes splits_metric + best_efforts)
router.get('/activities/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const detail = await cached(`activity:${id}`, () => stravaGet(`/activities/${id}`));
    res.json({
      id: detail.id,
      name: detail.name,
      start_date: detail.start_date,
      start_date_local: detail.start_date_local,
      distance_m: detail.distance,
      moving_time_s: detail.moving_time,
      average_speed_mps: detail.average_speed,
      splits_metric: detail.splits_metric || [],
      best_efforts: detail.best_efforts || [],
    });
  } catch (err) {
    next(err);
  }
});

// Best efforts across all activities — reduces to best-per-distance
router.get('/records', async (req, res, next) => {
  try {
    const DISTANCES = ['1k', '1 mile', '5k', '10k'];
    const summaries = await cached('activities:50', () =>
      stravaGet('/athlete/activities', { per_page: 50, page: 1 })
    );
    const runs = (summaries || []).filter(
      (a) => a.type === 'Run' || a.sport_type === 'Run'
    );

    // Strava's summary activity doesn't include best_efforts — we need the detail call.
    // We fetch details in sequence to stay friendly on rate limits.
    const best = {};
    for (const run of runs) {
      const detail = await cached(`activity:${run.id}`, () =>
        stravaGet(`/activities/${run.id}`)
      );
      for (const effort of detail.best_efforts || []) {
        if (!DISTANCES.includes(effort.name)) continue;
        const prev = best[effort.name];
        if (!prev || effort.elapsed_time < prev.elapsed_time) {
          best[effort.name] = {
            distance_name: effort.name,
            elapsed_time: effort.elapsed_time,
            start_date: effort.start_date,
            activity_id: run.id,
            activity_name: run.name,
          };
        }
      }
    }

    // Return in a stable order, with placeholders for missing distances
    const records = DISTANCES.map((name) => best[name] ?? { distance_name: name, elapsed_time: null });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

export default router;
