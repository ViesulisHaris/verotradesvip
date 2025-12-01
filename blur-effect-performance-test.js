const puppeteer = require('puppeteer');
const path = require('path');

async function testBlurEffect() {
  console.log('Starting blur effect performance test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.coverage.startCSSCoverage();
  await page.coverage.startJSCoverage();
  
  try {
    // Navigate to the application
    console.log('Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
    
    // Test 1: Check if blur effect is applied to Balatro background
    console.log('\n=== Test 1: Verifying blur effect on Balatro background ===');
    const blurEffect = await page.evaluate(() => {
      const balatroCanvas = document.querySelector('.balatro-canvas');
      if (balatroCanvas) {
        const computedStyle = window.getComputedStyle(balatroCanvas);
        return {
          filter: computedStyle.filter,
          backdropFilter: computedStyle.backdropFilter
        };
      }
      return null;
    });
    
    if (blurEffect) {
      console.log('✅ Blur effect detected:', blurEffect.filter);
      console.log('✅ Backdrop filter:', blurEffect.backdropFilter);
    } else {
      console.log('❌ Balatro canvas not found or no blur effect applied');
    }
    
    // Test 2: Check glass morphism elements
    console.log('\n=== Test 2: Verifying glass morphism elements ===');
    const glassElements = await page.evaluate(() => {
      const elements = {
        glass: document.querySelectorAll('.glass'),
        glassEnhanced: document.querySelectorAll('.glass-enhanced'),
        sidebar: document.querySelector('.sidebar-overlay'),
        cards: document.querySelectorAll('.card-stat'),
        charts: document.querySelectorAll('.chart-wrapper')
      };
      
      const results = {};
      for (const [key, elems] of Object.entries(elements)) {
        if (elems.length > 0) {
          const firstElement = elems[0];
          const computedStyle = window.getComputedStyle(firstElement);
          results[key] = {
            count: elems.length,
            backdropFilter: computedStyle.backdropFilter,
            backgroundColor: computedStyle.backgroundColor,
            border: computedStyle.border
          };
        } else {
          results[key] = { count: 0 };
        }
      }
      return results;
    });
    
    console.log('Glass morphism elements found:', glassElements);
    
    // Test 3: Performance metrics with blur effect
    console.log('\n=== Test 3: Performance metrics ===');
    
    // Measure frame rate during interactions
    const frameRates = [];
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        const duration = 2000; // 2 seconds
        
        function countFrames() {
          frameCount++;
          const currentTime = performance.now();
          if (currentTime - lastTime >= duration) {
            resolve(frameCount / (duration / 1000)); // FPS
            return;
          }
          requestAnimationFrame(countFrames);
        }
        countFrames();
      });
    }).then(fps => {
      frameRates.push(fps);
      console.log(`Average FPS: ${fps.toFixed(2)}`);
    });
    
    // Test 4: Memory usage
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      console.log(`Memory usage: ${memoryUsage.used}MB / ${memoryUsage.total}MB (limit: ${memoryUsage.limit}MB)`);
    }
    
    // Test 5: Visual interaction test
    console.log('\n=== Test 4: Visual interaction test ===');
    
    // Take a screenshot of the current state
    await page.screenshot({ 
      path: 'blur-effect-test-screenshot.png',
      fullPage: true 
    });
    console.log('✅ Screenshot saved as blur-effect-test-screenshot.png');
    
    // Test hover interactions on glass elements
    await page.evaluate(() => {
      const glassElements = document.querySelectorAll('.glass, .glass-enhanced');
      if (glassElements.length > 0) {
        const element = glassElements[0];
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        return true;
      }
      return false;
    });
    
    await page.waitForTimeout(500);
    
    // Take another screenshot during hover
    await page.screenshot({ 
      path: 'blur-effect-hover-test-screenshot.png',
      fullPage: true 
    });
    console.log('✅ Hover screenshot saved as blur-effect-hover-test-screenshot.png');
    
    // Test 6: Check for visual issues
    console.log('\n=== Test 5: Visual quality assessment ===');
    const visualIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check if glass elements are properly layered
      const glassElements = document.querySelectorAll('.glass, .glass-enhanced');
      glassElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const zIndex = parseInt(computedStyle.zIndex);
        if (zIndex < 0 && index === 0) {
          issues.push(`Glass element ${index} has negative z-index: ${zIndex}`);
        }
      });
      
      // Check if backdrop filters are causing performance issues
      const elementsWithBackdropFilter = document.querySelectorAll('*');
      let backdropFilterCount = 0;
      elementsWithBackdropFilter.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          backdropFilterCount++;
        }
      });
      
      if (backdropFilterCount > 20) {
        issues.push(`High number of backdrop filters: ${backdropFilterCount} (may impact performance)`);
      }
      
      return {
        issues,
        backdropFilterCount,
        glassElementCount: glassElements.length
      };
    });
    
    console.log('Visual assessment results:', visualIssues);
    
    // Test 7: Blur intensity assessment
    console.log('\n=== Test 6: Blur intensity assessment ===');
    const blurIntensity = await page.evaluate(() => {
      const balatroCanvas = document.querySelector('.balatro-canvas');
      if (balatroCanvas) {
        const computedStyle = window.getComputedStyle(balatroCanvas);
        const filterValue = computedStyle.filter;
        
        // Extract blur value from filter string
        const blurMatch = filterValue.match(/blur\((\d+)px\)/);
        if (blurMatch) {
          return {
            fullFilter: filterValue,
            blurValue: parseInt(blurMatch[1]),
            isOptimal: parseInt(blurMatch[1]) >= 2 && parseInt(blurMatch[1]) <= 5
          };
        }
      }
      return null;
    });
    
    if (blurIntensity) {
      console.log(`Blur intensity: ${blurIntensity.blurValue}px`);
      console.log(`Full filter value: ${blurIntensity.fullFilter}`);
      console.log(`Is optimal (2-5px): ${blurIntensity.isOptimal ? '✅' : '❌'}`);
      
      if (!blurIntensity.isOptimal) {
        if (blurIntensity.blurValue < 2) {
          console.log('💡 Recommendation: Blur is too subtle, consider increasing to 2-3px');
        } else if (blurIntensity.blurValue > 5) {
          console.log('💡 Recommendation: Blur is too strong, consider reducing to 3-4px');
        }
      }
    }
    
    // Stop coverage collection
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ]);
    
    console.log('\n=== Coverage Report ===');
    console.log(`JS files covered: ${jsCoverage.length}`);
    console.log(`CSS files covered: ${cssCoverage.length}`);
    
    // Calculate total CSS usage
    let totalCSSBytes = 0;
    let usedCSSBytes = 0;
    
    cssCoverage.forEach(entry => {
      totalCSSBytes += entry.text.length;
      entry.ranges.forEach(range => {
        usedCSSBytes += range.end - range.start - 1;
      });
    });
    
    const cssUsagePercent = ((usedCSSBytes / totalCSSBytes) * 100).toFixed(2);
    console.log(`CSS usage: ${usedCSSBytes} / ${totalCSSBytes} bytes (${cssUsagePercent}%)`);
    
    // Final assessment
    console.log('\n=== FINAL ASSESSMENT ===');
    
    let score = 0;
    let maxScore = 5;
    
    // Blur effect present (1 point)
    if (blurEffect && blurEffect.filter.includes('blur')) {
      score++;
      console.log('✅ Blur effect is properly applied');
    } else {
      console.log('❌ Blur effect not found or not working');
    }
    
    // Glass morphism elements present (1 point)
    if (glassElements.glass.count > 0 || glassElements.glassEnhanced.count > 0) {
      score++;
      console.log('✅ Glass morphism elements are present');
    } else {
      console.log('❌ No glass morphism elements found');
    }
    
    // Performance acceptable (1 point)
    if (frameRates.length > 0 && frameRates[0] > 30) {
      score++;
      console.log('✅ Performance is acceptable (>30 FPS)');
    } else {
      console.log('❌ Performance may be an issue');
    }
    
    // No major visual issues (1 point)
    if (visualIssues.issues.length === 0) {
      score++;
      console.log('✅ No major visual issues detected');
    } else {
      console.log(`❌ Visual issues found: ${visualIssues.issues.join(', ')}`);
    }
    
    // Blur intensity optimal (1 point)
    if (blurIntensity && blurIntensity.isOptimal) {
      score++;
      console.log('✅ Blur intensity is optimal');
    } else {
      console.log('❌ Blur intensity needs adjustment');
    }
    
    console.log(`\nOverall Score: ${score}/${maxScore}`);
    
    if (score >= 4) {
      console.log('🎉 EXCELLENT: Blur effect implementation is working well!');
    } else if (score >= 3) {
      console.log('✅ GOOD: Blur effect is mostly working with minor issues');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Blur effect implementation has significant issues');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testBlurEffect().then(() => {
  console.log('\nBlur effect performance test completed.');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});