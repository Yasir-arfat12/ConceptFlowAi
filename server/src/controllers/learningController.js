// src/controllers/learningController.js
import { z } from 'zod';
import {
  startLearningSession,
  getUserSessionList,
  getSession,
  getCurrentConceptForSession,
  answerCheckpoint,
  getDashboard,
  getProgress,
} from '../services/learningService.js';
import { asyncHandler, ok } from '../utils/errors.js';
import { getAllTopics } from '../repositories/topicRepo.js';

export const StartSchema = z.object({
  body: z.object({
    topic: z.string().min(1).max(500),
  }),
});

export const AnswerSchema = z.object({
  body: z.object({
    answer: z.string().min(1).max(5000),
  }),
  params: z.object({
    checkpointId: z.string().uuid(),
  }),
});

export const startSession = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  const session = await startLearningSession({ userId: req.userId, query: topic });
  return ok(res, { session }, 201);
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await getUserSessionList(req.userId);
  return ok(res, { sessions });
});

export const getSessionById = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await getSession(sessionId, req.userId);
  return ok(res, { session });
});

export const getCurrent = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await getCurrentConceptForSession(sessionId, req.userId);
  return ok(res, result);
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { checkpointId } = req.params;
  const { answer } = req.body;
  const result = await answerCheckpoint({ checkpointId, userId: req.userId, answer });
  return ok(res, result);
});

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.userId);
  return ok(res, data);
});

export const progress = asyncHandler(async (req, res) => {
  const data = await getProgress(req.userId);
  return ok(res, { sessions: data });
});

export const suggestedTopics = asyncHandler(async (_req, res) => {
  const topics = await getAllTopics();
  return ok(res, { topics: topics.map((t) => ({ slug: t.slug, title: t.title, description: t.description, difficulty: t.difficulty })) });
});
