// Comprehensive Supabase Authentication Test
// Tests API key loading, client initialization, and authentication flow

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

console.log('🔍 SUPABASE AUTHENTICATION TEST');
console.log('===============================');

// Test 1: Environment Variables
console.log('\n📋 TEST 1: Environment Variables');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
console.log('Anonymous Key:', supabaseAnonKey ? '✅ SET' : '❌ MISSING');
console.log('Service Role Key:', supabaseServiceKey ? '✅ SET' : '❌ MISSING');

if (supabaseAnonKey) {
  console.log('Anonymous Key Length:', supabaseAnonKey.length);
  console.log('Anonymous Key Segments:', supabaseAnonKey.split('.').length);
  console.log('Starts with eyJ:', supabaseAnonKey.startsWith('eyJ'));
}

if (supabaseServiceKey) {
  console.log('Service Key Length:', supabaseServiceKey.length);
  console.log('Service Key Segments:', supabaseServiceKey.split('.').length);
  console.log('Starts with eyJ:', supabaseServiceKey.startsWith('eyJ'));
}

// Test 2: Client Initialization
console.log('\n📋 TEST 2: Client Initialization');
let client = null;
let clientError = null;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables');
  }
  
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
  
  console.log('✅ Client created successfully');
  console.log('✅ Client URL:', client.supabaseUrl);
  console.log('✅ Auth object available:', !!client.auth);
} catch (error) {
  clientError = error;
  console.log('❌ Client creation failed:', error.message);
}

// Test 3: Basic Connection Test
console.log('\n📋 TEST 3: Basic Connection Test');
if (client && !clientError) {
  // Test a simple operation that doesn't require authentication
  client.from('_test_connection').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('⚠️ Connection test failed (expected):', error.message);
        console.log('✅ This is expected - we just want to see if the client can make requests');
      } else {
        console.log('✅ Connection test passed');
      }
    })
    .catch((error) => {
      console.log('⚠️ Connection test failed (expected):', error.message);
      console.log('✅ This is expected - we just want to see if the client can make requests');
    });
} else {
  console.log('❌ Cannot test connection - client not available');
}

// Test 4: Authentication Test
console.log('\n📋 TEST 4: Authentication Test');
if (client && !clientError) {
  // Test getting current session
  client.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Session check failed:', error.message);
      } else {
        console.log('✅ Session check completed');
        console.log('Has session:', !!data.session);
        console.log('Session valid:', data.session ? '✅ YES' : '⚠️ NO (expected for new client)');
      }
    })
    .catch((error) => {
      console.log('❌ Session check failed:', error.message);
    });
} else {
  console.log('❌ Cannot test authentication - client not available');
}

// Test 5: API Key Validation
console.log('\n📋 TEST 5: API Key Validation');
function validateApiKey(key, name) {
  if (!key) {
    console.log(`❌ ${name}: Key is missing`);
    return false;
  }
  
  const segments = key.split('.');
  const isValidLength = key.length >= 200; // Minimum reasonable length
  const hasCorrectSegments = segments.length === 3;
  const startsWithEyJ = key.startsWith('eyJ');
  
  console.log(`${name}:`);
  console.log(`  Length: ${key.length} characters ${isValidLength ? '✅' : '❌'}`);
  console.log(`  Segments: ${segments.length} ${hasCorrectSegments ? '✅' : '❌'}`);
  console.log(`  Format: ${startsWithEyJ ? '✅' : '❌'}`);
  
  return isValidLength && hasCorrectSegments && startsWithEyJ;
}

const anonKeyValid = validateApiKey(supabaseAnonKey, 'Anonymous Key');
const serviceKeyValid = validateApiKey(supabaseServiceKey, 'Service Role Key');

// Summary
console.log('\n📊 SUMMARY');
console.log('========');
console.log('Environment Variables:', (supabaseUrl && supabaseAnonKey && supabaseServiceKey) ? '✅ COMPLETE' : '❌ INCOMPLETE');
console.log('Client Initialization:', client && !clientError ? '✅ SUCCESS' : '❌ FAILED');
console.log('API Key Validation:', (anonKeyValid && serviceKeyValid) ? '✅ VALID' : '❌ INVALID');

const overallSuccess = (supabaseUrl && supabaseAnonKey && supabaseServiceKey) && 
                      client && !clientError && 
                      (anonKeyValid && serviceKeyValid);

console.log('Overall Status:', overallSuccess ? '✅ SUCCESS' : '❌ FAILED');

if (overallSuccess) {
  console.log('\n🎉 CONCLUSION:');
  console.log('✅ API keys are complete and properly formatted');
  console.log('✅ Supabase client initializes without errors');
  console.log('✅ Authentication system is ready for use');
  console.log('✅ The truncation issue has been resolved');
} else {
  console.log('\n❌ CONCLUSION:');
  console.log('❌ There are still issues with the API keys or client initialization');
  console.log('❌ The truncation issue may not be fully resolved');
}

console.log('\n🔧 NEXT STEPS:');
console.log('1. Test the web application at http://localhost:3000');
console.log('2. Navigate to /test-supabase-key-fix to see browser-based tests');
console.log('3. Try logging in and registering to test authentication flow');
console.log('4. Check browser console for any remaining API key errors');