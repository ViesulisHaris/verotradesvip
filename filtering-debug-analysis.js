// Comprehensive Filtering Debug Analysis Script
// This script will systematically test the filtering functionality on the trades page

console.log('🔍 [FILTERING_DEBUG] Starting comprehensive filtering analysis...');

// Function to wait for element to appear
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Function to monitor network requests
function monitorNetworkRequests() {
  const originalFetch = window.fetch;
  const requests = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    const requestInfo = {
      url: url,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : null,
      timestamp: new Date().toISOString(),
      response: null,
      error: null
    };
    
    requests.push(requestInfo);
    
    console.log('🌐 [FILTERING_DEBUG] Network request:', requestInfo);
    
    return originalFetch.apply(this, args)
      .then(response => {
        requestInfo.response = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        // Clone response to read body without consuming original
        const clonedResponse = response.clone();
        return clonedResponse.json().then(data => {
          requestInfo.response.data = data;
          console.log('📥 [FILTERING_DEBUG] Network response:', requestInfo.response);
          return response;
        }).catch(() => {
          // If response is not JSON, just return original response
          return response;
        });
      })
      .catch(error => {
        requestInfo.error = error.message;
        console.error('❌ [FILTERING_DEBUG] Network error:', requestInfo);
        throw error;
      });
  };
  
  return {
    getRequests: () => requests,
    clearRequests: () => requests.length = 0,
    findTradesRequests: () => requests.filter(req => req.url.includes('trades'))
  };
}

