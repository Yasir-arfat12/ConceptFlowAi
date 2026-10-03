// src/repositories/sessionRepo.js
import { query } from '../db/pool.js';

export async function createSession(client, { userId, topicId, topicTitle, originalQuery, source }) {
  const { rows } = await (client || { query: (t, p) => query(t, p) }).query(
    `INSERT INTO learning_sessions (user_id, topic_id, topic_title, original_query, source, current_position)
     VALUES ($1, $2, $3, $4, $5, 0)
     RETURNING *`,
    [userId, topicId || null, topicTitle, originalQuery, source]
  );
  return rows[0];
}

export async function getSessionById(sessionId, userId) {
  const { rows } = await query(
    `SELECT ls.*, 
      COALESCE(
        json_agg(sc ORDER BY sc.position) FILTER (WHERE sc.id IS NOT NULL),
        '[]'::json
      ) as concepts
     FROM learning_sessions ls
     LEFT JOIN session_concepts sc ON sc.session_id = ls.id
     WHERE ls.id = $1 AND ls.user_id = $2
     GROUP BY ls.id`,
    [sessionId, userId]
  );
  return rows[0] || null;
}

export async function getUserSessions(userId) {
  const { rows } = await query(
    `SELECT ls.*, 
      COUNT(sc.id) FILTER (WHERE sc.status = 'completed') as concepts_completed,
      COUNT(sc.id) as total_concepts
     FROM learning_sessions ls
     LEFT JOIN session_concepts sc ON sc.session_id = ls.id
     WHERE ls.user_id = $1
     GROUP BY ls.id
     ORDER BY ls.last_accessed_at DESC`,
    [userId]
  );
  return rows;
}

export async function updateSessionAccessed(sessionId, userId) {
  await query(
    `UPDATE learning_sessions SET last_accessed_at = NOW() WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
}

export async function updateSessionStatus(client, sessionId, status, position) {
  const q = client || { query: (t, p) => query(t, p) };
  const completedAt = status === 'completed' ? 'NOW()' : 'NULL';
  await q.query(
    `UPDATE learning_sessions 
     SET status = $1, current_position = $2, last_accessed_at = NOW(), completed_at = ${completedAt}
     WHERE id = $3`,
    [status, position, sessionId]
  );
}

export async function getCurrentConcept(sessionId, userId) {
  const { rows } = await query(
    `SELECT sc.*, c.question, c.id as checkpoint_id
     FROM session_concepts sc
     LEFT JOIN checkpoints c ON c.session_concept_id = sc.id
     JOIN learning_sessions ls ON ls.id = sc.session_id
     WHERE sc.session_id = $1 AND ls.user_id = $2 AND sc.status = 'active'`,
    [sessionId, userId]
  );
  return rows[0] || null;
}

export async function getConceptById(conceptId, sessionId, userId) {
  const { rows } = await query(
    `SELECT sc.*, cp.id as checkpoint_id, cp.question as checkpoint_question
     FROM session_concepts sc
     LEFT JOIN checkpoints cp ON cp.session_concept_id = sc.id
     JOIN learning_sessions ls ON ls.id = sc.session_id
     WHERE sc.id = $1 AND sc.session_id = $2 AND ls.user_id = $3`,
    [conceptId, sessionId, userId]
  );
  return rows[0] || null;
}

export async function createSessionConcept(client, { sessionId, position, title, explanation, keyPoints, example, codeSnippet, status }) {
  const q = client || { query: (t, p) => query(t, p) };
  const { rows } = await q.query(
    `INSERT INTO session_concepts 
      (session_id, position, title, explanation, key_points, example, code_snippet, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [sessionId, position, title, explanation, JSON.stringify(keyPoints || []), example || null, codeSnippet || null, status || 'locked']
  );
  return rows[0];
}

export async function createCheckpoint(client, { sessionConceptId, question, rubric }) {
  const q = client || { query: (t, p) => query(t, p) };
  const { rows } = await q.query(
    `INSERT INTO checkpoints (session_concept_id, question, rubric)
     VALUES ($1, $2, $3)
     RETURNING id, question`,
    [sessionConceptId, question, JSON.stringify(rubric)]
  );
  return rows[0];
}

export async function getCheckpointWithRubric(checkpointId) {
  const { rows } = await query(
    `SELECT cp.*, sc.id as concept_id, sc.session_id, sc.status as concept_status, 
            sc.title as concept_title, sc.explanation, sc.key_points, sc.position,
            ls.user_id
     FROM checkpoints cp
     JOIN session_concepts sc ON sc.id = cp.session_concept_id
     JOIN learning_sessions ls ON ls.id = sc.session_id
     WHERE cp.id = $1`,
    [checkpointId]
  );
  return rows[0] || null;
}

export async function getAttemptCount(checkpointId, userId) {
  const { rows } = await query(
    `SELECT COUNT(*) as count FROM checkpoint_responses 
     WHERE checkpoint_id = $1 AND user_id = $2`,
    [checkpointId, userId]
  );
  return parseInt(rows[0].count, 10);
}

export async function saveCheckpointResponse(client, { checkpointId, userId, attemptNo, answer, score, isCorrect, feedback, missingPoints, evaluatedBy }) {
  const q = client || { query: (t, p) => query(t, p) };
  const { rows } = await q.query(
    `INSERT INTO checkpoint_responses 
      (checkpoint_id, user_id, attempt_no, answer, score, is_correct, feedback, missing_points, evaluated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [checkpointId, userId, attemptNo, answer, score, isCorrect, feedback, JSON.stringify(missingPoints || []), evaluatedBy]
  );
  return rows[0];
}

export async function completeConceptAndAdvance(client, { conceptId, sessionId, nextConceptId, nextPosition, isLastConcept }) {
  // Mark current concept as completed
  await client.query(
    `UPDATE session_concepts SET status = 'completed', completed_at = NOW() WHERE id = $1`,
    [conceptId]
  );

  if (!isLastConcept && nextConceptId) {
    // Unlock next concept
    await client.query(
      `UPDATE session_concepts SET status = 'active' WHERE id = $1`,
      [nextConceptId]
    );
    // Update session position
    await client.query(
      `UPDATE learning_sessions SET current_position = $1, last_accessed_at = NOW() WHERE id = $2`,
      [nextPosition, sessionId]
    );
  } else {
    // All done
    await client.query(
      `UPDATE learning_sessions SET status = 'completed', completed_at = NOW(), last_accessed_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  }
}
