/**
 * AI Service — abstraction over the AI provider.
 *
 * All backend AI calls go through this service.
 * The AI never directly writes to the database.
 * The backend controls all state transitions.
 *
 * Supports: OpenRouter (default), can be swapped by changing config/openRouter.js
 */
const { ai, modelName, isConfigured } = require('../config/openRouter');

// ─── Internal helpers ────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

async function callAI(messages, retries = MAX_RETRIES) {
  if (!isConfigured || !ai) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  let attempt = 0;
  while (attempt < retries) {
    attempt++;
    try {
      const response = await ai.chat.completions.create({
        model: modelName,
        messages,
        response_format: { type: 'json_object' },
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('AI_EMPTY_RESPONSE');
      return JSON.parse(content);
    } catch (err) {
      const status = err.status || (err.message?.includes('503') ? 503 : err.message?.includes('429') ? 429 : 0);
      const isTransient = status === 503 || status === 429 || status >= 500;

      console.warn(`[AI] Attempt ${attempt}/${retries} failed. Status: ${status || err.message}`);

      if (!isTransient || attempt >= retries) {
        throw new Error(`AI_API_FAILURE: ${err.message}`);
      }

      const delayMs = attempt * 1500 + Math.random() * 500;
      console.log(`[AI] Retrying in ${Math.round(delayMs)}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a structured learning path for a topic.
 * Returns: { topic, concepts: [{ title, content, examples, keyTakeaways, checkpoint: { question, expectedKeywords } }] }
 */
async function generateLearningPath(topic) {
  const data = await callAI([
    {
      role: 'system',
      content: `You are an expert curriculum designer. Generate a structured learning path.
Always return valid JSON. Never include markdown fences or extra commentary.`,
    },
    {
      role: 'user',
      content: `Create a structured learning path for the topic: "${topic}"

Requirements:
- 4 to 6 concepts, ordered from beginner to advanced
- Each concept teaches one focused idea
- content should be detailed and educational (200+ words)
- examples should include a practical or code example where relevant
- keyTakeaways should be 2-3 bullet points

Return this EXACT JSON structure (no extra keys):
{
  "topic": "string",
  "concepts": [
    {
      "title": "string",
      "content": "string",
      "examples": "string",
      "keyTakeaways": "string",
      "checkpoint": {
        "question": "string",
        "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
      }
    }
  ]
}`,
    },
  ]);

  if (!data?.concepts || !Array.isArray(data.concepts) || data.concepts.length < 1) {
    throw new Error('AI_MALFORMED_RESPONSE: concepts array missing or empty');
  }

  // Validate each concept
  data.concepts.forEach((c, i) => {
    if (!c.title || !c.content || !c.checkpoint?.question) {
      throw new Error(`AI_MALFORMED_RESPONSE: concept[${i}] missing required fields`);
    }
    if (!Array.isArray(c.checkpoint.expectedKeywords)) {
      c.checkpoint.expectedKeywords = [];
    }
  });

  return data;
}

/**
 * Evaluate a student's checkpoint answer.
 * Returns: { score: 0-100, isCorrect: boolean, feedback: string, masteryLevel: string }
 */
async function evaluateCheckpoint(question, answer, conceptContent) {
  const data = await callAI([
    {
      role: 'system',
      content: `You are an expert tutor evaluating a student's answer.
Be encouraging but honest. Score 0-100 based on conceptual correctness and completeness.
Always return valid JSON only.`,
    },
    {
      role: 'user',
      content: `Concept context: "${conceptContent || 'N/A'}"

Question: "${question}"

Student's answer: "${answer}"

Evaluate and return EXACTLY this JSON:
{
  "score": 85,
  "isCorrect": true,
  "feedback": "short encouraging feedback string",
  "masteryLevel": "strong_understanding"
}

Score guide: 0-39 = needs_improvement, 40-59 = developing, 60-79 = good_understanding, 80-100 = strong_understanding
masteryLevel must be one of: needs_improvement, developing, good_understanding, strong_understanding`,
    },
  ]);

  if (typeof data.score !== 'number' || typeof data.isCorrect !== 'boolean' || !data.feedback) {
    throw new Error('AI_MALFORMED_RESPONSE: invalid evaluation response');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(data.score))),
    isCorrect: data.isCorrect,
    feedback: data.feedback,
    masteryLevel: data.masteryLevel || scoringService.getMasteryLevel(data.score),
  };
}

/**
 * Answer a student's contextual doubt about a specific concept.
 * Returns a string answer.
 */
async function answerDoubt(conceptContent, conceptTitle, sessionTopic, doubtQuestion) {
  const data = await callAI([
    {
      role: 'system',
      content: `You are an expert tutor helping a student understand a specific concept.
Keep answers focused on the concept context. Be clear and encouraging.
Always return valid JSON only.`,
    },
    {
      role: 'user',
      content: `The student is learning about: "${sessionTopic}"
Current concept: "${conceptTitle}"
Concept content: "${conceptContent || 'N/A'}"

Student's doubt: "${doubtQuestion}"

Answer the doubt clearly, using the concept as context. Return EXACTLY this JSON:
{
  "answer": "your detailed answer here"
}`,
    },
  ]);

  if (!data?.answer) throw new Error('AI_MALFORMED_RESPONSE: answer field missing');
  return String(data.answer);
}

/**
 * Generate a quiz for a completed learning session.
 * Returns: [{ question, options, correctOptionIndex, explanation }]
 */
async function generateQuiz(topic, conceptsSummary) {
  const data = await callAI([
    {
      role: 'system',
      content: `You are an expert tutor creating a multiple-choice quiz.
Always return valid JSON only.`,
    },
    {
      role: 'user',
      content: `Create a 5-question multiple-choice quiz for: "${topic}"

Concepts covered:
${conceptsSummary}

Return EXACTLY this JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "correctOptionIndex": 0,
      "explanation": "why this answer is correct"
    }
  ]
}`,
    },
  ]);

  if (!data?.questions || !Array.isArray(data.questions) || data.questions.length < 1) {
    throw new Error('AI_MALFORMED_RESPONSE: questions array missing');
  }

  return data.questions;
}

/**
 * Generate an assignment for a completed learning session.
 * Returns: { title, description, tasks: [string] }
 */
async function generateAssignment(topic, conceptsSummary) {
  const data = await callAI([
    {
      role: 'system',
      content: `You are an expert tutor creating a practical assignment.
Always return valid JSON only.`,
    },
    {
      role: 'user',
      content: `Create a practical assignment for a student who completed learning: "${topic}"

Concepts covered:
${conceptsSummary}

Return EXACTLY this JSON:
{
  "title": "string",
  "description": "string",
  "difficulty": "beginner|intermediate|advanced",
  "tasks": ["Task 1 description", "Task 2 description", "Task 3 description"],
  "expectedOutput": "what a successful submission should demonstrate"
}`,
    },
  ]);

  if (!data?.title || !data?.tasks || !Array.isArray(data.tasks)) {
    throw new Error('AI_MALFORMED_RESPONSE: assignment fields missing');
  }

  return data;
}

// ─── Scoring utility (shared with controllers) ────────────────────────────────

const scoringService = {
  PASS_SCORE: parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10),

  getMasteryLevel(score) {
    if (score >= 80) return 'strong_understanding';
    if (score >= 60) return 'good_understanding';
    if (score >= 40) return 'developing';
    return 'needs_improvement';
  },

  isPassing(score) {
    return score >= this.PASS_SCORE;
  },
};

module.exports = {
  generateLearningPath,
  evaluateCheckpoint,
  answerDoubt,
  generateQuiz,
  generateAssignment,
  scoringService,
  isConfigured,
};
