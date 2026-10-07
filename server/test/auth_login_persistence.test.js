/**
 * Auth & Session Persistence Verification Test
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

async function testAuth() {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    console.log('--- AUTHENTICATION & LOGIN PERSISTENCE SUITE ---');

    const testEmail = `Persist_${Date.now()}@DemoApp.IO`;
    const testPass = 'SecurePass123!';

    // 1. Register with whitespace & uppercase email
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Alex',
        lastName: 'Developer',
        email: `   ${testEmail}   `,
        password: testPass,
      }
    });
    assert(regRes.status === 201, 'Registration returns 201 Created');
    const token = regRes.data.token || regRes.data.data?.token;
    assert(Boolean(token), 'JWT token returned on registration');

    // 2. Validate token restoration via GET /api/auth/me
    const meRes = await request('/api/auth/me', { token });
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 for valid token');
    assert(meRes.data.data.user.email === testEmail.toLowerCase(), 'User email persisted normalized in PostgreSQL');

    // 3. Simulate page reload / exit: Login using all-lowercase without spaces
    const login1 = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail.toLowerCase(),
        password: testPass,
      }
    });
    assert(login1.status === 200, 'Login with lowercase email succeeds');

    // 4. Simulate mobile typing: Login with leading/trailing spaces and mixed case
    const login2 = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: `  ${testEmail.toUpperCase()}  `,
        password: testPass,
      }
    });
    assert(login2.status === 200, 'Login with mixed-case/whitespace email succeeds');

    // 5. Wrong password should fail cleanly with 401
    const badPass = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'WrongPassword!',
      }
    });
    assert(badPass.status === 401, 'Wrong password rejected with 401');

    // 6. Unknown email should fail cleanly with 401
    const badEmail = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'nonexistent_user_9999@test.com',
        password: testPass,
      }
    });
    assert(badEmail.status === 401, 'Nonexistent email rejected with 401');

  } finally {
    if (server) server.close();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

testAuth();
