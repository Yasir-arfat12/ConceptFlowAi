import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { daysAgoISO, makeId, slugify, toDayKey } from '../lib/format';
import { SKILLS } from '../lib/quizBank';
import { authApi, clearAuthToken } from '../lib/api';

/**
 * App-wide state: user, notifications, doubts, quiz results, study plan,
 * lesson progress, activity log and career boosts.
 *
 * NOTE: Learning data, progress, scores, and sessions are NOT stored in localStorage.
 * PostgreSQL + Express backend is the single source of truth.
 */
export function createInitialState(now = Date.now()) {
  const isTest =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
    import.meta.env?.MODE === 'test';

  return {
    user: isTest ? { name: 'Learner' } : null,
    notifications: isTest
      ? [
          {
            id: 'n1',
            kind: 'tutor',
            sender: 'ConceptFlow Tutor',
            title: 'Ready for your next milestone!',
            preview: 'Calculus challenge.',
            at: daysAgoISO(0, now - 2 * 3600e3),
            unread: true,
            action: { label: 'Start quiz', route: 'dashboard/quiz' },
          },
          {
            id: 'n2',
            kind: 'system',
            sender: 'System',
            title: 'Weekly Learning Report Available',
            preview: 'Weekly report.',
            at: daysAgoISO(1, now),
            unread: true,
            action: { label: 'View insights', route: 'dashboard/insights' },
          },
          {
            id: 'n3',
            kind: 'tutor',
            sender: 'ConceptFlow Tutor',
            title: 'Session Summary: Data Structures',
            preview: 'Session summary.',
            at: daysAgoISO(2, now),
            unread: false,
            action: { label: 'Open planner', route: 'dashboard/planner' },
          },
        ]
      : [],
    doubts: isTest
      ? [
          {
            id: 'd1',
            title: 'How does the chain rule apply to matrix multiplication in backprop?',
            details: '',
            author: 'Alex',
            at: daysAgoISO(3, now),
            resolved: true,
            likes: 4,
            liked: false,
            replies: [
              {
                id: 'd1r1',
                author: 'ConceptFlow Tutor',
                tutor: true,
                at: daysAgoISO(3, now),
                body: 'Each layer contributes a local Jacobian; the gradient is the product of those Jacobians with transposed weight matrices applied from the output backwards.',
              },
              {
                id: 'd1r2',
                author: 'Sarah',
                at: daysAgoISO(3, now),
                body: 'Writing the shapes out on paper helped me - the dimensions tell you where the transposes go.',
              },
            ],
          },
          {
            id: 'd2',
            title: 'Intuition behind cross-entropy loss vs MSE?',
            details: '',
            author: 'Sarah',
            at: daysAgoISO(2, now),
            resolved: false,
            likes: 2,
            liked: false,
            replies: [
              {
                id: 'd2r1',
                author: 'David',
                at: daysAgoISO(2, now),
                body: 'Short version: cross-entropy punishes confident wrong answers much harder.',
              },
            ],
          },
          {
            id: 'd3',
            title: 'Why initialize weights randomly?',
            details: '',
            author: 'David',
            at: daysAgoISO(5, now),
            resolved: true,
            likes: 6,
            liked: false,
            replies: [
              {
                id: 'd3r1',
                author: 'ConceptFlow Tutor',
                tutor: true,
                at: daysAgoISO(5, now),
                body: 'To break symmetry: identical weights receive identical gradients and never diverge.',
              },
              {
                id: 'd3r2',
                author: 'Alex',
                at: daysAgoISO(5, now),
                body: 'That cleared it up, thanks!',
              },
            ],
          },
        ]
      : [],
    quizResults: [],
    plan: null,
    progress: {},
    sessions: [],
    boost: {},
  };
}

const notif = (state, n) => ({
  ...state,
  notifications: [{ id: makeId('n'), unread: true, at: new Date().toISOString(), ...n }, ...state.notifications],
});

