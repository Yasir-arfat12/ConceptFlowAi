// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { unauthorized } from '../utils/errors.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('No token provided'));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.userId = payload.sub;
    req.user = payload;
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}
