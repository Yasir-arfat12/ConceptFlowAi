/**
 * Comprehensive ConceptFlow Backend Test Suite
 * Tests the complete ConceptFlow learning model, authentication,
 * concept state transitions, checkpoint evaluations, contextual doubts,
 * quizzes, assignments, dashboards, progress tracking, and security isolation.
 */
require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const initDb = require('../src/models/initDb');
const { pool } = require('../src/config/db');

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
  } catch (e) {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
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

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STARTING CONCEPTFLOW BACKEND ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  // 1. Initialize DB Cleanly
  await initDb({ reset: true });

  // 2. Start Test Server on Ephemeral Port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running on ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    console.log('--- 1. HEALTH CHECK & DATABASE CONNECTIVITY ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'Health endpoint returns 200');
    assert(health.data.status === 'ok', 'Database connection is healthy');

    // ------------------------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & USER MANAGEMENT ---');
    const user1Data = {
      name: 'Alice Learner',
      email: `alice_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
    };

    // Register User 1
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: user1Data,
    });
    assert(regRes.status === 201, 'User 1 registered with 201');
    assert(regRes.data.success === true, 'Registration success is true');
    const user1Token = regRes.data.data?.token || regRes.data.token;
    assert(!!user1Token, 'JWT token returned on registration');

    // Duplicate registration fails
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: user1Data,
    });
    assert(dupRes.status === 409, 'Duplicate registration returns 409 Conflict');

    // Login User 1
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: user1Data.email, password: user1Data.password },
    });
    assert(loginRes.status === 200, 'User 1 logged in with 200');
    assert(loginRes.data.data?.user?.email === user1Data.email, 'User email matches');

    // Get current user profile (GET /api/auth/me)
    const meRes = await request('/api/auth/me', { token: user1Token });
    assert(meRes.status === 200, 'GET /api/auth/me returns 200');
    assert(meRes.data.data?.user?.name === 'Alice Learner', 'Profile name matches');

    // Register User 2 (for security & isolation tests)
    const user2Data = {
      name: 'Bob Intruder',
      email: `bob_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
    };
    const regRes2 = await request('/api/auth/register', {
      method: 'POST',
      body: user2Data,
    });
    const user2Token = regRes2.data.data?.token || regRes2.data.token;
    assert(!!user2Token, 'User 2 registered and received token');

    // ------------------------------------------------------------------------
    console.log('\n--- 3. LEARNING SESSION & STRUCTURED PATH CREATION ---');
    // Start Binary Search session (offline / prebuilt)
    const startRes = await request('/api/learning/start', {
      method: 'POST',
      token: user1Token,
      body: { topic: 'Teach me Binary Search' },
    });
    assert(startRes.status === 201, 'POST /api/learning/start returns 201 Created');
    assert(startRes.data.success === true, 'Session created successfully');
    
    const session = startRes.data.data.session;
    const concepts = startRes.data.data.concepts;
    const currentConcept = startRes.data.data.currentConcept;

    assert(session.topic === 'Binary Search', 'Session topic is Binary Search');
    assert(concepts.length === 6, 'Created exactly 6 concepts for Binary Search');
    assert(concepts[0].status === 'active', 'First concept is ACTIVE');
    assert(concepts.slice(1).every((c) => c.status === 'locked'), 'Remaining 5 concepts are LOCKED');
    assert(currentConcept.id === concepts[0].id, 'Current concept points to Concept 1');

    const sessionId = session.id;
    const concept1Id = concepts[0].id;
    const concept2Id = concepts[1].id;

    // Verify session retrieval
    const getSessionRes = await request(`/api/learning/${sessionId}`, { token: user1Token });
    assert(getSessionRes.status === 200, 'GET /api/learning/:sessionId returns 200');
    assert(getSessionRes.data.data.concepts.length === 6, 'Retrieved all 6 concepts');

    // Verify GET /api/learning/:sessionId/current
    const getCurrentRes = await request(`/api/learning/${sessionId}/current`, { token: user1Token });
    assert(getCurrentRes.status === 200, 'GET /api/learning/:sessionId/current returns 200');
    assert(getCurrentRes.data.data.currentConcept.id === concept1Id, 'Current concept is Concept 1');

    // Cannot access locked Concept 2
    const lockedRes = await request(`/api/learning/${sessionId}/concepts/${concept2Id}`, { token: user1Token });
    assert(lockedRes.status === 403, 'Accessing locked concept returns 403 Forbidden');

    // ------------------------------------------------------------------------
    console.log('\n--- 4. CHECKPOINT EVALUATION & CONCEPT STATE PROGRESSION ---');
    // Get checkpoints for Concept 1
    const cpRes = await request(`/api/learning/${sessionId}/concepts/${concept1Id}/checkpoints`, { token: user1Token });
    assert(cpRes.status === 200, 'GET checkpoints returns 200');
    const checkpoints = cpRes.data.data.checkpoints;
    assert(checkpoints.length > 0, 'Concept 1 has at least 1 checkpoint');
    const checkpoint1 = checkpoints[0];

    // Submit inadequate answer (< PASS_SCORE)
    const weakAnswerRes = await request(`/api/checkpoints/${checkpoint1.id}/answer`, {
      method: 'POST',
      token: user1Token,
      body: { answer: 'I do not know really' },
    });
    assert(weakAnswerRes.status === 200, 'Checkpoint submission returns 200');
    assert(weakAnswerRes.data.data.passed === false, 'Weak answer does not pass');
    assert(weakAnswerRes.data.data.conceptCompleted === false, 'Concept 1 remains incomplete');

    // Verify Concept 1 is still active
    const checkStillActive = await request(`/api/learning/${sessionId}/current`, { token: user1Token });
    assert(checkStillActive.data.data.currentConcept.id === concept1Id, 'Concept 1 is still current');

    // Submit passing answer
    // For concept 1 question: "Why must the array be sorted before using binary search?"
    // Expected keywords: sorted, divide, discard, half, eliminates
    const strongAnswer = 'Because binary search relies on sorted order so that we can compare the middle element and eliminate half the search space.';
    const passAnswerRes = await request(`/api/checkpoints/${checkpoint1.id}/answer`, {
      method: 'POST',
      token: user1Token,
      body: { answer: strongAnswer },
    });
    assert(passAnswerRes.status === 200, 'Passing checkpoint submission returns 200');
    assert(passAnswerRes.data.data.passed === true, 'Passing answer passes');
    assert(passAnswerRes.data.data.conceptCompleted === true, 'Concept 1 is marked COMPLETED');
    assert(passAnswerRes.data.data.nextConceptId === concept2Id, 'Concept 2 is now unlocked');

    // Verify Concept 2 is now active in DB
    const getCurrentAfterPass = await request(`/api/learning/${sessionId}/current`, { token: user1Token });
    assert(getCurrentAfterPass.data.data.currentConcept.id === concept2Id, 'Current concept has transitioned to Concept 2');

    // Concept 2 is now accessible
    const concept2Res = await request(`/api/learning/${sessionId}/concepts/${concept2Id}`, { token: user1Token });
    assert(concept2Res.status === 200, 'Concept 2 is now unlocked and accessible with 200');

    // ------------------------------------------------------------------------
    console.log('\n--- 5. CONTEXTUAL DOUBTS (LEARNING STATE PRESERVATION) ---');
    // Ask doubt anchored to Concept 2
    const doubtRes = await request(`/api/learning/${sessionId}/concepts/${concept2Id}/doubt`, {
      method: 'POST',
      token: user1Token,
      body: { question: 'Why does eliminating half of the elements make the algorithm logarithmic O(log n)?' },
    });
    assert(doubtRes.status === 200, 'Contextual doubt returns 200');
    assert(!!doubtRes.data.data.answer, 'Doubt answer provided');
    assert(doubtRes.data.data.learningStateModified === false, 'Doubt explicitly did not modify learning state');

    // Verify learning state is STRICTLY unchanged: Concept 2 must still be active!
    const verifyStateAfterDoubt = await request(`/api/learning/${sessionId}/current`, { token: user1Token });
    assert(verifyStateAfterDoubt.data.data.currentConcept.id === concept2Id, 'Concept 2 remains active after asking doubt');

    // Verify doubt history is persisted
    const doubtHistoryRes = await request(`/api/learning/${sessionId}/concepts/${concept2Id}/doubts`, { token: user1Token });
    assert(doubtHistoryRes.status === 200, 'GET doubts history returns 200');
    assert(doubtHistoryRes.data.data.messages.length >= 2, 'Doubt conversation (user + assistant) persisted in PostgreSQL');

    // ------------------------------------------------------------------------
    console.log('\n--- 6. DIRECT TUTOR CLIENT INTEGRATION ---');
    const tutorClientRes = await request('/api/tutor', {
      method: 'POST',
      body: {
        question: 'Why does binary search need sorted data?',
        context: { title: 'Binary Search Intuition' },
      },
    });
    assert(tutorClientRes.status === 200, 'POST /api/tutor returns 200 for frontend tutorClient');
    assert(!!tutorClientRes.data.answer, 'Returns top-level answer compatible with frontend');

    // ------------------------------------------------------------------------
    console.log('\n--- 7. QUIZ CREATION & SUBMISSION ---');
    const createQuizRes = await request(`/api/learning/${sessionId}/quiz`, {
      method: 'POST',
      token: user1Token,
    });
    assert(createQuizRes.status === 200 || createQuizRes.status === 201, 'Create quiz returns 200/201');
    const quizQuestions = createQuizRes.data?.data?.questions || createQuizRes.data?.data?.quiz?.questions || [];
    assert(quizQuestions.length > 0, 'Quiz questions generated');

    // Prepare quiz answers (select first option for each)
    const answers = quizQuestions.map((q, idx) => ({
      questionIndex: idx,
      selectedAnswer: q.options ? q.options[q.correctAnswer ?? 0] : 'sorted',
    }));

    const submitQuizRes = await request(`/api/learning/${sessionId}/quiz/submit`, {
      method: 'POST',
      token: user1Token,
      body: { answers },
    });
    assert(submitQuizRes.status === 200, 'Submit quiz returns 200');
    assert(typeof submitQuizRes.data.data.score === 'number', 'Quiz score is calculated and stored');

    // ------------------------------------------------------------------------
    console.log('\n--- 8. ASSIGNMENT CREATION & SUBMISSION ---');
    const createAssignRes = await request(`/api/learning/${sessionId}/assignment`, {
      method: 'POST',
      token: user1Token,
    });
    assert(createAssignRes.status === 200 || createAssignRes.status === 201, 'Create assignment returns 200/201');
    assert(!!createAssignRes.data.data.assignment, 'Assignment generated');

    const submitAssignRes = await request(`/api/learning/${sessionId}/assignment/submit`, {
      method: 'POST',
      token: user1Token,
      body: {
        code: `
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
        `,
      },
    });
    assert(submitAssignRes.status === 200, 'Submit assignment returns 200');
    assert(submitAssignRes.data.data.score >= 60, 'Assignment code evaluated successfully with passing score');

    // ------------------------------------------------------------------------
    console.log('\n--- 9. PROGRESS & DASHBOARD REAL-DATA METRICS ---');
    const progressRes = await request('/api/progress', { token: user1Token });
    assert(progressRes.status === 200, 'GET /api/progress returns 200');
    assert(progressRes.data.data.overall.totalSessions >= 1, 'Total sessions tracked');
    assert(progressRes.data.data.overall.completedConcepts >= 1, 'Completed concepts count is at least 1');

    const dashboardRes = await request('/api/dashboard', { token: user1Token });
    assert(dashboardRes.status === 200, 'GET /api/dashboard returns 200');
    assert(dashboardRes.data.data.stats.totalSessions >= 1, 'Dashboard reflects real total sessions');
    assert(dashboardRes.data.data.recentSessions.length >= 1, 'Recent sessions list includes active session');
    assert(dashboardRes.data.data.currentConcept.id === concept2Id, 'Dashboard currentConcept matches DB state');

    // ------------------------------------------------------------------------
    console.log('\n--- 10. RESUME LEARNING TEST ---');
    // Fetch session again as if reloading the page
    const resumeRes = await request(`/api/learning/${sessionId}/current`, { token: user1Token });
    assert(resumeRes.status === 200, 'Resume current concept returns 200');
    assert(resumeRes.data.data.currentConcept.id === concept2Id, 'Resume brings learner to exact current concept (Concept 2)');

    // ------------------------------------------------------------------------
    console.log('\n--- 11. SECURITY & DATA ISOLATION (USER 1 vs USER 2) ---');
    // User 2 attempts to access User 1's session
    const u2Session = await request(`/api/learning/${sessionId}`, { token: user2Token });
    assert(u2Session.status === 404, 'User 2 cannot access User 1 session (returns 404)');

    // User 2 attempts to get User 1's current concept
    const u2Current = await request(`/api/learning/${sessionId}/current`, { token: user2Token });
    assert(u2Current.status === 404, 'User 2 cannot get User 1 current concept (returns 404)');

    // User 2 attempts to access User 1's concept
    const u2Concept = await request(`/api/learning/${sessionId}/concepts/${concept1Id}`, { token: user2Token });
    assert(u2Concept.status === 404, 'User 2 cannot get User 1 concept (returns 404)');

    // User 2 attempts to answer User 1's checkpoint
    const u2Answer = await request(`/api/checkpoints/${checkpoint1.id}/answer`, {
      method: 'POST',
      token: user2Token,
      body: { answer: 'Hacked answer' },
    });
    assert(u2Answer.status === 403, 'User 2 cannot answer User 1 checkpoint (returns 403 Forbidden)');

    // User 2 attempts to ask doubt on User 1's session
    const u2Doubt = await request(`/api/learning/${sessionId}/concepts/${concept1Id}/doubt`, {
      method: 'POST',
      token: user2Token,
      body: { question: 'Can I see this?' },
    });
    assert(u2Doubt.status === 404, 'User 2 cannot ask doubt on User 1 session (returns 404)');

    // Missing token
    const noToken = await request(`/api/learning/${sessionId}`);
    assert(noToken.status === 401, 'Missing token returns 401 Unauthorized');

    // Invalid token
    const badToken = await request(`/api/learning/${sessionId}`, { token: 'invalid.jwt.token' });
    assert(badToken.status === 401, 'Invalid token returns 401 Unauthorized');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  }
}

runTests();
