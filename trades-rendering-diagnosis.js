// TRADES RENDERING DIAGNOSIS SCRIPT
// This script will help identify why trades are not displaying despite being fetched

console.log('🔍 [TRADES_RENDERING_DIAGNOSIS] Starting diagnosis...');

// 1. Check if the trades array is being populated correctly
function checkTradesDataFlow() {
  console.log('🔍 [DATA_FLOW] Checking trades data flow...');
  
  // Check if trades state is being set
  const tradesElement = document.querySelector('[data-trades-count]');
  if (tradesElement) {
    const tradesCount = tradesElement.getAttribute('data-trades-count');
    console.log('🔍 [DATA_FLOW] Trades count from debug info:', tradesCount);
  }
  
  // Check the actual trades array in React state
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    console.log('🔍 [DATA_FLOW] React root found');
  }
}

// 2. Check conditional rendering logic
function checkConditionalRendering() {
  console.log('🔍 [CONDITIONAL_RENDERING] Checking conditional rendering logic...');
  
  // Check if the "No trades" message is showing when it shouldn't
  const noTradesMessage = document.querySelector('text:contains("No trades yet")');
  if (noTradesMessage) {
    console.log('🔍 [CONDITIONAL_RENDERING] "No trades" message is visible');
    console.log('🔍 [CONDITIONAL_RENDERING] This suggests the condition !pagination?.data?.length && trades.length === 0 is true');
  } else {
    console.log('🔍 [CONDITIONAL_RENDERING] "No trades" message is not visible');
  }
  
  // Check if trades rows are being rendered
  const tradeRows = document.querySelectorAll('.flashlight-container');
  console.log('🔍 [CONDITIONAL_RENDERING] Trade rows found:', tradeRows.length);
}

// 3. Check for CSS/display issues
function checkCSSDisplayIssues() {
  console.log('🔍 [CSS_DISPLAY] Checking for CSS display issues...');
  
  // Check if trades container is hidden
  const tradesContainer = document.querySelector('.space-y-3');
  if (tradesContainer) {
    const styles = window.getComputedStyle(tradesContainer);
    console.log('🔍 [CSS_DISPLAY] Trades container styles:', {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      height: styles.height
    });
  }
  
  // Check for any hidden elements
  const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
  console.log('🔍 [CSS_DISPLAY] Hidden elements found:', hiddenElements.length);
}

// 4. Check data structure mismatch
function checkDataStructure() {
  console.log('🔍 [DATA_STRUCTURE] Checking for data structure mismatches...');
  
  // Look for trade data in the debug info
  const debugInfo = document.querySelector('.bg-yellow-900\\/20');
  if (debugInfo) {
    console.log('🔍 [DATA_STRUCTURE] Debug info found');
    const debugText = debugInfo.textContent;
    console.log('🔍 [DATA_STRUCTURE] Debug info content:', debugText);
    
    // Extract specific values
    const userMatch = debugText.match(/User: (.+)/);
    const loadingMatch = debugText.match(/Loading: (.+)/);
    const tradesCountMatch = debugText.match(/Trades count: (\d+)/);
    const paginationDataMatch = debugText.match(/Pagination data: (\d+)/);
    const totalCountMatch = debugText.match(/Total count: (\d+)/);
    
    if (userMatch) console.log('🔍 [DATA_STRUCTURE] User:', userMatch[1]);
    if (loadingMatch) console.log('🔍 [DATA_STRUCTURE] Loading:', loadingMatch[1]);
    if (tradesCountMatch) console.log('🔍 [DATA_STRUCTURE] Trades count:', tradesCountMatch[1]);
    if (paginationDataMatch) console.log('🔍 [DATA_STRUCTURE] Pagination data:', paginationDataMatch[1]);
    if (totalCountMatch) console.log('🔍 [DATA_STRUCTURE] Total count:', totalCountMatch[1]);
  }
}

// 5. Check React component state
function checkReactComponentState() {
  console.log('🔍 [REACT_STATE] Checking React component state...');
  
  // Try to access React DevTools if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔍 [REACT_STATE] React DevTools available');
    // Try to get component state
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactRootContainer) {
      console.log('🔍 [REACT_STATE] React root container found');
    }
  } else {
    console.log('🔍 [REACT_STATE] React DevTools not available');
  }
}

// 6. Check for JavaScript errors
function checkForErrors() {
  console.log('🔍 [ERROR_CHECK] Checking for JavaScript errors...');
  
  // Check console errors
  if (console.error) {
    console.log('🔍 [ERROR_CHECK] Console error function available');
  }
  
  // Check for any error elements
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log('🔍 [ERROR_CHECK] Error elements found:', errorElements.length);
}

// Main diagnosis function
function runDiagnosis() {
  console.log('🔍 [DIAGNOSIS] Running comprehensive trades rendering diagnosis...');
  
  checkTradesDataFlow();
  checkConditionalRendering();
  checkCSSDisplayIssues();
  checkDataStructure();
  checkReactComponentState();
  checkForErrors();
  
  console.log('🔍 [DIAGNOSIS] Diagnosis complete. Check console for findings.');
}

// Run the diagnosis
runDiagnosis();

// Export for manual execution
window.tradesRenderingDiagnosis = {
  checkTradesDataFlow,
  checkConditionalRendering,
  checkCSSDisplayIssues,
  checkDataStructure,
  checkReactComponentState,
  checkForErrors,
  runDiagnosis
};

console.log('🔍 [TRADES_RENDERING_DIAGNOSIS] Diagnosis functions exported to window.tradesRenderingDiagnosis');