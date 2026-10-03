// src/lib/api.js
// Central API service module. Attaches JWT, handles 401s, and provides typed helpers.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const TOKEN_KEY = 'conceptflow:token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    // Dispatch a global logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 });
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body?.error?.message || `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status, code: body?.error?.code });
  }

  return body?.data ?? body;
}

export const api = {
  // Auth
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Learning sessions
  startSession: (topic) => request('/learning/start', { method: 'POST', body: JSON.stringify({ topic }) }),
  getSessions: () => request('/learning'),
  getSession: (id) => request(`/learning/${id}`),
  getCurrentConcept: (sessionId) => request(`/learning/${sessionId}/current`),

  // Checkpoints
  answerCheckpoint: (checkpointId, answer) =>
    request(`/checkpoints/${checkpointId}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }),

  // Doubts
  askDoubt: (sessionId, conceptId, question) =>
    request(`/learning/${sessionId}/concept/${conceptId}/doubt`, { method: 'POST', body: JSON.stringify({ question }) }),
  getDoubtHistory: (sessionId, conceptId) =>
    request(`/learning/${sessionId}/concept/${conceptId}/doubt`),

  // Dashboard & progress
  getDashboard: () => request('/dashboard'),
  getProgress: () => request('/progress'),

  // Suggested topics
  getTopics: () => request('/topics'),

  // Health
  health: () => fetch(`${BASE_URL}/health`).then((r) => r.json()),
};
