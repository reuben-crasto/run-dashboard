import { readTokens } from './_lib/tokens.js';

export default async function handler(req, res) {
  const tokens = await readTokens();
  if (!tokens) return res.json({ connected: false });
  res.json({ connected: true, athlete: tokens.athlete ?? null });
}
