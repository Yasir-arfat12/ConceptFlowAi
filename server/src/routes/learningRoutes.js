const express = require('express');
const {
  startLearning,
  getLearningPreview,
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
  submitAssignmentAnswer,
  startOrResumeAssignmentAttempt,
  getLatestAssignment,
  getUserAssignments,
  getUserQuizzes,
} = require('../controllers/learningController');
const { getCheckpoints } = require('../controllers/checkpointController');
const { askDoubt, getDoubts, handleTutorQuestion } = require('../controllers/doubtController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Direct tutor client integration (optional auth)
router.post('/tutor', handleTutorQuestion);

// Topic preview / curriculum validation (optional auth, before /:sessionId)
router.get('/preview', getLearningPreview);

// Session management & User-level aggregates (MUST precede /:sessionId)
router.post('/start',                           authenticate, startLearning);
router.get('/',                                 authenticate, getUserSessions);
router.get('/sessions',                         authenticate, getUserSessions);
router.get('/assignments/latest',               authenticate, getLatestAssignment);
router.get('/assignments',                      authenticate, getUserAssignments);
router.get('/quizzes',                          authenticate, getUserQuizzes);

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
router.post('/:sessionId/assignment',         authenticate, createAssignment);
router.get('/:sessionId/assignment',          authenticate, getAssignment);
router.post('/:sessionId/assignment/attempt', authenticate, startOrResumeAssignmentAttempt);
router.post('/:sessionId/assignment/answer',  authenticate, submitAssignmentAnswer);
router.post('/:sessionId/assignment/submit',  authenticate, submitAssignment);

module.exports = router;

