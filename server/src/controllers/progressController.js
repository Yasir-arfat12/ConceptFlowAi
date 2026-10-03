const db = require('../config/db');

const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Session Stats
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

    // 2. Concept Stats
    const conceptsRes = await db.query(
      `SELECT COUNT(*) as completed_concepts 
       FROM learning_concepts lc
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE ls.user_id = $1 AND lc.status = 'completed'`,
      [userId]
    );
    const completedConcepts = parseInt(conceptsRes.rows[0].completed_concepts, 10) || 0;

    // 3. Score Stats
    const scoresRes = await db.query(
      `SELECT AVG(score) as average_score, COUNT(*) as total_checkpoints_answered
       FROM checkpoint_responses 
       WHERE user_id = $1`,
      [userId]
    );
    const averageScore = Math.round(parseFloat(scoresRes.rows[0].average_score)) || 0;
    const totalCheckpointsAnswered = parseInt(scoresRes.rows[0].total_checkpoints_answered, 10) || 0;

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        completedConcepts,
        averageScore,
        totalCheckpointsAnswered
      }
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

module.exports = {
  getProgress
};
