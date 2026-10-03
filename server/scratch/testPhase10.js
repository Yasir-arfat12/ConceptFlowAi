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
      
      console.log(`\n2. Generating Quiz for Session ${sessionId} (POST /api/learning/${sessionId}/quiz)`);
      const quizGenRes = await fetchApi(`/api/learning/${sessionId}/quiz`, 'POST', {}, token);
      console.log(`Status: ${quizGenRes.status}`);
      if (quizGenRes.status === 201 || quizGenRes.status === 200) {
        console.log(`Quiz Generated! Questions count: ${quizGenRes.data.data.length}`);
      } else {
        console.log('Error:', quizGenRes.data);
      }
      
      console.log(`\n3. Fetching Generated Quiz (GET /api/learning/${sessionId}/quiz)`);
      const quizGetRes = await fetchApi(`/api/learning/${sessionId}/quiz`, 'GET', null, token);
      console.log(`Status: ${quizGetRes.status}`);
      if (quizGetRes.status === 200) {
        console.log(`Quiz Fetched Successfully. Q1:`, quizGetRes.data.data[0].question);
      } else {
        console.log('Error:', quizGetRes.data);
      }
      
    } else {
      console.log('No sessions found in database to test.');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
};

runTest();
