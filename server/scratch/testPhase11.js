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

    const sessionsRes = await fetchApi('/api/learning', 'GET', null, token);
    const sessions = sessionsRes.data.data;
    
    if (sessions.length > 0) {
      const sessionId = sessions[0].id;
      
      console.log(`\n2. Generating Assignment for Session ${sessionId} (POST /api/learning/${sessionId}/assignment)`);
      const assignGenRes = await fetchApi(`/api/learning/${sessionId}/assignment`, 'POST', {}, token);
      console.log(`Status: ${assignGenRes.status}`);
      if (assignGenRes.status === 201 || assignGenRes.status === 200) {
        console.log(`Assignment Generated! Title: ${assignGenRes.data.data.title}`);
        console.log(`Tasks count: ${assignGenRes.data.data.tasks.length}`);
      } else {
        console.log('Error:', assignGenRes.data);
      }
      
      console.log(`\n3. Fetching Generated Assignment (GET /api/learning/${sessionId}/assignment)`);
      const assignGetRes = await fetchApi(`/api/learning/${sessionId}/assignment`, 'GET', null, token);
      console.log(`Status: ${assignGetRes.status}`);
      if (assignGetRes.status === 200) {
        console.log(`Assignment Fetched Successfully. Task 1:`, assignGetRes.data.data.tasks[0]);
      } else {
        console.log('Error:', assignGetRes.data);
      }
      
    } else {
      console.log('No sessions found in database to test.');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
};

runTest();
