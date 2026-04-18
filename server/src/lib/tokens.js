import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(__dirname, '../../tokens.json');

/**
 * tokens.json / in-memory shape:
 * {
 *   access_token: string,
 *   refresh_token: string,
 *   expires_at: number,   // unix seconds
 *   athlete: { id, firstname, lastname, username, profile }
 * }
 *
 * Railway deployment strategy
 * ───────────────────────────
 * Railway's free tier has an ephemeral filesystem — tokens.json is wiped on
 * redeploy.  To survive that:
 *
 *   1. Do the OAuth flow once locally → tokens.json is written.
 *   2. Copy `refresh_token` (and optionally `athlete` JSON) from tokens.json
 *      into Railway env vars:
 *        STRAVA_REFRESH_TOKEN=<value>
 *        STRAVA_ATHLETE_JSON=<stringified athlete object>   (optional)
 *   3. On Railway, readTokens() falls back to those env vars when tokens.json
 *      is absent.  A brand-new access token is fetched on the first request.
 *
 * The access_token and expires_at are kept in memory only on Railway (they
 * refresh automatically every 6 h without needing to touch env vars, because
 * Strava's free tier does NOT rotate the refresh token on every use — it only
 * issues a new one when the old one is about to expire).
 */

// In-memory cache so refreshed tokens survive within a Railway session even
// though we can't write to disk.
let memTokens = null;

export async function readTokens() {
  // 1. Prefer the local file (dev + first-run after OAuth)
  try {
    const raw = await fs.readFile(TOKENS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    memTokens = parsed;
    return parsed;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // 2. In-memory cache (tokens refreshed during this Railway session)
  if (memTokens) return memTokens;

  // 3. Env-var fallback (Railway: set STRAVA_REFRESH_TOKEN in the dashboard)
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  if (refreshToken) {
    let athlete = null;
    try {
      athlete = JSON.parse(process.env.STRAVA_ATHLETE_JSON || 'null');
    } catch (_) {}
    const seed = {
      access_token: null,
      refresh_token: refreshToken,
      expires_at: 0,   // force an immediate refresh on first API call
      athlete,
    };
    memTokens = seed;
    return seed;
  }

  return null;
}

export async function writeTokens(tokens) {
  memTokens = tokens;
  // Write to disk when possible (local dev). Silently skip if read-only.
  try {
    await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (err) {
    if (err.code !== 'EROFS' && err.code !== 'EACCES') throw err;
  }
}

export async function clearTokens() {
  memTokens = null;
  try {
    await fs.unlink(TOKENS_PATH);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

export function isExpired(tokens, skewSeconds = 60) {
  if (!tokens?.expires_at) return true;
  return Date.now() / 1000 >= tokens.expires_at - skewSeconds;
}
