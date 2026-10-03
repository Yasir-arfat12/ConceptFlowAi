import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); window.localStorage.clear(); });

window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
global.fetch = vi.fn().mockImplementation(async (url) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: { id: 'mock-user-id', name: 'Alex', email: 'a@b.co' },
        session: { id: 'mock-session-id', concepts: [] },
        topics: [],
        stats: { streak: 12, topicsStarted: 1, topicsCompleted: 0, conceptsCompleted: 0, avgScore: 100 },
        progress: [],
      },
    }),
  };
});

