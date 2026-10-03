// scripts/test_all_routes.js
// Exhaustive test of all endpoints in ConceptFlow

const BASE = 'http://localhost:3000/api';

async function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runAllTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE ROUTE TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('1. Health Check Route:');
  const health = await req('/health');
  assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returns status ok', JSON.stringify(health.data));

  // 2. Auth - Register
  console.log('\n2. Auth Routes:');
  const uniqueEmail = `test_${Date.now()}@example.com`;
  
  // Test signup validation failure
  const invalidSignup = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid-email', password: '123' })
  });
  assert(invalidSignup.status === 400, 'POST /api/auth/signup rejects invalid email/short password');

  // Test valid signup
  const validSignup = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Jane',
      lastName: 'Doe',
      email: uniqueEmail,
      password: 'StrongPassword123!',
      age: 22,
      dob: '2002-05-15',
      address: '123 Learning Lane'
    })
  });
  assert(validSignup.status === 201 && validSignup.data.success && validSignup.data.data.user.email === uniqueEmail.toLowerCase(), 'POST /api/auth/signup creates user', JSON.stringify(validSignup.data));

  // Test signup duplicate conflict
  const duplicateSignup = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPassword123!'
    })
  });
  assert(duplicateSignup.status === 409, 'POST /api/auth/signup prevents duplicate email (409)');

  // Test login with invalid credentials
  const badLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword!' })
  });
  assert(badLogin.status === 401, 'POST /api/auth/login rejects wrong password (401)');

  // Test valid login
  const validLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: uniqueEmail, password: 'StrongPassword123!' })
  });
  assert(validLogin.status === 200 && validLogin.data.data.token, 'POST /api/auth/login returns JWT and user', JSON.stringify(validLogin.data));
  const token = validLogin.data.data?.token;

  // Test /auth/me
  const authMe = await req('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(authMe.status === 200 && authMe.data.data.user.email === uniqueEmail.toLowerCase(), 'GET /api/auth/me returns authenticated user');

  // Test unauthenticated request
  const unauthMe = await req('/auth/me');
  assert(unauthMe.status === 401, 'GET /api/auth/me rejects unauthenticated request (401)');

  // 3. Topics Route
  console.log('\n3. Topics & Content Routes:');
  const topicsRes = await req('/topics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(topicsRes.status === 200 && Array.isArray(topicsRes.data.data.topics) && topicsRes.data.data.topics.length > 0, 'GET /api/topics returns curated topics', `Count: ${topicsRes.data.data?.topics?.length}`);

  // 4. Learning Session Lifecycle
  console.log('\n4. Learning Session Routes:');
  const startSessionRes = await req('/learning/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic: 'Variables & Data Types' })
  });
  assert(startSessionRes.status === 201 && startSessionRes.data.data.session?.id, 'POST /api/learning/start creates session with structured concepts', JSON.stringify(startSessionRes.data));
  
  const sessionId = startSessionRes.data.data?.session?.id;
  const concepts = startSessionRes.data.data?.session?.concepts || [];
  const firstConcept = concepts[0];

  // List sessions
  const listRes = await req('/learning', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(listRes.status === 200 && Array.isArray(listRes.data.data.sessions) && listRes.data.data.sessions.length >= 1, 'GET /api/learning lists user sessions');

  // Get session by ID
  const sessionDetail = await req(`/learning/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(sessionDetail.status === 200 && sessionDetail.data.data.session.id === sessionId, 'GET /api/learning/:sessionId returns session details');

  // Get current concept for session
  const currentConceptRes = await req(`/learning/${sessionId}/current`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(currentConceptRes.status === 200 && currentConceptRes.data.data.concept?.id === firstConcept?.id, 'GET /api/learning/:sessionId/current returns active concept');

  // 5. Checkpoint submission
  console.log('\n5. Checkpoint Routes:');
  const checkpoint = firstConcept?.checkpoint;
  assert(Boolean(checkpoint && checkpoint.id), 'Current concept has a valid checkpoint');

  if (checkpoint && checkpoint.id) {
    const answerRes = await req(`/checkpoints/${checkpoint.id}/answer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answer: 'Variables allocate named storage in memory for data values and maintain state.' })
    });
    assert(answerRes.status === 200 && (answerRes.data.data.score !== undefined || answerRes.data.data.feedback), 'POST /api/checkpoints/:id/answer submits answer and evaluates understanding', JSON.stringify(answerRes.data));
  }

  // 6. Doubt Asking & Contextual Retrieval
  console.log('\n6. Doubt Routes:');
  if (firstConcept && firstConcept.id) {
    const askDoubtRes = await req(`/learning/${sessionId}/concept/${firstConcept.id}/doubt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question: 'What is the difference between let and const?' })
    });
    assert(askDoubtRes.status === 200 && askDoubtRes.data.data.reply, 'POST /api/learning/:sessionId/concept/:conceptId/doubt gets contextual AI tutor response', JSON.stringify(askDoubtRes.data));

    const doubtHistoryRes = await req(`/learning/${sessionId}/concept/${firstConcept.id}/doubt`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(doubtHistoryRes.status === 200 && Array.isArray(doubtHistoryRes.data.data.history) && doubtHistoryRes.data.data.history.length >= 1, 'GET /api/learning/:sessionId/concept/:conceptId/doubt retrieves stored conversation history');
  }

  // 7. Dashboard & Progress Analytics
  console.log('\n7. Analytics Routes:');
  const dashRes = await req('/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(dashRes.status === 200 && dashRes.data.data.stats, 'GET /api/dashboard returns stats and active sessions', JSON.stringify(dashRes.data));

  const progRes = await req('/progress', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(progRes.status === 200 && Array.isArray(progRes.data.data.progress), 'GET /api/progress returns per-topic progress list');

  console.log('\n========================================================');
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
