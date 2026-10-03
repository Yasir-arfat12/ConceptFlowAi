// src/services/learningService.js
import { withTransaction } from '../db/pool.js';
import {
  createSession,
  createSessionConcept,
  createCheckpoint,
  getSessionById,
  getUserSessions,
  updateSessionAccessed,
  getCurrentConcept,
  getConceptById,
  getCheckpointWithRubric,
  getAttemptCount,
  saveCheckpointResponse,
  completeConceptAndAdvance,
} from '../repositories/sessionRepo.js';
import {
  findMatchingTopic,
  generateLearningPath,
  evaluateCheckpoint,
  evaluateCheckpointFallback,
} from './ai/tasks.js';
import { getAllTopics, getTopicConceptsByTopicId } from '../repositories/topicRepo.js';
import { forbidden, notFound, conflict, serviceUnavailable } from '../utils/errors.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

// ─── Start a learning session ──────────────────────────────────────────────

export async function startLearningSession({ userId, query }) {
  // Try AI path generation first (unless offline)
  let conceptsData = null;
  let topicTitle = null;
  let topicId = null;
  let source = 'ai';

  if (env.AI_MODE !== 'offline') {
    try {
      const path = await generateLearningPath(query);
      conceptsData = path.concepts;
      topicTitle = path.topicTitle;
      source = 'ai';
    } catch (err) {
      if (err.code !== 'AI_OFFLINE') {
        logger.warn({ err: err.message }, 'AI path generation failed, falling back to predefined');
      }
    }
  }

  // Fallback: match predefined topic
  if (!conceptsData) {
    const topic = await findMatchingTopic(query);
    if (!topic) {
      const allTopics = await getAllTopics();
      throw serviceUnavailable(
        'AI is temporarily unavailable and no predefined topic matched your query.',
        'AI_TEMPORARILY_UNAVAILABLE'
      );
    }
    const storedConcepts = await getTopicConceptsByTopicId(topic.id);
    topicTitle = topic.title;
    topicId = topic.id;
    source = 'predefined';
    conceptsData = storedConcepts.map((c) => ({
      title: c.title,
      explanation: c.explanation,
      keyPoints: c.key_points,
      example: c.example,
      checkpointQuestion: c.checkpoint_question,
      rubric: c.checkpoint_rubric,
    }));
  }

  // Create session and concepts in a transaction
  const session = await withTransaction(async (client) => {
    const sess = await createSession(client, {
      userId,
      topicId,
      topicTitle: topicTitle || query,
      originalQuery: query,
      source,
    });

    for (let i = 0; i < conceptsData.length; i++) {
      const c = conceptsData[i];
      const concept = await createSessionConcept(client, {
        sessionId: sess.id,
        position: i,
        title: c.title,
        explanation: c.explanation,
        keyPoints: c.keyPoints || [],
        example: c.example || null,
        codeSnippet: c.codeSnippet || null,
        status: i === 0 ? 'active' : 'locked',
      });
      await createCheckpoint(client, {
        sessionConceptId: concept.id,
        question: c.checkpointQuestion,
        rubric: c.rubric || {},
      });
    }

    return sess;
  });

  return await getSessionById(session.id, userId);
}

// ─── Get session list ─────────────────────────────────────────────────────

export async function getUserSessionList(userId) {
  return getUserSessions(userId);
}

// ─── Get single session ───────────────────────────────────────────────────

export async function getSession(sessionId, userId) {
  const session = await getSessionById(sessionId, userId);
  if (!session) throw notFound('Session not found');
  await updateSessionAccessed(sessionId, userId);
  return session;
}

// ─── Get current concept ─────────────────────────────────────────────────

export async function getCurrentConceptForSession(sessionId, userId) {
  // Verify session belongs to user
  const session = await getSessionById(sessionId, userId);
  if (!session) throw notFound('Session not found');
  await updateSessionAccessed(sessionId, userId);

  const concept = await getCurrentConcept(sessionId, userId);
  if (!concept) {
    // Session is completed
    return { completed: true, session };
  }
  return { concept, session, completed: false };
}

// ─── Answer a checkpoint ─────────────────────────────────────────────────

