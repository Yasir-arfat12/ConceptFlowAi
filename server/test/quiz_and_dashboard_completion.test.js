/**
 * End-to-End Test for Completed Sessions, Dashboard Updates, and Dynamic Topic Quizzes
 */
require('dotenv').config();
const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOptions);
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTest() {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    console.log('--- 1. REGISTER USER ---');
    const userEmail = `quizflow_${Date.now()}@conceptflow.io`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Test Learner', email: userEmail, password: 'Password123!' }
    });
    assert(regRes.status === 201, 'User registered successfully');
    const token = regRes.data.token || regRes.data.data?.token;

    console.log('\n--- 2. START & COMPLETE BINARY TREE SESSION ---');
    const startRes = await request('/api/learning/start', {
      method: 'POST',
      token,
      body: { topic: 'Binary Tree' }
    });
    assert(startRes.status === 201, 'Binary Tree session created');
    const sessionId = startRes.data.session?.id || startRes.data.data?.session?.id;
    assert(Boolean(sessionId), `Binary Tree session ID: ${sessionId}`);

    const conceptAnswers = [
      'Root node is the topmost node with no parent, leaf nodes have no children, and an N-node tree has N - 1 edges.',
      'A binary tree has at most 2 children per node (left and right). A full tree has 0 or 2 children, whereas a complete tree fills the last level as far left as possible.',
      'Depth measures distance from root downwards, while height measures the longest path down to a leaf in edges.',
      'Preorder is root left right, inorder is left root right, postorder is left right root. Inorder traversal on BST yields sorted ascending keys.',
      'The BST property requires left < root and right > root. Searching discards half the tree taking O(log n) binary search time.',
      'Recursive maximum depth formula has base case null returning 0, and returns 1 + max(depth of left, depth of right).'
    ];

    // Complete all 6 concepts by answering their checkpoints
    for (let c = 1; c <= 6; c++) {
      const curRes = await request(`/api/learning/${sessionId}/current`, { token });
      const curConcept = curRes.data.data?.currentConcept || curRes.data.currentConcept;
      assert(Boolean(curConcept), `Retrieved concept ${c}: "${curConcept?.title}"`);
      
      const checkpoints = curConcept?.checkpoints || [];
      for (const cp of checkpoints) {
        const ansRes = await request(`/api/checkpoints/${cp.id}/answer`, {
          method: 'POST',
          token,
          body: {
            sessionId,
            conceptId: curConcept.id,
            answer: conceptAnswers[c - 1]
          }
        });
        assert(ansRes.status === 200, `Answered checkpoint for concept ${c}`);
      }
    }

    // Verify session is marked completed
    const completedDetail = await request(`/api/learning/${sessionId}`, { token });
    assert(completedDetail.status === 200, 'Retrieved session details');
    const sessObj = completedDetail.data.data?.session || completedDetail.data.session;
    assert(sessObj.status === 'completed', 'Session status is completed (100%)');

    console.log('\n--- 3. VERIFY DASHBOARD WITH COMPLETED SESSION ---');
    const dashRes = await request('/api/dashboard', { token });
    assert(dashRes.status === 200, 'Dashboard returns 200');
    const dashData = dashRes.data.data || dashRes.data;
    
    assert(dashData.activeSessionId === sessionId, `Dashboard activeSessionId matches completed Binary Tree session: ${dashData.activeSessionId}`);
    assert(Boolean(dashData.activeSession), 'Dashboard contains activeSession object');
    assert(dashData.activeSession?.topic === 'Binary Tree', `Dashboard activeSession topic is 'Binary Tree'`);
    assert(dashData.activeSession?.status === 'completed', 'Dashboard activeSession status is completed');
    assert(dashData.stats.conceptsCompleted === 6, 'Dashboard stats show 6 concepts completed');

    console.log('\n--- 4. DYNAMIC QUIZ GENERATION FOR BINARY TREE ---');
    const treeQuizRes = await request(`/api/learning/${sessionId}/quiz`, {
      method: 'POST',
      token,
    });
    assert(treeQuizRes.status === 200 || treeQuizRes.status === 201, 'POST /api/learning/:sessionId/quiz returns 200/201');
    const treeQuestions = treeQuizRes.data.data?.questions || treeQuizRes.data.questions || [];
    assert(treeQuestions.length >= 4, `Binary Tree quiz generated with ${treeQuestions.length} questions`);
    
    // Ensure questions are about Binary Tree, NOT Binary Search!
    const allQuestionsText = treeQuestions.map(q => q.question + ' ' + (q.explanation || '')).join(' ').toLowerCase();
    assert(allQuestionsText.includes('tree') || allQuestionsText.includes('traversal') || allQuestionsText.includes('bst'), 
      'Quiz questions specifically test Binary Tree / Traversals / BST!');
    assert(!allQuestionsText.includes('middle element of array') && !allQuestionsText.includes('linear search vs binary search'), 
      'Quiz questions do NOT contain Binary Search search-space questions!');

    console.log('\n--- 5. DYNAMIC QUIZ GENERATION FOR STACK & LINKED LIST ---');
    // Start Stack
    const stackStart = await request('/api/learning/start', {
      method: 'POST',
      token,
      body: { topic: 'Stack' }
    });
    const stackSessionId = stackStart.data.session?.id || stackStart.data.data?.session?.id;
    const stackQuizRes = await request(`/api/learning/${stackSessionId}/quiz`, {
      method: 'POST',
      token,
    });
    const stackQuestions = stackQuizRes.data.data?.questions || stackQuizRes.data.questions || [];
    assert(stackQuestions.length >= 4, `Stack quiz generated with ${stackQuestions.length} questions`);
    const stackText = stackQuestions.map(q => q.question + ' ' + (q.explanation || '')).join(' ').toLowerCase();
    assert(stackText.includes('lifo') || stackText.includes('stack') || stackText.includes('pop'), 
      'Stack quiz specifically tests LIFO / Stack operations!');

    // Start Linked List
    const listStart = await request('/api/learning/start', {
      method: 'POST',
      token,
      body: { topic: 'Linked List' }
    });
    const listSessionId = listStart.data.session?.id || listStart.data.data?.session?.id;
    const listQuizRes = await request(`/api/learning/${listSessionId}/quiz`, {
      method: 'POST',
      token,
    });
    const listQuestions = listQuizRes.data.data?.questions || listQuizRes.data.questions || [];
    assert(listQuestions.length >= 4, `Linked List quiz generated with ${listQuestions.length} questions`);
    const listText = listQuestions.map(q => q.question + ' ' + (q.explanation || '')).join(' ').toLowerCase();
    assert(listText.includes('linked list') || listText.includes('node') || listText.includes('pointer') || listText.includes('head'), 
      'Linked List quiz specifically tests Nodes / Pointers / Head!');

  } finally {
    if (server) server.close();
  }

  console.log(`\n===============================================================`);
  console.log(`📊 QUIZ & DASHBOARD RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`===============================================================`);
  if (failed > 0) process.exit(1);
}

runTest();
