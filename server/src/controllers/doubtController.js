/**
 * Doubt Controller
 * Handles contextual doubt questions anchored to a specific concept.
 *
 * Critical rules:
 * - Asking a doubt NEVER modifies learning state
 * - Doubts are anchored to the current concept
 * - Doubt conversation is persisted for continuity
 * - AI answers using concept content as context
 */
const db = require('../config/db');
const { answerDoubt: answerWithAI, isConfigured: aiAvailable } = require('../services/aiService');
const { isPrebuiltTopic, evaluatePrebuiltDoubt } = require('../data/prebuiltTopics');

const GENERIC_FALLBACK = `I'm here to help you understand this concept better. Try asking me:
• Why is this step necessary?  
• Can you give me a different example?
• What happens if [edge case]?
• How does this relate to [related concept]?

I'll do my best to explain using the current concept as context.`;

/**
 * POST /api/learning/:sessionId/concepts/:conceptId/doubt
 * Answers a student's doubt about a specific concept.
 * Does NOT modify learning state.
 */
const askDoubt = async (req, res) => {
  try {
    const { sessionId, conceptId } = req.params;
    const rawQuestion = req.body.question || req.body.message;
    const question = typeof rawQuestion === 'string' ? rawQuestion.trim() : '';
    const userId = req.user.id;

    if (!question) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Question is required.' },
      });
    }

    if (question.trim().length > 1000) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Question is too long (max 1000 characters).' },
      });
    }

    // 1. Verify session ownership
    const sessionResult = await db.query(
      'SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }
    const session = sessionResult.rows[0];

    // 2. Verify concept belongs to session and is accessible
    const conceptResult = await db.query(
      'SELECT * FROM learning_concepts WHERE id = $1 AND session_id = $2',
      [conceptId, sessionId]
    );
    if (conceptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept not found.' },
      });
    }
    const concept = conceptResult.rows[0];

    if (concept.status === 'locked') {
      return res.status(403).json({
        success: false,
        error: { code: 'CONCEPT_LOCKED', message: 'Cannot ask doubts about a locked concept.' },
      });
    }

    // 3. Get answer (NEVER modifies learning state)
    let answer;

    if (isPrebuiltTopic(session.topic)) {
      // Try keyword-based prebuilt answer first
      const prebuiltAnswer = evaluatePrebuiltDoubt(session.topic, question);
      if (prebuiltAnswer) {
        answer = prebuiltAnswer;
      } else if (aiAvailable) {
        // Fall back to AI
        answer = await answerWithAI(concept.content, concept.title, session.topic, question);
      } else {
        answer = GENERIC_FALLBACK;
      }
    } else if (aiAvailable) {
      answer = await answerWithAI(concept.content, concept.title, session.topic, question);
    } else {
      answer = GENERIC_FALLBACK;
    }

    // 4. Persist doubt messages (does NOT affect learning state)
    await db.query(
      'INSERT INTO doubt_messages (session_id, concept_id, user_id, role, message) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, conceptId, userId, 'user', question.trim()]
    );
    await db.query(
      'INSERT INTO doubt_messages (session_id, concept_id, user_id, role, message) VALUES ($1, $2, $3, $4, $5)',
      [sessionId, conceptId, userId, 'assistant', answer]
    );

    return res.status(200).json({
      success: true,
      data: {
        answer,
        conceptTitle: concept.title,
        // Confirm learning state is unchanged
        learningStateModified: false,
      },
      answer,
    });
  } catch (err) {
    console.error('[Doubt] askDoubt error:', err.message);

    if (err.message?.includes('AI_')) {
      return res.status(502).json({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: 'Could not process your question right now. Please try again.' },
      });
    }

    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process your doubt.' },
    });
  }
};

/**
 * GET /api/learning/:sessionId/concepts/:conceptId/doubts
 * Returns the doubt conversation history for a specific concept.
 */
const getDoubts = async (req, res) => {
  try {
    const { sessionId, conceptId } = req.params;
    const userId = req.user.id;

    const sessionCheck = await db.query(
      'SELECT id FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    const conceptCheck = await db.query(
      'SELECT id FROM learning_concepts WHERE id = $1 AND session_id = $2',
      [conceptId, sessionId]
    );
    if (conceptCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept not found.' },
      });
    }

    const messages = await db.query(
      `SELECT id, role, message, created_at
       FROM doubt_messages
       WHERE session_id = $1 AND concept_id = $2 AND user_id = $3
       ORDER BY created_at ASC`,
      [sessionId, conceptId, userId]
    );

    return res.status(200).json({
      success: true,
      data: { messages: messages.rows },
    });
  } catch (err) {
    console.error('[Doubt] getDoubts error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve doubt history.' },
    });
  }
};

/**
 * POST /api/learning/tutor
 * Endpoint supporting direct frontend tutor client integration (tutorClient.js).
 * Accepts { question, context: { title, topic, content } }
 */
const handleTutorQuestion = async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question || !question.trim()) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Question is required.' },
      });
    }

    const title = context.title || context.conceptTitle || 'General Concept';
    const topic = context.topic || 'Computer Science';
    const content = context.content || '';

    let answer;
    const prebuiltAnswer = evaluatePrebuiltDoubt(topic, question);
    if (prebuiltAnswer) {
      answer = prebuiltAnswer;
    } else if (aiAvailable) {
      answer = await answerWithAI(content, title, topic, question);
    } else {
      answer = GENERIC_FALLBACK;
    }

    return res.status(200).json({
      success: true,
      answer,
      data: { answer },
    });
  } catch (err) {
    console.error('[Tutor] handleTutorQuestion error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process question.' },
    });
  }
};

module.exports = { askDoubt, getDoubts, handleTutorQuestion };
