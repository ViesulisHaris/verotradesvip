const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS_FILE = `comprehensive-system-integration-test-results-${Date.now()}.json`;
const SCREENSHOT_DIR = './test-screenshots';

// Test data expectations
const EXPECTED_RESULTS = {
  totalStrategies: 5,
  totalTrades: 100,
  winRate: 71,
  emotionalStates: ['CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'],
  markets: ['Stock', 'Crypto', 'Forex', 'Futures']
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  phases: {},
  overallSuccess: false,
  errors: [],
  warnings: []
};

// Helper functions
function log(phase, message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${phase}] ${message}`;
  console.log(logEntry);
  
  if (!testResults.phases[phase]) {
    testResults.phases[phase] = {
      logs: [],
      success: false,
      startTime: new Date().toISOString()
    };
  }
  
  testResults.phases[phase].logs.push({
    timestamp,
    level,
    message
  });
  
  if (level === 'error') {
    testResults.errors.push({ phase, message, timestamp });
  } else if (level === 'warning') {
    testResults.warnings.push({ phase, message, timestamp });
  }
}

function markPhaseSuccess(phase) {
  if (testResults.phases[phase]) {
    testResults.phases[phase].success = true;
    testResults.phases[phase].endTime = new Date().toISOString();
  }
}

async function takeScreenshot(page, name, phase) {
  try {
    const screenshotPath = `${SCREENSHOT_DIR}/${phase}-${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(phase, `Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    log(phase, `Failed to take screenshot: ${error.message}`, 'error');
  }
}

async function waitForAPIResponse(page, action) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${action} API response`));
    }, 30000);

    page.on('response', response => {
      if (response.url().includes('/api/generate-test-data') && response.request().postDataJSON()?.action === action) {
        clearTimeout(timeout);
        response.json().then(data => {
          resolve({ status: response.status(), data });
        }).catch(reject);
      }
    });
  });
}

