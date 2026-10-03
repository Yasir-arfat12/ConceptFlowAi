const express = require('express');
const { startLearning, getUserSessions, getSession, getCurrentConcept, askDoubt, createQuiz, getQuiz, submitQuiz, createAssignment, getAssignment, submitAssignment } = require('../controllers/learningController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getUserSessions);
router.post('/start', authenticate, startLearning);
router.get('/:sessionId', authenticate, getSession);
router.get('/:sessionId/current', authenticate, getCurrentConcept);
router.post('/:sessionId/concept/:conceptId/doubt', authenticate, askDoubt);
router.post('/:sessionId/quiz', authenticate, createQuiz);
router.get('/:sessionId/quiz', authenticate, getQuiz);
router.post('/:sessionId/quiz/submit', authenticate, submitQuiz);
router.post('/:sessionId/assignment', authenticate, createAssignment);
router.get('/:sessionId/assignment', authenticate, getAssignment);
router.post('/:sessionId/assignment/submit', authenticate, submitAssignment);

module.exports = router;
