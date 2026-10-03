const { OpenAI } = require('openai');
require('dotenv').config();

if (!process.env.OPENROUTER_API_KEY) {
  console.error("CRITICAL ERROR: OPENROUTER_API_KEY is not defined in environment variables.");
}

const ai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const modelName = 'qwen/qwen3.8-27b:free';

module.exports = {
  ai,
  modelName
};
