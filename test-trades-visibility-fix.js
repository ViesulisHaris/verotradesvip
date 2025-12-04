// Test script to verify trades table visibility fixes
console.log('🔍 [TRADES_VISIBILITY_TEST] Testing trades visibility fixes...');

// Test function to check if trades are visible
function testTradesVisibility() {
  console.log('\n=== TESTING TRADES VISIBILITY ===');
  
  // Check if we're on the trades page
  const currentPath = window.location.pathname;
  console.log('📍 Current path:', currentPath);
  
  if (!currentPath.includes('/trades')) {
    console.log('ℹ️ Not on trades page. Please navigate to /trades to test visibility fixes.');
    return false;
  }
  
  // Test 1: Check if scroll-item elements are visible
  console.log('\n--- Test 1: Scroll Item Visibility ---');
  const scrollItems = document.querySelectorAll('.scroll-item');
  console.log(`Found ${scrollItems.length} scroll-item elements`);
  
  let visibleScrollItems = 0;
  scrollItems.forEach((item, index) => {
    const styles = window.getComputedStyle(item);
    const isVisible = styles.opacity !== '0' && styles.display !== 'none' && styles.visibility !== 'hidden';
    
    if (isVisible) {
      visibleScrollItems++;
      console.log(`✅ Scroll item ${index + 1}: VISIBLE (opacity: ${styles.opacity}, display: ${styles.display})`);
    } else {
      console.log(`❌ Scroll item ${index + 1}: INVISIBLE (opacity: ${styles.opacity}, display: ${styles.display}, visibility: ${styles.visibility})`);
    }
  });
  
  console.log(`Scroll items visible: ${visibleScrollItems}/${scrollItems.length}`);
  
  // Test 2: Check flashlight effect z-index
  console.log('\n--- Test 2: Flashlight Effect Z-Index ---');
  const flashlightBg = document.querySelectorAll('.flashlight-bg');
  const flashlightBorder = document.querySelectorAll('.flashlight-border');
  
  console.log(`Found ${flashlightBg.length} flashlight-bg elements`);
  flashlightBg.forEach((el, index) => {
    const zIndex = window.getComputedStyle(el).zIndex;
    const opacity = window.getComputedStyle(el).opacity;
    console.log(`Flashlight BG ${index + 1}: z-index=${zIndex}, opacity=${opacity}`);
  });
  
  console.log(`Found ${flashlightBorder.length} flashlight-border elements`);
  flashlightBorder.forEach((el, index) => {
    const zIndex = window.getComputedStyle(el).zIndex;
    const opacity = window.getComputedStyle(el).opacity;
    console.log(`Flashlight Border ${index + 1}: z-index=${zIndex}, opacity=${opacity}`);
  });
  
  // Test 3: Check trade row containers
  console.log('\n--- Test 3: Trade Row Containers ---');
  const tradeContainers = document.querySelectorAll('.flashlight-container.rounded-lg.overflow-hidden');
  console.log(`Found ${tradeContainers.length} trade container elements`);
  
  let visibleTradeContainers = 0;
  tradeContainers.forEach((container, index) => {
    const styles = window.getComputedStyle(container);
    const zIndex = styles.zIndex;
    const isVisible = styles.opacity !== '0' && styles.display !== 'none' && styles.visibility !== 'hidden';
    
    if (isVisible) {
      visibleTradeContainers++;
      console.log(`✅ Trade container ${index + 1}: VISIBLE (z-index: ${zIndex}, opacity: ${styles.opacity})`);
    } else {
      console.log(`❌ Trade container ${index + 1}: INVISIBLE (z-index: ${zIndex}, opacity: ${styles.opacity})`);
    }
  });
  
  console.log(`Trade containers visible: ${visibleTradeContainers}/${tradeContainers.length}`);
  
  // Test 4: Check text contrast
  console.log('\n--- Test 4: Text Contrast ---');
  const gray300Text = document.querySelectorAll('.text-gray-300');
  const gray400Text = document.querySelectorAll('.text-gray-400');
  
  console.log(`Found ${gray300Text.length} text-gray-300 elements`);
  if (gray300Text.length > 0) {
    const color = window.getComputedStyle(gray300Text[0]).color;
    console.log(`text-gray-300 color: ${color}`);
  }
  
  console.log(`Found ${gray400Text.length} text-gray-400 elements`);
  if (gray400Text.length > 0) {
    const color = window.getComputedStyle(gray400Text[0]).color;
    console.log(`text-gray-400 color: ${color}`);
  }
  
  // Test 5: Check overall trades container
  console.log('\n--- Test 5: Overall Trades Container ---');
  const tradesContainer = document.querySelector('.space-y-3.mt-4.min-h-\\[200px\\]');
  if (tradesContainer) {
    const styles = window.getComputedStyle(tradesContainer);
    const isVisible = styles.opacity !== '0' && styles.display !== 'none' && styles.visibility !== 'hidden';
    console.log(`Trades container: ${isVisible ? 'VISIBLE' : 'INVISIBLE'} (opacity: ${styles.opacity}, z-index: ${styles.zIndex})`);
  } else {
    console.log('Trades container not found');
  }
  
  // Overall result
  console.log('\n=== OVERALL RESULT ===');
  const allScrollItemsVisible = visibleScrollItems === scrollItems.length && scrollItems.length > 0;
  const allTradeContainersVisible = visibleTradeContainers === tradeContainers.length && tradeContainers.length > 0;
  
  if (allScrollItemsVisible && allTradeContainersVisible) {
    console.log('✅ SUCCESS: Trades visibility fixes are working!');
    return true;
  } else {
    console.log('❌ FAILURE: Some trades visibility issues remain');
    return false;
  }
}

