const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000/api/generate-test-data';
const TEST_RESULTS_FILE = 'deletion-test-results.json';

// Test results will be stored here
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Helper function to log test results
function logTest(testName, status, message, details = null) {
  const test = {
    name: testName,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: ${message}`);
  }
  
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { response: null, data: { error: error.message } };
  }
}

// Test 1: Test unauthenticated deletion request
async function testUnauthenticatedDeletion() {
  console.log('\n🔍 Testing unauthenticated deletion request...');
  
  const { response, data } = await makeRequest(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete-all' })
  });
  
  if (!response) {
    logTest('Unauthenticated Deletion', 'FAIL', 'Failed to make request', data.error);
    return;
  }
  
  if (response.status === 401 && data.error === 'Authentication required') {
    logTest('Unauthenticated Deletion', 'PASS', 'Correctly rejected unauthenticated request', {
      status: response.status,
      error: data.error
    });
  } else {
    logTest('Unauthenticated Deletion', 'FAIL', 'Should have rejected unauthenticated request', {
      expectedStatus: 401,
      actualStatus: response.status,
      expectedError: 'Authentication required',
      actualError: data.error
    });
  }
}

// Test 2: Test authenticated deletion request with invalid token
async function testInvalidTokenDeletion() {
  console.log('\n🔍 Testing deletion with invalid authentication token...');
  
  const { response, data } = await makeRequest(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer invalid-token-here'
    },
    body: JSON.stringify({ action: 'delete-all' })
  });
  
  if (!response) {
    logTest('Invalid Token Deletion', 'FAIL', 'Failed to make request', data.error);
    return;
  }
  
  if (response.status === 401) {
    logTest('Invalid Token Deletion', 'PASS', 'Correctly rejected invalid token', {
      status: response.status,
      error: data.error
    });
  } else {
    logTest('Invalid Token Deletion', 'FAIL', 'Should have rejected invalid token', {
      expectedStatus: 401,
      actualStatus: response.status,
      response: data
    });
  }
}

// Test 3: Test deletion with invalid action
async function testInvalidAction() {
  console.log('\n🔍 Testing deletion with invalid action...');
  
  const { response, data } = await makeRequest(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'invalid-action' })
  });
  
  if (!response) {
    logTest('Invalid Action', 'FAIL', 'Failed to make request', data.error);
    return;
  }
  
  if (response.status === 400 && data.error === 'Invalid action') {
    logTest('Invalid Action', 'PASS', 'Correctly rejected invalid action', {
      status: response.status,
      error: data.error,
      availableActions: data.availableActions
    });
  } else {
    logTest('Invalid Action', 'FAIL', 'Should have rejected invalid action', {
      expectedStatus: 400,
      actualStatus: response.status,
      response: data
    });
  }
}

// Test 4: Test malformed JSON request
async function testMalformedRequest() {
  console.log('\n🔍 Testing deletion with malformed JSON...');
  
  const { response, data } = await makeRequest(API_URL, {
    method: 'POST',
    body: 'invalid-json{'
  });
  
  if (!response) {
    logTest('Malformed Request', 'FAIL', 'Failed to make request', data.error);
    return;
  }
  
  if (response.status >= 400) {
    logTest('Malformed Request', 'PASS', 'Correctly handled malformed JSON', {
      status: response.status,
      response: data
    });
  } else {
    logTest('Malformed Request', 'FAIL', 'Should have rejected malformed JSON', {
      expectedStatus: '>= 400',
      actualStatus: response.status,
      response: data
    });
  }
}

// Test 5: Test GET request (should fail)
async function testInvalidMethod() {
  console.log('\n🔍 Testing deletion with GET method...');
  
  const { response, data } = await makeRequest(API_URL, {
    method: 'GET'
  });
  
  if (!response) {
    logTest('Invalid Method', 'FAIL', 'Failed to make request', data.error);
    return;
  }
  
  if (response.status === 405 || response.status === 400) {
    logTest('Invalid Method', 'PASS', 'Correctly rejected GET method', {
      status: response.status,
      response: data
    });
  } else {
    logTest('Invalid Method', 'FAIL', 'Should have rejected GET method', {
      expectedStatus: '405 or 400',
      actualStatus: response.status,
      response: data
    });
  }
}

// Test 6: Test authenticated deletion (requires browser session)
async function testAuthenticatedDeletion() {
  console.log('\n🔍 Testing authenticated deletion...');
  console.log('⚠️  This test requires manual verification in the browser');
  console.log('   Please navigate to http://localhost:3000/test-comprehensive-data');
  console.log('   Log in and click the "Delete All Data" button');
  console.log('   Verify that the operation succeeds and data is deleted');
  
  logTest('Authenticated Deletion', 'MANUAL', 'Requires manual verification in browser', {
    instructions: [
      'Navigate to http://localhost:3000/test-comprehensive-data',
      'Log in with valid credentials',
      'Click "Delete All Data" button',
      'Verify success response',
      'Check that trades and strategies are deleted'
    ]
  });
}

// Test 7: Test API response structure
async function testResponseStructure() {
  console.log('\n🔍 Testing API response structure...');
  
  // Test the verify-data endpoint to check response structure
  const { response, data } = await makeRequest(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'verify-data' })
  });
  
  if (!response) {
    logTest('Response Structure', 'FAIL', 'Failed to make request', data.error);
    return;
  }
  
  // Check if response has expected structure (even if auth fails)
  const hasMessage = data.hasOwnProperty('message') || data.hasOwnProperty('error');
  const hasStatus = response.status;
  
  if (hasMessage && hasStatus) {
    logTest('Response Structure', 'PASS', 'API returns properly structured responses', {
      status: response.status,
      hasMessage,
      hasError: data.hasOwnProperty('error'),
      hasData: data.hasOwnProperty('verification') || data.hasOwnProperty('strategies') || data.hasOwnProperty('trades')
    });
  } else {
    logTest('Response Structure', 'FAIL', 'API response structure is inconsistent', {
      status: response.status,
      response: data
    });
  }
}

// Save test results to file
function saveTestResults() {
  const filePath = path.join(__dirname, TEST_RESULTS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(testResults, null, 2));
  console.log(`\n📊 Test results saved to: ${filePath}`);
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (testResults.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Deletion Functionality Tests...');
  console.log('='.repeat(60));
  
  try {
    await testUnauthenticatedDeletion();
    await testInvalidTokenDeletion();
    await testInvalidAction();
    await testMalformedRequest();
    await testInvalidMethod();
    await testAuthenticatedDeletion();
    await testResponseStructure();
    
    saveTestResults();
    printSummary();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    logTest('Test Execution', 'FAIL', 'Test execution failed', error.message);
    saveTestResults();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const { response } = await makeRequest('http://localhost:3000');
    return response && response.status < 500;
  } catch (error) {
    return false;
  }
}

// Run tests if server is available
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Server is not running on http://localhost:3000');
    console.error('Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  await runTests();
}

// Run the tests
main().catch(console.error);