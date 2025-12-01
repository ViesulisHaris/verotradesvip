// Authentication Performance Test
// Measures authentication flow from login form submission to dashboard redirect
// Target: <5000ms, Current: 5643ms

const puppeteer = require('puppeteer');

async function testAuthenticationPerformance() {
  console.log('🚀 Starting Authentication Performance Test');
  console.log('📊 Target: <5000ms, Current Issue: 5643ms');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      authStartTime: null,
      authEndTime: null,
      authSteps: []
    };
    
    // Override fetch to monitor auth calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      if (typeof url === 'string' && url.includes('auth')) {
        console.log(`🔍 [AUTH FETCH] Starting: ${url}`);
        window.performanceMetrics.authSteps.push({
          type: 'fetch_start',
          url,
          timestamp: startTime
        });
      }
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        
        if (typeof url === 'string' && url.includes('auth')) {
          console.log(`✅ [AUTH FETCH] Completed: ${url} in ${endTime - startTime}ms`);
          window.performanceMetrics.authSteps.push({
            type: 'fetch_complete',
            url,
            duration: endTime - startTime,
            timestamp: endTime
          });
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        console.log(`❌ [AUTH FETCH] Failed: ${url} in ${endTime - startTime}ms`);
        window.performanceMetrics.authSteps.push({
          type: 'fetch_error',
          url,
          duration: endTime - startTime,
          error: error.message,
          timestamp: endTime
        });
        throw error;
      }
    };
    
    // Monitor navigation events
    window.addEventListener('beforeunload', () => {
      if (window.performanceMetrics.authStartTime && !window.performanceMetrics.authEndTime) {
        window.performanceMetrics.authEndTime = performance.now();
        console.log('🔄 [NAVIGATION] Page unloading, capturing auth end time');
      }
    });
  });
  
  try {
    console.log('📍 Step 1: Navigating to login page');
    const navStart = performance.now();
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const navEnd = performance.now();
    console.log(`✅ Login page loaded in ${navEnd - navStart}ms`);
    
    // Wait for login form to be ready
    await page.waitForSelector('#email, input[type="email"]', { timeout: 10000 });
    console.log('✅ Login form is ready');
    
    console.log('📍 Step 2: Filling in credentials');
    const fillStart = performance.now();
    
    // Fill in test credentials
    await page.type('#email, input[type="email"]', 'testuser1000@verotrade.com', { delay: 50 });
    await page.type('#password, input[type="password"]', 'TestPassword123!', { delay: 50 });
    
    const fillEnd = performance.now();
    console.log(`✅ Form filled in ${fillEnd - fillStart}ms`);
    
    console.log('📍 Step 3: Submitting login form');
    
    // Start timing authentication
    await page.evaluate(() => {
      window.performanceMetrics.authStartTime = performance.now();
      console.log('⏱️ [AUTH START] Authentication timer started');
    });
    
    const submitStart = performance.now();
    
    // Submit the form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"], .login-button')
    ]);
    
    const submitEnd = performance.now();
    console.log(`✅ Form submission and navigation completed in ${submitEnd - submitStart}ms`);
    
    // Wait a bit for any final auth processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const authDuration = window.performanceMetrics.authEndTime 
        ? window.performanceMetrics.authEndTime - window.performanceMetrics.authStartTime
        : performance.now() - window.performanceMetrics.authStartTime;
        
      return {
        authStartTime: window.performanceMetrics.authStartTime,
        authEndTime: window.performanceMetrics.authEndTime,
        authDuration: authDuration,
        authSteps: window.performanceMetrics.authSteps,
        currentUrl: window.location.href,
        pageTitle: document.title
      };
    });
    
    console.log('\n📊 AUTHENTICATION PERFORMANCE RESULTS:');
    console.log('=' .repeat(60));
    console.log(`⏱️  Total Authentication Time: ${metrics.authDuration.toFixed(2)}ms`);
    console.log(`🌐 Final URL: ${metrics.currentUrl}`);
    console.log(`📄 Page Title: ${metrics.pageTitle}`);
    
    if (metrics.authDuration < 5000) {
      console.log('✅ PERFORMANCE TARGET ACHIEVED: <5000ms');
    } else {
      console.log('❌ PERFORMANCE TARGET MISSED: >5000ms');
      console.log(`📈 Needs improvement: ${(metrics.authDuration - 5000).toFixed(2)}ms over target`);
    }
    
    console.log('\n🔍 AUTHENTICATION STEPS BREAKDOWN:');
    metrics.authSteps.forEach((step, index) => {
      const timestamp = new Date(step.timestamp).toISOString();
      console.log(`${index + 1}. [${step.type.toUpperCase()}] ${step.url || 'N/A'} - ${step.duration ? step.duration.toFixed(2) + 'ms' : 'N/A'} - ${timestamp}`);
      if (step.error) {
        console.log(`   ❌ Error: ${step.error}`);
      }
    });
    
    // Analyze bottlenecks
    console.log('\n🔍 BOTTLENECK ANALYSIS:');
    const fetchSteps = metrics.authSteps.filter(step => step.type === 'fetch_complete');
    const totalFetchTime = fetchSteps.reduce((sum, step) => sum + step.duration, 0);
    
    if (fetchSteps.length > 0) {
      console.log(`📡 Total Auth API Calls: ${fetchSteps.length}`);
      console.log(`📡 Total API Time: ${totalFetchTime.toFixed(2)}ms`);
      console.log(`📡 Average API Call: ${(totalFetchTime / fetchSteps.length).toFixed(2)}ms`);
      console.log(`📡 API vs Total: ${((totalFetchTime / metrics.authDuration) * 100).toFixed(1)}% of auth time`);
      
      // Find slowest API call
      const slowestCall = fetchSteps.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest
      );
      console.log(`🐌 Slowest API Call: ${slowest.url} - ${slowest.duration.toFixed(2)}ms`);
    }
    
    // Check if we reached dashboard
    const success = metrics.currentUrl.includes('/dashboard') || metrics.pageTitle.includes('Dashboard');
    console.log(`🎯 Authentication Success: ${success ? '✅ YES' : '❌ NO'}`);
    
    if (!success) {
      console.log('⚠️  Authentication may have failed or redirected elsewhere');
    }
    
    return {
      success,
      authDuration: metrics.authDuration,
      targetAchieved: metrics.authDuration < 5000,
      apiCalls: fetchSteps.length,
      totalApiTime: totalFetchTime,
      bottlenecks: identifyBottlenecks(metrics)
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

function identifyBottlenecks(metrics) {
  const bottlenecks = [];
  const fetchSteps = metrics.authSteps.filter(step => step.type === 'fetch_complete');
  
  // Check for slow API calls
  fetchSteps.forEach(step => {
    if (step.duration > 2000) {
      bottlenecks.push({
        type: 'slow_api_call',
        description: `Slow API call: ${step.url} took ${step.duration.toFixed(2)}ms`,
        severity: 'high',
        duration: step.duration
      });
    } else if (step.duration > 1000) {
      bottlenecks.push({
        type: 'moderate_api_call',
        description: `Moderate API call: ${step.url} took ${step.duration.toFixed(2)}ms`,
        severity: 'medium',
        duration: step.duration
      });
    }
  });
  
  // Check total auth time
  if (metrics.authDuration > 5000) {
    bottlenecks.push({
      type: 'total_auth_time',
      description: `Total authentication time ${metrics.authDuration.toFixed(2)}ms exceeds 5000ms target`,
      severity: 'high',
      duration: metrics.authDuration
    });
  }
  
  // Check for too many API calls
  if (fetchSteps.length > 5) {
    bottlenecks.push({
      type: 'excessive_api_calls',
      description: `Too many authentication API calls: ${fetchSteps.length} (should be ≤5)`,
      severity: 'medium',
      count: fetchSteps.length
    });
  }
  
  return bottlenecks;
}

// Run the test
if (require.main === module) {
  testAuthenticationPerformance()
    .then(results => {
      console.log('\n🏁 TEST COMPLETED');
      console.log('=' .repeat(60));
      if (results.success) {
        console.log('✅ Authentication test completed successfully');
      } else {
        console.log('❌ Authentication test failed');
      }
      
      if (results.targetAchieved) {
        console.log('🎯 Performance target achieved: <5000ms');
      } else {
        console.log('⚠️  Performance target missed: >5000ms');
        console.log('📋 Identified bottlenecks:');
        results.bottlenecks.forEach(bottleneck => {
          console.log(`   ${bottleneck.severity === 'high' ? '🔴' : '🟡'} ${bottleneck.description}`);
        });
      }
      
      process.exit(results.success && results.targetAchieved ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthenticationPerformance, identifyBottlenecks };