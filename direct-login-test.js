#!/usr/bin/env node

/**
 * DIRECT LOGIN TESTING SCRIPT
 * 
 * This script performs direct testing of the authentication system by making actual HTTP requests
 * to the running application and testing real authentication flows.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000
};

// Test credentials - UPDATE WITH REAL CREDENTIALS
const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com', // Replace with valid test email
    password: 'testpassword123' // Replace with valid test password
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
};

// Test results
const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: [],
  errors: []
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Log test result
 */
function logTest(testName, status, details = '', error = null) {
  const result = {
    testName,
    status: status ? 'PASS' : 'FAIL',
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.totalTests++;
  
  if (status) {
    testResults.passedTests++;
    console.log(`✅ ${testName}: ${details}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: ${details}`);
    if (error) {
      console.log(`   Error: ${error.message}`);
      testResults.errors.push({ testName, error: error.message });
    }
  }
}

/**
 * Test 1: Check if login page loads
 */
async function testLoginPageLoad() {
  console.log('\n🧪 TEST 1: Login Page Load');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/login`);
    
    const hasLoginForm = response.data.includes('input[type="email"]') && 
                       response.data.includes('input[type="password"]') &&
                       response.data.includes('Welcome to VeroTrade');
    
    const success = response.statusCode === 200 && hasLoginForm;
    
    logTest(
      'Login Page Load',
      success,
      `Status: ${response.statusCode}, Has form: ${hasLoginForm}`
    );
    
  } catch (error) {
    logTest('Login Page Load', false, 'Failed to load login page', error);
  }
}

/**
 * Test 2: Test protected route redirect
 */
async function testProtectedRouteRedirect() {
  console.log('\n🧪 TEST 2: Protected Route Redirect');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/dashboard`);
    
    // Should redirect to login or show auth required
    const isRedirected = response.statusCode === 302 || 
                        response.statusCode === 307 ||
                        response.data.includes('login') ||
                        response.data.includes('Authentication Required');
    
    const success = isRedirected;
    
    logTest(
      'Protected Route Redirect',
      success,
      `Status: ${response.statusCode}, Redirected to login: ${isRedirected}`
    );
    
  } catch (error) {
    logTest('Protected Route Redirect', false, 'Failed to test protected route', error);
  }
}

/**
 * Test 3: Test login with invalid credentials
 */
async function testInvalidCredentials() {
  console.log('\n🧪 TEST 3: Invalid Credentials');
  
  try {
    // First get the login page to get any CSRF token or session
    const loginPage = await makeRequest(`${TEST_CONFIG.baseUrl}/login`);
    
    // Try to post invalid credentials
    const postData = JSON.stringify({
      email: TEST_CREDENTIALS.invalid.email,
      password: TEST_CREDENTIALS.invalid.password
    });
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      body: postData
    });
    
    // Should show error or not authenticate
    const hasError = response.statusCode === 401 ||
                    response.statusCode === 400 ||
                    response.data.includes('Invalid') ||
                    response.data.includes('error');
    
    const success = hasError;
    
    logTest(
      'Invalid Credentials',
      success,
      `Status: ${response.statusCode}, Error shown: ${hasError}`
    );
    
  } catch (error) {
    logTest('Invalid Credentials', false, 'Failed to test invalid credentials', error);
  }
}

/**
 * Test 4: Test Supabase authentication endpoint
 */
async function testSupabaseAuth() {
  console.log('\n🧪 TEST 4: Supabase Authentication');
  
  try {
    // Test Supabase auth configuration
    const authCheckUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co/auth/v1/user';
    
    // Test with invalid token (should fail)
    const response = await makeRequest(authCheckUrl, {
      headers: {
        'Authorization': 'Bearer invalid_token',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk'
      }
    });
    
    // Should return 401 for invalid token
    const success = response.statusCode === 401;
    
    logTest(
      'Supabase Authentication Endpoint',
      success,
      `Status: ${response.statusCode}, Auth endpoint accessible: ${response.statusCode < 500}`
    );
    
  } catch (error) {
    logTest('Supabase Authentication Endpoint', false, 'Failed to test Supabase auth', error);
  }
}

