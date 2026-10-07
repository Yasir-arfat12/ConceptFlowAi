/**
 * Central Prebuilt DSA Topics Registry for ConceptFlow AI
 * 
 * Sourced deterministically from PostgreSQL/JavaScript data structures.
 * Provides guaranteed offline readiness for:
 * 1. Binary Search
 * 2. Stack
 * 3. Linked List
 * 4. Binary Tree
 */

const { binarySearchData, evaluateDoubt: evaluateBinarySearchDoubt, generatePrebuiltBinarySearchAssignment, evaluateAssignment: evaluateBinarySearchAssignment } = require('./prebuiltBinarySearch');
const { stackData, evaluateStackDoubt, generatePrebuiltStackAssignment, evaluateStackAssignment } = require('./prebuiltStack');
const { linkedListData, evaluateLinkedListDoubt, generatePrebuiltLinkedListAssignment, evaluateLinkedListAssignment } = require('./prebuiltLinkedList');
const { binaryTreeData, evaluateBinaryTreeDoubt, generatePrebuiltBinaryTreeAssignment, evaluateBinaryTreeAssignment } = require('./prebuiltBinaryTree');

const TOPICS = {
  'binary search': {
    key: 'binary-search',
    canonicalTitle: 'Binary Search',
    data: binarySearchData,
    evaluator: evaluateBinarySearchDoubt,
    generateAssignment: generatePrebuiltBinarySearchAssignment,
    evaluateAssignment: evaluateBinarySearchAssignment,
    keywords: ['binary search', 'binary-search', 'binarysearch', 'bisect'],
  },
  'stack': {
    key: 'stack',
    canonicalTitle: 'Stack',
    data: stackData,
    evaluator: evaluateStackDoubt,
    generateAssignment: generatePrebuiltStackAssignment,
    evaluateAssignment: evaluateStackAssignment,
    keywords: ['stack', 'stacks', 'lifo', 'call stack', 'push pop'],
  },
  'linked list': {
    key: 'linked-list',
    canonicalTitle: 'Linked List',
    data: linkedListData,
    evaluator: evaluateLinkedListDoubt,
    generateAssignment: generatePrebuiltLinkedListAssignment,
    evaluateAssignment: evaluateLinkedListAssignment,
    keywords: ['linked list', 'linkedlist', 'linked-list', 'singly linked list', 'doubly linked list', 'node list'],
  },
  'binary tree': {
    key: 'binary-tree',
    canonicalTitle: 'Binary Tree',
    data: binaryTreeData,
    evaluator: evaluateBinaryTreeDoubt,
    generateAssignment: generatePrebuiltBinaryTreeAssignment,
    evaluateAssignment: evaluateBinaryTreeAssignment,
    keywords: ['binary tree', 'binarytree', 'binary-tree', 'tree', 'trees', 'bst', 'binary search tree'],
  },
};

/**
 * Normalizes user input topic string to remove noise words like "teach me", "learn", "master", etc.
 */
function normalizeTopicString(input = '') {
  return input
    .toLowerCase()
    .replace(/^teach me\s+/i, '')
    .replace(/^learn\s+/i, '')
    .replace(/^master\s+/i, '')
    .replace(/^help me understand\s+/i, '')
    .replace(/^dsa\s+/i, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a topic string to its matching prebuilt topic entry, if one exists.
 */
function resolvePrebuiltTopic(input = '') {
  const norm = normalizeTopicString(input);
  if (!norm) return null;

  // 1. Exact canonical check
  if (norm.includes('binary search') || norm.includes('binarysearch') || norm.includes('binary search algorithm')) {
    return TOPICS['binary search'];
  }
  if (norm.includes('linked list') || norm.includes('linkedlist') || norm.includes('singly linked')) {
    return TOPICS['linked list'];
  }
  if (norm.includes('binary tree') || norm.includes('binarytree') || norm.includes('bst') || norm === 'tree' || norm === 'trees' || norm.startsWith('tree ') || norm.endsWith(' tree')) {
    return TOPICS['binary tree'];
  }
  if (norm.includes('stack') || norm.includes('stacks') || norm === 'lifo') {
    return TOPICS['stack'];
  }

  // 2. Keyword fallback check
  for (const key of Object.keys(TOPICS)) {
    const entry = TOPICS[key];
    if (entry.keywords.some((kw) => norm === kw || norm.includes(kw))) {
      return entry;
    }
  }

  return null;
}

/**
 * Checks if a topic is one of our prebuilt, offline-ready topics.
 */
function isPrebuiltTopic(topic = '') {
  return resolvePrebuiltTopic(topic) !== null;
}

/**
 * Retrieves prebuilt topic data for a given topic.
 */
function getPrebuiltTopicData(topic = '') {
  const entry = resolvePrebuiltTopic(topic);
  return entry ? entry.data : null;
}

/**
 * Evaluates contextual doubt against prebuilt responses across topics.
 */
function evaluatePrebuiltDoubt(topic = '', question = '') {
  const entry = resolvePrebuiltTopic(topic);
  if (entry && typeof entry.evaluator === 'function') {
    const specificAnswer = entry.evaluator(question);
    if (specificAnswer) return specificAnswer;
  }

  // Cross-topic fallback search if not matched in specific topic
  const allEvaluators = [evaluateBinarySearchDoubt, evaluateStackDoubt, evaluateLinkedListDoubt, evaluateBinaryTreeDoubt];
  for (const evalFn of allEvaluators) {
    const res = evalFn(question);
    if (res) return res;
  }

  return null;
}

/**
 * Returns all supported prebuilt topics for discovery & preview APIs.
 */
function getAllPrebuiltTopics() {
  return Object.values(TOPICS).map((t) => ({
    key: t.key,
    title: t.canonicalTitle,
    description: t.data.description,
    totalConcepts: t.data.concepts.length,
    features: t.data.features,
    concepts: t.data.concepts.map((c, i) => ({
      orderIndex: i + 1,
      title: c.title,
      keyTakeaways: c.keyTakeaways,
    })),
  }));
}

/**
 * Retrieves assignment generator for a given topic.
 */
function getPrebuiltAssignmentGenerator(topic = '') {
  const entry = resolvePrebuiltTopic(topic);
  return entry && typeof entry.generateAssignment === 'function' ? entry.generateAssignment : null;
}

/**
 * Retrieves assignment evaluator for a given topic.
 */
function getPrebuiltAssignmentEvaluator(topic = '') {
  const entry = resolvePrebuiltTopic(topic);
  return entry && typeof entry.evaluateAssignment === 'function' ? entry.evaluateAssignment : null;
}

module.exports = {
  TOPICS,
  isPrebuiltTopic,
  resolvePrebuiltTopic,
  getPrebuiltTopicData,
  getPrebuiltAssignmentGenerator,
  getPrebuiltAssignmentEvaluator,
  evaluatePrebuiltDoubt,
  getAllPrebuiltTopics,
  normalizeTopicString,
};
