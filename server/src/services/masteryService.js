/**
 * Mastery Service
 * Single source of truth for concept mastery & overall student mastery calculations.
 *
 * Weighting model (when components are available):
 * - Checkpoint questions: 50%
 * - Session quiz performance: 30%
 * - Assignment performance: 20%
 * Normalized automatically when some components are not yet completed.
 */
const db = require('../config/db');

/**
 * Recalculates and updates concept scores for a given session based on
 * checkpoints, quiz attempt answers, and assignment submissions.
 */
async function recalculateSessionMastery(sessionId, userId) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch all concepts for the session
    const conceptsResult = await client.query(
      `SELECT id, title, order_index, status, score FROM learning_concepts 
       WHERE session_id = $1 ORDER BY order_index ASC`,
      [sessionId]
    );
    const concepts = conceptsResult.rows;

    // 2. Fetch checkpoint scores per concept
    const checkpointScoresResult = await client.query(
      `SELECT cp.learning_concept_id AS concept_id,
              AVG(cr.score)::NUMERIC  AS avg_score,
              COUNT(cr.id)::INTEGER   AS response_count
       FROM checkpoint_responses cr
       JOIN checkpoints cp ON cr.checkpoint_id = cp.id
       JOIN learning_concepts lc ON cp.learning_concept_id = lc.id
       WHERE lc.session_id = $1 AND cr.user_id = $2
       GROUP BY cp.learning_concept_id`,
      [sessionId, userId]
    );
    const checkpointMap = new Map();
    checkpointScoresResult.rows.forEach((r) => {
      checkpointMap.set(r.concept_id, {
        score: parseFloat(r.avg_score),
        count: r.response_count,
      });
    });

    // 3. Fetch quiz answer performance per concept
    const quizAnswersResult = await client.query(
      `SELECT qaa.concept_id,
              COUNT(*)::INTEGER AS total_q,
              SUM(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END)::INTEGER AS correct_q
       FROM quiz_attempt_answers qaa
       JOIN quiz_attempts qa ON qaa.attempt_id = qa.id
       WHERE qa.session_id = $1 AND qa.user_id = $2 AND qaa.concept_id IS NOT NULL
       GROUP BY qaa.concept_id`,
      [sessionId, userId]
    );
    const quizMap = new Map();
    quizAnswersResult.rows.forEach((r) => {
      if (r.total_q > 0) {
        quizMap.set(r.concept_id, {
          score: Math.round((r.correct_q / r.total_q) * 100),
          total: r.total_q,
          correct: r.correct_q,
        });
      }
    });

    // 4. Fetch assignment score for session (if completed)
    const assignmentResult = await client.query(
      `SELECT score FROM assignments 
       WHERE session_id = $1 AND completed_at IS NOT NULL AND score IS NOT NULL`,
      [sessionId]
    );
    const assignmentScore = assignmentResult.rows.length > 0 ? assignmentResult.rows[0].score : null;

    // 5. Update each concept's weighted score and mastery level
    const updatedConcepts = [];
    for (const concept of concepts) {
      const cpData = checkpointMap.get(concept.id);
      const qzData = quizMap.get(concept.id);

      let totalWeight = 0;
      let weightedSum = 0;

      if (cpData) {
        weightedSum += cpData.score * 0.5;
        totalWeight += 0.5;
      }
      if (qzData) {
        weightedSum += qzData.score * 0.3;
        totalWeight += 0.3;
      }
      if (assignmentScore !== null && concept.status === 'completed') {
        weightedSum += assignmentScore * 0.2;
        totalWeight += 0.2;
      }

      if (totalWeight > 0) {
        const finalScore = Math.round(weightedSum / totalWeight);
        const masteryLevel =
          finalScore >= 80 ? 'mastered' : finalScore >= 60 ? 'developing' : 'needs_practice';

        await client.query(
          `UPDATE learning_concepts 
           SET score = $1, mastery_level = $2 
           WHERE id = $3`,
          [finalScore, masteryLevel, concept.id]
        );

        updatedConcepts.push({
          id: concept.id,
          title: concept.title,
          score: finalScore,
          masteryLevel,
          status: concept.status,
        });
      } else {
        updatedConcepts.push({
          id: concept.id,
          title: concept.title,
          score: concept.score,
          masteryLevel: concept.score >= 80 ? 'mastered' : concept.score >= 60 ? 'developing' : 'needs_practice',
          status: concept.status,
        });
      }
    }

    await client.query('COMMIT');
    return updatedConcepts;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MasteryService] recalculateSessionMastery error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Identifies weak concepts in a session (score < 75 or wrong quiz answers).
 */
async function getWeakConcepts(sessionId, userId) {
  const result = await db.query(
    `SELECT lc.id, lc.title, lc.order_index, lc.status, lc.score, lc.mastery_level
     FROM learning_concepts lc
     WHERE lc.session_id = $1 AND lc.status != 'locked'
     ORDER BY COALESCE(lc.score, 0) ASC, lc.order_index ASC`,
    [sessionId]
  );

  const concepts = result.rows;
  // Weak if score < 75 or mastery_level is 'needs_practice'
  const weak = concepts.filter((c) => (c.score !== null && c.score < 75) || c.mastery_level === 'needs_practice');
  return weak.length > 0 ? weak : concepts.slice(0, 2);
}

module.exports = {
  recalculateSessionMastery,
  getWeakConcepts,
};
