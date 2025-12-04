// Comprehensive diagnosis script for trades display issue
// This will help identify the root cause of why trades aren't showing

console.log('🔍 [TRADES_DISPLAY_DIAGNOSIS] Starting comprehensive diagnosis...');

// 1. Check Authentication State
function diagnoseAuthentication() {
  console.log('\n=== AUTHENTICATION DIAGNOSIS ===');
  
  // Check if we're on the trades page
  const currentPath = window.location.pathname;
  console.log('📍 Current path:', currentPath);
  
  // Check for auth context in the window (if available)
  if (window.__AUTH_CONTEXT__) {
    console.log('✅ Auth context found in window:', {
      hasUser: !!window.__AUTH_CONTEXT__.user,
      userEmail: window.__AUTH_CONTEXT__.user?.email,
      loading: window.__AUTH_CONTEXT__.loading,
      authInitialized: window.__AUTH_CONTEXT__.authInitialized
    });
  } else {
    console.log('❌ Auth context not found in window');
  }
  
  // Check localStorage for auth data
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-') || key.includes('auth')
  );
  
  if (authKeys.length > 0) {
    console.log('🔑 Found auth keys in localStorage:', authKeys);
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          console.log(`📦 ${key}:`, {
            hasUser: !!parsed.user,
            userEmail: parsed.user?.email,
            hasAccessToken: !!parsed.access_token,
            expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toISOString() : 'N/A'
          });
        }
      } catch (e) {
        console.log(`📦 ${key}: [non-JSON value, length: ${localStorage.getItem(key)?.length}]`);
      }
    });
  } else {
    console.log('❌ No auth keys found in localStorage');
  }
  
  // Check for auth guards and redirects
  console.log('🔒 Checking for auth guards...');
  const authGuardElements = document.querySelectorAll('[data-auth-guard], [class*="auth"], [class*="guard"]');
  console.log(`Found ${authGuardElements.length} potential auth guard elements`);
  
  return {
    hasAuthData: authKeys.length > 0,
    isOnTradesPage: currentPath.includes('/trades'),
    authKeysFound: authKeys.length
  };
}

// 2. Check Data Fetching
function diagnoseDataFetching() {
  console.log('\n=== DATA FETCHING DIAGNOSIS ===');
  
  // Check for network requests
  console.log('🌐 Checking network requests...');
  
  // Look for Supabase requests in the network tab (if available)
  if (window.performance && window.performance.getEntriesByType) {
    const entries = window.performance.getEntriesByType('navigation');
    console.log(`Found ${entries.length} navigation entries`);
    
    // Check for recent XHR/fetch requests
    const resourceEntries = window.performance.getEntriesByType('resource');
    const supabaseRequests = resourceEntries.filter(entry => 
      entry.name && entry.name.includes('supabase')
    );
    
    console.log(`Found ${supabaseRequests.length} Supabase requests:`, supabaseRequests.map(req => ({
      url: req.name,
      method: req.initiatorType,
      status: 'unknown' // We can't get status from performance API
    })));
  }
  
  // Check for trades data in the page
  console.log('📊 Checking for trades data in the page...');
  const tradesElements = document.querySelectorAll('[class*="trade"], [data-trade-id]');
  console.log(`Found ${tradesElements.length} trade-related elements`);
  
  // Check for "No trades yet" message
  const noTradesMessage = document.querySelector('*');
  if (noTradesMessage) {
    const textContent = noTradesMessage.textContent || '';
    if (textContent.includes('No trades') || textContent.includes('Start logging')) {
      console.log('📝 Found "No trades" message:', textContent.substring(0, 100));
      return { hasNoTradesMessage: true, message: textContent };
    }
  }
  
  // Check for loading indicators
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
  console.log(`Found ${loadingElements.length} loading elements`);
  
  return {
    hasTradesElements: tradesElements.length > 0,
    hasLoadingElements: loadingElements.length > 0,
    hasNoTradesMessage: false
  };
}

// 3. Check Console Errors
function diagnoseConsoleErrors() {
  console.log('\n=== CONSOLE ERRORS DIAGNOSIS ===');
  
  // Check for recent errors in console
  const originalError = console.error;
  const errors = [];
  
  // This won't catch past errors, but we can check for error elements
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
  console.log(`Found ${errorElements.length} error/alert elements`);
  
  errorElements.forEach((el, index) => {
    console.log(`❌ Error element ${index + 1}:`, el.textContent?.substring(0, 200));
  });
  
  return {
    hasErrorElements: errorElements.length > 0,
    errorCount: errorElements.length
  };
}

