// src/controllers/authController.js
import { z } from 'zod';
import { register, login, getMe } from '../services/authService.js';
import { asyncHandler, ok } from '../utils/errors.js';

const RegisterSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8),
    age: z.union([z.string(), z.number()]).optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
  }),
});

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const result = await register({ firstName, lastName, email, password });
  return ok(res, result, 201);
});

export const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await login({ email, password });
  return ok(res, result);
});

export const me = asyncHandler(async (req, res) => {
  const result = await getMe(req.userId);
  return ok(res, result);
});

export { RegisterSchema, LoginSchema };
