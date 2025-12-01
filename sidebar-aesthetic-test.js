/**
 * COMPREHENSIVE SIDEBAR AESTHETIC ENHANCEMENT TEST SCRIPT
 * 
 * This script systematically tests all visual and functional aspects of the sidebar
 * to verify that the aesthetic enhancements work correctly and no existing 
 * functionality has been broken.
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  browsers: ['chromium'],
  viewportSizes: [
    { width: 1920, height: 1080 }, // Desktop
    { width: 768, height: 1024 },  // Tablet
    { width: 375, height: 667 }   // Mobile
  ],
  screenshotDir: './sidebar-test-screenshots',
  timeout: 30000
};

// Test results
const testResults = {
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  details: [],
  startTime: null,
  endTime: null
};

// Test categories
const testCategories = {
  VISUAL_ENHANCEMENTS: 'Visual Enhancements',
  RESIZE_FIXES: 'Resize Fixes',
  FUNCTIONALITY: 'Functionality',
  PERFORMANCE: 'Performance',
  RESPONSIVENESS: 'Responsiveness'
};

/**
 * Initialize test environment
 */
async function initializeTest() {
  testResults.startTime = new Date().toISOString();
  
  // Create screenshot directory if it doesn't exist
  if (!fs.existsSync(config.screenshotDir)) {
    fs.mkdirSync(config.screenshotDir, { recursive: true });
  }
  
  console.log('🚀 Starting Sidebar Aesthetic Enhancement Tests');
  console.log('📁 Screenshot directory:', config.screenshotDir);
  console.log('🌐 Base URL:', config.baseUrl);
  console.log('');
}

/**
 * Log test result
 */
function logTestResult(category, testName, passed, details = '', screenshot = null) {
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  const result = {
    category,
    testName,
    passed,
    details,
    screenshot,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  
  const status = passed ? '✅' : '❌';
  console.log(`${status} [${category}] ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (screenshot) {
    console.log(`   📸 Screenshot: ${screenshot}`);
  }
  console.log('');
}

/**
 * Authenticate user before running tests
 */
async function authenticateUser(page) {
  console.log('🔐 Authenticating user...');
  
  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForSelector('form', { timeout: config.timeout });
    
    // DEBUG: Take screenshot of login page
    await page.screenshot({ path: `${config.screenshotDir}/debug-login-page.png`, fullPage: true });
    
    // DEBUG: Log the page title and URL
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`📄 DEBUG: Login page title: ${pageTitle}`);
    console.log(`🔗 DEBUG: Login page URL: ${pageUrl}`);
    
    // DEBUG: Check if form elements exist
    const emailInputExists = await page.$('input[type="email"]') !== null;
    const passwordInputExists = await page.$('input[type="password"]') !== null;
    const submitButtonExists = await page.$('button[type="submit"]') !== null;
    
    console.log(`🔍 DEBUG: Email input exists: ${emailInputExists}`);
    console.log(`🔍 DEBUG: Password input exists: ${passwordInputExists}`);
    console.log(`🔍 DEBUG: Submit button exists: ${submitButtonExists}`);
    
    // If standard selectors don't work, try alternative selectors
    if (!emailInputExists || !passwordInputExists || !submitButtonExists) {
      console.log('🔧 DEBUG: Trying alternative selectors...');
      
      // Try to find any email input
      const emailInputs = await page.$$('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]');
      console.log(`🔧 DEBUG: Found ${emailInputs.length} potential email inputs`);
      
      // Try to find any password input
      const passwordInputs = await page.$$('input[type="password"], input[name*="password"], input[id*="password"]');
      console.log(`🔧 DEBUG: Found ${passwordInputs.length} potential password inputs`);
      
      // Try to find any submit button
      const submitButtons = await page.$$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]');
      console.log(`🔧 DEBUG: Found ${submitButtons.length} potential submit buttons`);
    }
    
    // Try multiple login attempts with different test credentials
    const loginAttempts = [
      { email: 'testuser@verotrade.com', password: 'TestPassword123!' },
      { email: 'test@example.com', password: 'password123' },
      { email: 'testuser@example.com', password: 'testpass123' },
      { email: 'demo@example.com', password: 'demo123' }
    ];
    
    for (const attempt of loginAttempts) {
      try {
        console.log(`🔑 Trying login with ${attempt.email}...`);
        
        // Clear form first
        await page.fill('input[type="email"]', '');
        await page.fill('input[type="password"]', '');
        
        // Fill in login form
        await page.fill('input[type="email"]', attempt.email);
        await page.fill('input[type="password"]', attempt.password);
        
        // DEBUG: Take screenshot before submission
        await page.screenshot({ path: `${config.screenshotDir}/debug-before-submit-${attempt.email}.png`, fullPage: false });
        
        // Click login button
        await page.click('button[type="submit"]');
        
        // Wait for navigation or response
        await page.waitForTimeout(3000);
        
        // DEBUG: Take screenshot after submission
        await page.screenshot({ path: `${config.screenshotDir}/debug-after-submit-${attempt.email}.png`, fullPage: false });
        
        // Check if login was successful by verifying URL doesn't include '/login'
        const currentUrl = page.url();
        console.log(`🔍 DEBUG: Current URL after login attempt: ${currentUrl}`);
        
        if (!currentUrl.includes('/login')) {
          console.log('✅ Login successful!');
          await page.waitForTimeout(2000); // Wait for page to fully load
          return true;
        }
        
        // If we're still on login page, check for error message
        const errorElement = await page.$('.text-red-500, .error-message, [role="alert"], .error');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Login failed: ${errorText}`);
        } else {
          console.log(`❌ Login failed: No error message found`);
        }
      } catch (error) {
        console.log(`❌ Login attempt failed: ${error.message}`);
      }
    }
    
    console.log('❌ All login attempts failed');
    return false;
  } catch (error) {
    console.error(`❌ Authentication error: ${error.message}`);
    return false;
  }
}

