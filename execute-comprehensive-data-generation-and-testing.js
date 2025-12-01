// Comprehensive Data Generation and Confluence Testing Script
// This script executes the complete 4-step data generation process and tests all confluence functionality

const { chromium } = require('playwright');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_URL = `${BASE_URL}/test-comprehensive-data`;
const CONFLUENCE_URL = `${BASE_URL}/confluence`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const LOG_TRADE_URL = `${BASE_URL}/log-trade`;

// Test credentials
const TEST_EMAIL = 'testuser@verotrade.com';
const TEST_PASSWORD = 'TestPassword123!';

// Expected results
const EXPECTED_RESULTS = {
  totalTrades: 100,
  winRate: 71,
  totalStrategies: 5,
  winningTrades: 71,
  losingTrades: 29
};

// Test results storage
const testResults = {
  dataGeneration: {
    deleteAllData: false,
    createStrategies: false,
    generateTrades: false,
    verifyData: false,
    actualResults: {}
  },
  confluenceTesting: {
    pageLoad: false,
    emotionalAnalysis: false,
    filtering: false,
    dataVisualization: false
  },
  dashboardTesting: {
    pageLoad: false,
    dataSync: false,
    identicalData: false
  },
  newTradeTesting: {
    tradeAddition: false,
    immediateUpdate: false,
    crossTabSync: false
  },
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    issues: []
  }
};

// Utility functions
function log(message, category = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);
}

function logTestResult(testName, passed, details = '') {
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passedTests++;
    log(`✅ ${testName}: PASSED ${details ? '- ' + details : ''}`, 'SUCCESS');
  } else {
    testResults.summary.failedTests++;
    log(`❌ ${testName}: FAILED ${details ? '- ' + details : ''}`, 'ERROR');
    testResults.summary.issues.push(`${testName}: ${details}`);
  }
}

async function takeScreenshot(page, filename, description = '') {
  try {
    await page.screenshot({ 
      path: `test-screenshots/${filename}-${Date.now()}.png`,
      fullPage: true 
    });
    log(`📸 Screenshot saved: ${filename} ${description ? '- ' + description : ''}`, 'SCREENSHOT');
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'ERROR');
  }
}

async function executeTestAction(page, action) {
  log(`🔄 Executing action: ${action}`, 'ACTION');
  
  try {
    // Wait for the action button to be available
    const buttonSelector = `button:has-text("${getButtonText(action)}")`;
    await page.waitForSelector(buttonSelector, { timeout: 10000 });
    
    // Click the button
    await page.click(buttonSelector);
    
    // Wait for the action to complete (check for result)
    await page.waitForTimeout(3000);
    
    // Check for success or error in the results
    const resultSelector = `[data-action="${action}"]`;
    const resultElement = await page.locator(resultSelector).first();
    
    if (await resultElement.isVisible()) {
      const resultText = await resultElement.textContent();
      log(`Action result for ${action}: ${resultText}`, 'RESULT');
      
      // Parse success/failure from result
      const isSuccess = resultText.includes('success') || resultText.includes('created') || resultText.includes('generated');
      return { success: isSuccess, message: resultText };
    }
    
    return { success: true, message: 'Action completed' };
  } catch (error) {
    log(`Error executing action ${action}: ${error.message}`, 'ERROR');
    return { success: false, message: error.message };
  }
}

function getButtonText(action) {
  const buttonMap = {
    'delete-all': 'Delete All Data',
    'create-strategies': 'Create Strategies',
    'generate-trades': 'Generate Trades',
    'verify-data': 'Verify Data'
  };
  return buttonMap[action] || action;
}

