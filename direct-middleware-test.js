// Test middleware directly by making HTTP requests
const http = require('http');

async function testRoute(route) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: route,
      method: 'GET',
      headers: {
        'User-Agent': 'Direct-Middleware-Test'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          location: res.headers.location,
          data: data.substring(0, 500) // First 500 chars
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Direct HTTP middleware tests...\n');

  const routes = ['/calendar', '/dashboard', '/', '/login'];
  
  for (const route of routes) {
    console.log(`📋 Testing ${route}:`);
    const result = await testRoute(route);
    
    console.log(`  Status: ${result.statusCode}`);
    console.log(`  Location: ${result.location || 'none'}`);
    
    if (result.statusCode >= 300 && result.statusCode < 400) {
      console.log(`  ✅ Redirect detected to: ${result.location}`);
    } else if (result.statusCode === 200) {
      console.log(`  ⚠️  200 OK - no redirect (check if content is login page)`);
      
      // Check if the response contains login form
      if (result.data.includes('login') || result.data.includes('Login')) {
        console.log(`  📝 Response appears to be login page content`);
      }
    }
    
    console.log('');
  }
}

runTests().catch(console.error);