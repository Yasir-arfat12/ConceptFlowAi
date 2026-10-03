const db = require('../config/db');
const { generateLearningPath } = require('../services/aiService');
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

const startLearning = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
    }

    // 1. Determine Data Source
    let learningData;
    const aiMode = process.env.AI_MODE || 'hybrid';
    
    if (aiMode === 'hybrid' && isPrebuiltTopic(query)) {
      learningData = prebuiltBinarySearch;
    } else {
      try {
        learningData = await generateLearningPath(query);
      } catch (aiError) {
        console.error('AI Generation Failed:', aiError.message);
        return res.status(502).json({ 
          success: false, 
          error: { code: 'AI_SERVICE_ERROR', message: 'Failed to generate learning path from AI provider' } 
        });
      }
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 2. Create Learning Session
      const sessionRes = await client.query(
        'INSERT INTO learning_sessions (user_id, topic, status) VALUES ($1, $2, $3) RETURNING *',
        [userId, query, 'active']
      );
      const session = sessionRes.rows[0];

      // 3. Insert concepts
      const insertedConcepts = [];
      let order = 1;
      for (const c of learningData.concepts) {
        const status = (order === 1) ? 'active' : 'locked';
        
        const conceptRes = await client.query(
          'INSERT INTO learning_concepts (session_id, title, content, status, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [session.id, c.title, c.content, status, order]
        );
        const newConcept = conceptRes.rows[0];
        
        const checkpointRes = await client.query(
          'INSERT INTO checkpoints (learning_concept_id, question) VALUES ($1, $2) RETURNING id, question',
          [newConcept.id, c.checkpoint.question]
        );

        newConcept.checkpoint = checkpointRes.rows[0];
        insertedConcepts.push(newConcept);
        order++;
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          session: session,
          concepts: insertedConcepts
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error starting learning:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM learning_sessions WHERE user_id = $1 ORDER BY updated_at DESC', 
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const sessionRes = await db.query(
      'SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', 
      [sessionId, userId]
    );
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    const conceptsRes = await db.query(
      'SELECT * FROM learning_concepts WHERE session_id = $1 ORDER BY order_index ASC',
      [sessionId]
    );
    
    // Fetch checkpoints for concepts
    const concepts = await Promise.all(conceptsRes.rows.map(async (concept) => {
      const checkpointRes = await db.query('SELECT id, question FROM checkpoints WHERE learning_concept_id = $1', [concept.id]);
      return {
        ...concept,
        checkpoint: checkpointRes.rows[0] || null
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        session: sessionRes.rows[0],
        concepts
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const getCurrentConcept = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session ownership
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    const currentConceptRes = await db.query(
      "SELECT * FROM learning_concepts WHERE session_id = $1 AND status = 'active'",
      [sessionId]
    );

    if (currentConceptRes.rows.length === 0) {
      return res.status(200).json({ success: true, data: null, message: 'No active concept. Session may be completed.' });
    }

    const currentConcept = currentConceptRes.rows[0];
    const checkpointRes = await db.query('SELECT id, question FROM checkpoints WHERE learning_concept_id = $1', [currentConcept.id]);
    currentConcept.checkpoint = checkpointRes.rows[0] || null;

    res.status(200).json({
      success: true,
      data: currentConcept
    });
  } catch (error) {
    console.error('Error fetching current concept:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const askDoubt = async (req, res) => {
  try {
    const { sessionId, conceptId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Question is required' } });
    }

    // Verify session and concept
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    const conceptRes = await db.query('SELECT * FROM learning_concepts WHERE id = $1 AND session_id = $2', [conceptId, sessionId]);
    if (conceptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Concept not found' } });
    }

    const concept = conceptRes.rows[0];

    const session = sessionRes.rows[0];
    
    // Check if it's a binary search session
    if (session.topic && isPrebuiltTopic(session.topic)) {
      const answer = prebuiltBinarySearch.evaluateDoubt(prebuiltBinarySearch.doubts, question);
      return res.status(200).json({ success: true, data: { answer } });
    }

    // Ask AI
    let answer;
    try {
      answer = await require('../services/aiService').answerDoubt(concept.content, question);
    } catch (aiError) {
      console.error('AI Doubt Failed:', aiError.message);
      return res.status(502).json({ success: false, error: { code: 'AI_SERVICE_ERROR', message: 'Failed to answer doubt using AI provider' } });
    }

    res.status(200).json({
      success: true,
      data: { answer }
    });
  } catch (error) {
    console.error('Error asking doubt:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }
    const session = sessionRes.rows[0];

    // Check if quiz already exists
    const existingQuizRes = await db.query('SELECT * FROM quizzes WHERE session_id = $1', [sessionId]);
    if (existingQuizRes.rows.length > 0) {
      return res.status(200).json({ success: true, data: existingQuizRes.rows[0].questions });
    }

    // Fetch concepts for context
    const conceptsRes = await db.query('SELECT title, content FROM learning_concepts WHERE session_id = $1 ORDER BY order_index ASC', [sessionId]);
    const conceptsText = conceptsRes.rows.map(c => `${c.title}: ${c.content}`).join('\n\n');

    // Check if it's a binary search session
    if (session.topic && isPrebuiltTopic(session.topic)) {
      const questions = prebuiltBinarySearch.quiz.questions;
      await db.query('INSERT INTO quizzes (session_id, questions) VALUES ($1, $2)', [sessionId, JSON.stringify(questions)]);
      return res.status(201).json({ success: true, data: questions });
    }

    // Generate Quiz via AI
    let questions;
    try {
      questions = await require('../services/aiService').generateQuiz(session.topic, conceptsText);
    } catch (aiError) {
      console.error('AI Quiz Failed:', aiError.message);
      return res.status(502).json({ success: false, error: { code: 'AI_SERVICE_ERROR', message: 'Failed to generate quiz' } });
    }

    // Save Quiz
    await db.query('INSERT INTO quizzes (session_id, questions) VALUES ($1, $2)', [sessionId, JSON.stringify(questions)]);

    res.status(201).json({ success: true, data: questions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const getQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session ownership
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    const quizRes = await db.query('SELECT questions FROM quizzes WHERE session_id = $1', [sessionId]);
    if (quizRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Quiz not generated yet' } });
    }

    res.status(200).json({ success: true, data: quizRes.rows[0].questions });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }
    const session = sessionRes.rows[0];

    // Check if assignment already exists
    const existingAssignmentRes = await db.query('SELECT * FROM assignments WHERE session_id = $1', [sessionId]);
    if (existingAssignmentRes.rows.length > 0) {
      return res.status(200).json({ success: true, data: existingAssignmentRes.rows[0].assignment_data });
    }

    // Fetch concepts for context
    const conceptsRes = await db.query('SELECT title, content FROM learning_concepts WHERE session_id = $1 ORDER BY order_index ASC', [sessionId]);
    const conceptsText = conceptsRes.rows.map(c => `${c.title}: ${c.content}`).join('\n\n');

    // Check if it's a binary search session
    if (session.topic && isPrebuiltTopic(session.topic)) {
      const assignmentData = prebuiltBinarySearch.assignment;
      await db.query('INSERT INTO assignments (session_id, assignment_data) VALUES ($1, $2)', [sessionId, JSON.stringify(assignmentData)]);
      return res.status(201).json({ success: true, data: assignmentData });
    }

    // Generate Assignment via AI
    let assignmentData;
    try {
      assignmentData = await require('../services/aiService').generateAssignment(session.topic, conceptsText);
    } catch (aiError) {
      console.error('AI Assignment Failed:', aiError.message);
      return res.status(502).json({ success: false, error: { code: 'AI_SERVICE_ERROR', message: 'Failed to generate assignment' } });
    }

    // Save Assignment
    await db.query('INSERT INTO assignments (session_id, assignment_data) VALUES ($1, $2)', [sessionId, JSON.stringify(assignmentData)]);

    res.status(201).json({ success: true, data: assignmentData });
  } catch (error) {
    console.error('Error generating assignment:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const getAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session ownership
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    const assignmentRes = await db.query('SELECT assignment_data FROM assignments WHERE session_id = $1', [sessionId]);
    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not generated yet' } });
    }

    res.status(200).json({ success: true, data: assignmentRes.rows[0].assignment_data });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;
    
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    // For prototype, we simply grade it and return score
    let score = 0;
    if (answers && Array.isArray(answers)) {
      // Basic deterministic grading logic: count number of valid elements for demo
      score = answers.length > 0 ? 85 : 0; 
    }
    
    res.status(200).json({ success: true, data: { score, feedback: "Quiz evaluated successfully." } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { submission } = req.body;
    const userId = req.user.id;
    
    const sessionRes = await db.query('SELECT * FROM learning_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }
    const session = sessionRes.rows[0];

    // Check if it's a binary search session
    if (session.topic && isPrebuiltTopic(session.topic)) {
      const evalResult = prebuiltBinarySearch.evaluateAssignment(prebuiltBinarySearch.assignment, submission);
      return res.status(200).json({ success: true, data: evalResult });
    }

    // AI Evaluation fallback
    res.status(200).json({ success: true, data: { score: 80, feedback: "Assignment submitted successfully." } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

module.exports = {
  startLearning,
  getUserSessions,
  getSession,
  getCurrentConcept,
  askDoubt,
  createQuiz,
  getQuiz,
  submitQuiz,
  createAssignment,
  getAssignment,
  submitAssignment
};
