import { exchangeCodeForTokens } from '../_lib/strava.js';
import { writeTokens, readTokens } from '../_lib/tokens.js';

export default async function handler(req, res) {
  const { code, error } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error) return res.redirect(`${clientUrl}/?auth=denied`);
  if (!code)  return res.status(400).json({ error: 'Missing code param' });

  try {
    const tokens   = await exchangeCodeForTokens(code);
    const existing = (await readTokens()) ?? {};
    await writeTokens({ ...existing, ...tokens });
    res.redirect(`${clientUrl}/?auth=ok`);
  } catch (err) {
    console.error('OAuth exchange failed:', err.response?.data || err.message);
    res.redirect(`${clientUrl}/?auth=error`);
  }
}
