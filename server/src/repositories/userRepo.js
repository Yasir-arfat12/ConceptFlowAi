// src/repositories/userRepo.js
import { query } from '../db/pool.js';

export async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email.toLowerCase(), passwordHash]
  );
  return rows[0];
}
