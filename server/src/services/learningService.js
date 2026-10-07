/**
 * Learning Service
 * Core ConceptFlow business logic:
 * - Create learning sessions
 * - Manage concept state (active/locked/completed)
 * - Track progress
 * - Resume sessions
 *
 * PostgreSQL is the source of truth. AI provides content. Backend controls all state.
 */
const db = require('../config/db');
const {
  isPrebuiltTopic,
  getPrebuiltTopicData,
  resolvePrebuiltTopic,
} = require('../data/prebuiltTopics');
const { generateLearningPath, isConfigured: aiAvailable } = require('./aiService');

/**
 * Calculates progress percentage based on completed concepts.
 */
function calculateProgress(concepts) {
  if (!concepts || concepts.length === 0) return 0;
  const completed = concepts.filter((c) => c.status === 'completed').length;
  return Math.round((completed / concepts.length) * 100);
}

function createTopicFallback(topic) {
  const cleanTitle = (topic || 'Fundamentals').replace(/^teach me\s+/i, '').trim();
  return {
    topic: cleanTitle,
    concepts: [
      {
        title: `Introduction to ${cleanTitle}`,
        content: `${cleanTitle} is a foundational concept in software engineering and computer science. Understanding its core principles, terminology, and practical applications allows you to build robust, scalable solutions.`,
        examples: `// Core principles of ${cleanTitle}\nconsole.log('Mastering ${cleanTitle}');`,
        keyTakeaways: `• Foundational principles and terminology\n• Why ${cleanTitle} matters in modern systems\n• Real-world applications`,
        checkpoint: {
          question: `What is the primary purpose and advantage of using ${cleanTitle}?`,
          expectedKeywords: ['efficiency', 'solve', 'advantage', 'fundamental', 'application', 'structure', cleanTitle.toLowerCase().split(' ')[0]],
        },
      },
      {
        title: `${cleanTitle} Core Mechanisms and Logic`,
        content: `Deep dive into the operational mechanics of ${cleanTitle}. We analyze how data flows, how state transitions are maintained, and how invariants are preserved throughout execution.`,
        examples: `// Operational flow\nfunction analyzeMechanics() {\n  // Invariant verification\n}`,
        keyTakeaways: `• State transitions and invariant preservation\n• Algorithmic steps\n• Error boundaries and validation`,
        checkpoint: {
          question: `How does ${cleanTitle} maintain consistency and handle state transitions?`,
          expectedKeywords: ['state', 'transition', 'invariant', 'step', 'consistency', 'process'],
        },
      },
      {
        title: `Implementation and Edge Cases in ${cleanTitle}`,
        content: `Practical implementation details, boundary conditions, edge cases, and best practices. Handling null/empty inputs, large inputs, and preventing resource leaks.`,
        examples: `// Robust implementation with boundary checks\nif (!input) return default_state;`,
        keyTakeaways: `• Boundary condition analysis\n• Handling null, empty, or overflow states\n• Production-grade implementations`,
        checkpoint: {
          question: `What critical boundary or edge cases must be checked when implementing ${cleanTitle}?`,
          expectedKeywords: ['boundary', 'edge', 'empty', 'null', 'overflow', 'case', 'condition'],
        },
      },
      {
        title: `Time/Space Complexity and Advanced Applications`,
        content: `Analyzing computational complexity: best, average, and worst-case time and space complexity. Real-world architectural integrations and system design patterns.`,
        examples: `Time Complexity: O(n) or O(log n)\nSpace Complexity: O(1) auxiliary`,
        keyTakeaways: `• Complexity trade-offs\n• Scaling characteristics\n• Integration with larger architectures`,
        checkpoint: {
          question: `What are the computational complexity characteristics and trade-offs of ${cleanTitle}?`,
          expectedKeywords: ['complexity', 'time', 'space', 'scale', 'trade-off', 'performance', 'O('],
        },
      },
    ],
  };
}

/**
 * Creates a learning session in a transaction.
 * Returns the full session + concepts structure needed by the frontend.
 */
