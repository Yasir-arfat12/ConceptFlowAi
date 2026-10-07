/**
 * End-to-End Test Suite for All Four Pre-Fed DSA Topics in ConceptFlow:
 * 1. Binary Search
 * 2. Stack
 * 3. Linked List
 * 4. Binary Tree
 * 
 * Verifies:
 * - Topic preview API & curriculum discovery
 * - Session creation in PostgreSQL for all 4 topics
 * - Concept hierarchy (6 concepts per topic, 1 active, remaining locked)
 * - Checkpoint answering, scoring, and linear unlock progression
 * - Contextual doubt resolution with pre-fed fallback
 * - State preservation during doubts
 * - Dashboard multi-session continuation
 * - Cross-topic session isolation
 * - User authorization & session ownership isolation
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

async function runAllDsaTopicsTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE 4-TOPIC DSA ACCEPTANCE TEST SUITE');
  console.log('===============================================================\n');

  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running on ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    console.log('--- 1. CURRICULUM PREVIEWS FOR ALL 4 TOPICS ---');
    const topicsToTest = ['Binary Search', 'Stack', 'Linked List', 'Binary Tree'];

    for (const topic of topicsToTest) {
      const previewRes = await request(`/api/learning/preview?topic=${encodeURIComponent(topic)}`);
      assert(previewRes.status === 200, `Preview for '${topic}' returns 200`);
      assert(previewRes.data.data.isSupported === true, `'${topic}' isSupported is true`);
      assert(previewRes.data.data.concepts.length === 6, `'${topic}' has exactly 6 concepts`);
      assert(Boolean(previewRes.data.data.description), `'${topic}' provides curriculum description`);
    }

    // Variations test
    const variations = [
      { input: 'teach me stack', expected: 'Stack' },
      { input: 'learn linked list from basics', expected: 'Linked List' },
      { input: 'trees and bst', expected: 'Binary Tree' },
      { input: 'Master Binary Search', expected: 'Binary Search' }
    ];
    for (const { input, expected } of variations) {
      const vRes = await request(`/api/learning/preview?topic=${encodeURIComponent(input)}`);
      assert(vRes.status === 200 && vRes.data.data.isSupported === true && vRes.data.data.topic === expected, 
        `Variation '${input}' maps to supported topic '${expected}'`);
    }

    // ------------------------------------------------------------------------
    console.log('\n--- 2. USER AUTHENTICATION & MULTI-USER ISOLATION ---');
    const userAEmail = `dsatest_a_${Date.now()}@conceptflow.io`;
    const userBEmail = `dsatest_b_${Date.now()}@conceptflow.io`;

    const regA = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Student A', email: userAEmail, password: 'Password123!' }
    });
    assert(regA.status === 201 || regA.status === 200, 'User A registered successfully');
    const tokenA = regA.data.token || regA.data.data?.token;

    const regB = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Student B', email: userBEmail, password: 'Password123!' }
    });
    assert(regB.status === 201 || regB.status === 200, 'User B registered successfully');
    const tokenB = regB.data.token || regB.data.data?.token;

    // ------------------------------------------------------------------------
    console.log('\n--- 3. CREATING PERSISTENT SESSIONS FOR ALL 4 TOPICS (User A) ---');
    const userASessions = {};

    for (const topic of topicsToTest) {
      const startRes = await request('/api/learning/start', {
        method: 'POST',
        token: tokenA,
        body: { topic, targetRole: 'Software Engineer', timeCommitment: '2 hours/day' }
      });
      assert(startRes.status === 201 || startRes.status === 200, `POST /api/learning/start created session for '${topic}'`);
      const sessionData = startRes.data.session || startRes.data.data?.session || startRes.data.data;
      assert(Boolean(sessionData?.id), `Session ID returned for '${topic}': ${sessionData?.id}`);
      
      const sessionDetail = await request(`/api/learning/${sessionData.id}`, { token: tokenA });
      assert(sessionDetail.status === 200, `GET /api/learning/${sessionData.id} returns 200`);
      const concepts = sessionDetail.data.data?.concepts || sessionDetail.data.concepts || [];
      assert(concepts.length === 6, `'${topic}' session has 6 ordered concepts in PostgreSQL`);
      assert(concepts[0].status === 'active', `Concept 1 of '${topic}' is active`);
      assert(concepts.slice(1).every(c => c.status === 'locked'), 
        `Concepts 2-6 of '${topic}' are initialised in locked state`);

      userASessions[topic] = {
        sessionId: sessionData.id,
        concepts: concepts
      };
    }

    // ------------------------------------------------------------------------
    console.log('\n--- 4. CHECKPOINT EVALUATION & PROGRESSION (Stack) ---');
    const stackSession = userASessions['Stack'];
    const stackConcept1 = stackSession.concepts[0];
    
    // Get checkpoints for Stack Concept 1
    const concept1Details = await request(`/api/learning/${stackSession.sessionId}/current`, { token: tokenA });
    assert(concept1Details.status === 200, 'GET /api/learning/:sessionId/current returns active concept');
    const curConcept = concept1Details.data.data?.currentConcept || concept1Details.data.currentConcept;
    assert(Boolean(curConcept), 'Active concept object is present');
    assert(curConcept.title === stackConcept1.title, `Current concept title matches Concept 1: "${curConcept.title}"`);
    
    const checkpoints = curConcept.checkpoints || [];
    assert(checkpoints.length >= 1, `Stack Concept 1 has ${checkpoints.length} checkpoints in DB`);

    // Submit answer to checkpoint 1
    const cp1 = checkpoints[0];
    const answerRes = await request(`/api/checkpoints/${cp1.id}/answer`, {
      method: 'POST',
      token: tokenA,
      body: {
        sessionId: stackSession.sessionId,
        conceptId: curConcept.id,
        answer: 'A stack follows the LIFO (Last In First Out) principle where elements are added and removed from the top only.'
      }
    });
    assert(answerRes.status === 200, `POST /api/checkpoints/${cp1.id}/answer evaluates successfully`);
    const answerData = answerRes.data.data || answerRes.data;
    assert(answerData.is_correct === true || answerData.isCorrect === true || answerData.score >= 60, 
      `Checkpoint evaluated as correct (Score: ${answerData.score})`);

    // Complete remaining checkpoints if any to advance concept
    if (checkpoints.length > 1) {
      for (let i = 1; i < checkpoints.length; i++) {
        await request(`/api/checkpoints/${checkpoints[i].id}/answer`, {
          method: 'POST',
          token: tokenA,
          body: {
            sessionId: stackSession.sessionId,
            conceptId: curConcept.id,
            answer: 'Top of the stack, push adds and pop removes the element from the top.'
          }
        });
      }
    }

    // Verify Stack Concept 1 is now completed and Concept 2 is unlocked
    const updatedStackSession = await request(`/api/learning/${stackSession.sessionId}`, { token: tokenA });
    const updatedConcepts = updatedStackSession.data.data?.concepts || updatedStackSession.data.concepts || [];
    assert(updatedConcepts[0].status === 'completed', 'Stack Concept 1 status transitioned to completed');
    assert(updatedConcepts[1].status === 'active', 'Stack Concept 2 unlocked and transitioned to active');

    // ------------------------------------------------------------------------
    console.log('\n--- 5. CONTEXTUAL DOUBT FALLBACK RESOLUTION ---');
    const doubtQueries = [
      { topic: 'Stack', conceptIndex: 1, query: 'Why does a stack follow LIFO?', keyword: 'last' },
      { topic: 'Stack', conceptIndex: 1, query: 'What is the difference between pop and peek?', keyword: 'peek' },
      { topic: 'Linked List', conceptIndex: 0, query: 'Why do we need the head pointer?', keyword: 'head' },
      { topic: 'Linked List', conceptIndex: 0, query: 'Why do we save current.next before reversing?', keyword: 'reverse' },
      { topic: 'Binary Tree', conceptIndex: 0, query: 'Why is inorder traversal left root right?', keyword: 'inorder' },
      { topic: 'Binary Tree', conceptIndex: 0, query: 'Why does inorder traversal of a BST give sorted order?', keyword: 'bst' },
      { topic: 'Binary Search', conceptIndex: 0, query: 'Why does binary search require sorted data?', keyword: 'sorted' }
    ];

    for (const item of doubtQueries) {
      const sess = userASessions[item.topic];
      const targetConcept = sess.concepts[item.conceptIndex];
      const doubtRes = await request(`/api/learning/${sess.sessionId}/concept/${targetConcept.id}/doubt`, {
        method: 'POST',
        token: tokenA,
        body: { question: item.query }
      });
      assert(doubtRes.status === 200, `POST doubt for '${item.topic}': "${item.query}" returns 200`);
      const ansText = (doubtRes.data.data?.answer || doubtRes.data.answer || '').toLowerCase();
      assert(ansText.length > 30, `Doubt response has rich educational explanation (${ansText.length} chars)`);
    }

    // ------------------------------------------------------------------------
    console.log('\n--- 6. DOUBT MUST NOT ALTER LEARNING STATE OR CONCEPT STATUS ---');
    const stateCheckSession = await request(`/api/learning/${stackSession.sessionId}`, { token: tokenA });
    const stateCheckConcepts = stateCheckSession.data.data?.concepts || stateCheckSession.data.concepts || [];
    assert(stateCheckConcepts[0].status === 'completed', 'Stack Concept 1 remains completed after doubts');
    assert(stateCheckConcepts[1].status === 'active', 'Stack Concept 2 remains active after doubts');
    assert(stateCheckConcepts[2].status === 'locked', 'Stack Concept 3 remains locked after doubts');

    // ------------------------------------------------------------------------
    console.log('\n--- 7. DASHBOARD MULTI-SESSION CONTINUATION ---');
    const dashRes = await request('/api/dashboard', { token: tokenA });
    assert(dashRes.status === 200, 'GET /api/dashboard returns 200 for User A');
    const dashData = dashRes.data.data || dashRes.data;
    const activeSessions = dashData.activeSessions || dashData.sessions || [];
    assert(activeSessions.length >= 4, `Dashboard displays all 4 active sessions (found ${activeSessions.length})`);
    
    // Check that each topic session ID in dashboard matches created session ID
    for (const topic of topicsToTest) {
      const match = activeSessions.find(s => s.topic === topic);
      assert(Boolean(match), `Dashboard contains active session for '${topic}'`);
      if (match) {
        assert(match.id === userASessions[topic].sessionId, 
          `Dashboard Continue Learning link for '${topic}' matches EXACT session ID: ${match.id}`);
      }
    }

    // ------------------------------------------------------------------------
    console.log('\n--- 8. SECURITY & SESSION OWNERSHIP ISOLATION ---');
    // User B attempts to access User A's Stack session
    const unauthorizedGet = await request(`/api/learning/${stackSession.sessionId}`, { token: tokenB });
    assert(unauthorizedGet.status === 403 || unauthorizedGet.status === 404, 
      'User B cannot access User A learning session (returns 403/404)');

    const unauthorizedDoubt = await request(`/api/learning/${stackSession.sessionId}/concept/${stackConcept1.id}/doubt`, {
      method: 'POST',
      token: tokenB,
      body: { question: 'Hacking session doubt' }
    });
    assert(unauthorizedDoubt.status === 403 || unauthorizedDoubt.status === 404, 
      'User B cannot post doubts on User A learning session (returns 403/404)');

    // ------------------------------------------------------------------------
    console.log('\n--- 9. IDEMPOTENT TOPIC CREATION (resumeIfExists) ---');
    const resumeRes = await request('/api/learning/start', {
      method: 'POST',
      token: tokenA,
      body: { topic: 'Stack', resumeIfExists: true }
    });
    assert(resumeRes.status === 200, 'POST /api/learning/start with resumeIfExists returns 200');
    const resumedSessionId = resumeRes.data.session?.id || resumeRes.data.data?.session?.id || resumeRes.data.data?.id;
    assert(resumedSessionId === stackSession.sessionId, 
      `resumeIfExists successfully returned original Stack session ID (${resumedSessionId}) without creating duplicate`);

  } catch (err) {
    console.error('💥 Test suite error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllDsaTopicsTests();
