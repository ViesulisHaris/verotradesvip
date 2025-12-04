// Debug script to investigate why total P&L and WinRate statistics are not displaying
console.log('🔍 [STATISTICS_DEBUG] Starting investigation of missing statistics display');

// Function to check if statistics are being fetched correctly
async function checkStatisticsFetching() {
  try {
    console.log('🔍 [STATISTICS_DEBUG] Checking statistics fetching...');
    
    // Check if we can access the trades page
    const tradesPage = document.querySelector('body');
    if (!tradesPage) {
      console.error('🔍 [STATISTICS_DEBUG] Could not find trades page element');
      return;
    }
    
    // Look for statistics elements
    const statsElements = document.querySelectorAll('.metric-value');
    console.log('🔍 [STATISTICS_DEBUG] Found statistics elements:', statsElements.length);
    
    statsElements.forEach((element, index) => {
      console.log(`🔍 [STATISTICS_DEBUG] Stats element ${index}:`, {
        text: element.textContent,
        classes: element.className,
        parent: element.parentElement?.className,
        visible: element.offsetParent !== null
      });
    });
    
    // Check for the specific Total P&L and Win Rate elements
    const totalPnL = Array.from(statsElements).find(el => 
      el.parentElement?.textContent?.includes('Total P&L')
    );
    const winRate = Array.from(statsElements).find(el => 
      el.parentElement?.textContent?.includes('Win Rate')
    );
    
    console.log('🔍 [STATISTICS_DEBUG] Total P&L element:', {
      found: !!totalPnL,
      text: totalPnL?.textContent,
      visible: totalPnL?.offsetParent !== null
    });
    
    console.log('🔍 [STATISTICS_DEBUG] Win Rate element:', {
      found: !!winRate,
      text: winRate?.textContent,
      visible: winRate?.offsetParent !== null
    });
    
    // Check if the statistics container is visible
    const statsContainer = document.querySelector('.key-metrics-grid');
    console.log('🔍 [STATISTICS_DEBUG] Statistics container:', {
      found: !!statsContainer,
      visible: statsContainer?.offsetParent !== null,
      display: window.getComputedStyle(statsContainer || document.body).display
    });
    
    // Check for any error messages
    const errorElements = document.querySelectorAll('[class*="error"]');
    console.log('🔍 [STATISTICS_DEBUG] Error elements found:', errorElements.length);
    errorElements.forEach((el, index) => {
      console.log(`🔍 [STATISTICS_DEBUG] Error ${index}:`, el.textContent);
    });
    
    // Check if there are trades loaded
    const trades = document.querySelectorAll('[data-testid*="trade"], .dashboard-card');
    console.log('🔍 [STATISTICS_DEBUG] Trade elements found:', trades.length);
    
    // Check for loading indicators
    const loadingElements = document.querySelectorAll('.animate-spin, [class*="loading"]');
    console.log('🔍 [STATISTICS_DEBUG] Loading elements found:', loadingElements.length);
    
    // Check console for any errors
    console.log('🔍 [STATISTICS_DEBUG] Checking for console errors...');
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Wait a moment to catch any errors
    setTimeout(() => {
      console.error = originalError;
      console.log('🔍 [STATISTICS_DEBUG] Console errors captured:', errors);
      
      if (errors.length > 0) {
        console.log('🔍 [STATISTICS_DEBUG] Found console errors that might be affecting statistics:');
        errors.forEach((error, index) => {
          console.log(`🔍 [STATISTICS_DEBUG] Error ${index}:`, error);
        });
      }
    }, 1000);
    
  } catch (error) {
    console.error('🔍 [STATISTICS_DEBUG] Error during statistics check:', error);
  }
}

// Function to check if the statistics are being calculated in the backend
async function checkStatisticsCalculation() {
  try {
    console.log('🔍 [STATISTICS_DEBUG] Checking statistics calculation...');
    
    // Check if there are any network requests for statistics
    const originalFetch = window.fetch;
    const fetchCalls = [];
    
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('trades')) {
        fetchCalls.push({
          url,
          method: args[1]?.method || 'GET',
          timestamp: new Date().toISOString()
        });
      }
      return originalFetch.apply(window, args);
    };
    
    // Wait for network activity
    setTimeout(() => {
      window.fetch = originalFetch;
      console.log('🔍 [STATISTICS_DEBUG] Fetch calls for trades:', fetchCalls);
      
      // Check if statistics are being requested
      const statsCalls = fetchCalls.filter(call => 
        call.url.includes('statistics') || call.url.includes('stats')
      );
      console.log('🔍 [STATISTICS_DEBUG] Statistics fetch calls:', statsCalls);
    }, 2000);
    
  } catch (error) {
    console.error('🔍 [STATISTICS_DEBUG] Error during statistics calculation check:', error);
  }
}

// Function to check the React component state
function checkReactComponentState() {
  try {
    console.log('🔍 [STATISTICS_DEBUG] Checking React component state...');
    
    // Look for React component instances
    const reactRoot = document.querySelector('[data-reactroot]');
    if (reactRoot) {
      console.log('🔍 [STATISTICS_DEBUG] Found React root element');
    }
    
    // Check for any React devtools data
    const reactElements = document.querySelectorAll('[data-react-checksum]');
    console.log('🔍 [STATISTICS_DEBUG] React elements found:', reactElements.length);
    
    // Try to access component state through React DevTools global
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔍 [STATISTICS_DEBUG] React DevTools detected');
      const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      console.log('🔍 [STATISTICS_DEBUG] React DevTools state:', reactDevTools);
    }
    
  } catch (error) {
    console.error('🔍 [STATISTICS_DEBUG] Error during React state check:', error);
  }
}

// Main investigation function
async function investigateStatisticsIssue() {
  console.log('🔍 [STATISTICS_DEBUG] Starting comprehensive investigation...');
  
  // Wait for page to load
  if (document.readyState !== 'complete') {
    await new Promise(resolve => {
      window.addEventListener('load', resolve);
    });
  }
  
  // Run all checks
  await checkStatisticsFetching();
  await checkStatisticsCalculation();
  checkReactComponentState();
  
  console.log('🔍 [STATISTICS_DEBUG] Investigation completed');
  console.log('🔍 [STATISTICS_DEBUG] If statistics are still not showing, check:');
  console.log('1. Are there any trades in the database?');
  console.log('2. Are the statistics being fetched from the API?');
  console.log('3. Are the statistics elements being rendered in the DOM?');
  console.log('4. Are there any CSS styles hiding the statistics?');
  console.log('5. Are there any JavaScript errors preventing rendering?');
}

// Auto-run the investigation
investigateStatisticsIssue();

// Also provide a manual check function
window.checkStatistics = investigateStatisticsIssue;
console.log('🔍 [STATISTICS_DEBUG] Manual check function available: window.checkStatistics()');