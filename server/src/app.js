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
const cookieParser = require('cookie-parser');

const app = express();

// Security Middleware
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiLimiter);

// Routes
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
