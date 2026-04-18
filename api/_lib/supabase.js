import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.startsWith('your_')) {
    const err = new Error('Supabase not configured');
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
  _client = createClient(url, key);
  return _client;
}
