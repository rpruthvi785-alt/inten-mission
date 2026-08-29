require('dotenv').config();
const http = require('http');
const app = require('../src/app');

function makeRequest(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...(options.headers || {}) },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testPhase2() {
  console.log('--- STARTING PHASE 2 VERIFICATION TESTS (AUTH) ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`[Test Server] Running at 127.0.0.1:${port}`);

  try {
    // Test 1: POST /auth/login with missing fields
    console.log('\n[Test 1] POST /auth/login with missing body/fields...');
    const res1 = await makeRequest(port, '/auth/login', {
      method: 'POST',
      body: {},
    });
    if (res1.status !== 400 || !res1.body.error) {
      throw new Error(`Expected 400 Bad Request for missing credentials, got ${res1.status}: ${JSON.stringify(res1.body)}`);
    }
    console.log('✓ Correctly rejected missing credentials with 400:', res1.body);

    // Test 2: POST /auth/login with valid credentials
    console.log('\n[Test 2] POST /auth/login with valid credentials...');
    const res2 = await makeRequest(port, '/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' },
    });
    if (res2.status !== 200 || !res2.body.token || res2.body.token !== 'demo-static-token') {
      throw new Error(`Expected 200 OK with token 'demo-static-token', got ${res2.status}: ${JSON.stringify(res2.body)}`);
    }
    console.log('✓ Successfully authenticated and received token:', res2.body);

    // Test 3: Protected route with no Authorization header
    console.log('\n[Test 3] GET /auth/verify without Authorization header...');
    const res3 = await makeRequest(port, '/auth/verify', {
      method: 'GET',
    });
    if (res3.status !== 401) {
      throw new Error(`Expected 401 for missing auth header, got ${res3.status}: ${JSON.stringify(res3.body)}`);
    }
    console.log('✓ Correctly rejected missing auth header with 401:', res3.body);

    // Test 4: Protected route with invalid Bearer token
    console.log('\n[Test 4] GET /auth/verify with invalid Bearer token...');
    const res4 = await makeRequest(port, '/auth/verify', {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid-token-123' },
    });
    if (res4.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${res4.status}: ${JSON.stringify(res4.body)}`);
    }
    console.log('✓ Correctly rejected invalid token with 401:', res4.body);

    // Test 5: Protected route with valid Bearer token
    console.log('\n[Test 5] GET /auth/verify with valid Bearer token...');
    const res5 = await makeRequest(port, '/auth/verify', {
      method: 'GET',
      headers: { Authorization: 'Bearer demo-static-token' },
    });
    if (res5.status !== 200 || !res5.body.valid) {
      throw new Error(`Expected 200 for valid token, got ${res5.status}: ${JSON.stringify(res5.body)}`);
    }
    console.log('✓ Correctly authorized request with 200:', res5.body);

    console.log('\n=== PHASE 2 VERIFICATION COMPLETED SUCCESSFULLY ===\n');
  } finally {
    server.close();
  }
  process.exit(0);
}

testPhase2().catch((err) => {
  console.error('\n❌ PHASE 2 VERIFICATION FAILED:', err);
  process.exit(1);
});