export async function answerCheckpoint({ checkpointId, userId, answer }) {
  const checkpoint = await getCheckpointWithRubric(checkpointId);
  if (!checkpoint) throw notFound('Checkpoint not found');
  if (checkpoint.user_id !== userId) throw notFound('Checkpoint not found');

  // Only allow answering the active concept's checkpoint
  if (checkpoint.concept_status !== 'active') {
    if (checkpoint.concept_status === 'locked') {
      throw forbidden('This concept is locked. Complete earlier concepts first.', 'CONCEPT_LOCKED');
    }
    throw conflict('This concept is already completed.', 'CONCEPT_NOT_ACTIVE');
  }

  const attemptNo = (await getAttemptCount(checkpointId, userId)) + 1;

  // Evaluate: try AI, fallback to rule-based
  let evaluation;
  let evaluatedBy = 'fallback';

  if (env.AI_MODE !== 'offline') {
    try {
      const aiResult = await evaluateCheckpoint({
        conceptTitle: checkpoint.concept_title,
        question: checkpoint.question,
        rubric: checkpoint.rubric,
        studentAnswer: answer,
      });
      evaluation = { ...aiResult, evaluatedBy: 'ai' };
      evaluatedBy = 'ai';
    } catch (err) {
      logger.warn({ err: err.message }, 'AI evaluation failed, using fallback');
    }
  }

  if (!evaluation) {
    const fallback = evaluateCheckpointFallback({ rubric: checkpoint.rubric, studentAnswer: answer });
    evaluation = fallback;
  }

  const passScore = env.CHECKPOINT_PASS_SCORE;
  const passes = evaluation.score >= passScore;

  // Save response and advance in a transaction
  const result = await withTransaction(async (client) => {
    const response = await saveCheckpointResponse(client, {
      checkpointId,
      userId,
      attemptNo,
      answer,
      score: evaluation.score,
      isCorrect: passes,
      feedback: evaluation.feedback,
      missingPoints: evaluation.missingPoints || [],
      evaluatedBy,
    });

    let nextConcept = null;
    let sessionCompleted = false;

    if (passes) {
      // Get all concepts to find the next one
      const session = await getSessionById(checkpoint.session_id, userId);
      const concepts = session.concepts || [];
      const currentIdx = concepts.findIndex((c) => c.id === checkpoint.concept_id);
      const nextIdx = currentIdx + 1;
      const next = concepts[nextIdx];
      const isLast = !next;

      await completeConceptAndAdvance(client, {
        conceptId: checkpoint.concept_id,
        sessionId: checkpoint.session_id,
        nextConceptId: next?.id || null,
        nextPosition: nextIdx,
        isLastConcept: isLast,
      });

      if (isLast) {
        sessionCompleted = true;
      } else {
        nextConcept = next;
      }
    }

    return { response, nextConcept, sessionCompleted, passes };
  });

  return {
    score: evaluation.score,
    isCorrect: passes,
    feedback: evaluation.feedback,
    missingPoints: evaluation.missingPoints || [],
    evaluatedBy,
    nextConcept: result.nextConcept,
    sessionCompleted: result.sessionCompleted,
    attemptNo,
  };
}

// ─── Dashboard / Progress ─────────────────────────────────────────────────

export async function getDashboard(userId) {
  const { query } = await import('../db/pool.js');

  const { rows: sessions } = await query(
    `SELECT ls.*,
      COUNT(sc.id) FILTER (WHERE sc.status = 'completed') as concepts_completed,
      COUNT(sc.id) as total_concepts,
      AVG(cr.score) FILTER (WHERE cr.id IS NOT NULL) as avg_score
     FROM learning_sessions ls
     LEFT JOIN session_concepts sc ON sc.session_id = ls.id
     LEFT JOIN checkpoints cp ON cp.session_concept_id = sc.id
     LEFT JOIN checkpoint_responses cr ON cr.checkpoint_id = cp.id AND cr.user_id = $1
     WHERE ls.user_id = $1
     GROUP BY ls.id
     ORDER BY ls.last_accessed_at DESC`,
    [userId]
  );

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const latestSession = activeSessions[0] || sessions[0] || null;

  // Streak: count consecutive days with activity
  const { rows: activityRows } = await query(
    `SELECT DISTINCT date_trunc('day', last_accessed_at AT TIME ZONE 'UTC') as day
     FROM learning_sessions WHERE user_id = $1 ORDER BY day DESC`,
    [userId]
  );
  const streak = computeStreak(activityRows.map((r) => r.day));

  const conceptsCompleted = sessions.reduce((sum, s) => sum + parseInt(s.concepts_completed || 0, 10), 0);
  const avgScore = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + parseFloat(s.avg_score || 0), 0) / sessions.filter((s) => s.avg_score).length || 0
    : 0;

  return {
    stats: {
      streak,
      topicsStarted: sessions.length,
      topicsCompleted: completedSessions.length,
      conceptsCompleted,
      avgScore: Math.round(avgScore),
    },
    continueLearning: latestSession ? {
      sessionId: latestSession.id,
      topicTitle: latestSession.topic_title,
      status: latestSession.status,
      conceptsCompleted: parseInt(latestSession.concepts_completed || 0, 10),
      totalConcepts: parseInt(latestSession.total_concepts || 0, 10),
      lastAccessedAt: latestSession.last_accessed_at,
    } : null,
    recentSessions: sessions.slice(0, 5).map((s) => ({
      id: s.id,
      topicTitle: s.topic_title,
      status: s.status,
      conceptsCompleted: parseInt(s.concepts_completed || 0, 10),
      totalConcepts: parseInt(s.total_concepts || 0, 10),
      lastAccessedAt: s.last_accessed_at,
    })),
  };
}

function computeStreak(days) {
  if (days.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let cursor = today;

  for (const day of days) {
    const d = new Date(day);
    d.setUTCHours(0, 0, 0, 0);
    const diff = (cursor - d) / (1000 * 60 * 60 * 24);
    if (diff <= 1) {
      streak++;
      cursor = d;
    } else break;
  }
  return streak;
}

export async function getProgress(userId) {
  const { query } = await import('../db/pool.js');
  const { rows } = await query(
    `SELECT ls.id, ls.topic_title, ls.status, ls.current_position,
      COUNT(sc.id) FILTER (WHERE sc.status = 'completed') as done,
      COUNT(sc.id) as total,
      ls.last_accessed_at
     FROM learning_sessions ls
     LEFT JOIN session_concepts sc ON sc.session_id = ls.id
     WHERE ls.user_id = $1
     GROUP BY ls.id
     ORDER BY ls.last_accessed_at DESC`,
    [userId]
  );
  return rows;
}
