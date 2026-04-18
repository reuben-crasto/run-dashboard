export default function handler(req, res) {
  const clientId   = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Strava env vars not configured' });
  }

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id',       clientId);
  url.searchParams.set('redirect_uri',    redirectUri);
  url.searchParams.set('response_type',   'code');
  url.searchParams.set('approval_prompt', 'auto');
  url.searchParams.set('scope',           'read,activity:read_all');

  res.redirect(url.toString());
}
