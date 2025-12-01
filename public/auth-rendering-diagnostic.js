// AUTHENTICATION AND RENDERING DIAGNOSTIC SCRIPT
// This script will validate assumptions about the root cause of authentication and rendering issues

console.log('🔍 [DIAGNOSTIC] Starting comprehensive authentication and rendering diagnosis...');

// POSSIBLE SOURCES OF PROBLEM (5-7 identified):
// 1. Session persistence failure - Supabase session not being stored/retrieved properly
// 2. Auth context initialization race condition - Multiple initialization attempts causing conflicts
// 3. Server-side rendering mismatch - Auth state different between server and client
// 4. Continuous re-rendering loop - Auth state changes triggering infinite re-renders
// 5. Sidebar conditional rendering logic - Sidebar not showing due to auth state issues
// 6. Client-side hydration failure - Server-rendered HTML doesn't match client
// 7. Authentication flow timing - Auth events not properly synchronized

// MOST LIKELY SOURCES (1-2 distilled):
// 1. Session persistence failure - The repeated "session from storage null" messages indicate the core issue
// 2. Auth context initialization race condition - Multiple initialization attempts causing conflicts

const diagnosticResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    primaryIssue: null,
    secondaryIssue: null,
    confidence: 0
  }
};

// Test 1: Check localStorage/sessionStorage for Supabase data
function testSessionStorage() {
  console.log('🧪 [TEST 1] Testing session storage...');
  
  const storageKeys = [];
  const authData = {};
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
      storageKeys.push(`localStorage: ${key}`);
      try {
        authData[key] = localStorage.getItem(key);
      } catch (e) {
        authData[key] = 'ERROR_READING';
      }
    }
  }
  
  // Check sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
      storageKeys.push(`sessionStorage: ${key}`);
      try {
        authData[key] = sessionStorage.getItem(key);
      } catch (e) {
        authData[key] = 'ERROR_READING';
      }
    }
  }
  
  const result = {
    test: 'Session Storage',
    status: storageKeys.length > 0 ? 'PASS' : 'FAIL',
    details: {
      storageKeys,
      authData: Object.keys(authData).length > 0 ? 'DATA_FOUND' : 'NO_DATA',
      hasSupabaseData: storageKeys.some(key => key.includes('supabase') || key.includes('sb-'))
    }
  };
  
  diagnosticResults.tests.push(result);
  console.log('📊 [TEST 1 RESULT]', result);
  return result;
}

// Test 2: Check Supabase client initialization
function testSupabaseClient() {
  console.log('🧪 [TEST 2] Testing Supabase client...');
  
  let result = {
    test: 'Supabase Client',
    status: 'UNKNOWN',
    details: {}
  };
  
  try {
    // Try to access the Supabase client from the window object if available
    if (typeof window !== 'undefined') {
      const supabase = window.supabase || (window as any).supabase;
      
      if (supabase) {
        result.status = 'PASS';
        result.details = {
          clientExists: true,
          hasAuth: !!(supabase.auth),
          authMethods: supabase.auth ? Object.keys(supabase.auth) : [],
          clientUrl: supabase.supabaseUrl || 'UNKNOWN'
        };
      } else {
        result.status = 'FAIL';
        result.details = {
          clientExists: false,
          error: 'Supabase client not found on window object'
        };
      }
    } else {
      result.status = 'SKIP';
      result.details = {
        error: 'Window object not available (server-side)'
      };
    }
  } catch (error) {
    result.status = 'ERROR';
    result.details = {
      error: error.message,
      stack: error.stack
    };
  }
  
  diagnosticResults.tests.push(result);
  console.log('📊 [TEST 2 RESULT]', result);
  return result;
}

// Test 3: Check authentication state in DOM
function testAuthStateInDOM() {
  console.log('🧪 [TEST 3] Testing authentication state in DOM...');
  
  const result = {
    test: 'Auth State in DOM',
    status: 'UNKNOWN',
    details: {}
  };
  
  try {
    if (typeof document !== 'undefined') {
      // Look for auth-related elements
      const authElements = document.querySelectorAll('[data-auth], [data-user], [data-session]');
      const sidebarElements = document.querySelectorAll('aside, .sidebar, .verotrade-sidebar');
      const userElements = document.querySelectorAll('[data-user-email], .user-email, .user-info');
      
      result.status = 'PASS';
      result.details = {
        authElements: authElements.length,
        sidebarElements: sidebarElements.length,
        userElements: userElements.length,
        hasSidebar: sidebarElements.length > 0,
        hasUserElements: userElements.length > 0
      };
      
      // Check if sidebar is visible
      if (sidebarElements.length > 0) {
        const firstSidebar = sidebarElements[0] as HTMLElement;
        const styles = window.getComputedStyle(firstSidebar);
        result.details.sidebarVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
        result.details.sidebarTransform = styles.transform;
        result.details.sidebarOpacity = styles.opacity;
      }
    } else {
      result.status = 'SKIP';
      result.details = {
        error: 'Document not available (server-side)'
      };
    }
  } catch (error) {
    result.status = 'ERROR';
    result.details = {
      error: error.message
    };
  }
  
  diagnosticResults.tests.push(result);
  console.log('📊 [TEST 3 RESULT]', result);
  return result;
}

