// src/services/doubtService.js
import { withTransaction } from '../db/pool.js';
import { getSessionById, getConceptById } from '../repositories/sessionRepo.js';
import { getOrCreateThread, addDoubtMessage, getThreadForConcept } from '../repositories/doubtRepo.js';
import { answerDoubt, answerDoubtFallback } from './ai/tasks.js';
import { forbidden, notFound } from '../utils/errors.js';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { query } from '../db/pool.js';

export async function askDoubt({ sessionId, conceptId, userId, question }) {
  // Verify session ownership
  const session = await getSessionById(sessionId, userId);
  if (!session) throw notFound('Session not found');

  // Verify concept belongs to session
  const concept = await getConceptById(conceptId, sessionId, userId);
  if (!concept) throw notFound('Concept not found');

  // Locked concepts cannot receive doubts
  if (concept.status === 'locked') {
    throw forbidden('This concept is locked. Complete earlier concepts first.', 'CONCEPT_LOCKED');
  }

  // Get all concepts for context
  const { rows: allConcepts } = await query(
    `SELECT title, status, position FROM session_concepts WHERE session_id = $1 ORDER BY position`,
    [sessionId]
  );

  const completedSummary = allConcepts
    .filter((c) => c.status === 'completed')
    .map((c) => c.title)
    .join(', ') || 'None yet';

  const result = await withTransaction(async (client) => {
    // Get or create thread
    const { thread } = await getOrCreateThread(client, {
      sessionId,
      sessionConceptId: conceptId,
      userId,
    });

    // Get existing messages for context
    const { rows: existingMessages } = await client.query(
      `SELECT role, content FROM doubt_messages WHERE thread_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [thread.id]
    );
    const recentMessages = existingMessages.reverse();

    // Save user message
    const userMsg = await addDoubtMessage(client, {
      threadId: thread.id,
      role: 'user',
      content: question,
      source: 'ai',
    });

    // Get AI answer
    let answerText;
    let answerSource = 'fallback';

    if (env.AI_MODE !== 'offline') {
      try {
        const aiResult = await answerDoubt({
          topicTitle: session.topic_title,
          allConceptTitles: allConcepts.map((c) => c.title),
          anchorConcept: concept,
          completedSummary,
          checkpointQuestion: concept.checkpoint_question,
          recentMessages,
          studentQuestion: question,
        });
        answerText = aiResult.answer;
        answerSource = 'ai';
      } catch (err) {
        logger.warn({ err: err.message }, 'AI doubt answering failed, using fallback');
      }
    }

    if (!answerText) {
      answerText = answerDoubtFallback({ anchorConcept: concept, studentQuestion: question });
      answerSource = 'fallback';
    }

    // Save assistant message
    const assistantMsg = await addDoubtMessage(client, {
      threadId: thread.id,
      role: 'assistant',
      content: answerText,
      source: answerSource,
    });

    return { thread, userMsg, assistantMsg, answerSource };
  });

  return {
    threadId: result.thread.id,
    question,
    answer: result.assistantMsg.content,
    source: result.answerSource,
    createdAt: result.assistantMsg.created_at,
  };
}

export async function getDoubtHistory(sessionConceptId, userId) {
  const thread = await getThreadForConcept(sessionConceptId, userId);
  if (!thread) return { messages: [] };
  return {
    threadId: thread.id,
    messages: thread.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      source: m.source,
      createdAt: m.created_at,
    })),
  };
}
