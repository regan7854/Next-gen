import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profiles.js';
import discoverRouter from './routes/discover.js';
import collabRouter from './routes/collabs.js';
import campaignRouter from './routes/campaigns.js';

dotenv.config();

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ?.split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : undefined,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/discover', discoverRouter);
app.use('/api/collabs', collabRouter);
app.use('/api/campaigns', campaignRouter);

app.use((err, _req, res, _next) => {
  // Generic error handler so clients receive consistent responses.
  console.error(err);
  res.status(err.status ?? 500).json({
    message: err.message ?? 'Unexpected server error',
  });
});

export default app;
