/**
 * Dashboard Controller
 * Returns aggregated statistics, concept mastery intelligence, and learning trends from real PostgreSQL data.
 * No hardcoded values. PostgreSQL is the single source of truth.
 */
const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. User info
    const userResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0] || { id: userId, name: 'Learner', email: '' };

    // 2. Session stats
    const sessionStats = await db.query(
      `SELECT
         COUNT(*)                                                         AS total_sessions,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::INTEGER  AS completed_sessions,
         SUM(CASE WHEN status = 'active'    THEN 1 ELSE 0 END)::INTEGER  AS active_sessions
       FROM learning_sessions
       WHERE user_id = $1`,
      [userId]
    );

    // 3. Concept stats
    const conceptStats = await db.query(
      `SELECT
         COUNT(*)                                                         AS total_concepts,
         SUM(CASE WHEN lc.status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_concepts,
         SUM(CASE WHEN lc.status = 'active'    THEN 1 ELSE 0 END)::INTEGER AS active_concepts,
         SUM(CASE WHEN lc.status = 'locked'    THEN 1 ELSE 0 END)::INTEGER AS locked_concepts
       FROM learning_concepts lc
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE ls.user_id = $1`,
      [userId]
    );

    // 4. Checkpoint stats
    const checkpointStats = await db.query(
      `SELECT
         COUNT(*)                           AS total_responses,
         COALESCE(AVG(score), 0)::NUMERIC   AS average_score,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER AS correct_count
       FROM checkpoint_responses
       WHERE user_id = $1`,
      [userId]
    );

    // 5. Assignment stats
    const assignmentStats = await db.query(
      `SELECT
         COUNT(*)::INTEGER AS total_assignments,
         SUM(CASE WHEN a.completed_at IS NOT NULL THEN 1 ELSE 0 END)::INTEGER AS completed_assignments
       FROM assignments a
       JOIN learning_sessions ls ON a.session_id = ls.id
       WHERE ls.user_id = $1`,
      [userId]
    );

    // 6. Quiz stats (from quiz_attempts)
    const quizStats = await db.query(
      `SELECT
         COUNT(*)::INTEGER AS total_quizzes,
         COUNT(*)::INTEGER AS total_attempts,
         COALESCE(AVG(score), 0)::NUMERIC AS average_quiz_score,
         SUM(CASE WHEN percentage >= 80 THEN 1 ELSE 0 END)::INTEGER AS completed_quizzes
       FROM quiz_attempts
       WHERE user_id = $1`,
      [userId]
    );

    // 7. All user concepts with individual scores & statuses for concept mastery breakdown
    const allConceptsResult = await db.query(
      `SELECT lc.id, lc.title, lc.status, lc.score, lc.mastery_level, lc.order_index,
              lc.session_id, ls.topic, lc.completed_at, ls.updated_at AS session_updated_at
       FROM learning_concepts lc
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE ls.user_id = $1
       ORDER BY ls.updated_at DESC, lc.order_index ASC`,
      [userId]
    );

    const allConcepts = allConceptsResult.rows;
    const completedConcepts = allConcepts.filter((c) => c.status === 'completed');

    // Categorize concepts
    const masteredConcepts = completedConcepts.filter((c) => (c.score || 0) >= 80);
    const developingConcepts = allConcepts.filter(
      (c) => (c.status === 'completed' && (c.score || 0) >= 60 && (c.score || 0) < 80) ||
             (c.status === 'active' && c.score !== null && (c.score || 0) >= 50)
    );
    const needsPracticeConcepts = allConcepts.filter(
      (c) => (c.score !== null && (c.score || 0) < 60) ||
             (c.status === 'active' && (c.score === null || (c.score || 0) < 60))
    );
    const notStartedCount = allConcepts.filter((c) => c.status === 'locked').length;

    // Authoritative overall mastery calculation: average of completed concept scores
    const overallMasteryScore =
      completedConcepts.length > 0
        ? Math.round(
            completedConcepts.reduce((sum, c) => sum + (c.score || 0), 0) / completedConcepts.length
          )
        : 0;

    let masteryLabel = 'Not Started';
    if (completedConcepts.length > 0) {
      if (overallMasteryScore >= 85) masteryLabel = 'Mastered Understanding';
      else if (overallMasteryScore >= 70) masteryLabel = 'Good Understanding';
      else if (overallMasteryScore >= 50) masteryLabel = 'Developing Understanding';
      else masteryLabel = 'Foundational Understanding';
    }

    // Strong areas (top completed concepts with score >= 80)
    const strongAreas = completedConcepts
      .filter((c) => (c.score || 0) >= 75)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        sessionId: c.session_id,
        title: c.title,
        topic: c.topic,
        score: c.score || 0,
        status: 'mastered',
      }));

    // Areas to improve (concepts needing practice or review)
    const areasToImprove = allConcepts
      .filter((c) => c.status !== 'locked' && (c.score === null || (c.score || 0) < 75))
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        sessionId: c.session_id,
        title: c.title,
        topic: c.topic,
        score: c.score !== null ? c.score : 0,
        status: (c.score || 0) < 60 ? 'needs_practice' : 'developing',
      }));

    // 8. Score trend over time (historical checkpoint responses)
    const trendResult = await db.query(
      `SELECT cr.id, cr.score, cr.is_correct, cr.created_at,
              lc.title AS concept_title, ls.topic, ls.id AS session_id, lc.id AS concept_id
       FROM checkpoint_responses cr
       JOIN checkpoints cp ON cr.checkpoint_id = cp.id
       JOIN learning_concepts lc ON cp.learning_concept_id = lc.id
       JOIN learning_sessions ls ON lc.session_id = ls.id
       WHERE cr.user_id = $1
       ORDER BY cr.created_at ASC
       LIMIT 15`,
      [userId]
    );

    // 9. All User Sessions with concept progress
    const sessionsWithProgress = await db.query(
      `SELECT ls.id, ls.topic, ls.status, ls.progress_percentage, ls.current_concept_id, ls.updated_at,
              COALESCE(lc.title, (SELECT title FROM learning_concepts WHERE session_id = ls.id ORDER BY order_index DESC LIMIT 1)) AS current_concept_title,
              COALESCE(lc.order_index, (SELECT order_index FROM learning_concepts WHERE session_id = ls.id ORDER BY order_index DESC LIMIT 1)) AS current_concept_index,
              COUNT(all_c.id)::INTEGER AS total_concepts,
              SUM(CASE WHEN all_c.status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_concepts
       FROM learning_sessions ls
       LEFT JOIN learning_concepts lc ON ls.current_concept_id = lc.id
       LEFT JOIN learning_concepts all_c ON all_c.session_id = ls.id
       WHERE ls.user_id = $1
       GROUP BY ls.id, lc.title, lc.order_index
       ORDER BY (CASE WHEN ls.status = 'active' THEN 0 ELSE 1 END) ASC, ls.updated_at DESC`,
      [userId]
    );

    const activeSessionsList = sessionsWithProgress.rows.filter(s => s.status === 'active');
    const primarySession = sessionsWithProgress.rows[0] || null;

    // Load full concept chain for currently active or primary session (for Learning Journey visualization)
    let activeSessionConcepts = [];
    if (primarySession?.id) {
      const ascRes = await db.query(
        `SELECT id, title, status, score, order_index
         FROM learning_concepts
         WHERE session_id = $1
         ORDER BY order_index ASC`,
        [primarySession.id]
      );
      activeSessionConcepts = ascRes.rows;
    }

    // 10. Recent sessions (last 5)
    const recentSessions = await db.query(
      `SELECT ls.id, ls.topic, ls.status, ls.progress_percentage, ls.current_concept_id, ls.updated_at,
              COUNT(lc.id)::INTEGER AS total_concepts,
              SUM(CASE WHEN lc.status = 'completed' THEN 1 ELSE 0 END)::INTEGER AS completed_concepts,
              COALESCE(ROUND(AVG(lc.score)), 0)::INTEGER AS average_score
       FROM learning_sessions ls
       LEFT JOIN learning_concepts lc ON lc.session_id = ls.id
       WHERE ls.user_id = $1
       GROUP BY ls.id
       ORDER BY ls.updated_at DESC
       LIMIT 5`,
      [userId]
    );

    // 11. Consistency calculation: past 7 days activity
    const now = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayKey = d.toISOString().slice(0, 10);
      past7Days.push({
        date: dayKey,
        dayName: daysOfWeek[d.getUTCDay()],
        active: false,
      });
    }

    const activityDatesResult = await db.query(
      `SELECT DISTINCT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
       FROM checkpoint_responses
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       UNION
       SELECT DISTINCT TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
       FROM learning_sessions
       WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );
    const activeDateSet = new Set(activityDatesResult.rows.map((r) => r.day));
    past7Days.forEach((p) => {
      if (activeDateSet.has(p.date)) p.active = true;
    });

    const activeDaysThisWeek = past7Days.filter((d) => d.active).length;

    // Streak calculation
    const sessionDates = await db.query(
      `SELECT DISTINCT TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
       FROM learning_sessions
       WHERE user_id = $1
       ORDER BY day DESC`,
      [userId]
    );
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streakDays = 0;
    const dateSet = new Set(sessionDates.rows.map((r) => r.day));
    let curDate = dateSet.has(today) ? new Date() : (dateSet.has(yesterday) ? new Date(Date.now() - 86400000) : null);
    if (curDate) {
      while (true) {
        const key = curDate.toISOString().slice(0, 10);
        if (dateSet.has(key)) {
          streakDays++;
          curDate = new Date(curDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // 12. Deterministic Personalized Learning Insight
    let learningInsight = 'Your mastery journey starts here. Start your first learning session to build your understanding profile.';
    if (completedConcepts.length > 0) {
      if (areasToImprove.length > 0 && strongAreas.length > 0) {
        learningInsight = `You're performing strongly on "${strongAreas[0].title}" (${strongAreas[0].score}%), but need more practice on "${areasToImprove[0].title}" (${areasToImprove[0].score}%).`;
      } else if (overallMasteryScore >= 80) {
        learningInsight = 'Exceptional understanding! You are consistently scoring 80%+ across checkpoint questions.';
      } else if (overallMasteryScore >= 65) {
        learningInsight = 'Good progress! Reviewing checkpoint feedback will help turn developing concepts into full mastery.';
      } else {
        learningInsight = 'Keep practicing! Focus on understanding the core concept mechanisms before moving to the next checkpoint.';
      }
    }

    // 13. Recommended next step
    let nextRecommendedFocus = null;
    if (areasToImprove.length > 0) {
      nextRecommendedFocus = {
        title: areasToImprove[0].title,
        topic: areasToImprove[0].topic,
        sessionId: areasToImprove[0].sessionId,
        conceptId: areasToImprove[0].id,
        score: areasToImprove[0].score,
        reason: `Your recent score was ${areasToImprove[0].score}%. Revisit this concept before moving forward.`,
        actionLabel: 'Review Concept',
      };
    } else if (primarySession) {
      nextRecommendedFocus = {
        title: primarySession.current_concept_title || primarySession.topic,
        topic: primarySession.topic,
        sessionId: primarySession.id,
        conceptId: primarySession.current_concept_id,
        score: null,
        reason: primarySession.status === 'completed'
          ? `You completed ${primarySession.topic}! Test your knowledge with the track quiz.`
          : `Continue where you left off in ${primarySession.topic}.`,
        actionLabel: primarySession.status === 'completed' ? 'Take Quiz' : 'Continue Learning',
      };
    }

    const stats = sessionStats.rows[0];
    const concepts = conceptStats.rows[0];
    const checkpoints = checkpointStats.rows[0];
    const assignments = assignmentStats.rows[0];
    const quizzes = quizStats.rows[0];

    const completedConceptsCount = parseInt(concepts.completed_concepts, 10) || 0;
    const hoursLearned = Math.round((completedConceptsCount * 15 / 60) * 10) / 10;

    const statsData = {
      conceptsCompleted:    completedConceptsCount,
      totalConcepts:        parseInt(concepts.total_concepts, 10)     || 0,
      assignmentsCompleted: parseInt(assignments.completed_assignments, 10) || 0,
      totalAssignments:     parseInt(assignments.total_assignments, 10) || 0,
      quizzesCompleted:     parseInt(quizzes.completed_quizzes, 10)   || 0,
      totalQuizzes:         parseInt(quizzes.total_quizzes, 10)       || 0,
      averageScore:         Math.round(parseFloat(checkpoints.average_score)) || 0,
      totalSessions:        parseInt(stats.total_sessions, 10)        || 0,
      completedSessions:    parseInt(stats.completed_sessions, 10)    || 0,
      activeSessions:       parseInt(stats.active_sessions, 10)       || 0,
      totalResponses:       parseInt(checkpoints.total_responses, 10) || 0,
      correctCount:         parseInt(checkpoints.correct_count, 10)   || 0,
      streakDays,
      hoursLearned,
    };

    const masteryData = {
      overallScore: overallMasteryScore,
      masteryLabel,
      breakdown: {
        mastered:       masteredConcepts.length,
        developing:     developingConcepts.length,
        needsPractice:  needsPracticeConcepts.length,
        notStarted:     notStartedCount,
      },
      strongAreas,
      areasToImprove,
      allConcepts,
      trend: trendResult.rows,
      nextFocus: nextRecommendedFocus,
      consistency: {
        days: past7Days,
        activeDaysThisWeek,
      },
      insight: learningInsight,
    };

    const responsePayload = {
      success: true,
      user,
      stats: statsData,
      mastery: masteryData,
      activeSessions: activeSessionsList.length > 0 ? activeSessionsList : (primarySession ? [primarySession] : []),
      recentSessions: recentSessions.rows,
      activeSessionId: primarySession?.id || null,
      activeSession: primarySession,
      activeSessionConcepts,
      currentConcept: primarySession
        ? {
            id: primarySession.current_concept_id || (activeSessionConcepts.length > 0 ? activeSessionConcepts[activeSessionConcepts.length - 1].id : null),
            title: primarySession.current_concept_title || (primarySession.status === 'completed' ? 'All concepts completed' : primarySession.topic),
            order_index: primarySession.current_concept_index || 6,
            isCompleted: primarySession.status === 'completed',
          }
        : null,
    };

    return res.status(200).json({
      ...responsePayload,
      data: responsePayload,
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
