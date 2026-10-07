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
const {
  recalculateSessionMastery,
  getSessionMasterySnapshot,
  getWeakConcepts,
  getStrongConcepts,
} = require('../services/masteryService');

/**
 * POST /api/learning/start
 * Creates a new learning session for a given topic, or resumes an active session if resumeIfExists is true.
 */
const startLearning = async (req, res) => {
  try {
    const { topic, resumeIfExists } = req.body;
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

    const cleanTopic = topic.trim();

    // If requested, check for an existing active session for this topic to avoid duplicate active sessions
    if (resumeIfExists) {
      const isBS = isPrebuiltTopic(cleanTopic);
      const existingQuery = isBS
        ? `SELECT id FROM learning_sessions 
           WHERE user_id = $1 AND status = 'active' AND (
             LOWER(topic) LIKE '%binary search%' OR LOWER(topic) LIKE '%binary-search%' OR LOWER(topic) LIKE '%binarysearch%'
           )
           ORDER BY updated_at DESC LIMIT 1`
        : `SELECT id FROM learning_sessions 
           WHERE user_id = $1 AND status = 'active' AND LOWER(TRIM(topic)) = LOWER(TRIM($2))
           ORDER BY updated_at DESC LIMIT 1`;
      
      const existingParams = isBS ? [userId] : [userId, cleanTopic];
      const existingRes = await db.query(existingQuery, existingParams);

      if (existingRes.rows.length > 0) {
        const existingSessionId = existingRes.rows[0].id;
        const result = await getSessionWithConcepts(existingSessionId, userId);
        if (result) {
          return res.status(200).json({
            success: true,
            resumed: true,
            data: {
              session: result.session,
              concepts: result.concepts.map((c) => ({
                id: c.id,
                title: c.title,
                content: c.content,
                examples: c.examples,
                key_takeaways: c.key_takeaways,
                keyTakeaways: c.key_takeaways,
                status: c.status,
                order_index: c.order_index,
                orderIndex: c.order_index,
                score: c.score || null,
                masteryLevel: c.mastery_level || null,
                checkpoints: c.checkpoints || [],
              })),
              currentConcept: result.currentConcept
                ? {
                    id: result.currentConcept.id,
                    title: result.currentConcept.title,
                    content: result.currentConcept.content,
                    examples: result.currentConcept.examples,
                    key_takeaways: result.currentConcept.key_takeaways,
                    keyTakeaways: result.currentConcept.key_takeaways,
                    order_index: result.currentConcept.order_index,
                    orderIndex: result.currentConcept.order_index,
                    status: result.currentConcept.status,
                    checkpoints: result.currentConcept.checkpoints || [],
                  }
                : null,
            },
          });
        }
      }
    }

    const result = await createLearningSession(userId, cleanTopic);

    return res.status(201).json({
      success: true,
      resumed: false,
      data: {
        session: result.session,
        concepts: result.concepts.map((c) => ({
          id: c.id,
          title: c.title,
          content: c.content,
          examples: c.examples,
          key_takeaways: c.key_takeaways,
          keyTakeaways: c.key_takeaways,
          status: c.status,
          order_index: c.order_index,
          orderIndex: c.order_index,
          score: c.score || null,
          masteryLevel: c.mastery_level || null,
          checkpoints: c.checkpoints || [],
        })),
        currentConcept: result.currentConcept
          ? {
              id: result.currentConcept.id,
              title: result.currentConcept.title,
              content: result.currentConcept.content,
              examples: result.currentConcept.examples,
              key_takeaways: result.currentConcept.key_takeaways,
              keyTakeaways: result.currentConcept.key_takeaways,
              order_index: result.currentConcept.order_index,
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
 * GET /api/learning/preview?topic=...
 * Returns structured curriculum preview from database/prebuilt data.
 * Checks if topic is supported (currently Binary Search).
 */
const getLearningPreview = async (req, res) => {
  try {
    const topic = req.query.topic || req.params.topic || '';
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Topic is required.' },
      });
    }

    const cleanTopic = topic.trim();
    const isBS = isPrebuiltTopic(cleanTopic);

    if (isBS) {
      return res.status(200).json({
        success: true,
        data: {
          isSupported: true,
          topic: binarySearchData.topic,
          description: 'Master Binary Search from fundamentals to implementation, edge cases, and algorithmic complexity.',
          totalConcepts: binarySearchData.concepts.length,
          features: [
            `${binarySearchData.concepts.length} Interactive Concepts`,
            'Checkpoint Knowledge Checks',
            'Progressive Difficulty Scaling',
            'PostgreSQL Cloud Session Sync',
          ],
          concepts: binarySearchData.concepts.map((c, i) => ({
            orderIndex: i + 1,
            title: c.title,
            keyTakeaways: c.keyTakeaways || '',
          })),
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        isSupported: false,
        topic: cleanTopic,
        message: 'More learning paths are coming soon. Binary Search is currently available with full interactive checkpoints.',
        supportedTopics: ['Binary Search'],
      },
    });
  } catch (err) {
    console.error('[Learning] getLearningPreview error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve learning preview.' },
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
          content: c.content,
          examples: c.examples,
          keyTakeaways: c.key_takeaways,
          status: c.status,
          orderIndex: c.order_index,
          score: c.score,
          masteryLevel: c.mastery_level,
          completedAt: c.completed_at,
          checkpoints: c.checkpoints || [],
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
 * Maps questions to session concepts and incorporates weak areas.
 */
const createQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const regenerate = req.query.regenerate === 'true';

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

    // Fetch all concepts for this session
    const conceptsResult = await db.query(
      'SELECT id, title, order_index, status, score, mastery_level FROM learning_concepts WHERE session_id = $1 ORDER BY order_index ASC',
      [sessionId]
    );
    const concepts = conceptsResult.rows;

    // Return existing quiz unless regenerate is requested
    if (!regenerate) {
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
    }

    const weakConcepts = await getWeakConcepts(sessionId, userId);

    let questions;
    if (isPrebuiltTopic(session.topic)) {
      // Map concept IDs to prebuilt questions based on conceptIndex
      questions = binarySearchData.quiz.questions.map((q) => {
        const matchingConcept = concepts.find((c) => c.order_index === q.conceptIndex) || concepts[0];
        return {
          ...q,
          conceptId: matchingConcept?.id || q.conceptIndex,
          conceptTitle: matchingConcept?.title || q.conceptTitle,
        };
      });
    } else {
      if (!aiAvailable) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available.' },
        });
      }
      questions = await generateQuiz(session.topic, concepts, weakConcepts);
    }

    // Upsert quiz
    let quizId;
    const existingCheck = await db.query('SELECT id FROM quizzes WHERE session_id = $1', [sessionId]);
    if (existingCheck.rows.length > 0) {
      const updateResult = await db.query(
        'UPDATE quizzes SET questions = $1, result = NULL, score = NULL, completed_at = NULL WHERE session_id = $2 RETURNING id',
        [JSON.stringify(questions), sessionId]
      );
      quizId = updateResult.rows[0].id;
    } else {
      const insertResult = await db.query(
        'INSERT INTO quizzes (session_id, questions) VALUES ($1, $2) RETURNING id',
        [sessionId, JSON.stringify(questions)]
      );
      quizId = insertResult.rows[0].id;
    }

    return res.status(201).json({
      success: true,
      data: {
        quiz: { id: quizId, questions },
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
 * Evaluates quiz submission, stores attempts & answers in PostgreSQL, updates concept mastery.
 */
const submitQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body; // [{ questionIndex, questionId, selectedOptionIndex, selectedAnswer }]
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

    const quizResult = await db.query('SELECT * FROM quizzes WHERE session_id = $1', [sessionId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found.' },
      });
    }
    const quiz = quizResult.rows[0];
    const questions = quiz.questions;

    if (!Array.isArray(answers)) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'answers must be an array.' },
      });
    }

    // Load concepts for this session to associate answers
    const conceptsResult = await db.query(
      'SELECT id, title, order_index FROM learning_concepts WHERE session_id = $1',
      [sessionId]
    );
    const concepts = conceptsResult.rows;

    // Grade each question
    let correct = 0;
    const gradedAnswers = questions.map((q, i) => {
      const submitted = answers.find(
        (a) => a.questionIndex === i || (a.questionId && a.questionId === q.id)
      );

      // Determine conceptId
      let conceptId = q.conceptId;
      if (!conceptId && q.conceptIndex) {
        const matched = concepts.find((c) => c.order_index === q.conceptIndex);
        conceptId = matched?.id;
      }

      // Check correctness
      let isCorrect = false;
      const correctIdx = q.correctOptionIndex ?? (q.correctAnswer === 'B' ? 1 : q.correctAnswer === 'C' ? 2 : q.correctAnswer === 'D' ? 3 : 0);
      const correctVal = q.correctAnswer || String.fromCharCode(65 + correctIdx);

      if (submitted) {
        if (submitted.selectedOptionIndex !== undefined && submitted.selectedOptionIndex !== null) {
          isCorrect = submitted.selectedOptionIndex === correctIdx;
        } else if (submitted.selectedAnswer !== undefined && submitted.selectedAnswer !== null) {
          isCorrect =
            String(submitted.selectedAnswer).trim().toUpperCase() === String(correctVal).trim().toUpperCase();
        } else if (submitted.picked !== undefined && submitted.picked !== null) {
          isCorrect = submitted.picked === correctIdx;
        }
      }

      if (isCorrect) correct++;

      const selectedAnswerText =
        submitted?.selectedAnswer ||
        (submitted?.selectedOptionIndex !== undefined && q.options
          ? typeof q.options[submitted.selectedOptionIndex] === 'object'
            ? q.options[submitted.selectedOptionIndex]?.label
            : q.options[submitted.selectedOptionIndex]
          : null);

      return {
        questionIndex: i,
        questionId: q.id || `q_${i + 1}`,
        conceptId: conceptId || null,
        conceptTitle: q.conceptTitle || `Concept ${conceptId || i + 1}`,
        question: q.question,
        selectedOptionIndex: submitted?.selectedOptionIndex ?? submitted?.picked ?? null,
        selectedAnswer: selectedAnswerText || submitted?.selectedAnswer || null,
        correctOptionIndex: correctIdx,
        correctAnswer: correctVal,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const now = new Date().toISOString();

    // 1. Insert into quiz_attempts
    const attemptInsert = await db.query(
      `INSERT INTO quiz_attempts 
        (user_id, session_id, quiz_id, score, total_questions, correct_answers, percentage, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [userId, sessionId, quiz.id, percentage, totalQuestions, correct, percentage, now]
    );
    const attemptId = attemptInsert.rows[0].id;

    // 2. Insert individual question answers into quiz_attempt_answers
    for (const ga of gradedAnswers) {
      await db.query(
        `INSERT INTO quiz_attempt_answers
          (attempt_id, question_id, concept_id, selected_answer, correct_answer, is_correct)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          attemptId,
          String(ga.questionId),
          ga.conceptId || null,
          String(ga.selectedAnswer || ''),
          String(ga.correctAnswer || ''),
          ga.isCorrect,
        ]
      );
    }

    // 3. Update quizzes table
    await db.query(
      'UPDATE quizzes SET result = $1, score = $2, completed_at = $3 WHERE session_id = $4',
      [JSON.stringify(gradedAnswers), percentage, now, sessionId]
    );

    // 4. Recalculate session concept mastery and update PostgreSQL records
    await recalculateSessionMastery(sessionId, userId);

    // 5. Aggregate concept performance breakdown for the results screen
    const conceptBreakdownMap = {};
    gradedAnswers.forEach((ga) => {
      const key = ga.conceptTitle || `Concept ${ga.conceptId || 'General'}`;
      if (!conceptBreakdownMap[key]) {
        conceptBreakdownMap[key] = {
          title: key,
          conceptId: ga.conceptId,
          correct: 0,
          total: 0,
        };
      }
      conceptBreakdownMap[key].total++;
      if (ga.isCorrect) conceptBreakdownMap[key].correct++;
    });

    const conceptBreakdown = Object.values(conceptBreakdownMap).map((cb) => {
      const pct = Math.round((cb.correct / cb.total) * 100);
      return {
        title: cb.title,
        conceptId: cb.conceptId,
        score: pct,
        status: pct >= 80 ? 'Mastered' : pct >= 60 ? 'Developing' : 'Needs Practice',
      };
    });

    // 6. Identify weak concepts from this quiz
    const weakConceptsList = conceptBreakdown.filter((cb) => cb.score < 75);
    const masteryLabel =
      percentage >= 80 ? 'Strong Understanding' : percentage >= 60 ? 'Good Understanding' : 'Needs Practice';

    const feedback =
      percentage >= 80
        ? 'Outstanding mastery of this topic! Keep up the great work.'
        : percentage >= 60
        ? 'Good progress. Focus on your weaker concepts in the personalized assignment.'
        : 'Needs more practice. Review the concept explanations and complete the targeted assignment.';

    return res.status(200).json({
      success: true,
      data: {
        attemptId,
        score: percentage,
        percentage,
        correct,
        total: totalQuestions,
        masteryLabel,
        feedback,
        answers: gradedAnswers,
        conceptBreakdown,
        weakConcepts: weakConceptsList,
        nextStep: {
          type: 'assignment',
          message:
            weakConceptsList.length > 0
              ? `Strengthen your understanding of ${weakConceptsList[0].title} with your personalized assignment.`
              : 'Consolidate your learning by completing the practice assignment.',
          sessionId,
        },
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

// ─── Assignment Management ───────────────────────────────────────────────────

/**
 * Internal helper to generate and persist personalized assignment in PostgreSQL.
 */
async function generateAndSaveAssignment(sessionId, userId, sessionTopic) {
  const sessionResult = await db.query(
    'SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId]
  );
  if (sessionResult.rows.length === 0) return null;
  const session = sessionResult.rows[0];

  const conceptsResult = await db.query(
    'SELECT id, title, content, score, status, mastery_level, order_index FROM learning_concepts WHERE session_id = $1 ORDER BY order_index',
    [sessionId]
  );
  const concepts = conceptsResult.rows;

  // Calculate mastery snapshot
  const snapshot = await getSessionMasterySnapshot(sessionId, userId);
  const weakConcepts = await getWeakConcepts(sessionId, userId);

  let assignmentData;
  if (isPrebuiltTopic(session.topic || sessionTopic)) {
    const { generatePrebuiltBinarySearchAssignment } = require('../data/prebuiltBinarySearch');
    assignmentData = generatePrebuiltBinarySearchAssignment(concepts, weakConcepts, snapshot);
  } else {
    if (aiAvailable) {
      try {
        assignmentData = await generateAssignment(session.topic, concepts, weakConcepts, snapshot);
      } catch (aiErr) {
        console.warn('[Assignment] AI generation failed, using fallback:', aiErr.message);
        const { generatePrebuiltBinarySearchAssignment } = require('../data/prebuiltBinarySearch');
        assignmentData = generatePrebuiltBinarySearchAssignment(concepts, weakConcepts, snapshot);
      }
    } else {
      const { generatePrebuiltBinarySearchAssignment } = require('../data/prebuiltBinarySearch');
      assignmentData = generatePrebuiltBinarySearchAssignment(concepts, weakConcepts, snapshot);
    }
  }

  // Upsert into assignments table
  const existingCheck = await db.query('SELECT id, status FROM assignments WHERE session_id = $1', [sessionId]);
  let assignmentId;
  if (existingCheck.rows.length > 0) {
    assignmentId = existingCheck.rows[0].id;
    await db.query(
      `UPDATE assignments 
       SET assignment_data = $1, status = 'ready', result = NULL, score = NULL, completed_at = NULL, updated_at = NOW() 
       WHERE session_id = $2`,
      [JSON.stringify(assignmentData), sessionId]
    );
  } else {
    const insertRes = await db.query(
      `INSERT INTO assignments (session_id, assignment_data, status) 
       VALUES ($1, $2, 'ready') 
       RETURNING id`,
      [sessionId, JSON.stringify(assignmentData)]
    );
    assignmentId = insertRes.rows[0].id;
  }

  return { id: assignmentId, assignment: assignmentData, sessionId };
}

/**
 * POST /api/learning/:sessionId/assignment
 * Generates (or retrieves existing) personalized assignment tailored to weak concepts.
 */
const createAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const regenerate = req.query.regenerate === 'true';

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

    // Return existing assignment unless regenerate is requested
    if (!regenerate) {
      const existing = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
      if (existing.rows.length > 0) {
        const rawData = existing.rows[0].assignment_data;
        const assignmentData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        return res.status(200).json({
          success: true,
          data: {
            assignment: {
              ...assignmentData,
              id: existing.rows[0].id,
              status: existing.rows[0].status,
              score: existing.rows[0].score,
              completedAt: existing.rows[0].completed_at,
            },
          },
        });
      }
    }

    const generated = await generateAndSaveAssignment(sessionId, userId, session.topic);
    if (!generated) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to generate assignment.' },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        assignment: {
          ...generated.assignment,
          id: generated.id,
          status: 'ready',
        },
      },
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
 * Returns assignment data, attempt progress, and previous answers if available.
 */
const getAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const sessionResult = await db.query(
      'SELECT id, topic, status, progress_percentage FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found.' },
      });
    }
    const session = sessionResult.rows[0];

    let assignmentRow = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (assignmentRow.rows.length === 0) {
      // Auto-generate if session has concepts or is completed
      const generated = await generateAndSaveAssignment(sessionId, userId, session.topic);
      if (!generated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Assignment not generated yet.' },
        });
      }
      assignmentRow = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    }

    const assignment = assignmentRow.rows[0];
    const rawData = assignment.assignment_data;
    const assignmentData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    // Fetch latest attempt and attempt answers
    const attemptResult = await db.query(
      `SELECT * FROM assignment_attempts 
       WHERE assignment_id = $1 AND user_id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [assignment.id, userId]
    );

    let currentAttempt = null;
    if (attemptResult.rows.length > 0) {
      const att = attemptResult.rows[0];
      const answersResult = await db.query(
        `SELECT question_id, concept_id, selected_answer, correct_answer, is_correct, explanation, feedback 
         FROM assignment_attempt_answers 
         WHERE attempt_id = $1 ORDER BY created_at ASC`,
        [att.id]
      );

      const answersMap = {};
      answersResult.rows.forEach((ans) => {
        answersMap[ans.question_id] = {
          selectedAnswer: ans.selected_answer,
          correctAnswer: ans.correct_answer,
          isCorrect: ans.is_correct,
          explanation: ans.explanation,
          feedback: ans.feedback,
          conceptId: ans.concept_id,
        };
      });

      currentAttempt = {
        id: att.id,
        status: att.status,
        score: att.score,
        percentage: att.percentage,
        totalQuestions: att.total_questions,
        correctAnswers: att.correct_answers,
        completedAt: att.completed_at,
        answers: answersMap,
        answeredCount: Object.keys(answersMap).length,
      };
    }

    const snapshot = await getSessionMasterySnapshot(sessionId, userId);

    return res.status(200).json({
      success: true,
      data: {
        assignment: {
          ...assignmentData,
          id: assignment.id,
          sessionId: parseInt(sessionId, 10),
          status: assignment.status,
          score: assignment.score,
          completedAt: assignment.completed_at,
          result: assignment.result,
          currentAttempt,
          snapshot,
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
 * POST /api/learning/:sessionId/assignment/attempt
 * Starts or retrieves an active assignment attempt.
 */
const startOrResumeAssignmentAttempt = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    let assignmentRow = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (assignmentRow.rows.length === 0) {
      const generated = await generateAndSaveAssignment(sessionId, userId);
      if (!generated) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found.' } });
      }
      assignmentRow = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    }

    const assignment = assignmentRow.rows[0];
    const rawData = assignment.assignment_data;
    const assignmentData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const totalQuestions = assignmentData.questions?.length || 8;

    // Check for in-progress attempt
    const existingAttempt = await db.query(
      `SELECT * FROM assignment_attempts 
       WHERE assignment_id = $1 AND user_id = $2 AND status = 'in_progress' 
       ORDER BY created_at DESC LIMIT 1`,
      [assignment.id, userId]
    );

    let attempt;
    if (existingAttempt.rows.length > 0) {
      attempt = existingAttempt.rows[0];
    } else {
      const newAtt = await db.query(
        `INSERT INTO assignment_attempts (assignment_id, user_id, session_id, total_questions, status)
         VALUES ($1, $2, $3, $4, 'in_progress')
         RETURNING *`,
        [assignment.id, userId, sessionId, totalQuestions]
      );
      attempt = newAtt.rows[0];
    }

    // Load answers
    const answersResult = await db.query(
      `SELECT question_id, concept_id, selected_answer, correct_answer, is_correct, explanation, feedback 
       FROM assignment_attempt_answers 
       WHERE attempt_id = $1`,
      [attempt.id]
    );

    const answersMap = {};
    answersResult.rows.forEach((ans) => {
      answersMap[ans.question_id] = {
        selectedAnswer: ans.selected_answer,
        correctAnswer: ans.correct_answer,
        isCorrect: ans.is_correct,
        explanation: ans.explanation,
        feedback: ans.feedback,
        conceptId: ans.concept_id,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt.id,
        status: attempt.status,
        answeredCount: Object.keys(answersMap).length,
        totalQuestions,
        answers: answersMap,
      },
    });
  } catch (err) {
    console.error('[Learning] startOrResumeAssignmentAttempt error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to start assignment attempt.' },
    });
  }
};

/**
 * POST /api/learning/:sessionId/assignment/answer
 * Evaluates and locks a single question answer in real-time.
 */
const submitAssignmentAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { questionId, selectedAnswer } = req.body;

    if (!questionId || selectedAnswer === undefined || selectedAnswer === null) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'questionId and selectedAnswer are required.' },
      });
    }

    const assignmentRow = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (assignmentRow.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found.' } });
    }
    const assignment = assignmentRow.rows[0];
    const rawData = assignment.assignment_data;
    const assignmentData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    const question = (assignmentData.questions || []).find((q) => q.id === questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Question not found in assignment.' } });
    }

    // Find or create in-progress attempt
    let attemptResult = await db.query(
      `SELECT * FROM assignment_attempts 
       WHERE assignment_id = $1 AND user_id = $2 AND status = 'in_progress' 
       ORDER BY created_at DESC LIMIT 1`,
      [assignment.id, userId]
    );

    let attempt;
    if (attemptResult.rows.length === 0) {
      const newAtt = await db.query(
        `INSERT INTO assignment_attempts (assignment_id, user_id, session_id, total_questions, status)
         VALUES ($1, $2, $3, $4, 'in_progress')
         RETURNING *`,
        [assignment.id, userId, sessionId, assignmentData.questions?.length || 8]
      );
      attempt = newAtt.rows[0];
    } else {
      attempt = attemptResult.rows[0];
    }

    const isCorrect = String(selectedAnswer).trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase();
    const explanation = question.explanation || (isCorrect ? 'Well done!' : `The correct answer is ${question.correctAnswer}.`);
    const feedback = isCorrect ? '✓ Correct' : '✕ Not quite';

    // Check if already answered (locking)
    const existingAns = await db.query(
      'SELECT id FROM assignment_attempt_answers WHERE attempt_id = $1 AND question_id = $2',
      [attempt.id, questionId]
    );

    if (existingAns.rows.length > 0) {
      await db.query(
        `UPDATE assignment_attempt_answers 
         SET selected_answer = $1, correct_answer = $2, is_correct = $3, explanation = $4, feedback = $5
         WHERE id = $6`,
        [selectedAnswer, question.correctAnswer, isCorrect, explanation, feedback, existingAns.rows[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO assignment_attempt_answers 
         (attempt_id, question_id, concept_id, selected_answer, correct_answer, is_correct, explanation, feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [attempt.id, questionId, question.conceptId, selectedAnswer, question.correctAnswer, isCorrect, explanation, feedback]
      );
    }

    // Update assignment status to in_progress
    await db.query("UPDATE assignments SET status = 'in_progress', updated_at = NOW() WHERE id = $1", [assignment.id]);

    return res.status(200).json({
      success: true,
      data: {
        questionId,
        conceptId: question.conceptId,
        conceptTitle: question.conceptTitle,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation,
        feedback,
      },
    });
  } catch (err) {
    console.error('[Learning] submitAssignmentAnswer error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record answer.' },
    });
  }
};

/**
 * POST /api/learning/:sessionId/assignment/submit
 * Finalizes the assignment attempt, recalculates concept mastery, and updates overall mastery.
 */
const submitAssignment = async (req, res) => {
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

    const assignmentResult = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Assignment not found.' },
      });
    }
    const assignment = assignmentResult.rows[0];
    const rawData = assignment.assignment_data;
    const assignmentData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const questions = assignmentData.questions || [];

    // Capture previous snapshot
    const previousSnapshot = await getSessionMasterySnapshot(sessionId, userId);

    // Check if bulk answers or attemptId was sent
    const { answers, attemptId, submission } = req.body;

    let attempt;
    if (attemptId) {
      const attRes = await db.query('SELECT * FROM assignment_attempts WHERE id = $1 AND user_id = $2', [attemptId, userId]);
      if (attRes.rows.length > 0) attempt = attRes.rows[0];
    }

    if (!attempt) {
      const inProg = await db.query(
        `SELECT * FROM assignment_attempts 
         WHERE assignment_id = $1 AND user_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [assignment.id, userId]
      );
      if (inProg.rows.length > 0) {
        attempt = inProg.rows[0];
      } else {
        const newAtt = await db.query(
          `INSERT INTO assignment_attempts (assignment_id, user_id, session_id, total_questions, status)
           VALUES ($1, $2, $3, $4, 'in_progress') RETURNING *`,
          [assignment.id, userId, sessionId, questions.length || 8]
        );
        attempt = newAtt.rows[0];
      }
    }

    // If bulk answers were provided (e.g. from a form submission)
    if (answers && typeof answers === 'object') {
      for (const [qId, selectedAns] of Object.entries(answers)) {
        const q = questions.find((item) => item.id === qId);
        if (q) {
          const isCorrect = String(selectedAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
          const explanation = q.explanation || `Correct answer is ${q.correctAnswer}.`;
          const feedback = isCorrect ? '✓ Correct' : '✕ Not quite';

          const exist = await db.query(
            'SELECT id FROM assignment_attempt_answers WHERE attempt_id = $1 AND question_id = $2',
            [attempt.id, qId]
          );
          if (exist.rows.length > 0) {
            await db.query(
              `UPDATE assignment_attempt_answers 
               SET selected_answer = $1, correct_answer = $2, is_correct = $3, explanation = $4, feedback = $5
               WHERE id = $6`,
              [selectedAns, q.correctAnswer, isCorrect, explanation, feedback, exist.rows[0].id]
            );
          } else {
            await db.query(
              `INSERT INTO assignment_attempt_answers 
               (attempt_id, question_id, concept_id, selected_answer, correct_answer, is_correct, explanation, feedback)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [attempt.id, qId, q.conceptId, selectedAns, q.correctAnswer, isCorrect, explanation, feedback]
            );
          }
        }
      }
    }

    // If legacy text submission
    if (submission && typeof submission === 'string' && questions.length === 0) {
      const evalResult = isPrebuiltTopic(session.topic) ? evaluateAssignment(submission) : { score: 80, feedback: 'Solution verified.' };
      const now = new Date().toISOString();
      await db.query(
        'UPDATE assignments SET result = $1, score = $2, status = $3, completed_at = $4 WHERE session_id = $5',
        [JSON.stringify({ submission, ...evalResult }), evalResult.score, 'completed', now, sessionId]
      );
      await recalculateSessionMastery(sessionId, userId);
      return res.status(200).json({ success: true, data: { ...evalResult, masteryUpdated: true } });
    }

    // Tally answers from DB
    const tallyResult = await db.query(
      `SELECT 
         COUNT(*)::INTEGER AS total_recorded,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER AS correct_count
       FROM assignment_attempt_answers
       WHERE attempt_id = $1`,
      [attempt.id]
    );

    const totalQuestions = questions.length || tallyResult.rows[0].total_recorded || 8;
    const correctAnswers = tallyResult.rows[0].correct_count || 0;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const now = new Date().toISOString();

    // Update attempt
    await db.query(
      `UPDATE assignment_attempts 
       SET score = $1, percentage = $2, correct_answers = $3, total_questions = $4, status = 'completed', completed_at = $5, updated_at = NOW() 
       WHERE id = $6`,
      [percentage, percentage, correctAnswers, totalQuestions, now, attempt.id]
    );

    // Update assignment record
    const resultSummary = {
      score: percentage,
      percentage,
      correctAnswers,
      totalQuestions,
      completedAt: now,
    };

    await db.query(
      `UPDATE assignments 
       SET score = $1, status = 'completed', result = $2, completed_at = $3, updated_at = NOW() 
       WHERE id = $4`,
      [percentage, JSON.stringify(resultSummary), now, assignment.id]
    );

    // Recalculate session concept mastery in PostgreSQL
    await recalculateSessionMastery(sessionId, userId);

    // Compute updated snapshot
    const updatedSnapshot = await getSessionMasterySnapshot(sessionId, userId);

    // Compute concept performance deltas
    const conceptComparison = updatedSnapshot.conceptBreakdown.map((newC) => {
      const oldC = previousSnapshot.conceptBreakdown.find((o) => o.id === newC.id);
      const prevScore = oldC ? oldC.score || 0 : 0;
      const currentScore = newC.score || 0;
      const delta = currentScore - prevScore;
      return {
        conceptId: newC.id,
        title: newC.title,
        previousScore: prevScore,
        currentScore,
        delta,
        improved: delta > 0,
        masteryLevel: newC.masteryLevel,
      };
    });

    const improvedConcepts = conceptComparison.filter((c) => c.delta > 0);
    const weakConcepts = updatedSnapshot.weakConcepts;

    let recommendedNext = 'Review key takeaways and test yourself on advanced variations.';
    if (weakConcepts.length > 0) {
      recommendedNext = `Review ${weakConcepts[0].conceptTitle} to solidify your full mastery.`;
    }

    return res.status(200).json({
      success: true,
      data: {
        score: percentage,
        percentage,
        totalQuestions,
        correctAnswers,
        previousMastery: previousSnapshot.overallMastery,
        newMastery: updatedSnapshot.overallMastery,
        masteryDelta: updatedSnapshot.overallMastery - previousSnapshot.overallMastery,
        conceptBreakdown: conceptComparison,
        improvedConcepts,
        weakConcepts,
        recommendedNext,
        completedAt: now,
      },
    });
  } catch (err) {
    console.error('[Learning] submitAssignment error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to submit assignment.' },
    });
  }
};

/**
 * GET /api/learning/assignments/latest
 * Returns the most recently completed session's assignment.
 */
const getLatestAssignment = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT a.id, a.session_id, a.assignment_data, a.status, a.score, a.completed_at, a.created_at,
              ls.topic, ls.status AS session_status, ls.progress_percentage
       FROM assignments a
       JOIN learning_sessions ls ON a.session_id = ls.id
       WHERE ls.user_id = $1
       ORDER BY a.updated_at DESC, a.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, data: { assignment: null } });
    }

    const row = result.rows[0];
    const rawData = row.assignment_data;
    const assignmentData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    return res.status(200).json({
      success: true,
      data: {
        assignment: {
          ...assignmentData,
          id: row.id,
          sessionId: row.session_id,
          topic: row.topic,
          status: row.status,
          score: row.score,
          completedAt: row.completed_at,
        },
      },
    });
  } catch (err) {
    console.error('[Learning] getLatestAssignment error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve latest assignment.' },
    });
  }
};

/**
 * GET /api/learning/assignments
 * Returns all assignments for the authenticated user across sessions with full metadata.
 */
const getUserAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT a.id, a.session_id, a.assignment_data, a.status, a.result, a.score, a.completed_at, a.created_at, a.updated_at,
              ls.topic, ls.status AS session_status, ls.progress_percentage
       FROM assignments a
       JOIN learning_sessions ls ON a.session_id = ls.id
       WHERE ls.user_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    const mapped = result.rows.map((r) => {
      const data = typeof r.assignment_data === 'string' ? JSON.parse(r.assignment_data) : r.assignment_data;
      return {
        id: r.id,
        sessionId: r.session_id,
        title: data?.title || `Personalized ${r.topic} Practice`,
        topic: r.topic,
        course: r.topic,
        description: data?.description || 'Strengthen your weak areas identified from checkpoints.',
        difficulty: data?.difficulty || 'developing',
        focusConcepts: data?.focusConcepts || [],
        questionsCount: data?.questions?.length || 8,
        status: r.status === 'completed' ? 'Completed' : r.status === 'in_progress' ? 'In Progress' : 'Ready',
        rawStatus: r.status,
        score: r.score,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      };
    });

    return res.status(200).json({
      success: true,
      data: { assignments: mapped },
      assignments: mapped,
    });
  } catch (err) {
    console.error('[Learning] getUserAssignments error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve assignments.' },
    });
  }
};

/**
 * GET /api/learning/quizzes
 * Returns all quizzes for the authenticated user across sessions.
 */
const getUserQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT q.id, q.session_id, q.questions, q.result, q.score, q.completed_at, q.created_at, ls.topic
       FROM quizzes q
       JOIN learning_sessions ls ON q.session_id = ls.id
       WHERE ls.user_id = $1
       ORDER BY q.created_at DESC`,
      [userId]
    );
    return res.status(200).json({
      success: true,
      data: { quizzes: result.rows },
      quizzes: result.rows,
    });
  } catch (err) {
    console.error('[Learning] getUserQuizzes error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve quizzes.' },
    });
  }
};

module.exports = {
  startLearning,
  getLearningPreview,
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
  submitAssignmentAnswer,
  startOrResumeAssignmentAttempt,
  getLatestAssignment,
  getUserAssignments,
  getUserQuizzes,
  generateAndSaveAssignment,
};

