// Simple Dashboard Test - Direct URL Test
// Test if dashboard loads and measure basic performance

const http = require('http');

async function testDashboardLoad() {
  console.log('🚀 Testing Dashboard Direct Load...');
  
  const startTime = Date.now();
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        console.log(`✅ Dashboard responded in ${loadTime}ms with status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Dashboard page is accessible');
          resolve({
            success: true,
            loadTime,
            statusCode: res.statusCode,
            contentLength: data.length
          });
        } else if (res.statusCode === 302 || res.statusCode === 307) {
          console.log('🔄 Dashboard redirected (likely to login)');
          resolve({
            success: false,
            loadTime,
            statusCode: res.statusCode,
            redirected: true,
            contentLength: data.length
          });
        } else {
          console.log(`❌ Dashboard returned error status: ${res.statusCode}`);
          resolve({
            success: false,
            loadTime,
            statusCode: res.statusCode,
            contentLength: data.length
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('❌ Request timed out after 10 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testLoginLoad() {
  console.log('🚀 Testing Login Page Direct Load...');
  
  const startTime = Date.now();
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        console.log(`✅ Login page responded in ${loadTime}ms with status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Login page is accessible');
          resolve({
            success: true,
            loadTime,
            statusCode: res.statusCode,
            contentLength: data.length
          });
        } else {
          console.log(`❌ Login page returned error status: ${res.statusCode}`);
          resolve({
            success: false,
            loadTime,
            statusCode: res.statusCode,
            contentLength: data.length
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('❌ Request timed out after 10 seconds');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  try {
    console.log('='.repeat(60));
    console.log('🔍 DASHBOARD PERFORMANCE TEST - DIRECT URL ACCESS');
    console.log('='.repeat(60));
    
    // Test login page first
    const loginResult = await testLoginLoad();
    console.log('\n');
    
    // Test dashboard
    const dashboardResult = await testDashboardLoad();
    console.log('\n');
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Login Page: ${loginResult.success ? '✅ Accessible' : '❌ Failed'} (${loginResult.loadTime}ms)`);
    console.log(`Dashboard: ${dashboardResult.success ? '✅ Accessible' : dashboardResult.redirected ? '🔄 Redirected' : '❌ Failed'} (${dashboardResult.loadTime}ms)`);
    
    if (dashboardResult.redirected) {
      console.log('\n💡 Dashboard is redirecting - authentication is working correctly');
      console.log('   Users without authentication are being redirected to login');
    }
    
    if (loginResult.success && dashboardResult.redirected) {
      console.log('\n🎯 NEXT STEP: Test full authentication flow');
      console.log('   The application is working correctly - dashboard requires authentication');
    } else if (!loginResult.success) {
      console.log('\n🚨 ISSUE: Login page is not accessible');
    } else if (!dashboardResult.success && !dashboardResult.redirected) {
      console.log('\n🚨 ISSUE: Dashboard is not accessible');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
runTests();