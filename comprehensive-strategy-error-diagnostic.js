/**
 * COMPREHENSIVE STRATEGY ERROR DIAGNOSTIC TEST
 * 
 * This script systematically tests all potential sources of the 
 * "An unexpected error occurred while loading the strategy. Please try again." error
 * 
 * Potential Error Sources Identified:
 * 1. Schema cache corruption in Supabase
 * 2. Database connection/authentication issues
 * 3. UUID validation failures
 * 4. Missing or corrupted database tables
 * 5. Network/Supabase client configuration issues
 * 6. Authentication session issues
 * 7. Strategy data corruption or invalid data types
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

// Create clients with different authentication levels
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    supabaseUrl: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    nodeVersion: process.version,
    platform: process.platform
  },
  tests: [],
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper function to log test results
function logTest(testName, status, details = null, error = null) {
  const test = {
    name: testName,
    status: status, // 'PASS', 'FAIL', 'WARN'
    timestamp: new Date().toISOString(),
    details: details,
    error: error ? {
      message: error.message,
      stack: error.stack,
      code: error.code
    } : null
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (status === 'PASS') testResults.summary.passed++;
  else if (status === 'FAIL') testResults.summary.failed++;
  else if (status === 'WARN') testResults.summary.warnings++;
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${testName}`);
  
  if (details) {
    console.log(`   Details:`, details);
  }
  
  if (error) {
    console.error(`   Error:`, error.message);
    testResults.errors.push({
      test: testName,
      error: error.message,
      stack: error.stack
    });
  }
  
  console.log('');
}

// Helper function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Test 1: Basic Supabase Connection
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Test with anon client
    const { data, error } = await anonClient.from('_test_connection').select('*').limit(1);
    
    // We expect this to fail with a "relation does not exist" error, which proves connection works
    if (error && error.code === 'PGRST116') {
      logTest('Supabase Anon Connection', 'PASS', 'Connection successful (expected relation not found error)');
    } else if (error) {
      logTest('Supabase Anon Connection', 'FAIL', null, error);
    } else {
      logTest('Supabase Anon Connection', 'PASS', 'Connection successful');
    }
  } catch (error) {
    logTest('Supabase Anon Connection', 'FAIL', null, error);
  }
  
  // Test with service client if available
  if (serviceClient) {
    try {
      const { data, error } = await serviceClient.from('_test_connection').select('*').limit(1);
      
      if (error && error.code === 'PGRST116') {
        logTest('Supabase Service Connection', 'PASS', 'Connection successful (expected relation not found error)');
      } else if (error) {
        logTest('Supabase Service Connection', 'FAIL', null, error);
      } else {
        logTest('Supabase Service Connection', 'PASS', 'Connection successful');
      }
    } catch (error) {
      logTest('Supabase Service Connection', 'FAIL', null, error);
    }
  } else {
    logTest('Supabase Service Connection', 'WARN', 'Service key not available');
  }
}

// Test 2: Authentication System
async function testAuthentication() {
  console.log('🔍 Testing Authentication System...\n');
  
  try {
    // Test getting current user (should be null for unauthenticated)
    const { data: { user }, error } = await anonClient.auth.getUser();
    
    if (error) {
      logTest('Auth Get User (Unauthenticated)', 'FAIL', null, error);
    } else {
      logTest('Auth Get User (Unauthenticated)', 'PASS', {
        user: user ? 'authenticated' : 'unauthenticated',
        userId: user?.id || null
      });
    }
  } catch (error) {
    logTest('Auth Get User (Unauthenticated)', 'FAIL', null, error);
  }
  
  // Test session retrieval
  try {
    const { data: { session }, error } = await anonClient.auth.getSession();
    
    if (error) {
      logTest('Auth Get Session', 'FAIL', null, error);
    } else {
      logTest('Auth Get Session', 'PASS', {
        hasSession: !!session,
        sessionExpiresAt: session?.expires_at || null
      });
    }
  } catch (error) {
    logTest('Auth Get Session', 'FAIL', null, error);
  }
}

// Test 3: Database Schema Verification
async function testDatabaseSchema() {
  console.log('🔍 Testing Database Schema...\n');
  
  const requiredTables = [
    'users',
    'strategies',
    'trades',
    'strategy_rules'
  ];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          logTest(`Table: ${table}`, 'FAIL', `Table does not exist`);
        } else if (error.message.includes('permission denied')) {
          logTest(`Table: ${table}`, 'WARN', `Table exists but permission denied for anon user`);
        } else {
          logTest(`Table: ${table}`, 'FAIL', null, error);
        }
      } else {
        logTest(`Table: ${table}`, 'PASS', `Table exists and is accessible`);
      }
    } catch (error) {
      logTest(`Table: ${table}`, 'FAIL', null, error);
    }
  }
}

// Test 4: Schema Cache Issues
async function testSchemaCache() {
  console.log('🔍 Testing Schema Cache Issues...\n');
  
  try {
    // Test strategies table with specific query that might trigger cache issues
    const { data, error } = await anonClient
      .from('strategies')
      .select('id, name, user_id, created_at')
      .limit(1);
    
    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('relation') && error.message.includes('does not exist')) {
        logTest('Schema Cache Test', 'FAIL', 'Schema cache issue detected', error);
      } else {
        logTest('Schema Cache Test', 'WARN', 'Other error (not cache related)', error);
      }
    } else {
      logTest('Schema Cache Test', 'PASS', 'No cache issues detected');
    }
  } catch (error) {
    logTest('Schema Cache Test', 'FAIL', null, error);
  }
  
  // Test with service client if available
  if (serviceClient) {
    try {
      const { data, error } = await serviceClient
        .from('strategies')
        .select('id, name, user_id, created_at')
        .limit(1);
      
      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('relation') && error.message.includes('does not exist')) {
          logTest('Schema Cache Test (Service)', 'FAIL', 'Schema cache issue detected with service client', error);
        } else {
          logTest('Schema Cache Test (Service)', 'WARN', 'Other error with service client', error);
        }
      } else {
        logTest('Schema Cache Test (Service)', 'PASS', 'No cache issues detected with service client');
      }
    } catch (error) {
      logTest('Schema Cache Test (Service)', 'FAIL', null, error);
    }
  }
}

// Test 5: UUID Validation
async function testUUIDValidation() {
  console.log('🔍 Testing UUID Validation...\n');
  
  const testUUIDs = [
    { value: '123e4567-e89b-12d3-a456-426614174000', expected: true, name: 'Valid UUID' },
    { value: 'invalid-uuid', expected: false, name: 'Invalid UUID format' },
    { value: undefined, expected: false, name: 'Undefined UUID' },
    { value: null, expected: false, name: 'Null UUID' },
    { value: '', expected: false, name: 'Empty UUID' },
    { value: 'undefined', expected: false, name: 'String "undefined"' }
  ];
  
  testUUIDs.forEach(test => {
    const isValid = isValidUUID(test.value);
    const status = isValid === test.expected ? 'PASS' : 'FAIL';
    logTest(`UUID Validation: ${test.name}`, status, {
      input: test.value,
      expected: test.expected,
      actual: isValid
    });
  });
}

// Test 6: Strategy Loading Simulation
async function testStrategyLoading() {
  console.log('🔍 Testing Strategy Loading Simulation...\n');
  
  // Test with a fake user ID to see the exact error
  const fakeUserId = '123e4567-e89b-12d3-a456-426614174999';
  
  try {
    const { data, error } = await anonClient
      .from('strategies')
      .select('*')
      .eq('user_id', fakeUserId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logTest('Strategy Loading (Fake User)', 'FAIL', 'Error loading strategies', error);
      
      // Check if this is the specific error we're looking for
      if (error.message.includes('schema cache') || 
          error.message.includes('relation') && error.message.includes('does not exist')) {
        logTest('Target Error Detection', 'FAIL', 'TARGET ERROR FOUND: Schema cache issue detected', error);
      }
    } else {
      logTest('Strategy Loading (Fake User)', 'PASS', 'Query executed successfully (no strategies found for fake user)');
    }
  } catch (error) {
    logTest('Strategy Loading (Fake User)', 'FAIL', null, error);
  }
  
  // Test with service client if available
  if (serviceClient) {
    try {
      const { data, error } = await serviceClient
        .from('strategies')
        .select('*')
        .eq('user_id', fakeUserId)
        .order('created_at', { ascending: false });
      
      if (error) {
        logTest('Strategy Loading (Service Client)', 'FAIL', 'Error loading strategies with service client', error);
      } else {
        logTest('Strategy Loading (Service Client)', 'PASS', 'Query executed successfully with service client');
      }
    } catch (error) {
      logTest('Strategy Loading (Service Client)', 'FAIL', null, error);
    }
  }
}

// Test 7: Database Permissions
async function testDatabasePermissions() {
  console.log('🔍 Testing Database Permissions...\n');
  
  const permissions = [
    { table: 'strategies', action: 'SELECT', description: 'Read strategies' },
    { table: 'strategies', action: 'INSERT', description: 'Create strategies' },
    { table: 'strategies', action: 'UPDATE', description: 'Update strategies' },
    { table: 'strategies', action: 'DELETE', description: 'Delete strategies' },
    { table: 'trades', action: 'SELECT', description: 'Read trades' },
    { table: 'trades', action: 'INSERT', description: 'Create trades' }
  ];
  
  for (const perm of permissions) {
    try {
      let query;
      switch (perm.action) {
        case 'SELECT':
          query = anonClient.from(perm.table).select('*').limit(1);
          break;
        case 'INSERT':
          query = anonClient.from(perm.table).insert({ id: '00000000-0000-0000-0000-000000000000' });
          break;
        case 'UPDATE':
          query = anonClient.from(perm.table).update({ name: 'test' }).eq('id', '00000000-0000-0000-0000-000000000000');
          break;
        case 'DELETE':
          query = anonClient.from(perm.table).delete().eq('id', '00000000-0000-0000-0000-000000000000');
          break;
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.message.includes('permission denied')) {
          logTest(`Permission: ${perm.description}`, 'WARN', 'Permission denied (expected for anon user)');
        } else {
          logTest(`Permission: ${perm.description}`, 'FAIL', null, error);
        }
      } else {
        logTest(`Permission: ${perm.description}`, 'PASS', 'Permission granted');
      }
    } catch (error) {
      logTest(`Permission: ${perm.description}`, 'FAIL', null, error);
    }
  }
}

// Test 8: Network and Configuration
async function testNetworkAndConfiguration() {
  console.log('🔍 Testing Network and Configuration...\n');
  
  // Test Supabase URL accessibility
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      logTest('Supabase URL Accessibility', 'PASS', `Status: ${response.status}`);
    } else {
      logTest('Supabase URL Accessibility', 'FAIL', `Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logTest('Supabase URL Accessibility', 'FAIL', null, error);
  }
  
  // Test API key format
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  const isValidJWT = jwtRegex.test(supabaseAnonKey);
  logTest('API Key Format', isValidJWT ? 'PASS' : 'FAIL', {
    isValid: isValidJWT,
    keyLength: supabaseAnonKey.length,
    startsWith: supabaseAnonKey.substring(0, 10) + '...'
  });
}

// Main test execution
async function runComprehensiveDiagnostic() {
  console.log('🚀 COMPREHENSIVE STRATEGY ERROR DIAGNOSTIC');
  console.log('=' .repeat(50));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('=' .repeat(50));
  console.log('');
  
  await testSupabaseConnection();
  await testAuthentication();
  await testDatabaseSchema();
  await testSchemaCache();
  await testUUIDValidation();
  await testStrategyLoading();
  await testDatabasePermissions();
  await testNetworkAndConfiguration();
  
  // Generate final report
  console.log('=' .repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Warnings: ${testResults.summary.warnings} ⚠️`);
  console.log('');
  
  if (testResults.summary.failed > 0) {
    console.log('🔍 CRITICAL ISSUES FOUND:');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   ❌ ${test.name}`);
        if (test.error) {
          console.log(`      Error: ${test.error.message}`);
        }
      });
    console.log('');
  }
  
  if (testResults.summary.warnings > 0) {
    console.log('⚠️  WARNINGS:');
    testResults.tests
      .filter(test => test.status === 'WARN')
      .forEach(test => {
        console.log(`   ⚠️  ${test.name}`);
        if (test.details) {
          console.log(`      Details: ${JSON.stringify(test.details)}`);
        }
      });
    console.log('');
  }
  
  // Save detailed results to file
  const reportPath = `comprehensive-strategy-diagnostic-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  
  // Check for the specific target error
  const targetErrorFound = testResults.errors.some(error => 
    error.error.includes('schema cache') || 
    error.error.includes('relation') && error.error.includes('does not exist')
  );
  
  if (targetErrorFound) {
    console.log('🎯 TARGET ERROR DETECTED!');
    console.log('The "An unexpected error occurred while loading the strategy" error is likely caused by:');
    console.log('1. Schema cache corruption in Supabase');
    console.log('2. Missing or inaccessible database tables');
    console.log('3. Database permission issues');
    console.log('');
    console.log('RECOMMENDED FIXES:');
    console.log('1. Clear Supabase schema cache');
    console.log('2. Verify all required tables exist');
    console.log('3. Check database permissions');
    console.log('4. Restart the application');
  } else {
    console.log('🤔 Target error not detected in this test run.');
    console.log('The error might be intermittent or occur under specific conditions.');
    console.log('Consider running this test during actual error occurrence.');
  }
  
  return testResults;
}

// Execute the diagnostic
if (require.main === module) {
  runComprehensiveDiagnostic()
    .then(results => {
      console.log('\n✅ Diagnostic completed successfully');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveDiagnostic };