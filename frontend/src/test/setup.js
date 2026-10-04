import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {}
});

window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
window.matchMedia =
  window.matchMedia ||
  ((q) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect() {},
  beginPath() {},
  arc() {},
  fill() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  scale() {},
  createLinearGradient: () => ({ addColorStop() {} }),
});

let lastTopic = 'Binary Search';

// Mock fetch for Vitest jsdom unit tests
globalThis.fetch = vi.fn(async (url, opts) => {
  const urlStr = String(url);

  if (urlStr.includes('/api/auth/me')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        user: { id: 1, name: 'Learner', email: 'learner@example.com' },
        data: { user: { id: 1, name: 'Learner', email: 'learner@example.com' } },
      }),
    };
  }

  if (urlStr.includes('/api/dashboard')) {
    const stats = {
      conceptsCompleted: 0,
      totalConcepts: 0,
      assignmentsCompleted: 0,
      quizzesCompleted: 0,
      averageScore: 0,
      streakDays: 0,
      hoursLearned: 0,
    };
    const mastery = {
      overallScore: 0,
      masteryLabel: 'Not Started',
      breakdown: { mastered: 0, developing: 0, needsPractice: 0, notStarted: 0 },
      strongAreas: [],
      areasToImprove: [],
      allConcepts: [],
      trend: [],
      nextFocus: null,
      consistency: {
        days: [
          { date: '2026-10-04', dayName: 'Sun', active: false },
          { date: '2026-10-03', dayName: 'Sat', active: false },
          { date: '2026-10-02', dayName: 'Fri', active: false },
          { date: '2026-10-01', dayName: 'Thu', active: false },
          { date: '2026-09-30', dayName: 'Wed', active: false },
          { date: '2026-09-29', dayName: 'Tue', active: false },
          { date: '2026-09-28', dayName: 'Mon', active: false },
        ],
        activeDaysThisWeek: 0,
      },
      insight: 'Your mastery journey starts here. Start your first learning session to build your understanding profile.',
    };

    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        user: { id: 1, name: 'Learner', email: 'learner@example.com' },
        stats,
        mastery,
        activeSessions: [],
        recentSessions: [],
        activeSessionId: null,
        currentConcept: null,
        data: {
          user: { id: 1, name: 'Learner', email: 'learner@example.com' },
          stats,
          mastery,
          activeSessions: [],
          recentSessions: [],
          activeSessionId: null,
          currentConcept: null,
        },
      }),
    };
  }

  if (urlStr.includes('/api/learning/sessions') || urlStr.endsWith('/api/learning')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, data: { sessions: [] }, sessions: [] }),
    };
  }

  if (urlStr.includes('/api/learning/assignments')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, data: { assignments: [] }, assignments: [] }),
    };
  }

  if (urlStr.includes('/quiz/submit')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        data: {
          score: 80,
          percentage: 80,
          correct: 4,
          total: 5,
          masteryLabel: 'Strong Understanding',
          conceptBreakdown: [{ title: 'Binary Search Intuition', score: 85, status: 'Mastered' }],
          weakConcepts: [],
        },
      }),
    };
  }

  if (urlStr.includes('/quiz')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        data: {
          questions: [
            {
              id: 'q1',
              conceptTitle: 'Binary Search Intuition',
              question: 'How does binary search eliminate elements?',
              options: [
                { value: 'A', label: 'By halving the search space' },
                { value: 'B', label: 'Linear check' },
              ],
              correctOptionIndex: 0,
              correctAnswer: 'A',
              explanation: 'Halves the range each step.',
            },
          ],
        },
        questions: [
          {
            id: 'q1',
            conceptTitle: 'Binary Search Intuition',
            question: 'How does binary search eliminate elements?',
            options: [
              { value: 'A', label: 'By halving the search space' },
              { value: 'B', label: 'Linear check' },
            ],
            correctOptionIndex: 0,
            correctAnswer: 'A',
            explanation: 'Halves the range each step.',
          },
        ],
      }),
    };
  }

  if (urlStr.includes('/api/learning/start')) {
    const body = opts?.body ? (typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body) : {};
    const topic = body.topic || 'Binary Search';
    lastTopic = topic;
    let conceptTitle = 'How Binary Search Works';
    if (/photosynthesis/i.test(topic)) conceptTitle = 'Overview';
    else if (/quantum/i.test(topic)) conceptTitle = 'What is Entanglement?';

    return {
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        session: { id: 101, topic, progress_percentage: 0 },
        concepts: [
          {
            id: 201,
            title: conceptTitle,
            content: 'Binary search operates intuitively like looking up a word in a dictionary. The search space is cut in half after every step.',
            status: 'active',
            order_index: 2,
            checkpoints: [{ id: 301, question: 'What happens to the search space after each step?' }],
          },
          {
            id: 202,
            title: 'Binary Search Algorithm',
            content: 'Translating the binary search concept into code...',
            status: 'locked',
            order_index: 3,
            checkpoints: [{ id: 302, question: 'What is the time complexity?' }],
          },
          {
            id: 203,
            title: 'Complexity Analysis',
            content: 'Search space concept...',
            status: 'locked',
            order_index: 4,
            checkpoints: [{ id: 303, question: 'Question 4' }],
          },
        ],
      }),
    };
  }

  if (urlStr.includes('/api/learning/')) {
    let topic = lastTopic;
    if (urlStr.includes('topic=')) {
      try {
        topic = decodeURIComponent(urlStr.split('topic=')[1].split('&')[0]);
      } catch {}
    }
    let conceptTitle = 'How Binary Search Works';
    if (/photosynthesis/i.test(topic)) conceptTitle = 'Overview';
    else if (/quantum/i.test(topic)) conceptTitle = 'What is Entanglement?';

    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        session: { id: 101, topic, progress_percentage: 0 },
        concepts: [
          {
            id: 201,
            title: conceptTitle,
            content: 'Binary search operates intuitively like looking up a word in a dictionary. The search space is cut in half after every step.',
            status: 'active',
            order_index: 2,
            checkpoints: [{ id: 301, question: 'What happens to the search space after each step?' }],
          },
          {
            id: 202,
            title: 'Binary Search Algorithm',
            content: 'Translating the binary search concept into code...',
            status: 'locked',
            order_index: 3,
            checkpoints: [{ id: 302, question: 'What is the time complexity?' }],
          },
          {
            id: 203,
            title: 'Complexity Analysis',
            content: 'Search space concept...',
            status: 'locked',
            order_index: 4,
            checkpoints: [{ id: 303, question: 'Question 4' }],
          },
        ],
      }),
    };
  }

  if (urlStr.includes('/api/checkpoints/')) {
    const body = opts?.body ? JSON.parse(opts.body) : {};
    const passed = body.answer && body.answer.toLowerCase().includes('half');
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        score: passed ? 85 : 40,
        passed,
        conceptCompleted: passed,
        feedback: passed
          ? 'Correct! You understood the key principle.'
          : 'Not quite. Think about how the interval is divided.',
        isCorrect: passed,
        nextConceptId: 202,
      }),
    };
  }

  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true }),
  };
});
