const express = require('express');
const { getProgress } = require('../controllers/progressController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getProgress);

module.exports = router;
