/**
 * Chart Animation Synchronization Test Script
 * 
 * This script tests whether chart data elements now move in perfect sync
 * with their containers during sidebar transitions.
 * 
 * Usage: Run this script in browser console while on dashboard page
 * Then toggle the sidebar to observe timing synchronization
 */

console.log('🧪 [CHART SYNC TEST] Starting chart animation synchronization test...');
console.log('🧪 [CHART SYNC TEST] Instructions:');
console.log('🧪 [CHART SYNC TEST] 1. Go to dashboard page');
console.log('🧪 [CHART SYNC TEST] 2. Open browser console');
console.log('🧪 [CHART SYNC TEST] 3. Toggle sidebar (click collapse/expand button)');
console.log('🧪 [CHART SYNC TEST] 4. Observe console logs for timing data');
console.log('🧪 [CHART SYNC TEST] 5. Look for "SYNC FIX" logs indicating immediate response');

// Test data collection
let testResults = {
  sidebarToggleStart: null,
  sidebarToggleEnd: null,
  chartAnimationStart: null,
  chartAnimationEnd: null,
  containerResize: null,
  syncScore: null
};

// Monitor console logs for timing data
const originalLog = console.log;
console.log = function(...args) {
  originalLog.apply(console, args);
  
  const message = args.join(' ');
  
  // Capture sidebar container timing
  if (message.includes('[SYNC FIX] Sidebar CONTAINER toggle triggered:')) {
    const match = message.match(/containerTransitionStart: ([\d.]+)/);
    if (match) {
      testResults.sidebarToggleStart = parseFloat(match[1]);
      console.log('🧪 [TEST DATA] Captured sidebar start:', testResults.sidebarToggleStart);
    }
  }
  
  if (message.includes('[SYNC FIX] Sidebar CONTAINER transition complete:')) {
    const match = message.match(/actualDuration: ([\d.]+)/);
    if (match) {
      testResults.sidebarToggleEnd = parseFloat(match[1]);
      console.log('🧪 [TEST DATA] Captured sidebar end:', testResults.sidebarToggleEnd);
    }
  }
  
  // Capture chart data animation timing
  if (message.includes('[SYNC FIX] PnLChart DATA animation started:')) {
    const match = message.match(/animationStart: ([\d.]+)/);
    if (match) {
      testResults.chartAnimationStart = parseFloat(match[1]);
      console.log('🧪 [TEST DATA] Captured PnLChart animation start:', testResults.chartAnimationStart);
    }
  }
  
  if (message.includes('[SYNC FIX] EmotionRadar DATA animation started:')) {
    const match = message.match(/animationStart: ([\d.]+)/);
    if (match) {
      testResults.chartAnimationStart = parseFloat(match[1]);
      console.log('🧪 [TEST DATA] Captured EmotionRadar animation start:', testResults.chartAnimationStart);
    }
  }
  
  if (message.includes('[SYNC FIX] PnLChart DATA animation ended:')) {
    const match = message.match(/animationEnd: ([\d.]+)/);
    if (match) {
      testResults.chartAnimationEnd = parseFloat(match[1]);
      console.log('🧪 [TEST DATA] Captured PnLChart animation end:', testResults.chartAnimationEnd);
    }
  }
  
  if (message.includes('[SYNC FIX] EmotionRadar DATA animation ended:')) {
    const match = message.match(/animationEnd: ([\d.]+)/);
    if (match) {
      testResults.chartAnimationEnd = parseFloat(match[1]);
      console.log('🧪 [TEST DATA] Captured EmotionRadar animation end:', testResults.chartAnimationEnd);
    }
  }
  
  // Capture container resize timing
  if (message.includes('[SYNC FIX] ResponsiveContainer resized (IMMEDIATE):')) {
    const match = message.match(/timeMs: ([\d]+)/);
    if (match) {
      testResults.containerResize = parseInt(match[1]);
      console.log('🧪 [TEST DATA] Captured container resize:', testResults.containerResize);
    }
  }
  
  // Calculate sync score when we have all data
  if (testResults.sidebarToggleStart && testResults.chartAnimationStart && testResults.syncScore === null) {
    const timeDiff = Math.abs(testResults.chartAnimationStart - testResults.sidebarToggleStart);
    testResults.syncScore = timeDiff;
    
    console.log('🧪 [SYNC ANALYSIS] Timing difference between sidebar and chart animation:', timeDiff.toFixed(2) + 'ms');
    
    if (timeDiff < 50) {
      console.log('✅ [SYNC RESULT] EXCELLENT: Chart data moves WITH container (diff < 50ms)');
      console.log('✅ [SYNC RESULT] Animation lag has been ELIMINATED');
    } else if (timeDiff < 100) {
      console.log('🟡 [SYNC RESULT] GOOD: Chart data follows container quickly (diff < 100ms)');
      console.log('🟡 [SYNC RESULT] Animation lag significantly REDUCED');
    } else if (timeDiff < 200) {
      console.log('🟠 [SYNC RESULT] FAIR: Chart data lags behind container (diff < 200ms)');
      console.log('🟠 [SYNC RESULT] Animation lag still present but improved');
    } else {
      console.log('❌ [SYNC RESULT] POOR: Chart data lags significantly behind container (diff >= 200ms)');
      console.log('❌ [SYNC RESULT] Animation lag NOT fixed');
    }
    
    // Additional analysis
    console.log('🧪 [DETAILED ANALYSIS]');
    console.log('   Sidebar transition start:', testResults.sidebarToggleStart);
    console.log('   Chart animation start:', testResults.chartAnimationStart);
    console.log('   Time difference:', timeDiff.toFixed(2) + 'ms');
    console.log('   Expected difference: < 50ms for perfect sync');
    
    // Check for immediate resize response
    if (testResults.containerResize) {
      const resizeDelay = testResults.containerResize - testResults.sidebarToggleStart;
      console.log('   Container resize delay:', resizeDelay + 'ms');
      
      if (resizeDelay < 100) {
        console.log('   ✅ ResponsiveContainer responds immediately');
      } else {
        console.log('   ❌ ResponsiveContainer still has delay');
      }
    }
  }
};

// Test instructions
console.log('🧪 [CHART SYNC TEST] Test script loaded and monitoring console logs...');
console.log('🧪 [CHART SYNC TEST] Ready to measure synchronization!');
console.log('🧪 [CHART SYNC TEST] Toggle sidebar now to see results...');

// Auto-test function for programmatic testing
window.runChartSyncTest = function() {
  console.log('🧪 [AUTO TEST] Running automated chart sync test...');
  
  // Find sidebar toggle button
  const toggleButton = document.querySelector('button[title*="sidebar"], button[title*="Expand"], button[title*="Collapse"]');
  
  if (toggleButton) {
    console.log('🧪 [AUTO TEST] Found sidebar toggle button, clicking...');
    toggleButton.click();
    
    // Wait for animations to complete
    setTimeout(() => {
      console.log('🧪 [AUTO TEST] Test complete. Check results above.');
      
      // Reset for next test
      setTimeout(() => {
        testResults = {
          sidebarToggleStart: null,
          sidebarToggleEnd: null,
          chartAnimationStart: null,
          chartAnimationEnd: null,
          containerResize: null,
          syncScore: null
        };
        console.log('🧪 [AUTO TEST] Test data reset. Ready for next test.');
      }, 1000);
    }, 1000);
  } else {
    console.log('❌ [AUTO TEST] Could not find sidebar toggle button');
  }
};

console.log('🧪 [AUTO TEST] You can also run: runChartSyncTest() for automated testing');