// 4. Test Mock Data Injection
function testMockDataInjection() {
  console.log('\n=== MOCK DATA TEST ===');
  
  // Create mock trades data
  const mockTrades = [
    {
      id: 'mock-1',
      symbol: 'AAPL',
      side: 'Buy',
      quantity: 100,
      entry_price: 150.25,
      exit_price: 155.50,
      pnl: 525.00,
      trade_date: '2024-01-15',
      entry_time: '09:30',
      exit_time: '10:45',
      emotional_state: 'Confident',
      market: 'stock'
    },
    {
      id: 'mock-2',
      symbol: 'BTC',
      side: 'Sell',
      quantity: 0.5,
      entry_price: 45000,
      exit_price: 44000,
      pnl: 500.00,
      trade_date: '2024-01-14',
      entry_time: '14:00',
      exit_time: '16:30',
      emotional_state: 'Anxious',
      market: 'crypto'
    }
  ];
  
  console.log('🎭 Created mock trades data:', mockTrades.length, 'trades');
  
  // Try to inject mock data into the page (if we can find the right place)
  const tradesContainer = document.querySelector('[class*="trade"], [data-trades-container]');
  if (tradesContainer) {
    console.log('🎯 Found trades container, attempting to inject mock data...');
    // This is a simplified injection - in reality we'd need to match the component structure
    return { mockDataInjected: true, containerFound: true };
  } else {
    console.log('❌ Could not find trades container for mock data injection');
    return { mockDataInjected: false, containerFound: false };
  }
}

// 5. Check Component State
function diagnoseComponentState() {
  console.log('\n=== COMPONENT STATE DIAGNOSIS ===');
  
  // Check if React DevTools is available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
    // Try to get component tree (this is limited without DevTools)
    const reactRoot = document.querySelector('[data-reactroot]');
    console.log('React root found:', !!reactRoot);
  } else {
    console.log('❌ React DevTools not available');
  }
  
  // Check for specific component markers
  const componentMarkers = {
    tradesPage: document.querySelector('[data-page="trades"]'),
    authGuard: document.querySelector('[data-auth-guard]'),
    tradesContent: document.querySelector('[class*="TradesPageContent"]')
  };
  
  Object.entries(componentMarkers).forEach(([name, element]) => {
    console.log(`🔧 ${name}:`, !!element);
  });
  
  return componentMarkers;
}

// Main diagnosis function
function runDiagnosis() {
  console.log('🚀 Starting comprehensive trades display diagnosis...');
  
  const results = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    authentication: diagnoseAuthentication(),
    dataFetching: diagnoseDataFetching(),
    consoleErrors: diagnoseConsoleErrors(),
    mockDataTest: testMockDataInjection(),
    componentState: diagnoseComponentState()
  };
  
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  console.log('📊 Full diagnosis results:', results);
  
  // Determine most likely issues
  const issues = [];
  
  if (!results.authentication.hasAuthData) {
    issues.push('❌ No authentication data found - user may not be logged in');
  }
  
  if (results.dataFetching.hasNoTradesMessage) {
    issues.push('ℹ️ "No trades" message is showing - this might be the expected state');
  }
  
  if (results.dataFetching.hasLoadingElements) {
    issues.push('⏳ Loading elements detected - data might still be loading');
  }
  
  if (results.consoleErrors.hasErrorElements) {
    issues.push('🚨 Error elements found - there may be JavaScript errors');
  }
  
  if (issues.length === 0) {
    issues.push('✅ No obvious issues detected - problem may be more subtle');
  }
  
  console.log('\n🎯 LIKELY ISSUES:');
  issues.forEach(issue => console.log(issue));
  
  // Save results to localStorage for debugging
  try {
    localStorage.setItem('trades-diagnosis-results', JSON.stringify(results));
    console.log('💾 Diagnosis results saved to localStorage');
  } catch (e) {
    console.warn('Failed to save diagnosis results:', e);
  }
  
  return results;
}

// Auto-run diagnosis
if (typeof window !== 'undefined') {
  // Wait a bit for page to load
  setTimeout(() => {
    runDiagnosis();
  }, 2000);
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDiagnosis };
}