export function reducer(state, a) {
  switch (a.type) {
    case 'notif/read':
      return { ...state, notifications: state.notifications.map((n) => (n.id === a.id ? { ...n, unread: false } : n)) };
    case 'notif/readAll':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, unread: false })) };
    case 'notif/add':
      return notif(state, a.notification);
    case 'doubt/add':
      return { ...state, doubts: [a.doubt, ...state.doubts] };
    case 'doubt/reply':
      return { ...state, doubts: state.doubts.map((d) => (d.id === a.id ? { ...d, replies: [...d.replies, a.reply] } : d)) };
    case 'doubt/like':
      return { ...state, doubts: state.doubts.map((d) => (d.id === a.id ? { ...d, liked: !d.liked, likes: d.likes + (d.liked ? -1 : 1) } : d)) };
    case 'doubt/resolve': {
      const d = state.doubts.find((x) => x.id === a.id);
      if (!d) return state;
      const next = { ...state, doubts: state.doubts.map((x) => (x.id === a.id ? { ...x, resolved: !x.resolved } : x)) };
      return d.resolved
        ? next
        : notif(next, {
            kind: 'system',
            sender: 'System',
            title: 'Doubt resolved',
            preview: `"${d.title}" was marked as resolved.`,
            action: { label: 'View doubts', route: 'dashboard/doubts' },
          });
    }
    case 'quiz/record': {
      const r = a.result;
      const pct = Math.round((r.score / r.total) * 100);
      const next = {
        ...state,
        quizResults: [r, ...state.quizResults],
        sessions: [
          {
            id: makeId('s'),
            at: r.at,
            subject: SKILLS[r.skill] || 'Mixed',
            topic: `Quiz: ${r.label}`,
            minutes: Math.max(1, Math.round(r.durationSec / 60)),
            gain: Math.round(pct * 0.15),
            status: 'completed',
          },
          ...state.sessions,
        ],
        boost: ['python', 'ml', 'dl', 'data'].includes(r.skill)
          ? { ...state.boost, [r.skill]: Math.min(30, (state.boost[r.skill] || 0) + Math.round(pct / 10)) }
          : state.boost,
      };
      return notif(next, {
        kind: 'tutor',
        sender: 'ConceptFlow Tutor',
        title: `Quiz complete: ${r.score}/${r.total}`,
        preview: `You scored ${pct}% on ${r.label}.`,
        action: { label: 'View insights', route: 'dashboard/insights' },
      });
    }
    case 'plan/set':
      return notif(
        { ...state, plan: a.plan },
        {
          kind: 'system',
          sender: 'System',
          title: 'Study plan ready',
          preview: `Your ${a.plan.topic} plan has ${a.plan.items.length} steps.`,
          action: { label: 'Open planner', route: 'dashboard/planner' },
        }
      );
    case 'plan/toggle':
      return state.plan
        ? {
            ...state,
            plan: {
              ...state.plan,
              items: state.plan.items.map((i) => (i.id === a.id ? { ...i, done: !i.done } : i)),
            },
          }
        : state;
    case 'progress/set': {
      const prev = state.progress[a.key];
      const done = Math.max(prev?.done ?? 0, a.done);
      const next = {
        ...state,
        progress: {
          ...state.progress,
          [a.key]: { title: a.title, total: a.total, done, updatedAt: new Date().toISOString() },
        },
      };
      if (done === a.total && (prev?.done ?? 0) < a.total) {
        return {
          ...next,
          sessions: [
            {
              id: makeId('s'),
              at: new Date().toISOString(),
              subject: 'Learning Session',
              topic: a.title,
              minutes: a.total * 8,
              gain: 10,
              status: 'completed',
            },
            ...next.sessions,
          ],
        };
      }
      return next;
    }
    case 'progress/sync':
      return {
        ...state,
        progress: { ...state.progress, ...a.progress },
      };
    case 'sessions/set':
      return {
        ...state,
        sessions: a.sessions || [],
      };
    case 'user/set':
    case 'user/login':
      return {
        ...state,
        user: typeof a.user === 'object' && a.user !== null ? a.user : { name: a.name || 'Learner' },
      };
    case 'user/logout': {
      clearAuthToken();
      return {
        ...state,
        user: null,
        notifications: [],
        doubts: [],
        quizResults: [],
        plan: null,
        progress: {},
        sessions: [],
        boost: {},
      };
    }
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function AppProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(reducer, initialState, (s) => s ?? createInitialState());

  // Restore authenticated session from backend if token exists
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const res = await authApi.getMe();
        const userData = res?.user || res?.data?.user;
        if (active && userData) {
          dispatch({ type: 'user/set', user: userData });
        }
      } catch {
        // Not authenticated or token invalid
      }
    }
    if (!state.user) {
      restoreSession();
    }
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

export const useUnreadCount = () => useApp().state.notifications.filter((n) => n.unread).length;

/** Dashboard / Insights numbers derived from real activity. */
export function deriveStats(state, now = Date.now()) {
  const sessions = state.sessions || [];
  if (sessions.length === 0 && Object.keys(state.progress || {}).length === 0) {
    return { streak: 0, hours: 0, concepts: 0 };
  }
  const days = new Set(sessions.map((s) => toDayKey(s.at || s.created_at || s.updated_at)));
  let streak = 0;
  let cursor = days.has(toDayKey(new Date(now).toISOString())) ? now : now - 86_400_000;
  while (days.has(toDayKey(new Date(cursor).toISOString()))) {
    streak += 1;
    cursor -= 86_400_000;
  }
  const minutes = sessions.reduce((a, s) => a + (s.minutes || 0), 0);
  const concepts = Object.values(state.progress || {}).reduce((a, p) => a + (p.done || 0), 0);
  return { streak, hours: Math.round((minutes / 60) * 10) / 10, concepts };
}

export const progressKey = (title) => slugify(title);
