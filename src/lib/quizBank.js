/**
 * Local question bank. `skill` ties a question to a Career skill so quiz
 * results can raise the matching skill level. Replace `getQuiz` with an API
 * call when the backend generator is ready - the shape stays the same.
 */
export const SKILLS = {
  python: 'Python Programming',
  ml: 'Machine Learning Concepts',
  dl: 'Deep Learning (PyTorch/TF)',
  data: 'Data Engineering Basics',
  dsa: 'Data Structures',
  science: 'Science',
};

export const QUIZ_BANK = [
  { id: 'q-attn', skill: 'dl', topic: 'transformers',
    q: 'What is the primary function of the self-attention mechanism in Transformers?',
    help: 'Select the most accurate description of how self-attention operates across a sequence.',
    options: ['It recursively processes tokens one by one.', 'It weighs the importance of all other tokens in the sequence relative to the current token.', 'It performs convolutions over local neighborhoods of tokens.', 'It relies strictly on recurrent hidden states to maintain context.'],
    answer: 1, explanation: 'Self-attention scores every token against every other token, so each position can draw on the most relevant context directly.' },
  { id: 'q-chain', skill: 'dl', topic: 'backpropagation',
    q: 'Which calculus rule makes backpropagation possible?',
    help: 'Think about how gradients flow through stacked layers.',
    options: ['The product rule', 'The chain rule', "L'Hopital's rule", 'The quotient rule'],
    answer: 1, explanation: 'Backprop multiplies local derivatives layer by layer - an application of the chain rule.' },
  { id: 'q-init', skill: 'dl', topic: 'neural networks',
    q: 'Why are neural network weights initialized randomly rather than to zero?',
    help: 'Consider what happens when every neuron starts identical.',
    options: ['Random weights train faster on GPUs', 'To break symmetry so neurons learn different features', 'Zero weights cause integer overflow', 'Random values guarantee a global minimum'],
    answer: 1, explanation: 'With identical weights every neuron receives identical gradients and stays identical. Randomness breaks that symmetry.' },
  { id: 'q-xent', skill: 'ml', topic: 'loss functions',
    q: 'For a classification problem with softmax outputs, which loss is usually preferred over MSE?',
    help: 'Think about gradients when predictions are confidently wrong.',
    options: ['Hinge embedding', 'Cross-entropy', 'Mean absolute error', 'Huber loss'],
    answer: 1, explanation: 'Cross-entropy gives large gradients for confident mistakes, while MSE saturates with softmax/sigmoid outputs.' },
  { id: 'q-overfit', skill: 'ml', topic: 'generalization',
    q: 'Training accuracy is 99% but validation accuracy is 71%. What is the most likely problem?',
    help: 'Compare performance on seen versus unseen data.',
    options: ['Underfitting', 'Overfitting', 'Data is perfectly clean', 'Learning rate is too low'],
    answer: 1, explanation: 'A large train/validation gap means the model memorised the training set. Regularisation or more data helps.' },
  { id: 'q-tuple', skill: 'python', topic: 'python basics',
    q: 'Which statement about Python tuples is true?',
    help: 'Think about mutability.',
    options: ['Tuples are mutable', 'Tuples are immutable sequences', 'Tuples cannot hold mixed types', 'Tuples are always sorted'],
    answer: 1, explanation: 'Tuples cannot be changed after creation, which also makes them hashable when their items are.' },
  { id: 'q-set', skill: 'python', topic: 'python basics',
    q: 'What does len({1, 2, 2, 3}) return?',
    help: 'Recall how sets treat duplicates.',
    options: ['4', '3', '2', 'It raises an error'],
    answer: 1, explanation: 'Sets keep unique elements only, so the duplicate 2 is dropped.' },
  { id: 'q-leak', skill: 'data', topic: 'data preparation',
    q: 'Why should you fit a scaler on the training split only?',
    help: 'Consider what information the test set should never influence.',
    options: ['It is faster', 'To avoid data leakage from the test set', 'Scalers cannot handle test data', 'It improves training accuracy directly'],
    answer: 1, explanation: 'Fitting on all data leaks test-set statistics into training and inflates evaluation results.' },
  { id: 'q-bs1', skill: 'dsa', topic: 'binary search',
    q: 'What precondition must hold for binary search to work?',
    help: 'Think about why discarding half the array is safe.',
    options: ['The array has unique values', 'The array is sorted', 'The array length is a power of two', 'The array contains only integers'],
    answer: 1, explanation: 'Discarding half the interval is only valid when order tells you which half cannot contain the target.' },
  { id: 'q-bs2', skill: 'dsa', topic: 'binary search',
    q: 'What is the worst-case time complexity of binary search?',
    help: 'The search space halves each step.',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    answer: 1, explanation: 'Halving n repeatedly takes log2(n) steps.' },
  { id: 'q-photo', skill: 'science', topic: 'photosynthesis',
    q: 'Where do the light-dependent reactions of photosynthesis occur?',
    help: 'Think about chloroplast structure.',
    options: ['Stroma', 'Thylakoid membranes', 'Mitochondria', 'Cell wall'],
    answer: 1, explanation: 'Light-dependent reactions happen in the thylakoid membranes; the Calvin cycle runs in the stroma.' },
  { id: 'q-ent', skill: 'science', topic: 'quantum entanglement',
    q: 'What is true about measuring one particle of an entangled pair?',
    help: 'Consider the correlation between the two outcomes.',
    options: ['It sends a signal to the other particle', "Its outcome is correlated with the partner's outcome", 'It destroys the other particle', 'It has no effect on predictions'],
    answer: 1, explanation: 'Outcomes are correlated beyond classical limits, but no usable signal is transmitted.' },
];

/**
 * Select questions for a quiz.
 * @param {{skill?: string, topic?: string, count?: number}} opts
 */
export function getQuiz({ skill, topic, count = 5 } = {}) {
  const t = (topic || '').toLowerCase();
  let pool = QUIZ_BANK;
  if (skill && SKILLS[skill]) pool = QUIZ_BANK.filter((q) => q.skill === skill);
  else if (t) {
    const hit = QUIZ_BANK.filter((q) => t.includes(q.topic) || q.topic.includes(t));
    if (hit.length) pool = hit;
  }
  // Pad with other questions so the quiz always reaches `count` when possible.
  const rest = QUIZ_BANK.filter((q) => !pool.includes(q));
  return [...pool, ...rest].slice(0, Math.min(count, QUIZ_BANK.length));
}
