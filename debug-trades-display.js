// Debug script to check trades display issue
console.log('🔍 [TRADES_DISPLAY_DEBUG] Checking trades state...');

// Check if trades are being rendered
const tradeRows = document.querySelectorAll('.flashlight-container');
console.log('🔍 [TRADES_DISPLAY_DEBUG] Trade rows found:', tradeRows.length);

// Check the no trades message
const noTradesMessage = document.querySelector('text-center');
console.log('🔍 [TRADES_DISPLAY_DEBUG] No trades message visible:', !!noTradesMessage);

// Check pagination info
const paginationInfo = document.querySelector('.text-white.font-mono');
console.log('🔍 [TRADES_DISPLAY_DEBUG] Pagination info:', paginationInfo?.textContent);

// Check loading state
const loadingIndicators = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
console.log('🔍 [TRADES_DISPLAY_DEBUG] Loading indicators:', loadingIndicators.length);

// Check if we can access the trades data from React dev tools
setTimeout(() => {
  // Try to find React component state
  const reactRoot = document.querySelector('#__next');
  console.log('🔍 [TRADES_DISPLAY_DEBUG] React root found:', !!reactRoot);
  
  // Look for any error messages
  const errorMessages = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log('🔍 [TRADES_DISPLAY_DEBUG] Error messages:', errorMessages.length);
  
  // Check if there are any trade-related console errors
  console.log('🔍 [TRADES_DISPLAY_DEBUG] Console errors in last 5 seconds:');
}, 2000);