const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Comprehensive Authentication Diagnostic');
console.log('==========================================');

// Test 1: Direct Supabase client test
async function testDirectSupabase() {
  console.log('\n🧪 Test 1: Direct Supabase Client');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', !!supabaseAnonKey);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  });
  
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser1000@verotrade.com',
      password: 'TestPassword123!'
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Direct test success in ${duration}ms:`, data?.user?.id);
    
    if (error) {
      console.error('❌ Direct test error:', error);
    }
    
    // Test session immediately after login
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📋 Session after login:', !!sessionData.session);
    
    return { success: !!data?.user, error, duration };
  } catch (err) {
    console.error('💥 Direct test exception:', err);
    return { success: false, error: err.message, duration: 0 };
  }
}

// Test 2: Browser environment simulation
async function testBrowserEnvironment() {
  console.log('\n🌐 Test 2: Browser Environment Simulation');
  
  // Simulate browser headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json'
  };
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json'
      }
    }
  });
  
  try {
    const startTime = Date.now();
    
    // Test with different flowType
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser1000@verotrade.com',
      password: 'TestPassword123!'
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Browser simulation success in ${duration}ms:`, data?.user?.id);
    
    if (error) {
      console.error('❌ Browser simulation error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
    }
    
    // Test session immediately after login
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📋 Session after browser simulation:', !!sessionData.session);
    
    return { success: !!data?.user, error, duration };
  } catch (err) {
    console.error('💥 Browser simulation exception:', err);
    return { success: false, error: err.message, duration: 0 };
  }
}

// Test 3: Test different authentication methods
async function testAlternativeMethods() {
  console.log('\n🔧 Test 3: Alternative Authentication Methods');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test signInWithOAuth
  try {
    console.log('Testing signInWithOAuth...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'email',
      options: {
        email: 'testuser1000@verotrade.com',
        password: 'TestPassword123!'
      }
    });
    
    if (error) {
      console.log('❌ OAuth test error:', error);
    } else {
      console.log('✅ OAuth test success (this should fail with email provider)');
    }
  } catch (err) {
    console.error('💥 OAuth test exception:', err);
  }
  
  // Test getUser
  try {
    console.log('Testing getUser...');
    const { data: userData, error: userError } = await supabase.auth.getUser('testuser1000@verotrade.com');
    
    if (userError) {
      console.log('❌ getUser error:', userError);
    } else {
      console.log('✅ getUser test success:', userData?.user?.id);
    }
  } catch (err) {
    console.error('💥 getUser test exception:', err);
  }
}

// Test 4: Environment and configuration check
function testEnvironment() {
  console.log('\n🌍 Test 4: Environment and Configuration');
  
  console.log('Environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log('URL validation:');
  console.log('  URL format valid:', supabaseUrl?.startsWith('https://'));
  console.log('  URL hostname:', supabaseUrl ? new URL(supabaseUrl).hostname : 'invalid');
  
  // Test network connectivity
  const fetch = require('node-fetch');
  
  const testNetworkConnectivity = async () => {
    try {
      console.log('Testing network connectivity...');
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Network connectivity test passed');
        const data = await response.json();
        console.log('API response keys:', Object.keys(data));
      } else {
        console.error('❌ Network connectivity test failed:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('💥 Network test exception:', err);
    }
  };
  
  await testNetworkConnectivity();
}

// Main execution
async function runDiagnostics() {
  console.log('🚀 Starting comprehensive authentication diagnostics...\n');
  
  const results = {
    directTest: await testDirectSupabase(),
    browserTest: await testBrowserEnvironment(),
    alternativeTest: await testAlternativeMethods(),
    environment: testEnvironment()
  };
  
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('========================');
  console.log('Direct Supabase Test:', results.directTest.success ? '✅ PASS' : '❌ FAIL');
  console.log('Browser Simulation Test:', results.browserTest.success ? '✅ PASS' : '❌ FAIL');
  console.log('Alternative Methods Test:', results.alternativeTest ? '✅ COMPLETED' : '❌ FAILED');
  console.log('Environment Test:', results.environment ? '✅ COMPLETED' : '❌ FAILED');
  
  if (results.directTest.error) {
    console.log('\n❌ DIRECT TEST ERROR DETAILS:');
    console.log('Message:', results.directTest.error.message);
    console.log('Status:', results.directTest.error.status);
  }
  
  if (results.browserTest.error) {
    console.log('\n❌ BROWSER TEST ERROR DETAILS:');
    console.log('Message:', results.browserTest.error.message);
    console.log('Status:', results.browserTest.error.status);
  }
  
  return results;
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics()
    .then(() => {
      console.log('\n✅ Diagnostics completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Diagnostics failed:', error);
      process.exit(1);
    });
}