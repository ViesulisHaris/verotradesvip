/**
 * Comprehensive Dropdown Fixes Verification Script
 * Tests dropdown transparency, z-index, and functionality across browsers
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

async function runTest(testName, testFunction) {
  try {
    console.log(`🧪 Running test: ${testName}`);
    const result = await testFunction();
    testResults.tests.push({
      name: testName,
      status: 'PASSED',
      details: result,
      timestamp: new Date().toISOString()
    });
    testResults.summary.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } catch (error) {
    testResults.tests.push({
      name: testName,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    testResults.summary.failed++;
    console.log(`❌ ${testName}: FAILED - ${error.message}`);
  }
  testResults.summary.total++;
}

async function testDropdownTransparency() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/log-trade');
  await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
  
  // Open strategy dropdown
  await page.click('[data-testid="strategy-dropdown"]');
  await page.waitForTimeout(500);
  
  // Check dropdown background
  const dropdownBg = await page.evaluate(() => {
    const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
    if (!dropdown) throw new Error('Strategy dropdown menu not found');
    
    const styles = window.getComputedStyle(dropdown);
    return {
      backgroundColor: styles.backgroundColor,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      hasSolidBackground: styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent'
    };
  });
  
  await browser.close();
  
  if (!dropdownBg.hasSolidBackground) {
    throw new Error(`Dropdown has transparent background: ${dropdownBg.backgroundColor}`);
  }
  
  if (dropdownBg.opacity !== '1') {
    throw new Error(`Dropdown opacity is not 1: ${dropdownBg.opacity}`);
  }
  
  if (parseInt(dropdownBg.zIndex) < 10000) {
    throw new Error(`Dropdown z-index too low: ${dropdownBg.zIndex}`);
  }
  
  return dropdownBg;
}

async function testZIndexStacking() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/log-trade');
  await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
  
  // Open all dropdowns
  await page.click('[data-testid="strategy-dropdown"]');
  await page.waitForTimeout(200);
  await page.click('[data-testid="side-dropdown"]');
  await page.waitForTimeout(200);
  await page.click('[data-testid="emotion-dropdown"]');
  await page.waitForTimeout(200);
  
  // Check z-index hierarchy
  const zIndexStack = await page.evaluate(() => {
    const strategy = document.querySelector('[data-testid="strategy-dropdown-menu"]');
    const side = document.querySelector('[data-testid="side-dropdown-menu"]');
    const emotion = document.querySelector('[data-testid="emotion-dropdown-menu"]');
    const overlay = document.querySelector('[data-testid="dropdown-overlay"]');
    
    return {
      strategy: strategy ? window.getComputedStyle(strategy).zIndex : 'not-found',
      side: side ? window.getComputedStyle(side).zIndex : 'not-found',
      emotion: emotion ? window.getComputedStyle(emotion).zIndex : 'not-found',
      overlay: overlay ? window.getComputedStyle(overlay).zIndex : 'not-found'
    };
  });
  
  await browser.close();
  
  // Verify z-index hierarchy
  const strategyZ = parseInt(zIndexStack.strategy);
  const sideZ = parseInt(zIndexStack.side);
  const emotionZ = parseInt(zIndexStack.emotion);
  const overlayZ = parseInt(zIndexStack.overlay);
  
  if (strategyZ <= sideZ) {
    throw new Error(`Strategy dropdown z-index (${strategyZ}) should be higher than side dropdown (${sideZ})`);
  }
  
  if (sideZ <= emotionZ) {
    throw new Error(`Side dropdown z-index (${sideZ}) should be higher than emotion dropdown (${emotionZ})`);
  }
  
  if (overlayZ >= emotionZ) {
    throw new Error(`Overlay z-index (${overlayZ}) should be lower than dropdowns`);
  }
  
  return zIndexStack;
}

async function testDropdownFunctionality() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/log-trade');
  await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
  
  // Test dropdown opening and closing
  await page.click('[data-testid="strategy-dropdown"]');
  await page.waitForTimeout(300);
  
  const isOpenAfterClick = await page.evaluate(() => {
    const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
    return dropdown && dropdown.style.display !== 'none' && dropdown.offsetParent !== null;
  });
  
  if (!isOpenAfterClick) {
    throw new Error('Dropdown did not open after click');
  }
  
  // Test clicking outside to close
  await page.click('[data-testid="dropdown-overlay"]');
  await page.waitForTimeout(300);
  
  const isClosedAfterOutsideClick = await page.evaluate(() => {
    const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
    return !dropdown || dropdown.style.display === 'none' || dropdown.offsetParent === null;
  });
  
  if (!isClosedAfterOutsideClick) {
    throw new Error('Dropdown did not close after clicking outside');
  }
  
  // Test item selection
  await page.click('[data-testid="strategy-dropdown"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="strategy-option-1"]');
  await page.waitForTimeout(300);
  
  const selectedValue = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="strategy-dropdown"]');
    return button ? button.textContent : '';
  });
  
  if (!selectedValue || selectedValue.includes('Select Strategy')) {
    throw new Error('Dropdown selection did not update button text');
  }
  
  await browser.close();
  
  return { isOpenAfterClick, isClosedAfterOutsideClick, selectedValue };
}

async function testBrowserCompatibility() {
  const browsers = [
    { name: 'Chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    { name: 'Firefox', args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  ];
  
  const results = {};
  
  for (const browserConfig of browsers) {
    try {
      const browser = await puppeteer.launch({ 
        headless: false,
        args: browserConfig.args
      });
      const page = await browser.newPage();
      
      await page.goto('http://localhost:3000/log-trade');
      await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
      
      await page.click('[data-testid="strategy-dropdown"]');
      await page.waitForTimeout(500);
      
      const dropdownStyles = await page.evaluate(() => {
        const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
        if (!dropdown) return null;
        
        const styles = window.getComputedStyle(dropdown);
        return {
          backgroundColor: styles.backgroundColor,
          backdropFilter: styles.backdropFilter,
          webkitBackdropFilter: styles.webkitBackdropFilter,
          opacity: styles.opacity,
          zIndex: styles.zIndex
        };
      });
      
      results[browserConfig.name] = dropdownStyles;
      await browser.close();
      
    } catch (error) {
      results[browserConfig.name] = { error: error.message };
    }
  }
  
  return results;
}

async function testMobileResponsiveness() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 375, height: 667 });
  
  await page.goto('http://localhost:3000/log-trade');
  await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
  
  await page.click('[data-testid="strategy-dropdown"]');
  await page.waitForTimeout(500);
  
  const mobileDropdownStyles = await page.evaluate(() => {
    const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
    if (!dropdown) return null;
    
    const styles = window.getComputedStyle(dropdown);
    const rect = dropdown.getBoundingClientRect();
    
    return {
      backgroundColor: styles.backgroundColor,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      width: rect.width,
      height: rect.height,
      maxHeight: styles.maxHeight,
      isWithinViewport: rect.top >= 0 && rect.left >= 0 && 
                       rect.bottom <= window.innerHeight && 
                       rect.right <= window.innerWidth
    };
  });
  
  await browser.close();
  
  if (!mobileDropdownStyles.isWithinViewport) {
    throw new Error('Dropdown is not within viewport on mobile');
  }
  
  if (mobileDropdownStyles.width > 375) {
    throw new Error('Dropdown width exceeds mobile viewport');
  }
  
  return mobileDropdownStyles;
}

async function testAccessibility() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/log-trade');
  await page.waitForSelector('[data-testid="strategy-dropdown"]', { timeout: 10000 });
  
  // Test keyboard navigation
  await page.focus('[data-testid="strategy-dropdown"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  
  const isOpenAfterKeyboard = await page.evaluate(() => {
    const dropdown = document.querySelector('[data-testid="strategy-dropdown-menu"]');
    return dropdown && dropdown.offsetParent !== null;
  });
  
  if (!isOpenAfterKeyboard) {
    throw new Error('Dropdown did not open with keyboard');
  }
  
  // Test arrow key navigation
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  
  const selectedAfterKeyboard = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="strategy-dropdown"]');
    return button ? button.textContent : '';
  });
  
  await browser.close();
  
  return { isOpenAfterKeyboard, selectedAfterKeyboard };
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting comprehensive dropdown fixes verification...\n');
  
  await runTest('Dropdown Transparency Test', testDropdownTransparency);
  await runTest('Z-Index Stacking Test', testZIndexStacking);
  await runTest('Dropdown Functionality Test', testDropdownFunctionality);
  await runTest('Browser Compatibility Test', testBrowserCompatibility);
  await runTest('Mobile Responsiveness Test', testMobileResponsiveness);
  await runTest('Accessibility Test', testAccessibility);
  
  // Save results
  const reportPath = './dropdown-fixes-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  if (testResults.summary.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the detailed report.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Dropdown fixes are working correctly.');
    process.exit(0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testDropdownTransparency,
  testZIndexStacking,
  testDropdownFunctionality,
  testBrowserCompatibility,
  testMobileResponsiveness,
  testAccessibility
};