const http = require('http');
const { URL } = require('url');

// Test script to verify middleware is working
async function testMiddleware() {
  console.log('🧪 Testing middleware functionality...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test cases
  const testCases = [
    {
      name: 'Calendar route (should redirect to login)',
      path: '/calendar',
      expectedStatus: 307, // Redirect status
      expectedLocation: '/login'
    },
    {
      name: 'Dashboard route (should redirect to login)',
      path: '/dashboard',
      expectedStatus: 307,
      expectedLocation: '/login'
    },
    {
      name: 'Login route (should allow access)',
      path: '/login',
      expectedStatus: 200
    },
    {
      name: 'Home route (should allow access)',
      path: '/',
      expectedStatus: 200
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   Path: ${testCase.path}`);
    
    try {
      const response = await makeRequest(baseUrl + testCase.path);
      
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === testCase.expectedStatus) {
        console.log(`   ✅ Status code matches expected: ${testCase.expectedStatus}`);
      } else {
        console.log(`   ❌ Status code mismatch. Expected: ${testCase.expectedStatus}, Got: ${response.statusCode}`);
      }
      
      if (testCase.expectedLocation) {
        const locationHeader = response.headers.location;
        if (locationHeader && locationHeader.includes(testCase.expectedLocation)) {
          console.log(`   ✅ Redirect location correct: ${locationHeader}`);
        } else {
          console.log(`   ❌ Redirect location incorrect. Expected to contain: ${testCase.expectedLocation}, Got: ${locationHeader}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error making request: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🏁 Middleware testing complete!');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 3000,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'middleware-test-script'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(res);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Wait a bit for the server to start, then run tests
setTimeout(() => {
  testMiddleware().catch(console.error);
}, 3000);