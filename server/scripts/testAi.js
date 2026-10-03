// scripts/testAi.js
// Quick test: makes one tiny structured AI call and prints model, latency, result
import 'dotenv/config';
import { callGemini } from '../src/services/ai/geminiClient.js';
import { z } from 'zod';

const schema = z.object({ answer: z.string() });
const responseSchema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
};

const start = Date.now();
console.log('Testing AI connection...');

callGemini({
  task: 'test',
  systemPrompt: 'You are a helpful assistant. Answer in JSON.',
  userPrompt: 'What is 2+2? Return {"answer": "your answer"}',
  responseSchema,
  zodValidator: schema,
})
  .then((result) => {
    const latency = Date.now() - start;
    console.log('✅ Success!');
    console.log(`   Model: ${process.env.GEMINI_MODEL}`);
    console.log(`   Latency: ${latency}ms`);
    console.log(`   Result:`, result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
