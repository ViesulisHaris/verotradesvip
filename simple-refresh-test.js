const puppeteer = require('puppeteer');

async function simpleRefreshTest() {
  console.log('🧪 Simple refresh test - monitoring network requests...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track network requests
  let requestCount = 0;
  let requestTimestamps = [];
  let refreshDetected = false;
  
  page.on('request', (request) => {
    if (request.url().includes('/strategies')) {
      const currentTime = Date.now();
      requestCount++;
      requestTimestamps.push(currentTime);
      
      console.log(`📊 Request #${requestCount} to /strategies at ${new Date(currentTime).toLocaleTimeString()}`);
      
      // Check if we have multiple requests in quick succession
      if (requestCount > 3) {
        const recentRequests = requestTimestamps.slice(-4);
        const timeSpan = recentRequests[3] - recentRequests[0];
        
        if (timeSpan < 2000) { // 4 requests in less than 2 seconds indicates infinite refresh
          refreshDetected = true;
          console.log('⚠️ Infinite refresh detected - 4 requests in', timeSpan, 'ms');
        }
      }
    }
  });
  
  try {
    // Navigate to the strategies page and wait for initial load
    console.log('🌐 Navigating to strategies page...');
    await page.goto('http://localhost:3001/strategies', { waitUntil: 'domcontentloaded' });
    
    // Wait a bit to see if multiple requests occur
    console.log('⏱️ Monitoring for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Analyze results
    if (refreshDetected) {
      console.log('❌ FAILED: Infinite refresh detected');
      console.log(`📊 Total requests to /strategies: ${requestCount}`);
      return false;
    } else if (requestCount > 10) {
      console.log('⚠️ WARNING: High number of requests detected');
      console.log(`📊 Total requests to /strategies: ${requestCount}`);
      return 'warning';
    } else {
      console.log('✅ SUCCESS: No infinite refresh detected');
      console.log(`📊 Total requests to /strategies: ${requestCount}`);
      
      // Analyze request patterns
      if (requestTimestamps.length > 1) {
        const intervals = [];
        for (let i = 1; i < requestTimestamps.length; i++) {
          intervals.push(requestTimestamps[i] - requestTimestamps[i-1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        console.log(`📊 Average interval between requests: ${avgInterval.toFixed(0)}ms`);
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
simpleRefreshTest().then(result => {
  console.log('\n📋 Test Result:', result);
  process.exit(result === true ? 0 : 1);
});