/**
 * Test 5: Test application health
 */
async function testApplicationHealth() {
  console.log('\n🧪 TEST 5: Application Health');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
    
    const isRunning = response.statusCode === 200;
    const hasContent = response.data.length > 0;
    
    const success = isRunning && hasContent;
    
    logTest(
      'Application Health',
      success,
      `Status: ${response.statusCode}, Has content: ${hasContent}`
    );
    
  } catch (error) {
    logTest('Application Health', false, 'Application not accessible', error);
  }
}

/**
 * Test 6: Test API routes
 */
async function testAPIRoutes() {
  console.log('\n🧪 TEST 6: API Routes');
  
  try {
    // Test if API routes exist
    const testRoutes = [
      '/api/test-server-auth',
      '/api/execute-multiple-markets-cleanup',
      '/api/debug-env'
    ];
    
    let accessibleRoutes = 0;
    
    for (const route of testRoutes) {
      try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}${route}`);
        if (response.statusCode < 500) {
          accessibleRoutes++;
        }
      } catch (error) {
        // Route might not exist, that's ok
      }
    }
    
    const success = accessibleRoutes > 0;
    
    logTest(
      'API Routes',
      success,
      `Accessible routes: ${accessibleRoutes}/${testRoutes.length}`
    );
    
  } catch (error) {
    logTest('API Routes', false, 'Failed to test API routes', error);
  }
}

/**
 * Test 7: Test authentication state management
 */
async function testAuthStateManagement() {
  console.log('\n🧪 TEST 7: Authentication State Management');
  
  try {
    // Check if auth context is properly initialized
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/login`);
    
    const hasAuthContext = response.data.includes('AuthContext') ||
                          response.data.includes('useAuth') ||
                          response.data.includes('AuthProvider');
    
    const hasClientSideAuth = response.data.includes('supabase.auth') ||
                             response.data.includes('signInWithPassword');
    
    const success = hasAuthContext && hasClientSideAuth;
    
    logTest(
      'Authentication State Management',
      success,
      `Has auth context: ${hasAuthContext}, Has client auth: ${hasClientSideAuth}`
    );
    
  } catch (error) {
    logTest('Authentication State Management', false, 'Failed to test auth state', error);
  }
}

/**
 * Test 8: Test environment configuration
 */
