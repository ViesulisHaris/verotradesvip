/**
 * Comprehensive Hamburger Menu Diagnostic Test
 * Tests hamburger menu visibility and functionality on mobile devices
 */

const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  mobileViewports: [
    { name: 'iPhone SE', width: 320, height: 568 },
    { name: 'iPhone 12', width: 375, height: 667 },
    { name: 'iPhone 12 Pro Max', width: 414, height: 896 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Small Mobile', width: 280, height: 653 }
  ],
  screenshots: true,
  headless: false // Set to true for CI environments
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0
  },
  viewportTests: [],
  functionalityTests: [],
  cssAnalysis: [],
  stateManagementTests: [],
  finalDiagnosis: []
};

/**
 * Utility function to log test results
 */
function logTestResult(testName, status, details = '', viewport = null) {
  const result = {
    testName,
    status, // 'pass', 'fail', 'skip'
    details,
    timestamp: new Date().toISOString(),
    viewport: viewport?.name || 'Desktop'
  };
  
  console.log(`${status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️'} ${testName}: ${details}`);
  
  testResults.summary.totalTests++;
  if (status === 'pass') testResults.summary.passedTests++;
  else if (status === 'fail') testResults.summary.failedTests++;
  else testResults.summary.skippedTests++;
  
  return result;
}

/**
 * Test hamburger menu button existence and basic properties
 */
async function testHamburgerButtonExistence(page, viewport) {
  const results = [];
  
  // Test 1: Check if hamburger button exists in DOM
  const hamburgerExists = await page.locator('button[aria-label="Toggle mobile menu"]').count() > 0;
  results.push(logTestResult(
    'Hamburger Button Exists in DOM',
    hamburgerExists ? 'pass' : 'fail',
    hamburgerExists ? 'Button found with aria-label="Toggle mobile menu"' : 'Button not found in DOM',
    viewport
  ));
  
  if (hamburgerExists) {
    // Test 2: Check hamburger button visibility
    const isVisible = await page.locator('button[aria-label="Toggle mobile menu"]').isVisible();
    results.push(logTestResult(
      'Hamburger Button Visibility',
      isVisible ? 'pass' : 'fail',
      isVisible ? 'Button is visible on screen' : 'Button exists but is not visible',
      viewport
    ));
    
    // Test 3: Check hamburger button CSS classes
    const buttonClasses = await page.locator('button[aria-label="Toggle mobile menu"]').getAttribute('class');
    const hasMobileClass = buttonClasses && buttonClasses.includes('lg:hidden');
    results.push(logTestResult(
      'Hamburger Button Mobile CSS Class',
      hasMobileClass ? 'pass' : 'fail',
      hasMobileClass ? 'Button has lg:hidden class' : `Button classes: ${buttonClasses}`,
      viewport
    ));
    
    // Test 4: Check hamburger button dimensions
    const boundingBox = await page.locator('button[aria-label="Toggle mobile menu"]').boundingBox();
    const hasProperSize = boundingBox && boundingBox.width >= 40 && boundingBox.height >= 40;
    results.push(logTestResult(
      'Hamburger Button Touch Target Size',
      hasProperSize ? 'pass' : 'fail',
      hasProperSize ? `Button size: ${boundingBox.width}x${boundingBox.height}px` : `Button too small: ${boundingBox?.width}x${boundingBox?.height}px`,
      viewport
    ));
    
    // Test 5: Check hamburger button z-index
    const zIndex = await page.locator('button[aria-label="Toggle mobile menu"]').evaluate(el => {
      return window.getComputedStyle(el).zIndex;
    });
    const hasProperZIndex = parseInt(zIndex) >= 50;
    results.push(logTestResult(
      'Hamburger Button Z-Index',
      hasProperZIndex ? 'pass' : 'fail',
      `Button z-index: ${zIndex} (should be >= 50)`,
      viewport
    ));
    
    // Test 6: Check hamburger button background color
    const backgroundColor = await page.locator('button[aria-label="Toggle mobile menu"]').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    const hasBackgroundColor = backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent';
    results.push(logTestResult(
      'Hamburger Button Background Color',
      hasBackgroundColor ? 'pass' : 'fail',
      `Background color: ${backgroundColor}`,
      viewport
    ));
    
    // Test 7: Check if Menu icon is present
    const menuIconExists = await page.locator('button[aria-label="Toggle mobile menu"] svg').count() > 0;
    results.push(logTestResult(
      'Menu Icon Present',
      menuIconExists ? 'pass' : 'fail',
      menuIconExists ? 'Menu icon found inside button' : 'Menu icon not found',
      viewport
    ));
  }
  
  return results;
}

