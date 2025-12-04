// Simple Filter Test Script - Run this in the browser console on the /trades page
console.log('🔍 [SIMPLE_FILTER_TEST] Starting simple filter test...');

// Check if we're on the trades page
if (!window.location.pathname.includes('/trades')) {
  console.error('❌ [SIMPLE_FILTER_TEST] Please navigate to /trades page first');
} else {
  console.log('✅ [SIMPLE_FILTER_TEST] On trades page, proceeding with test...');
  
  // Test 1: Check if filter elements exist
  console.log('\n🧪 [SIMPLE_FILTER_TEST] Test 1: Checking filter elements...');
  
  const symbolInput = document.querySelector('input[placeholder*="Search symbol"]');
  const marketSelect = document.querySelector('select');
  const dateFromInput = document.querySelector('input[type="date"]:first-of-type');
  const dateToInput = document.querySelector('input[type="date"]:last-of-type');
  const clearButton = document.querySelector('button[class*="secondary"]');
  
  console.log('📊 [SIMPLE_FILTER_TEST] Filter elements found:', {
    symbolInput: !!symbolInput,
    marketSelect: !!marketSelect,
    dateFromInput: !!dateFromInput,
    dateToInput: !!dateToInput,
    clearButton: !!clearButton
  });
  
  if (!symbolInput || !marketSelect || !dateFromInput || !dateToInput) {
    console.error('❌ [SIMPLE_FILTER_TEST] Some filter elements are missing');
  } else {
    console.log('✅ [SIMPLE_FILTER_TEST] All filter elements found');
  }
  
  // Test 2: Monitor network requests
  console.log('\n🧪 [SIMPLE_FILTER_TEST] Test 2: Setting up network monitoring...');
  
  let requestCount = 0;
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('trades')) {
      requestCount++;
      console.log(`📡 [SIMPLE_FILTER_TEST] Trades request #${requestCount}:`, {
        url: url,
        method: args[1]?.method || 'GET',
        body: args[1]?.body ? JSON.parse(args[1]?.body) : null
      });
    }
    return originalFetch.apply(this, args);
  };
  
  // Test 3: Test symbol filter
  console.log('\n🧪 [SIMPLE_FILTER_TEST] Test 3: Testing symbol filter...');
  
  if (symbolInput) {
    const initialRequestCount = requestCount;
    
    // Type in symbol field
    symbolInput.value = 'AAPL';
    symbolInput.dispatchEvent(new Event('input', { bubbles: true }));
    symbolInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('📝 [SIMPLE_FILTER_TEST] Typed "AAPL" in symbol field');
    
    // Wait for debounced call (300ms as per code)
    setTimeout(() => {
      if (requestCount > initialRequestCount) {
        console.log('✅ [SIMPLE_FILTER_TEST] Symbol filter triggered API call');
      } else {
        console.error('❌ [SIMPLE_FILTER_TEST] Symbol filter did NOT trigger API call');
      }
    }, 500);
  }
  
  // Test 4: Test market filter
  console.log('\n🧪 [SIMPLE_FILTER_TEST] Test 4: Testing market filter...');
  
  setTimeout(() => {
    if (marketSelect) {
      const initialRequestCount = requestCount;
      
      // Change market selection
      marketSelect.value = 'stock';
      marketSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('📝 [SIMPLE_FILTER_TEST] Changed market to "stock"');
      
      // Wait for debounced call
      setTimeout(() => {
        if (requestCount > initialRequestCount) {
          console.log('✅ [SIMPLE_FILTER_TEST] Market filter triggered API call');
        } else {
          console.error('❌ [SIMPLE_FILTER_TEST] Market filter did NOT trigger API call');
        }
      }, 500);
    }
  }, 1000);
  
  // Test 5: Test clear filters
  console.log('\n🧪 [SIMPLE_FILTER_TEST] Test 5: Testing clear filters...');
  
  setTimeout(() => {
    if (clearButton) {
      const initialRequestCount = requestCount;
      
      clearButton.click();
      console.log('📝 [SIMPLE_FILTER_TEST] Clicked clear filters button');
      
      // Wait for debounced call
      setTimeout(() => {
        if (requestCount > initialRequestCount) {
          console.log('✅ [SIMPLE_FILTER_TEST] Clear filters triggered API call');
        } else {
          console.error('❌ [SIMPLE_FILTER_TEST] Clear filters did NOT trigger API call');
        }
        
        // Final summary
        console.log('\n📋 [SIMPLE_FILTER_TEST] Final Summary:');
        console.log(`📊 [SIMPLE_FILTER_TEST] Total trades requests made: ${requestCount}`);
        
        if (requestCount === 0) {
          console.error('❌ [SIMPLE_FILTER_TEST] CRITICAL: No API requests were made during filtering');
        } else {
          console.log('✅ [SIMPLE_FILTER_TEST] API requests were made during filtering');
        }
        
        // Restore original fetch
        window.fetch = originalFetch;
        
      }, 500);
    }
  }, 2000);
  
  // Test 6: Check for React state issues
  console.log('\n🧪 [SIMPLE_FILTER_TEST] Test 6: Checking for common issues...');
  
  // Check for useEffect dependency issues
  setTimeout(() => {
    console.log('🔬 [SIMPLE_FILTER_TEST] Looking for useEffect dependency issues...');
    
    // Check if filters are being updated in state
    const currentFilters = {
      symbol: symbolInput?.value || 'NOT_FOUND',
      market: marketSelect?.value || 'NOT_FOUND',
      dateFrom: dateFromInput?.value || 'NOT_FOUND',
      dateTo: dateToInput?.value || 'NOT_FOUND'
    };
    
    console.log('📊 [SIMPLE_FILTER_TEST] Current filter values:', currentFilters);
    
    // Check for any obvious issues
    if (currentFilters.symbol === 'NOT_FOUND') {
      console.error('❌ [SIMPLE_FILTER_TEST] Symbol input not accessible');
    }
    if (currentFilters.market === 'NOT_FOUND') {
      console.error('❌ [SIMPLE_FILTER_TEST] Market select not accessible');
    }
    
  }, 3000);
}

console.log('⏱️ [SIMPLE_FILTER_TEST] Test will complete in ~3 seconds. Watch console for results...');