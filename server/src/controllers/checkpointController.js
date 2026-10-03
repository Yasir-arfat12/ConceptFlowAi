const db = require('../config/db');
const { evaluateCheckpoint } = require('../services/aiService');
const prebuiltBinarySearch = require('../data/prebuiltBinarySearch');

const isPrebuiltTopic = (query) => {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized === 'binary search' || 
         normalized === 'teach me binary search' || 
         normalized === 'explain binary search' || 
         normalized === 'learn binary search' || 
         normalized === 'teach me the binary search algorithm' || 
         normalized === 'i want to learn binary search';
};

const submitAnswer = async (req, res) => {
  try {
    const { checkpointId } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;

    if (!answer) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Answer is required' } });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verify checkpoint exists
      const checkpointRes = await client.query('SELECT * FROM checkpoints WHERE id = $1', [checkpointId]);
      if (checkpointRes.rows.length === 0) {
        throw { status: 404, message: 'Checkpoint not found' };
      }
      const checkpoint = checkpointRes.rows[0];

      // Fetch the concept to pass as reference
      const conceptRes = await client.query('SELECT * FROM learning_concepts WHERE id = $1', [checkpoint.learning_concept_id]);
      const currentConcept = conceptRes.rows[0];

      // Check if session is a binary search session
      const sessionRes = await client.query('SELECT topic, user_id FROM learning_sessions WHERE id = $1', [currentConcept.session_id]);
      if (String(sessionRes.rows[0].user_id) !== String(userId)) {
        throw { status: 403, message: 'Unauthorized access to this session' };
      }
      const sessionTopic = sessionRes.rows[0].topic;

      // 2. Evaluation
      let evaluation;
      if (isPrebuiltTopic(sessionTopic)) {
         // Determine which checkpoint keywords to pass
         const checkpointConcept = prebuiltBinarySearch.concepts.find(c => c.title === currentConcept.title);
         const expectedKeywords = checkpointConcept ? checkpointConcept.checkpoint.expectedKeywords : [];
         evaluation = prebuiltBinarySearch.evaluateCheckpoint(checkpoint.question, answer, expectedKeywords);
      } else {
        try {
          evaluation = await evaluateCheckpoint(checkpoint.question, answer, currentConcept.content);
        } catch (aiError) {
          console.error('AI Evaluation Failed:', aiError.message);
          throw { status: 502, message: 'Failed to evaluate answer using AI provider' };
        }
      }

      const { score, isCorrect, feedback } = evaluation;

      // 3. Store response
      await client.query(
        'INSERT INTO checkpoint_responses (checkpoint_id, user_id, answer, score, is_correct, feedback) VALUES ($1, $2, $3, $4, $5, $6)',
        [checkpointId, userId, answer, score, isCorrect, feedback]
      );

      // 4. Update concept states
      if (currentConcept.status === 'active') {
        // Mark current as completed
        await client.query("UPDATE learning_concepts SET status = 'completed' WHERE id = $1", [currentConcept.id]);

        // Find next concept
        const nextConceptRes = await client.query(
          "SELECT id FROM learning_concepts WHERE session_id = $1 AND order_index = $2",
          [currentConcept.session_id, currentConcept.order_index + 1]
        );

        if (nextConceptRes.rows.length > 0) {
          // Mark next as active
          await client.query("UPDATE learning_concepts SET status = 'active' WHERE id = $1", [nextConceptRes.rows[0].id]);
        } else {
          // Complete session if no next concept
          await client.query("UPDATE learning_sessions SET status = 'completed' WHERE id = $1", [currentConcept.session_id]);
        }
      }

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        data: {
          score,
          feedback,
          isCorrect,
          nextConceptActivated: true
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      if (err.status) {
        return res.status(err.status).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

module.exports = {
  submitAnswer
};
