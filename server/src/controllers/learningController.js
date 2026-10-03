/**
 * Learning Controller
 * Handles all learning session endpoints:
 * - POST /api/learning/start
 * - GET  /api/learning
 * - GET  /api/learning/:sessionId
 * - GET  /api/learning/:sessionId/current
 * - GET  /api/learning/:sessionId/quiz
 * - POST /api/learning/:sessionId/quiz
 * - POST /api/learning/:sessionId/quiz/submit
 * - GET  /api/learning/:sessionId/assignment
 * - POST /api/learning/:sessionId/assignment
 * - POST /api/learning/:sessionId/assignment/submit
 */
const db = require('../config/db');
const {
  createLearningSession,
  getSessionWithConcepts,
  isPrebuiltTopic,
} = require('../services/learningService');
const {
  binarySearchData,
  evaluateAssignment,
} = require('../data/prebuiltBinarySearch');
const {
  generateQuiz,
  generateAssignment,
  isConfigured: aiAvailable,
} = require('../services/aiService');

// ─── Session Management ──────────────────────────────────────────────────────

/**
 * POST /api/learning/start
 * Creates a new learning session for a given topic.
 */
const startLearning = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.id;

    if (!topic || !topic.trim()) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Topic is required.' },
      });
    }

    if (topic.trim().length > 500) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Topic is too long (max 500 characters).' },
      });
    }

    const result = await createLearningSession(userId, topic.trim());

    return res.status(201).json({
      success: true,
      data: {
        session: result.session,
        concepts: result.concepts.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          orderIndex: c.order_index,
        })),
        currentConcept: result.currentConcept
          ? {
              id: result.currentConcept.id,
              title: result.currentConcept.title,
              content: result.currentConcept.content,
              examples: result.currentConcept.examples,
              keyTakeaways: result.currentConcept.key_takeaways,
              orderIndex: result.currentConcept.order_index,
              status: result.currentConcept.status,
              checkpoints: result.currentConcept.checkpoints || [],
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[Learning] startLearning error:', err.message);

    if (err.message.includes('AI_NOT_CONFIGURED')) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'AI service is not configured. Only prebuilt topics (like "Binary Search") are available without an API key.',
        },
      });
    }

    if (err.message.includes('AI_')) {
      return res.status(502).json({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: 'Failed to generate learning path. Please try again.' },
      });
    }

    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create learning session.' },
    });
  }
};

/**
 * GET /api/learning
 * Returns all sessions for the authenticated user.
 */
const getUserSessions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, topic, status, progress_percentage, current_concept_id, created_at, updated_at
       FROM learning_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, data: { sessions: result.rows } });
  } catch (err) {
    console.error('[Learning] getUserSessions error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve sessions.' },
    });
  }
};

/**
 * GET /api/learning/:sessionId
 * Returns a session with all its concepts.
 */
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await getSessionWithConcepts(parseInt(sessionId, 10), req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: result.session,
        concepts: result.concepts.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          orderIndex: c.order_index,
          score: c.score,
          masteryLevel: c.mastery_level,
          completedAt: c.completed_at,
        })),
        currentConcept: result.currentConcept
          ? {
              id: result.currentConcept.id,
              title: result.currentConcept.title,
              content: result.currentConcept.content,
              examples: result.currentConcept.examples,
              keyTakeaways: result.currentConcept.key_takeaways,
              orderIndex: result.currentConcept.order_index,
              status: result.currentConcept.status,
              checkpoints: result.currentConcept.checkpoints || [],
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[Learning] getSession error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve session.' },
    });
  }
};

/**
 * GET /api/learning/:sessionId/current
 * Returns the current (active) concept for the session.
 */
const getCurrentConcept = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify ownership
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

    // Get the active concept with its checkpoints
    const conceptResult = await db.query(
      `SELECT lc.*,
        (SELECT json_agg(cp ORDER BY cp.order_index)
         FROM checkpoints cp
         WHERE cp.learning_concept_id = lc.id) AS checkpoints
       FROM learning_concepts lc
       WHERE lc.session_id = $1 AND lc.status = 'active'`,
      [sessionId]
    );

    if (conceptResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { currentConcept: null, message: 'Session completed. No active concept.' },
      });
    }

    const concept = conceptResult.rows[0];
    return res.status(200).json({
      success: true,
      data: {
        currentConcept: {
          id: concept.id,
          title: concept.title,
          content: concept.content,
          examples: concept.examples,
          keyTakeaways: concept.key_takeaways,
          orderIndex: concept.order_index,
          status: concept.status,
          checkpoints: concept.checkpoints || [],
        },
      },
    });
  } catch (err) {
    console.error('[Learning] getCurrentConcept error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve current concept.' },
    });
  }
};

