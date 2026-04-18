/**
 * Token storage for Vercel serverless — uses Supabase as the persistent store.
 *
 * Why Supabase instead of tokens.json:
 *   - Vercel's filesystem is read-only at runtime.
 *   - Serverless functions have no shared memory between invocations.
 *   - Strava rotates the refresh_token on every refresh call, so a stale
 *     refresh_token in env vars would break auth after the first expiry.
 *   - Supabase gives us one reliable row to read/write tokens from any function.
 *
 * Required Supabase table (run once in the SQL editor):
 *
 *   create table strava_tokens (
 *     id           integer primary key default 1,
 *     access_token text,
 *     refresh_token text not null,
 *     expires_at   bigint,
 *     athlete      jsonb,
 *     updated_at   timestamptz default now(),
 *     constraint strava_tokens_single_row check (id = 1)
 *   );
 */

import { getSupabase } from './supabase.js';

export async function readTokens() {
  // 1. Supabase (primary — works across all serverless invocations)
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('id', 1)
      .single();
    if (data) {
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at:    data.expires_at,
        athlete:       data.athlete,
      };
    }
  } catch (_) {}

  // 2. Env-var seed (use once to bootstrap if migrating from Railway/local)
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  if (refreshToken) {
    let athlete = null;
    try { athlete = JSON.parse(process.env.STRAVA_ATHLETE_JSON || 'null'); } catch (_) {}
    return { access_token: null, refresh_token: refreshToken, expires_at: 0, athlete };
  }

  return null;
}

export async function writeTokens(tokens) {
  try {
    const supabase = getSupabase();
    await supabase.from('strava_tokens').upsert({
      id:            1,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at:    tokens.expires_at,
      athlete:       tokens.athlete ?? null,
      updated_at:    new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not persist tokens to Supabase:', err.message);
  }
}

export function isExpired(tokens, skewSeconds = 60) {
  if (!tokens?.expires_at) return true;
  return Date.now() / 1000 >= tokens.expires_at - skewSeconds;
}
