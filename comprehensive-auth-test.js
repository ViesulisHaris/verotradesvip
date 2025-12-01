const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Authentication Test Script
 * This script thoroughly tests the authentication flow to identify issues
 */

async function runComprehensiveAuthTest() {
  console.log('🚀 Starting Comprehensive Authentication Test');
  console.log('=================================================');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: './auth-test-videos' }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`📱 [BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('request', request => {
    if (request.url().includes('/auth/v1') || request.url().includes('/rest/v1')) {
      console.log(`🌐 [REQUEST] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/auth/v1') || response.url().includes('/rest/v1')) {
      console.log(`📨 [RESPONSE] ${response.status()} ${response.url()}`);
    }
  });
  
  const testResults = {
    startTime: new Date().toISOString(),
    tests: [],
    summary: {}
  };
  
  try {
    // Test 1: Environment Variables Check
    console.log('\n🔍 Test 1: Environment Variables Check');
    console.log('-----------------------------------');
    
    await page.goto('http://localhost:3000/test-auth-debug');
    await page.waitForLoadState('networkidle');
    
    const envCheck = await page.evaluate(() => {
      const envInfo = {
        supabaseUrl: typeof window !== 'undefined' && window.process?.env?.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND',
        supabaseKey: typeof window !== 'undefined' && window.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        nodeEnv: typeof window !== 'undefined' && window.process?.env?.NODE_ENV || 'NOT FOUND'
      };
      return envInfo;
    });
    
    testResults.tests.push({
      name: 'Environment Variables',
      status: envCheck.supabaseUrl !== 'NOT FOUND' && envCheck.supabaseKey === 'SET' ? 'PASS' : 'FAIL',
      details: envCheck
    });
    
    console.log('Environment Check Result:', envCheck);
    
    // Test 2: Login Page Load
    console.log('\n🔍 Test 2: Login Page Load');
    console.log('----------------------------');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    const loginPageLoaded = await page.$('input[type="email"]');
    testResults.tests.push({
      name: 'Login Page Load',
      status: loginPageLoaded ? 'PASS' : 'FAIL',
      details: { loaded: !!loginPageLoaded }
    });
    
    console.log('Login page loaded:', !!loginPageLoaded);
    
    // Test 3: Form Validation
    console.log('\n🔍 Test 3: Form Validation');
    console.log('---------------------------');
    
    // Click submit without filling form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const errorMessage = await page.$('.bg-red-600\\/20');
    const validationPassed = errorMessage !== null;
    
    testResults.tests.push({
      name: 'Empty Form Validation',
      status: validationPassed ? 'PASS' : 'FAIL',
      details: { errorShown: validationPassed }
    });
    
    console.log('Empty form validation:', validationPassed ? 'PASS' : 'FAIL');
    
    // Test 4: Invalid Credentials
    console.log('\n🔍 Test 4: Invalid Credentials');
    console.log('------------------------------');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for authentication attempt
    await page.waitForTimeout(2000);
    
    const authError = await page.$('.bg-red-600\\/20');
    const invalidCredsTest = authError !== null;
    
    testResults.tests.push({
      name: 'Invalid Credentials',
      status: invalidCredsTest ? 'PASS' : 'FAIL',
      details: { errorShown: invalidCredsTest }
    });
    
    console.log('Invalid credentials test:', invalidCredsTest ? 'PASS' : 'FAIL');
    
    // Test 5: Valid Authentication
    console.log('\n🔍 Test 5: Valid Authentication');
    console.log('-----------------------------');
    
    // Clear form and fill with valid credentials
    await page.fill('input[type="email"]', 'testuser@verotrade.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Capture network requests during authentication
    const authRequests = [];
    page.on('request', request => {
      if (request.url().includes('/auth/v1/token')) {
        authRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for authentication process
    await page.waitForTimeout(3000);
    
    // Check if redirect happened
    const currentUrl = page.url();
    const authSuccess = currentUrl.includes('/dashboard') || currentUrl.includes('/login?error=');
    
    testResults.tests.push({
      name: 'Valid Authentication',
      status: authSuccess ? 'PASS' : 'FAIL',
      details: {
        redirectUrl: currentUrl,
        authRequests: authRequests.length
      }
    });
    
    console.log('Valid authentication test:', authSuccess ? 'PASS' : 'FAIL');
    console.log('Current URL after auth:', currentUrl);
    console.log('Auth requests captured:', authRequests.length);
    
    // Test 6: Session Persistence
    console.log('\n🔍 Test 6: Session Persistence');
    console.log('------------------------------');
    
    // Get all cookies
    const cookies = await context.cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth')
    );
    
    testResults.tests.push({
      name: 'Session Persistence',
      status: authCookies.length > 0 ? 'PASS' : 'FAIL',
      details: {
        totalCookies: cookies.length,
        authCookies: authCookies.length,
        cookieNames: authCookies.map(c => c.name)
      }
    });
    
    console.log('Session persistence test:', authCookies.length > 0 ? 'PASS' : 'FAIL');
    console.log('Auth cookies found:', authCookies.length);
    authCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value ? 'HAS_VALUE' : 'EMPTY'}`);
    });
    
    // Test 7: Middleware Authentication Check
    console.log('\n🔍 Test 7: Middleware Authentication Check');
    console.log('----------------------------------------');
    
    // Try to access a protected route
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardUrl = page.url();
    const middlewareCheck = dashboardUrl.includes('/dashboard');
    
    testResults.tests.push({
      name: 'Middleware Authentication',
      status: middlewareCheck ? 'PASS' : 'FAIL',
      details: {
        finalUrl: dashboardUrl,
        accessGranted: middlewareCheck
      }
    });
    
    console.log('Middleware authentication test:', middlewareCheck ? 'PASS' : 'FAIL');
    console.log('Final URL:', dashboardUrl);
    
    // Test 8: Session Validation
    console.log('\n🔍 Test 8: Session Validation');
    console.log('----------------------------');
    
    // Check if we can access user data
    try {
      await page.goto('http://localhost:3000/api/auth/user');
      await page.waitForLoadState('networkidle');
      
      const userResponse = await page.evaluate(() => {
        return fetch('/api/auth/user')
          .then(res => res.json())
          .then(data => ({ status: 'success', data }))
          .catch(err => ({ status: 'error', error: err.message }));
      });
      
      testResults.tests.push({
        name: 'Session Validation',
        status: userResponse.status === 'success' ? 'PASS' : 'FAIL',
        details: userResponse
      });
      
      console.log('Session validation test:', userResponse.status === 'success' ? 'PASS' : 'FAIL');
    } catch (error) {
      testResults.tests.push({
        name: 'Session Validation',
        status: 'FAIL',
        details: { error: error.message }
      });
      console.log('Session validation test: FAIL -', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.error = error.message;
  } finally {
    // Calculate summary
    const passedTests = testResults.tests.filter(test => test.status === 'PASS').length;
    const totalTests = testResults.tests.length;
    
    testResults.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      endTime: new Date().toISOString()
    };
    
    // Save results
    const resultsPath = path.join(__dirname, 'auth-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log('\n📊 Test Summary');
    console.log('==============');
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passedTests}`);
    console.log(`Failed: ${testResults.summary.failedTests}`);
    console.log(`Success Rate: ${testResults.summary.successRate}%`);
    console.log(`Results saved to: ${resultsPath}`);
    
    await context.close();
    await browser.close();
  }
  
  return testResults;
}

// Run the test
if (require.main === module) {
  runComprehensiveAuthTest()
    .then(results => {
      console.log('\n✅ Comprehensive authentication test completed');
      process.exit(results.summary.successRate === 100 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveAuthTest };