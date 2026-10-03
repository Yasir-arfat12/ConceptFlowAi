// src/controllers/authController.js
import { z } from 'zod';
import { register, login, getMe } from '../services/authService.js';
import { asyncHandler, ok } from '../utils/errors.js';

const RegisterSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().optional(),
    age: z.union([z.string(), z.number()]).optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
  }),
});

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, name, email, password } = req.body;
  const result = await register({ firstName, lastName, name, email, password });
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