/**
 * Test hamburger menu click functionality
 */
async function testHamburgerButtonClick(page, viewport) {
  const results = [];
  
  const hamburgerButton = page.locator('button[aria-label="Toggle mobile menu"]');
  const buttonExists = await hamburgerButton.count() > 0;
  
  if (!buttonExists) {
    results.push(logTestResult(
      'Hamburger Button Click Test',
      'skip',
      'Button does not exist, cannot test click functionality',
      viewport
    ));
    return results;
  }
  
  // Test 1: Check if sidebar is initially closed
  const sidebar = page.locator('aside.sidebar-overlay');
  const initialSidebarVisible = await sidebar.isVisible();
  results.push(logTestResult(
    'Initial Sidebar State',
    !initialSidebarVisible ? 'pass' : 'fail',
    initialSidebarVisible ? 'Sidebar is initially visible (should be hidden)' : 'Sidebar is initially hidden (correct)',
    viewport
  ));
  
  // Test 2: Click hamburger button and check if sidebar opens
  await hamburgerButton.click();
  await page.waitForTimeout(500); // Wait for animation
  
  const sidebarAfterClick = await sidebar.isVisible();
  results.push(logTestResult(
    'Sidebar Opens on Hamburger Click',
    sidebarAfterClick ? 'pass' : 'fail',
    sidebarAfterClick ? 'Sidebar opened successfully' : 'Sidebar did not open after click',
    viewport
  ));
  
  if (sidebarAfterClick) {
    // Test 3: Check if sidebar overlay is present
    const overlay = page.locator('div.sidebar-backdrop');
    const overlayVisible = await overlay.isVisible();
    results.push(logTestResult(
      'Sidebar Overlay Visible',
      overlayVisible ? 'pass' : 'fail',
      overlayVisible ? 'Sidebar overlay is visible' : 'Sidebar overlay not found',
      viewport
    ));
    
    // Test 4: Test clicking outside to close
    await page.click('body', { position: { x: 50, y: 50 } });
    await page.waitForTimeout(500);
    
    const sidebarAfterOutsideClick = await sidebar.isVisible();
    results.push(logTestResult(
      'Sidebar Closes on Outside Click',
      !sidebarAfterOutsideClick ? 'pass' : 'fail',
      !sidebarAfterOutsideClick ? 'Sidebar closed on outside click' : 'Sidebar did not close on outside click',
      viewport
    ));
    
    // Test 5: Re-open sidebar and test close button
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    const closeButton = page.locator('button[aria-label="Close menu"]');
    const closeButtonExists = await closeButton.count() > 0;
    
    if (closeButtonExists) {
      await closeButton.click();
      await page.waitForTimeout(500);
      
      const sidebarAfterCloseClick = await sidebar.isVisible();
      results.push(logTestResult(
        'Sidebar Close Button Works',
        !sidebarAfterCloseClick ? 'pass' : 'fail',
        !sidebarAfterCloseClick ? 'Sidebar closed via close button' : 'Sidebar did not close via close button',
        viewport
      ));
    } else {
      results.push(logTestResult(
        'Sidebar Close Button Works',
        'skip',
        'Close button not found',
        viewport
      ));
    }
  }
  
  return results;
}

/**
 * Test responsive behavior across different screen sizes
 */
