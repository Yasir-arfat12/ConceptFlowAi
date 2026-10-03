// src/utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (msg = 'Not found') => new AppError(msg, 404, 'NOT_FOUND');
export const unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401, 'UNAUTHORIZED');
export const forbidden = (msg, code = 'FORBIDDEN') => new AppError(msg, 403, code);
export const badRequest = (msg, code = 'BAD_REQUEST') => new AppError(msg, 400, code);
export const conflict = (msg, code = 'CONFLICT') => new AppError(msg, 409, code);
export const serviceUnavailable = (msg, code = 'SERVICE_UNAVAILABLE') => new AppError(msg, 503, code);

// Async wrapper to avoid try/catch in every controller
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Standard success response
export const ok = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });
