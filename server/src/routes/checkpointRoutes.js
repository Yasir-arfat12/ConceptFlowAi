const express = require('express');
const { submitAnswer } = require('../controllers/checkpointController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:checkpointId/answer', authenticate, submitAnswer);

module.exports = router;
