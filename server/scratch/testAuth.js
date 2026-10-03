const http = require('http');

const runTest = async () => {
  const fetchApi = (path, method, body, token) => {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : '';
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/auth${path}`,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
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

  try {
    let token = '';

    console.log('1. Testing Successful Registration');
    let res = await fetchApi('/register', 'POST', { name: 'Test User', email: 'test@example.com', password: 'password123' });
    console.log(`Status: ${res.status}, Data:`, res.data);
    
    console.log('\n2. Testing Duplicate Email Registration');
    res = await fetchApi('/register', 'POST', { name: 'Test User', email: 'test@example.com', password: 'password123' });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n3. Testing Successful Login');
    res = await fetchApi('/login', 'POST', { email: 'test@example.com', password: 'password123' });
    console.log(`Status: ${res.status}, Data:`, res.data);
    token = res.data.token;

    console.log('\n4. Testing Incorrect Password Login');
    res = await fetchApi('/login', 'POST', { email: 'test@example.com', password: 'wrongpassword' });
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n5. Testing Protected Route (/me) with valid token');
    res = await fetchApi('/me', 'GET', null, token);
    console.log(`Status: ${res.status}, Data:`, res.data);

    console.log('\n6. Testing Protected Route (/me) with invalid token');
    res = await fetchApi('/me', 'GET', null, 'invalid_token_here');
    console.log(`Status: ${res.status}, Data:`, res.data);

  } catch (err) {
    console.error('Test failed:', err);
  }
};

runTest();
