/**
 * Progress Controller
 * Returns per-session and overall learning progress.
 */
const db = require('../config/db');

const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Overall progress
    const sessionStats = await db.query(
      `SELECT
         COUNT(*)                                                        AS total_sessions,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_sessions
       FROM learning_sessions WHERE user_id = $1`,
      [userId]
    );

    const conceptStats = await db.query(
      `SELECT
         COUNT(*)                                                          AS total_concepts,
         SUM(CASE WHEN lc.status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_concepts
       FROM learning_concepts lc
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE ls.user_id = $1`,
      [userId]
    );

    const scoreStats = await db.query(
      `SELECT
         COALESCE(AVG(score), 0)::NUMERIC AS average_score,
         COUNT(*)::INTEGER                AS total_checkpoints_answered,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER AS correct_count
       FROM checkpoint_responses WHERE user_id = $1`,
      [userId]
    );

    // Per-session progress
    const sessionsProgress = await db.query(
      `SELECT
         ls.id, ls.topic, ls.status, ls.progress_percentage,
         COUNT(lc.id)::INTEGER                                             AS total_concepts,
         SUM(CASE WHEN lc.status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_concepts,
         ls.updated_at
       FROM learning_sessions ls
       LEFT JOIN learning_concepts lc ON lc.session_id = ls.id
       WHERE ls.user_id = $1
       GROUP BY ls.id
       ORDER BY ls.updated_at DESC`,
      [userId]
    );

    const stats = sessionStats.rows[0];
    const concepts = conceptStats.rows[0];
    const scores = scoreStats.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        overall: {
          totalSessions:             parseInt(stats.total_sessions, 10)             || 0,
          completedSessions:         parseInt(stats.completed_sessions, 10)         || 0,
          totalConcepts:             parseInt(concepts.total_concepts, 10)          || 0,
          completedConcepts:         parseInt(concepts.completed_concepts, 10)      || 0,
          averageScore:              Math.round(parseFloat(scores.average_score))   || 0,
          totalCheckpointsAnswered:  parseInt(scores.total_checkpoints_answered, 10)|| 0,
          correctCount:              parseInt(scores.correct_count, 10)             || 0,
        },
        sessions: sessionsProgress.rows,
      },
    });
  } catch (err) {
    console.error('[Progress] getProgress error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve progress.' },
    });
  }
};

module.exports = { getProgress };
