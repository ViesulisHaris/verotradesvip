/**
 * Test Supabase Credentials
 * 
 * This script helps verify that your Supabase API keys are working correctly.
 * It tests both the ANON key and SERVICE ROLE key for proper functionality.
 * 
 * Usage:
 * 1. Make sure your .env file contains the correct Supabase credentials:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 2. Run this script: node test-supabase-credentials.js
 * 3. Follow the instructions if any issues are found
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ANSI color codes for better output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(` ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validate JWT token format
function isValidJWT(token) {
  if (!token) return false;
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode the header (first part)
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    // Check if it has required fields
    return header.alg && header.typ;
  } catch (e) {
    return false;
  }
}

// Test ANON key functionality
async function testAnonKey() {
  logSection('Testing ANON Key');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file');
    return false;
  }
  
  logInfo(`URL: ${supabaseUrl}`);
  logInfo(`Key starts with: ${supabaseAnonKey.substring(0, 20)}...`);
  
  // Check if key is in valid JWT format
  if (!isValidJWT(supabaseAnonKey)) {
    logError('ANON key is not in valid JWT format');
    logWarning('Valid JWT should start with "eyJhbGciOiJIUzI1NiIs..."');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test basic connection with a simple query
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    
    // We expect this to fail with "relation does not exist" error if connection works
    if (error && error.code === '42P01') {
      logSuccess('ANON key connection successful (expected "relation does not exist" error)');
      return true;
    } else if (error) {
      logError(`Unexpected error with ANON key: ${error.message}`);
      return false;
    } else {
      logSuccess('ANON key connection successful');
      return true;
    }
  } catch (err) {
    logError(`Failed to connect with ANON key: ${err.message}`);
    return false;
  }
}

// Test SERVICE ROLE key functionality
async function testServiceRoleKey() {
  logSection('Testing SERVICE ROLE Key');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    logError('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    return false;
  }
  
  logInfo(`URL: ${supabaseUrl}`);
  logInfo(`Key starts with: ${serviceRoleKey.substring(0, 20)}...`);
  
  // Check if key is in valid JWT format
  if (!isValidJWT(serviceRoleKey)) {
    logError('SERVICE ROLE key is not in valid JWT format');
    logWarning('Valid JWT should start with "eyJhbGciOiJIUzI1NiIs..."');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Test if exec_sql function exists
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1 as test' 
    });
    
    if (error) {
      if (error.message.includes('function exec_sql')) {
        logError('exec_sql function does not exist in your Supabase project');
        logWarning('Please run setup-exec-sql-function.sql in your Supabase SQL Editor');
        return false;
      } else {
        logError(`Error testing exec_sql function: ${error.message}`);
        return false;
      }
    }
    
    if (data && data.length > 0 && data[0].success) {
      logSuccess('SERVICE ROLE key connection successful');
      logSuccess('exec_sql function is working correctly');
      return true;
    } else {
      logError('Unexpected response from exec_sql function');
      return false;
    }
  } catch (err) {
    logError(`Failed to connect with SERVICE ROLE key: ${err.message}`);
    return false;
  }
}

// Test project URL format
function testProjectUrl() {
  logSection('Testing Project URL');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    logError('NEXT_PUBLIC_SUPABASE_URL is missing from .env file');
    return false;
  }
  
  logInfo(`URL: ${supabaseUrl}`);
  
  // Check if URL has correct format
  const expectedPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
  if (!expectedPattern.test(supabaseUrl)) {
    logError('Project URL format is incorrect');
    logWarning('Expected format: https://your-project-id.supabase.co');
    return false;
  }
  
  // Extract project ID from URL
  const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  logInfo(`Project ID: ${projectId}`);
  
  if (projectId !== 'bzmixuxautbmqbrqtufx') {
    logWarning(`Project ID "${projectId}" doesn't match expected "bzmixuxautbmqbrqtufx"`);
    logWarning('Make sure you\'re using the correct Supabase project');
  }
  
  logSuccess('Project URL format is correct');
  return true;
}

// Main function
async function main() {
  log('\n🔍 Supabase Credentials Test', 'bright');
  log('This script will verify your Supabase API keys and configuration\n', 'bright');
  
  let allTestsPassed = true;
  
  // Test project URL
  const urlTest = testProjectUrl();
  allTestsPassed = allTestsPassed && urlTest;
  
  // Test ANON key
  const anonTest = await testAnonKey();
  allTestsPassed = allTestsPassed && anonTest;
  
  // Test SERVICE ROLE key
  const serviceTest = await testServiceRoleKey();
  allTestsPassed = allTestsPassed && serviceTest;
  
  // Final results
  logSection('Test Results');
  
  if (allTestsPassed) {
    logSuccess('All tests passed! Your Supabase credentials are working correctly.');
    logInfo('You can now run other test scripts that require Supabase access.');
  } else {
    logError('Some tests failed. Please fix the issues above.');
    log('\n📋 Next steps:', 'bright');
    log('1. Get correct API keys from your Supabase dashboard:', 'yellow');
    log('   https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/settings/api', 'yellow');
    log('2. Update your .env file with the correct credentials', 'yellow');
    log('3. Run setup-exec-sql-function.sql in your Supabase SQL Editor', 'yellow');
    log('4. Run this test script again to verify the fixes', 'yellow');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the test
main().catch(err => {
  logError(`Unexpected error: ${err.message}`);
  process.exit(1);
});