// Function to monitor console errors
function monitorConsoleErrors() {
  const errors = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    errors.push({
      type: 'error',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    errors.push({
      type: 'warn',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    originalWarn.apply(console, args);
  };
  
  return {
    getErrors: () => errors,
    clearErrors: () => errors.length = 0
  };
}

// Function to check if we're on the trades page
function isOnTradesPage() {
  return window.location.pathname.includes('/trades');
}

// Function to get current filter values from the DOM
function getCurrentFilterValues() {
  const symbolInput = document.querySelector('input[placeholder*="Search symbol"]');
  const marketSelect = document.querySelector('select');
  const dateFromInput = document.querySelector('input[type="date"]:first-of-type');
  const dateToInput = document.querySelector('input[type="date"]:last-of-type');
  
  return {
    symbol: symbolInput ? symbolInput.value : 'NOT_FOUND',
    market: marketSelect ? marketSelect.value : 'NOT_FOUND',
    dateFrom: dateFromInput ? dateFromInput.value : 'NOT_FOUND',
    dateTo: dateToInput ? dateToInput.value : 'NOT_FOUND'
  };
}

// Function to simulate filter changes
async function simulateFilterChange(filterType, value) {
  console.log(`🎯 [FILTERING_DEBUG] Simulating ${filterType} change to:`, value);
  
  let element;
  switch (filterType) {
    case 'symbol':
      element = document.querySelector('input[placeholder*="Search symbol"]');
      if (element) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'market':
      element = document.querySelector('select');
      if (element) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'dateFrom':
      element = document.querySelector('input[type="date"]:first-of-type');
      if (element) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'dateTo':
      element = document.querySelector('input[type="date"]:last-of-type');
      if (element) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
  }
  
  if (!element) {
    console.error(`❌ [FILTERING_DEBUG] Element for ${filterType} not found`);
    return false;
  }
  
  return true;
}

// Function to wait for debounced API call
function waitForDebouncedCall(timeout = 500) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

// Main debugging function
async function runFilteringDebugAnalysis() {
  console.log('🚀 [FILTERING_DEBUG] Starting filtering debug analysis...');
  
  if (!isOnTradesPage()) {
    console.error('❌ [FILTERING_DEBUG] Not on trades page. Please navigate to /trades');
    return;
  }
  
  // Initialize monitoring
  const networkMonitor = monitorNetworkRequests();
  const consoleMonitor = monitorConsoleErrors();
  
  try {
    // Wait for page to load
    console.log('⏳ [FILTERING_DEBUG] Waiting for trades page to load...');
    await waitForElement('.dashboard-card');
    console.log('✅ [FILTERING_DEBUG] Trades page loaded');
    
    // Get initial state
    const initialFilters = getCurrentFilterValues();
    console.log('📊 [FILTERING_DEBUG] Initial filter values:', initialFilters);
    
    // Clear previous network requests
    networkMonitor.clearRequests();
    
    // Test 1: Symbol filter
    console.log('\n🧪 [FILTERING_DEBUG] Test 1: Symbol filter');
    const symbolTest = await simulateFilterChange('symbol', 'AAPL');
    if (symbolTest) {
      await waitForDebouncedCall(500); // Wait for debounce
      const symbolRequests = networkMonitor.findTradesRequests();
      console.log('📡 [FILTERING_DEBUG] Symbol filter requests:', symbolRequests);
    }
    
    // Test 2: Market filter
    console.log('\n🧪 [FILTERING_DEBUG] Test 2: Market filter');
    const marketTest = await simulateFilterChange('market', 'stock');
    if (marketTest) {
      await waitForDebouncedCall(500);
      const marketRequests = networkMonitor.findTradesRequests();
      console.log('📡 [FILTERING_DEBUG] Market filter requests:', marketRequests);
    }
    
    // Test 3: Date range filter
    console.log('\n🧪 [FILTERING_DEBUG] Test 3: Date range filter');
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const dateFromTest = await simulateFilterChange('dateFrom', lastWeek);
    const dateToTest = await simulateFilterChange('dateTo', today);
    
    if (dateFromTest && dateToTest) {
      await waitForDebouncedCall(500);
      const dateRequests = networkMonitor.findTradesRequests();
      console.log('📡 [FILTERING_DEBUG] Date range filter requests:', dateRequests);
    }
    
    // Test 4: Clear filters
    console.log('\n🧪 [FILTERING_DEBUG] Test 4: Clear filters');
    const clearButton = document.querySelector('button[class*="secondary"]');
    if (clearButton && clearButton.textContent.includes('Clear')) {
      clearButton.click();
      await waitForDebouncedCall(500);
      const clearRequests = networkMonitor.findTradesRequests();
      console.log('📡 [FILTERING_DEBUG] Clear filters requests:', clearRequests);
    }
    
    // Analyze results
    console.log('\n📈 [FILTERING_DEBUG] Analysis Results:');
    const allRequests = networkMonitor.findTradesRequests();
    const allErrors = consoleMonitor.getErrors();
    
    console.log('📊 [FILTERING_DEBUG] Total trades requests:', allRequests.length);
    console.log('📊 [FILTERING_DEBUG] Total console errors:', allErrors.length);
    
    // Check for specific issues
    if (allRequests.length === 0) {
      console.error('❌ [FILTERING_DEBUG] CRITICAL: No API requests made during filter tests');
    }
    
    if (allErrors.length > 0) {
      console.error('❌ [FILTERING_DEBUG] Console errors detected:', allErrors);
    }
    
    // Check request parameters
    allRequests.forEach((req, index) => {
      console.log(`🔍 [FILTERING_DEBUG] Request ${index + 1}:`, {
        url: req.url,
        method: req.method,
        body: req.body,
        response: req.response
      });
    });
    
    // Check for proper filter parameters in requests
    const requestWithFilters = allRequests.find(req => 
      req.body && (
        req.body.symbol || 
        req.body.market || 
        req.body.dateFrom || 
        req.body.dateTo
      )
    );
    
    if (!requestWithFilters) {
      console.error('❌ [FILTERING_DEBUG] CRITICAL: No requests found with filter parameters');
    } else {
      console.log('✅ [FILTERING_DEBUG] Found request with filter parameters:', requestWithFilters);
    }
    
    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      initialFilters,
      totalRequests: allRequests.length,
      totalErrors: allErrors.length,
      requests: allRequests,
      errors: allErrors,
      hasFilterRequests: allRequests.length > 0,
      hasFilterParameters: !!requestWithFilters,
      status: allRequests.length > 0 && requestWithFilters ? 'PASSING' : 'FAILING'
    };
    
    console.log('\n📋 [FILTERING_DEBUG] Final Report:', report);
    
    // Save report to localStorage for later analysis
    localStorage.setItem('filtering_debug_report', JSON.stringify(report));
    
    return report;
    
  } catch (error) {
    console.error('❌ [FILTERING_DEBUG] Error during analysis:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'ERROR'
    };
  }
}

// Function to analyze React component state
function analyzeReactState() {
  console.log('🔬 [FILTERING_DEBUG] Analyzing React component state...');
  
  // Try to access React DevTools global
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ [FILTERING_DEBUG] React DevTools detected');
    // This would require more complex React DevTools API usage
  } else {
    console.log('⚠️ [FILTERING_DEBUG] React DevTools not available');
  }
  
  // Check for global state or context
  if (window.filterState) {
    console.log('📊 [FILTERING_DEBUG] Global filter state found:', window.filterState);
  }
  
  // Check for any filter-related data in window
  const filterKeys = Object.keys(window).filter(key => 
    key.toLowerCase().includes('filter') || 
    key.toLowerCase().includes('trade')
  );
  
  if (filterKeys.length > 0) {
    console.log('🔍 [FILTERING_DEBUG] Filter-related globals found:', filterKeys);
  }
}

// Auto-run if on trades page
if (isOnTradesPage()) {
  console.log('🎯 [FILTERING_DEBUG] Detected trades page, starting analysis...');
  
  // Wait a bit for page to fully load
  setTimeout(() => {
    analyzeReactState();
    runFilteringDebugAnalysis();
  }, 2000);
} else {
  console.log('⚠️ [FILTERING_DEBUG] Please navigate to the trades page (/trades) to run this analysis');
}

// Export functions for manual testing
window.filteringDebug = {
  runAnalysis: runFilteringDebugAnalysis,
  analyzeState: analyzeReactState,
  simulateFilter: simulateFilterChange,
  getCurrentFilters: getCurrentFilterValues,
  isOnTradesPage: isOnTradesPage
};

console.log('🔧 [FILTERING_DEBUG] Debug tools loaded. Use window.filteringDebug to access functions.');