// Test 4: Check for continuous re-rendering
function testReRenderingLoop() {
  console.log('🧪 [TEST 4] Testing for continuous re-rendering...');
  
  let renderCount = 0;
  let lastRenderTime = Date.now();
  const renderTimes = [];
  
  // Monitor DOM changes for 5 seconds
  const observer = new MutationObserver((mutations) => {
    renderCount++;
    renderTimes.push(Date.now() - lastRenderTime);
    lastRenderTime = Date.now();
  });
  
  try {
    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      // Stop observing after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        
        const avgRenderInterval = renderTimes.length > 0 
          ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
          : 0;
        
        const result = {
          test: 'Re-rendering Loop',
          status: renderCount > 50 ? 'FAIL' : 'PASS', // More than 50 renders in 5 seconds is excessive
          details: {
            totalRenders: renderCount,
            avgRenderInterval: avgRenderInterval.toFixed(2),
            renderTimes: renderTimes.slice(0, 10), // First 10 render intervals
            excessiveRendering: renderCount > 50
          }
        };
        
        diagnosticResults.tests.push(result);
        console.log('📊 [TEST 4 RESULT]', result);
      }, 5000);
    }
  } catch (error) {
    const result = {
      test: 'Re-rendering Loop',
      status: 'ERROR',
      details: {
        error: error.message
      }
    };
    
    diagnosticResults.tests.push(result);
    console.log('📊 [TEST 4 RESULT]', result);
  }
}

// Test 5: Check authentication events
function testAuthEvents() {
  console.log('🧪 [TEST 5] Testing authentication events...');
  
  const authEvents = [];
  const eventTypes = ['auth_state_changed', 'session_updated', 'user_updated', 'signed_in', 'signed_out'];
  
  // Listen for auth events for 5 seconds
  const listeners = [];
  
  try {
    if (typeof window !== 'undefined') {
      eventTypes.forEach(eventType => {
        const listener = (event) => {
          authEvents.push({
            type: eventType,
            timestamp: Date.now(),
            details: event.detail || event
          });
        };
        
        window.addEventListener(eventType, listener);
        listeners.push({ type: eventType, listener });
      });
      
      // Also check for custom auth events
      const customListener = (event) => {
        if (event.type.includes('auth') || event.type.includes('session')) {
          authEvents.push({
            type: event.type,
            timestamp: Date.now(),
            details: event.detail || event
          });
        }
      };
      
      window.addEventListener('customEvent', customListener);
      listeners.push({ type: 'customEvent', listener: customListener });
      
      // Stop listening after 5 seconds
      setTimeout(() => {
        listeners.forEach(({ type, listener }) => {
          window.removeEventListener(type, listener);
        });
        
        const result = {
          test: 'Authentication Events',
          status: authEvents.length > 0 ? 'PASS' : 'FAIL',
          details: {
            totalEvents: authEvents.length,
            eventTypes: [...new Set(authEvents.map(e => e.type))],
            events: authEvents.slice(0, 5), // First 5 events
            noAuthEvents: authEvents.length === 0
          }
        };
        
        diagnosticResults.tests.push(result);
        console.log('📊 [TEST 5 RESULT]', result);
      }, 5000);
    }
  } catch (error) {
    const result = {
      test: 'Authentication Events',
      status: 'ERROR',
      details: {
        error: error.message
      }
    };
    
    diagnosticResults.tests.push(result);
    console.log('📊 [TEST 5 RESULT]', result);
  }
}

// Test 6: Check network requests for authentication
function testAuthNetworkRequests() {
  console.log('🧪 [TEST 6] Testing authentication network requests...');
  
  const authRequests = [];
  const originalFetch = window.fetch;
  
  // Intercept fetch requests for 5 seconds
  window.fetch = function(...args) {
    const url = args[0];
    const startTime = Date.now();
    
    return originalFetch.apply(this, args).then(response => {
      const endTime = Date.now();
      
      if (typeof url === 'string' && (
        url.includes('supabase') || 
        url.includes('auth') || 
        url.includes('session') ||
        url.includes('token')
      )) {
        authRequests.push({
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          timestamp: startTime
        });
      }
      
      return response;
    }).catch(error => {
      const endTime = Date.now();
      
      if (typeof url === 'string' && (
        url.includes('supabase') || 
        url.includes('auth') || 
        url.includes('session') ||
        url.includes('token')
      )) {
        authRequests.push({
          url,
          method: args[1]?.method || 'GET',
          error: error.message,
          duration: endTime - startTime,
          timestamp: startTime
        });
      }
      
      throw error;
    });
  };
  
  // Restore original fetch after 5 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    
    const result = {
      test: 'Auth Network Requests',
      status: authRequests.length > 0 ? 'PASS' : 'FAIL',
      details: {
        totalRequests: authRequests.length,
        successfulRequests: authRequests.filter(r => !r.error).length,
        failedRequests: authRequests.filter(r => r.error).length,
        avgDuration: authRequests.length > 0 
          ? (authRequests.reduce((sum, r) => sum + r.duration, 0) / authRequests.length).toFixed(2)
          : 0,
        requests: authRequests.slice(0, 5) // First 5 requests
      }
    };
    
    diagnosticResults.tests.push(result);
    console.log('📊 [TEST 6 RESULT]', result);
  }, 5000);
}

