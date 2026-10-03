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
      
      const sessionRes = await fetchApi(`/api/learning/${sessionId}`, 'GET', null, token);
      const activeConcept = sessionRes.data.data.concepts.find(c => c.status === 'active') || sessionRes.data.data.concepts[0];
      
      console.log(`\n2. Asking doubt on Concept: ${activeConcept.title} (ID: ${activeConcept.id})`);
      
      const question = "Can you explain this again but simpler?";
      console.log(`Question: "${question}"`);
      
      const doubtRes = await fetchApi(`/api/learning/${sessionId}/concept/${activeConcept.id}/doubt`, 'POST', { question }, token);
      console.log(`Status: ${doubtRes.status}`);
      if (doubtRes.status === 200) {
        console.log(`AI Answer:\n`, doubtRes.data.data.answer);
      } else {
        console.log('Error:', doubtRes.data);
      }
    } else {
      console.log('No sessions found in database to test.');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
};

runTest();
