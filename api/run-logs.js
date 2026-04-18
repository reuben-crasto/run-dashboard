import { getSupabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'GET')  return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  res.status(405).json({ error: 'method_not_allowed' });
}

async function handleGet(req, res) {
  try {
    const ids = (req.query.activity_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json([]);

    const supabase = getSupabase();
    const { data, error } = await supabase.from('run_logs').select('*').in('activity_id', ids);
    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    if (err.code === 'SUPABASE_NOT_CONFIGURED') return res.json([]);
    res.status(500).json({ error: err.message });
  }
}

async function handlePost(req, res) {
  try {
    const { activity_id, km1_rpe, soreness, overall, notes } = req.body;
    if (!activity_id) return res.status(400).json({ error: 'activity_id is required' });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('run_logs')
      .upsert({
        activity_id: String(activity_id),
        km1_rpe:     km1_rpe  ?? null,
        soreness:    soreness ?? null,
        overall:     overall  ?? null,
        notes:       notes    || null,
        logged_at:   new Date().toISOString(),
      }, { onConflict: 'activity_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    if (err.code === 'SUPABASE_NOT_CONFIGURED')
      return res.status(503).json({ error: 'supabase_not_configured' });
    res.status(500).json({ error: err.message });
  }
}