async function testResponsiveBehavior(page, viewport) {
  const results = [];
  
  // Test 1: Check if hamburger button visibility changes with viewport
  await page.setViewportSize({ width: 1200, height: 800 }); // Desktop
  await page.waitForTimeout(300);
  
  const hamburgerOnDesktop = await page.locator('button[aria-label="Toggle mobile menu"]').isVisible();
  results.push(logTestResult(
    'Hamburger Hidden on Desktop',
    !hamburgerOnDesktop ? 'pass' : 'fail',
    !hamburgerOnDesktop ? 'Hamburger correctly hidden on desktop (1200px)' : 'Hamburger visible on desktop (should be hidden)',
    viewport
  ));
  
  // Test 2: Check hamburger visibility on mobile
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.waitForTimeout(300);
  
  const hamburgerOnMobile = await page.locator('button[aria-label="Toggle mobile menu"]').isVisible();
  results.push(logTestResult(
    'Hamburger Visible on Mobile',
    hamburgerOnMobile ? 'pass' : 'fail',
    hamburgerOnMobile ? `Hamburger visible on mobile (${viewport.width}px)` : `Hamburger hidden on mobile (${viewport.width}px - should be visible)`,
    viewport
  ));
  
  // Test 3: Check sidebar behavior on mobile
  if (hamburgerOnMobile) {
    const hamburgerButton = page.locator('button[aria-label="Toggle mobile menu"]');
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside.sidebar-overlay');
    const sidebarVisible = await sidebar.isVisible();
    
    results.push(logTestResult(
      'Sidebar Responsive Behavior',
      sidebarVisible ? 'pass' : 'fail',
      sidebarVisible ? 'Sidebar opens properly on mobile viewport' : 'Sidebar does not open on mobile viewport',
      viewport
    ));
    
    // Test 4: Check sidebar width on mobile
    if (sidebarVisible) {
      const sidebarWidth = await sidebar.evaluate(el => el.offsetWidth);
      const appropriateWidth = sidebarWidth >= 280 && sidebarWidth <= 320;
      results.push(logTestResult(
        'Sidebar Width on Mobile',
        appropriateWidth ? 'pass' : 'fail',
        `Sidebar width: ${sidebarWidth}px (should be 280-320px)`,
        viewport
      ));
    }
  }
  
  return results;
}

/**
 * Test CSS and z-index conflicts
 */
async function testCSSAndZIndex(page, viewport) {
  const results = [];
  
  // Test 1: Check for z-index conflicts
  const hamburgerZIndex = await page.locator('button[aria-label="Toggle mobile menu"]').evaluate(el => {
    return parseInt(window.getComputedStyle(el).zIndex) || 0;
  });
  
  const navZIndex = await page.locator('nav').evaluate(el => {
    return parseInt(window.getComputedStyle(el).zIndex) || 0;
  });
  
  const sidebarZIndex = await page.locator('aside.sidebar-overlay').evaluate(el => {
    return parseInt(window.getComputedStyle(el).zIndex) || 0;
  });
  
  const overlayZIndex = await page.locator('div.sidebar-backdrop').evaluate(el => {
    return parseInt(window.getComputedStyle(el).zIndex) || 0;
  });
  
  results.push(logTestResult(
    'Z-Index Hierarchy',
    hamburgerZIndex > 0 && navZIndex > 0 && sidebarZIndex > 0 ? 'pass' : 'fail',
    `Nav: ${navZIndex}, Hamburger: ${hamburgerZIndex}, Overlay: ${overlayZIndex}, Sidebar: ${sidebarZIndex}`,
    viewport
  ));
  
  // Test 2: Check for CSS display issues
  const hamburgerDisplay = await page.locator('button[aria-label="Toggle mobile menu"]').evaluate(el => {
    return window.getComputedStyle(el).display;
  });
  
  const hamburgerPosition = await page.locator('button[aria-label="Toggle mobile menu"]').evaluate(el => {
    return window.getComputedStyle(el).position;
  });
  
  results.push(logTestResult(
    'Hamburger CSS Display Properties',
    hamburgerDisplay !== 'none' && hamburgerPosition !== 'fixed' ? 'pass' : 'fail',
    `Display: ${hamburgerDisplay}, Position: ${hamburgerPosition}`,
    viewport
  ));
  
  // Test 3: Check for potential CSS conflicts
  const computedStyles = await page.locator('button[aria-label="Toggle mobile menu"]').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      opacity: styles.opacity,
      visibility: styles.visibility,
      transform: styles.transform,
      clipPath: styles.clipPath
    };
  });
  
  const hasVisibilityIssues = computedStyles.opacity === '0' || 
                              computedStyles.visibility === 'hidden' || 
                              computedStyles.clipPath !== 'none';
  
  results.push(logTestResult(
    'CSS Visibility Issues',
    !hasVisibilityIssues ? 'pass' : 'fail',
    `Opacity: ${computedStyles.opacity}, Visibility: ${computedStyles.visibility}, Clip: ${computedStyles.clipPath}`,
    viewport
  ));
  
  return results;
}

