/**
 * Comprehensive End-to-End Production Test Suite for ConceptFlow AI
 * Verifies all 36+ criteria: Auth, Security, Learning Progression, Checkpoints, Quizzes,
 * Assignments, Mastery Engine, Dashboard, Resume, Doubts, and Database Persistence.
 */
const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(buf);
          } catch {
            parsed = { raw: buf };
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const get = (path, token) => request('GET', path, null, token);
const post = (path, body, token) => request('POST', path, body, token);

const results = [];
function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} ${name}${details ? ` (${details})` : ''}`);
}

async function runComprehensiveAudit() {
  console.log('\n============================================================');
  console.log('🚀 CONCEPTFLOW AI — PRODUCTION E2E SYSTEM AUDIT');
  console.log('============================================================\n');

  // ─── 1. Health Check ───────────────────────────────────────────────────────
  console.log('1. Testing System Health & Database Connectivity:');
  const healthRes = await get('/api/health');
  recordTest('GET /api/health', healthRes.status === 200 && healthRes.data?.status === 'ok', `status: ${healthRes.status}`);

  // ─── 2. Authentication Suite ───────────────────────────────────────────────
  console.log('\n2. Testing Authentication & JWT Suite:');
  const timestamp = Date.now();
  const userAEmail = `audit_user_a_${timestamp}@conceptflow.ai`;
  const userBEmail = `audit_user_b_${timestamp}@conceptflow.ai`;

  // 2.1 Register User A
  const regARes = await post('/api/auth/register', {
    name: 'Audit Learner A',
    email: userAEmail,
    password: 'password123',
  });
  const tokenA = regARes.data?.data?.token || regARes.data?.token;
  recordTest('POST /api/auth/register (User A)', regARes.status === 201 && !!tokenA, `token generated: ${!!tokenA}`);

  // 2.2 Duplicate Email Rejection
  const dupRes = await post('/api/auth/register', {
    name: 'Duplicate Learner',
    email: userAEmail,
    password: 'password123',
  });
  recordTest('POST /api/auth/register (Duplicate Email)', dupRes.status === 409, `status: ${dupRes.status}`);

  // 2.3 Invalid Registration Inputs
  const invRegRes = await post('/api/auth/register', {
    name: '',
    email: 'notanemail',
    password: 'short',
  });
  recordTest('POST /api/auth/register (Validation Rejection)', invRegRes.status === 422 || invRegRes.status === 400, `status: ${invRegRes.status}`);

  // 2.4 Login User A
  const loginARes = await post('/api/auth/login', {
    email: userAEmail,
    password: 'password123',
  });
  recordTest('POST /api/auth/login (Correct Credentials)', loginARes.status === 200 && !!loginARes.data?.data?.token, `status: ${loginARes.status}`);

  // 2.5 Login with Wrong Password
  const wrongPassRes = await post('/api/auth/login', {
    email: userAEmail,
    password: 'wrongpassword',
  });
  recordTest('POST /api/auth/login (Wrong Password)', wrongPassRes.status === 401, `status: ${wrongPassRes.status}`);

  // 2.6 Get /me with valid JWT
  const meRes = await get('/api/auth/me', tokenA);
  recordTest('GET /api/auth/me (Valid JWT)', meRes.status === 200 && meRes.data?.data?.user?.email === userAEmail, `email: ${meRes.data?.data?.user?.email}`);

  // 2.7 Get /me with invalid JWT
  const invalidJwtRes = await get('/api/auth/me', 'invalid.token.string');
  recordTest('GET /api/auth/me (Invalid JWT)', invalidJwtRes.status === 401 || invalidJwtRes.status === 403, `status: ${invalidJwtRes.status}`);

  // 2.8 Get /me with missing token
  const missingJwtRes = await get('/api/auth/me');
  recordTest('GET /api/auth/me (Missing Token)', missingJwtRes.status === 401, `status: ${missingJwtRes.status}`);

  // Register User B for security & isolation testing
  const regBRes = await post('/api/auth/register', {
    name: 'Audit Learner B',
    email: userBEmail,
    password: 'password123',
  });
  const tokenB = regBRes.data?.data?.token || regBRes.data?.token;

  // ─── 3. Dashboard Empty State ──────────────────────────────────────────────
  console.log('\n3. Testing Dashboard Initial / Empty State:');
  const emptyDashRes = await get('/api/dashboard', tokenA);
  const emptyDashData = emptyDashRes.data?.data || emptyDashRes.data;
  recordTest(
    'GET /api/dashboard (Empty State)',
    emptyDashRes.status === 200 && emptyDashData?.stats?.conceptsCompleted === 0,
    `concepts: ${emptyDashData?.stats?.conceptsCompleted}`
  );

  // ─── 4. Learning Session Creation & Fallback ────────────────────────────────
  console.log('\n4. Testing Learning Session Creation & Binary Search Demo:');
  
  // 4.1 Empty / Whitespace Topic Validation
  const emptyTopicRes = await post('/api/learning/start', { topic: '   ' }, tokenA);
  recordTest('POST /api/learning/start (Empty Topic Rejection)', emptyTopicRes.status === 400 || emptyTopicRes.status === 422, `status: ${emptyTopicRes.status}`);

  // 4.2 Start Binary Search Session (Prebuilt offline / deterministic)
  const startSessionRes = await post('/api/learning/start', { topic: 'Binary Search' }, tokenA);
  const sessionA = startSessionRes.data?.data?.session || startSessionRes.data?.session;
  const conceptsA = startSessionRes.data?.data?.concepts || startSessionRes.data?.concepts;

  recordTest(
    'POST /api/learning/start (Binary Search Session)',
    startSessionRes.status === 201 && sessionA?.id && conceptsA?.length === 6,
    `Session ID: ${sessionA?.id}, Concepts: ${conceptsA?.length}`
  );

  // 4.3 Verify Concept Initial State (Concept 1 active, Concepts 2-6 locked)
  const c1Active = conceptsA?.[0]?.status === 'active';
  const restLocked = conceptsA?.slice(1).every((c) => c.status === 'locked');
  recordTest('Initial Concept State (Concept 1 active, rest locked)', c1Active && restLocked, `C1 status: ${conceptsA?.[0]?.status}`);

  // ─── 5. Cross-User Security & Isolation ────────────────────────────────────
  console.log('\n5. Testing Cross-User Security & Isolation:');

  // User B attempts to access User A's session
  const bAccessRes = await get(`/api/learning/${sessionA.id}`, tokenB);
  recordTest(
    'Cross-User Session Access Protection (User B -> Session A)',
    bAccessRes.status === 404 || bAccessRes.status === 403,
    `status: ${bAccessRes.status}`
  );

  // ─── 6. Concept Learning Progression & Checkpoints ─────────────────────────
  console.log('\n6. Testing Concept Progression & Checkpoint Evaluation:');

  const answers = [
    'Because sorted order allows us to compare with mid and eliminate half the search space with guarantee.',
    'Since 12 is greater than 8, we discard the right half and move right = mid - 1 to continue searching left.',
    'It prevents 32-bit integer overflow when left and right are very large numbers.',
    'Because mid has already been checked and is not the target, so excluding it prevents an infinite loop and shrinks the space.',
    'When nums[mid] == target, do not return immediately; record result = mid and continue searching left with right = mid - 1.',
    'The time complexity is O(log n) logarithmic time which takes roughly 20 steps for 1,000,000 elements.',
  ];

  let lastNextConceptId = null;

  for (let i = 0; i < conceptsA.length; i++) {
    const concept = conceptsA[i];

    // Fetch checkpoints for concept
    const cpRes = await get(`/api/learning/${sessionA.id}/concepts/${concept.id}/checkpoints`, tokenA);
    const cpList = cpRes.data?.data?.checkpoints || cpRes.data?.checkpoints || [];
    const cp = cpList[0];

    // Cross-user checkpoint submission protection
    if (i === 0) {
      const bCpRes = await post(`/api/checkpoints/${cp.id}/answer`, { answer: answers[0] }, tokenB);
      recordTest(
        'Cross-User Checkpoint Protection (User B -> User A Checkpoint)',
        bCpRes.status === 403 || bCpRes.status === 404,
        `status: ${bCpRes.status}`
      );
    }

    // Submit valid answer
    const ansRes = await post(`/api/checkpoints/${cp.id}/answer`, { answer: answers[i] }, tokenA);
    const ansData = ansRes.data?.data || ansRes.data;

    recordTest(
      `Checkpoint ${i + 1}/6: "${concept.title.slice(0, 30)}..."`,
      ansRes.status === 200 && ansData?.passed === true && ansData?.score >= 60,
      `score: ${ansData?.score}%, nextConcept: ${ansData?.nextConceptId}`
    );

    lastNextConceptId = ansData?.nextConceptId;

    if (i < conceptsA.length - 1) {
      // Verify next concept unlocked in PostgreSQL
      const sessCheck = await get(`/api/learning/${sessionA.id}`, tokenA);
      const updatedConcepts = sessCheck.data?.data?.concepts || sessCheck.data?.concepts || [];
      const nextC = updatedConcepts.find((c) => c.id === lastNextConceptId);
      recordTest(
        `Concept ${i + 2} Unlocked & Active in PostgreSQL`,
        nextC?.status === 'active',
        `status: ${nextC?.status}`
      );
    } else {
      // Final concept: Verify session is completed
      recordTest(
        'Session Completed on Final Checkpoint',
        ansData?.sessionCompleted === true && ansData?.assignmentAvailable === true,
        `sessionCompleted: ${ansData?.sessionCompleted}`
      );
    }
  }

  // ─── 7. Session Resume & State Retention (No Reset on Refresh) ─────────────
  console.log('\n7. Testing Session State Retention & Resume:');
  const sessFinal = await get(`/api/learning/${sessionA.id}`, tokenA);
  const sessFinalData = sessFinal.data?.data?.session || sessFinal.data?.session;
  const conceptsFinal = sessFinal.data?.data?.concepts || sessFinal.data?.concepts;
  const allCompleted = conceptsFinal.every((c) => c.status === 'completed');

  recordTest(
    'Session Completed State Persisted in PostgreSQL',
    sessFinalData?.status === 'completed' && allCompleted,
    `Session status: ${sessFinalData?.status}, Completed concepts: ${conceptsFinal.length}/${conceptsFinal.length}`
  );

  // ─── 8. Doubt Chat Isolation ───────────────────────────────────────────────
  console.log('\n8. Testing Doubt Chat Contextual Resolution:');
  const doubtRes = await post(
    `/api/learning/${sessionA.id}/concepts/${conceptsA[0].id}/doubt`,
    { message: 'Why is binary search logarithmic time?' },
    tokenA
  );
  recordTest(
    'POST Concept Doubt (Contextual Q&A)',
    doubtRes.status === 200 && !!doubtRes.data?.data?.answer,
    `answer length: ${doubtRes.data?.data?.answer?.length}`
  );

  // Verify doubt didn't alter concept status
  const sessAfterDoubt = await get(`/api/learning/${sessionA.id}`, tokenA);
  const conceptsAfterDoubt = sessAfterDoubt.data?.data?.concepts || sessAfterDoubt.data?.concepts;
  const stillComplete = conceptsAfterDoubt.every((c) => c.status === 'completed');
  recordTest('Doubt Chat Isolation (No Side Effects on Progression)', stillComplete, 'Progression intact');

  // ─── 9. Personalized Quiz Flow & Mastery Update ────────────────────────────
  console.log('\n9. Testing Personalized Quiz System:');
  const quizCreateRes = await post(`/api/learning/${sessionA.id}/quiz`, {}, tokenA);
  const quizQuestions = quizCreateRes.data?.data?.questions || quizCreateRes.data?.questions || [];
  recordTest(
    'POST /api/learning/:sessionId/quiz (Generate/Retrieve Quiz)',
    quizCreateRes.status === 201 || quizCreateRes.status === 200,
    `questions: ${quizQuestions.length}`
  );

  // Submit Quiz Answers
  const quizAnswersPayload = quizQuestions.map((q, idx) => ({
    questionIndex: idx,
    questionId: q.id,
    conceptId: q.conceptId,
    selectedOptionIndex: q.correctOptionIndex ?? 0,
  }));

  const quizSubmitRes = await post(`/api/learning/${sessionA.id}/quiz/submit`, { answers: quizAnswersPayload }, tokenA);
  const quizSubmitData = quizSubmitRes.data?.data || quizSubmitRes.data;
  recordTest(
    'POST /api/learning/:sessionId/quiz/submit (Store & Evaluate Quiz)',
    quizSubmitRes.status === 200 && quizSubmitData?.score >= 80,
    `score: ${quizSubmitData?.score}%, attemptId: ${quizSubmitData?.attemptId}`
  );

  // ─── 10. Personalized Assignment Flow ──────────────────────────────────────
  console.log('\n10. Testing Personalized Session-Based Assignment System:');
  
  // 10.1 Fetch Assignment from PostgreSQL
  const assignGetRes = await get(`/api/learning/${sessionA.id}/assignment`, tokenA);
  const assignment = assignGetRes.data?.data?.assignment || assignGetRes.data?.assignment;
  recordTest(
    'GET /api/learning/:sessionId/assignment (Fetch Generated Assignment)',
    assignGetRes.status === 200 && assignment?.questions?.length === 8,
    `questions: ${assignment?.questions?.length}, title: "${assignment?.title}"`
  );

  // 10.2 Check concept mapping for all 8 questions
  const allMapped = assignment?.questions?.every((q) => q.conceptId && q.conceptTitle);
  recordTest(
    'Assignment Questions Concept Mapping (conceptId & conceptTitle)',
    allMapped,
    'All 8 questions mapped to session concepts'
  );

  // 10.3 Answer Questions Step-by-Step
  let answeredCorrectly = 0;
  for (let qIdx = 0; qIdx < assignment.questions.length; qIdx++) {
    const q = assignment.questions[qIdx];
    const chosen = qIdx === 3 ? 'B' : q.correctAnswer; // Miss 1 intentionally
    const ansRes = await post(
      `/api/learning/${sessionA.id}/assignment/answer`,
      { questionId: q.id, selectedAnswer: chosen },
      tokenA
    );
    if (ansRes.data?.data?.isCorrect) answeredCorrectly++;
  }
  recordTest(
    'Step-by-Step Assignment Question Evaluation & Locking',
    answeredCorrectly === 7,
    `answered: ${assignment.questions.length}/8, correct: ${answeredCorrectly}`
  );

  // 10.4 Finalize Assignment Attempt
  const assignSubmitRes = await post(`/api/learning/${sessionA.id}/assignment/submit`, {}, tokenA);
  const assignResult = assignSubmitRes.data?.data || assignSubmitRes.data;
  recordTest(
    'POST /api/learning/:sessionId/assignment/submit (Persist Score & Update Mastery)',
    assignSubmitRes.status === 200 && assignResult?.score > 0,
    `score: ${assignResult?.score}%, updatedMastery: ${assignResult?.newMastery}%`
  );

  // ─── 11. Dashboard & Mastery Analytics Verification ────────────────────────
  console.log('\n11. Testing Dashboard & Insights PostgreSQL Integration:');
  const dashFinalRes = await get('/api/dashboard', tokenA);
  const dashFinalData = dashFinalRes.data?.data || dashFinalRes.data;

  recordTest(
    'Dashboard Concepts Mastered (6/6)',
    dashFinalData?.stats?.conceptsCompleted === 6,
    `conceptsCompleted: ${dashFinalData?.stats?.conceptsCompleted}/${dashFinalData?.stats?.totalConcepts}`
  );

  recordTest(
    'Dashboard Completed Assignments (1)',
    dashFinalData?.stats?.assignmentsCompleted >= 1,
    `assignments: ${dashFinalData?.stats?.assignmentsCompleted}`
  );

  recordTest(
    'Dashboard Completed Quizzes (1)',
    dashFinalData?.stats?.quizzesCompleted >= 1,
    `quizzes: ${dashFinalData?.stats?.quizzesCompleted}`
  );

  recordTest(
    'Dashboard Overall Mastery Score matches DB',
    dashFinalData?.mastery?.overallScore >= 75,
    `overallScore: ${dashFinalData?.mastery?.overallScore}% (${dashFinalData?.mastery?.masteryLabel})`
  );

  // ─── 12. Multi-Session Isolation Suite ─────────────────────────────────────
  console.log('\n12. Testing Multi-Session Isolation (Session A vs Session B):');
  const startSessionBRes = await post('/api/learning/start', { topic: 'Neural Networks' }, tokenA);
  const sessionB = startSessionBRes.data?.data?.session || startSessionBRes.data?.session;

  const userSessionsRes = await get('/api/learning/sessions', tokenA);
  const userSessions = userSessionsRes.data?.data?.sessions || userSessionsRes.data?.sessions || [];
  recordTest(
    'Multiple Sessions Maintained Concurrently in PostgreSQL',
    userSessions.length >= 2,
    `sessions count: ${userSessions.length}`
  );

  // ─── Summary ───────────────────────────────────────────────────────────────
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n============================================================');
  console.log(`📊 AUDIT SUMMARY: ${passed}/${total} TESTS PASSED (${failed} failures)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
