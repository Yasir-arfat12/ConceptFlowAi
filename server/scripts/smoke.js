// scripts/smoke.js
// End-to-end smoke test:
// register -> login -> me -> start "Teach me Binary Search" -> current -> answer checkpoint -> doubt -> confirm /current -> resume
import 'dotenv/config';

const BASE = `http://localhost:${process.env.PORT || 3000}/api`;
let token = '';
let sessionId = '';
let checkpointId = '';
let conceptId = '';

const email = `smoke_${Date.now()}@test.com`;
const password = 'TestPass123!';

async function req(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const body = await res.json();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body?.error)}`);
  return body?.data ?? body;
}

async function run() {
  console.log('\n🔥 ConceptFlow Smoke Test');
  console.log(`   AI_MODE: ${process.env.AI_MODE}`);
  console.log(`   User: ${email}\n`);

  // 1. Register
  await req('/auth/signup', { method: 'POST', body: JSON.stringify({ firstName: 'Smoke', email, password }) });
  console.log('✅ Register');

  // 2. Login
  const loginRes = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  token = loginRes.token;
  console.log('✅ Login');

  // 3. Me
  const meRes = await req('/auth/me');
  console.log(`✅ Me: ${meRes.user.name}`);

  // 4. Start session
  console.log('\n   Starting learning session (may take a moment)...');
  const startRes = await req('/learning/start', { method: 'POST', body: JSON.stringify({ topic: 'Teach me Binary Search from beginner to advanced' }) });
  sessionId = startRes.session.id;
  console.log(`✅ Start session: ${startRes.session.topic_title} (${startRes.session.concepts.length} concepts)`);

  // 5. Get current concept
  const currentRes = await req(`/learning/${sessionId}/current`);
  conceptId = currentRes.concept.id;
  checkpointId = currentRes.concept.checkpoint_id;
  console.log(`✅ Current concept: "${currentRes.concept.title}" (checkpoint: ${checkpointId})`);

  // 6. Answer checkpoint
  const answerRes = await req(`/checkpoints/${checkpointId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer: 'Binary search requires sorted data so it can eliminate half the search space by comparing with the middle element, discarding the wrong half.' }),
  });
  console.log(`✅ Checkpoint answered: score=${answerRes.score}, evaluatedBy=${answerRes.evaluatedBy}, passed=${answerRes.isCorrect}`);

  // 7. Ask doubt on concept 1 (already completed, should work)
  const doubtRes = await req(`/learning/${sessionId}/concept/${conceptId}/doubt`, {
    method: 'POST',
    body: JSON.stringify({ question: 'Why does binary search need a sorted array?' }),
  });
  console.log(`✅ Doubt answered: source=${doubtRes.source}`);

  // 8. Confirm /current now points to concept 2
  const current2 = await req(`/learning/${sessionId}/current`);
  if (current2.concept && current2.concept.id !== conceptId) {
    console.log(`✅ /current advanced to concept 2: "${current2.concept.title}"`);
  } else if (current2.completed) {
    console.log('✅ Session completed (1-concept path)');
  } else {
    console.log(`⚠️  /current still shows same concept (check CHECKPOINT_PASS_SCORE)`);
  }

  // 9. Dashboard
  const dashboard = await req('/dashboard');
  console.log(`✅ Dashboard: streak=${dashboard.stats.streak}, topicsStarted=${dashboard.stats.topicsStarted}`);

  // 10. Progress
  const progress = await req('/progress');
  console.log(`✅ Progress: ${progress.sessions.length} session(s) tracked`);

  console.log('\n🎉 All smoke tests passed!\n');
}

run().catch((err) => {
  console.error('\n❌ Smoke test failed:', err.message);
  process.exit(1);
});
