import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import cron from 'node-cron';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import jobRoutes from './routes/jobs.js';
import skillRoutes from './routes/skills.js';
import pathRoutes from './routes/paths.js';
import credentialRoutes from './routes/credentials.js';
import employerRoutes from './routes/employer.js';
import { refreshPublicJobs } from './services/adzunaService.js';
import { expireOldCredentials, checkMarketDrift } from './services/credentialService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 }, abortOnLimit: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/paths', pathRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/employer', employerRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Scheduled jobs ───────────────────────────────────────────────────────────
// Refresh Adzuna public jobs every 6 hours
cron.schedule('0 */6 * * *', () => refreshPublicJobs().catch(console.error));
// Expire old credentials daily at midnight
cron.schedule('0 0 * * *', () => expireOldCredentials().catch(console.error));
// Check market drift weekly
cron.schedule('0 2 * * 0', () => checkMarketDrift().catch(console.error));

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SkillGap API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
