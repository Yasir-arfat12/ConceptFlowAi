/** Pure generators used by the Planner. Swap for API calls later. */
import { getCurriculum } from './curriculum';
import { getQuiz } from './quizBank';
import { makeId } from './format';

const DAY_MS = 86_400_000;

/** Study plan: one item per concept, then practice + review. */
export function buildStudyPlan(topicText, now = Date.now()) {
  const cur = getCurriculum(topicText);
  const steps = [
    ...cur.concepts.map((c) => `Learn: ${c.title}`),
    `Practice quiz: ${cur.title}`,
    `Review weak spots in ${cur.title}`,
  ];
  return steps.map((title, i) => ({ id: makeId('step'), title, dueAt: new Date(now + i * DAY_MS).toISOString(), done: false }));
}

export function buildQuizPlan(topicText) {
  const cur = getCurriculum(topicText);
  const questions = getQuiz({ topic: topicText, skill: cur.skill && cur.skill !== 'science' ? cur.skill : undefined, count: 5 });
  return { topic: cur.title, skill: cur.skill, count: questions.length };
}

export function suggestDoubts(topicText) {
  const cur = getCurriculum(topicText);
  return cur.concepts.slice(0, 3).map((c) => `What is the intuition behind "${c.title}" in ${cur.title}?`);
}

export function buildPlanBundle(topicText, now = Date.now()) {
  const topic = (topicText || '').trim();
  const cur = getCurriculum(topic);
  return {
    topic: cur.title,
    createdAt: new Date(now).toISOString(),
    items: buildStudyPlan(topic, now),
    quiz: buildQuizPlan(topic),
    doubts: suggestDoubts(topic),
  };
}
