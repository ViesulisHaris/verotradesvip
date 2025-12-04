// Focused diagnosis of the statistics display issue
console.log('🔍 [STATISTICS_DIAGNOSIS] Starting focused diagnosis of statistics display issue');

// The most likely issue is in the conditional rendering logic on line 807 of trades/page.tsx
// The statistics are only shown if: (pagination && pagination.totalCount > 0) || statistics
// This means if pagination is null/undefined AND statistics is null/undefined, nothing shows

function diagnoseStatisticsDisplay() {
  console.log('🔍 [STATISTICS_DIAGNOSIS] Checking conditional rendering logic...');
  
  // Check if we're on the trades page
  if (!window.location.pathname.includes('/trades')) {
    console.log('🔍 [STATISTICS_DIAGNOSIS] Not on trades page. Current path:', window.location.pathname);
    return;
  }
  
  // Look for the statistics container
  const statsContainer = document.querySelector('.key-metrics-grid');
  const paginationExists = !!document.querySelector('[class*="pagination"]');
  const statsElements = document.querySelectorAll('.metric-value');
  
  console.log('🔍 [STATISTICS_DIAGNOSIS] Current state:', {
    statsContainerExists: !!statsContainer,
    statsContainerVisible: statsContainer?.offsetParent !== null,
    paginationExists,
    statsElementsCount: statsElements.length,
    timestamp: new Date().toISOString()
  });
  
  // The key issue: Check the conditional rendering condition
  // From line 807: {(pagination && pagination.totalCount > 0) || statistics ? (
  
  if (!statsContainer) {
    console.log('🔍 [STATISTICS_DIAGNOSIS] ISSUE IDENTIFIED: Statistics container not rendered');
    console.log('🔍 [STATISTICS_DIAGNOSIS] This means the condition (pagination && pagination.totalCount > 0) || statistics is falsy');
    console.log('🔍 [STATISTICS_DIAGNOSIS] Most likely causes:');
    console.log('1. pagination is null/undefined');
    console.log('2. pagination.totalCount is 0 or undefined');
    console.log('3. statistics is null/undefined');
    console.log('4. Both pagination and statistics are falsy');
    
    // Check for trades to determine which case it is
    const trades = document.querySelectorAll('[class*="trade"]');
    console.log('🔍 [STATISTICS_DIAGNOSIS] Trade elements found:', trades.length);
    
    if (trades.length === 0) {
      console.log('🔍 [STATISTICS_DIAGNOSIS] LIKELY CAUSE: No trades loaded, so pagination.totalCount is 0');
      console.log('🔍 [STATISTICS_DIAGNOSIS] And statistics might also be null due to no data');
    } else {
      console.log('🔍 [STATISTICS_DIAGNOSIS] UNEXPECTED: Trades exist but statistics not showing');
      console.log('🔍 [STATISTICS_DIAGNOSIS] This suggests a data fetching or state management issue');
    }
  } else {
    console.log('🔍 [STATISTICS_DIAGNOSIS] Statistics container exists but might be hidden');
    
    // Check individual statistics
    const totalPnL = Array.from(statsElements).find(el => 
      el.parentElement?.textContent?.includes('Total P&L')
    );
    const winRate = Array.from(statsElements).find(el => 
      el.parentElement?.textContent?.includes('Win Rate')
    );
    
    console.log('🔍 [STATISTICS_DIAGNOSIS] Individual statistics:', {
      totalPnL: {
        exists: !!totalPnL,
        text: totalPnL?.textContent,
        visible: totalPnL?.offsetParent !== null
      },
      winRate: {
        exists: !!winRate,
        text: winRate?.textContent,
        visible: winRate?.offsetParent !== null
      }
    });
    
    if (!totalPnL || !winRate) {
      console.log('🔍 [STATISTICS_DIAGNOSIS] ISSUE: Individual statistics elements missing');
    } else if (totalPnL.offsetParent === null || winRate.offsetParent === null) {
      console.log('🔍 [STATISTICS_DIAGNOSIS] ISSUE: Statistics elements exist but are hidden');
    }
  }
  
  // Check for loading states
  const loadingElements = document.querySelectorAll('.animate-spin, [class*="loading"]');
  console.log('🔍 [STATISTICS_DIAGNOSIS] Loading elements:', loadingElements.length);
  
  if (loadingElements.length > 0) {
    console.log('🔍 [STATISTICS_DIAGNOSIS] ISSUE: Page still loading, statistics not yet available');
  }
  
  // Check for error states
  const errorElements = document.querySelectorAll('[class*="error"]');
  console.log('🔍 [STATISTICS_DIAGNOSIS] Error elements:', errorElements.length);
  
  if (errorElements.length > 0) {
    console.log('🔍 [STATISTICS_DIAGNOSIS] ISSUE: Error states detected');
    errorElements.forEach((el, index) => {
      console.log(`🔍 [STATISTICS_DIAGNOSIS] Error ${index}:`, el.textContent);
    });
  }
  
  console.log('🔍 [STATISTICS_DIAGNOSIS] Diagnosis completed');
}

