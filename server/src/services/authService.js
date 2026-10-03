// src/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { findUserByEmail, createUser, findUserById } from '../repositories/userRepo.js';
import { conflict, unauthorized, notFound } from '../utils/errors.js';

export async function register({ firstName, lastName, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) throw conflict('Email already registered', 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 12);
  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || email.split('@')[0];
  const user = await createUser({ name, email, passwordHash });

  return { user: { id: user.id, name: user.name, email: user.email } };
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) throw unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw unauthorized('Invalid email or password');

  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

export async function getMe(userId) {
  const user = await findUserById(userId);
  if (!user) throw notFound('User not found');
  return { user };
}
