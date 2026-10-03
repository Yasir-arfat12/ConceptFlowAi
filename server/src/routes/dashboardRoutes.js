const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getDashboardData);

module.exports = router;