// Function to check the React component state more directly
function checkReactState() {
  console.log('🔍 [STATISTICS_DIAGNOSIS] Checking React component state...');
  
  // Try to access the React component tree
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const reactRoot = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces?.[0];
    if (reactRoot) {
      console.log('🔍 [STATISTICS_DIAGNOSIS] React DevTools available, checking component state...');
      // This would require more complex React DevTools API usage
    }
  }
  
  // Check for any global state that might be relevant
  if (window.__STATISTICS_STATE__) {
    console.log('🔍 [STATISTICS_DIAGNOSIS] Global statistics state found:', window.__STATISTICS_STATE__);
  }
}

// Function to monitor network requests for statistics
function monitorStatisticsRequests() {
  console.log('🔍 [STATISTICS_DIAGNOSIS] Monitoring statistics network requests...');
  
  const originalFetch = window.fetch;
  const statisticsRequests = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('trades') || url.includes('statistics'))) {
      statisticsRequests.push({
        url,
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString()
      });
      
      // Log the request
      console.log('🔍 [STATISTICS_DIAGNOSIS] Trade/Statistics request:', url);
      
      // Log the response
      return originalFetch.apply(this, args).then(response => {
        console.log('🔍 [STATISTICS_DIAGNOSIS] Trade/Statistics response:', {
          url,
          status: response.status,
          ok: response.ok,
          timestamp: new Date().toISOString()
        });
        
        // Clone the response to read the body
        if (url.includes('statistics') || url.includes('trades')) {
          response.clone().json().then(data => {
            console.log('🔍 [STATISTICS_DIAGNOSIS] Response data:', {
              url,
              dataKeys: Object.keys(data || {}),
              hasData: !!data,
              timestamp: new Date().toISOString()
            });
          }).catch(err => {
            console.log('🔍 [STATISTICS_DIAGNOSIS] Error reading response body:', err);
          });
        }
        
        return response;
      }).catch(error => {
        console.log('🔍 [STATISTICS_DIAGNOSIS] Request error:', {
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Return a function to stop monitoring
  return () => {
    window.fetch = originalFetch;
    console.log('🔍 [STATISTICS_DIAGNOSIS] Monitoring stopped. Total requests:', statisticsRequests.length);
    return statisticsRequests;
  };
}

// Main diagnosis function
async function runDiagnosis() {
  console.log('🔍 [STATISTICS_DIAGNOSIS] Starting comprehensive diagnosis...');
  
  // Wait for page to load
  if (document.readyState !== 'complete') {
    await new Promise(resolve => {
      window.addEventListener('load', resolve);
    });
  }
  
  // Start monitoring network requests
  const stopMonitoring = monitorStatisticsRequests();
  
  // Wait a bit for network activity
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run the diagnosis
  diagnoseStatisticsDisplay();
  checkReactState();
  
  // Stop monitoring and get results
  const requests = stopMonitoring();
  console.log('🔍 [STATISTICS_DIAGNOSIS] Network requests captured:', requests.length);
  
  // Provide final diagnosis
  console.log('🔍 [STATISTICS_DIAGNOSIS] FINAL DIAGNOSIS:');
  console.log('Based on the analysis, the most likely issue is:');
  console.log('1. The conditional rendering logic on line 807 of trades/page.tsx');
  console.log('2. The condition (pagination && pagination.totalCount > 0) || statistics is falsy');
  console.log('3. This happens when either:');
  console.log('   - No trades are loaded (pagination.totalCount = 0)');
  console.log('   - Statistics data is not fetched (statistics = null)');
  console.log('   - Both pagination and statistics are null/undefined');
  console.log('');
  console.log('RECOMMENDED FIX:');
  console.log('Modify the conditional rendering logic to always show statistics when data is available');
  console.log('Or ensure statistics are fetched even when pagination is null');
}

// Auto-run the diagnosis
runDiagnosis();

// Make the diagnosis function available globally
window.diagnoseStatistics = runDiagnosis;
console.log('🔍 [STATISTICS_DIAGNOSIS] Manual diagnosis available: window.diagnoseStatistics()');