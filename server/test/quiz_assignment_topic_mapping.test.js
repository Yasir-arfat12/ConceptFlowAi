/**
 * Integration Test: Topic-Specific Quiz & Assignment Mapping
 * Verifies that completing any DSA topic (Binary Tree, Stack, Linked List, Binary Search)
 * generates topic-specific quizzes and assignments without data mismatch.
 */
require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

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
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, data, headers: res.headers };
}

async function runTests() {
  console.log('--- Starting Topic-Specific Quiz & Assignment Mapping Test ---');
  
  // Start ephemeral server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  let userId;
  try {
    // 1. Register test user
    const testEmail = `topic_map_${Date.now()}@conceptflow.io`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Topic Map Tester', email: testEmail, password: 'Password123!' },
    });
    if (regRes.status !== 201) throw new Error('Registration failed');
    const userToken = regRes.data.data.token;
    userId = regRes.data.data.user.id;

    // 2. Test Binary Tree Session, Quiz, and Assignment
    console.log('\n[Test 1] Testing Binary Tree Session, Quiz & Assignment...');
    const btStart = await request('/api/learning/start', {
      method: 'POST',
      token: userToken,
      body: { topic: 'Binary Tree' },
    });
    if (btStart.status !== 201) throw new Error(`Binary Tree start failed with status ${btStart.status}`);
    const btSessionId = btStart.data.data.session.id;

    // Check Quiz for Binary Tree
    const btQuizRes = await request(`/api/learning/${btSessionId}/quiz`, {
      method: 'POST',
      token: userToken,
    });
    if (btQuizRes.status !== 201) throw new Error(`Binary Tree quiz generation failed: ${JSON.stringify(btQuizRes.data)}`);
    const btQuestions = btQuizRes.data.data.questions;
    console.log(`  ✓ Generated ${btQuestions.length} Binary Tree quiz questions.`);
    const btHasTreeTerms = btQuestions.some((q) =>
      q.question.toLowerCase().includes('tree') ||
      q.question.toLowerCase().includes('traversal') ||
      q.question.toLowerCase().includes('inorder') ||
      q.question.toLowerCase().includes('leaf')
    );
    if (!btHasTreeTerms) throw new Error('Binary Tree quiz does not contain tree questions!');
    console.log('  ✓ Verified quiz questions are specifically about Binary Tree.');

    // Check Assignment for Binary Tree
    const btAssignRes = await request(`/api/learning/${btSessionId}/assignment`, {
      method: 'POST',
      token: userToken,
    });
    if (btAssignRes.status !== 201) throw new Error(`Binary Tree assignment generation failed: ${JSON.stringify(btAssignRes.data)}`);
    const btAssignment = btAssignRes.data.data.assignment;
    if (btAssignment.topic !== 'Binary Tree') throw new Error(`Assignment topic mismatched! Expected "Binary Tree", got "${btAssignment.topic}"`);
    if (!btAssignment.title.includes('Binary Tree')) throw new Error(`Assignment title mismatched! Got "${btAssignment.title}"`);
    console.log(`  ✓ Assignment generated for "${btAssignment.topic}" with title "${btAssignment.title}".`);

    // Submit single answer to assignment
    const btQ1 = btAssignment.questions[0];
    const btAnsRes = await request(`/api/learning/${btSessionId}/assignment/answer`, {
      method: 'POST',
      token: userToken,
      body: { questionId: btQ1.id, selectedAnswer: btQ1.correctAnswer },
    });
    if (btAnsRes.status !== 200 || !btAnsRes.data.data.isCorrect) {
      throw new Error(`Binary Tree assignment answer verification failed: ${JSON.stringify(btAnsRes.data)}`);
    }
    console.log('  ✓ Answer submitted and verified for Binary Tree assignment.');

    // 3. Test Stack Session, Quiz, and Assignment
    console.log('\n[Test 2] Testing Stack Session, Quiz & Assignment...');
    const stkStart = await request('/api/learning/start', {
      method: 'POST',
      token: userToken,
      body: { topic: 'Stack' },
    });
    if (stkStart.status !== 201) throw new Error(`Stack start failed`);
    const stkSessionId = stkStart.data.data.session.id;

    const stkQuizRes = await request(`/api/learning/${stkSessionId}/quiz`, {
      method: 'POST',
      token: userToken,
    });
    if (stkQuizRes.status !== 201) throw new Error(`Stack quiz generation failed`);
    const stkQuestions = stkQuizRes.data.data.questions;
    console.log(`  ✓ Generated ${stkQuestions.length} Stack quiz questions.`);
    const stkHasTerms = stkQuestions.some((q) =>
      q.question.toLowerCase().includes('stack') ||
      q.question.toLowerCase().includes('lifo') ||
      q.question.toLowerCase().includes('pop')
    );
    if (!stkHasTerms) throw new Error('Stack quiz does not contain stack questions!');
    console.log('  ✓ Verified quiz questions are specifically about Stack.');

    const stkAssignRes = await request(`/api/learning/${stkSessionId}/assignment`, {
      method: 'POST',
      token: userToken,
    });
    if (stkAssignRes.status !== 201) throw new Error(`Stack assignment generation failed`);
    const stkAssignment = stkAssignRes.data.data.assignment;
    if (stkAssignment.topic !== 'Stack') throw new Error(`Expected Stack topic, got ${stkAssignment.topic}`);
    console.log(`  ✓ Assignment generated for "${stkAssignment.topic}" with title "${stkAssignment.title}".`);

    // 4. Test Linked List Session, Quiz, and Assignment
    console.log('\n[Test 3] Testing Linked List Session, Quiz & Assignment...');
    const llStart = await request('/api/learning/start', {
      method: 'POST',
      token: userToken,
      body: { topic: 'Linked List' },
    });
    if (llStart.status !== 201) throw new Error(`Linked List start failed`);
    const llSessionId = llStart.data.data.session.id;

    const llQuizRes = await request(`/api/learning/${llSessionId}/quiz`, {
      method: 'POST',
      token: userToken,
    });
    if (llQuizRes.status !== 201) throw new Error(`Linked List quiz generation failed`);
    const llQuestions = llQuizRes.data.data.questions;
    console.log(`  ✓ Generated ${llQuestions.length} Linked List quiz questions.`);
    const llHasTerms = llQuestions.some((q) =>
      q.question.toLowerCase().includes('linked list') ||
      q.question.toLowerCase().includes('node') ||
      q.question.toLowerCase().includes('head')
    );
    if (!llHasTerms) throw new Error('Linked list quiz does not contain node/list questions!');
    console.log('  ✓ Verified quiz questions are specifically about Linked List.');

    const llAssignRes = await request(`/api/learning/${llSessionId}/assignment`, {
      method: 'POST',
      token: userToken,
    });
    if (llAssignRes.status !== 201) throw new Error(`Linked List assignment generation failed`);
    const llAssignment = llAssignRes.data.data.assignment;
    if (llAssignment.topic !== 'Linked List') throw new Error(`Expected Linked List topic, got ${llAssignment.topic}`);
    console.log(`  ✓ Assignment generated for "${llAssignment.topic}" with title "${llAssignment.title}".`);

    // 5. Test Binary Search Session, Quiz, and Assignment
    console.log('\n[Test 4] Testing Binary Search Session, Quiz & Assignment...');
    const bsStart = await request('/api/learning/start', {
      method: 'POST',
      token: userToken,
      body: { topic: 'Binary Search' },
    });
    if (bsStart.status !== 201) throw new Error(`Binary Search start failed`);
    const bsSessionId = bsStart.data.data.session.id;

    const bsQuizRes = await request(`/api/learning/${bsSessionId}/quiz`, {
      method: 'POST',
      token: userToken,
    });
    if (bsQuizRes.status !== 201) throw new Error(`Binary Search quiz generation failed`);
    const bsQuestions = bsQuizRes.data.data.questions;
    console.log(`  ✓ Generated ${bsQuestions.length} Binary Search quiz questions.`);

    const bsAssignRes = await request(`/api/learning/${bsSessionId}/assignment`, {
      method: 'POST',
      token: userToken,
    });
    if (bsAssignRes.status !== 201) throw new Error(`Binary Search assignment generation failed`);
    const bsAssignment = bsAssignRes.data.data.assignment;
    if (bsAssignment.topic !== 'Binary Search') throw new Error(`Expected Binary Search topic, got ${bsAssignment.topic}`);
    console.log(`  ✓ Assignment generated for "${bsAssignment.topic}" with title "${bsAssignment.title}".`);

    console.log('\n🎉 ALL TOPIC MAPPING TESTS PASSED SUCCESSFULLY! No mismatched data.');
  } finally {
    // Cleanup
    if (userId) {
      await db.query('DELETE FROM assignment_attempt_answers WHERE attempt_id IN (SELECT id FROM assignment_attempts WHERE user_id = $1)', [userId]);
      await db.query('DELETE FROM assignment_attempts WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM assignments WHERE session_id IN (SELECT id FROM learning_sessions WHERE user_id = $1)', [userId]);
      await db.query('DELETE FROM quiz_attempt_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = $1)', [userId]);
      await db.query('DELETE FROM quiz_attempts WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM quizzes WHERE session_id IN (SELECT id FROM learning_sessions WHERE user_id = $1)', [userId]);
      await db.query('DELETE FROM learning_concepts WHERE session_id IN (SELECT id FROM learning_sessions WHERE user_id = $1)', [userId]);
      await db.query('DELETE FROM learning_sessions WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
