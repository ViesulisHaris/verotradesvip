const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotDir = './sidebar-test-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Test results storage
const testResults = {
  visualEnhancements: {},
  resizeFixes: {},
  functionality: {},
  performance: {},
  crossBrowser: {}
};

async function authenticateUser(page) {
  console.log('🔐 Authenticating user...');
  
  // Navigate to login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  
  // Fill in login credentials
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'testpassword123');
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  console.log('✅ User authenticated successfully');
  return true;
}

async function testVisualEnhancements(page, browserName, viewport) {
  console.log(`🎨 Testing Visual Enhancements - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test Glass Morphism Effect
  const sidebar = await page.locator('aside').first();
  const glassEffect = await sidebar.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      backdropFilter: styles.backdropFilter,
      backgroundColor: styles.backgroundColor,
      border: styles.border,
      boxShadow: styles.boxShadow
    };
  });
  
  testResults.visualEnhancements.glassMorphism = {
    hasBackdropFilter: glassEffect.backdropFilter !== 'none',
    hasSemiTransparentBg: glassEffect.backgroundColor.includes('rgba') && glassEffect.backgroundColor.includes('0.1'),
    hasBorder: glassEffect.border !== 'none',
    hasShadow: glassEffect.boxShadow !== 'none'
  };
  
  console.log(`${testResults.visualEnhancements.glassMorphism.hasBackdropFilter ? '✅' : '❌'} [Visual Enhancements] Glass Morphism Effect`);
  await page.screenshot({ path: `${screenshotDir}/glass-morphism-${browserName}-${viewport.width}.png` });
  
  // Test Menu Item Styling
  const menuItems = await page.locator('nav a').all();
  const firstMenuItem = menuItems[0];
  
  if (firstMenuItem) {
    // Check hover state
    await firstMenuItem.hover();
    await page.waitForTimeout(300);
    
    const hoverStyles = await firstMenuItem.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        transform: styles.transform,
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow
      };
    });
    
    testResults.visualEnhancements.menuItemHover = {
      hasTransform: hoverStyles.transform !== 'none',
      hasBgChange: hoverStyles.backgroundColor !== '',
      hasShadow: hoverStyles.boxShadow !== 'none'
    };
    
    console.log(`${testResults.visualEnhancements.menuItemHover.hasTransform ? '✅' : '❌'} [Visual Enhancements] Menu Item Hover Effects`);
    await page.screenshot({ path: `${screenshotDir}/menu-hover-${browserName}-${viewport.width}.png` });
  }
  
  // Test Button Gradient Animations
  const toggleButton = await page.locator('button[title="Toggle sidebar"]').first();
  if (toggleButton) {
    await toggleButton.hover();
    await page.waitForTimeout(300);
    
    const buttonStyles = await toggleButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundImage: styles.backgroundImage,
        transition: styles.transition
      };
    });
    
    testResults.visualEnhancements.buttonAnimation = {
      hasGradient: buttonStyles.backgroundImage.includes('gradient'),
      hasTransition: buttonStyles.transition !== 'none'
    };
    
    console.log(`${testResults.visualEnhancements.buttonAnimation.hasGradient ? '✅' : '❌'} [Visual Enhancements] Button Gradient Animations`);
    await page.screenshot({ path: `${screenshotDir}/button-animation-${browserName}-${viewport.width}.png` });
  }
}

async function testResizeFixes(page, browserName, viewport) {
  console.log(`📏 Testing Resize Fixes - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test Fixed Dimensions
  const sidebar = await page.locator('aside').first();
  const dimensions = await sidebar.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      minWidth: styles.minWidth,
      maxWidth: styles.maxWidth,
      flexShrink: styles.flexShrink
    };
  });
  
  testResults.resizeFixes.fixedDimensions = {
    hasMinWidth: dimensions.minWidth === '64px',
    hasMaxWidth: dimensions.maxWidth === '256px',
    hasNoFlexShrink: dimensions.flexShrink === '0'
  };
  
  console.log(`${testResults.resizeFixes.fixedDimensions.hasMinWidth ? '✅' : '❌'} [Resize Fixes] Fixed Dimensions`);
  console.log(`   MinWidth: ${dimensions.minWidth}, MaxWidth: ${dimensions.maxWidth}, FlexShrink: ${dimensions.flexShrink}`);
  await page.screenshot({ path: `${screenshotDir}/fixed-dimensions-${browserName}-${viewport.width}.png` });
  
  // Test Consistent Spacing
  const menuItems = await page.locator('nav a').all();
  const spacing = await Promise.all(menuItems.map(async (item, index) => {
    if (index === 0) return null;
    const prevItem = menuItems[index - 1];
    const prevRect = await prevItem.boundingBox();
    const currRect = await item.boundingBox();
    return currRect.y - prevRect.y - prevRect.height;
  }));
  
  const consistentSpacing = spacing.filter(s => s !== null).every(s => Math.abs(s - spacing[1]) < 2);
  
  testResults.resizeFixes.consistentSpacing = consistentSpacing;
  console.log(`${testResults.resizeFixes.consistentSpacing ? '✅' : '❌'} [Resize Fixes] Consistent Spacing`);
  await page.screenshot({ path: `${screenshotDir}/consistent-spacing-${browserName}-${viewport.width}.png` });
  
  // Test Layout Stability During Transitions
  const initialWidth = await sidebar.evaluate(el => el.offsetWidth);
  
  // Toggle sidebar
  const toggleButton = await page.locator('button[title="Toggle sidebar"]').first();
  await toggleButton.click();
  await page.waitForTimeout(350); // Wait for transition to complete
  
  const finalWidth = await sidebar.evaluate(el => el.offsetWidth);
  
  testResults.resizeFixes.layoutStability = {
    initialWidth,
    finalWidth,
    hasProperTransition: Math.abs(finalWidth - initialWidth) > 0
  };
  
  console.log(`${testResults.resizeFixes.layoutStability.hasProperTransition ? '✅' : '❌'} [Resize Fixes] Layout Stability During Transitions`);
  console.log(`   Initial width: ${initialWidth}px, Final width: ${finalWidth}px`);
  await page.screenshot({ path: `${screenshotDir}/layout-stability-${browserName}-${viewport.width}.png` });
  
  // Toggle back to original state
  await toggleButton.click();
  await page.waitForTimeout(350);
}

