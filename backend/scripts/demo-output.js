const http = require('http');

function apiCall(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runDemo() {
  console.log('================================================================');
  console.log('LIVE SERVER API OUTPUT DEMONSTRATION');
  console.log('================================================================\n');

  // 1. Health
  console.log('>>> 1. Health Check [GET /health]');
  const health = await apiCall('/health');
  console.log(JSON.stringify(health.body, null, 2));

  // 2. Login
  console.log('\n>>> 2. Login [POST /auth/login]');
  const loginRes = await apiCall('/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123',
  });
  console.log(JSON.stringify(loginRes.body, null, 2));
  const token = loginRes.body.token;

  // 3. Match PO CI4PO05788
  console.log('\n>>> 3. Dynamic Three-Way Match Engine [GET /match/CI4PO05788]');
  const matchRes = await apiCall('/match/CI4PO05788', 'GET', null, token);
  console.log(JSON.stringify(matchRes.body, null, 2));

  // 4. Executive Summary
  console.log('\n>>> 4. Executive Summary & Linked Docs [GET /summary/CI4PO05788]');
  const summaryRes = await apiCall('/summary/CI4PO05788', 'GET', null, token);
  console.log(JSON.stringify(summaryRes.body, null, 2));

  // 5. SKU Master Catalog
  console.log('\n>>> 5. SKU Master Catalog [GET /masters/sku]');
  const skuRes = await apiCall('/masters/sku', 'GET', null, token);
  console.log(JSON.stringify(skuRes.body, null, 2));

  console.log('\n================================================================');
  console.log('END OF LIVE OUTPUT DEMONSTRATION');
  console.log('================================================================');
}

runDemo().catch(console.error);
