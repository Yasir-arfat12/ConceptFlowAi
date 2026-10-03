import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { daysAgoISO, makeId, slugify, toDayKey } from '../lib/format';
import { SKILLS } from '../lib/quizBank';

/**
 * App-wide state: notifications, doubts, quiz results, study plan, lesson
 * progress, activity log and career boosts. Persisted to localStorage so the
 * refactored pages share data and survive refresh.
 */
const STORAGE_KEY = 'conceptflow:v2';

export function createInitialState(now = Date.now()) {
  const durations = [45, 80, 15, 55, 30, 40, 25, 60, 35, 50, 20, 45];
  return {
    user: { name: 'Alex' },
    notifications: [
      { id: 'n1', kind: 'tutor', sender: 'ConceptFlow Tutor', title: 'Ready for your next milestone!', preview: 'Your mastery in Advanced Mathematics has reached 45%. I have prepared a new set of challenges to test your knowledge on Calculus.', at: daysAgoISO(0, now - 2 * 3600e3), unread: true, action: { label: 'Start quiz', route: 'dashboard/quiz' } },
      { id: 'n2', kind: 'system', sender: 'System', title: 'Weekly Learning Report Available', preview: 'You spent 12 hours learning this week, up 15% from last week. Keep up the great work and check out your detailed insights.', at: daysAgoISO(1, now), unread: true, action: { label: 'View insights', route: 'dashboard/insights' } },
      { id: 'n3', kind: 'tutor', sender: 'ConceptFlow Tutor', title: 'Session Summary: Data Structures', preview: "We covered Trees, Graphs, and Hash Maps today. You struggled slightly with Graph Traversals, so I've added some review materials to your schedule.", at: daysAgoISO(2, now), unread: false, action: { label: 'Open planner', route: 'dashboard/planner' } },
      { id: 'n4', kind: 'alert', sender: 'System Alert', title: 'Upcoming Exam Watch Triggered', preview: 'Your Physics 101 final is in exactly 14 days. We have automatically adjusted your learning path to prioritize key formulas and mock tests.', at: daysAgoISO(20, now), unread: false, action: { label: 'Open planner', route: 'dashboard/planner' } },
    ],
    doubts: [
      { id: 'd1', title: 'How does the chain rule apply to matrix multiplication in backprop?', details: '', author: 'Alex', at: daysAgoISO(3, now), resolved: true, likes: 4, liked: false,
        replies: [{ id: 'd1r1', author: 'ConceptFlow Tutor', tutor: true, at: daysAgoISO(3, now), body: 'Each layer contributes a local Jacobian; the gradient is the product of those Jacobians with transposed weight matrices applied from the output backwards.' }, { id: 'd1r2', author: 'Sarah', at: daysAgoISO(3, now), body: 'Writing the shapes out on paper helped me - the dimensions tell you where the transposes go.' }] },
      { id: 'd2', title: 'Intuition behind cross-entropy loss vs MSE?', details: '', author: 'Sarah', at: daysAgoISO(2, now), resolved: false, likes: 2, liked: false,
        replies: [{ id: 'd2r1', author: 'David', at: daysAgoISO(2, now), body: 'Short version: cross-entropy punishes confident wrong answers much harder.' }] },
      { id: 'd3', title: 'Why initialize weights randomly?', details: '', author: 'David', at: daysAgoISO(5, now), resolved: true, likes: 6, liked: false,
        replies: [{ id: 'd3r1', author: 'ConceptFlow Tutor', tutor: true, at: daysAgoISO(5, now), body: 'To break symmetry: identical weights receive identical gradients and never diverge.' }, { id: 'd3r2', author: 'Alex', at: daysAgoISO(5, now), body: 'That cleared it up, thanks!' }] },
    ],
    quizResults: [],
    plan: null,
    progress: {
      'binary-search': { title: 'Binary Search', done: 1, total: 4, updatedAt: daysAgoISO(2, now) },
      'neural-networks': { title: 'Neural Networks', done: 3, total: 4, updatedAt: daysAgoISO(1, now) },
    },
    sessions: durations.map((min, i) => ({
      id: `s${i}`, at: daysAgoISO(i + 1, now), subject: ['Advanced Mathematics', 'Computer Science', 'Physics 101', 'History'][i % 4],
      topic: ['Calculus: Derivatives', 'Data Structures: Trees', 'Kinematics', 'The Industrial Revolution'][i % 4], minutes: min,
      gain: i === 2 ? 0 : [12, 8, 0, 15, 5][i % 5] || 5, status: i === 2 ? 'abandoned' : 'completed',
    })),
    boost: {},
  };
}

