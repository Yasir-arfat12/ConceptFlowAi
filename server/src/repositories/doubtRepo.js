// src/repositories/doubtRepo.js
import { query } from '../db/pool.js';

export async function getOrCreateThread(client, { sessionId, sessionConceptId, userId }) {
  const q = client || { query: (t, p) => query(t, p) };
  // Try to find existing thread
  const { rows: existing } = await q.query(
    `SELECT * FROM doubt_threads WHERE session_id = $1 AND session_concept_id = $2 AND user_id = $3`,
    [sessionId, sessionConceptId, userId]
  );
  if (existing[0]) return { thread: existing[0], created: false };

  // Create new
  const { rows } = await q.query(
    `INSERT INTO doubt_threads (session_id, session_concept_id, user_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [sessionId, sessionConceptId, userId]
  );
  return { thread: rows[0], created: true };
}

export async function addDoubtMessage(client, { threadId, role, content, source }) {
  const q = client || { query: (t, p) => query(t, p) };
  const { rows } = await q.query(
    `INSERT INTO doubt_messages (thread_id, role, content, source)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [threadId, role, content, source]
  );
  return rows[0];
}

export async function getThreadMessages(threadId, userId) {
  const { rows } = await query(
    `SELECT dm.*
     FROM doubt_messages dm
     JOIN doubt_threads dt ON dt.id = dm.thread_id
     WHERE dm.thread_id = $1 AND dt.user_id = $2
     ORDER BY dm.created_at ASC`,
    [threadId, userId]
  );
  return rows;
}

export async function getThreadForConcept(sessionConceptId, userId) {
  const { rows } = await query(
    `SELECT dt.*, 
      COALESCE(json_agg(dm ORDER BY dm.created_at) FILTER (WHERE dm.id IS NOT NULL), '[]'::json) as messages
     FROM doubt_threads dt
     LEFT JOIN doubt_messages dm ON dm.thread_id = dt.id
     WHERE dt.session_concept_id = $1 AND dt.user_id = $2
     GROUP BY dt.id`,
    [sessionConceptId, userId]
  );
  return rows[0] || null;
}
