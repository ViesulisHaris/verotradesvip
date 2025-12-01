// SESSION PERSISTENCE DIAGNOSTIC TOOL
// This script will validate our assumptions about the root causes

console.log('🔍 [SESSION_DIAGNOSTIC] Starting session persistence analysis...');
console.log('🔍 [SESSION_DIAGNOSTIC] Timestamp:', new Date().toISOString());

// Test 1: Check localStorage for Supabase session data
console.log('\n📊 [TEST 1] Checking localStorage for Supabase session data...');
if (typeof window !== 'undefined') {
  const localStorageKeys = Object.keys(localStorage);
  const supabaseKeys = localStorageKeys.filter(key => 
    key.includes('supabase') || key.includes('sb-') || key.includes('auth')
  );
  
  console.log('📊 [TEST 1] localStorage keys found:', supabaseKeys);
  console.log('📊 [TEST 1] Total localStorage keys:', localStorageKeys.length);
  console.log('📊 [TEST 1] Supabase-related keys:', supabaseKeys.length);
  
  if (supabaseKeys.length > 0) {
    supabaseKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        console.log(`📊 [TEST 1] ${key}:`, value ? 'PRESENT' : 'NULL', value?.substring(0, 50) + '...');
      } catch (e) {
        console.log(`📊 [TEST 1] ${key}: ERROR reading`, e);
      }
    });
  } else {
    console.log('❌ [TEST 1] NO Supabase session data found in localStorage');
  }
} else {
  console.log('⚠️ [TEST 1] Window not available - running on server');
}

// Test 2: Check sessionStorage for Supabase session data
console.log('\n📊 [TEST 2] Checking sessionStorage for Supabase session data...');
if (typeof window !== 'undefined') {
  const sessionStorageKeys = Object.keys(sessionStorage);
  const supabaseKeys = sessionStorageKeys.filter(key => 
    key.includes('supabase') || key.includes('sb-') || key.includes('auth')
  );
  
  console.log('📊 [TEST 2] sessionStorage keys found:', supabaseKeys);
  console.log('📊 [TEST 2] Total sessionStorage keys:', sessionStorageKeys.length);
  console.log('📊 [TEST 2] Supabase-related keys:', supabaseKeys.length);
  
  if (supabaseKeys.length > 0) {
    supabaseKeys.forEach(key => {
      try {
        const value = sessionStorage.getItem(key);
        console.log(`📊 [TEST 2] ${key}:`, value ? 'PRESENT' : 'NULL', value?.substring(0, 50) + '...');
      } catch (e) {
        console.log(`📊 [TEST 2] ${key}: ERROR reading`, e);
      }
    });
  } else {
    console.log('❌ [TEST 2] NO Supabase session data found in sessionStorage');
  }
}

// Test 3: Simulate the clearCorruptedAuthData function behavior
console.log('\n📊 [TEST 3] Simulating clearCorruptedAuthData() behavior...');
if (typeof window !== 'undefined') {
  const beforeClear = {
    localStorage: Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    ).length,
    sessionStorage: Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    ).length
  };
  
  console.log('📊 [TEST 3] Before clearCorruptedAuthData():', beforeClear);
  
  // Simulate what clearCorruptedAuthData() does
  const authKeys = Object.keys(localStorage).filter(key =>
    key.includes('supabase') || key.includes('sb-') || key.includes('auth')
  );
  
  console.log('📊 [TEST 3] Keys that would be cleared:', authKeys);
  
  const afterClear = {
    localStorage: Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    ).length,
    sessionStorage: Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    ).length
  };
  
  console.log('📊 [TEST 3] After clearCorruptedAuthData():', afterClear);
  console.log('📊 [TEST 3] Data loss:', beforeClear.localStorage - afterClear.localStorage, 'localStorage keys');
}

// Test 4: Check if clearCorruptedAuthData is being called
console.log('\n📊 [TEST 4] Monitoring for clearCorruptedAuthData() calls...');
if (typeof window !== 'undefined') {
  // Monitor localStorage clear operations
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key) {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
      console.warn('🚨 [TEST 4] Supabase-related key being removed:', key);
      console.trace('🚨 [TEST 4] Call stack for key removal:');
    }
    return originalRemoveItem.call(this, key);
  };
  
  // Monitor sessionStorage clear operations
  const originalSessionRemoveItem = sessionStorage.removeItem;
  sessionStorage.removeItem = function(key) {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
      console.warn('🚨 [TEST 4] Supabase-related key being removed from sessionStorage:', key);
      console.trace('🚨 [TEST 4] Call stack for sessionStorage key removal:');
    }
    return originalSessionRemoveItem.call(this, key);
  };
  
  console.log('📊 [TEST 4] Storage monitoring activated');
}

// Test 5: Check Supabase client configuration
console.log('\n📊 [TEST 5] Analyzing Supabase client configuration...');
console.log('📊 [TEST 5] Expected problematic configuration:');
console.log('  - autoRefreshToken: false');
console.log('  - persistSession: true');
console.log('  - detectSessionInUrl: false');
console.log('  - flowType: "implicit"');

console.log('\n🔍 [SESSION_DIAGNOSTIC] Diagnostic setup complete.');
console.log('🔍 [SESSION_DIAGNOSTIC] Please refresh the page to see real-time data clearing...');
console.log('🔍 [SESSION_DIAGNOSTIC] Check console for "🚨 [TEST 4]" warnings to identify when data is being cleared.');

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.SESSION_DIAGNOSTIC = {
    checkStorage: () => {
      console.log('🔍 Current localStorage Supabase keys:', 
        Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-') || key.includes('auth')
        )
      );
      console.log('🔍 Current sessionStorage Supabase keys:', 
        Object.keys(sessionStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-') || key.includes('auth')
        )
      );
    },
    simulateClearCorruptedAuthData: () => {
      console.log('🔧 Simulating clearCorruptedAuthData()...');
      const authKeys = Object.keys(localStorage).filter(key =>
        key.includes('supabase') || key.includes('sb-') || key.includes('auth')
      );
      console.log('🔧 Keys that would be cleared:', authKeys);
      return authKeys;
    }
  };
  
  console.log('💡 [SESSION_DIAGNOSTIC] Window.SESSION_DIAGNOSTIC available for manual testing');
}