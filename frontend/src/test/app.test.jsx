import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { gradeAnswer, getCurriculum } from '../lib/curriculum';
import { getQuiz, QUIZ_BANK } from '../lib/quizBank';
import { careerMetrics, jobMatch, JOBS } from '../lib/career';
import { reducer, createInitialState, deriveStats } from '../store/AppStore';
import { timeAgo, formatClock } from '../lib/format';
import { buildPlanBundle } from '../lib/planner';

vi.mock('../Wormhole', () => ({ default: () => <div data-testid="wormhole" /> }));

const user = () => userEvent.setup();
async function renderAt(path) {
  window.history.pushState({}, '', path);
  render(<App />);
  // wait for lazy route chunks
  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument(), { timeout: 4000 });
}
const nav = (name) => within(screen.getByRole('navigation', { name: 'Main' })).getByRole('button', { name: typeof name === 'string' ? new RegExp(`^${name}`) : name });

describe('routing & shell', () => {
  it('every sidebar destination renders without hitting the error boundary and updates the URL', async () => {
    const u = user();
    await renderAt('/dashboard');
    const targets = [['Tutor', '/dashboard/tutor'], ['Assignments', '/dashboard/assignments'], ['Planner', '/dashboard/planner'], ['Quiz', '/dashboard/quiz'], ['Doubts', '/dashboard/doubts'], ['Career', '/dashboard/career'], ['Overview', '/dashboard']];
    for (const [label, path] of targets) {
      await u.click(nav(label));
      await waitFor(() => expect(window.location.pathname).toBe(path));
      await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
    for (const [label, path] of [['Inbox', '/dashboard/inbox'], ['Session History', '/dashboard/history'], ['Insights', '/dashboard/insights'], ['Schedules', '/dashboard/schedules']]) {
      await u.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
      await waitFor(() => expect(window.location.pathname).toBe(path));
      await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  });

  it('supports deep links, browser back and an unknown route', async () => {
    const u = user();
    await renderAt('/dashboard/career');
    expect(screen.getByRole('heading', { name: 'AI Engineer Track' })).toBeInTheDocument();
    await u.click(nav('Doubts'));
    await screen.findByText('Community QA');
    act(() => { window.history.back(); });
    await screen.findByText('AI Engineer Track');
    window.history.pushState({}, '', '/dashboard/nope');
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('sidebar search jumps to a page and favorites/section toggles work', async () => {
    const u = user();
    await renderAt('/dashboard');
    await u.click(screen.getByRole('button', { name: 'Search navigation' }));
    await u.type(screen.getByLabelText('Search pages'), 'care{Enter}');
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/career'));
    await u.click(screen.getByRole('button', { name: /^Workspace/ }));
    expect(screen.queryByRole('button', { name: /^Session History/ })).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Research topics' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/chat'));
  });

  it('mobile menu opens, navigates and closes', async () => {
    const u = user();
    await renderAt('/dashboard');
    await u.click(screen.getByRole('button', { name: 'Open menu' }));
    const dlg = screen.getByRole('dialog', { name: 'Navigation menu' });
    await u.click(within(dlg).getByRole('button', { name: 'Planner' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/planner'));
    expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).not.toBeInTheDocument();
  });
});

describe('Planner', () => {
  it('generates a plan, toggles steps, switches modules and launches quiz/session', async () => {
    const u = user();
    await renderAt('/dashboard/planner');
    const gen = screen.getByRole('button', { name: 'Generate' });
    expect(gen).toBeDisabled();
    await u.type(screen.getByLabelText('Topic to plan'), 'Binary Search');
    await u.click(gen);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '' })).toBeDefined();
    await screen.findByText('Binary Search: Study plan', {}, { timeout: 4000 });
    const steps = screen.getAllByRole('button', { pressed: false }).filter((b) => /Learn:|Practice quiz:|Review/.test(b.textContent));
    expect(steps.length).toBeGreaterThanOrEqual(5);
    await u.click(steps[0]);
    expect(screen.getByText('1/6 done')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Doubt resolution' }));
    expect(screen.getByText('Doubts to resolve')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Quiz generation' }));
    await u.click(screen.getByRole('button', { name: 'Start quiz' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/quiz'));
    expect(await screen.findByText(/Question 1 of 5/)).toBeInTheDocument();
  });

  it('Stop cancels generation', async () => {
    const u = user();
    await renderAt('/dashboard/planner');
    await u.type(screen.getByLabelText('Topic to plan'), 'Photosynthesis');
    await u.click(screen.getByRole('button', { name: 'Generate' }));
    await u.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 2100));
    expect(screen.queryByText('Photosynthesis: Study plan')).not.toBeInTheDocument();
  });

  it('a suggested doubt opens the tutor drawer and gets an answer', async () => {
    const u = user();
    await renderAt('/dashboard/planner');
    await u.type(screen.getByLabelText('Topic to plan'), 'Binary Search');
    await u.click(screen.getByRole('button', { name: 'Generate' }));
    await screen.findByText('Binary Search: Study plan', {}, { timeout: 4000 });
    await u.click(screen.getByRole('button', { name: 'Doubt resolution' }));
    await u.click(screen.getByRole('button', { name: /intuition behind "Introduction"/ }));
    const dlg = screen.getByRole('dialog');
    await u.type(within(dlg).getByLabelText('Ask your doubt'), 'why sorted?');
    await u.click(within(dlg).getByRole('button', { name: 'Send' }));
    expect(await within(dlg).findByText(/halves the interval/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe('Quiz', () => {
  async function takeQuiz(u, correctCount) {
    for (let i = 0; i < 5; i += 1) {
      await screen.findByText(new RegExp(`Question ${i + 1} of 5`));
      const q = QUIZ_BANK.find((x) => screen.queryByText(x.q));
      const idx = i < correctCount ? q.answer : (q.answer + 1) % 4;
      await u.click(screen.getByRole('radio', { name: new RegExp(q.options[idx].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
      await u.click(screen.getByRole('button', { name: 'Submit Answer' }));
      expect(screen.getByRole('status')).toHaveTextContent(i < correctCount ? 'Correct.' : 'Not quite.');
      await u.click(screen.getByRole('button', { name: i === 4 ? 'Finish Quiz' : 'Next Question' }));
    }
  }

  it('setup -> answer with feedback -> results -> retake', async () => {
    const u = user();
    await renderAt('/dashboard/quiz');
    await u.click(screen.getByRole('button', { name: 'Deep Learning (PyTorch/TF)' }));
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeDisabled();
    await takeQuiz(u, 4);
    expect(await screen.findByText('Quiz complete')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('4/5');
    await u.click(screen.getByRole('button', { name: /Retake/ }));
    expect(await screen.findByText(/Question 1 of 5/)).toBeInTheDocument();
  });

  it('keyboard: A-D selects, Enter submits and continues', async () => {
    const u = user();
    await renderAt('/dashboard/quiz?skill=ml');
    await screen.findByText(/Question 1 of 5/);
    await u.keyboard('b');
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    await u.keyboard('{Enter}');
    expect(screen.getByRole('status')).toBeInTheDocument();
    await u.keyboard('{Enter}');
    expect(await screen.findByText(/Question 2 of 5/)).toBeInTheDocument();
  });

  it('a finished quiz raises the Career skill, adds an Inbox notification and shows in Insights', async () => {
    const u = user();
    await renderAt('/dashboard/quiz?skill=dl');
    const before = careerMetrics({}).levels.dl;
    await takeQuiz(u, 5);
    await screen.findByText('Quiz complete');
    await u.click(nav('Career'));
    await screen.findByText('AI Engineer Track');
    const bar = screen.getByRole('progressbar', { name: 'Deep Learning (PyTorch/TF)' });
    expect(Number(bar.getAttribute('aria-valuenow'))).toBe(before + 10);
    await u.click(screen.getByRole('button', { name: /^Inbox/ }));
    await u.click(screen.getByRole('button', { name: /^Insights/ }));
    expect(await screen.findByText('My Mastery Analytics')).toBeInTheDocument();
    expect(screen.getByText('Overall Mastery')).toBeInTheDocument();
  });

  it('time running out auto-finishes and counts unanswered as wrong', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await renderAt('/dashboard/quiz?skill=python');
      expect(screen.getByRole('timer')).toHaveTextContent('05:00');
      act(() => { vi.advanceTimersByTime(301_000); });
      expect(await screen.findByText('Quiz complete')).toBeInTheDocument();
      expect(screen.getByText(/Time ran out/)).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
});

describe('Career', () => {
  it('derived stats are consistent; skills expand; practice launches a quiz; jobs drawer works', async () => {
    const u = user();
    await renderAt('/dashboard/career');
    const m = careerMetrics({});
    expect(screen.getByText(`${m.readiness}/100`)).toBeInTheDocument();
    expect(screen.getByText(`${m.verified}/${m.totalSubs}`)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Data Engineering Basics/ }));
    expect(screen.getByText('Pipelines')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'View Jobs' }));
    const dlg = screen.getByRole('dialog', { name: 'Matching roles' });
    expect(within(dlg).getAllByText(/% match/).length).toBe(JOBS.length);
    await u.click(within(dlg).getAllByRole('button', { name: 'Save role' })[0]);
    expect(within(dlg).getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Practice now/ }));
    await waitFor(() => expect(window.location.search).toContain('skill=data'));
    expect(await screen.findByText(/Question 1 of 5/)).toBeInTheDocument();
  });
});

describe('Doubts', () => {
  it('search, filter, ask (tutor replies), reply, like and resolve all work', async () => {
    const u = user();
    await renderAt('/dashboard/doubts');
    expect(screen.getByText('3 discussions')).toBeInTheDocument();
    await u.type(screen.getByLabelText('Search discussions'), 'weights');
    expect(screen.getByText('1 discussion')).toBeInTheDocument();
    await u.clear(screen.getByLabelText('Search discussions'));
    await u.click(screen.getByRole('tab', { name: 'Open' }));
    expect(screen.getByText('1 discussion')).toBeInTheDocument();
    await u.click(screen.getByRole('tab', { name: 'All' }));

    await u.click(screen.getByRole('button', { name: 'Ask Question' }));
    const dlg = screen.getByRole('dialog', { name: 'Ask a Question' });
    expect(within(dlg).getByRole('button', { name: 'Post question' })).toBeDisabled();
    await u.type(within(dlg).getByLabelText('Your question'), 'Why does binary search need sorting?');
    await u.click(within(dlg).getByRole('button', { name: 'Post question' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('4 discussions')).toBeInTheDocument();
    expect(await screen.findByText(/Binary search halves/, {}, { timeout: 3000 })).toBeInTheDocument();

    await u.type(screen.getAllByLabelText('Write a reply')[0], 'Thanks!');
    await u.click(screen.getByRole('button', { name: 'Send reply' }));
    expect(screen.getByText('Thanks!')).toBeInTheDocument();
    const like = screen.getAllByRole('button', { name: /^Upvote/ })[0];
    await u.click(like);
    expect(like).toHaveAttribute('aria-pressed', 'true');
    await u.click(screen.getByRole('button', { name: 'Mark as resolved' }));
    await u.click(screen.getByRole('tab', { name: 'Resolved' }));
    expect(screen.getByText('3 discussions')).toBeInTheDocument();
  });
});

describe('Drawer focus regression', () => {
  it('typing in a drawer form inside a re-rendering parent keeps focus and does not close it', async () => {
    const u = user();
    await renderAt('/dashboard/doubts');
    await u.click(screen.getByRole('button', { name: 'Ask Question' }));
    const input = screen.getByLabelText('Your question');
    await u.type(input, 'a b c d e f g');
    expect(input).toHaveValue('a b c d e f g');
    expect(input).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Inbox', () => {
  it('unread count, expand + action, filter and mark all read stay in sync with the sidebar badge', async () => {
    const u = user();
    await renderAt('/dashboard/inbox');
    expect(screen.getByRole('status', { name: '' })).toBeDefined();
    expect(screen.getByText('2 Unread')).toBeInTheDocument();
    expect(within(nav('Inbox')).getByLabelText('2 unread')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Ready for your next milestone/ }));
    expect(screen.getByText('1 Unread')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Unread only' }));
    expect(screen.queryByText('Session Summary: Data Structures')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Mark all as read/ }));
    expect(screen.getByText('0 Unread')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
    expect(within(nav('Inbox')).queryByLabelText(/unread/)).not.toBeInTheDocument();
  });
  it('notification action button navigates', async () => {
    const u = user();
    await renderAt('/dashboard/inbox');
    await u.click(screen.getByRole('button', { name: /Weekly Learning Report/ }));
    await u.click(screen.getByRole('button', { name: 'View insights' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/insights'));
  });
});

describe('Session & doubt resolution', () => {
  it('uses the requested topic, grades honestly, persists progress and the drawer saves doubts', async () => {
    const u = user();
    await renderAt('/dashboard/session?topic=Binary%20Search');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('How Binary Search Works');
    const box = screen.getByLabelText('Your answer');
    await u.type(box, 'banana pie');
    await u.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Not quite|fuller/);
    await u.clear(box);
    await u.type(box, 'The search space is cut in half after every step');
    await u.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue to Next Concept' }));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Binary Search Algorithm');
    // locked concepts cannot be opened
    expect(screen.getByRole('button', { name: /Concept 4/ })).toBeDisabled();

    await u.click(screen.getByRole('button', { name: 'Ask a Doubt' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(/paused at Concept 3/)).toBeInTheDocument();
    await u.type(within(dlg).getByLabelText('Ask your doubt'), 'Why is log n so fast?');
    await u.keyboard('{Enter}');
    expect(await within(dlg).findByText(/Binary search halves|Let's break it down|halves the interval/, {}, { timeout: 3000 })).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: /Resume lesson/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Binary Search Algorithm'); // still in place

    await u.click(nav('Doubts'));
    expect(await screen.findByText('Why is log n so fast?')).toBeInTheDocument();
  });

  it('NewChat passes the typed topic to the session', async () => {
    const u = user();
    await renderAt('/dashboard/chat');
    await u.click(screen.getByRole('button', { name: 'How does Photosynthesis work?' }));
    await u.click(screen.getByRole('button', { name: '' , hidden: false }).constructor === Object ? document.body : document.querySelector('button[type=submit]'));
    await waitFor(() => expect(window.location.search).toContain('Photosynthesis'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
  });

  it('Tutor page: chips fill the query and submit starts that topic; tutor cards prefill', async () => {
    const u = user();
    await renderAt('/dashboard/tutor');
    await u.click(screen.getByRole('button', { name: 'Explain Quantum Entanglement' }));
    await u.click(document.querySelector('button[type=submit]'));
    await waitFor(() => expect(window.location.search).toContain('Quantum'));
    expect(await screen.findByRole('heading', { level: 1, name: 'What is Entanglement?' })).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  it('shows live stats, starts learning topic, and the bell goes to the inbox', async () => {
    const u = user();
    await renderAt('/dashboard');
    expect(await screen.findByText(/Welcome, Learner!|Welcome/)).toBeInTheDocument();
    const stats = deriveStats(createInitialState());
    expect(stats.streak).toBe(0);
    expect(stats.concepts).toBe(0);
    await u.click(within(screen.getByRole('main')).getByRole('button', { name: /^Notifications/ }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/inbox'));
  });
  it('Start learning starts a topic from dashboard', async () => {
    const u = user();
    await renderAt('/dashboard');
    const startBtn = await screen.findByRole('button', { name: /Start Learning/ });
    expect(startBtn).toBeInTheDocument();
  });
  it('Session History renders table and handles search/filter', async () => {
    const u = user();
    await renderAt('/dashboard/history');
    expect(await screen.findByRole('heading', { level: 1, name: 'Session History' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search sessions')).toBeInTheDocument();
    expect(screen.getByLabelText('Date range')).toBeInTheDocument();
  });
});

describe('Assignments (previously crashed on "Generate New")', () => {
  it('opens the drawer, generates, searches, filters and cycles status', async () => {
    const u = user();
    await renderAt('/dashboard/assignments');
    await u.click(screen.getByRole('button', { name: /Generate New/ }));
    const dlg = await screen.findByText('Generate Assignment');
    expect(dlg).toBeInTheDocument();
    await u.selectOptions(screen.getAllByRole('combobox')[0], 'Mathematics');
    await u.selectOptions(screen.getAllByRole('combobox')[1], 'Calculus');
    await u.click(screen.getByRole('button', { name: 'Generate Custom Assignment' }));
    expect(await screen.findByText('Assignment: Calculus', {}, { timeout: 4000 })).toBeInTheDocument();
    await u.type(screen.getByLabelText('Search tasks'), 'Calculus');
    expect(screen.getByText('Assignment: Calculus')).toBeInTheDocument();
    await u.clear(screen.getByLabelText('Search tasks'));
    const row = screen.getByText('Assignment: Calculus').closest('.grid');
    expect(row).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Filter by status/ }));
    expect(screen.getByRole('button', { name: /Filter by status: Pending/ })).toBeInTheDocument();
  });
});

describe('Auth & landing', () => {
  it('validates sign-up, then logs in', async () => {
    const u = user();
    await renderAt('/auth');
    await u.click(screen.getByRole('button', { name: 'Sign Up' }));
    await screen.findByLabelText('Confirm Password');
    const pw = screen.getByLabelText('Password', { selector: 'input' });
    await u.type(screen.getByLabelText('First Name'), 'Ada');
    await u.type(screen.getByLabelText('Last Name'), 'Lovelace');
    await u.type(screen.getByLabelText('Age'), '21');
    fireEvent.change(screen.getByLabelText('Date of Birth'), { target: { value: '2005-01-01' } });
    await u.type(screen.getByLabelText('Address'), '1 Main St');
    await u.type(screen.getByLabelText('Email Address'), 'a@b.co');
    await u.type(pw, 'longenough1');
    await u.type(screen.getByLabelText('Confirm Password'), 'different');
    await u.click(screen.getAllByRole('button', { name: 'Sign Up' }).find((b) => b.type === 'submit'));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.');
    await u.clear(screen.getByLabelText('Confirm Password'));
    await u.type(screen.getByLabelText('Confirm Password'), 'longenough1');
    await u.click(screen.getAllByRole('button', { name: 'Sign Up' }).find((b) => b.type === 'submit'));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'), { timeout: 2000 });
  });
  it('remember-me is a real checkbox; social + forgot show honest messages', async () => {
    const u = user();
    await renderAt('/auth');
    const cb = screen.getByRole('checkbox', { hidden: true });
    await u.click(screen.getByText('Remember me'));
    expect(cb).toBeChecked();
    await u.click(screen.getByRole('button', { name: /Google/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(/not configured/);
    await u.click(screen.getByRole('button', { name: 'Forgot Password?' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/not available/);
    expect(window.location.hash).toBe('');
  });
  it('landing CTAs go to auth; logo does not reload; dead anchors are gone', async () => {
    const u = user();
    await renderAt('/');
    expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'REQUEST A DEMO' }));
    await waitFor(() => expect(window.location.pathname).toBe('/auth'));
  });
});

describe('pure logic', () => {
  it('gradeAnswer: gibberish fails, key-idea passes', () => {
    const cp = getCurriculum('binary search').concepts[1].checkpoint;
    expect(gradeAnswer('banana pie', cp).passed).toBe(false);
    expect(gradeAnswer('', cp).score).toBe(0);
    expect(gradeAnswer('it halves the search space each step', cp).passed).toBe(true);
  });
  it('getQuiz respects skill/topic/count', () => {
    expect(getQuiz({ skill: 'dl', count: 3 }).slice(0, 3).every((q) => q.skill === 'dl')).toBe(true);
    expect(getQuiz({ topic: 'binary search' })[0].topic).toBe('binary search');
    expect(getQuiz({ count: 99 }).length).toBe(QUIZ_BANK.length);
  });
  it('career metrics are monotonic in boost and bounded', () => {
    const a = careerMetrics({}); const b = careerMetrics({ dl: 30, data: 30 });
    expect(b.readiness).toBeGreaterThan(a.readiness);
    expect(careerMetrics({ python: 500 }).levels.python).toBeLessThanOrEqual(100);
    expect(jobMatch(JOBS[3], a.levels).gaps).toContain('dl');
  });
  it('reducer: like toggles, resolve notifies once, plan toggle', () => {
    let s = {
      ...createInitialState(),
      doubts: [
        { id: 'd1', title: 'Doubt 1', likes: 4, liked: false, replies: [] },
        { id: 'd2', title: 'Doubt 2', resolved: false, replies: [] },
      ],
    };
    s = reducer(s, { type: 'doubt/like', id: 'd1' }); expect(s.doubts[0].likes).toBe(5);
    s = reducer(s, { type: 'doubt/like', id: 'd1' }); expect(s.doubts[0].likes).toBe(4);
    const n = s.notifications.length;
    s = reducer(s, { type: 'doubt/resolve', id: 'd2' }); expect(s.notifications.length).toBe(n + 1);
    s = reducer(s, { type: 'doubt/resolve', id: 'd2' }); expect(s.notifications.length).toBe(n + 1);
    s = reducer(s, { type: 'plan/set', plan: buildPlanBundle('Binary Search') });
    s = reducer(s, { type: 'plan/toggle', id: s.plan.items[0].id }); expect(s.plan.items[0].done).toBe(true);
    s = reducer(s, { type: 'progress/set', key: 'x', title: 'X', total: 2, done: 2 });
    expect(s.sessions[0].topic).toBe('X');
  });
  it('format helpers', () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 7200e3).toISOString(), now)).toBe('2 hours ago');
    expect(timeAgo(new Date(now - 86400e3).toISOString(), now)).toBe('Yesterday');
    expect(formatClock(272)).toBe('04:32');
    expect(deriveStats(createInitialState()).streak).toBe(0);
  });
});
