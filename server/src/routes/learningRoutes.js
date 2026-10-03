const express = require('express');
const {
  startLearning,
  getUserSessions,
  getSession,
  getCurrentConcept,
  getConcept,
  createQuiz,
  getQuiz,
  submitQuiz,
  createAssignment,
  getAssignment,
  submitAssignment,
} = require('../controllers/learningController');
const { getCheckpoints } = require('../controllers/checkpointController');
const { askDoubt, getDoubts, handleTutorQuestion } = require('../controllers/doubtController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Direct tutor client integration (optional auth)
router.post('/tutor', handleTutorQuestion);

// Session management
router.post('/start',                           authenticate, startLearning);
router.get('/',                                 authenticate, getUserSessions);
router.get('/:sessionId',                       authenticate, getSession);
router.get('/:sessionId/current',               authenticate, getCurrentConcept);

// Concept-level
router.get('/:sessionId/concepts/:conceptId',             authenticate, getConcept);
router.get('/:sessionId/concepts/:conceptId/checkpoints', authenticate, getCheckpoints);

// Doubts (contextual, concept-anchored, does NOT modify learning state)
router.get('/:sessionId/concepts/:conceptId/doubts',  authenticate, getDoubts);
router.post('/:sessionId/concepts/:conceptId/doubt',  authenticate, askDoubt);

// Quiz
router.post('/:sessionId/quiz',        authenticate, createQuiz);
router.get('/:sessionId/quiz',         authenticate, getQuiz);
router.post('/:sessionId/quiz/submit', authenticate, submitQuiz);

// Assignment
router.post('/:sessionId/assignment',        authenticate, createAssignment);
router.get('/:sessionId/assignment',         authenticate, getAssignment);
router.post('/:sessionId/assignment/submit', authenticate, submitAssignment);

module.exports = router;