// Run all tests
function runAllTests() {
  console.log('🚀 [DIAGNOSTIC] Running all diagnostic tests...');
  
  // Test 1: Session Storage
  testSessionStorage();
  
  // Test 2: Supabase Client
  testSupabaseClient();
  
  // Test 3: Auth State in DOM
  testAuthStateInDOM();
  
  // Test 4: Re-rendering Loop
  testReRenderingLoop();
  
  // Test 5: Auth Events
  testAuthEvents();
  
  // Test 6: Network Requests
  testAuthNetworkRequests();
  
  // Analyze results after 6 seconds (all tests should be complete)
  setTimeout(() => {
    analyzeResults();
  }, 6000);
}

// Analyze results and determine root cause
function analyzeResults() {
  console.log('🔍 [ANALYSIS] Analyzing diagnostic results...');
  
  const failedTests = diagnosticResults.tests.filter(test => test.status === 'FAIL');
  const passedTests = diagnosticResults.tests.filter(test => test.status === 'PASS');
  const errorTests = diagnosticResults.tests.filter(test => test.status === 'ERROR');
  
  // Determine primary and secondary issues
  let primaryIssue = null;
  let secondaryIssue = null;
  let confidence = 0;
  
  // Check for session storage issues
  const sessionStorageTest = diagnosticResults.tests.find(test => test.test === 'Session Storage');
  if (sessionStorageTest && sessionStorageTest.status === 'FAIL') {
    primaryIssue = 'Session persistence failure - Supabase session data not found in storage';
    confidence += 40;
  }
  
  // Check for re-rendering issues
  const reRenderingTest = diagnosticResults.tests.find(test => test.test === 'Re-rendering Loop');
  if (reRenderingTest && reRenderingTest.status === 'FAIL') {
    if (!primaryIssue) {
      primaryIssue = 'Continuous re-rendering loop - Excessive DOM updates detected';
      confidence += 30;
    } else {
      secondaryIssue = 'Continuous re-rendering loop - Excessive DOM updates detected';
      confidence += 20;
    }
  }
  
  // Check for sidebar visibility issues
  const authStateTest = diagnosticResults.tests.find(test => test.test === 'Auth State in DOM');
  if (authStateTest && authStateTest.status === 'PASS' && !authStateTest.details.sidebarVisible) {
    if (!primaryIssue) {
      primaryIssue = 'Sidebar visibility issue - Sidebar exists but is hidden';
      confidence += 25;
    } else if (!secondaryIssue) {
      secondaryIssue = 'Sidebar visibility issue - Sidebar exists but is hidden';
      confidence += 15;
    }
  }
  
  // Check for auth event issues
  const authEventsTest = diagnosticResults.tests.find(test => test.test === 'Authentication Events');
  if (authEventsTest && authEventsTest.status === 'FAIL') {
    if (!primaryIssue) {
      primaryIssue = 'Auth event system failure - No authentication events detected';
      confidence += 20;
    } else if (!secondaryIssue) {
      secondaryIssue = 'Auth event system failure - No authentication events detected';
      confidence += 10;
    }
  }
  
  diagnosticResults.summary = {
    primaryIssue,
    secondaryIssue,
    confidence,
    totalTests: diagnosticResults.tests.length,
    passedTests: passedTests.length,
    failedTests: failedTests.length,
    errorTests: errorTests.length
  };
  
  console.log('📋 [FINAL DIAGNOSIS]', diagnosticResults.summary);
  console.log('📊 [ALL RESULTS]', diagnosticResults);
  
  // Save results to localStorage for later retrieval
  try {
    localStorage.setItem('auth-diagnostic-results', JSON.stringify(diagnosticResults));
    console.log('💾 [DIAGNOSTIC] Results saved to localStorage');
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Failed to save results to localStorage:', error);
  }
  
  return diagnosticResults.summary;
}

// Export functions for manual testing
if (typeof window !== 'undefined') {
  (window as any).authDiagnostic = {
    runAllTests,
    testSessionStorage,
    testSupabaseClient,
    testAuthStateInDOM,
    testReRenderingLoop,
    testAuthEvents,
    testAuthNetworkRequests,
    analyzeResults,
    getResults: () => diagnosticResults
  };
  
  console.log('🔧 [DIAGNOSTIC] Diagnostic functions exported to window.authDiagnostic');
}

// Auto-run tests if this script is loaded in browser
if (typeof window !== 'undefined') {
  console.log('🚀 [DIAGNOSTIC] Auto-running diagnostic tests...');
  runAllTests();
}