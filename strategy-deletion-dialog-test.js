const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = path.join(__dirname, 'strategy-deletion-dialog-test-screenshots');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  screenshots: []
};

// Helper function to log test results
function logTest(testName, passed, details = '', screenshotPath = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED - ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    screenshot: screenshotPath
  });
  
  if (screenshotPath) {
    testResults.screenshots.push(screenshotPath);
  }
}

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Main test function
async function testStrategyDeletionDialog() {
  console.log('🚀 Starting Strategy Deletion Dialog Comprehensive Test\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Navigate to strategies page
    console.log('\n📋 Test 1: Navigate to Strategies Page');
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the strategies page
    const pageTitle = await page.textContent('h1');
    const isStrategiesPage = pageTitle && pageTitle.includes('Trading Strategies');
    logTest('Navigate to Strategies Page', isStrategiesPage, 
      isStrategiesPage ? 'Successfully navigated to strategies page' : 'Failed to navigate to strategies page');
    
    await takeScreenshot(page, 'strategies-page-loaded');
    
    // Test 2: Check if user is authenticated
    console.log('\n📋 Test 2: Check Authentication Status');
    const authRequired = await page.isVisible('text=Authentication Required');
    if (authRequired) {
      logTest('User Authentication', false, 'User is not authenticated - cannot proceed with tests');
      return;
    } else {
      logTest('User Authentication', true, 'User is authenticated');
    }
    
    // Test 3: Wait for strategies to load
    console.log('\n📋 Test 3: Wait for Strategies to Load');
    await page.waitForSelector('.card-unified', { timeout: 10000 });
    
    const strategyCards = await page.$$('.card-unified');
    const hasStrategies = strategyCards.length > 0;
    logTest('Strategies Load', hasStrategies, 
      hasStrategies ? `Found ${strategyCards.length} strategy cards` : 'No strategy cards found');
    
    if (!hasStrategies) {
      logTest('Create Test Strategy', false, 'No strategies found - need to create test strategies first');
      return;
    }
    
    await takeScreenshot(page, 'strategies-loaded');
    
    // Test 4: Identify strategies with and without trades
    console.log('\n📋 Test 4: Identify Test Strategies');
    let strategyWithoutTrades = null;
    let strategyWithTrades = null;
    
    for (let i = 0; i < strategyCards.length; i++) {
      const card = strategyCards[i];
      const tradesText = await card.$eval('.text-white', el => el.textContent);
      
      if (tradesText && tradesText.includes('Trades:')) {
        const tradesMatch = tradesText.match(/Trades:\s*(\d+)/);
        if (tradesMatch) {
          const tradesCount = parseInt(tradesMatch[1]);
          if (tradesCount === 0 && !strategyWithoutTrades) {
            strategyWithoutTrades = { card, index: i, tradesCount: 0 };
          } else if (tradesCount > 0 && !strategyWithTrades) {
            strategyWithTrades = { card, index: i, tradesCount };
          }
        }
      }
    }
    
    logTest('Find Strategy Without Trades', !!strategyWithoutTrades, 
      strategyWithoutTrades ? 'Found strategy with 0 trades' : 'No strategy without trades found');
    
    logTest('Find Strategy With Trades', !!strategyWithTrades, 
      strategyWithTrades ? `Found strategy with ${strategyWithTrades.tradesCount} trades` : 'No strategy with trades found');
    
    // Test 5: Test deletion dialog for strategy without trades
    if (strategyWithoutTrades) {
      console.log('\n📋 Test 5: Test Deletion Dialog - Strategy Without Trades');
      await testDeletionDialogForStrategy(page, strategyWithoutTrades, 'without-trades');
    }
    
    // Test 6: Test deletion dialog for strategy with trades
    if (strategyWithTrades) {
      console.log('\n📋 Test 6: Test Deletion Dialog - Strategy With Trades');
      await testDeletionDialogForStrategy(page, strategyWithTrades, 'with-trades');
    }
    
    // Test 7: Test dialog functionality (cancel, ESC, click outside)
    console.log('\n📋 Test 7: Test Dialog Functionality');
    if (strategyWithoutTrades || strategyWithTrades) {
      const testStrategy = strategyWithoutTrades || strategyWithTrades;
      await testDialogFunctionality(page, testStrategy);
    }
    
    // Test 8: Test accessibility features
    console.log('\n📋 Test 8: Test Accessibility Features');
    if (strategyWithoutTrades || strategyWithTrades) {
      const testStrategy = strategyWithoutTrades || strategyWithTrades;
      await testAccessibilityFeatures(page, testStrategy);
    }
    
    // Test 9: Test responsive design
    console.log('\n📋 Test 9: Test Responsive Design');
    await testResponsiveDesign(page, strategyWithoutTrades || strategyWithTrades);
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    logTest('Test Execution', false, `Error during test execution: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Test deletion dialog for a specific strategy
async function testDeletionDialogForStrategy(page, strategy, type) {
  const { card, index, tradesCount } = strategy;
  
  // Click the delete button
  const deleteButton = await card.$('button[title*="Delete"]');
  if (!deleteButton) {
    logTest(`Delete Button Available (${type})`, false, 'Delete button not found');
    return;
  }
  
  await deleteButton.click();
  await page.waitForTimeout(500); // Wait for dialog to appear
  
  // Check if dialog appeared
  const dialogVisible = await page.isVisible('#strategy-deletion-dialog');
  logTest(`Dialog Appears (${type})`, dialogVisible, 
    dialogVisible ? 'Deletion dialog appeared successfully' : 'Deletion dialog did not appear');
  
  if (!dialogVisible) return;
  
  await takeScreenshot(page, `dialog-appeared-${type}`);
  
  // Check trade count display
  if (type === 'without-trades') {
    const noTradesMessage = await page.isVisible('text=This strategy has no associated trades');
    logTest(`No Trades Message (${type})`, noTradesMessage, 
      noTradesMessage ? 'Correct message for strategy without trades' : 'Incorrect message for strategy without trades');
  } else {
    const tradesMessageVisible = await page.isVisible(`text=${tradesCount} trade`);
    logTest(`Trades Count Display (${type})`, tradesMessageVisible, 
      tradesMessageVisible ? `Correctly shows ${tradesCount} trades` : 'Trades count not displayed correctly');
  }
  
  // Test deletion options
  if (type === 'with-trades') {
    const deleteTradesOption = await page.isVisible('text=Yes, delete trades');
    const keepTradesOption = await page.isVisible('text=No, keep trades');
    
    logTest(`Deletion Options Available (${type})`, deleteTradesOption && keepTradesOption, 
      'Both deletion options are available for strategy with trades');
  }
  
  // Close dialog for now (we'll test actual deletion in separate tests)
  await page.click('button[aria-label="Close dialog"]');
  await page.waitForTimeout(500);
  
  const dialogClosed = !(await page.isVisible('#strategy-deletion-dialog'));
  logTest(`Dialog Closes (${type})`, dialogClosed, 
    dialogClosed ? 'Dialog closed successfully' : 'Dialog did not close');
}

// Test dialog functionality (cancel, ESC, click outside)
async function testDialogFunctionality(page, strategy) {
  const { card } = strategy;
  
  // Open dialog
  const deleteButton = await card.$('button[title*="Delete"]');
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  // Test 1: Cancel button
  const cancelButton = await page.$('text=Cancel');
  if (cancelButton) {
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    const dialogClosed = !(await page.isVisible('#strategy-deletion-dialog'));
    logTest('Cancel Button Closes Dialog', dialogClosed, 
      dialogClosed ? 'Cancel button successfully closes dialog' : 'Cancel button did not close dialog');
  } else {
    logTest('Cancel Button Available', false, 'Cancel button not found');
  }
  
  // Reopen dialog for ESC test
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  // Test 2: ESC key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  const dialogClosedAfterEsc = !(await page.isVisible('#strategy-deletion-dialog'));
  logTest('ESC Key Closes Dialog', dialogClosedAfterEsc, 
    dialogClosedAfterEsc ? 'ESC key successfully closes dialog' : 'ESC key did not close dialog');
  
  // Reopen dialog for click outside test
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  // Test 3: Click outside dialog
  const backdrop = await page.$('.fixed.inset-0');
  if (backdrop) {
    await backdrop.click();
    await page.waitForTimeout(500);
    
    const dialogClosedAfterClick = !(await page.isVisible('#strategy-deletion-dialog'));
    logTest('Click Outside Closes Dialog', dialogClosedAfterClick, 
      dialogClosedAfterClick ? 'Click outside successfully closes dialog' : 'Click outside did not close dialog');
  } else {
    logTest('Backdrop Available', false, 'Dialog backdrop not found');
  }
}

// Test accessibility features
async function testAccessibilityFeatures(page, strategy) {
  const { card } = strategy;
  
  // Open dialog
  const deleteButton = await card.$('button[title*="Delete"]');
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  // Test ARIA attributes
  const dialog = await page.$('#strategy-deletion-dialog');
  const hasAriaModal = await dialog.getAttribute('aria-modal');
  const hasAriaLabelledBy = await dialog.getAttribute('aria-labelledby');
  const hasAriaDescribedBy = await dialog.getAttribute('aria-describedby');
  const hasRole = await dialog.getAttribute('role');
  
  logTest('Dialog Has ARIA Modal', hasAriaModal === 'true', 
    hasAriaModal === 'true' ? 'Dialog has proper aria-modal attribute' : 'Missing aria-modal attribute');
  
  logTest('Dialog Has ARIA Labelled By', !!hasAriaLabelledBy, 
    hasAriaLabelledBy ? 'Dialog has proper aria-labelledby attribute' : 'Missing aria-labelledby attribute');
  
  logTest('Dialog Has ARIA Described By', !!hasAriaDescribedBy, 
    hasAriaDescribedBy ? 'Dialog has proper aria-describedby attribute' : 'Missing aria-describedby attribute');
  
  logTest('Dialog Has Role', hasRole === 'dialog', 
    hasRole === 'dialog' ? 'Dialog has proper role attribute' : 'Missing or incorrect role attribute');
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  
  const focusedElement = await page.evaluate(() => document.activeElement.tagName);
  logTest('Keyboard Navigation', focusedElement === 'BUTTON', 
    focusedElement === 'BUTTON' ? 'Keyboard navigation works properly' : 'Keyboard navigation issue detected');
  
  // Test focus management
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  // Reopen and test Tab navigation through dialog elements
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  let tabCount = 0;
  let foundCloseButton = false;
  let foundCancelButton = false;
  let foundDeleteButton = false;
  
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const focusedText = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.textContent.trim() : '';
    });
    
    if (focusedText.includes('Close') || focusedText === '×') foundCloseButton = true;
    if (focusedText === 'Cancel') foundCancelButton = true;
    if (focusedText.includes('Delete Strategy')) foundDeleteButton = true;
    
    tabCount++;
  }
  
  logTest('Tab Navigation Works', foundCloseButton && foundCancelButton && foundDeleteButton, 
    'All dialog elements are reachable via Tab navigation');
  
  // Close dialog
  await page.keyboard.press('Escape');
}

// Test responsive design
async function testResponsiveDesign(page, strategy) {
  const { card } = strategy;
  
  // Test desktop view
  await page.setViewportSize({ width: 1280, height: 720 });
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  const dialogDesktopVisible = await page.isVisible('#strategy-deletion-dialog');
  logTest('Dialog Visible on Desktop', dialogDesktopVisible, 
    dialogDesktopVisible ? 'Dialog displays correctly on desktop' : 'Dialog not visible on desktop');
  
  await takeScreenshot(page, 'dialog-desktop-view');
  
  // Test tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  
  const dialogTabletVisible = await page.isVisible('#strategy-deletion-dialog');
  logTest('Dialog Visible on Tablet', dialogTabletVisible, 
    dialogTabletVisible ? 'Dialog displays correctly on tablet' : 'Dialog not visible on tablet');
  
  await takeScreenshot(page, 'dialog-tablet-view');
  
  // Test mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  
  const dialogMobileVisible = await page.isVisible('#strategy-deletion-dialog');
  logTest('Dialog Visible on Mobile', dialogMobileVisible, 
    dialogMobileVisible ? 'Dialog displays correctly on mobile' : 'Dialog not visible on mobile');
  
  await takeScreenshot(page, 'dialog-mobile-view');
  
  // Close dialog
  await page.keyboard.press('Escape');
}

// Generate test report
function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    details: testResults.details,
    screenshots: testResults.screenshots
  };
  
  const reportPath = path.join(__dirname, 'strategy-deletion-dialog-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Test Report Generated:');
  console.log(`   Total Tests: ${report.summary.total}`);
  console.log(`   Passed: ${report.summary.passed}`);
  console.log(`   Failed: ${report.summary.failed}`);
  console.log(`   Pass Rate: ${report.summary.passRate}`);
  console.log(`   Report saved to: ${reportPath}`);
  console.log(`   Screenshots saved to: ${SCREENSHOT_DIR}`);
  
  return report;
}

// Run tests and generate report
async function runTests() {
  await testStrategyDeletionDialog();
  const report = generateTestReport();
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testStrategyDeletionDialog, generateTestReport };