/** Small, pure formatting helpers shared across pages. */

const DAY_MS = 86_400_000;

export const daysAgoISO = (n, now = Date.now()) => new Date(now - n * DAY_MS).toISOString();

/** "2 hours ago" / "Yesterday" / "Oct 12" */
export function timeAgo(iso, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** 272 -> "04:32" */
export const formatClock = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** 80 -> "1h 20 mins", 45 -> "45 mins" */
export function formatMinutes(min) {
  if (min < 60) return `${min} mins`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h ${r} mins` : `${h}h`;
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const toDayKey = (iso) => new Date(iso).toISOString().slice(0, 10);

export const slugify = (s = '') =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topic';

export const pluralize = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const makeId = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
