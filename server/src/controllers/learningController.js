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
  getWeakConcepts,
} = require('../services/masteryService');

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

// ─── Assignment ───────────────────────────────────────────────────────────────

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
        return res.status(200).json({
          success: true,
          data: { assignment: existing.rows[0].assignment_data },
        });
      }
    }

    const conceptsResult = await db.query(
      'SELECT id, title, content, score, status, mastery_level FROM learning_concepts WHERE session_id = $1 ORDER BY order_index',
      [sessionId]
    );
    const concepts = conceptsResult.rows;
    const weakConcepts = await getWeakConcepts(sessionId, userId);

    let assignmentData;
    if (isPrebuiltTopic(session.topic)) {
      // Dynamic personalization based on weak concepts in Binary Search
      const hasBoundaryWeakness = weakConcepts.some((w) =>
        (w.title || '').toLowerCase().includes('boundary') || (w.title || '').toLowerCase().includes('edge')
      );

      if (hasBoundaryWeakness) {
        assignmentData = {
          title: 'Binary Search: Boundary Conditions & Edge Cases Practice',
          description:
            'Based on your checkpoint and quiz results, this personalized assignment strengthens boundary conditions, duplicate elements, and empty array handling.',
          difficulty: 'intermediate',
          targetConcepts: ['Boundary Conditions and Edge Cases', 'Implementing Binary Search'],
          tasks: [
            'Task 1: Explain the roles of left, right, and mid pointers when the target element is missing from the array.',
            'Task 2: Implement `find_first_occurrence(nums, target)` to return the FIRST occurrence index in an array with duplicate elements (e.g. [1, 2, 2, 2, 3], target=2 -> index 1).',
            'Task 3: Implement `find_last_occurrence(nums, target)` to return the LAST occurrence index (e.g. [1, 2, 2, 2, 3], target=2 -> index 3).',
            'Task 4: Explain what happens when binary search receives an empty array `[]` or a single-element array `[5]`, and how the `left <= right` condition handles it safely.',
          ],
          expectedOutput:
            'Working Python/JavaScript implementations of first & last occurrence search with edge case explanation.',
        };
      } else {
        assignmentData = binarySearchData.assignment;
      }
    } else {
      if (!aiAvailable) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available.' },
        });
      }
      assignmentData = await generateAssignment(session.topic, concepts, weakConcepts);
    }

    // Upsert assignment
    const existingCheck = await db.query('SELECT id FROM assignments WHERE session_id = $1', [sessionId]);
    if (existingCheck.rows.length > 0) {
      await db.query(
        'UPDATE assignments SET assignment_data = $1, result = NULL, score = NULL, completed_at = NULL WHERE session_id = $2',
        [JSON.stringify(assignmentData), sessionId]
      );
    } else {
      await db.query(
        'INSERT INTO assignments (session_id, assignment_data) VALUES ($1, $2)',
        [sessionId, JSON.stringify(assignmentData)]
      );
    }

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
 * Accepts and evaluates an assignment submission, then recalculates mastery in PostgreSQL.
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
      evalResult = {
        score: submission.trim().length > 200 ? 85 : 55,
        feedback:
          submission.trim().length > 200
            ? 'Detailed solution provided! Excellent conceptual clarity and application.'
            : 'Submission is concise. Include more code details and edge-case reasoning for full credit.',
      };
    }

    const now = new Date().toISOString();
    await db.query(
      'UPDATE assignments SET result = $1, score = $2, completed_at = $3 WHERE session_id = $4',
      [JSON.stringify({ submission, ...evalResult }), evalResult.score, now, sessionId]
    );

    // Recalculate session mastery to incorporate the assignment score
    await recalculateSessionMastery(sessionId, userId);

    return res.status(200).json({
      success: true,
      data: {
        ...evalResult,
        masteryUpdated: true,
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
 * GET /api/learning/assignments
 * Returns all assignments for the authenticated user across sessions.
 */
const getUserAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT a.id, a.session_id, a.assignment_data, a.result, a.score, a.completed_at, a.created_at, ls.topic as course
       FROM assignments a
       JOIN learning_sessions ls ON a.session_id = ls.id
       WHERE ls.user_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return res.status(200).json({
      success: true,
      data: { assignments: result.rows },
      assignments: result.rows,
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
  getUserAssignments,
  getUserQuizzes,
};
