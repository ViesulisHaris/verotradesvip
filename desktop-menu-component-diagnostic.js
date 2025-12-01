const { chromium } = require('playwright');

(async () => {
  console.log('🔍 [DEBUG] Starting Desktop Menu Component Diagnostic Test');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Desktop-Browser-Component-Test/1.0'
  });
  
  const page = await context.newPage();
  
  // Enable console log capture
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    // Navigate to login page to test ZoomAwareLayout component
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');
    
    // Test 1: Monitor ZoomAwareLayout component re-renders
    console.log('🔄 Testing ZoomAwareLayout re-renders...');
    
    let zoomLayoutRenderCount = 0;
    
    // Capture console logs to count re-renders
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ZoomAwareLayout rendered')) {
        zoomLayoutRenderCount++;
        console.log(`  🔄 ZoomAwareLayout render #${zoomLayoutRenderCount}`);
      }
    });
    
    // Simulate zoom changes by resizing viewport
    const viewports = [
      { width: 1280, height: 720 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 800, height: 600 },
      { width: 1920, height: 1080 }
    ];
    
    for (let i = 0; i < viewports.length; i++) {
      const vp = viewports[i];
      console.log(`  Changing viewport to ${vp.width}x${vp.height}...`);
      
      await page.setViewportSize(vp);
      await page.waitForTimeout(1000); // Wait for zoom detection to update
      
      // Trigger a resize event
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await page.waitForTimeout(1000); // Wait for component to re-render
    }
    
    console.log(`📊 ZoomAwareLayout render count: ${zoomLayoutRenderCount}`);
    
    // Test 2: Check for excessive CSS calculations
    console.log('🎨 Testing CSS calculations...');
    
    const cssCalculations = await page.evaluate(() => {
      let calculations = 0;
      
      // Override getComputedStyle to count calls
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function(element, pseudoElt) {
        calculations++;
        return originalGetComputedStyle.call(this, element, pseudoElt);
      };
      
      // Trigger some style recalculations
      window.dispatchEvent(new Event('resize'));
      
      // Wait a bit for any pending calculations
      return new Promise(resolve => {
        setTimeout(() => {
          window.getComputedStyle = originalGetComputedStyle;
          resolve(calculations);
        }, 1000);
      });
    });
    
    console.log(`  CSS calculations detected: ${cssCalculations}`);
    
    // Test 3: Check for memory leaks during viewport changes
    console.log('🧠 Testing memory during viewport changes...');
    
    const memoryBefore = await page.evaluate(() => {
      if (performance && performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryBefore) {
      console.log(`  Memory before: ${Math.round(memoryBefore.used / 1024 / 1024)}MB`);
      
      // Perform more viewport changes
      for (let i = 0; i < 10; i++) {
        const width = 800 + (i * 100);
        const height = 600 + (i * 50);
        
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(500);
        
        // Trigger resize event
        await page.evaluate(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }
      
      const memoryAfter = await page.evaluate(() => {
        if (performance && performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (memoryAfter) {
        const memoryIncrease = memoryAfter.used - memoryBefore.used;
        const memoryIncreaseMB = Math.round(memoryIncrease / 1024 / 1024);
        console.log(`  Memory after: ${Math.round(memoryAfter.used / 1024 / 1024)}MB`);
        console.log(`  Memory increase: ${memoryIncreaseMB}MB`);
        
        if (memoryIncreaseMB > 10) {
          console.log(`  ⚠️  Potential memory leak during viewport changes: ${memoryIncreaseMB}MB increase`);
        }
      }
    }
    
    // Test 4: Check zoom detection accuracy
    console.log('🔍 Testing zoom detection accuracy...');
    
    const zoomInfo = await page.evaluate(() => {
      if (typeof window !== 'undefined' && window.__zoomInfo) {
        return window.__zoomInfo;
      }
      return null;
    });
    
    if (zoomInfo) {
      console.log(`  Current zoom info:`, zoomInfo);
    } else {
      console.log(`  ❌ Zoom info not available in window object`);
    }
    
    // Test 5: Check for event listener leaks
    console.log('🔌 Testing for event listener leaks...');
    
    const eventListenerTest = await page.evaluate(() => {
      // Count event listeners on window
      const listeners = [];
      
      // Try to detect if there are excessive resize listeners
      const originalAddEventListener = window.addEventListener;
      let addEventListenerCount = 0;
      
      window.addEventListener = function(type, listener, options) {
        if (type === 'resize') {
          addEventListenerCount++;
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      // Trigger some events
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('zoom'));
      
      // Restore original
      window.addEventListener = originalAddEventListener;
      
      return {
        resizeListenersAdded: addEventListenerCount,
        hasVisualViewport: !!window.visualViewport
      };
    });
    
    console.log(`  Event listener test:`, eventListenerTest);
    
    // Test 6: Check for style recalculation issues
    console.log('📐 Testing style recalculation issues...');
    
    const styleRecalcTest = await page.evaluate(() => {
      // Force multiple style recalculations
      const body = document.body;
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        // Change a style property that forces recalculation
        body.style.display = i % 2 === 0 ? 'block' : 'flex';
        // Force layout recalculation
        body.offsetHeight;
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Reset style
      body.style.display = '';
      
      return {
        duration: Math.round(duration),
        averageTime: Math.round(duration / 100)
      };
    });
    
    console.log(`  Style recalculation test:`, styleRecalcTest);
    
    if (styleRecalcTest.averageTime > 1) {
      console.log(`  ⚠️  Slow style recalculation detected: ${styleRecalcTest.averageTime}ms average`);
    }
    
    // Test 7: Check for layout thrashing
    console.log('📊 Testing for layout thrashing...');
    
    const layoutThrashTest = await page.evaluate(() => {
      const body = document.body;
      const measurements = [];
      
      for (let i = 0; i < 50; i++) {
        // Force layout measurement
        const start = performance.now();
        
        // Read layout properties
        const width = body.offsetWidth;
        const height = body.offsetHeight;
        
        // Write layout properties
        body.style.marginLeft = i % 2 === 0 ? '1px' : '2px';
        
        // Force layout recalculation
        body.offsetHeight;
        
        const end = performance.now();
        measurements.push(end - start);
      }
      
      // Reset style
      body.style.marginLeft = '';
      
      const totalTime = measurements.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / measurements.length;
      const maxTime = Math.max(...measurements);
      
      return {
        totalTime: Math.round(totalTime),
        averageTime: Math.round(averageTime * 1000) / 1000,
        maxTime: Math.round(maxTime * 1000) / 1000
      };
    });
    
    console.log(`  Layout thrashing test:`, layoutThrashTest);
    
    if (layoutThrashTest.averageTime > 2) {
      console.log(`  ⚠️  Layout thrashing detected: ${layoutThrashTest.averageTime}ms average`);
    }
    
    // Final summary
    console.log('📋 Summary of desktop menu component diagnostic test:');
    console.log('==============================================');
    console.log(`✅ ZoomAwareLayout render count: ${zoomLayoutRenderCount}`);
    console.log(`✅ CSS calculations test completed: ${cssCalculations} calculations`);
    console.log(`✅ Memory leak test completed`);
    console.log(`✅ Zoom detection accuracy test completed`);
    console.log(`✅ Event listener leak test completed`);
    console.log(`✅ Style recalculation test completed: ${styleRecalcTest.averageTime}ms average`);
    console.log(`✅ Layout thrashing test completed: ${layoutThrashTest.averageTime}ms average`);
    
    // Identify potential issues
    const issues = [];
    
    if (zoomLayoutRenderCount > 20) {
      issues.push(`High number of ZoomAwareLayout re-renders: ${zoomLayoutRenderCount}`);
    }
    
    if (cssCalculations > 1000) {
      issues.push(`Excessive CSS calculations: ${cssCalculations}`);
    }
    
    if (styleRecalcTest.averageTime > 2) {
      issues.push(`Slow style recalculation: ${styleRecalcTest.averageTime}ms average`);
    }
    
    if (layoutThrashTest.averageTime > 2) {
      issues.push(`Layout thrashing detected: ${layoutThrashTest.averageTime}ms average`);
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Potential issues detected:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ No significant issues detected');
    }
    
    console.log('🔍 [DEBUG] Desktop Menu Component Diagnostic Test Complete');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
})();