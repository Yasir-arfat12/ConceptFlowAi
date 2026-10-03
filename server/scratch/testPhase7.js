const http = require('http');

const fetchApi = (path, method, body, token) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(data);
    req.end();
  });
};

const runTest = async () => {
  try {
    console.log('1. Logging in...');
    const loginRes = await fetchApi('/api/auth/login', 'POST', { email: 'test@example.com', password: 'password123' });
    const token = loginRes.data.token;
    if (!token) throw new Error('Login failed');

    console.log('\n2. Fetching all sessions (GET /api/learning)');
    const allSessionsRes = await fetchApi('/api/learning', 'GET', null, token);
    console.log(`Status: ${allSessionsRes.status}`);
    const sessions = allSessionsRes.data.data;
    console.log('Sessions count:', sessions.length);

    if (sessions.length > 0) {
      const sessionId = sessions[0].id;
      
      console.log(`\n3. Fetching full session detail (GET /api/learning/${sessionId})`);
      const sessionRes = await fetchApi(`/api/learning/${sessionId}`, 'GET', null, token);
      console.log(`Status: ${sessionRes.status}`);
      console.log('Concepts:', sessionRes.data.data.concepts.map(c => ({ id: c.id, status: c.status })));
      
      console.log(`\n4. Fetching current active concept (GET /api/learning/${sessionId}/current)`);
      const currentRes = await fetchApi(`/api/learning/${sessionId}/current`, 'GET', null, token);
      console.log(`Status: ${currentRes.status}`);
      console.log('Current Concept:', currentRes.data.data ? currentRes.data.data.title : 'None');
    } else {
      console.log('No sessions found in database to test.');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
};

runTest();
