/**
 * ConceptFlow API Client
 * Centralized communication with the Express backend.
 * Uses PostgreSQL as the single source of truth.
 *
 * Auth token is read from localStorage ('conceptflow_token') and included in Authorization headers.
 * Learning data and progress are NEVER stored in localStorage.
 */

const getApiBase = () => {
  return (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
};

export const getAuthToken = () => {
  try {
    return localStorage.getItem('conceptflow_token') || null;
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('conceptflow_token', token);
    } else {
      localStorage.removeItem('conceptflow_token');
    }
  } catch {
    // storage unavailable
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem('conceptflow_token');
  } catch {
    // storage unavailable
  }
};

export async function apiRequest(endpoint, options = {}) {
  const base = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  const res = await fetch(url, config);

  if (res.status === 401) {
    // If unauthorized, token might be expired
    clearAuthToken();
  }

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const errorMsg =
      typeof data?.error === 'string'
        ? data.error
        : data?.error?.message || data?.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.code = data?.error?.code;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth API ─────────────────────────────────────────────────────────────

export const authApi = {
  async getMe() {
    return apiRequest('/api/auth/me');
  },
  async login(credentials) {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const token = data?.token || data?.data?.token;
    if (token) setAuthToken(token);
    return data;
  },
  async register(payload) {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const token = data?.token || data?.data?.token;
    if (token) setAuthToken(token);
    return data;
  },
  async logout() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },
};

// ─── Dashboard API ────────────────────────────────────────────────────────

export const dashboardApi = {
  async getDashboard() {
    return apiRequest('/api/dashboard');
  },
};

// ─── Progress API ─────────────────────────────────────────────────────────

export const progressApi = {
  async getProgress() {
    return apiRequest('/api/progress');
  },
};

// ─── Learning API ─────────────────────────────────────────────────────────

export const learningApi = {
  /**
   * Starts a new learning session for a given topic.
   * Creates records in PostgreSQL (session, concepts, checkpoints).
   */
  async startSession(topic) {
    return apiRequest('/api/learning/start', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
  },

  /**
   * Retrieves all sessions for the authenticated user.
   */
  async getSessions() {
    return apiRequest('/api/learning/sessions');
  },

  /**
   * Retrieves a specific session and all its concepts from PostgreSQL.
   */
  async getSession(sessionId) {
    return apiRequest(`/api/learning/${sessionId}`);
  },

  /**
   * Retrieves the current active concept for a session.
   */
  async getCurrentConcept(sessionId) {
    return apiRequest(`/api/learning/${sessionId}/current`);
  },

  /**
   * Retrieves a specific concept with checkpoints.
   */
  async getConcept(sessionId, conceptId) {
    return apiRequest(`/api/learning/${sessionId}/concepts/${conceptId}`);
  },

  /**
   * Retrieves checkpoints for a concept.
   */
  async getCheckpoints(sessionId, conceptId) {
    return apiRequest(`/api/learning/${sessionId}/concepts/${conceptId}/checkpoints`);
  },

  /**
   * Submits a student's answer to a checkpoint.
   * Backend evaluates, stores score in DB, unlocks next concept, updates progress.
   */
  async submitAnswer(checkpointId, answer) {
    return apiRequest(`/api/checkpoints/${checkpointId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  /**
   * Doubts anchored to a concept.
   */
  async getDoubts(sessionId, conceptId) {
    return apiRequest(`/api/learning/${sessionId}/concepts/${conceptId}/doubts`);
  },
  async askDoubt(sessionId, conceptId, message) {
    return apiRequest(`/api/learning/${sessionId}/concepts/${conceptId}/doubt`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  /**
   * Assignments
   */
  async getAssignments() {
    return apiRequest('/api/learning/assignments');
  },
  async createAssignment(sessionId) {
    return apiRequest(`/api/learning/${sessionId}/assignment`, { method: 'POST' });
  },
  async getAssignment(sessionId) {
    return apiRequest(`/api/learning/${sessionId}/assignment`);
  },
  async submitAssignment(sessionId, solution) {
    return apiRequest(`/api/learning/${sessionId}/assignment/submit`, {
      method: 'POST',
      body: JSON.stringify({ solution }),
    });
  },

  /**
   * Quizzes
   */
  async getQuizzes() {
    return apiRequest('/api/learning/quizzes');
  },
  async createQuiz(sessionId) {
    return apiRequest(`/api/learning/${sessionId}/quiz`, { method: 'POST' });
  },
  async getQuiz(sessionId) {
    return apiRequest(`/api/learning/${sessionId}/quiz`);
  },
  async submitQuiz(sessionId, answers) {
    return apiRequest(`/api/learning/${sessionId}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
};
