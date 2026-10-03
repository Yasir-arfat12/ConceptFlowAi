// src/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import env from './config/env.js';
import logger from './config/logger.js';
import authRoutes from './routes/auth.js';
import learningRoutes from './routes/learning.js';
import { errorHandler } from './middleware/errorHandler.js';
import pool from './db/pool.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: [env.CLIENT_ORIGIN, 'http://localhost:5173'],
  credentials: true,
}));

// Logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// General rate limit
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use(generalLimiter);

// Health check
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch { /* ignore */ }
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    ai: env.AI_MODE,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', learningRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler
app.use(errorHandler);

export default app;
