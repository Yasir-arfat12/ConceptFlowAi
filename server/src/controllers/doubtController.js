// src/controllers/doubtController.js
import { z } from 'zod';
import { askDoubt, getDoubtHistory } from '../services/doubtService.js';
import { asyncHandler, ok } from '../utils/errors.js';

export const AskSchema = z.object({
  body: z.object({
    question: z.string().min(1).max(2000),
  }),
  params: z.object({
    sessionId: z.string().uuid(),
    conceptId: z.string().uuid(),
  }),
});

export const askDoubtHandler = asyncHandler(async (req, res) => {
  const { sessionId, conceptId } = req.params;
  const { question } = req.body;
  const result = await askDoubt({ sessionId, conceptId, userId: req.userId, question });
  return ok(res, result);
});

export const getHistory = asyncHandler(async (req, res) => {
  const { conceptId } = req.params;
  const result = await getDoubtHistory(conceptId, req.userId);
  return ok(res, result);
});