// Function to apply emergency fixes if needed
function applyEmergencyFixes() {
  console.log('\n=== APPLYING EMERGENCY FIXES ===');
  
  // Force all scroll items to be visible
  document.querySelectorAll('.scroll-item').forEach(el => {
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('filter', 'blur(0px)', 'important');
    el.style.setProperty('transform', 'translateY(0)', 'important');
  });
  
  // Fix flashlight effects
  document.querySelectorAll('.flashlight-bg').forEach(el => {
    el.style.setProperty('z-index', '1', 'important');
    el.style.setProperty('opacity', '0', 'important');
  });
  
  document.querySelectorAll('.flashlight-border').forEach(el => {
    el.style.setProperty('z-index', '5', 'important');
    el.style.setProperty('opacity', '0', 'important');
  });
  
  // Fix trade containers
  document.querySelectorAll('.flashlight-container.rounded-lg').forEach(el => {
    el.style.setProperty('z-index', '15', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
  });
  
  // Fix text contrast
  document.querySelectorAll('.text-gray-300').forEach(el => {
    el.style.setProperty('color', '#d1d5db', 'important');
  });
  
  document.querySelectorAll('.text-gray-400').forEach(el => {
    el.style.setProperty('color', '#9ca3af', 'important');
  });
  
  console.log('Emergency fixes applied');
}

// Main test function
function runTest() {
  console.log('🚀 Starting trades visibility test...');
  
  // Wait a bit for page to load
  setTimeout(() => {
    const isWorking = testTradesVisibility();
    
    if (!isWorking) {
      console.log('\n⚠️ Fixes not working, applying emergency fixes...');
      applyEmergencyFixes();
      
      // Test again after emergency fixes
      setTimeout(() => {
        console.log('\n--- TESTING AFTER EMERGENCY FIXES ---');
        testTradesVisibility();
      }, 1000);
    }
  }, 2000);
}

// Auto-run test
if (typeof window !== 'undefined') {
  // Make functions available globally
  window.testTradesVisibility = testTradesVisibility;
  window.applyEmergencyFixes = applyEmergencyFixes;
  window.runTradesVisibilityTest = runTest;
  
  // Run test automatically
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTest);
  } else {
    runTest();
  }
  
  console.log('✅ Test script loaded. Use testTradesVisibility() to test manually or applyEmergencyFixes() for emergency fixes.');
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTradesVisibility,
    applyEmergencyFixes,
    runTest
  };
}