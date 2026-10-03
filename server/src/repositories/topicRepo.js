// src/repositories/topicRepo.js
import { query } from '../db/pool.js';

export async function getAllTopics() {
  const { rows } = await query(
    `SELECT id, slug, title, description, difficulty, aliases FROM topics WHERE is_predefined = true ORDER BY title`,
    []
  );
  return rows;
}

export async function getTopicBySlug(slug) {
  const { rows } = await query(
    `SELECT * FROM topics WHERE slug = $1`,
    [slug]
  );
  return rows[0] || null;
}

export async function getTopicConceptsByTopicId(topicId) {
  const { rows } = await query(
    `SELECT * FROM topic_concepts WHERE topic_id = $1 ORDER BY position ASC`,
    [topicId]
  );
  return rows;
}

export async function logAiCall({ task, model, latencyMs, status, fallbackUsed }) {
  await query(
    `INSERT INTO ai_call_log (task, model, latency_ms, status, fallback_used)
     VALUES ($1, $2, $3, $4, $5)`,
    [task, model, latencyMs, status, fallbackUsed]
  );
}
