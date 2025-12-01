const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = path.join(__dirname, 'strategy-deletion-test-screenshots');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
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
    details
  });
}

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Main test function
async function testStrategyDeletionDialog() {
  console.log('🚀 Starting Strategy Deletion Dialog Test\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Navigate to strategies page
    console.log('\n📋 Test 1: Navigate to Strategies Page');
    await page.goto(`${BASE_URL}/strategies`);
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load completely
    await page.waitForTimeout(3000);
    
    // Check if we're on strategies page
    const pageTitle = await page.$eval('h1', el => el.textContent);
    const isStrategiesPage = pageTitle && pageTitle.includes('Trading Strategies');
    logTest('Navigate to Strategies Page', isStrategiesPage, 
      isStrategiesPage ? 'Successfully navigated to strategies page' : 'Failed to navigate to strategies page');
    
    await takeScreenshot(page, 'strategies-page');
    
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
    
    // Wait for either strategy cards or "No Strategies Yet" message
    try {
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
      
      for (let i = 0; i < Math.min(strategyCards.length, 5); i++) {
        const card = strategyCards[i];
        
        try {
          // Look for trades count in the card
          const tradesElement = await card.$('.text-white');
          if (tradesElement) {
            const tradesText = await tradesElement.textContent();
            
            if (tradesText && tradesText.includes('Trades:')) {
              const tradesMatch = tradesText.match(/Trades:\s*(\d+)/);
              if (tradesMatch) {
                const tradesCount = parseInt(tradesMatch[1]);
                if (tradesCount === 0 && !strategyWithoutTrades) {
                  strategyWithoutTrades = { card, index: i, tradesCount: 0 };
                  console.log(`Found strategy without trades: ${tradesCount} trades`);
                } else if (tradesCount > 0 && !strategyWithTrades) {
                  strategyWithTrades = { card, index: i, tradesCount };
                  console.log(`Found strategy with trades: ${tradesCount} trades`);
                }
              }
            }
          }
        } catch (error) {
          console.log(`Error processing strategy card ${i}:`, error.message);
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
      
      // Test 7: Test dialog functionality
      console.log('\n📋 Test 7: Test Dialog Functionality');
      const testStrategy = strategyWithoutTrades || strategyWithTrades;
      if (testStrategy) {
        await testDialogFunctionality(page, testStrategy);
      }
      
    } catch (error) {
      logTest('Strategies Load', false, `Error waiting for strategies: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    logTest('Test Execution', false, `Error during test execution: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Test deletion dialog for a specific strategy
async function testDeletionDialogForStrategy(page, strategy, type) {
  const { card, tradesCount } = strategy;
  
  try {
    // Click delete button
    const deleteButton = await card.$('button[title*="Delete"]');
    if (!deleteButton) {
      logTest(`Delete Button Available (${type})`, false, 'Delete button not found');
      return;
    }
    
    await deleteButton.click();
    await page.waitForTimeout(1000); // Wait for dialog to appear
    
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
    
    // Close dialog
    await page.click('button[aria-label="Close dialog"]');
    await page.waitForTimeout(500);
    
    const dialogClosed = !(await page.isVisible('#strategy-deletion-dialog'));
    logTest(`Dialog Closes (${type})`, dialogClosed, 
      dialogClosed ? 'Dialog closed successfully' : 'Dialog did not close');
      
  } catch (error) {
    logTest(`Dialog Test Error (${type})`, false, `Error testing dialog: ${error.message}`);
  }
}

// Test dialog functionality
async function testDialogFunctionality(page, strategy) {
  const { card } = strategy;
  
  try {
    // Open dialog
    const deleteButton = await card.$('button[title*="Delete"]');
    await deleteButton.click();
    await page.waitForTimeout(1000);
    
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
    
  } catch (error) {
    logTest('Dialog Functionality Error', false, `Error testing dialog functionality: ${error.message}`);
  }
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
    details: testResults.details
  };
  
  const reportPath = path.join(__dirname, 'simple-strategy-deletion-test-report.json');
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

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testStrategyDeletionDialog, generateTestReport };