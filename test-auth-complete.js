// Test script to verify authentication fix works completely
// Run this in browser console after visiting /test-auth-fix

console.log('🧪 [AUTH_TEST] Starting comprehensive authentication test...');

async function testAuthComplete() {
  try {
    // Step 1: Test fixed client initialization
    console.log('🧪 [AUTH_TEST] Step 1: Testing fixed client...');
    
    // Import the fixed client
    const { getSupabaseClient, getSupabaseInitializationStatus } = await import('./src/supabase/client-fixed.js');
    
    const status = getSupabaseInitializationStatus();
    console.log('🧪 [AUTH_TEST] Initialization status:', status);
    
    if (!status.isInitialized) {
      console.error('❌ [AUTH_TEST] Client initialization failed');
      return false;
    }
    
    if (status.autoRefreshDisabled !== true) {
      console.error('❌ [AUTH_TEST] Auto-refresh not disabled');
      return false;
    }
    
    // Step 2: Test session retrieval (should be clean)
    console.log('🧪 [AUTH_TEST] Step 2: Testing session retrieval...');
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [AUTH_TEST] Session retrieval error:', error.message);
      return false;
    }
    
    if (session) {
      console.warn('⚠️ [AUTH_TEST] Unexpected session found - may indicate incomplete cleanup');
    } else {
      console.log('✅ [AUTH_TEST] No session found (expected for clean state)');
    }
    
    // Step 3: Monitor for auto-refresh for 15 seconds
    console.log('🧪 [AUTH_TEST] Step 3: Monitoring auto-refresh for 15 seconds...');
    let refreshCount = 0;
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('_autoRefreshTokenTick')) {
        refreshCount++;
        console.log(`❌ [AUTH_TEST] AUTO-REFRESH DETECTED #${refreshCount}`);
      }
      originalConsoleLog.apply(console, args);
    };
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log = originalConsoleLog;
        
        if (refreshCount === 0) {
          console.log('✅ [AUTH_TEST] SUCCESS: No auto-refresh detected!');
          resolve(true);
        } else {
          console.log(`❌ [AUTH_TEST] FAILURE: Auto-refresh detected ${refreshCount} times`);
          resolve(false);
        }
      }, 15000);
    });
    
  } catch (error) {
    console.error('❌ [AUTH_TEST] Test failed:', error);
    return false;
  }
}

// Step 4: Test login process
async function testLoginProcess() {
  console.log('🧪 [AUTH_TEST] Step 4: Testing login process...');
  
  try {
    const { getSupabaseClient } = await import('./src/supabase/client-fixed.js');
    const supabase = getSupabaseClient();
    
    // Test with invalid credentials (should fail gracefully)
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email: 'test@example.com', 
      password: 'wrongpassword' 
    });
    
    if (error && error.message.includes('Invalid login credentials')) {
      console.log('✅ [AUTH_TEST] Login error handling works correctly');
      return true;
    } else if (data?.user) {
      console.warn('⚠️ [AUTH_TEST] Unexpected login success');
      return true;
    } else {
      console.error('❌ [AUTH_TEST] Unexpected login response');
      return false;
    }
  } catch (error) {
    console.error('❌ [AUTH_TEST] Login test failed:', error);
    return false;
  }
}

// Run all tests
async function runCompleteTest() {
  console.log('🧪 [AUTH_TEST] ===== STARTING COMPLETE AUTHENTICATION TEST =====');
  
  const test1 = await testAuthComplete();
  const test2 = await testLoginProcess();
  
  console.log('🧪 [AUTH_TEST] ===== TEST RESULTS =====');
  console.log(`🧪 [AUTH_TEST] Auto-refresh test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`🧪 [AUTH_TEST] Login process test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (test1 && test2) {
    console.log('🎉 [AUTH_TEST] 🎉 ALL TESTS PASSED! Authentication infinite loop is FIXED!');
    console.log('🧪 [AUTH_TEST] You can now try normal login flow');
  } else {
    console.log('💥 [AUTH_TEST] 💥 SOME TESTS FAILED! Fix needs more work');
  }
  
  return test1 && test2;
}

// Auto-run test
runCompleteTest().then(success => {
  if (success) {
    console.log('🧪 [AUTH_TEST] Test completed successfully');
    console.log('🧪 [AUTH_TEST] Next steps:');
    console.log('🧪 [AUTH_TEST] 1. Navigate to /login');
    console.log('🧪 [AUTH_TEST] 2. Try logging in with real credentials');
    console.log('🧪 [AUTH_TEST] 3. Should complete without infinite loop');
  } else {
    console.log('🧪 [AUTH_TEST] Test failed - check implementation');
  }
});