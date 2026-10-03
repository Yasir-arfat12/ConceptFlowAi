// src/routes/auth.js
import { Router } from 'express';
import { signup, loginHandler, me, RegisterSchema, LoginSchema } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts. Please try again later.' } },
});

const router = Router();
router.post('/signup', authLimiter, validate(RegisterSchema), signup);
router.post('/login', authLimiter, validate(LoginSchema), loginHandler);
router.get('/me', requireAuth, me);

export default router;

