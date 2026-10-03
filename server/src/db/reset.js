// src/db/reset.js
import pool from './pool.js';
import env from '../config/env.js';

if (env.NODE_ENV === 'production') {
  console.error('❌  db:reset refuses to run in production. NODE_ENV=production');
  process.exit(1);
}

async function reset() {
  console.log('⚠️   Dropping and recreating schema...');
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✅  Schema reset. Run db:migrate and db:seed next.');
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
