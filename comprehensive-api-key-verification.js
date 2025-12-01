/**
 * Comprehensive API Key Verification Test
 * 
 * This script thoroughly verifies that the "Invalid API key" error has been fixed
 * after updating the .env file with correct Supabase API keys.
 * 
 * Tests performed:
 * 1. Environment variables validation
 * 2. Supabase client initialization
 * 3. API connectivity test
 * 4. Authentication flow test
 * 5. Basic database operations
 * 6. Error handling verification
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {},
  clientInitialization: {},
  apiConnectivity: {},
  authentication: {},
  databaseOperations: {},
  errorHandling: {},
  summary: {
    passed: 0,
    failed: 0,
    total: 0
  }
};

// Helper function to log test results
function logTest(category, testName, passed, details = '') {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (!testResults[category]) {
    testResults[category] = {};
  }
  
  testResults[category][testName] = result;
  testResults.summary.passed += passed ? 1 : 0;
  testResults.summary.failed += passed ? 0 : 1;
  testResults.summary.total += 1;
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

// Helper function to validate JWT token format
function validateJWTFormat(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is missing or not a string' };
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'JWT must have 3 parts separated by dots' };
  }
  
  try {
    // Try to decode the header (first part)
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (!header.alg || !header.typ) {
      return { valid: false, error: 'JWT header missing required fields' };
    }
    
    // Try to decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload.iss || !payload.exp) {
      return { valid: false, error: 'JWT payload missing required fields' };
    }
    
    return { valid: true, header, payload };
  } catch (error) {
    return { valid: false, error: `JWT parsing failed: ${error.message}` };
  }
}

// Test 1: Environment Variables Validation
async function testEnvironmentVariables() {
  console.log('\n🔍 Testing Environment Variables...');
  
  // Load environment variables from .env file
  const envPath = path.join(__dirname, '.env');
  let envLoaded = false;
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      envLoaded = true;
    }
  } catch (error) {
    logTest('environment', 'envFileLoading', false, `Failed to load .env file: ${error.message}`);
    return;
  }
  
  logTest('environment', 'envFileLoading', envLoaded, envLoaded ? 'Environment variables loaded successfully' : 'No .env file found');
  
  // Test URL presence and format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasUrl = !!supabaseUrl;
  const urlValid = hasUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
  
  logTest('environment', 'supabaseUrlPresence', hasUrl, hasUrl ? `URL found: ${supabaseUrl}` : 'NEXT_PUBLIC_SUPABASE_URL is missing');
  logTest('environment', 'supabaseUrlFormat', urlValid, urlValid ? 'URL format is valid' : 'URL format is invalid');
  
  // Test Anon Key presence and format
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasKey = !!supabaseAnonKey;
  const keyValidation = validateJWTFormat(supabaseAnonKey);
  
  logTest('environment', 'supabaseAnonKeyPresence', hasKey, hasKey ? 'Anon key found' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  logTest('environment', 'supabaseAnonKeyFormat', keyValidation.valid, keyValidation.valid ? 'Anon key has valid JWT format' : keyValidation.error);
  
  // Test Service Role Key presence and format
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasServiceKey = !!serviceRoleKey;
  const serviceKeyValidation = validateJWTFormat(serviceRoleKey);
  
  logTest('environment', 'supabaseServiceKeyPresence', hasServiceKey, hasServiceKey ? 'Service role key found' : 'SUPABASE_SERVICE_ROLE_KEY is missing');
  logTest('environment', 'supabaseServiceKeyFormat', serviceKeyValidation.valid, serviceKeyValidation.valid ? 'Service role key has valid JWT format' : serviceKeyValidation.error);
  
  // Store environment info for later tests
  testResults.environment.loaded = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : null,
    serviceKey: serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : null,
    keyValidation,
    serviceKeyValidation
  };
}

// Test 2: Supabase Client Initialization
async function testClientInitialization() {
  console.log('\n🔧 Testing Supabase Client Initialization...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logTest('clientInitialization', 'prerequisites', false, 'Missing environment variables');
    return;
  }
  
  let client = null;
  let clientCreationError = null;
  
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'verotrades-api-key-test'
        }
      }
    });
    
    logTest('clientInitialization', 'clientCreation', true, 'Supabase client created successfully');
  } catch (error) {
    clientCreationError = error;
    logTest('clientInitialization', 'clientCreation', false, `Client creation failed: ${error.message}`);
    return;
  }
  
  // Test client properties
  const hasAuth = !!client?.auth;
  const hasFunctions = !!client?.functions;
  const hasStorage = !!client?.storage;
  const hasFrom = typeof client?.from === 'function';
  
  logTest('clientInitialization', 'authProperty', hasAuth, hasAuth ? 'Auth property available' : 'Auth property missing');
  logTest('clientInitialization', 'functionsProperty', hasFunctions, hasFunctions ? 'Functions property available' : 'Functions property missing');
  logTest('clientInitialization', 'storageProperty', hasStorage, hasStorage ? 'Storage property available' : 'Storage property missing');
  logTest('clientInitialization', 'fromMethod', hasFrom, hasFrom ? 'from() method available' : 'from() method missing');
  
  // Store client for later tests
  testResults.clientInitialization.client = client;
  testResults.clientInitialization.properties = {
    hasAuth,
    hasFunctions,
    hasStorage,
    hasFrom
  };
}

// Test 3: API Connectivity
async function testApiConnectivity() {
  console.log('\n🌐 Testing API Connectivity...');
  
  const client = testResults.clientInitialization.client;
  if (!client) {
    logTest('apiConnectivity', 'prerequisites', false, 'No Supabase client available');
    return;
  }
  
  // Test 1: Try to access a system table (should fail gracefully, not with "Invalid API key")
  let systemTableResult = null;
  let systemTableError = null;
  
  try {
    const { data, error } = await client.from('information_schema.tables').select('table_name').limit(1);
    systemTableError = error;
    systemTableResult = data;
    
    // We expect this to fail due to permissions, but NOT due to "Invalid API key"
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('apiConnectivity', 'systemTableAccess', false, `Invalid API key error: ${error.message}`);
    } else if (error) {
      logTest('apiConnectivity', 'systemTableAccess', true, `Expected permission error (not API key error): ${error.message}`);
    } else {
      logTest('apiConnectivity', 'systemTableAccess', true, 'Unexpected success accessing system table');
    }
  } catch (error) {
    systemTableError = error;
    logTest('apiConnectivity', 'systemTableAccess', false, `Exception during system table access: ${error.message}`);
  }
  
  // Test 2: Try to access the auth service
  let authResult = null;
  let authError = null;
  
  try {
    const { data, error } = await client.auth.getSession();
    authResult = data;
    authError = error;
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('apiConnectivity', 'authServiceAccess', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('apiConnectivity', 'authServiceAccess', true, 'Auth service accessible (no API key error)');
    }
  } catch (error) {
    authError = error;
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('apiConnectivity', 'authServiceAccess', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('apiConnectivity', 'authServiceAccess', true, `Auth service accessible (different error: ${error.message})`);
    }
  }
  
  // Test 3: Try to access a non-existent table (should fail with "relation does not exist", not "Invalid API key")
  let nonExistentTableError = null;
  
  try {
    const { data, error } = await client.from('_test_non_existent_table_xyz').select('*').limit(1);
    nonExistentTableError = error;
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('apiConnectivity', 'nonExistentTableAccess', false, `Invalid API key error: ${error.message}`);
    } else if (error && error.message && error.message.includes('does not exist')) {
      logTest('apiConnectivity', 'nonExistentTableAccess', true, `Expected "does not exist" error: ${error.message}`);
    } else {
      logTest('apiConnectivity', 'nonExistentTableAccess', true, `Different error (not API key): ${error?.message || 'Unknown'}`);
    }
  } catch (error) {
    nonExistentTableError = error;
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('apiConnectivity', 'nonExistentTableAccess', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('apiConnectivity', 'nonExistentTableAccess', true, `Different error (not API key): ${error.message}`);
    }
  }
  
  // Store results
  testResults.apiConnectivity = {
    systemTable: { error: systemTableError?.message, result: systemTableResult },
    auth: { error: authError?.message, result: authResult },
    nonExistentTable: { error: nonExistentTableError?.message }
  };
}

// Test 4: Authentication Flow
async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  const client = testResults.clientInitialization.client;
  if (!client) {
    logTest('authentication', 'prerequisites', false, 'No Supabase client available');
    return;
  }
  
  // Test 1: Check current session (should be null/unauthenticated)
  try {
    const { data, error } = await client.auth.getSession();
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'getSession', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'getSession', true, `Get session successful: ${data?.session ? 'Session exists' : 'No session (expected)'}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'getSession', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'getSession', true, `Get session completed (different error): ${error.message}`);
    }
  }
  
  // Test 2: Try to sign in with invalid credentials (should fail with "Invalid login credentials", not "Invalid API key")
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'signInWithInvalidCredentials', false, `Invalid API key error: ${error.message}`);
    } else if (error && error.message && error.message.includes('Invalid login credentials')) {
      logTest('authentication', 'signInWithInvalidCredentials', true, `Expected "Invalid login credentials" error: ${error.message}`);
    } else {
      logTest('authentication', 'signInWithInvalidCredentials', true, `Different authentication error (not API key): ${error?.message || 'Unknown'}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'signInWithInvalidCredentials', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'signInWithInvalidCredentials', true, `Different error (not API key): ${error.message}`);
    }
  }
  
  // Test 3: Try to sign up (should fail with "User already exists" or validation error, not "Invalid API key")
  try {
    const { data, error } = await client.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'signUp', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'signUp', true, `Sign up completed (no API key error): ${error?.message || 'Success'}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'signUp', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'signUp', true, `Sign up completed (different error): ${error.message}`);
    }
  }
  
  // Test 4: Try to get current user (should be null/unauthenticated)
  try {
    const { data, error } = await client.auth.getUser();
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'getCurrentUser', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'getCurrentUser', true, `Get current user successful: ${data?.user ? 'User exists' : 'No user (expected)'}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('authentication', 'getCurrentUser', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('authentication', 'getCurrentUser', true, `Get current user completed (different error): ${error.message}`);
    }
  }
}

// Test 5: Basic Database Operations
async function testDatabaseOperations() {
  console.log('\n🗄️ Testing Basic Database Operations...');
  
  const client = testResults.clientInitialization.client;
  if (!client) {
    logTest('databaseOperations', 'prerequisites', false, 'No Supabase client available');
    return;
  }
  
  // Test 1: Try to list tables (should fail with permissions, not API key error)
  try {
    const { data, error } = await client.rpc('get_table_info');
    
    if (error && error.message && error.message.includes('Invalid API key')) {
      logTest('databaseOperations', 'listTables', false, `Invalid API key error: ${error.message}`);
    } else if (error) {
      logTest('databaseOperations', 'listTables', true, `Expected permission error (not API key): ${error.message}`);
    } else {
      logTest('databaseOperations', 'listTables', true, 'Unexpected success listing tables');
    }
  } catch (error) {
    if (error.message && error.message.includes('Invalid API key')) {
      logTest('databaseOperations', 'listTables', false, `Invalid API key error: ${error.message}`);
    } else {
      logTest('databaseOperations', 'listTables', true, `Different error (not API key): ${error.message}`);
    }
  }
  
  // Test 2: Try to access a common table that might exist (trades, strategies, users, etc.)
  const commonTables = ['trades', 'strategies', 'users', 'profiles', 'auth.users'];
  let tableAccessResults = [];
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await client.from(tableName).select('*').limit(1);
      
      if (error && error.message && error.message.includes('Invalid API key')) {
        tableAccessResults.push({ table: tableName, success: false, error: 'Invalid API key' });
      } else if (error && error.message && error.message.includes('does not exist')) {
        tableAccessResults.push({ table: tableName, success: true, error: 'Table does not exist' });
      } else if (error) {
        tableAccessResults.push({ table: tableName, success: true, error: error.message });
      } else {
        tableAccessResults.push({ table: tableName, success: true, result: 'Data retrieved' });
      }
    } catch (error) {
      if (error.message && error.message.includes('Invalid API key')) {
        tableAccessResults.push({ table: tableName, success: false, error: 'Invalid API key' });
      } else {
        tableAccessResults.push({ table: tableName, success: true, error: error.message });
      }
    }
  }
  
  const allTablesPassed = tableAccessResults.every(result => result.success);
  logTest('databaseOperations', 'commonTableAccess', allTablesPassed, 
    allTablesPassed ? 'All table accesses completed without API key errors' : 
    'Some table accesses failed with API key errors');
  
  // Store detailed results
  testResults.databaseOperations.tableAccess = tableAccessResults;
}

// Test 6: Error Handling Verification
async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...');
  
  const client = testResults.clientInitialization.client;
  if (!client) {
    logTest('errorHandling', 'prerequisites', false, 'No Supabase client available');
    return;
  }
  
  // Test that errors are properly structured and don't contain "Invalid API key"
  const errorTests = [
    {
      name: 'invalidTable',
      test: () => client.from('_invalid_table_name').select('*')
    },
    {
      name: 'invalidAuth',
      test: () => client.auth.signInWithPassword({ email: '', password: '' })
    },
    {
      name: 'invalidRPC',
      test: () => client.rpc('_nonexistent_function')
    }
  ];
  
  for (const errorTest of errorTests) {
    try {
      const { error } = await errorTest.test();
      
      if (error && error.message && error.message.includes('Invalid API key')) {
        logTest('errorHandling', errorTest.name, false, `Contains "Invalid API key": ${error.message}`);
      } else {
        logTest('errorHandling', errorTest.name, true, `Error handled properly: ${error?.message || 'No error'}`);
      }
    } catch (exception) {
      if (exception.message && exception.message.includes('Invalid API key')) {
        logTest('errorHandling', errorTest.name, false, `Exception contains "Invalid API key": ${exception.message}`);
      } else {
        logTest('errorHandling', errorTest.name, true, `Exception handled properly: ${exception.message}`);
      }
    }
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n📊 Generating Comprehensive Report...');
  
  const report = {
    ...testResults,
    summary: {
      ...testResults.summary,
      successRate: ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2) + '%',
      apiKeyErrorFixed: !containsAPIKeyError(),
      environmentValid: testResults.environment.supabaseAnonKeyFormat && testResults.environment.supabaseUrlFormat,
      clientInitialized: testResults.clientInitialization.clientCreation?.passed,
      apiConnectivityWorking: testResults.apiConnectivity && !containsAPIKeyErrorInCategory('apiConnectivity'),
      authenticationWorking: testResults.authentication && !containsAPIKeyErrorInCategory('authentication'),
      databaseOperationsWorking: testResults.databaseOperations && !containsAPIKeyErrorInCategory('databaseOperations')
    },
    recommendations: generateRecommendations(),
    conclusion: generateConclusion()
  };
  
  // Save report to file (handle circular references)
  const reportPath = path.join(__dirname, `API_KEY_VERIFICATION_REPORT_${Date.now()}.json`);
  
  // Create a clean copy without circular references
  const cleanReport = {
    timestamp: testResults.timestamp,
    summary: testResults.summary,
    environment: testResults.environment,
    clientInitialization: {
      clientCreation: testResults.clientInitialization.clientCreation,
      properties: testResults.clientInitialization.properties
    },
    apiConnectivity: testResults.apiConnectivity,
    authentication: testResults.authentication,
    databaseOperations: testResults.databaseOperations,
    errorHandling: testResults.errorHandling,
    recommendations: generateRecommendations(),
    conclusion: generateConclusion()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(cleanReport, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  return report;
}

// Helper functions for report generation
function containsAPIKeyError() {
  const categories = ['apiConnectivity', 'authentication', 'databaseOperations', 'errorHandling'];
  
  for (const category of categories) {
    if (containsAPIKeyErrorInCategory(category)) {
      return true;
    }
  }
  
  return false;
}

function containsAPIKeyErrorInCategory(category) {
  const categoryData = testResults[category];
  if (!categoryData) return false;
  
  for (const [testName, result] of Object.entries(categoryData)) {
    if (typeof result === 'object' && result.error && result.error.includes('Invalid API key')) {
      return true;
    }
    if (typeof result === 'object' && result.details && result.details.includes('Invalid API key')) {
      return true;
    }
  }
  
  return false;
}

function generateRecommendations() {
  const recommendations = [];
  
  if (!testResults.environment.supabaseUrlFormat) {
    recommendations.push('Fix the Supabase URL format in .env file');
  }
  
  if (!testResults.environment.supabaseAnonKeyFormat) {
    recommendations.push('Fix the Supabase Anon Key format in .env file');
  }
  
  if (!testResults.clientInitialization.clientCreation?.passed) {
    recommendations.push('Resolve Supabase client initialization issues');
  }
  
  if (containsAPIKeyError()) {
    recommendations.push('API key errors still present - check key validity and permissions');
  }
  
  if (testResults.summary.successRate < 80) {
    recommendations.push('Multiple test failures - investigate environment and configuration');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All tests passed - API key fix appears successful');
  }
  
  return recommendations;
}

function generateConclusion() {
  const successRate = parseFloat(testResults.summary.successRate);
  const apiKeyErrorFixed = !containsAPIKeyError();
  const environmentValid = testResults.environment.supabaseAnonKeyFormat && testResults.environment.supabaseUrlFormat;
  
  if (successRate >= 90 && apiKeyErrorFixed && environmentValid) {
    return {
      status: 'SUCCESS',
      message: 'API key fix verified successfully. The "Invalid API key" error has been resolved.',
      confidence: 'High'
    };
  } else if (successRate >= 70 && !containsAPIKeyError()) {
    return {
      status: 'PARTIAL_SUCCESS',
      message: 'API key error appears fixed, but some issues remain.',
      confidence: 'Medium'
    };
  } else {
    return {
      status: 'FAILURE',
      message: 'API key error persists or new issues introduced.',
      confidence: 'Low'
    };
  }
}

// Main execution function
async function runComprehensiveVerification() {
  console.log('🚀 Starting Comprehensive API Key Verification...');
  console.log('===============================================');
  
  try {
    await testEnvironmentVariables();
    await testClientInitialization();
    await testApiConnectivity();
    await testAuthenticationFlow();
    await testDatabaseOperations();
    await testErrorHandling();
    
    const report = generateReport();
    
    console.log('\n===============================================');
    console.log('📋 VERIFICATION SUMMARY');
    console.log('===============================================');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${testResults.summary.successRate}`);
    console.log(`API Key Error Fixed: ${!containsAPIKeyError() ? '✅ YES' : '❌ NO'}`);
    console.log(`Environment Valid: ${testResults.environment.supabaseAnonKeyFormat && testResults.environment.supabaseUrlFormat ? '✅ YES' : '❌ NO'}`);
    console.log(`Client Initialized: ${testResults.clientInitialization.clientCreation?.passed ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎯 CONCLUSION:');
    console.log(`Status: ${report.conclusion.status}`);
    console.log(`Message: ${report.conclusion.message}`);
    console.log(`Confidence: ${report.conclusion.confidence}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    return report;
    
  } catch (error) {
    console.error('❌ Verification failed with exception:', error);
    
    const failureReport = {
      timestamp: new Date().toISOString(),
      status: 'CRITICAL_FAILURE',
      error: error.message,
      stack: error.stack,
      conclusion: {
        status: 'CRITICAL_FAILURE',
        message: 'Verification failed due to unexpected error',
        confidence: 'None'
      }
    };
    
    const reportPath = path.join(__dirname, `API_KEY_VERIFICATION_FAILURE_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(failureReport, null, 2));
    
    return failureReport;
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  runComprehensiveVerification()
    .then(report => {
      console.log('\n✅ Verification completed');
      process.exit(report.conclusion.status === 'SUCCESS' ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveVerification,
  testEnvironmentVariables,
  testClientInitialization,
  testApiConnectivity,
  testAuthenticationFlow,
  testDatabaseOperations,
  testErrorHandling
};