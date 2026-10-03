// src/routes/learning.js
import { Router } from 'express';
import {
  startSession, listSessions, getSessionById, getCurrent,
  submitAnswer, dashboard, progress, suggestedTopics,
} from '../controllers/learningController.js';
import { askDoubtHandler, getHistory } from '../controllers/doubtController.js';
import { requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } } });

const router = Router();
router.use(requireAuth);

// Session management
router.post('/learning/start', aiLimiter, startSession);
router.get('/learning', listSessions);
router.get('/learning/:sessionId', getSessionById);
router.get('/learning/:sessionId/current', getCurrent);

// Checkpoint answering
router.post('/checkpoints/:checkpointId/answer', aiLimiter, submitAnswer);

// Doubts
router.post('/learning/:sessionId/concept/:conceptId/doubt', aiLimiter, askDoubtHandler);
router.get('/learning/:sessionId/concept/:conceptId/doubt', getHistory);

// Dashboard & Progress
router.get('/dashboard', dashboard);
router.get('/progress', progress);

// Suggested topics
router.get('/topics', suggestedTopics);

export default router;
