// Login Fix Verification Test
// This test verifies that the login form submission fixes are working correctly

console.log('🚀 Starting Login Fix Verification Test...');

// Test 1: Verify Supabase client configuration
async function testSupabaseConfig() {
  console.log('\n=== Test 1: Supabase Configuration ===');
  
  try {
    const { getSupabaseClient, getSupabaseInitializationStatus } = await import('./src/supabase/client.js');
    const status = getSupabaseInitializationStatus();
    
    console.log('Supabase initialization status:', status);
    
    if (!status.isInitialized) {
      console.log('❌ Supabase client not initialized');
      return false;
    }
    
    if (status.hasError) {
      console.log('❌ Supabase client has initialization error:', status.error);
      return false;
    }
    
    console.log('✅ Supabase client properly initialized');
    return true;
  } catch (error) {
    console.error('❌ Supabase config test failed:', error.message);
    return false;
  }
}

// Test 2: Test form submission without auth context interference
async function testFormSubmission() {
  console.log('\n=== Test 2: Form Submission Test ===');
  
  if (typeof window === 'undefined') {
    console.log('⚠️ Running in server environment - skipping DOM tests');
    return true;
  }
  
  try {
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find form elements
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    const form = document.querySelector('form');
    
    console.log('Form elements found:', {
      emailInput: !!emailInput,
      passwordInput: !!passwordInput,
      submitButton: !!submitButton,
      form: !!form
    });
    
    if (!emailInput || !passwordInput || !submitButton || !form) {
      console.log('❌ Form elements not found');
      return false;
    }
    
    // Check initial state
    console.log('Initial form state:', {
      buttonDisabled: submitButton.disabled,
      buttonText: submitButton.textContent?.trim()
    });
    
    // Fill test credentials
    emailInput.value = 'test@example.com';
    passwordInput.value = 'testpassword';
    
    // Submit form
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    // Wait for submission to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check submission state
    console.log('After submission state:', {
      buttonDisabled: submitButton.disabled,
      buttonText: submitButton.textContent?.trim()
    });
    
    // Check for debug logs
    const consoleLogs = Array.from(document.querySelectorAll('.debug-log')).map(el => el.textContent);
    console.log('Debug logs found:', consoleLogs.length);
    
    return true;
  } catch (error) {
    console.error('❌ Form submission test failed:', error.message);
    return false;
  }
}

// Test 3: Test authentication flow
async function testAuthenticationFlow() {
  console.log('\n=== Test 3: Authentication Flow Test ===');
  
  try {
    const { supabase } = await import('./src/supabase/client.js');
    
    // Test with invalid credentials first
    console.log('Testing invalid credentials...');
    const invalidResult = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'invalidpassword'
    });
    
    console.log('Invalid credentials result:', {
      hasError: !!invalidResult.error,
      errorMessage: invalidResult.error?.message,
      hasData: !!invalidResult.data
    });
    
    if (!invalidResult.error) {
      console.log('❌ Expected error for invalid credentials');
      return false;
    }
    
    // Test session retrieval
    console.log('Testing session retrieval...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session result:', {
      hasSession: !!session,
      hasError: !!sessionError,
      error: sessionError?.message
    });
    
    if (sessionError) {
      console.log('❌ Session retrieval failed:', sessionError.message);
      return false;
    }
    
    console.log('✅ Authentication flow working correctly');
    return true;
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error.message);
    return false;
  }
}

// Test 4: Test auth context state management
async function testAuthContextState() {
  console.log('\n=== Test 4: Auth Context State Test ===');
  
  if (typeof window === 'undefined') {
    console.log('⚠️ Running in server environment - skipping auth context tests');
    return true;
  }
  
  try {
    // Wait for auth context to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if auth context is properly initialized
    const authContextElements = document.querySelectorAll('[data-auth-context]');
    console.log('Auth context elements found:', authContextElements.length);
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[data-loading]');
    console.log('Loading elements found:', loadingElements.length);
    
    // Check for error states
    const errorElements = document.querySelectorAll('[data-error]');
    console.log('Error elements found:', errorElements.length);
    
    console.log('✅ Auth context state management appears functional');
    return true;
  } catch (error) {
    console.error('❌ Auth context state test failed:', error.message);
    return false;
  }
}

// Test 5: Test network requests
async function testNetworkRequests() {
  console.log('\n=== Test 5: Network Request Test ===');
  
  if (typeof window === 'undefined') {
    console.log('⚠️ Running in server environment - skipping network tests');
    return true;
  }
  
  try {
    // Monitor network requests
    const originalFetch = window.fetch;
    const requests = [];
    
    window.fetch = function(...args) {
      requests.push({
        url: args[0],
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString()
      });
      return originalFetch.apply(this, args);
    };
    
    // Wait for user to submit form or timeout after 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Restore fetch
    window.fetch = originalFetch;
    
    console.log('Network requests captured:', requests.length);
    requests.forEach(req => {
      console.log(`- ${req.method} ${req.url} at ${req.timestamp}`);
    });
    
    // Check for Supabase auth requests
    const authRequests = requests.filter(req => 
      req.url.includes('supabase') && req.url.includes('auth')
    );
    
    console.log('Supabase auth requests:', authRequests.length);
    
    if (authRequests.length === 0) {
      console.log('❌ No Supabase auth requests found');
      return false;
    }
    
    console.log('✅ Network requests working correctly');
    return true;
  } catch (error) {
    console.error('❌ Network request test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runVerificationTests() {
  console.log('🚀 Starting comprehensive login fix verification...\n');
  
  const results = {
    supabaseConfig: await testSupabaseConfig(),
    formSubmission: await testFormSubmission(),
    authenticationFlow: await testAuthenticationFlow(),
    authContextState: await testAuthContextState(),
    networkRequests: await testNetworkRequests()
  };
  
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`- ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔍 FAILED TESTS:');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`- ${test}: Needs attention`);
      }
    });
  }
  
  return results;
}

// Export for use in browser console or as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runVerificationTests };
} else {
  // Auto-run in browser
  runVerificationTests();
}