async function testFunctionality(page, browserName, viewport) {
  console.log(`⚙️ Testing Functionality - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test Smooth Transitions
  const sidebar = await page.locator('aside').first();
  const toggleButton = await page.locator('button[title="Toggle sidebar"]').first();
  
  const startTime = Date.now();
  await toggleButton.click();
  
  // Wait for transition to complete
  await sidebar.waitForElementState('stable', { timeout: 1000 });
  
  const transitionTime = Date.now() - startTime;
  
  testResults.functionality.smoothTransitions = {
    transitionTime,
    withinExpectedRange: transitionTime <= 350 // Allow some tolerance
  };
  
  console.log(`${testResults.functionality.smoothTransitions.withinExpectedRange ? '✅' : '❌'} [Functionality] Smooth Transitions`);
  console.log(`   Transition time: ${transitionTime}ms (expected: 300ms)`);
  await page.screenshot({ path: `${screenshotDir}/smooth-transition-${browserName}-${viewport.width}.png` });
  
  // Test Menu Item Functionality
  const menuItems = await page.locator('nav a').all();
  if (menuItems.length > 0) {
    const firstMenuItem = menuItems[0];
    const href = await firstMenuItem.getAttribute('href');
    
    await firstMenuItem.click();
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    testResults.functionality.menuItemFunctionality = {
      navigationSuccessful: currentUrl.includes(href) || currentUrl.includes('dashboard'),
      finalUrl: currentUrl
    };
    
    console.log(`${testResults.functionality.menuItemFunctionality.navigationSuccessful ? '✅' : '❌'} [Functionality] Menu Item Functionality`);
    console.log(`   Navigation successful: ${testResults.functionality.menuItemFunctionality.navigationSuccessful}, URL: ${currentUrl}`);
    await page.screenshot({ path: `${screenshotDir}/menu-navigation-${browserName}-${viewport.width}.png` });
  }
}

async function testPerformance(page, browserName, viewport) {
  console.log(`🚀 Testing Performance - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test Animation Performance
  const toggleButton = await page.locator('button[title="Toggle sidebar"]').first();
  const sidebar = await page.locator('aside').first();
  
  // Measure FPS during transition
  const fps = await page.evaluate(() => {
    return new Promise(resolve => {
      let frameCount = 0;
      let startTime = performance.now();
      
      function countFrame() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - startTime >= 1000) {
          resolve(frameCount);
        } else {
          requestAnimationFrame(countFrame);
        }
      }
      
      // Trigger animation
      const toggleBtn = document.querySelector('button[title="Toggle sidebar"]');
      if (toggleBtn) toggleBtn.click();
      
      requestAnimationFrame(countFrame);
    });
  });
  
  testResults.performance.animationPerformance = {
    fps,
    isSmooth: fps >= 30
  };
  
  console.log(`${testResults.performance.animationPerformance.isSmooth ? '✅' : '❌'} [Performance] Animation Performance`);
  console.log(`   FPS: ${fps} (expected: >=30)`);
  await page.screenshot({ path: `${screenshotDir}/performance-${browserName}-${viewport.width}.png` });
}

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Authenticate first
    await authenticateUser(page);
    
    // Run all tests
    await testVisualEnhancements(page, 'chromium', { width: 1920, height: 1080 });
    await testResizeFixes(page, 'chromium', { width: 1920, height: 1080 });
    await testFunctionality(page, 'chromium', { width: 1920, height: 1080 });
    await testPerformance(page, 'chromium', { width: 1920, height: 1080 });
    
    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        visualEnhancements: Object.values(testResults.visualEnhancements).every(test => 
          typeof test === 'object' ? Object.values(test).every(val => val === true) : test === true
        ),
        resizeFixes: Object.values(testResults.resizeFixes).every(test => 
          typeof test === 'object' ? Object.values(test).every(val => val === true) : test === true
        ),
        functionality: Object.values(testResults.functionality).every(test => 
          typeof test === 'object' ? Object.values(test).every(val => val === true) : test === true
        ),
        performance: Object.values(testResults.performance).every(test => 
          typeof test === 'object' ? Object.values(test).every(val => val === true) : test === true
        )
      }
    };
    
    // Save report
    fs.writeFileSync('./SIDEBAR_AESTHETIC_TEST_REPORT.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Visual Enhancements: ${report.summary.visualEnhancements ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Resize Fixes: ${report.summary.resizeFixes ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Functionality: ${report.summary.functionality ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Performance: ${report.summary.performance ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('\n📸 Screenshots saved to:', screenshotDir);
    console.log('📄 Detailed report saved to: ./SIDEBAR_AESTHETIC_TEST_REPORT.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

runTests();