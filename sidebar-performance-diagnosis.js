// Sidebar Performance Diagnosis Script
// Add this script to measure the actual bottlenecks during sidebar toggle

console.log('🔍 [DIAGNOSIS] Starting sidebar performance diagnosis...');

// Measure sidebar toggle performance
const originalToggle = document.querySelector('button[title*="sidebar"], button[aria-label*="menu"]');
if (originalToggle) {
  let toggleCount = 0;
  
  originalToggle.addEventListener('click', () => {
    toggleCount++;
    console.log(`🚀 [DIAGNOSIS] Sidebar toggle #${toggleCount} started`);
    const startTime = performance.now();
    
    // Monitor for excessive RAF calls
    let rafCount = 0;
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      rafCount++;
      console.log(`📊 [DIAGNOSIS] RAF call #${rafCount} during sidebar toggle`);
      return originalRAF(callback);
    };
    
    // Monitor chart re-renders
    const chartContainers = document.querySelectorAll('.chart-container-stable, .chart-container-enhanced');
    let reRenderCount = 0;
    
    const observer = new MutationObserver((mutations) => {
      reRenderCount += mutations.length;
      console.log(`🔄 [DIAGNOSIS] Chart re-render #${reRenderCount} detected`);
    });
    
    chartContainers.forEach(container => {
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    });
    
    // Reset after 5 seconds
    setTimeout(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [DIAGNOSIS] Sidebar toggle #${toggleCount} completed in ${duration.toFixed(2)}ms`);
      console.log(`📊 [DIAGNOSIS] Total RAF calls: ${rafCount}`);
      console.log(`🔄 [DIAGNOSIS] Total chart re-renders: ${reRenderCount}`);
      
      // Analyze results
      if (duration > 2000) {
        console.error('❌ [DIAGNOSIS] CRITICAL: Sidebar toggle took > 2 seconds!');
        if (rafCount > 20) {
          console.error('❌ [DIAGNOSIS] CAUSE: Excessive RAF calls detected');
        }
        if (reRenderCount > 10) {
          console.error('❌ [DIAGNOSIS] CAUSE: Excessive chart re-renders detected');
        }
      }
      
      // Restore original RAF
      window.requestAnimationFrame = originalRAF;
      observer.disconnect();
    }, 5000);
  });
  
  console.log('🔍 [DIAGNOSIS] Monitoring setup complete. Click the sidebar toggle to begin diagnosis.');
} else {
  console.error('❌ [DIAGNOSIS] Sidebar toggle button not found');
}

// Monitor localStorage operations
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === 'sidebar-collapsed') {
    console.log(`💾 [DIAGNOSIS] localStorage sidebar state update: ${value}`);
    console.trace('💾 [DIAGNOSIS] Call stack for localStorage update:');
  }
  return originalSetItem.call(this, key, value);
};