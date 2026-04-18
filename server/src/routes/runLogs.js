import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

const router = Router();

// GET /api/run-logs?activity_ids=1,2,3
router.get('/', async (req, res, next) => {
  try {
    const ids = (req.query.activity_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json([]);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('run_logs')
      .select('*')
      .in('activity_id', ids);

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    if (err.code === 'SUPABASE_NOT_CONFIGURED') return res.json([]);
    next(err);
  }
});

// POST /api/run-logs
router.post('/', async (req, res, next) => {
  try {
    const { activity_id, km1_rpe, soreness, overall, notes } = req.body;
    if (!activity_id) return res.status(400).json({ error: 'activity_id is required' });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('run_logs')
      .upsert(
        {
          activity_id: String(activity_id),
          km1_rpe: km1_rpe ?? null,
          soreness: soreness ?? null,
          overall: overall ?? null,
          notes: notes || null,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'activity_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    if (err.code === 'SUPABASE_NOT_CONFIGURED')
      return res.status(503).json({ error: 'supabase_not_configured' });
    next(err);
  }
});

export default router;