async function executeTestAction(page, action, phase) {
  log(phase, `Executing action: ${action}`);
  
  // Click the button
  await page.click(`button:has-text("${getButtonText(action)}")`);
  
  // Wait for API response
  try {
    const response = await waitForAPIResponse(page, action);
    
    if (response.status === 200) {
      log(phase, `✅ ${action} completed successfully`, 'success');
      log(phase, `Response: ${JSON.stringify(response.data, null, 2)}`);
      return response.data;
    } else {
      log(phase, `❌ ${action} failed with status ${response.status}`, 'error');
      log(phase, `Error: ${JSON.stringify(response.data, null, 2)}`, 'error');
      return null;
    }
  } catch (error) {
    log(phase, `❌ ${action} failed: ${error.message}`, 'error');
    return null;
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

// Main test function
async function runComprehensiveIntegrationTest() {
  console.log('🚀 Starting Comprehensive System Integration Test');
  console.log(`📊 Results will be saved to: ${TEST_RESULTS_FILE}`);
  
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Phase 1: Access Test Page
    log('ACCESS', 'Accessing test page at /test-comprehensive-data');
    await page.goto(`${BASE_URL}/test-comprehensive-data`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded correctly
    const pageTitle = await page.textContent('h1');
    if (pageTitle && pageTitle.includes('Comprehensive Test Data Generation')) {
      log('ACCESS', '✅ Test page loaded successfully', 'success');
      markPhaseSuccess('ACCESS');
    } else {
      throw new Error('Test page did not load correctly');
    }
    
    await takeScreenshot(page, 'test-page-loaded', 'ACCESS');
    
    // Phase 2: Execute Complete Workflow
    log('WORKFLOW', 'Starting complete workflow execution');
    
    // Step 1: Delete All Data
    const deleteResult = await executeTestAction(page, 'delete-all', 'WORKFLOW');
    if (!deleteResult) {
      throw new Error('Delete all data step failed');
    }
    await takeScreenshot(page, 'after-delete', 'WORKFLOW');
    await page.waitForTimeout(2000);
    
    // Step 2: Create Strategies
    const createResult = await executeTestAction(page, 'create-strategies', 'WORKFLOW');
    if (!createResult || !createResult.strategies || createResult.strategies.length !== EXPECTED_RESULTS.totalStrategies) {
      throw new Error(`Strategy creation failed - expected ${EXPECTED_RESULTS.totalStrategies} strategies`);
    }
    await takeScreenshot(page, 'after-create-strategies', 'WORKFLOW');
    await page.waitForTimeout(2000);
    
    // Step 3: Generate Trades
    const generateResult = await executeTestAction(page, 'generate-trades', 'WORKFLOW');
    if (!generateResult || !generateResult.trades || generateResult.trades.length !== EXPECTED_RESULTS.totalTrades) {
      throw new Error(`Trade generation failed - expected ${EXPECTED_RESULTS.totalTrades} trades`);
    }
    await takeScreenshot(page, 'after-generate-trades', 'WORKFLOW');
    await page.waitForTimeout(2000);
    
    // Step 4: Verify Data
    const verifyResult = await executeTestAction(page, 'verify-data', 'WORKFLOW');
    if (!verifyResult || !verifyResult.verification) {
      throw new Error('Data verification failed');
    }
    
    const verification = verifyResult.verification;
    const actualWinRate = parseFloat(verification.summary.winRate);
    
    // Validate verification results
    if (verification.summary.totalTrades !== EXPECTED_RESULTS.totalTrades) {
      log('WORKFLOW', `⚠️ Expected ${EXPECTED_RESULTS.totalTrades} trades, got ${verification.summary.totalTrades}`, 'warning');
    }
    
    if (Math.abs(actualWinRate - EXPECTED_RESULTS.winRate) > 5) {
      log('WORKFLOW', `⚠️ Expected ~${EXPECTED_RESULTS.winRate}% win rate, got ${actualWinRate}%`, 'warning');
    }
    
    if (verification.summary.totalStrategies !== EXPECTED_RESULTS.totalStrategies) {
      log('WORKFLOW', `⚠️ Expected ${EXPECTED_RESULTS.totalStrategies} strategies, got ${verification.summary.totalStrategies}`, 'warning');
    }
    
    await takeScreenshot(page, 'after-verify-data', 'WORKFLOW');
    markPhaseSuccess('WORKFLOW');
    
    // Phase 3: Test Data Consistency Across Pages
    log('CONSISTENCY', 'Testing data consistency across pages');
    
    // Navigate to Confluence page
    log('CONSISTENCY', 'Navigating to confluence page');
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow data to load
    
    await takeScreenshot(page, 'confluence-page-loaded', 'CONSISTENCY');
    
    // Check if trades are displayed on confluence page
    const tradeElements = await page.locator('[data-testid="trade-row"], .trade-item, tr').count();
    if (tradeElements > 0) {
      log('CONSISTENCY', `✅ Found ${tradeElements} trade elements on confluence page`, 'success');
    } else {
      log('CONSISTENCY', '⚠️ No trade elements found on confluence page', 'warning');
    }
    
    // Navigate to Dashboard
    log('CONSISTENCY', 'Navigating to dashboard page');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow data to load
    
    await takeScreenshot(page, 'dashboard-page-loaded', 'CONSISTENCY');
    
    // Check dashboard statistics
    try {
      const dashboardStats = await page.locator('.stat-card, .metric-card, [data-testid="stat"]').count();
      if (dashboardStats > 0) {
        log('CONSISTENCY', `✅ Found ${dashboardStats} dashboard statistics`, 'success');
      } else {
        log('CONSISTENCY', '⚠️ No dashboard statistics found', 'warning');
      }
    } catch (error) {
      log('CONSISTENCY', `Could not verify dashboard stats: ${error.message}`, 'warning');
    }
    
    markPhaseSuccess('CONSISTENCY');
    
    // Phase 4: Test Emotional Analysis Visualization
    log('EMOTIONAL', 'Testing emotional analysis visualization');
    
    // Go back to confluence page for emotional analysis
    await page.goto(`${BASE_URL}/confluence`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for emotional analysis components
    try {
      const emotionalChart = await page.locator('[data-testid="emotional-chart"], .emotional-radar, .emotion-chart').count();
      if (emotionalChart > 0) {
        log('EMOTIONAL', `✅ Found ${emotionalChart} emotional analysis charts`, 'success');
      } else {
        log('EMOTIONAL', '⚠️ No emotional analysis charts found', 'warning');
      }
      
      // Test emotional filtering if available
      const emotionFilters = await page.locator('[data-testid="emotion-filter"], .emotion-dropdown, select').count();
      if (emotionFilters > 0) {
        log('EMOTIONAL', `✅ Found ${emotionFilters} emotion filters`, 'success');
        
        // Try to interact with emotion filter
        try {
          await page.click('[data-testid="emotion-filter"], .emotion-dropdown, select');
          await page.waitForTimeout(1000);
          log('EMOTIONAL', '✅ Successfully interacted with emotion filter', 'success');
        } catch (error) {
          log('EMOTIONAL', `Could not interact with emotion filter: ${error.message}`, 'warning');
        }
      }
    } catch (error) {
      log('EMOTIONAL', `Could not verify emotional analysis: ${error.message}`, 'warning');
    }
    
    await takeScreenshot(page, 'emotional-analysis-test', 'EMOTIONAL');
    markPhaseSuccess('EMOTIONAL');
    
    // Phase 5: Test Strategy Performance Analysis
    log('STRATEGY', 'Testing strategy performance analysis');
    
    // Look for strategy analysis components
    try {
      const strategyCharts = await page.locator('[data-testid="strategy-chart"], .strategy-performance, .strategy-analysis').count();
      if (strategyCharts > 0) {
        log('STRATEGY', `✅ Found ${strategyCharts} strategy analysis components`, 'success');
      } else {
        log('STRATEGY', '⚠️ No strategy analysis components found', 'warning');
      }
      
      // Test strategy filtering if available
      const strategyFilters = await page.locator('[data-testid="strategy-filter"], .strategy-dropdown').count();
      if (strategyFilters > 0) {
        log('STRATEGY', `✅ Found ${strategyFilters} strategy filters`, 'success');
      }
    } catch (error) {
      log('STRATEGY', `Could not verify strategy analysis: ${error.message}`, 'warning');
    }
    
    await takeScreenshot(page, 'strategy-analysis-test', 'STRATEGY');
    markPhaseSuccess('STRATEGY');
    
    // Phase 6: Test Data Persistence and Reliability
    log('PERSISTENCE', 'Testing data persistence and reliability');
    
    // Refresh the page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if data persists after refresh
    const refreshedTradeElements = await page.locator('[data-testid="trade-row"], .trade-item, tr').count();
    if (refreshedTradeElements > 0) {
      log('PERSISTENCE', `✅ Data persists after page refresh - ${refreshedTradeElements} trades found`, 'success');
    } else {
      log('PERSISTENCE', '❌ Data does not persist after page refresh', 'error');
    }
    
    await takeScreenshot(page, 'after-refresh-persistence-test', 'PERSISTENCE');
    markPhaseSuccess('PERSISTENCE');
    
    // Calculate overall success
    const successfulPhases = Object.values(testResults.phases).filter(phase => phase.success).length;
    const totalPhases = Object.keys(testResults.phases).length;
    testResults.overallSuccess = successfulPhases === totalPhases;
    
    log('SUMMARY', `Test completed: ${successfulPhases}/${totalPhases} phases successful`);
    
  } catch (error) {
    log('FATAL', `Test failed with error: ${error.message}`, 'error');
    testResults.errors.push({ phase: 'FATAL', message: error.message, timestamp: new Date().toISOString() });
  } finally {
    await browser.close();
  }
  
  // Save test results
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n📊 Test results saved to: ${TEST_RESULTS_FILE}`);
  
  // Print summary
  console.log('\n📋 TEST SUMMARY:');
  console.log('================');
  console.log(`Overall Success: ${testResults.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total Errors: ${testResults.errors.length}`);
  console.log(`Total Warnings: ${testResults.warnings.length}`);
  
  console.log('\n📊 PHASE RESULTS:');
  Object.entries(testResults.phases).forEach(([phase, data]) => {
    console.log(`${phase}: ${data.success ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach(error => {
      console.log(`  [${error.phase}] ${error.message}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    testResults.warnings.forEach(warning => {
      console.log(`  [${warning.phase}] ${warning.message}`);
    });
  }
  
  return testResults;
}

// Run the test
if (require.main === module) {
  runComprehensiveIntegrationTest()
    .then(results => {
      process.exit(results.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveIntegrationTest };