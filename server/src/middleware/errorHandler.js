// src/middleware/errorHandler.js
import logger from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  if (status >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled error');
  }

  const body = {
    success: false,
    error: { code, message },
  };
  if (err.details) body.error.details = err.details;

  return res.status(status).json(body);
}
