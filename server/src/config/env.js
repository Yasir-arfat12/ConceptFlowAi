// src/config/env.js
// Validates and exports all environment variables. Fails fast on missing required values.
import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_MODE: z.enum(['live', 'offline']).default('live'),
  CHECKPOINT_PASS_SCORE: z.string().default('0').transform(Number),
  NODE_ENV: z.string().default('development'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  parsed.error.issues.forEach((i) => console.error(`   ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

const env = parsed.data;

// Fail fast: AI_MODE=live requires GEMINI_API_KEY
if (env.AI_MODE === 'live' && !env.GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY is required when AI_MODE=live');
  process.exit(1);
}

export default env;
