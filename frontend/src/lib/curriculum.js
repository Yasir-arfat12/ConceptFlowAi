/**
 * Lesson content + grading. Hand-written lessons exist for the three
 * suggested prompts; any other topic gets a generated outline (placeholder
 * until the Qwen integration returns real content).
 */
import { slugify } from './format';

const norm = (t = '') => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export const CURRICULUM = {
  'binary-search': {
    title: 'Binary Search', skill: 'dsa', match: ['binary search'],
    concepts: [
      { title: 'Introduction',
        body: ['Binary search finds a target inside a **sorted** collection far faster than checking every element.', 'It is the standard example of a divide-and-conquer search.'],
        checkpoint: { question: 'Why must the array be sorted before using binary search?', keywords: [['sorted', 'order', 'ordered'], ['half', 'discard', 'eliminate', 'ignore']], model: 'Order tells us which half cannot contain the target, so we can safely discard it.' } },
      { title: 'How Binary Search Works',
        body: ['Binary search repeatedly divides the search interval in half.', 'If the target is less than the middle item, continue in the lower half; otherwise continue in the upper half, until the value is found or the interval is empty.'],
        example: ['// Searching for 7 in this sorted array:', '[1, 3, 5, 7, 9, 11, 15]', 'Step 1: Check middle element (7). Is it the target? Yes!', 'Target found at index 3.'],
        checkpoint: { question: 'What happens to the search space after each step of binary search?', keywords: [['half', 'halved', 'halves', 'divid', '50%', 'reduc', 'shrink']], model: 'The search space is cut in half after every comparison.' } },
      { title: 'Binary Search Algorithm',
        body: ['Keep two pointers, `low` and `high`. Compute `mid = low + (high - low) / 2`, compare, then move one pointer past `mid`.', 'Stop when `low > high` - the target is absent.'],
        checkpoint: { question: 'Which pointer moves when the middle value is smaller than the target?', keywords: [['low', 'left', 'start'], ['mid', 'middle', 'past', 'right', 'upper']], model: 'Move `low` to mid + 1 because the target must be in the upper half.' } },
      { title: 'Time Complexity',
        body: ['Because the interval halves each step, at most log2(n) comparisons are needed - O(log n).', 'Linear search needs up to n comparisons, so binary search wins by a wide margin on large inputs.'],
        checkpoint: { question: 'What is the time complexity of binary search and why?', keywords: [['log', 'logarithmic', 'o(log'], ['half', 'divid', 'halving']], model: 'O(log n), because every step halves the remaining search space.' } },
    ],
  },
  photosynthesis: {
    title: 'Photosynthesis', skill: 'science', match: ['photosynthesis'],
    concepts: [
      { title: 'Overview', body: ['Plants convert light energy, water and carbon dioxide into glucose and oxygen.', 'The process takes place inside chloroplasts.'],
        checkpoint: { question: 'What are the inputs and outputs of photosynthesis?', keywords: [['water'], ['carbon dioxide', 'co2'], ['glucose', 'sugar', 'oxygen']], model: 'Inputs: light, water, CO2. Outputs: glucose and oxygen.' } },
      { title: 'Light-Dependent Reactions', body: ['In the thylakoid membranes, chlorophyll absorbs light and splits water, producing ATP, NADPH and oxygen.'],
        checkpoint: { question: 'What do the light-dependent reactions produce?', keywords: [['atp'], ['nadph', 'oxygen', 'o2']], model: 'ATP and NADPH (plus oxygen from splitting water).' } },
      { title: 'The Calvin Cycle', body: ['In the stroma, ATP and NADPH power the fixation of CO2 into sugar.'],
        checkpoint: { question: 'Where does the Calvin cycle happen and what does it do?', keywords: [['stroma'], ['co2', 'carbon', 'sugar', 'glucose', 'fix']], model: 'In the stroma, it fixes CO2 into sugar using ATP and NADPH.' } },
    ],
  },
  'quantum-entanglement': {
    title: 'Quantum Entanglement', skill: 'science', match: ['quantum entanglement', 'entanglement'],
    concepts: [
      { title: 'What is Entanglement?', body: ['Two particles can share a single quantum state so that their measurement results stay correlated, however far apart they are.'],
        checkpoint: { question: 'In your own words, what does it mean for two particles to be entangled?', keywords: [['correlat', 'linked', 'connected', 'shared', 'dependent']], model: 'Their states cannot be described independently - outcomes are correlated.' } },
      { title: 'Measurement and Correlation', body: ['Measuring one particle fixes the statistics of its partner, but each individual outcome still looks random.'],
        checkpoint: { question: 'Can entanglement be used to send information faster than light?', keywords: [['no', 'not', "can't", 'cannot'], ['signal', 'information', 'random', 'communicat']], model: 'No. Outcomes are random locally, so no usable signal is transmitted.' } },
      { title: 'Why It Matters', body: ['Entanglement underpins quantum computing, quantum cryptography and teleportation protocols.'],
        checkpoint: { question: 'Name one technology that relies on entanglement.', keywords: [['comput', 'cryptograph', 'teleport', 'key', 'qkd', 'sensing']], model: 'Quantum computing, quantum key distribution or teleportation.' } },
    ],
  },
};

