const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch Global Progress (similar to progressController)
    const sessionsRes = await db.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
       FROM learning_sessions 
       WHERE user_id = $1`,
      [userId]
    );

    const totalSessions = parseInt(sessionsRes.rows[0].total_sessions, 10) || 0;
    const completedSessions = parseInt(sessionsRes.rows[0].completed_sessions, 10) || 0;

    const conceptsRes = await db.query(
      `SELECT COUNT(*) as completed_concepts 
       FROM learning_concepts lc
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE ls.user_id = $1 AND lc.status = 'completed'`,
      [userId]
    );
    const completedConcepts = parseInt(conceptsRes.rows[0].completed_concepts, 10) || 0;

    const scoresRes = await db.query(
      `SELECT AVG(score) as average_score
       FROM checkpoint_responses 
       WHERE user_id = $1`,
      [userId]
    );
    const averageScore = Math.round(parseFloat(scoresRes.rows[0].average_score)) || 0;

    // 2. Fetch Recent Sessions
    const recentSessionsRes = await db.query(
      'SELECT id, topic, status, updated_at FROM learning_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5',
      [userId]
    );

    // 3. Find the most recently active session for 'Resume'
    const activeSession = recentSessionsRes.rows.find(s => s.status === 'active') || null;

    res.status(200).json({
      success: true,
      data: {
        progress: {
          totalSessions,
          completedSessions,
          completedConcepts,
          averageScore
        },
        recentSessions: recentSessionsRes.rows,
        activeSessionId: activeSession ? activeSession.id : null
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

module.exports = {
  getDashboardData
};
