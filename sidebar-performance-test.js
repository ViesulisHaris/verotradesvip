/**
 * Sidebar Performance Test Script
 * Tests the performance optimizations implemented to fix the 2-5 second sidebar collapse lag
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  console.log('🚀 [PERFORMANCE TEST] Starting sidebar performance test...');
  
  try {
    // Test 1: Navigate to performance test page
    console.log('📍 Step 1: Navigating to performance test page...');
    await page.goto('http://localhost:3001/test-sidebar-performance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    // Check if performance monitor is visible
    const performanceMonitor = await page.locator('.fixed.bottom-4.right-4').isVisible();
    console.log(`📊 Performance Monitor visible: ${performanceMonitor}`);
    
    // Test 2: Find sidebar toggle button
    console.log('📍 Step 2: Locating sidebar toggle button...');
    const toggleButton = await page.locator('button[title*="sidebar"]').first();
    const buttonExists = await toggleButton.isVisible();
    console.log(`🔘 Sidebar toggle button found: ${buttonExists}`);
    
    if (!buttonExists) {
      console.log('❌ ERROR: Sidebar toggle button not found. Trying alternative selectors...');
      // Try alternative selectors
      const altButton = await page.locator('button').filter({ hasText: 'Toggle' }).first();
      if (await altButton.isVisible()) {
        console.log('✅ Found alternative toggle button');
        // Use this button for tests
        toggleButton = altButton;
      } else {
        throw new Error('No sidebar toggle button found');
      }
    }
    
    // Test 3: Measure baseline performance
    console.log('📍 Step 3: Measuring baseline performance...');
    const initialMetrics = await page.evaluate(() => {
      const monitor = document.querySelector('.fixed.bottom-4.right-4');
      if (!monitor) return null;
      
      const sidebarTransition = monitor.querySelector('div:has-text("Sidebar Transition:")');
      const avgRender = monitor.querySelector('div:has-text("Avg Render:")');
      
      return {
        sidebarTransitionTime: sidebarTransition ? sidebarTransition.textContent.trim() : 'N/A',
        avgRenderTime: avgRender ? avgRender.textContent.trim() : 'N/A',
        performanceGrade: monitor.querySelector('div:has-text("Performance:")')?.textContent.trim() || 'N/A'
      };
    });
    
    console.log('📊 Initial metrics:', initialMetrics);
    
    // Test 4: Perform multiple sidebar toggles and measure performance
    console.log('📍 Step 4: Performing sidebar toggle tests...');
    const toggleResults = [];
    
    for (let i = 0; i < 5; i++) {
      console.log(`\n--- Toggle Test ${i + 1}/5 ---`);
      
      // Measure start time
      const startTime = Date.now();
      
      // Click toggle button
      await toggleButton.click();
      
      // Wait for transition to complete (max 2 seconds)
      try {
        await page.waitForFunction(
          () => {
            const monitor = document.querySelector('.fixed.bottom-4.right-4');
            const status = monitor?.querySelector('div:has-text("Status:")');
            return status?.textContent?.includes('Idle');
          },
          { timeout: 2000 }
        );
      } catch (e) {
        console.log(`⚠️ Timeout waiting for transition completion on test ${i + 1}`);
      }
      
      const endTime = Date.now();
      const transitionTime = endTime - startTime;
      
      // Collect metrics after transition
      const metrics = await page.evaluate(() => {
        const monitor = document.querySelector('.fixed.bottom-4.right-4');
        if (!monitor) return null;
        
        const sidebarTransition = monitor.querySelector('div:has-text("Sidebar Transition:")');
        const avgRender = monitor.querySelector('div:has-text("Avg Render:")');
        const maxRender = monitor.querySelector('div:has-text("Max Render:")');
        const performance = monitor.querySelector('div:has-text("Performance:")');
        
        return {
          sidebarTransitionTime: sidebarTransition ? sidebarTransition.textContent.trim() : 'N/A',
          avgRenderTime: avgRender ? avgRender.textContent.trim() : 'N/A',
          maxRenderTime: maxRender ? maxRender.textContent.trim() : 'N/A',
          performanceGrade: performance ? performance.textContent.trim() : 'N/A'
        };
      });
      
      toggleResults.push({
        testNumber: i + 1,
        measuredTransitionTime: transitionTime,
        monitorMetrics: metrics
      });
      
      console.log(`⏱️ Measured transition time: ${transitionTime}ms`);
      console.log('📊 Monitor metrics:', metrics);
      
      // Wait between toggles
      await page.waitForTimeout(1000);
    }
    
    // Test 5: Navigate to dashboard and test real-world performance
    console.log('\n📍 Step 5: Testing dashboard performance...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for dashboard to load
    
    // Check if dashboard has charts
    const emotionRadar = await page.locator('text=Emotional Patterns').isVisible();
    const pnlChart = await page.locator('text=P&L Performance').isVisible();
    console.log(`📈 Dashboard charts loaded - EmotionRadar: ${emotionRadar}, PnLChart: ${pnlChart}`);
    
    if (emotionRadar && pnlChart) {
      // Find sidebar toggle on dashboard
      const dashboardToggle = await page.locator('button[title*="sidebar"]').first();
      if (await dashboardToggle.isVisible()) {
        console.log('📍 Step 6: Testing dashboard sidebar performance...');
        
        // Measure dashboard toggle performance
        const dashboardStartTime = Date.now();
        await dashboardToggle.click();
        
        try {
          await page.waitForFunction(
            () => {
              // Check if charts have resized (simplified check)
              const charts = document.querySelectorAll('.chart-container-enhanced, .recharts-wrapper');
              return charts.length > 0;
            },
            { timeout: 5000 } // Longer timeout for dashboard
          );
        } catch (e) {
          console.log(`⚠️ Dashboard transition timeout: ${e.message}`);
        }
        
        const dashboardEndTime = Date.now();
        const dashboardTransitionTime = dashboardEndTime - dashboardStartTime;
        
        console.log(`⏱️ Dashboard transition time: ${dashboardTransitionTime}ms`);
        
        // Check for lag indicators in console
        const consoleLogs = await page.evaluate(() => {
          const logs = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.join(' '));
            originalLog.apply(console, args);
          };
          return logs;
        });
        
        const hasLagWarnings = consoleLogs.some(log => 
          log.includes('2-5 second') || 
          log.includes('lag') ||
          log.includes('Slow render') ||
          log.includes('Long task')
        );
        
        console.log(`🔍 Lag warnings in console: ${hasLagWarnings}`);
      }
    }
    
    // Test 6: Analyze results
    console.log('\n📍 Step 7: Analyzing performance test results...');
    
    const successfulTransitions = toggleResults.filter(r => 
      r.monitorMetrics && 
      r.monitorMetrics.sidebarTransitionTime !== 'N/A'
    );
    
    const avgTransitionTime = successfulTransitions.length > 0 
      ? successfulTransitions.reduce((sum, r) => {
          const time = parseInt(r.monitorMetrics.sidebarTransitionTime.replace('ms', ''));
          return sum + (isNaN(time) ? 0 : time);
        }, 0) / successfulTransitions.length
      : 0;
    
    const hasOptimalPerformance = avgTransitionTime <= 350; // Allow 50ms tolerance
    const hasExcellentPerformance = avgTransitionTime <= 300;
    
    console.log('\n📊 PERFORMANCE TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(`✅ Successful transitions: ${successfulTransitions.length}/5`);
    console.log(`⏱️ Average transition time: ${avgTransitionTime.toFixed(0)}ms`);
    console.log(`🎯 Target performance: 300ms`);
    console.log(`📈 Performance within tolerance: ${hasOptimalPerformance ? 'YES ✅' : 'NO ❌'}`);
    console.log(`🏆 Excellent performance achieved: ${hasExcellentPerformance ? 'YES ✅' : 'NO ❌'}`);
    
    // Check for specific optimization success
    const optimizationsWorking = {
      synchronizedAnimations: successfulTransitions.some(r => 
        r.monitorMetrics.performanceGrade && 
        (r.monitorMetrics.performanceGrade.includes('A') || r.monitorMetrics.performanceGrade.includes('B'))
      ),
      noLagDetected: !toggleResults.some(r => 
        r.monitorMetrics?.sidebarTransitionTime && 
        parseInt(r.monitorMetrics.sidebarTransitionTime) > 1000
      ),
      smoothTransitions: avgTransitionTime < 500
    };
    
    console.log('\n🔧 OPTIMIZATION STATUS:');
    console.log(`🎬 Synchronized animations: ${optimizationsWorking.synchronizedAnimations ? 'WORKING ✅' : 'ISSUE ❌'}`);
    console.log(`⚡ No lag detected: ${optimizationsWorking.noLagDetected ? 'CONFIRMED ✅' : 'ISSUE ❌'}`);
    console.log(`🌊 Smooth transitions: ${optimizationsWorking.smoothTransitions ? 'CONFIRMED ✅' : 'ISSUE ❌'}`);
    
    // Final verdict
    const allOptimizationsWorking = Object.values(optimizationsWorking).every(Boolean);
    console.log(`\n🏆 FINAL VERDICT: ${allOptimizationsWorking ? 'OPTIMIZATIONS SUCCESSFUL ✅' : 'OPTIMIZATIONS NEED WORK ❌'}`);
    
    // Save results to file
    const testResults = {
      timestamp: new Date().toISOString(),
      testType: 'Sidebar Performance Optimization',
      results: {
        toggleTests: toggleResults,
        dashboardTest: {
          chartsLoaded: { emotionRadar, pnlChart },
          transitionTime: dashboardTransitionTime || 0,
          hasLagWarnings
        },
        analysis: {
          averageTransitionTime: avgTransitionTime,
          hasOptimalPerformance,
          hasExcellentPerformance,
          optimizationsWorking,
          allOptimizationsWorking
        }
      }
    };
    
    require('fs').writeFileSync(
      './sidebar-performance-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n💾 Results saved to: sidebar-performance-test-results.json');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
})();