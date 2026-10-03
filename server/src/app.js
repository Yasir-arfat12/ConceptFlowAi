const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const learningRoutes = require('./routes/learningRoutes');
const checkpointRoutes = require('./routes/checkpointRoutes');
const progressRoutes = require('./routes/progressRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const db = require('./config/db');
let cookieParser;
try {
  cookieParser = require('cookie-parser');
} catch (e) {
  cookieParser = () => (req, res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        req.cookies[parts[0].trim()] = decodeURIComponent((parts[1] || '').trim());
      });
    }
    next();
  };
}

const app = express();

// Security Middleware
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiLimiter);

const { handleTutorQuestion } = require('./controllers/doubtController');

// Routes
app.post('/api/tutor', handleTutorQuestion);
app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'ok', 
      dbTime: result.rows[0].now, 
      message: 'Backend and Database are healthy' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed' 
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    }
  });
});

module.exports = app;
