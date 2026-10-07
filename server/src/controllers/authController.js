/**
 * Auth Controller
 * Handles: register, login, getMe, logout
 * All responses use: { success, data } or { success, error }
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../config/db');
require('dotenv').config();

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function issueToken(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

const register = async (req, res) => {
  try {
    const rawName = typeof req.body.name === 'string'
      ? req.body.name.trim()
      : (req.body.firstName ? `${req.body.firstName} ${req.body.lastName || ''}`.trim() : '');

    const rawEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawPassword = typeof req.body.password === 'string' ? req.body.password : '';

    const payload = {
      name: rawName || 'Learner',
      email: rawEmail,
      password: rawPassword,
    };

    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error?.issues?.[0]?.message || parsed.error?.errors?.[0]?.message || 'Invalid registration details';
      return res.status(422).json({
        success: false,
        error: msg,
        message: msg,
        errorDetails: { code: 'VALIDATION_ERROR', message: msg },
      });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const msg = 'An account with this email already exists.';
      return res.status(409).json({
        success: false,
        error: msg,
        message: msg,
        errorDetails: { code: 'EMAIL_EXISTS', message: msg },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), normalizedEmail, passwordHash]
    );
    const user = result.rows[0];

    const token = issueToken(res, user.id);

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
      message: 'Registration failed. Please try again.',
      errorDetails: { code: 'SERVER_ERROR', message: err.message },
    });
  }
};

const login = async (req, res) => {
  try {
    const rawEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawPassword = typeof req.body.password === 'string' ? req.body.password : '';

    const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || parsed.error.errors?.[0]?.message || 'Invalid email or password.';
      return res.status(422).json({
        success: false,
        error: msg,
        message: msg,
        errorDetails: { code: 'VALIDATION_ERROR', message: msg },
      });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await db.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      const msg = 'Invalid email or password.';
      return res.status(401).json({
        success: false,
        error: msg,
        message: msg,
        errorDetails: { code: 'INVALID_CREDENTIALS', message: msg },
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const msg = 'Invalid email or password.';
      return res.status(401).json({
        success: false,
        error: msg,
        message: msg,
        errorDetails: { code: 'INVALID_CREDENTIALS', message: msg },
      });
    }

    const token = issueToken(res, user.id);

    return res.status(200).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      message: 'Login failed. Please try again.',
      errorDetails: { code: 'SERVER_ERROR', message: err.message },
    });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }
    return res.status(200).json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (err) {
    console.error('[Auth] GetMe error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve user information.' },
    });
  }
};

const logout = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0), sameSite: 'lax' });
  return res.status(200).json({ success: true, data: { message: 'Logged out successfully.' } });
};

module.exports = { register, login, getMe, logout };
