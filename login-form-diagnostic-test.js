// Login Form Submission Diagnostic Test
// This test will help identify the root cause of login form submission failures

console.log('🔍 Starting Login Form Diagnostic Test...');

// Test 1: Check if Supabase client is properly initialized
async function testSupabaseInitialization() {
  console.log('\n=== Test 1: Supabase Client Initialization ===');
  
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment variables check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Supabase environment variables are missing');
      return false;
    }
    
    // Test Supabase client creation
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('✅ Supabase client created successfully');
    console.log('- Client URL:', client.supabaseUrl);
    console.log('- Auth available:', !!client.auth);
    
    return true;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    return false;
  }
}

// Test 2: Check form submission event handling
function testFormSubmissionHandling() {
  console.log('\n=== Test 2: Form Submission Event Handling ===');
  
  if (typeof window === 'undefined') {
    console.log('⚠️ Running in server environment - skipping DOM tests');
    return true;
  }
  
  try {
    // Check if login form exists
    const loginForm = document.querySelector('form[data-testid="login-form"]');
    const submitButton = document.querySelector('button[data-testid="login-submit-button"]');
    
    console.log('DOM elements check:');
    console.log('- Login form:', loginForm ? '✅ Found' : '❌ Not found');
    console.log('- Submit button:', submitButton ? '✅ Found' : '❌ Not found');
    
    if (!loginForm || !submitButton) {
      console.log('❌ Required form elements are missing');
      return false;
    }
    
    // Check form event listeners
    const formEvents = getEventListeners ? getEventListeners(loginForm) : {};
    console.log('- Form event listeners:', Object.keys(formEvents));
    
    // Check button state
    console.log('- Button disabled:', submitButton.disabled);
    console.log('- Button text:', submitButton.textContent);
    
    return true;
  } catch (error) {
    console.error('❌ Form submission test failed:', error.message);
    return false;
  }
}

// Test 3: Check authentication state
async function testAuthenticationState() {
  console.log('\n=== Test 3: Authentication State ===');
  
  try {
    // Test if we can get current session
    const { supabase } = await import('../src/supabase/client.js');
    
    if (!supabase) {
      console.log('❌ Supabase client not available');
      return false;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    console.log('Auth state check:');
    console.log('- Session available:', !!data.session);
    console.log('- User authenticated:', !!data.session?.user);
    console.log('- Session error:', error?.message || 'None');
    
    if (error) {
      console.log('❌ Auth state check failed:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Authentication state test failed:', error.message);
    return false;
  }
}

// Test 4: Simulate form submission
async function testFormSubmission() {
  console.log('\n=== Test 4: Form Submission Simulation ===');
  
  try {
    if (typeof window === 'undefined') {
      console.log('⚠️ Running in server environment - skipping form submission test');
      return true;
    }
    
    // Find form elements
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
      console.log('❌ Form inputs not found');
      return false;
    }
    
    console.log('Form elements found - testing submission...');
    
    // Fill test credentials
    emailInput.value = 'test@example.com';
    passwordInput.value = 'testpassword';
    
    // Create submit event
    const submitEvent = new Event('submit', { 
      bubbles: true, 
      cancelable: true 
    });
    
    // Track console logs during submission
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    // Submit form
    const form = emailInput.closest('form');
    const result = form.dispatchEvent(submitEvent);
    
    // Restore console.log
    console.log = originalLog;
    
    console.log('Form submission results:');
    console.log('- Event dispatched:', result);
    console.log('- Button disabled after submit:', submitButton.disabled);
    console.log('- Console logs during submission:', logs);
    
    return true;
  } catch (error) {
    console.error('❌ Form submission test failed:', error.message);
    return false;
  }
}

// Test 5: Check network requests
function testNetworkRequests() {
  console.log('\n=== Test 5: Network Request Monitoring ===');
  
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
    
    console.log('Network monitoring enabled - try submitting the form');
    console.log('Current requests:', requests.length);
    
    // Restore fetch after 10 seconds
    setTimeout(() => {
      window.fetch = originalFetch;
      console.log('Network requests captured:', requests);
      requests.forEach(req => {
        console.log(`- ${req.method} ${req.url} at ${req.timestamp}`);
      });
    }, 10000);
    
    return true;
  } catch (error) {
    console.error('❌ Network monitoring setup failed:', error.message);
    return false;
  }
}

// Run all tests
async function runDiagnosticTests() {
  console.log('🚀 Starting comprehensive login form diagnostic...\n');
  
  const results = {
    supabaseInit: await testSupabaseInitialization(),
    formHandling: testFormSubmissionHandling(),
    authState: await testAuthenticationState(),
    formSubmission: await testFormSubmission(),
    networkMonitoring: testNetworkRequests()
  };
  
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log('Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`- ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔍 RECOMMENDED ACTIONS:');
    if (!results.supabaseInit) {
      console.log('- Fix Supabase environment variables and client initialization');
    }
    if (!results.formHandling) {
      console.log('- Check form HTML structure and event handlers');
    }
    if (!results.authState) {
      console.log('- Debug authentication context and session management');
    }
    if (!results.formSubmission) {
      console.log('- Add debugging to form submission handler');
    }
    if (!results.networkMonitoring) {
      console.log('- Monitor network requests for authentication calls');
    }
  }
  
  return results;
}

// Export for use in browser console or as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDiagnosticTests };
} else {
  // Auto-run in browser
  runDiagnosticTests();
}