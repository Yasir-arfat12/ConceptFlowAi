/**
 * Checkpoint Controller
 * Handles checkpoint answer submission, evaluation, scoring, and concept progression.
 *
 * Business Rules:
 * - Backend evaluates the answer (never the frontend)
 * - Backend stores the result
 * - Backend decides if concept is complete
 * - Backend unlocks the next concept
 * - Concept completion requires passing score (configurable)
 */
const db = require('../config/db');
const { completeConcept } = require('../services/learningService');
const { evaluateCheckpoint: evaluatePrebuilt } = require('../data/prebuiltBinarySearch');
const { evaluateCheckpoint: evaluateWithAI, scoringService, isConfigured: aiAvailable } = require('../services/aiService');
const { recalculateSessionMastery, getSessionMasterySnapshot } = require('../services/masteryService');
const { isPrebuiltTopic } = require('../data/prebuiltTopics');

const PASS_SCORE = parseInt(process.env.CHECKPOINT_PASS_SCORE || '60', 10);

function isPrebuiltSession(topic) {
  return isPrebuiltTopic(topic);
}

/**
 * POST /api/checkpoints/:checkpointId/answer
 * Evaluates a student's answer, stores it, and manages concept state.
 */
const submitAnswer = async (req, res) => {
  const { checkpointId } = req.params;
  const { answer } = req.body;
  const userId = req.user.id;

  if (!answer || !answer.trim()) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Answer is required.' },
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Load checkpoint and verify ownership chain
    const checkpointResult = await client.query(
      'SELECT * FROM checkpoints WHERE id = $1',
      [checkpointId]
    );
    if (checkpointResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Checkpoint not found.' },
      });
    }
    const checkpoint = checkpointResult.rows[0];

    // 2. Load the concept
    const conceptResult = await client.query(
      'SELECT * FROM learning_concepts WHERE id = $1',
      [checkpoint.learning_concept_id]
    );
    if (conceptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept not found.' },
      });
    }
    const concept = conceptResult.rows[0];

    // 3. Verify session ownership
    const sessionResult = await client.query(
      'SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2',
      [concept.session_id, userId]
    );
    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have access to this session.' },
      });
    }
    const session = sessionResult.rows[0];

    // 4. Verify concept is accessible (must be active or completed)
    if (concept.status === 'locked') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: { code: 'CONCEPT_LOCKED', message: 'This concept is locked. Complete the previous concept first.' },
      });
    }

    // 5. Get attempt number for this checkpoint
    const attemptResult = await client.query(
      'SELECT COUNT(*) AS attempts FROM checkpoint_responses WHERE checkpoint_id = $1 AND user_id = $2',
      [checkpointId, userId]
    );
    const attemptNumber = parseInt(attemptResult.rows[0].attempts, 10) + 1;

    // 6. Evaluate the answer
    let evaluation;
    const expectedKeywords = checkpoint.expected_keywords || [];

    if (isPrebuiltSession(session.topic)) {
      // Prebuilt evaluation (keyword-based, fully offline)
      evaluation = evaluatePrebuilt(answer, expectedKeywords);
    } else if (aiAvailable) {
      // AI evaluation
      try {
        evaluation = await evaluateWithAI(checkpoint.question, answer, concept.content);
      } catch (aiErr) {
        console.warn('[Checkpoint] AI evaluation failed, using keyword fallback:', aiErr.message);
        // Fallback to keyword-based
        evaluation = evaluatePrebuilt(answer, expectedKeywords);
      }
    } else {
      // No AI, no prebuilt — use keyword fallback
      evaluation = evaluatePrebuilt(answer, expectedKeywords);
    }

    const { score, isCorrect, feedback, masteryLevel } = evaluation;

    // 7. Store the response
    await client.query(
      `INSERT INTO checkpoint_responses
        (checkpoint_id, user_id, answer, score, is_correct, feedback, mastery_level, attempt_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [checkpointId, userId, answer.trim(), score, isCorrect, feedback, masteryLevel || scoringService.getMasteryLevel(score), attemptNumber]
    );

    // 8. Determine if concept should be completed
    // Rule: concept completes when current answer passes (score >= PASS_SCORE)
    let nextConcept = null;
    let sessionCompleted = false;
    let conceptCompleted = false;

    if (score >= PASS_SCORE && concept.status === 'active') {
      // Update the concept score
      await client.query(
        `UPDATE learning_concepts 
         SET score = $1, mastery_level = $2
         WHERE id = $3`,
        [score, masteryLevel || scoringService.getMasteryLevel(score), concept.id]
      );

      // Complete concept and unlock next
      const progression = await completeConcept(client, concept, concept.session_id);
      nextConcept = progression.nextConcept;
      sessionCompleted = progression.sessionCompleted;
      conceptCompleted = true;
    }

    await client.query('COMMIT');

    // If session just completed, trigger mastery recalculation and automatic assignment generation
    let snapshot = null;
    let assignmentData = null;
    if (sessionCompleted) {
      try {
        await recalculateSessionMastery(concept.session_id, userId);
        snapshot = await getSessionMasterySnapshot(concept.session_id, userId);
        const { generateAndSaveAssignment } = require('./learningController');
        const generated = await generateAndSaveAssignment(concept.session_id, userId, session.topic);
        assignmentData = generated?.assignment || null;
      } catch (genErr) {
        console.warn('[Checkpoint] Auto assignment generation on completion:', genErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        score,
        isCorrect,
        feedback,
        masteryLevel: masteryLevel || scoringService.getMasteryLevel(score),
        passed: score >= PASS_SCORE,
        passScore: PASS_SCORE,
        conceptCompleted,
        sessionCompleted,
        nextConceptId: nextConcept?.id || null,
        nextConceptTitle: nextConcept?.title || null,
        attemptNumber,
        sessionMastery: snapshot?.overallMastery,
        weakConcepts: snapshot?.weakConcepts,
        strongConcepts: snapshot?.strongConcepts,
        assignmentAvailable: sessionCompleted,
        assignmentTitle: assignmentData?.title || 'Personalized Practice Assignment',
        sessionId: concept.session_id,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Checkpoint] submitAnswer error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to evaluate answer.' },
    });
  } finally {
    client.release();
  }
};

/**
 * GET /api/learning/:sessionId/concepts/:conceptId/checkpoints
 * Returns all checkpoints for a concept.
 */
const getCheckpoints = async (req, res) => {
  try {
    const { sessionId, conceptId } = req.params;
    const userId = req.user.id;

    // Verify ownership
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

    // Verify concept belongs to session
    const conceptCheck = await db.query(
      'SELECT id, status FROM learning_concepts WHERE id = $1 AND session_id = $2',
      [conceptId, sessionId]
    );
    if (conceptCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Concept not found.' },
      });
    }

    if (conceptCheck.rows[0].status === 'locked') {
      return res.status(403).json({
        success: false,
        error: { code: 'CONCEPT_LOCKED', message: 'This concept is locked.' },
      });
    }

    const checkpoints = await db.query(
      'SELECT id, question, question_type, options, order_index FROM checkpoints WHERE learning_concept_id = $1 ORDER BY order_index',
      [conceptId]
    );

    return res.status(200).json({
      success: true,
      data: { checkpoints: checkpoints.rows },
    });
  } catch (err) {
    console.error('[Checkpoint] getCheckpoints error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve checkpoints.' },
    });
  }
};

module.exports = { submitAnswer, getCheckpoints };
