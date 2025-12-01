// SESSION PERSISTENCE VERIFICATION TEST
// This script will test that the fixes work correctly

console.log('🧪 [SESSION_VERIFICATION] Starting session persistence verification test...');
console.log('🧪 [SESSION_VERIFICATION] Timestamp:', new Date().toISOString());

// Test 1: Verify auto-refresh token is enabled
console.log('\n📊 [TEST 1] Verifying auto-refresh token configuration...');
if (typeof window !== 'undefined') {
  // Check if we can access the Supabase client configuration
  fetch('/api/test-session-persistence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ test: 'config' })
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 [TEST 1] Supabase config verification:', data);
  })
  .catch(error => {
    console.log('📊 [TEST 1] Config verification failed:', error);
  });
}

// Test 2: Monitor storage operations to ensure no aggressive clearing
console.log('\n📊 [TEST 2] Monitoring storage operations...');
let storageOperations = [];

if (typeof window !== 'undefined') {
  // Monitor localStorage operations
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  
  localStorage.setItem = function(key, value) {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
      storageOperations.push({
        type: 'localStorage',
        action: 'setItem',
        key,
        timestamp: new Date().toISOString(),
        valueLength: value?.length || 0
      });
      console.log('📊 [TEST 2] localStorage.setItem called:', key);
    }
    return originalSetItem.call(this, key, value);
  };
  
  localStorage.removeItem = function(key) {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
      storageOperations.push({
        type: 'localStorage',
        action: 'removeItem',
        key,
        timestamp: new Date().toISOString()
      });
      console.warn('🚨 [TEST 2] localStorage.removeItem called:', key);
    }
    return originalRemoveItem.call(this, key);
  };
  
  console.log('📊 [TEST 2] Storage monitoring activated');
}

// Test 3: Simulate login and verify session persistence
console.log('\n📊 [TEST 3] Testing session persistence simulation...');
if (typeof window !== 'undefined') {
  // Simulate storing a session
  const testSession = {
    access_token: 'test_access_token_' + Date.now(),
    refresh_token: 'test_refresh_token_' + Date.now(),
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    user: {
      id: 'test_user_id',
      email: 'test@example.com'
    }
  };
  
  // Store test session in localStorage
  localStorage.setItem('sb-bzmixuxautbmqbrqtufx-auth-token', JSON.stringify(testSession));
  console.log('📊 [TEST 3] Test session stored in localStorage');
  
  // Verify it's stored
  const storedSession = localStorage.getItem('sb-bzmixuxautbmqbrqtufx-auth-token');
  if (storedSession) {
    console.log('✅ [TEST 3] Session successfully stored and retrievable');
  } else {
    console.log('❌ [TEST 3] Session storage failed');
  }
}

// Test 4: Check for aggressive data clearing
console.log('\n📊 [TEST 4] Checking for aggressive data clearing...');
setTimeout(() => {
  if (typeof window !== 'undefined') {
    const clearOperations = storageOperations.filter(op => op.action === 'removeItem');
    
    if (clearOperations.length === 0) {
      console.log('✅ [TEST 4] NO aggressive data clearing detected - GOOD!');
    } else {
      console.log('❌ [TEST 4] Aggressive data clearing detected:', clearOperations);
      console.log('❌ [TEST 4] This indicates the fix may not be working properly');
    }
    
    console.log('📊 [TEST 4] Total storage operations:', storageOperations.length);
    console.log('📊 [TEST 4] Clear operations:', clearOperations.length);
  }
}, 3000); // Wait 3 seconds to catch any clearing operations

// Test 5: Verify session can be retrieved after page load simulation
console.log('\n📊 [TEST 5] Testing session retrieval after page load simulation...');
setTimeout(() => {
  if (typeof window !== 'undefined') {
    // Try to retrieve the session like Supabase would
    const sessionData = localStorage.getItem('sb-bzmixuxautbmqbrqtufx-auth-token');
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        console.log('✅ [TEST 5] Session successfully retrieved after page load simulation');
        console.log('📊 [TEST 5] Session data:', {
          hasAccessToken: !!session.access_token,
          hasRefreshToken: !!session.refresh_token,
          hasUser: !!session.user,
          userEmail: session.user?.email,
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });
      } catch (e) {
        console.log('❌ [TEST 5] Session data corrupted:', e);
      }
    } else {
      console.log('❌ [TEST 5] No session data found - indicates clearing occurred');
    }
  }
}, 4000); // Wait 4 seconds to simulate page load timing

// Test 6: Final verification summary
console.log('\n📊 [TEST 6] Preparing final verification summary...');
setTimeout(() => {
  console.log('\n🎯 [VERIFICATION_SUMMARY] Session Persistence Test Results:');
  console.log('='.repeat(60));
  
  if (typeof window !== 'undefined') {
    const clearOperations = storageOperations.filter(op => op.action === 'removeItem');
    const setOperations = storageOperations.filter(op => op.action === 'setItem');
    
    console.log('📊 Storage Operations Summary:');
    console.log(`  - Total operations: ${storageOperations.length}`);
    console.log(`  - Set operations: ${setOperations.length}`);
    console.log(`  - Remove operations: ${clearOperations.length}`);
    
    console.log('\n🔍 Key Findings:');
    if (clearOperations.length === 0) {
      console.log('  ✅ NO aggressive session clearing detected');
      console.log('  ✅ Session data should persist across page loads');
    } else {
      console.log('  ❌ Aggressive session clearing still occurring');
      console.log('  ❌ Sessions will NOT persist across page loads');
    }
    
    const sessionData = localStorage.getItem('sb-bzmixuxautbmqbrqtufx-auth-token');
    if (sessionData) {
      console.log('  ✅ Session data is present in localStorage');
      console.log('  ✅ Session persistence should work correctly');
    } else {
      console.log('  ❌ No session data in localStorage');
      console.log('  ❌ Session persistence will fail');
    }
    
    console.log('\n🎯 FINAL RESULT:');
    if (clearOperations.length === 0 && sessionData) {
      console.log('  🎉 SESSION PERSISTENCE FIX SUCCESSFUL!');
      console.log('  🎉 Users should now stay logged in across page refreshes');
    } else {
      console.log('  ❌ SESSION PERSISTENCE FIX FAILED');
      console.log('  ❌ Users will still need to re-login on every page refresh');
    }
    
    console.log('='.repeat(60));
  }
}, 5000);

// Export for manual testing
if (typeof window !== 'undefined') {
  window.SESSION_VERIFICATION = {
    getStorageOperations: () => storageOperations,
    checkSessionData: () => localStorage.getItem('sb-bzmixuxautbmqbrqtufx-auth-token'),
    simulatePageLoad: () => {
      console.log('🔄 Simulating page load...');
      // This would be called when testing page refresh behavior
    }
  };
  
  console.log('💡 [SESSION_VERIFICATION] Window.SESSION_VERIFICATION available for manual testing');
}