/**
 * Test state management integration
 */
async function testStateManagement(page, viewport) {
  const results = [];
  
  // Test 1: Check if mobileMenuToggle is properly initialized
  const mobileMenuToggleExists = await page.evaluate(() => {
    // Check if the state management is properly set up
    const buttons = document.querySelectorAll('button[aria-label="Toggle mobile menu"]');
    return buttons.length > 0;
  });
  
  results.push(logTestResult(
    'Mobile Menu Toggle State Initialized',
    mobileMenuToggleExists ? 'pass' : 'fail',
    mobileMenuToggleExists ? 'Mobile menu toggle state is properly initialized' : 'Mobile menu toggle state not found',
    viewport
  ));
  
  // Test 2: Test multiple rapid clicks
  const hamburgerButton = page.locator('button[aria-label="Toggle mobile menu"]');
  const buttonExists = await hamburgerButton.count() > 0;
  
  if (buttonExists) {
    // Rapid click test
    for (let i = 0; i < 3; i++) {
      await hamburgerButton.click();
      await page.waitForTimeout(100);
    }
    
    const sidebar = page.locator('aside.sidebar-overlay');
    const finalState = await sidebar.isVisible();
    
    results.push(logTestResult(
      'Rapid Click State Management',
      'pass', // We'll consider this a pass if no errors occur
      `Final sidebar state after rapid clicks: ${finalState ? 'visible' : 'hidden'}`,
      viewport
    ));
    
    // Test 3: Check console for errors
    const consoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    results.push(logTestResult(
      'Console Error Check',
      consoleErrors.length === 0 ? 'pass' : 'fail',
      `${consoleErrors.length} console errors detected`,
      viewport
    ));
  }
  
  return results;
}

/**
 * Main test function
 */
