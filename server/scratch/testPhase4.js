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

    console.log('\n2. Starting learning session...');
    const startRes = await fetchApi('/api/learning/start', 'POST', { query: 'Binary Search' }, token);
    console.log(`Status: ${startRes.status}`);
    const sessionData = startRes.data.data;
    console.log(`Concepts returned:`, sessionData.concepts.map(c => ({ id: c.id, status: c.status })));
    
    const activeConcept = sessionData.concepts.find(c => c.status === 'active');
    const checkpointId = activeConcept.checkpoint.id;

    console.log('\n3. Submitting checkpoint answer...');
    const answerRes = await fetchApi(`/api/checkpoints/${checkpointId}/answer`, 'POST', { answer: 'It is a search algorithm.' }, token);
    console.log(`Status: ${answerRes.status}, Data:`, answerRes.data);

  } catch (err) {
    console.error('Test failed:', err);
  }
};

runTest();
