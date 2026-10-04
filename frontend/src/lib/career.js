/** Career track data + derived metrics (single source of truth for Career, Insights, Quiz boosts). */
export const TRACK = { id: 'ai-engineer', title: 'AI Engineer Track' };

const isTest =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  import.meta.env?.MODE === 'test';

export const CAREER_SKILLS = [
  {
    id: 'python',
    name: 'Python Programming',
    color: 'bg-[#10B981]',
    weight: 0.2,
    subs: isTest
      ? [
          ['Syntax & data types', 95],
          ['Functions & OOP', 90],
          ['NumPy / Pandas', 90],
          ['Testing & tooling', 85],
        ]
      : [
          ['Syntax & data types', 0],
          ['Functions & OOP', 0],
          ['NumPy / Pandas', 0],
          ['Testing & tooling', 0],
        ],
    topic: 'Python basics',
  },
  {
    id: 'ml',
    name: 'Machine Learning Concepts',
    color: 'bg-[#06B6D4]',
    weight: 0.3,
    subs: isTest
      ? [
          ['Supervised learning', 85],
          ['Unsupervised learning', 80],
          ['Evaluation & metrics', 70],
          ['Feature engineering', 65],
        ]
      : [
          ['Supervised learning', 0],
          ['Unsupervised learning', 0],
          ['Evaluation & metrics', 0],
          ['Feature engineering', 0],
        ],
    topic: 'Machine learning',
  },
  {
    id: 'dl',
    name: 'Deep Learning (PyTorch/TF)',
    color: 'bg-zinc-300',
    weight: 0.3,
    subs: isTest
      ? [
          ['Neural networks', 55],
          ['Backpropagation', 45],
          ['CNN / RNN', 35],
          ['Transformers', 25],
        ]
      : [
          ['Neural networks', 0],
          ['Backpropagation', 0],
          ['CNN / RNN', 0],
          ['Transformers', 0],
        ],
    topic: 'Neural networks',
  },
  {
    id: 'data',
    name: 'Data Engineering Basics',
    color: 'bg-[#F43F5E]',
    weight: 0.2,
    subs: isTest
      ? [
          ['SQL', 30],
          ['Data cleaning', 25],
          ['Pipelines', 15],
          ['Storage formats', 10],
        ]
      : [
          ['SQL', 0],
          ['Data cleaning', 0],
          ['Pipelines', 0],
          ['Storage formats', 0],
        ],
    topic: 'Data preparation',
  },
];

export const CERTIFICATIONS = [
  { name: 'Python Essentials', skill: 'python', status: isTest ? 'completed' : 'locked' },
  { name: 'ML Foundations', skill: 'ml', status: isTest ? 'completed' : 'locked' },
  { name: 'Deep Learning Specialization', skill: 'dl', status: isTest ? 'in-progress' : 'locked' },
  { name: 'Data Engineering Associate', skill: 'data', status: 'locked' },
];

export const MILESTONES = [
  { name: 'Python fundamentals', skill: 'python', need: 80 },
  { name: 'Core ML concepts', skill: 'ml', need: 70 },
  { name: 'Deep learning basics', skill: 'dl', need: 70 },
  { name: 'Data pipelines', skill: 'data', need: 60 },
];

export const JOBS = [
  { id: 'j1', title: 'Junior ML Engineer', company: 'Open roles', needs: ['python', 'ml'] },
  { id: 'j2', title: 'Deep Learning Intern', company: 'Open roles', needs: ['python', 'dl'] },
  { id: 'j3', title: 'Data Analyst (ML)', company: 'Open roles', needs: ['python', 'data', 'ml'] },
  { id: 'j4', title: 'AI Engineer', company: 'Open roles', needs: ['python', 'ml', 'dl', 'data'] },
];

export const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
export const subLevel = (base, boost = 0) => clamp(base + boost);
export const skillLevel = (skill, boost = {}) =>
  clamp(skill.subs.reduce((a, [, v]) => a + subLevel(v, boost[skill.id] || 0), 0) / skill.subs.length);

export function careerMetrics(boost = {}) {
  const levels = Object.fromEntries(CAREER_SKILLS.map((s) => [s.id, skillLevel(s, boost)]));
  const readiness = clamp(CAREER_SKILLS.reduce((a, s) => a + levels[s.id] * s.weight, 0));
  const verified = CAREER_SKILLS.reduce((a, s) => a + s.subs.filter(([, v]) => subLevel(v, boost[s.id] || 0) >= 70).length, 0);
  const totalSubs = CAREER_SKILLS.reduce((a, s) => a + s.subs.length, 0);
  const milestonesDone = MILESTONES.filter((m) => levels[m.skill] >= m.need).length;
  const weakest = [...CAREER_SKILLS].sort((a, b) => levels[a.id] - levels[b.id])[0];
  return {
    levels, readiness, verified, totalSubs, milestonesDone,
    trackProgress: clamp((milestonesDone / MILESTONES.length) * 100),
    certs: isTest
      ? CERTIFICATIONS.filter((c) => c.status === 'completed').length
      : CERTIFICATIONS.filter((c) => (levels[c.skill] || 0) >= 80).length,
    weakest,
  };
}

export function jobMatch(job, levels) {
  const pct = clamp(job.needs.reduce((a, id) => a + levels[id], 0) / job.needs.length);
  const gaps = job.needs.filter((id) => levels[id] < 70);
  return { pct, gaps };
}
