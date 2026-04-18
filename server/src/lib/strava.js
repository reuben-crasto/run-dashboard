import axios from 'axios';
import { readTokens, writeTokens, isExpired } from './tokens.js';

const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

async function refreshAccessToken(refreshToken) {
  const { data } = await axios.post(STRAVA_OAUTH_URL, null, {
    params: {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  });
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };
}

/**
 * Returns a valid access token, refreshing if needed. Persists any refresh.
 * Throws if no tokens are stored yet.
 */
export async function getAccessToken() {
  const tokens = await readTokens();
  if (!tokens) {
    const err = new Error('Not connected to Strava');
    err.code = 'NOT_CONNECTED';
    throw err;
  }

  if (!isExpired(tokens)) return tokens.access_token;

  const refreshed = await refreshAccessToken(tokens.refresh_token);
  const merged = { ...tokens, ...refreshed };
  await writeTokens(merged);
  return merged.access_token;
}

/**
 * Exchange an OAuth authorization code for tokens + athlete info.
 */
export async function exchangeCodeForTokens(code) {
  const { data } = await axios.post(STRAVA_OAUTH_URL, null, {
    params: {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    },
  });
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete: data.athlete
      ? {
          id: data.athlete.id,
          firstname: data.athlete.firstname,
          lastname: data.athlete.lastname,
          username: data.athlete.username,
          profile: data.athlete.profile,
        }
      : null,
  };
}

/**
 * Authenticated GET against the Strava API.
 */
export async function stravaGet(pathname, params = {}) {
  const token = await getAccessToken();
  const { data } = await axios.get(`${STRAVA_API_BASE}${pathname}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data;
}