/**
 * GET /api/learning/:sessionId/concepts/:conceptId
 * Returns a specific concept with checkpoints.
 */
const getConcept = async (req, res) => {
  try {
    const { sessionId, conceptId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const sessionResult = await db.query(
      'SELECT id FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    const conceptResult = await db.query(
      `SELECT lc.*,
        (SELECT json_agg(cp ORDER BY cp.order_index)
         FROM checkpoints cp
         WHERE cp.learning_concept_id = lc.id) AS checkpoints
       FROM learning_concepts lc
       WHERE lc.id = $1 AND lc.session_id = $2`,
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
        error: { code: 'CONCEPT_LOCKED', message: 'This concept is locked. Complete preceding concepts first.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        concept: {
          id: concept.id,
          title: concept.title,
          content: concept.content,
          examples: concept.examples,
          keyTakeaways: concept.key_takeaways,
          orderIndex: concept.order_index,
          status: concept.status,
          score: concept.score,
          masteryLevel: concept.mastery_level,
          completedAt: concept.completed_at,
          checkpoints: concept.checkpoints || [],
        },
      },
    });
  } catch (err) {
    console.error('[Learning] getConcept error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve concept.' },
    });
  }
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/learning/:sessionId/quiz
 * Generates (or retrieves existing) quiz for the session.
 */
const createQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

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

    // Return existing quiz if already generated
    const existingQuiz = await db.query('SELECT * FROM quizzes WHERE session_id = $1', [sessionId]);
    if (existingQuiz.rows.length > 0) {
      return res.status(200).json({
        success: true,
        data: {
          quiz: { id: existingQuiz.rows[0].id, questions: existingQuiz.rows[0].questions },
          questions: existingQuiz.rows[0].questions,
        },
      });
    }

    let questions;
    if (isPrebuiltTopic(session.topic)) {
      questions = binarySearchData.quiz.questions;
    } else {
      if (!aiAvailable) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available.' },
        });
      }
      const conceptsResult = await db.query(
        'SELECT title, content FROM learning_concepts WHERE session_id = $1 ORDER BY order_index',
        [sessionId]
      );
      const summary = conceptsResult.rows.map((c) => `${c.title}: ${c.content}`).join('\n\n');
      questions = await generateQuiz(session.topic, summary);
    }

    const quizResult = await db.query(
      'INSERT INTO quizzes (session_id, questions) VALUES ($1, $2) RETURNING *',
      [sessionId, JSON.stringify(questions)]
    );

    return res.status(201).json({
      success: true,
      data: {
        quiz: { id: quizResult.rows[0].id, questions },
        questions,
      },
    });
  } catch (err) {
    console.error('[Learning] createQuiz error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate quiz.' },
    });
  }
};

/**
 * GET /api/learning/:sessionId/quiz
 * Returns existing quiz if available.
 */
const getQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const sessionResult = await db.query(
      'SELECT id FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    const quizResult = await db.query('SELECT * FROM quizzes WHERE session_id = $1', [sessionId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not generated yet. POST to this endpoint first.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quizResult.rows[0].id,
          questions: quizResult.rows[0].questions,
          score: quizResult.rows[0].score,
          completedAt: quizResult.rows[0].completed_at,
        },
      },
    });
  } catch (err) {
    console.error('[Learning] getQuiz error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve quiz.' },
    });
  }
};

/**
 * POST /api/learning/:sessionId/quiz/submit
 * Grades a quiz submission.
 */
const submitQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body; // [{ questionIndex, selectedOptionIndex }]
    const userId = req.user.id;

    const sessionResult = await db.query(
      'SELECT id FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    const quizResult = await db.query('SELECT * FROM quizzes WHERE session_id = $1', [sessionId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found.' },
      });
    }

    const questions = quizResult.rows[0].questions;
    if (!Array.isArray(answers)) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'answers must be an array.' },
      });
    }

    // Grade each answer
    let correct = 0;
    const gradedAnswers = questions.map((q, i) => {
      const submitted = answers.find((a) => a.questionIndex === i);
      const isCorrect = submitted !== undefined && submitted.selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) correct++;
      return {
        questionIndex: i,
        question: q.question,
        selectedOptionIndex: submitted?.selectedOptionIndex ?? null,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correct / questions.length) * 100);
    const now = new Date().toISOString();

    await db.query(
      'UPDATE quizzes SET result = $1, score = $2, completed_at = $3 WHERE session_id = $4',
      [JSON.stringify(gradedAnswers), score, now, sessionId]
    );

    return res.status(200).json({
      success: true,
      data: {
        score,
        correct,
        total: questions.length,
        answers: gradedAnswers,
        feedback: score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good effort. Review the misses.' : 'Keep practising!',
      },
    });
  } catch (err) {
    console.error('[Learning] submitQuiz error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to submit quiz.' },
    });
  }
};

// ─── Assignment ───────────────────────────────────────────────────────────────

/**
 * POST /api/learning/:sessionId/assignment
 * Generates (or retrieves existing) assignment for the session.
 */
const createAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

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

    const existing = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        data: { assignment: existing.rows[0].assignment_data },
      });
    }

    let assignmentData;
    if (isPrebuiltTopic(session.topic)) {
      assignmentData = binarySearchData.assignment;
    } else {
      if (!aiAvailable) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available.' },
        });
      }
      const conceptsResult = await db.query(
        'SELECT title, content FROM learning_concepts WHERE session_id = $1 ORDER BY order_index',
        [sessionId]
      );
      const summary = conceptsResult.rows.map((c) => `${c.title}: ${c.content}`).join('\n\n');
      assignmentData = await generateAssignment(session.topic, summary);
    }

    await db.query(
      'INSERT INTO assignments (session_id, assignment_data) VALUES ($1, $2)',
      [sessionId, JSON.stringify(assignmentData)]
    );

    return res.status(201).json({
      success: true,
      data: { assignment: assignmentData },
    });
  } catch (err) {
    console.error('[Learning] createAssignment error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate assignment.' },
    });
  }
};

/**
 * GET /api/learning/:sessionId/assignment
 */
const getAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const sessionResult = await db.query(
      'SELECT id FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }

    const assignmentResult = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Assignment not generated yet. POST to this endpoint first.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        assignment: {
          ...assignmentResult.rows[0].assignment_data,
          score: assignmentResult.rows[0].score,
          completedAt: assignmentResult.rows[0].completed_at,
          result: assignmentResult.rows[0].result,
        },
      },
    });
  } catch (err) {
    console.error('[Learning] getAssignment error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve assignment.' },
    });
  }
};

/**
 * POST /api/learning/:sessionId/assignment/submit
 * Accepts and evaluates an assignment submission.
 */
const submitAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const rawSubmission = req.body.submission || req.body.code || req.body.solution || req.body.answer;
    const submission = typeof rawSubmission === 'string' ? rawSubmission : JSON.stringify(rawSubmission || '');

    if (!submission || !submission.trim()) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Submission is required.' },
      });
    }

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

    let evalResult;
    if (isPrebuiltTopic(session.topic)) {
      evalResult = evaluateAssignment(submission);
    } else {
      // For AI topics: basic evaluation
      evalResult = {
        score: submission.trim().length > 200 ? 80 : 50,
        feedback: submission.trim().length > 200
          ? 'Good detailed submission! Your work has been recorded.'
          : 'Submission is brief. Elaborate on each task for a higher score.',
      };
    }

    const now = new Date().toISOString();
    await db.query(
      'UPDATE assignments SET result = $1, score = $2, completed_at = $3 WHERE session_id = $4',
      [JSON.stringify({ submission, ...evalResult }), evalResult.score, now, sessionId]
    );

    return res.status(200).json({
      success: true,
      data: evalResult,
    });
  } catch (err) {
    console.error('[Learning] submitAssignment error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to submit assignment.' },
    });
  }
};

module.exports = {
  startLearning,
  getUserSessions,
  getSession,
  getCurrentConcept,
  getConcept,
  createQuiz,
  getQuiz,
  submitQuiz,
  createAssignment,
  getAssignment,
  submitAssignment,
};