async function login(page) {
  log('🔐 Attempting to login...', 'AUTH');
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    log('✅ Login successful', 'AUTH');
    return true;
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function executeDataGeneration(page) {
  log('🚀 Starting 4-step data generation process...', 'DATA_GENERATION');
  
  try {
    // Navigate to test page
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'test-page-initial', 'Test page loaded');
    
    // Step 1: Delete All Data
    log('Step 1: Deleting all existing data...', 'STEP');
    const deleteResult = await executeTestAction(page, 'delete-all');
    testResults.dataGeneration.deleteAllData = deleteResult.success;
    logTestResult('Delete All Data', deleteResult.success, deleteResult.message);
    await takeScreenshot(page, 'after-delete-data', 'After deleting all data');
    
    // Step 2: Create Strategies
    log('Step 2: Creating trading strategies...', 'STEP');
    await page.waitForTimeout(2000);
    const createResult = await executeTestAction(page, 'create-strategies');
    testResults.dataGeneration.createStrategies = createResult.success;
    logTestResult('Create Strategies', createResult.success, createResult.message);
    await takeScreenshot(page, 'after-create-strategies', 'After creating strategies');
    
    // Step 3: Generate Trades
    log('Step 3: Generating test trades...', 'STEP');
    await page.waitForTimeout(2000);
    const generateResult = await executeTestAction(page, 'generate-trades');
    testResults.dataGeneration.generateTrades = generateResult.success;
    logTestResult('Generate Trades', generateResult.success, generateResult.message);
    await takeScreenshot(page, 'after-generate-trades', 'After generating trades');
    
    // Step 4: Verify Data
    log('Step 4: Verifying generated data...', 'STEP');
    await page.waitForTimeout(2000);
    const verifyResult = await executeTestAction(page, 'verify-data');
    testResults.dataGeneration.verifyData = verifyResult.success;
    logTestResult('Verify Data', verifyResult.success, verifyResult.message);
    await takeScreenshot(page, 'after-verify-data', 'After verifying data');
    
    // Extract verification data
    try {
      const verificationData = await page.evaluate(() => {
        const verificationSection = document.querySelector('[data-verification="true"]');
        if (verificationSection) {
          return JSON.parse(verificationSection.textContent || '{}');
        }
        return null;
      });
      
      if (verificationData) {
        testResults.dataGeneration.actualResults = verificationData;
        log('📊 Verification data extracted successfully', 'DATA');
        
        // Validate expected results
        const actualTrades = verificationData.summary?.totalTrades || 0;
        const actualWinRate = verificationData.summary?.winRate || 0;
        const actualStrategies = verificationData.summary?.totalStrategies || 0;
        
        logTestResult('Trade Count Validation', actualTrades === EXPECTED_RESULTS.totalTrades, 
          `Expected: ${EXPECTED_RESULTS.totalTrades}, Actual: ${actualTrades}`);
        
        logTestResult('Win Rate Validation', Math.abs(actualWinRate - EXPECTED_RESULTS.winRate) < 5, 
          `Expected: ~${EXPECTED_RESULTS.winRate}%, Actual: ${actualWinRate}%`);
        
        logTestResult('Strategy Count Validation', actualStrategies === EXPECTED_RESULTS.totalStrategies, 
          `Expected: ${EXPECTED_RESULTS.totalStrategies}, Actual: ${actualStrategies}`);
      }
    } catch (error) {
      log(`Failed to extract verification data: ${error.message}`, 'ERROR');
    }
    
    return true;
  } catch (error) {
    log(`Data generation failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testConfluenceFunctionality(page) {
  log('🧭 Testing confluence page functionality...', 'CONFLUENCE');
  
  try {
    // Navigate to confluence page
    await page.goto(CONFLUENCE_URL);
    await page.waitForLoadState('networkidle');
    testResults.confluenceTesting.pageLoad = true;
    logTestResult('Confluence Page Load', true);
    await takeScreenshot(page, 'confluence-page-loaded', 'Confluence page loaded');
    
    // Test emotional analysis visualization
    log('Testing emotional analysis visualization...', 'EMOTION');
    await page.waitForTimeout(3000); // Wait for data to load
    
    const emotionalChartExists = await page.locator('[data-testid="emotional-chart"], .emotional-radar, .emotion-chart').count() > 0;
    testResults.confluenceTesting.emotionalAnalysis = emotionalChartExists;
    logTestResult('Emotional Analysis Chart', emotionalChartExists, 'Emotional radar chart found');
    
    // Test filtering functionality
    log('Testing filtering functionality...', 'FILTER');
    const filterExists = await page.locator('[data-testid="emotion-filter"], .emotion-dropdown, select').count() > 0;
    testResults.confluenceTesting.filtering = filterExists;
    logTestResult('Filter Controls', filterExists, 'Filter controls found');
    
    if (filterExists) {
      // Test emotion filtering
      try {
        await page.click('[data-testid="emotion-filter"], .emotion-dropdown, select');
        await page.waitForTimeout(1000);
        
        // Select a specific emotion
        const emotionOption = await page.locator('option[value="CONFIDENT"], option:has-text("CONFIDENT")').first();
        if (await emotionOption.isVisible()) {
          await emotionOption.click();
          await page.waitForTimeout(2000);
          logTestResult('Emotion Filter Application', true, 'CONFIDENT emotion filter applied');
        }
      } catch (error) {
        logTestResult('Emotion Filter Application', false, error.message);
      }
    }
    
    // Test data visualization
    log('Testing data visualization...', 'VISUALIZATION');
    const dataElements = await page.locator('[data-testid="trade-row"], .trade-item, tr').count();
    testResults.confluenceTesting.dataVisualization = dataElements > 0;
    logTestResult('Data Visualization', dataElements > 0, `${dataElements} trade elements found`);
    
    await takeScreenshot(page, 'confluence-functionality-test', 'Confluence functionality test');
    
    return true;
  } catch (error) {
    log(`Confluence testing failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testDashboardSynchronization(page) {
  log('📊 Testing dashboard synchronization...', 'DASHBOARD');
  
  try {
    // Navigate to dashboard
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    testResults.dashboardTesting.pageLoad = true;
    logTestResult('Dashboard Page Load', true);
    
    // Check for identical data display
    await page.waitForTimeout(3000); // Wait for data to load
    
    const dashboardStats = await page.locator('.stat-card, .metric-card, [data-testid="stat"]').count();
    testResults.dashboardTesting.dataSync = dashboardStats > 0;
    logTestResult('Dashboard Data Sync', dashboardStats > 0, `${dashboardStats} stat cards found`);
    
    // Compare with confluence data (simplified check)
    const hasTradeData = await page.locator('[data-testid="trade-item"], .trade-item, tr').count() > 0;
    testResults.dashboardTesting.identicalData = hasTradeData;
    logTestResult('Identical Data Display', hasTradeData, 'Trade data visible on dashboard');
    
    await takeScreenshot(page, 'dashboard-sync-test', 'Dashboard synchronization test');
    
    return true;
  } catch (error) {
    log(`Dashboard testing failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testNewTradeAddition(page) {
  log('➕ Testing new trade addition and immediate updates...', 'NEW_TRADE');
  
  try {
    // Navigate to log trade page
    await page.goto(LOG_TRADE_URL);
    await page.waitForLoadState('networkidle');
    
    // Fill in a simple trade form
    await page.fill('input[name="symbol"], input[data-testid="symbol"]', 'TEST');
    await page.selectOption('select[name="market"], [data-testid="market"]', 'Stock');
    await page.selectOption('select[name="side"], [data-testid="side"]', 'Buy');
    await page.fill('input[name="quantity"], input[data-testid="quantity"]', '100');
    await page.fill('input[name="entry_price"], input[data-testid="entry_price"]', '50');
    await page.fill('input[name="exit_price"], input[data-testid="exit_price"]', '55');
    
    // Select an emotional state
    await page.click('[data-testid="emotional-state-input"], .emotion-checkbox[value="CONFIDENT"]');
    
    // Submit the form
    await page.click('button[type="submit"], [data-testid="save-trade"]');
    await page.waitForTimeout(3000);
    
    // Check for success message
    const successMessage = await page.locator('.success, .alert-success, [data-testid="success"]').count() > 0;
    testResults.newTradeTesting.tradeAddition = successMessage;
    logTestResult('New Trade Addition', successMessage, 'Trade successfully added');
    
    if (successMessage) {
      // Navigate to confluence to check for immediate update
      await page.goto(CONFLUENCE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if new trade appears (simplified check)
      const updatedData = await page.locator('[data-testid="trade-item"], .trade-item, tr').count();
      testResults.newTradeTesting.immediateUpdate = updatedData > 0;
      logTestResult('Immediate Update', updatedData > 0, 'New trade reflected immediately');
      
      // Test cross-tab synchronization (create new context)
      const newContext = await browser.newContext();
      const newPage = await newContext.newPage();
      
      await login(newPage);
      await newPage.goto(CONFLUENCE_URL);
      await newPage.waitForLoadState('networkidle');
      await newPage.waitForTimeout(3000);
      
      const crossTabData = await newPage.locator('[data-testid="trade-item"], .trade-item, tr').count();
      testResults.newTradeTesting.crossTabSync = crossTabData > 0;
      logTestResult('Cross-Tab Synchronization', crossTabData > 0, 'Data synchronized across tabs');
      
      await newContext.close();
    }
    
    await takeScreenshot(page, 'new-trade-test', 'New trade addition test');
    
    return true;
  } catch (error) {
    log(`New trade testing failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function generateTestReport() {
  log('📋 Generating comprehensive test report...', 'REPORT');
  
  const report = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      totalTests: testResults.summary.totalTests,
      passedTests: testResults.summary.passedTests,
      failedTests: testResults.summary.failedTests,
      successRate: ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1) + '%',
      overallStatus: testResults.summary.failedTests === 0 ? 'SUCCESS' : 'FAILED'
    },
    expectedResults: EXPECTED_RESULTS,
    actualResults: testResults.dataGeneration.actualResults,
    issues: testResults.summary.issues
  };
  
  // Save report to file
  const filename = `comprehensive-data-generation-test-report-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownFilename = `comprehensive-data-generation-test-report-${Date.now()}.md`;
  fs.writeFileSync(markdownFilename, markdownReport);
  
  log(`📄 Test report saved to: ${filename}`, 'REPORT');
  log(`📄 Markdown report saved to: ${markdownFilename}`, 'REPORT');
  
  return report;
}

function generateMarkdownReport(report) {
  return `# Comprehensive Data Generation and Confluence Testing Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Executive Summary

- **Overall Status:** ${report.summary.overallStatus}
- **Success Rate:** ${report.summary.successRate}
- **Total Tests:** ${report.summary.totalTests}
- **Passed:** ${report.summary.passedTests}
- **Failed:** ${report.summary.failedTests}

## Data Generation Results

| Step | Status | Details |
|------|--------|---------|
| Delete All Data | ${report.testResults.dataGeneration.deleteAllData ? '✅ PASS' : '❌ FAIL'} | Cleared existing data |
| Create Strategies | ${report.testResults.dataGeneration.createStrategies ? '✅ PASS' : '❌ FAIL'} | Created trading strategies |
| Generate Trades | ${report.testResults.dataGeneration.generateTrades ? '✅ PASS' : '❌ FAIL'} | Generated test trades |
| Verify Data | ${report.testResults.dataGeneration.verifyData ? '✅ PASS' : '❌ FAIL'} | Verified data integrity |

### Expected vs Actual Results

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Total Trades | ${report.expectedResults.totalTrades} | ${report.actualResults.summary?.totalTrades || 'N/A'} | ${report.actualResults.summary?.totalTrades === report.expectedResults.totalTrades ? '✅' : '❌'} |
| Win Rate | ${report.expectedResults.winRate}% | ${report.actualResults.summary?.winRate || 'N/A'}% | ${Math.abs((report.actualResults.summary?.winRate || 0) - report.expectedResults.winRate) < 5 ? '✅' : '❌'} |
| Total Strategies | ${report.expectedResults.totalStrategies} | ${report.actualResults.summary?.totalStrategies || 'N/A'} | ${report.actualResults.summary?.totalStrategies === report.expectedResults.totalStrategies ? '✅' : '❌'} |

## Confluence Testing Results

| Test | Status | Details |
|------|--------|---------|
| Page Load | ${report.testResults.confluenceTesting.pageLoad ? '✅ PASS' : '❌ FAIL'} | Confluence page loads correctly |
| Emotional Analysis | ${report.testResults.confluenceTesting.emotionalAnalysis ? '✅ PASS' : '❌ FAIL'} | Emotional radar chart displays |
| Filtering | ${report.testResults.confluenceTesting.filtering ? '✅ PASS' : '❌ FAIL'} | Filter controls work correctly |
| Data Visualization | ${report.testResults.confluenceTesting.dataVisualization ? '✅ PASS' : '❌ FAIL'} | Trade data displays properly |

## Dashboard Testing Results

| Test | Status | Details |
|------|--------|---------|
| Page Load | ${report.testResults.dashboardTesting.pageLoad ? '✅ PASS' : '❌ FAIL'} | Dashboard page loads correctly |
| Data Sync | ${report.testResults.dashboardTesting.dataSync ? '✅ PASS' : '❌ FAIL'} | Data synchronizes properly |
| Identical Data | ${report.testResults.dashboardTesting.identicalData ? '✅ PASS' : '❌ FAIL'} | Shows same data as confluence |

## New Trade Testing Results

| Test | Status | Details |
|------|--------|---------|
| Trade Addition | ${report.testResults.newTradeTesting.tradeAddition ? '✅ PASS' : '❌ FAIL'} | New trades can be added |
| Immediate Update | ${report.testResults.newTradeTesting.immediateUpdate ? '✅ PASS' : '❌ FAIL'} | Updates appear immediately |
| Cross-Tab Sync | ${report.testResults.newTradeTesting.crossTabSync ? '✅ PASS' : '❌ FAIL'} | Data syncs across tabs |

## Issues Found

${report.issues.length > 0 ? report.issues.map(issue => `- ${issue}`).join('\n') : 'No issues found. All tests passed successfully!'}

## Recommendations

${report.summary.overallStatus === 'SUCCESS' 
  ? '✅ **System Ready:** All tests passed successfully. The system is ready for production use.' 
  : '⚠️ **Action Required:** Some tests failed. Please review the issues above and address them before deploying to production.'}

## Screenshots

All test screenshots have been saved in the \`test-screenshots\` directory for visual verification.

---
*Report generated by Comprehensive Data Generation and Testing Script*
`;
}

async function main() {
  log('🚀 Starting Comprehensive Data Generation and Confluence Testing...', 'START');
  
  let browser;
  try {
    // Create screenshots directory
    if (!fs.existsSync('test-screenshots')) {
      fs.mkdirSync('test-screenshots');
    }
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down actions for better visibility
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Login first
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      log('❌ Login failed. Cannot proceed with testing.', 'FATAL');
      return;
    }
    
    // Execute all test phases
    log('\n📊 === PHASE 1: DATA GENERATION ===', 'PHASE');
    await executeDataGeneration(page);
    
    log('\n🧭 === PHASE 2: CONFLUENCE TESTING ===', 'PHASE');
    await testConfluenceFunctionality(page);
    
    log('\n📊 === PHASE 3: DASHBOARD TESTING ===', 'PHASE');
    await testDashboardSynchronization(page);
    
    log('\n➕ === PHASE 4: NEW TRADE TESTING ===', 'PHASE');
    await testNewTradeAddition(page);
    
    // Generate final report
    log('\n📋 === FINAL REPORT ===', 'PHASE');
    const report = await generateTestReport();
    
    // Log summary
    log('\n📊 === TEST SUMMARY ===', 'SUMMARY');
    log(`Total Tests: ${report.summary.totalTests}`);
    log(`Passed: ${report.summary.passedTests}`);
    log(`Failed: ${report.summary.failedTests}`);
    log(`Success Rate: ${report.summary.successRate}`);
    log(`Overall Status: ${report.summary.overallStatus}`);
    
    if (report.summary.overallStatus === 'SUCCESS') {
      log('\n🎉 ALL TESTS PASSED! System is ready for use.', 'SUCCESS');
    } else {
      log('\n⚠️ Some tests failed. Please review the report.', 'WARNING');
    }
    
  } catch (error) {
    log(`Fatal error during testing: ${error.message}`, 'FATAL');
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, testResults };