// src/config/logger.js
import pino from 'pino';
import env from './env.js';

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production'
    ? { target: 'pino/file', options: { destination: 1 } }
    : undefined,
  redact: ['req.headers.authorization', 'body.password', 'body.password_hash'],
});

export default logger;
