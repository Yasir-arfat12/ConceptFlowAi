// src/middleware/validate.js
import { badRequest } from '../utils/errors.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('Validation failed', 'VALIDATION_ERROR'));
    }
    // Attach parsed values
    req.validated = result.data;
    return next();
  };
}
