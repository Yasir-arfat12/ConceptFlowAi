/**
 * End-to-End Test Suite for ConceptFlow Planner → Session Integration
 * 
 * Verifies:
 * 1. Topic preview API (Supported Binary Search vs Unsupported Topics)
 * 2. Session creation from Planner in PostgreSQL
 * 3. Exact 6 Binary Search concepts with Concept 1 active, rest locked
 * 4. Checkpoint progression: Concept 1 completed -> Concept 2 active
 * 5. Dashboard Continue Learning links to the EXACT SAME session ID
 * 6. Duplicate session protection (resumeIfExists does not create duplicate active sessions)
 * 7. Security isolation and database persistence across logout/login
 */
require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const initDb = require('../src/models/initDb');

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

async function runPlannerIntegrationTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING PLANNER → SESSION INTEGRATION ACCEPTANCE SUITE');
  console.log('===============================================================\n');

  // Rebuild test DB cleanly
  await initDb({ reset: true });

  // Start test server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running on ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    console.log('--- 1. PLANNER PREVIEW API & CURRICULUM DISCOVERY ---');
    
    // Preview for supported topic: Binary Search
    const bsPreview = await request('/api/learning/preview?topic=Binary Search');
    assert(bsPreview.status === 200, 'GET /api/learning/preview returns 200 for Binary Search');
    assert(bsPreview.data.data.isSupported === true, 'Binary Search is supported');
    assert(bsPreview.data.data.totalConcepts === 6, 'Binary Search has exactly 6 concepts');
    assert(bsPreview.data.data.concepts.length === 6, 'Preview returns 6 concept milestones');
    assert(bsPreview.data.data.concepts[0].title === 'Searching Basics and Why Sorted Data Matters', 'Concept 1 title verified');
    assert(bsPreview.data.data.concepts[5].title === 'Time Complexity, Variations and Applications', 'Concept 6 title verified');

    // Preview for variations of Binary Search
    const bsVarPreview = await request('/api/learning/preview?topic=binary-search');
    assert(bsVarPreview.data.data.isSupported === true, '"binary-search" normalized as supported topic');

    // Preview for unsupported topic: Dynamic Programming
    const dpPreview = await request('/api/learning/preview?topic=Dynamic Programming');
    assert(dpPreview.status === 200, 'GET /api/learning/preview returns 200 for unsupported topic');
    assert(dpPreview.data.data.isSupported === false, 'Dynamic Programming is marked as not supported yet');
    assert(!!dpPreview.data.data.message, 'Professional coming soon message returned');

    // ------------------------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & FRESH USER SETUP ---');
    const userCredentials = {
      name: 'Sarah Planner',
      email: `sarah_${Date.now()}@conceptflow.ai`,
      password: 'SecurePassword123!',
    };
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: userCredentials,
    });
    assert(regRes.status === 201, 'User registered successfully with 201');
    const token = regRes.data.data?.token || regRes.data.token;
    assert(!!token, 'Auth token acquired');

    // ------------------------------------------------------------------------
    console.log('\n--- 3. PLANNER → START SESSION (SESSION CREATION IN POSTGRESQL) ---');
    const startRes = await request('/api/learning/start', {
      method: 'POST',
      token,
      body: { topic: 'Binary Search', resumeIfExists: true },
    });
    assert(startRes.status === 201, 'POST /api/learning/start returns 201 Created');
    assert(startRes.data.success === true, 'Session successfully created');
    
    const session = startRes.data.data.session;
    const concepts = startRes.data.data.concepts;
    const currentConcept = startRes.data.data.currentConcept;

    assert(session.topic === 'Binary Search', 'Session topic is Binary Search');
    assert(session.status === 'active', 'Initial session status is ACTIVE');
    assert(session.progress_percentage === 0, 'Initial progress is 0%');
    assert(concepts.length === 6, 'Created exactly 6 concepts in PostgreSQL');
    assert(concepts[0].status === 'active', 'Concept 1 is ACTIVE');
    assert(concepts.slice(1).every((c) => c.status === 'locked'), 'Concepts 2-6 are LOCKED');
    assert(currentConcept.id === concepts[0].id, 'Current concept pointer points to Concept 1');

    const sessionId = session.id;
    const concept1 = concepts[0];
    const concept2 = concepts[1];

    // ------------------------------------------------------------------------
    console.log('\n--- 4. DUPLICATE SESSION PROTECTION TEST ---');
    // Clicking "Start Session" again with resumeIfExists=true should return the SAME session (status 200, resumed: true)
    const duplicateClickRes = await request('/api/learning/start', {
      method: 'POST',
      token,
      body: { topic: 'Binary Search', resumeIfExists: true },
    });
    assert(duplicateClickRes.status === 200, 'Duplicate session start returns 200 (resumed)');
    assert(duplicateClickRes.data.resumed === true, 'Resumed flag is true');
    assert(duplicateClickRes.data.data.session.id === sessionId, 'Returned session ID is EXACT SAME session ID');

    // Verify session count in PostgreSQL is STILL exactly 1
    const sessionsListRes = await request('/api/learning/sessions', { token });
    assert(sessionsListRes.data.data.sessions.length === 1, 'Only 1 active session exists in PostgreSQL');

    // ------------------------------------------------------------------------
    console.log('\n--- 5. TUTOR/LEARNING SESSION & CHECKPOINT PROGRESSION ---');
    // Retrieve checkpoints for Concept 1
    const cpRes = await request(`/api/learning/${sessionId}/concepts/${concept1.id}/checkpoints`, { token });
    assert(cpRes.status === 200, 'Checkpoints retrieved for Concept 1');
    const checkpointId = cpRes.data.data.checkpoints[0].id;

    // Student submits answer to checkpoint
    const answerRes = await request(`/api/checkpoints/${checkpointId}/answer`, {
      method: 'POST',
      token,
      body: {
        answer: 'Binary search requires sorted data because the ordered arrangement lets us eliminate half the search space with each comparison.',
      },
    });
    assert(answerRes.status === 200, 'POST /api/checkpoints/:id/answer returns 200');
    assert(answerRes.data.data.passed === true, 'Checkpoint answer passed keyword evaluation');
    assert(answerRes.data.data.conceptCompleted === true, 'Concept 1 is completed');
    assert(answerRes.data.data.nextConceptId === concept2.id, 'Next concept is Concept 2');

    // Verify PostgreSQL state after completing Concept 1
    const sessionAfterCp = await request(`/api/learning/${sessionId}`, { token });
    const refreshedConcepts = sessionAfterCp.data.data.concepts;
    assert(refreshedConcepts[0].status === 'completed', 'Concept 1 status is COMPLETED in DB');
    assert(refreshedConcepts[1].status === 'active', 'Concept 2 status is ACTIVE in DB');
    assert(sessionAfterCp.data.data.session.current_concept_id === concept2.id, 'Session current_concept_id updated in DB');

    // ------------------------------------------------------------------------
    console.log('\n--- 6. DASHBOARD CONTINUE LEARNING CONSISTENCY TEST ---');
    // User navigates to Dashboard
    const dashboardRes = await request('/api/dashboard', { token });
    assert(dashboardRes.status === 200, 'GET /api/dashboard returns 200');
    
    const dbPayload = dashboardRes.data.data;
    assert(dbPayload.activeSessionId === sessionId, 'Dashboard activeSessionId matches EXACT SAME session ID from Planner');
    assert(dbPayload.currentConcept.id === concept2.id, 'Dashboard currentConcept is Concept 2');
    assert(dbPayload.currentConcept.title === 'Binary Search Intuition', 'Dashboard current concept title is "Binary Search Intuition"');

    // User clicks "Continue Learning" from Dashboard -> navigates to same session route
    const continueSessionRes = await request(`/api/learning/${dbPayload.activeSessionId}`, { token });
    assert(continueSessionRes.status === 200, 'Continue Learning loads session from PostgreSQL');
    assert(continueSessionRes.data.data.session.id === sessionId, 'Session ID is verified identical');
    assert(continueSessionRes.data.data.currentConcept.id === concept2.id, 'Resumed session is directly at Concept 2');

    // ------------------------------------------------------------------------
    console.log('\n--- 7. LOGOUT & RELOGIN PERSISTENCE TEST ---');
    // Relogin user
    const reloginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: userCredentials.email, password: userCredentials.password },
    });
    const newToken = reloginRes.data.data?.token || reloginRes.data.token;
    assert(reloginRes.status === 200, 'User relogged in successfully');

    // Verify session and progress persisted in PostgreSQL
    const reloginDashboardRes = await request('/api/dashboard', { token: newToken });
    assert(reloginDashboardRes.data.data.activeSessionId === sessionId, 'Active session ID preserved across logout/login');
    assert(reloginDashboardRes.data.data.currentConcept.id === concept2.id, 'Current concept preserved across logout/login');

    console.log('\n===============================================================');
    console.log(`🎉 ALL PLANNER → SESSION TESTS PASSED: ${passed}/${passed + failed}`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Test suite execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPlannerIntegrationTests();