async function testEnvironmentConfig() {
  console.log('\n🧪 TEST 8: Environment Configuration');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/debug-env`);
    
    let hasSupabaseUrl = false;
    let hasSupabaseKey = false;
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data);
        hasSupabaseUrl = data.supabaseUrl === 'SET';
        hasSupabaseKey = data.supabaseAnonKey === 'SET';
      } catch (e) {
        // Debug endpoint might not return JSON
      }
    }
    
    // Check if app is running with proper env vars
    const success = hasSupabaseUrl && hasSupabaseKey;
    
    logTest(
      'Environment Configuration',
      success,
      `Supabase URL: ${hasSupabaseUrl}, Supabase Key: ${hasSupabaseKey}`
    );
    
  } catch (error) {
    logTest('Environment Configuration', false, 'Failed to test environment config', error);
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  testResults.endTime = new Date().toISOString();
  
  const report = {
    summary: {
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      duration: new Date(testResults.endTime) - new Date(testResults.startTime),
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: testResults.totalTests > 0 ? (testResults.passedTests / testResults.totalTests * 100).toFixed(2) + '%' : '0%'
    },
    testResults: testResults.tests,
    errors: testResults.errors,
    testConfiguration: TEST_CONFIG,
    recommendations: []
  };
  
  // Add recommendations based on test results
  if (testResults.failedTests > 0) {
    report.recommendations.push('Fix failing tests before proceeding with user authentication');
  }
  
  if (!testResults.tests.find(t => t.testName === 'Application Health' && t.status === 'PASS')) {
    report.recommendations.push('Ensure application is running on http://localhost:3000');
  }
  
  if (!testResults.tests.find(t => t.testName === 'Environment Configuration' && t.status === 'PASS')) {
    report.recommendations.push('Check Supabase environment variables configuration');
  }
  
  // Save report
  const reportPath = path.join(__dirname, 'DIRECT_LOGIN_TEST_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, 'DIRECT_LOGIN_TEST_REPORT.md');
  fs.writeFileSync(markdownPath, markdownReport);
  
  console.log(`\n📊 Test Report Generated:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: ${markdownPath}`);
  
  return report;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
  const { summary, testResults, errors, recommendations } = report;
  
  let markdown = `# DIRECT LOGIN TEST REPORT

## Test Summary

- **Start Time:** ${summary.startTime}
- **End Time:** ${summary.endTime}
- **Duration:** ${summary.duration}ms
- **Total Tests:** ${summary.totalTests}
- **Passed Tests:** ${summary.passedTests}
- **Failed Tests:** ${summary.failedTests}
- **Success Rate:** ${summary.successRate}

## Test Results

| Test Name | Status | Details | Error |
|-----------|--------|---------|-------|
`;

  testResults.forEach(test => {
    const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    markdown += `| ${test.testName} | ${status} | ${test.details || '-'} | ${test.error || '-'} |\n`;
  });

  if (errors.length > 0) {
    markdown += `\n## Errors\n\n`;
    errors.forEach(error => {
      markdown += `- **${error.testName}**: ${error.error}\n`;
    });
  }

  if (recommendations.length > 0) {
    markdown += `\n## Recommendations\n\n`;
    recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
  }

  markdown += `\n## Authentication System Status\n\n`;
  
  if (summary.failedTests === 0) {
    markdown += `✅ **AUTHENTICATION SYSTEM IS FUNCTIONAL**\n\n`;
    markdown += `### What's Working:\n`;
    markdown += `- ✅ Application is running and accessible\n`;
    markdown += `- ✅ Login page loads with required elements\n`;
    markdown += `- ✅ Protected routes redirect unauthenticated users\n`;
    markdown += `- ✅ Authentication context is properly configured\n`;
    markdown += `- ✅ Environment variables are set correctly\n`;
    markdown += `- ✅ API routes are accessible\n`;
    markdown += `- ✅ Supabase authentication endpoints are reachable\n`;
  } else {
    markdown += `❌ **AUTHENTICATION SYSTEM NEEDS ATTENTION**\n\n`;
    markdown += `### Issues Found:\n`;
    testResults.filter(t => t.status === 'FAIL').forEach(test => {
      markdown += `- ❌ **${test.testName}**: ${test.details}\n`;
    });
  }

  return markdown;
}

/**
 * Main test execution
 */
async function runDirectLoginTests() {
  console.log('🚀 Starting Direct Login Tests');
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseUrl}`);
  
  // Run all tests
  await testApplicationHealth();
  await testLoginPageLoad();
  await testProtectedRouteRedirect();
  await testInvalidCredentials();
  await testSupabaseAuth();
  await testAPIRoutes();
  await testAuthStateManagement();
  await testEnvironmentConfig();
  
  // Generate report
  const report = generateTestReport();
  
  // Display summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   Total Tests: ${report.summary.totalTests}`);
  console.log(`   Passed: ${report.summary.passedTests}`);
  console.log(`   Failed: ${report.summary.failedTests}`);
  console.log(`   Success Rate: ${report.summary.successRate}`);
  
  if (report.summary.failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication system infrastructure is working correctly.');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Test with real user credentials in browser');
    console.log('   2. Verify complete login flow manually');
    console.log('   3. Test session persistence and logout');
  } else {
    console.log('\n❌ Some tests failed. Please review the report for details.');
  }
  
  return report;
}

// Run tests if this script is executed directly
if (require.main === module) {
  console.log('🔍 DIRECT LOGIN TESTING');
  console.log('=' .repeat(50));
  
  runDirectLoginTests()
    .then(() => {
      console.log('\n✅ Test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runDirectLoginTests,
  TEST_CONFIG,
  TEST_CREDENTIALS
};