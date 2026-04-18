import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/api', apiRouter);

// Centralised error handler — maps NOT_CONNECTED to 401 so the client can redirect to auth.
app.use((err, req, res, _next) => {
  const stravaStatus = err.response?.status;
  const stravaBody = err.response?.data;
  if (err.code === 'NOT_CONNECTED') {
    return res.status(401).json({ error: 'not_connected' });
  }
  if (stravaStatus === 401) {
    return res.status(401).json({ error: 'strava_unauthorized', detail: stravaBody });
  }
  console.error('Unhandled error:', stravaBody || err.message);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Client expected at ${CLIENT_URL}`);
});
