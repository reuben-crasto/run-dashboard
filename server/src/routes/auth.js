import { Router } from 'express';
import { exchangeCodeForTokens } from '../lib/strava.js';
import { writeTokens, readTokens } from '../lib/tokens.js';

const router = Router();

// Kick off OAuth — redirect user to Strava authorize page
router.get('/strava', (req, res) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Strava env vars not configured' });
  }

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('approval_prompt', 'auto');
  url.searchParams.set('scope', 'read,activity:read_all');

  res.redirect(url.toString());
});

// Strava redirects back here with ?code=... (and ?error=... on denial)
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${clientUrl}/?auth=denied`);
  }
  if (!code) {
    return res.status(400).json({ error: 'Missing code param' });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    // Preserve previous athlete info if present
    const existing = (await readTokens()) ?? {};
    await writeTokens({ ...existing, ...tokens });
    res.redirect(`${clientUrl}/?auth=ok`);
  } catch (err) {
    console.error('OAuth exchange failed:', err.response?.data || err.message);
    res.redirect(`${clientUrl}/?auth=error`);
  }
});

export default router;