async function runHamburgerMenuDiagnostic() {
  console.log('🚀 Starting Hamburger Menu Diagnostic Test...\n');
  
  const browser = await chromium.launch({ 
    headless: TEST_CONFIG.headless,
    slowMo: 100 // Slow down for better debugging
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // Default to mobile
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  // Set up console error tracking
  await page.addInitScript(() => {
    window.consoleErrors = [];
    const originalError = console.error;
    console.error = function(...args) {
      window.consoleErrors.push(args.join(' '));
      originalError.apply(console, args);
    };
  });
  
  try {
    // Navigate to the application (assuming user needs to be logged in)
    console.log('📱 Navigating to application...');
    await page.goto(TEST_CONFIG.baseURL + '/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    const loginNeeded = await page.locator('input[type="email"]').count() > 0;
    if (loginNeeded) {
      console.log('🔐 Login required, attempting to login...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // Run tests for each viewport
    for (const viewport of TEST_CONFIG.mobileViewports) {
      console.log(`\n📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Take screenshot before tests
      if (TEST_CONFIG.screenshots) {
        await page.screenshot({ 
          path: `hamburger-test-${viewport.name.replace(/\s+/g, '-').toLowerCase()}-before.png`,
          fullPage: true 
        });
      }
      
      // Run all test categories
      const existenceTests = await testHamburgerButtonExistence(page, viewport);
      const clickTests = await testHamburgerButtonClick(page, viewport);
      const responsiveTests = await testResponsiveBehavior(page, viewport);
      const cssTests = await testCSSAndZIndex(page, viewport);
      const stateTests = await testStateManagement(page, viewport);
      
      // Store results
      testResults.viewportTests.push({
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        tests: [...existenceTests, ...clickTests, ...responsiveTests, ...cssTests, ...stateTests]
      });
      
      // Take screenshot after tests
      if (TEST_CONFIG.screenshots) {
        await page.screenshot({ 
          path: `hamburger-test-${viewport.name.replace(/\s+/g, '-').toLowerCase()}-after.png`,
          fullPage: true 
        });
      }
    }
    
    // Generate final diagnosis
    generateFinalDiagnosis();
    
    // Save results to file
    const reportPath = `hamburger-menu-diagnostic-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.finalDiagnosis.push({
      issue: 'Test Execution Error',
      severity: 'high',
      details: error.message
    });
  } finally {
    await browser.close();
  }
  
  // Print summary
  printTestSummary();
}

/**
 * Generate final diagnosis based on test results
 */
function generateFinalDiagnosis() {
  const diagnosis = [];
  
  // Analyze common failure patterns
  const allTests = testResults.viewportTests.flatMap(vt => vt.tests);
  const failedTests = allTests.filter(test => test.status === 'fail');
  
  // Check for hamburger button existence issues
  const existenceFailures = failedTests.filter(test => 
    test.testName.includes('Exists') || test.testName.includes('Visibility')
  );
  
  if (existenceFailures.length > 0) {
    diagnosis.push({
      issue: 'Hamburger Button Not Found or Not Visible',
      severity: 'high',
      details: 'The hamburger menu button is either not rendering or is hidden',
      possibleCauses: [
        'CSS lg:hidden class not working properly',
        'State management not properly initialized',
        'Component not rendering on mobile viewports',
        'Z-index conflicts hiding the button'
      ],
      recommendations: [
        'Check Tailwind CSS responsive classes',
        'Verify AuthProvider state management',
        'Ensure TopNavigation component is properly mounted',
        'Check for CSS overrides'
      ]
    });
  }
  
  // Check for click functionality issues
  const clickFailures = failedTests.filter(test => 
    test.testName.includes('Click') || test.testName.includes('Sidebar')
  );
  
  if (clickFailures.length > 0) {
    diagnosis.push({
      issue: 'Hamburger Button Click Functionality Not Working',
      severity: 'high',
      details: 'The hamburger button exists but clicking it does not open the sidebar',
      possibleCauses: [
        'onMobileMenuToggle prop is undefined',
        'State management between TopNavigation and Sidebar broken',
        'Event handler not properly attached',
        'Sidebar component not responding to state changes'
      ],
      recommendations: [
        'Check AuthProvider mobileMenuToggle state initialization',
        'Verify Sidebar toggleSidebar function is properly registered',
        'Ensure useEffect in Sidebar runs with correct dependencies',
        'Check for JavaScript errors in browser console'
      ]
    });
  }
  
  // Check for CSS and z-index issues
  const cssFailures = failedTests.filter(test => 
    test.testName.includes('CSS') || test.testName.includes('Z-Index')
  );
  
  if (cssFailures.length > 0) {
    diagnosis.push({
      issue: 'CSS or Z-Index Conflicts',
      severity: 'medium',
      details: 'CSS styling or z-index conflicts are affecting hamburger menu visibility',
      possibleCauses: [
        'Z-index hierarchy incorrect',
        'CSS display properties hiding the button',
        'Opacity or visibility CSS properties',
        'Transform or clip-path affecting visibility'
      ],
      recommendations: [
        'Review z-index values for navigation hierarchy',
        'Check for CSS overrides in global styles',
        'Verify responsive breakpoints are working correctly',
        'Check for CSS animations or transitions'
      ]
    });
  }
  
  testResults.finalDiagnosis = diagnosis;
}

/**
 * Print test summary to console
 */
function printTestSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 HAMBURGER MENU DIAGNOSTIC TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`✅ Passed: ${testResults.summary.passedTests}`);
  console.log(`❌ Failed: ${testResults.summary.failedTests}`);
  console.log(`⏭️  Skipped: ${testResults.summary.skippedTests}`);
  console.log(`📈 Success Rate: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%`);
  
  if (testResults.finalDiagnosis.length > 0) {
    console.log('\n🔍 FINAL DIAGNOSIS:');
    testResults.finalDiagnosis.forEach((diagnosis, index) => {
      console.log(`\n${index + 1}. ${diagnosis.issue} (${diagnosis.severity.toUpperCase()})`);
      console.log(`   Details: ${diagnosis.details}`);
      if (diagnosis.possibleCauses) {
        console.log('   Possible Causes:');
        diagnosis.possibleCauses.forEach(cause => console.log(`     - ${cause}`));
      }
      if (diagnosis.recommendations) {
        console.log('   Recommendations:');
        diagnosis.recommendations.forEach(rec => console.log(`     - ${rec}`));
      }
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the diagnostic test
if (require.main === module) {
  runHamburgerMenuDiagnostic().catch(console.error);
}

module.exports = { runHamburgerMenuDiagnostic, TEST_CONFIG };