export function matchTopic(input) {
  const n = norm(input);
  if (!n) return null;
  return Object.keys(CURRICULUM).find((k) => CURRICULUM[k].match.some((m) => n.includes(m))) ?? null;
}

/** Generated outline for topics without hand-written content. */
function buildGeneric(topicText) {
  const t = topicText.trim() || 'this topic';
  const mk = (title, body, q, kw, model) => ({ title, body, checkpoint: { question: q, keywords: kw, model } });
  return {
    title: t, skill: null,
    concepts: [
      mk('Introduction', [`${t}: what it is, why it matters and where it is used.`], `In one or two sentences, what problem does ${t} solve?`, [['problem', 'solve', 'used', 'purpose', 'help']], 'A short statement of the purpose and use of the topic.'),
      mk('Core Ideas', [`The key building blocks and vocabulary you need before going deeper into ${t}.`], `List one key idea or term from ${t}.`, [['is', 'are', 'means', 'idea', 'term']], 'Any core term with a short definition.'),
      mk('Worked Example', [`Walk through a small example of ${t} step by step.`], 'Describe the first step you would take in the example.', [['first', 'start', 'step', 'begin']], 'Describe how to start and what comes next.'),
      mk('Review', [`Recap the main points of ${t} and common mistakes.`], 'What is one common mistake to avoid?', [['mistake', 'avoid', 'error', "don't", 'wrong']], 'Name a typical pitfall and how to avoid it.'),
    ],
  };
}

/** Resolve a free-text topic to `{ key, title, skill, concepts }`. */
export function getCurriculum(topicText) {
  const key = matchTopic(topicText);
  if (key) return { key, ...CURRICULUM[key] };
  const generic = buildGeneric(topicText || 'Binary Search');
  return { key: slugify(generic.title), ...generic };
}

/**
 * Grade a free-text checkpoint answer by keyword groups (each group is a set
 * of synonyms; one hit per group counts). Cheap, deterministic stand-in for
 * an LLM grader.
 */
export function gradeAnswer(answer, checkpoint) {
  const text = norm(answer);
  if (text.split(' ').filter(Boolean).length < 3) {
    return { score: 0, passed: false, feedback: 'Try a fuller explanation - at least a short sentence.' };
  }
  const groups = checkpoint.keywords;
  const hits = groups.filter((g) => g.some((k) => text.includes(k.toLowerCase()))).length;
  const score = Math.round((hits / groups.length) * 100);
  const passed = score >= 50;
  return {
    score,
    passed,
    feedback: passed
      ? score === 100 ? 'Great explanation - you covered the key idea.' : 'Good start - you have the main idea. Model answer: ' + checkpoint.model
      : 'Not quite yet. Model answer: ' + checkpoint.model,
  };
}
