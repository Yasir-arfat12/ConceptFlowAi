/**
 * OpenRouter AI client configuration.
 * Uses the OpenAI-compatible API from OpenRouter.
 * Model and API key come from environment variables.
 */
const { OpenAI } = require('openai');
require('dotenv').config();

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const modelName = process.env.OPENROUTER_MODEL || 'qwen/qwen3-14b:free';

let ai = null;

if (apiKey && apiKey !== 'your-openrouter-api-key') {
  ai = new OpenAI({ baseURL, apiKey });
  console.log(`[AI] OpenRouter client configured. Model: ${modelName}`);
} else {
  console.warn('[AI] OPENROUTER_API_KEY not set. AI features will be unavailable for non-prebuilt topics.');
}

module.exports = { ai, modelName, isConfigured: !!ai };