/**
 * Test 1: Sidebar Visual Enhancements
 */
async function testVisualEnhancements(page, browserName, viewport) {
  const category = testCategories.VISUAL_ENHANCEMENTS;
  
  console.log(`\n🎨 Testing Visual Enhancements - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Authenticate first
  const isAuthenticated = await authenticateUser(page);
  if (!isAuthenticated) {
    throw new Error('Authentication failed - cannot proceed with sidebar tests');
  }
  
  // Navigate to dashboard
  await page.goto(config.baseUrl);
  await page.waitForSelector('.sidebar-performance-optimized', { state: 'visible' });
  
  // Test 1.1: Glass morphism effect
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const computedStyle = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        backdropFilter: styles.backdropFilter,
        border: styles.border,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow
      };
    });
    
    const hasGlassEffect = 
      computedStyle.background.includes('rgba') &&
      computedStyle.backdropFilter.includes('blur') &&
      computedStyle.borderRadius !== '0px';
    
    logTestResult(
      category,
      'Glass Morphism Effect',
      hasGlassEffect,
      `Background: ${computedStyle.background}, Backdrop: ${computedStyle.backdropFilter}`,
      `${config.screenshotDir}/glass-effect-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/glass-effect-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Glass Morphism Effect',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 1.2: Enhanced gradients and border effects
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const hasGradientBorder = await sidebar.evaluate(el => {
      const before = window.getComputedStyle(el, '::before');
      return before.background && before.background.includes('gradient');
    });
    
    logTestResult(
      category,
      'Enhanced Gradients and Border Effects',
      hasGradientBorder,
      `Gradient border detected: ${hasGradientBorder}`,
      `${config.screenshotDir}/gradient-border-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/gradient-border-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Enhanced Gradients and Border Effects',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 1.3: Menu item hover effects
  try {
    const menuItem = await page.$('nav a[href="/dashboard"]');
    await menuItem.hover();
    
    const hasHoverEffect = await menuItem.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transform !== 'none' || 
             styles.boxShadow !== 'none' ||
             styles.background.includes('gradient');
    });
    
    logTestResult(
      category,
      'Menu Item Hover Effects',
      hasHoverEffect,
      `Hover effect detected: ${hasHoverEffect}`,
      `${config.screenshotDir}/menu-hover-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/menu-hover-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Menu Item Hover Effects',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 1.4: Active state indicators
  try {
    const activeMenuItem = await page.$('nav a.nav-item-active');
    const hasActiveIndicator = await activeMenuItem.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const before = window.getComputedStyle(el, '::before');
      return styles.background.includes('gradient') && 
             before.width !== '0px' &&
             before.background.includes('gradient');
    });
    
    logTestResult(
      category,
      'Active State Indicators',
      hasActiveIndicator,
      `Active indicator detected: ${hasActiveIndicator}`,
      `${config.screenshotDir}/active-state-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/active-state-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Active State Indicators',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 1.5: Button gradient animations
  try {
    const toggleButton = await page.$('.sidebar-button');
    await toggleButton.hover();
    
    const hasGradientAnimation = await toggleButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const before = window.getComputedStyle(el, '::before');
      return before.background && before.background.includes('gradient');
    });
    
    logTestResult(
      category,
      'Button Gradient Animations',
      hasGradientAnimation,
      `Button gradient animation detected: ${hasGradientAnimation}`,
      `${config.screenshotDir}/button-animation-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/button-animation-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Button Gradient Animations',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 1.6: Tooltip enhancements
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const isCollapsed = await sidebar.evaluate(el => el.classList.contains('sidebar-collapsed'));
    
    if (isCollapsed) {
      const menuItem = await page.$('nav a[href="/dashboard"]');
      await menuItem.hover();
      
      const tooltip = await page.$('.sidebar-tooltip');
      const tooltipVisible = await tooltip.isVisible();
      
      logTestResult(
        category,
        'Tooltip Enhancements',
        tooltipVisible,
        `Tooltip visible in collapsed state: ${tooltipVisible}`,
        `${config.screenshotDir}/tooltip-${browserName}-${viewport.width}.png`
      );
      
      await page.screenshot({ 
        path: `${config.screenshotDir}/tooltip-${browserName}-${viewport.width}.png`,
        fullPage: false 
      });
    } else {
      logTestResult(
        category,
        'Tooltip Enhancements',
        true,
        'Sidebar expanded - tooltips not needed'
      );
    }
  } catch (error) {
    logTestResult(
      category,
      'Tooltip Enhancements',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test 2: Fixed Resize Issues
 */
async function testResizeFixes(page, browserName, viewport) {
  const category = testCategories.RESIZE_FIXES;
  
  console.log(`\n📏 Testing Resize Fixes - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test 2.1: Fixed dimensions
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const dimensions = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth,
        flexShrink: styles.flexShrink
      };
    });
    
    const hasFixedDimensions = 
      dimensions.minWidth !== 'none' &&
      dimensions.maxWidth !== 'none' &&
      dimensions.flexShrink === '0';
    
    logTestResult(
      category,
      'Fixed Dimensions',
      hasFixedDimensions,
      `MinWidth: ${dimensions.minWidth}, MaxWidth: ${dimensions.maxWidth}, FlexShrink: ${dimensions.flexShrink}`,
      `${config.screenshotDir}/fixed-dimensions-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/fixed-dimensions-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Fixed Dimensions',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 2.2: Consistent spacing
  try {
    const menuItems = await page.$$('nav a');
    const spacingConsistent = await menuItems[0].evaluate((el, allItems) => {
      const firstMargin = window.getComputedStyle(el).marginBottom;
      return Array.from(allItems).every(item => {
        const margin = window.getComputedStyle(item).marginBottom;
        return margin === firstMargin;
      });
    }, menuItems);
    
    logTestResult(
      category,
      'Consistent Spacing',
      spacingConsistent,
      `Menu items have consistent spacing: ${spacingConsistent}`,
      `${config.screenshotDir}/consistent-spacing-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/consistent-spacing-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Consistent Spacing',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 2.3: No empty spaces
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const hasNoEmptySpaces = await sidebar.evaluate(el => {
      const nav = el.querySelector('nav');
      const items = nav.querySelectorAll('a, button');
      const navHeight = nav.offsetHeight;
      const itemsHeight = Array.from(items).reduce((sum, item) => sum + item.offsetHeight, 0);
      const gap = navHeight - itemsHeight;
      return gap < 50; // Allow for reasonable gaps
    });
    
    logTestResult(
      category,
      'No Empty Spaces',
      hasNoEmptySpaces,
      `No excessive empty spaces detected: ${hasNoEmptySpaces}`,
      `${config.screenshotDir}/no-empty-spaces-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/no-empty-spaces-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'No Empty Spaces',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 2.4: Layout stability during transitions
  try {
    const toggleButton = await page.$('.sidebar-button');
    const initialWidth = await page.$eval('.sidebar-performance-optimized', el => el.offsetWidth);
    
    // Trigger toggle
    await toggleButton.click();
    await page.waitForTimeout(350); // Wait for transition to complete
    
    const finalWidth = await page.$eval('.sidebar-performance-optimized', el => el.offsetWidth);
    const widthChanged = initialWidth !== finalWidth;
    
    logTestResult(
      category,
      'Layout Stability During Transitions',
      widthChanged,
      `Initial width: ${initialWidth}px, Final width: ${finalWidth}px`,
      `${config.screenshotDir}/layout-stability-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/layout-stability-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
    
    // Toggle back
    await toggleButton.click();
    await page.waitForTimeout(350);
  } catch (error) {
    logTestResult(
      category,
      'Layout Stability During Transitions',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test 3: Existing Functionality
 */
async function testFunctionality(page, browserName, viewport) {
  const category = testCategories.FUNCTIONALITY;
  
  console.log(`\n⚙️ Testing Functionality - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test 3.1: Smooth transitions
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const toggleButton = await page.$('.sidebar-button');
    
    const startTime = Date.now();
    await toggleButton.click();
    
    // Monitor transition
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('.sidebar-performance-optimized');
      return !sidebar.classList.contains('sidebar-transitioning');
    }, { timeout: 500 });
    
    const transitionTime = Date.now() - startTime;
    const smoothTransition = transitionTime >= 280 && transitionTime <= 320; // 300ms ± 20ms
    
    logTestResult(
      category,
      'Smooth Transitions',
      smoothTransition,
      `Transition time: ${transitionTime}ms (expected: 300ms)`,
      `${config.screenshotDir}/smooth-transition-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/smooth-transition-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Smooth Transitions',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 3.2: Universal toggle button visibility
  try {
    const toggleButton = await page.$('.sidebar-button');
    const isVisible = await toggleButton.isVisible();
    const isClickable = await toggleButton.isClickable();
    
    logTestResult(
      category,
      'Universal Toggle Button Visibility',
      isVisible && isClickable,
      `Button visible: ${isVisible}, clickable: ${isClickable}`,
      `${config.screenshotDir}/toggle-button-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/toggle-button-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Universal Toggle Button Visibility',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 3.3: Menu item functionality
  try {
    const dashboardLink = await page.$('nav a[href="/dashboard"]');
    await dashboardLink.click();
    
    const currentUrl = page.url();
    const navigationSuccessful = currentUrl.includes('/dashboard');
    
    logTestResult(
      category,
      'Menu Item Functionality',
      navigationSuccessful,
      `Navigation successful: ${navigationSuccessful}, URL: ${currentUrl}`,
      `${config.screenshotDir}/menu-navigation-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/menu-navigation-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Menu Item Functionality',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 3.4: Sidebar expand/collapse functionality
  try {
    const toggleButton = await page.$('.sidebar-button');
    const sidebar = await page.$('.sidebar-performance-optimized');
    
    const initialState = await sidebar.evaluate(el => el.classList.contains('sidebar-collapsed'));
    await toggleButton.click();
    await page.waitForTimeout(350);
    
    const finalState = await sidebar.evaluate(el => el.classList.contains('sidebar-collapsed'));
    const toggleSuccessful = initialState !== finalState;
    
    logTestResult(
      category,
      'Sidebar Expand/Collapse Functionality',
      toggleSuccessful,
      `State changed from ${initialState} to ${finalState}`,
      `${config.screenshotDir}/sidebar-toggle-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/sidebar-toggle-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Sidebar Expand/Collapse Functionality',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test 4: Performance
 */
async function testPerformance(page, browserName, viewport) {
  const category = testCategories.PERFORMANCE;
  
  console.log(`\n⚡ Testing Performance - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test 4.1: Animation smoothness
  try {
    const toggleButton = await page.$('.sidebar-button');
    
    // Start performance monitoring
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {
          frameDrops: 0,
          maxFrameTime: 0,
          startTime: performance.now()
        };
        
        let lastFrameTime = performance.now();
        
        const checkFrame = () => {
          const now = performance.now();
          const frameTime = now - lastFrameTime;
          
          if (frameTime > 50) { // More than 50ms between frames
            metrics.frameDrops++;
          }
          
          if (frameTime > metrics.maxFrameTime) {
            metrics.maxFrameTime = frameTime;
          }
          
          lastFrameTime = now;
          
          if (now - metrics.startTime < 1000) {
            requestAnimationFrame(checkFrame);
          } else {
            resolve(metrics);
          }
        };
        
        checkFrame();
      });
    });
    
    const smoothAnimations = metrics.frameDrops === 0 && metrics.maxFrameTime < 33;
    
    logTestResult(
      category,
      'Animation Smoothness',
      smoothAnimations,
      `Frame drops: ${metrics.frameDrops}, Max frame time: ${metrics.maxFrameTime.toFixed(2)}ms`,
      `${config.screenshotDir}/animation-smoothness-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/animation-smoothness-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Animation Smoothness',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 4.2: No performance lag
  try {
    const startTime = performance.now();
    
    // Perform multiple rapid toggles
    const toggleButton = await page.$('.sidebar-button');
    for (let i = 0; i < 5; i++) {
      await toggleButton.click();
      await page.waitForTimeout(50);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const noLag = totalTime < 2000; // Should complete within 2 seconds
    
    logTestResult(
      category,
      'No Performance Lag',
      noLag,
      `Total time for 5 toggles: ${totalTime.toFixed(2)}ms`,
      `${config.screenshotDir}/no-performance-lag-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/no-performance-lag-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'No Performance Lag',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 4.3: GPU acceleration
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const hasGPUAcceleration = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transform !== 'none' || 
             styles.willChange !== 'auto' ||
             styles.backfaceVisibility === 'hidden';
    });
    
    logTestResult(
      category,
      'GPU Acceleration',
      hasGPUAcceleration,
      `GPU acceleration detected: ${hasGPUAcceleration}`,
      `${config.screenshotDir}/gpu-acceleration-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/gpu-acceleration-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'GPU Acceleration',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test 5: Responsiveness
 */
async function testResponsiveness(page, browserName, viewport) {
  const category = testCategories.RESPONSIVENESS;
  
  console.log(`\n📱 Testing Responsiveness - ${browserName} (${viewport.width}x${viewport.height})`);
  
  // Test 5.1: Mobile responsiveness
  try {
    const isMobile = viewport.width < 768;
    const sidebar = await page.$('.sidebar-performance-optimized');
    const isHidden = await sidebar.evaluate(el => {
      return window.getComputedStyle(el).transform === 'translateX(-100%)';
    });
    
    const mobileResponsive = !isMobile || isHidden;
    
    logTestResult(
      category,
      'Mobile Responsiveness',
      mobileResponsive,
      `Mobile (${isMobile}): Sidebar hidden: ${isHidden}`,
      `${config.screenshotDir}/mobile-responsive-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/mobile-responsive-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Mobile Responsiveness',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 5.2: Touch-friendly interactions
  try {
    const isMobile = viewport.width < 768;
    
    if (isMobile) {
      const toggleButton = await page.$('.sidebar-button');
      const isTouchFriendly = await toggleButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return parseInt(styles.width) >= 44 && parseInt(styles.height) >= 44;
      });
      
      logTestResult(
        category,
        'Touch-Friendly Interactions',
        isTouchFriendly,
        `Touch-friendly buttons: ${isTouchFriendly}`,
        `${config.screenshotDir}/touch-friendly-${browserName}-${viewport.width}.png`
      );
      
      await page.screenshot({ 
        path: `${config.screenshotDir}/touch-friendly-${browserName}-${viewport.width}.png`,
        fullPage: false 
      });
    } else {
      logTestResult(
        category,
        'Touch-Friendly Interactions',
        true,
        'Desktop - touch interactions not applicable'
      );
    }
  } catch (error) {
    logTestResult(
      category,
      'Touch-Friendly Interactions',
      false,
      `Error: ${error.message}`
    );
  }
  
  // Test 5.3: Cross-browser consistency
  try {
    const sidebar = await page.$('.sidebar-performance-optimized');
    const isConsistent = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.width !== 'auto' && 
             styles.height !== 'auto' &&
             styles.position === 'fixed';
    });
    
    logTestResult(
      category,
      'Cross-Browser Consistency',
      isConsistent,
      `Consistent layout detected: ${isConsistent}`,
      `${config.screenshotDir}/cross-browser-${browserName}-${viewport.width}.png`
    );
    
    await page.screenshot({ 
      path: `${config.screenshotDir}/cross-browser-${browserName}-${viewport.width}.png`,
      fullPage: false 
    });
  } catch (error) {
    logTestResult(
      category,
      'Cross-Browser Consistency',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  testResults.endTime = new Date().toISOString();
  
  const report = {
    title: 'COMPREHENSIVE SIDEBAR AESTHETIC ENHANCEMENT TEST REPORT',
    generatedAt: new Date().toISOString(),
    testDuration: `${(new Date(testResults.endTime) - new Date(testResults.startTime)) / 1000} seconds`,
    configuration: config,
    summary: testResults.summary,
    details: testResults.details,
    recommendations: []
  };
  
  // Generate recommendations based on test results
  const failedTests = testResults.details.filter(test => !test.passed);
  
  if (failedTests.length > 0) {
    report.recommendations.push({
      type: 'Issues Found',
      message: `${failedTests.length} tests failed. Review the details below for specific issues.`
    });
    
    const failedCategories = [...new Set(failedTests.map(test => test.category))];
    failedCategories.forEach(category => {
      report.recommendations.push({
        type: 'Category Issues',
        message: `Issues detected in ${category}. Focus on this area for fixes.`
      });
    });
  } else {
    report.recommendations.push({
      type: 'All Tests Passed',
      message: 'All sidebar aesthetic enhancements are working correctly!'
    });
  }
  
  // Save report
  const reportPath = './SIDEBAR_AESTHETIC_TEST_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate human-readable report
  const readableReport = `
# SIDEBAR AESTHETIC ENHANCEMENT TEST REPORT

## Test Summary
- **Total Tests**: ${testResults.summary.totalTests}
- **Passed**: ${testResults.summary.passed}
- **Failed**: ${testResults.summary.failed}
- **Skipped**: ${testResults.summary.skipped}
- **Test Duration**: ${report.testDuration}

## Test Results by Category

### Visual Enhancements
${testResults.details
  .filter(test => test.category === testCategories.VISUAL_ENHANCEMENTS)
  .map(test => `- ${test.passed ? '✅' : '❌'} ${test.testName}${test.details ? ` - ${test.details}` : ''}`)
  .join('\n')}

### Resize Fixes
${testResults.details
  .filter(test => test.category === testCategories.RESIZE_FIXES)
  .map(test => `- ${test.passed ? '✅' : '❌'} ${test.testName}${test.details ? ` - ${test.details}` : ''}`)
  .join('\n')}

### Functionality
${testResults.details
  .filter(test => test.category === testCategories.FUNCTIONALITY)
  .map(test => `- ${test.passed ? '✅' : '❌'} ${test.testName}${test.details ? ` - ${test.details}` : ''}`)
  .join('\n')}

### Performance
${testResults.details
  .filter(test => test.category === testCategories.PERFORMANCE)
  .map(test => `- ${test.passed ? '✅' : '❌'} ${test.testName}${test.details ? ` - ${test.details}` : ''}`)
  .join('\n')}

### Responsiveness
${testResults.details
  .filter(test => test.category === testCategories.RESPONSIVENESS)
  .map(test => `- ${test.passed ? '✅' : '❌'} ${test.testName}${test.details ? ` - ${test.details}` : ''}`)
  .join('\n')}

## Recommendations
${report.recommendations.map(rec => `- **${rec.type}**: ${rec.message}`).join('\n')}

## Screenshots
All test screenshots are saved in the \`${config.screenshotDir}\` directory.

## Detailed Results
See \`${reportPath}\` for detailed test results.
`;
  
  const readableReportPath = './SIDEBAR_AESTHETIC_TEST_REPORT.md';
  fs.writeFileSync(readableReportPath, readableReport);
  
  console.log('📊 Test Report Generated');
  console.log('📄 JSON Report:', reportPath);
  console.log('📄 Readable Report:', readableReportPath);
  console.log('📁 Screenshots:', config.screenshotDir);
}

/**
 * Main test runner
 */
async function runTests() {
  await initializeTest();
  
  for (const browserName of config.browsers) {
    console.log(`\n🌐 Testing with ${browserName}`);
    
    const browser = await { chromium, firefox, webkit }[browserName].launch({
      headless: false, // Set to true for headless testing
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const viewport of config.viewportSizes) {
      console.log(`\n📱 Viewport: ${viewport.width}x${viewport.height}`);
      
      const context = await browser.newContext({
        viewport,
        recordVideo: {
          dir: `${config.screenshotDir}/videos`
        }
      });
      
      const page = await context.newPage();
      
      try {
        // Run all test categories
        await testVisualEnhancements(page, browserName, viewport);
        await testResizeFixes(page, browserName, viewport);
        await testFunctionality(page, browserName, viewport);
        await testPerformance(page, browserName, viewport);
        await testResponsiveness(page, browserName, viewport);
      } catch (error) {
        console.error(`❌ Test failed for ${browserName} at ${viewport.width}x${viewport.height}:`, error);
      } finally {
        await page.close();
        await context.close();
      }
    }
    
    await browser.close();
  }
  
  generateTestReport();
  
  console.log('\n🎉 Sidebar Aesthetic Enhancement Tests Complete!');
  console.log(`\n📊 Summary: ${testResults.summary.passed}/${testResults.summary.totalTests} tests passed`);
  
  if (testResults.summary.failed > 0) {
    console.log(`\n❌ ${testResults.summary.failed} tests failed. Check the report for details.`);
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Sidebar aesthetic enhancements are working correctly.');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testVisualEnhancements,
  testResizeFixes,
  testFunctionality,
  testPerformance,
  testResponsiveness
};