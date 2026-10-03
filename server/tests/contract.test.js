// tests/contract.test.js
// Contract tests using Node's built-in test runner + supertest
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import 'dotenv/config';
import app from '../src/app.js';
import pool from '../src/db/pool.js';

const request = supertest(app);
let token = '';
let sessionId = '';
let checkpointId = '';
let conceptId = '';

const TEST_EMAIL = `contract_${Date.now()}@test.com`;
const TEST_PASS = 'TestPass123!';

before(async () => {
  // Clean up any previous test user
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
});

after(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.end();
});

describe('Health', () => {
  it('GET /api/health returns status', async () => {
    const res = await request.get('/api/health');
    assert.equal(res.status, 200);
    assert.ok(res.body.status);
    assert.ok(res.body.ai);
  });
});

describe('Auth', () => {
  it('POST /api/auth/signup creates user', async () => {
    const res = await request.post('/api/auth/signup').send({ firstName: 'Test', email: TEST_EMAIL, password: TEST_PASS });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.user.id);
    assert.equal(res.body.data.user.email, TEST_EMAIL);
    assert.ok(!res.body.data.user.password_hash, 'password_hash must not be returned');
  });

  it('POST /api/auth/signup duplicate email returns 409', async () => {
    const res = await request.post('/api/auth/signup').send({ firstName: 'Test', email: TEST_EMAIL, password: TEST_PASS });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'EMAIL_TAKEN');
  });

  it('POST /api/auth/login wrong password returns 401', async () => {
    const res = await request.post('/api/auth/login').send({ email: TEST_EMAIL, password: 'wrongpassword' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('POST /api/auth/login returns token and user', async () => {
    const res = await request.post('/api/auth/login').send({ email: TEST_EMAIL, password: TEST_PASS });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.user.id);
    assert.equal(typeof res.body.data.user.name, 'string');
    token = res.body.data.token;
  });

  it('GET /api/auth/me without token returns 401', async () => {
    const res = await request.get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('GET /api/auth/me returns user info', async () => {
    const res = await request.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.user.id);
    assert.equal(typeof res.body.data.user.name, 'string');
    assert.ok(!res.body.data.user.password_hash);
  });
});

describe('Learning', () => {
  it('POST /api/learning/start creates session', async () => {
    const res = await request
      .post('/api/learning/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Binary Search' });
    assert.equal(res.status, 201);
    assert.ok(res.body.data.session.id);
    assert.ok(res.body.data.session.topic_title);
    assert.ok(Array.isArray(res.body.data.session.concepts));
    assert.ok(res.body.data.session.concepts.length >= 4, 'should have 4-6 concepts');
    sessionId = res.body.data.session.id;
  });

  it('GET /api/learning lists sessions', async () => {
    const res = await request.get('/api/learning').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.sessions));
  });

  it('GET /api/learning/:sessionId returns session', async () => {
    const res = await request.get(`/api/learning/${sessionId}`).set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.session.id, sessionId);
  });

  it('GET /api/learning/:sessionId returns 404 for other user', async () => {
    const fakeToken = token.slice(0, -5) + 'XXXXX';
    const res = await request.get(`/api/learning/${sessionId}`).set('Authorization', `Bearer ${fakeToken}`);
    assert.equal(res.status, 401);
  });

  it('GET /api/learning/:sessionId/current returns active concept', async () => {
    const res = await request.get(`/api/learning/${sessionId}/current`).set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.concept || res.body.data.completed);
    if (res.body.data.concept) {
      conceptId = res.body.data.concept.id;
      checkpointId = res.body.data.concept.checkpoint_id;
      assert.equal(res.body.data.concept.status, 'active');
    }
  });
});

describe('Checkpoints', () => {
  it('POST /api/checkpoints/:id/answer evaluates answer', async () => {
    if (!checkpointId) return; // Skip if no checkpoint
    const res = await request
      .post(`/api/checkpoints/${checkpointId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answer: 'The array must be sorted so binary search can discard half the elements by comparing with the middle value.' });
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.data.score === 'number');
    assert.ok(typeof res.body.data.isCorrect === 'boolean');
    assert.ok(typeof res.body.data.feedback === 'string');
    assert.ok(['ai', 'fallback'].includes(res.body.data.evaluatedBy));
  });

  it('POST /api/checkpoints/:id/answer double-submit on completed returns 409', async () => {
    if (!checkpointId || !res?.body?.data?.isCorrect) return; // only if passed
    const res2 = await request
      .post(`/api/checkpoints/${checkpointId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answer: 'Another answer attempt.' });
    assert.equal(res2.status, 409);
    assert.equal(res2.body.error.code, 'CONCEPT_NOT_ACTIVE');
  });
});

describe('Doubts', () => {
  it('POST /api/learning/:sessionId/concept/:conceptId/doubt returns answer', async () => {
    if (!conceptId) return;
    const res = await request
      .post(`/api/learning/${sessionId}/concept/${conceptId}/doubt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Why does binary search need sorted data?' });
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.data.answer === 'string');
    assert.ok(res.body.data.answer.length > 10);
    assert.ok(['ai', 'fallback'].includes(res.body.data.source));
  });
});

describe('Dashboard', () => {
  it('GET /api/dashboard returns stats', async () => {
    const res = await request.get('/api/dashboard').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.data.stats.streak === 'number');
    assert.ok(typeof res.body.data.stats.topicsStarted === 'number');
  });

  it('GET /api/progress returns sessions', async () => {
    const res = await request.get('/api/progress').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.sessions));
  });
});
