const { ai, modelName } = require('../config/openRouter');

const generateContentWithRetry = async (prompt, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await ai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return { text: response.choices[0].message.content };
    } catch (error) {
      const errorMsg = error.message || error.toString();
      const status = error.status || (errorMsg.includes('503') ? 503 : (errorMsg.includes('429') ? 429 : null));
      const isTransient = status === 503 || status === 429 || (status && status >= 500);

      console.log(`[AI] Attempt ${attempt}/${maxRetries}`);
      console.log(`[AI] Model: ${modelName}`);
      console.log(`[AI] Error: ${status || errorMsg}`);

      if (!isTransient) {
        console.log(`[AI] Final attempt failed`);
        console.log(`[AI] Status: ${status || 'unknown'}`);
        console.log(`[AI] Returning AI_SERVICE_ERROR`);
        throw error;
      }

      if (attempt >= maxRetries) {
        console.log(`[AI] Final attempt failed`);
        console.log(`[AI] Status: ${status || 'unknown'}`);
        console.log(`[AI] Returning AI_SERVICE_ERROR`);
        throw error;
      }

      const delayMs = attempt * 1000 + Math.random() * 500;
      console.log(`[AI] Retrying in ${Math.round(delayMs)}ms`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
};

const generateLearningPath = async (query) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  const prompt = `You are an expert tutor. Create a structured learning path for the following topic: "${query}". 
The path should contain exactly 4 to 6 concepts, ordered from beginner to advanced.
Each concept MUST have a title, an educational and understandable content explanation, and a checkpoint question that tests understanding of that specific concept.
IMPORTANT: Return ONLY valid JSON in the following exact structure:
{
  "concepts": [
    {
      "title": "String",
      "content": "String",
      "checkpoint": { "question": "String" }
    }
  ]
}`;

  try {
    const response = await generateContentWithRetry(prompt);

    if (!response || !response.text) {
      throw new Error('AI_EMPTY_RESPONSE');
    }

    const data = JSON.parse(response.text);

    if (!data.concepts || !Array.isArray(data.concepts) || data.concepts.length < 1) {
      throw new Error('AI_MALFORMED_RESPONSE');
    }

    return data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    if (error.message.includes('AI_')) {
      throw error;
    }
    throw new Error('AI_API_FAILURE');
  }
};

const evaluateCheckpoint = async (question, answer, referenceContent) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  const prompt = `You are an expert tutor evaluating a student's answer.
Context (from the lesson): "${referenceContent || 'N/A'}"
Question asked: "${question}"
Student's answer: "${answer}"

Evaluate the student's answer based on the context and the question. Provide a score out of 100, determine if it is generally correct, and provide short, encouraging feedback.
IMPORTANT: Return ONLY valid JSON in the following exact structure:
{
  "score": 85,
  "feedback": "String",
  "isCorrect": true
}`;

  try {
    const response = await generateContentWithRetry(prompt);

    if (!response || !response.text) {
      throw new Error('AI_EMPTY_RESPONSE');
    }

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error('AI Evaluation Error:', error.message);
    if (error.message.includes('AI_')) {
      throw error;
    }
    throw new Error('AI_API_FAILURE');
  }
};

const answerDoubt = async (conceptContent, doubtQuestion) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  const prompt = `You are an expert tutor. A student has asked a question regarding a specific concept they are learning.
Concept Context: "${conceptContent || 'N/A'}"
Student's Doubt: "${doubtQuestion}"

Provide a clear, encouraging, and highly relevant answer to the student's doubt. Keep the explanation strictly focused on the provided concept context.
IMPORTANT: Return ONLY valid JSON in the following exact structure:
{
  "answer": "String"
}`;

  try {
    const response = await generateContentWithRetry(prompt);

    if (!response || !response.text) {
      throw new Error('AI_EMPTY_RESPONSE');
    }

    const data = JSON.parse(response.text);
    return data.answer;
  } catch (error) {
    console.error('AI Doubt Error:', error.message);
    if (error.message.includes('AI_')) {
      throw error;
    }
    throw new Error('AI_API_FAILURE');
  }
};

const generateQuiz = async (topic, conceptsText) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  const prompt = `You are an expert tutor creating a final quiz for a student who has just completed a learning session on the topic: "${topic}".
Here are the concepts they learned:
${conceptsText}

Generate a 5-question multiple-choice quiz that tests their understanding of these concepts.
For each question, provide 4 options and specify the correct option index (0 to 3).
IMPORTANT: Return ONLY valid JSON in the following exact structure:
{
  "questions": [
    {
      "question": "String",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctOptionIndex": 0
    }
  ]
}`;

  try {
    const response = await generateContentWithRetry(prompt);

    if (!response || !response.text) {
      throw new Error('AI_EMPTY_RESPONSE');
    }

    const data = JSON.parse(response.text);
    return data.questions;
  } catch (error) {
    console.error('AI Quiz Error:', error.message);
    if (error.message.includes('AI_')) {
      throw error;
    }
    throw new Error('AI_API_FAILURE');
  }
};

const generateAssignment = async (topic, conceptsText) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  const prompt = `You are an expert tutor creating a practical assignment for a student who has just completed a learning session on the topic: "${topic}".
Here are the concepts they learned:
${conceptsText}

Generate a practical assignment that tests their ability to apply these concepts.
Include a title, a brief description, and a list of 2 to 3 actionable tasks they must complete.
IMPORTANT: Return ONLY valid JSON in the following exact structure:
{
  "title": "String",
  "description": "String",
  "tasks": ["Task 1", "Task 2"]
}`;

  try {
    const response = await generateContentWithRetry(prompt);

    if (!response || !response.text) {
      throw new Error('AI_EMPTY_RESPONSE');
    }

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error('AI Assignment Error:', error.message);
    if (error.message.includes('AI_')) {
      throw error;
    }
    throw new Error('AI_API_FAILURE');
  }
};

module.exports = {
  generateLearningPath,
  evaluateCheckpoint,
  answerDoubt,
  generateQuiz,
  generateAssignment
};
