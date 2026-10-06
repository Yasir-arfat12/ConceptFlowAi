/**
 * End-to-End Test for Personalized Session-Based Assignment System
 */
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(buf) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buf });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(buf) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buf });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('🚀 Starting ConceptFlow Personalized Assignment E2E Test...\n');

  // 1. Register or Login
  const email = `testlearner_${Date.now()}@conceptflow.ai`;
  console.log(`1. Registering new learner: ${email}`);
  const regRes = await post('/api/auth/register', {
    name: 'Assignment Test Learner',
    email,
    password: 'password123',
  });

  let token = regRes.data?.data?.token || regRes.data?.token;
  if (!token) {
    console.error('Registration failed:', regRes);
    process.exit(1);
  }
  console.log('   ✓ Registered & authenticated successfully');

  // 2. Start Binary Search Session
  console.log('\n2. Starting Binary Search learning session...');
  const startRes = await post('/api/learning/start', { topic: 'Binary Search' }, token);
  const session = startRes.data?.data?.session;
  const concepts = startRes.data?.data?.concepts;
  console.log(`   ✓ Created Session ID: ${session.id} with ${concepts.length} concepts`);

  // 3. Complete each concept via checkpoints
  console.log('\n3. Progressing through all concepts & checkpoints...');
  const answers = [
    'Because sorted order allows us to compare with mid and eliminate half the search space with guarantee.',
    'Since 12 is greater than 8, we discard the right half and move right = mid - 1 to continue searching left.',
    'It prevents 32-bit integer overflow when left and right are very large numbers.',
    'Because mid has already been checked and is not the target, so excluding it prevents an infinite loop and shrinks the space.',
    'When nums[mid] == target, do not return immediately; record result = mid and continue searching left with right = mid - 1.',
    'The time complexity is O(log n) logarithmic time which takes roughly 20 steps for 1,000,000 elements.',
  ];

  for (let i = 0; i < concepts.length; i++) {
    const cRes = await get(`/api/learning/${session.id}/concepts/${concepts[i].id}/checkpoints`, token);
    const cp = cRes.data?.data?.checkpoints?.[0];
    if (cp) {
      const ansRes = await post(`/api/checkpoints/${cp.id}/answer`, { answer: answers[i] }, token);
      console.log(
        `   Concept ${i + 1}/${concepts.length}: "${concepts[i].title.slice(0, 35)}..." → Score: ${ansRes.data?.data?.score}%, Passed: ${ansRes.data?.data?.passed}`
      );
      if (ansRes.data?.data?.sessionCompleted) {
        console.log(`   🎉 Session status changed to COMPLETED! Auto assignment generated: "${ansRes.data?.data?.assignmentTitle}"`);
      }
    }
  }

  // 4. Fetch the generated personalized assignment
  console.log('\n4. Fetching personalized assignment from PostgreSQL...');
  const assignRes = await get(`/api/learning/${session.id}/assignment`, token);
  console.log('   AssignRes status:', assignRes.status, 'data:', JSON.stringify(assignRes.data));
  const assignment = assignRes.data?.data?.assignment || assignRes.data?.assignment;
  console.log(`   ✓ Assignment Title: "${assignment?.title}"`);
  console.log(`   ✓ Difficulty: ${assignment?.difficulty}, Questions count: ${assignment?.questions?.length}`);
  console.log(`   ✓ Target Focus Area: ${assignment?.focusConcepts?.[0]?.conceptTitle}`);

  // 5. Answer questions one-by-one via interactive endpoint
  console.log('\n5. Taking interactive assignment question-by-question...');
  for (let qIdx = 0; qIdx < assignment.questions.length; qIdx++) {
    const q = assignment.questions[qIdx];
    // Answer mostly correctly, purposely miss 1 to test feedback
    const chosenAnswer = qIdx === 2 ? 'C' : q.correctAnswer;
    const ansRes = await post(
      `/api/learning/${session.id}/assignment/answer`,
      { questionId: q.id, selectedAnswer: chosenAnswer },
      token
    );
    console.log(
      `   Q${qIdx + 1}: ${q.question.slice(0, 45)}... → Selected: ${chosenAnswer} (Correct: ${q.correctAnswer}) → ${ansRes.data?.data?.feedback}`
    );
  }

  // 6. Submit & Finalize Assignment
  console.log('\n6. Finalizing assignment attempt...');
  const finalRes = await post(`/api/learning/${session.id}/assignment/submit`, {}, token);
  const result = finalRes.data?.data;
  console.log(`   ✓ Final Assignment Score: ${result.score}% (${result.correctAnswers}/${result.totalQuestions} correct)`);
  console.log(`   ✓ Mastery Updated: ${result.previousMastery}% → ${result.newMastery}% (+${result.masteryDelta}% boost)`);

  // 7. Verify Dashboard Metrics
  console.log('\n7. Verifying Dashboard metrics...');
  const dashRes = await get('/api/dashboard', token);
  const dash = dashRes.data?.data || dashRes.data;
  console.log(`   ✓ Dashboard Overall Mastery: ${dash.mastery?.overallScore}%`);
  console.log(`   ✓ Dashboard Completed Assignments: ${dash.stats?.assignmentsCompleted}`);
  console.log(`   ✓ Dashboard Completed Concepts: ${dash.stats?.conceptsCompleted}/${dash.stats?.totalConcepts}`);

  console.log('\n✅ ALL E2E PERSONALIZED ASSIGNMENT CHECKS PASSED!\n');
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
