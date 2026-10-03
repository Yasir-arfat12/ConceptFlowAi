// src/services/ai/geminiClient.js
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { logAiCall } from '../../repositories/topicRepo.js';

let ai = null;
if (env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

// Semaphore: at most 2 concurrent Gemini calls
let activeCount = 0;
const MAX_CONCURRENT = 2;
const queue = [];

function acquire() {
  return new Promise((resolve) => {
    if (activeCount < MAX_CONCURRENT) {
      activeCount++;
      resolve();
    } else {
      queue.push(resolve);
    }
  });
}

function release() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    activeCount--;
  }
}

async function callWithRetry(fn, taskName) {
  const RETRYABLE = [429, 500, 503];
  const MAX_ATTEMPTS = 4;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      if (!RETRYABLE.includes(status) && attempt < MAX_ATTEMPTS) {
        // Not retryable
        if (status >= 400 && status < 500) throw err;
      }
      if (attempt < MAX_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 500, 10000);
        logger.warn({ task: taskName, attempt, delay }, 'Gemini retry');
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// Core function: call Gemini with a prompt and response schema
export async function callGemini({ task, systemPrompt, userPrompt, responseSchema, zodValidator }) {
  if (!ai || env.AI_MODE === 'offline') {
    throw Object.assign(new Error('AI offline'), { code: 'AI_OFFLINE' });
  }

  await acquire();
  const start = Date.now();
  let status = 'error';
  let fallbackUsed = false;

  try {
    const rawResponse = await callWithRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const result = await ai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: [
            { role: 'user', parts: [{ text: userPrompt }] },
          ],
          systemInstruction: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });
        return result;
      } finally {
        clearTimeout(timeout);
      }
    }, task);

    const text = rawResponse.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw Object.assign(new Error('Invalid JSON from Gemini'), { code: 'INVALID_RESPONSE' });
    }

    // Zod validation
    if (zodValidator) {
      const validated = zodValidator.safeParse(parsed);
      if (!validated.success) {
        logger.warn({ task, issues: validated.error.issues }, 'Gemini response failed validation');
        throw Object.assign(new Error('Response validation failed'), { code: 'INVALID_RESPONSE' });
      }
      parsed = validated.data;
    }

    status = 'success';
    return parsed;
  } finally {
    release();
    const latencyMs = Date.now() - start;
    logAiCall({ task, model: env.GEMINI_MODEL, latencyMs, status, fallbackUsed }).catch(() => {});
  }
}
