/**
 * Dashboard Controller
 * Returns aggregated statistics from real PostgreSQL data.
 * No hardcoded values. All stats come from the database.
 */
const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Session stats
    const sessionStats = await db.query(
      `SELECT
         COUNT(*)                                                         AS total_sessions,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::INTEGER  AS completed_sessions,
         SUM(CASE WHEN status = 'active'    THEN 1 ELSE 0 END)::INTEGER  AS active_sessions
       FROM learning_sessions
       WHERE user_id = $1`,
      [userId]
    );

    // Concept stats
    const conceptStats = await db.query(
      `SELECT
         COUNT(*)                                                         AS total_concepts,
         SUM(CASE WHEN lc.status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_concepts
       FROM learning_concepts lc
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE ls.user_id = $1`,
      [userId]
    );

    // Checkpoint stats
    const checkpointStats = await db.query(
      `SELECT
         COUNT(*)                           AS total_responses,
         COALESCE(AVG(score), 0)::NUMERIC   AS average_score,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER AS correct_count
       FROM checkpoint_responses
       WHERE user_id = $1`,
      [userId]
    );

    // Recent sessions (last 5)
    const recentSessions = await db.query(
      `SELECT id, topic, status, progress_percentage, current_concept_id, updated_at
       FROM learning_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 5`,
      [userId]
    );

    // Active session (most recently updated active session)
    const activeSession = recentSessions.rows.find((s) => s.status === 'active') || null;

    // Current concept for active session
    let currentConcept = null;
    if (activeSession?.current_concept_id) {
      const conceptResult = await db.query(
        'SELECT id, title, order_index FROM learning_concepts WHERE id = $1',
        [activeSession.current_concept_id]
      );
      currentConcept = conceptResult.rows[0] || null;
    }

    const stats = sessionStats.rows[0];
    const concepts = conceptStats.rows[0];
    const checkpoints = checkpointStats.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSessions:        parseInt(stats.total_sessions, 10)        || 0,
          completedSessions:    parseInt(stats.completed_sessions, 10)    || 0,
          activeSessions:       parseInt(stats.active_sessions, 10)       || 0,
          totalConcepts:        parseInt(concepts.total_concepts, 10)     || 0,
          completedConcepts:    parseInt(concepts.completed_concepts, 10) || 0,
          totalResponses:       parseInt(checkpoints.total_responses, 10) || 0,
          averageScore:         Math.round(parseFloat(checkpoints.average_score)) || 0,
          correctCount:         parseInt(checkpoints.correct_count, 10)   || 0,
        },
        recentSessions:   recentSessions.rows,
        activeSessionId:  activeSession?.id || null,
        currentConcept,
      },
    });
  } catch (err) {
    console.error('[Dashboard] getDashboardData error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve dashboard data.' },
    });
  }
};

module.exports = { getDashboardData };