async function createLearningSession(userId, topic) {
  const AI_MODE = process.env.AI_MODE || 'hybrid';

  // Determine learning content source
  let learningData;

  const prebuilt = getPrebuiltTopicData(topic);
  if (prebuilt && (AI_MODE === 'prebuilt' || AI_MODE === 'hybrid')) {
    console.log(`[Learning] Using prebuilt content for: "${topic}" -> "${prebuilt.topic}"`);
    learningData = {
      topic: prebuilt.topic,
      concepts: prebuilt.concepts,
    };
  } else if (aiAvailable) {
    try {
      console.log(`[Learning] Generating AI learning path for: "${topic}"`);
      learningData = await generateLearningPath(topic);
    } catch (aiErr) {
      console.warn(`[Learning] AI generation failed (${aiErr.message}), using fallback for: "${topic}"`);
      learningData = createTopicFallback(topic);
    }
  } else {
    console.log(`[Learning] AI unconfigured, using fallback for: "${topic}"`);
    learningData = createTopicFallback(topic);
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create the session
    const sessionResult = await client.query(
      `INSERT INTO learning_sessions (user_id, topic, status, progress_percentage)
       VALUES ($1, $2, 'active', 0)
       RETURNING *`,
      [userId, learningData.topic || topic]
    );
    const session = sessionResult.rows[0];

    // 2. Insert all concepts (first = active, rest = locked)
    const insertedConcepts = [];
    for (let i = 0; i < learningData.concepts.length; i++) {
      const c = learningData.concepts[i];
      const status = i === 0 ? 'active' : 'locked';
      const orderIndex = i + 1;

      const conceptResult = await client.query(
        `INSERT INTO learning_concepts
          (session_id, title, content, examples, key_takeaways, order_index, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [session.id, c.title, c.content, c.examples || null, c.keyTakeaways || null, orderIndex, status]
      );
      const concept = conceptResult.rows[0];

      // 3. Insert checkpoint for this concept
      const cp = c.checkpoint;
      const checkpointResult = await client.query(
        `INSERT INTO checkpoints
          (learning_concept_id, question, expected_keywords, order_index)
         VALUES ($1, $2, $3, 1)
         RETURNING id, question, expected_keywords`,
        [concept.id, cp.question, JSON.stringify(cp.expectedKeywords || [])]
      );
      concept.checkpoints = checkpointResult.rows;

      insertedConcepts.push(concept);
    }

    // 4. Set current_concept_id to the first (active) concept
    const firstConcept = insertedConcepts[0];
    await client.query(
      'UPDATE learning_sessions SET current_concept_id = $1 WHERE id = $2',
      [firstConcept.id, session.id]
    );
    session.current_concept_id = firstConcept.id;

    await client.query('COMMIT');

    return {
      session,
      concepts: insertedConcepts,
      currentConcept: firstConcept,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Fetches a session with all its concepts and current state.
 */
async function getSessionWithConcepts(sessionId, userId) {
  const sessionResult = await db.query(
    'SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId]
  );
  if (sessionResult.rows.length === 0) return null;

  const session = sessionResult.rows[0];
  const conceptsResult = await db.query(
    `SELECT lc.*, 
      (SELECT json_agg(cp ORDER BY cp.order_index)
       FROM checkpoints cp
       WHERE cp.learning_concept_id = lc.id) AS checkpoints
     FROM learning_concepts lc
     WHERE lc.session_id = $1
     ORDER BY lc.order_index ASC`,
    [sessionId]
  );

  const concepts = conceptsResult.rows;
  const currentConcept = concepts.find((c) => c.status === 'active') || null;

  // Update progress
  const progress = calculateProgress(concepts);
  if (progress !== session.progress_percentage) {
    await db.query(
      'UPDATE learning_sessions SET progress_percentage = $1, updated_at = NOW() WHERE id = $2',
      [progress, sessionId]
    );
    session.progress_percentage = progress;
  }

  return { session, concepts, currentConcept };
}

/**
 * Marks a concept as completed and unlocks the next one.
 * Called by the checkpoint controller when concept passes.
 * Returns the updated state.
 */
async function completeConcept(client, concept, sessionId) {
  const now = new Date().toISOString();

  // Mark current concept as completed
  await client.query(
    `UPDATE learning_concepts
     SET status = 'completed', completed_at = $1
     WHERE id = $2`,
    [now, concept.id]
  );

  // Find and unlock next concept
  const nextResult = await client.query(
    `SELECT * FROM learning_concepts
     WHERE session_id = $1 AND order_index = $2`,
    [sessionId, concept.order_index + 1]
  );

  let nextConcept = null;
  let sessionCompleted = false;

  if (nextResult.rows.length > 0) {
    nextConcept = nextResult.rows[0];
    await client.query(
      "UPDATE learning_concepts SET status = 'active' WHERE id = $1",
      [nextConcept.id]
    );

    // Update session's current_concept_id
    await client.query(
      'UPDATE learning_sessions SET current_concept_id = $1, updated_at = NOW() WHERE id = $2',
      [nextConcept.id, sessionId]
    );
  } else {
    // No more concepts — session is complete
    await client.query(
      "UPDATE learning_sessions SET status = 'completed', updated_at = NOW() WHERE id = $1",
      [sessionId]
    );
    sessionCompleted = true;
  }

  // Recalculate progress
  const allConceptsResult = await client.query(
    "SELECT status FROM learning_concepts WHERE session_id = $1",
    [sessionId]
  );
  const allConcepts = allConceptsResult.rows;
  const progress = calculateProgress(allConcepts);
  await client.query(
    'UPDATE learning_sessions SET progress_percentage = $1 WHERE id = $2',
    [progress, sessionId]
  );

  return { nextConcept, sessionCompleted, progress };
}

module.exports = {
  createLearningSession,
  getSessionWithConcepts,
  completeConcept,
  isPrebuiltTopic,
  calculateProgress,
};
