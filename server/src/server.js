// src/server.js
import 'dotenv/config';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import pool from './db/pool.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, mode: env.AI_MODE, env: env.NODE_ENV }, '🚀 ConceptFlow server started');
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(async () => {
    await pool.end();
    logger.info('Server and DB pool closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
