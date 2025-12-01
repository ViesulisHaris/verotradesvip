const http = require('http');

function measureLoginPerformance() {
  console.log('🚀 Starting Simple Login Performance Test...');
  
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

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📊 Headers:`, res.headers);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Login page loaded in: ${loadTime}ms`);
      console.log(`📏 Response size: ${responseData.length} bytes`);
      
      // Performance assessment
      let performanceGrade = 'EXCELLENT';
      let recommendations = [];
      
      if (loadTime > 3000) {
        performanceGrade = 'POOR';
        recommendations.push('Load time exceeds 3 seconds target');
      } else if (loadTime > 2000) {
        performanceGrade = 'FAIR';
        recommendations.push('Load time could be improved further');
      } else if (loadTime > 1000) {
        performanceGrade = 'GOOD';
        recommendations.push('Load time is acceptable');
      }
      
      console.log('\n🎯 PERFORMANCE ASSESSMENT');
      console.log('================================');
      console.log(`Load Time: ${loadTime}ms`);
      console.log(`Grade: ${performanceGrade}`);
      console.log(`Response Size: ${responseData.length} bytes`);
      
      if (recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
      // Check for login form in HTML
      const hasLoginForm = responseData.includes('login-form') && 
                         responseData.includes('email') && 
                         responseData.includes('password');
      
      console.log(`\n🔍 Login Form Found: ${hasLoginForm ? 'YES' : 'NO'}`);
      
      if (!hasLoginForm) {
        console.log('❌ Login page may not be rendering correctly');
      } else {
        console.log('✅ Login page is rendering correctly');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Performance test failed:', error.message);
  });

  req.setTimeout(10000, () => {
    console.error('❌ Request timeout after 10 seconds');
    req.destroy();
  });

  req.end();
}

// Run the test
measureLoginPerformance();