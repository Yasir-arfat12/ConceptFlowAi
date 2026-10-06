/**
 * Mastery Service
 * Single source of truth for concept mastery & overall student mastery calculations.
 *
 * Weighting model (when components are available):
 * - Checkpoint questions: 50%
 * - Session quiz performance: 30%
 * - Assignment performance: 20%
 * Normalized automatically when some components are not yet completed (e.g. 70% checkpoint + 30% assignment if no quiz).
 */
const db = require('../config/db');

/**
 * Recalculates and updates concept scores for a given session based on
 * checkpoints, quiz attempt answers, and assignment attempt answers.
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

    // 4. Fetch assignment attempt answer performance per concept
    const assignmentAnswersResult = await client.query(
      `SELECT aaa.concept_id,
              COUNT(*)::INTEGER AS total_q,
              SUM(CASE WHEN aaa.is_correct THEN 1 ELSE 0 END)::INTEGER AS correct_q
       FROM assignment_attempt_answers aaa
       JOIN assignment_attempts aa ON aaa.attempt_id = aa.id
       WHERE aa.session_id = $1 AND aa.user_id = $2 AND aaa.concept_id IS NOT NULL
       GROUP BY aaa.concept_id`,
      [sessionId, userId]
    );
    const assignmentConceptMap = new Map();
    assignmentAnswersResult.rows.forEach((r) => {
      if (r.total_q > 0) {
        assignmentConceptMap.set(r.concept_id, {
          score: Math.round((r.correct_q / r.total_q) * 100),
          total: r.total_q,
          correct: r.correct_q,
        });
      }
    });

    // Also check overall assignment score if completed
    const assignmentResult = await client.query(
      `SELECT score FROM assignments 
       WHERE session_id = $1 AND completed_at IS NOT NULL AND score IS NOT NULL`,
      [sessionId]
    );
    const overallAssignmentScore = assignmentResult.rows.length > 0 ? assignmentResult.rows[0].score : null;

    // 5. Update each concept's weighted score and mastery level
    const updatedConcepts = [];
    for (const concept of concepts) {
      const cpData = checkpointMap.get(concept.id);
      const qzData = quizMap.get(concept.id);
      const asConceptData = assignmentConceptMap.get(concept.id);

      let totalWeight = 0;
      let weightedSum = 0;

      if (cpData) {
        const cpWeight = 0.5;
        weightedSum += cpData.score * cpWeight;
        totalWeight += cpWeight;
      }
      if (qzData) {
        const qzWeight = 0.3;
        weightedSum += qzData.score * qzWeight;
        totalWeight += qzWeight;
      }
      if (asConceptData) {
        const asWeight = 0.2;
        weightedSum += asConceptData.score * asWeight;
        totalWeight += asWeight;
      } else if (overallAssignmentScore !== null && concept.status === 'completed') {
        const asWeight = 0.2;
        weightedSum += overallAssignmentScore * asWeight;
        totalWeight += asWeight;
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
 * Returns a complete mastery snapshot for a session:
 * overallMastery, conceptBreakdown, weakConcepts, strongConcepts, difficulty
 */
async function getSessionMasterySnapshot(sessionId, userId) {
  const result = await db.query(
    `SELECT lc.id, lc.title, lc.order_index, lc.status, lc.score, lc.mastery_level
     FROM learning_concepts lc
     WHERE lc.session_id = $1
     ORDER BY lc.order_index ASC`,
    [sessionId]
  );

  const concepts = result.rows;
  const completedConcepts = concepts.filter((c) => c.status === 'completed');

  const overallMastery =
    completedConcepts.length > 0
      ? Math.round(
          completedConcepts.reduce((acc, c) => acc + (c.score || 0), 0) / completedConcepts.length
        )
      : 0;

  // Weak concepts: score < 75 sorted lowest score first
  const weakConcepts = concepts
    .filter((c) => c.status !== 'locked')
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 3)
    .map((c) => ({
      conceptId: c.id,
      conceptTitle: c.title,
      mastery: c.score !== null ? c.score : 40,
    }));

  // Strong concepts: score >= 75 sorted highest score first
  const strongConcepts = concepts
    .filter((c) => (c.score || 0) >= 75)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((c) => ({
      conceptId: c.id,
      conceptTitle: c.title,
      mastery: c.score || 80,
    }));

  let difficulty = 'developing';
  if (overallMastery < 50) difficulty = 'needs_practice';
  else if (overallMastery < 75) difficulty = 'developing';
  else if (overallMastery < 90) difficulty = 'strong';
  else difficulty = 'mastered';

  return {
    overallMastery,
    conceptBreakdown: concepts.map((c) => ({
      id: c.id,
      title: c.title,
      score: c.score,
      masteryLevel: c.mastery_level,
      status: c.status,
    })),
    weakConcepts,
    strongConcepts: strongConcepts.length > 0 ? strongConcepts : [
      {
        conceptId: concepts[0]?.id,
        conceptTitle: concepts[0]?.title || 'Core Fundamentals',
        mastery: concepts[0]?.score || 75,
      },
    ],
    difficulty,
  };
}

/**
 * Identifies weak concepts in a session (score < 75 or lowest scoring).
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
  const weak = concepts.filter((c) => (c.score !== null && c.score < 75) || c.mastery_level === 'needs_practice');
  return weak.length > 0 ? weak : concepts.slice(0, 2);
}

/**
 * Identifies strong concepts in a session (score >= 75).
 */
async function getStrongConcepts(sessionId, userId) {
  const result = await db.query(
    `SELECT lc.id, lc.title, lc.order_index, lc.status, lc.score, lc.mastery_level
     FROM learning_concepts lc
     WHERE lc.session_id = $1 AND lc.status = 'completed' AND COALESCE(lc.score, 0) >= 75
     ORDER BY COALESCE(lc.score, 0) DESC, lc.order_index ASC`,
    [sessionId]
  );

  return result.rows;
}

module.exports = {
  recalculateSessionMastery,
  getSessionMasterySnapshot,
  getWeakConcepts,
  getStrongConcepts,
};