const notif = (state, n) => ({ ...state, notifications: [{ id: makeId('n'), unread: true, at: new Date().toISOString(), ...n }, ...state.notifications] });

export function reducer(state, a) {
  switch (a.type) {
    case 'notif/read': return { ...state, notifications: state.notifications.map((n) => (n.id === a.id ? { ...n, unread: false } : n)) };
    case 'notif/readAll': return { ...state, notifications: state.notifications.map((n) => ({ ...n, unread: false })) };
    case 'notif/add': return notif(state, a.notification);
    case 'doubt/add': return { ...state, doubts: [a.doubt, ...state.doubts] };
    case 'doubt/reply': return { ...state, doubts: state.doubts.map((d) => (d.id === a.id ? { ...d, replies: [...d.replies, a.reply] } : d)) };
    case 'doubt/like': return { ...state, doubts: state.doubts.map((d) => (d.id === a.id ? { ...d, liked: !d.liked, likes: d.likes + (d.liked ? -1 : 1) } : d)) };
    case 'doubt/resolve': {
      const d = state.doubts.find((x) => x.id === a.id);
      if (!d) return state;
      const next = { ...state, doubts: state.doubts.map((x) => (x.id === a.id ? { ...x, resolved: !x.resolved } : x)) };
      return d.resolved ? next : notif(next, { kind: 'system', sender: 'System', title: 'Doubt resolved', preview: `"${d.title}" was marked as resolved.`, action: { label: 'View doubts', route: 'dashboard/doubts' } });
    }
    case 'quiz/record': {
      const r = a.result;
      const pct = Math.round((r.score / r.total) * 100);
      const next = {
        ...state,
        quizResults: [r, ...state.quizResults],
        sessions: [{ id: makeId('s'), at: r.at, subject: SKILLS[r.skill] || 'Mixed', topic: `Quiz: ${r.label}`, minutes: Math.max(1, Math.round(r.durationSec / 60)), gain: Math.round(pct * 0.15), status: 'completed' }, ...state.sessions],
        boost: ['python', 'ml', 'dl', 'data'].includes(r.skill) ? { ...state.boost, [r.skill]: Math.min(30, (state.boost[r.skill] || 0) + Math.round(pct / 10)) } : state.boost,
      };
      return notif(next, { kind: 'tutor', sender: 'ConceptFlow Tutor', title: `Quiz complete: ${r.score}/${r.total}`, preview: `You scored ${pct}% on ${r.label}.`, action: { label: 'View insights', route: 'dashboard/insights' } });
    }
    case 'plan/set': return notif({ ...state, plan: a.plan }, { kind: 'system', sender: 'System', title: 'Study plan ready', preview: `Your ${a.plan.topic} plan has ${a.plan.items.length} steps.`, action: { label: 'Open planner', route: 'dashboard/planner' } });
    case 'plan/toggle': return state.plan ? { ...state, plan: { ...state.plan, items: state.plan.items.map((i) => (i.id === a.id ? { ...i, done: !i.done } : i)) } } : state;
    case 'progress/set': {
      const prev = state.progress[a.key];
      const done = Math.max(prev?.done ?? 0, a.done);
      const next = { ...state, progress: { ...state.progress, [a.key]: { title: a.title, total: a.total, done, updatedAt: new Date().toISOString() } } };
      if (done === a.total && (prev?.done ?? 0) < a.total) {
        return { ...next, sessions: [{ id: makeId('s'), at: new Date().toISOString(), subject: 'Learning Session', topic: a.title, minutes: a.total * 8, gain: 10, status: 'completed' }, ...next.sessions] };
      }
      return next;
    }
    case 'user/login': return { ...state, user: { name: a.name || 'Alex' } };
    case 'user/logout': return { ...state, user: null };
    default: return state;
  }
}

function load() {
  const seed = createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...seed, ...JSON.parse(raw) } : seed;
  } catch { return seed; }
}

const Ctx = createContext(null);

export function AppProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(reducer, initialState, (s) => s ?? load());
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);
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
  // Any session (even an abandoned one) counts as an active day for the streak.
  const days = new Set(state.sessions.map((s) => toDayKey(s.at)));
  let streak = 0;
  let cursor = days.has(toDayKey(new Date(now).toISOString())) ? now : now - 86_400_000;
  while (days.has(toDayKey(new Date(cursor).toISOString()))) { streak += 1; cursor -= 86_400_000; }
  const minutes = state.sessions.reduce((a, s) => a + s.minutes, 0);
  const concepts = Object.values(state.progress).reduce((a, p) => a + p.done, 0);
  return { streak, hours: Math.round((minutes / 60) * 10) / 10, concepts };
}

export const progressKey = (title) => slugify(title);
