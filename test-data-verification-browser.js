const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  credentials: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  }
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  testPhase: 'initialization',
  authenticationTest: null,
  basicEndpointTest: null,
  statisticalAccuracyTest: null,
  dataCompletenessTest: null,
  errorHandlingTest: null,
  overallAssessment: null,
  verificationData: null
};

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logEntry);
}

// Save test results to JSON file
function saveResults() {
  const filename = `data-verification-test-results-browser-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
  log(`Test results saved to ${filename}`);
}

// Main test function
async function runDataVerificationTest() {
  let browser;
  let page;
  
  try {
    log('Starting data verification browser test...');
    testResults.testPhase = 'browser-launch';
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down actions for better visibility
    });
    
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Set viewport and timeout
    await page.setViewportSize({ width: 1280, height: 720 });
    page.setDefaultTimeout(30000);
    
    // Step 1: Navigate to login page
    testResults.testPhase = 'navigation';
    log('Navigating to login page...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on login page
    const loginTitle = await page.title();
    log(`Page title: ${loginTitle}`);
    
    // Step 2: Authenticate with provided credentials
    testResults.testPhase = 'authentication';
    log('Attempting to authenticate with test credentials...');
    
    // Fill in login form
    await page.fill('input[type="email"]', TEST_CONFIG.credentials.email);
    await page.fill('input[type="password"]', TEST_CONFIG.credentials.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ timeout: 30000 });
    
    // Verify successful login by checking for dashboard or redirect
    const currentUrl = page.url();
    log(`Post-login URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/trades')) {
      log('✅ Successfully authenticated and redirected to dashboard');
      testResults.authenticationTest = {
        status: 'PASS',
        url: currentUrl
      };
    } else {
      throw new Error('Authentication may have failed - not redirected to expected page');
    }
    
    // Wait for authentication to be fully established
    await page.waitForTimeout(5000);
    
    // Step 3: Extract authentication token from localStorage
    testResults.testPhase = 'token-extraction';
    log('Extracting authentication token from localStorage...');
    
    const authData = await page.evaluate(() => {
      // Get Supabase auth token from localStorage
      const authKey = 'sb-auth-token';
      const authData = localStorage.getItem(authKey);
      
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          return {
            hasToken: !!parsed.access_token,
            accessToken: parsed.access_token,
            refreshToken: parsed.refresh_token,
            userId: parsed.user?.id,
            userEmail: parsed.user?.email
          };
        } catch (e) {
          return { error: 'Failed to parse auth data', raw: authData };
        }
      }
      
      return { error: 'No auth data found' };
    });
    
    log(`Auth data extraction result: ${JSON.stringify(authData)}`);
    
    if (authData.error || !authData.hasToken) {
      throw new Error(`Failed to extract authentication token: ${authData.error || 'No token found'}`);
    }
    
    // Step 4: Test basic "verify-data" API endpoint
    testResults.testPhase = 'basic-endpoint-test';
    log('Testing basic "verify-data" API endpoint...');
    
    const verificationResponse = await page.evaluate((accessToken) => {
      return fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action: 'verify-data' })
      }).then(response => response.json());
    }, authData.accessToken);
    
    if (verificationResponse.error) {
      log(`❌ Basic endpoint test failed: ${verificationResponse.error}`);
      testResults.basicEndpointTest = {
        status: 'FAIL',
        error: verificationResponse.error,
        details: verificationResponse.details
      };
    } else {
      log('✅ Basic endpoint test passed');
      testResults.basicEndpointTest = {
        status: 'PASS',
        hasData: !!verificationResponse.verification,
        hasMessage: !!verificationResponse.message
      };
      
      // Store verification data for further tests
      testResults.verificationData = verificationResponse.verification;
      
      // Log the response structure
      log('📊 Response structure:');
      log(`- Has verification object: ${!!verificationResponse.verification}`);
      log(`- Has summary: ${!!verificationResponse.verification?.summary}`);
      log(`- Has emotionDistribution: ${!!verificationResponse.verification?.emotionDistribution}`);
      log(`- Has marketDistribution: ${!!verificationResponse.verification?.marketDistribution}`);
      log(`- Has strategyDistribution: ${!!verificationResponse.verification?.strategyDistribution}`);
    }
    
    // Step 5: Test statistical accuracy (if we have verification data)
    if (testResults.verificationData) {
      testResults.testPhase = 'statistical-accuracy-test';
      await verifyStatisticalAccuracy(testResults.verificationData);
      
      // Step 6: Test data completeness
      testResults.testPhase = 'data-completeness-test';
      await verifyDataCompleteness(testResults.verificationData);
    }
    
    // Step 7: Test error handling
    testResults.testPhase = 'error-handling-test';
    await testErrorHandling(authData.accessToken);
    
    // Generate overall assessment
    const allTests = [
      testResults.authenticationTest,
      testResults.basicEndpointTest,
      testResults.statisticalAccuracyTest,
      testResults.dataCompletenessTest,
      testResults.errorHandlingTest
    ];
    
    const passedTests = allTests.filter(test => test && test.status === 'PASS').length;
    const totalTests = allTests.filter(test => test).length;
    
    if (passedTests === totalTests) {
      testResults.overallAssessment = {
        status: 'PASS',
        message: `All ${totalTests} test categories passed successfully`,
        passedTests,
        totalTests
      };
    } else {
      testResults.overallAssessment = {
        status: 'FAIL',
        message: `${passedTests}/${totalTests} test categories passed`,
        passedTests,
        totalTests,
        failedTests: totalTests - passedTests
      };
    }
    
    log('\n📋 FINAL TEST RESULTS:');
    log('========================');
    log(`Overall Status: ${testResults.overallAssessment.status}`);
    log(`Tests Passed: ${testResults.overallAssessment.passedTests}/${testResults.overallAssessment.totalTests}`);
    
    if (testResults.verificationData) {
      log('\n📊 Verification Data Summary:');
      log(`- Total Trades: ${testResults.verificationData.summary.totalTrades}`);
      log(`- Win Rate: ${testResults.verificationData.summary.winRate}%`);
      log(`- Total P&L: $${testResults.verificationData.summary.totalPnL}`);
      log(`- Strategies: ${testResults.verificationData.summary.totalStrategies}`);
      log(`- Emotional States: ${Object.keys(testResults.verificationData.emotionDistribution).length}`);
      log(`- Markets: ${Object.keys(testResults.verificationData.marketDistribution).length}`);
    }
    
    log('All tests completed successfully!');
    testResults.testPhase = 'completed';
    
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    testResults.testPhase = 'failed';
    testResults.error = error.message;
  } finally {
    if (browser) {
      await browser.close();
    }
    saveResults();
  }
}

// Verify statistical accuracy
async function verifyStatisticalAccuracy(verificationData) {
  log('\n📈 Verifying statistical accuracy...');
  
  const { summary, emotionDistribution, marketDistribution, strategyDistribution } = verificationData;
  const issues = [];
  
  // Test 1: Win rate calculation
  if (summary.tradesWithPnL > 0) {
    const expectedWinRate = ((summary.winningTrades / summary.tradesWithPnL) * 100).toFixed(1);
    const actualWinRate = summary.winRate.toFixed(1);
    
    if (expectedWinRate !== actualWinRate) {
      issues.push(`Win rate mismatch: expected ${expectedWinRate}%, got ${actualWinRate}%`);
    } else {
      log('✅ Win rate calculation is accurate');
    }
  } else {
    log('⚠️ No trades with P&L to verify win rate');
  }
  
  // Test 2: Emotional state frequencies
  const totalEmotionCount = Object.values(emotionDistribution).reduce((sum, count) => sum + count, 0);
  if (totalEmotionCount === 0 && summary.totalTrades > 0) {
    issues.push('Emotional state distribution is empty but trades exist');
  } else {
    log('✅ Emotional state distribution calculated');
  }
  
  // Test 3: Strategy distribution
  const totalStrategyCount = Object.values(strategyDistribution).reduce((sum, count) => sum + count, 0);
  if (totalStrategyCount !== summary.totalTrades && summary.totalTrades > 0) {
    issues.push(`Strategy distribution count (${totalStrategyCount}) doesn't match total trades (${summary.totalTrades})`);
  } else {
    log('✅ Strategy distribution matches total trades');
  }
  
  // Test 4: Market distribution
  const totalMarketCount = Object.values(marketDistribution).reduce((sum, count) => sum + count, 0);
  if (totalMarketCount !== summary.totalTrades && summary.totalTrades > 0) {
    issues.push(`Market distribution count (${totalMarketCount}) doesn't match total trades (${summary.totalTrades})`);
  } else {
    log('✅ Market distribution matches total trades');
  }
  
  // Test 5: P&L calculation consistency
  const expectedPnLRange = summary.totalTrades > 0 ? 
    (summary.winningTrades * 50 - summary.losingTrades * 300) : 0;
  const maxExpectedPnL = summary.totalTrades > 0 ? 
    (summary.winningTrades * 500 - summary.losingTrades * 25) : 0;
    
  if (summary.totalPnL < expectedPnLRange || summary.totalPnL > maxExpectedPnL) {
    issues.push(`Total P&L ($${summary.totalPnL}) seems outside expected range ($${expectedPnLRange} to $${maxExpectedPnL})`);
  } else {
    log('✅ Total P&L within expected range');
  }
  
  if (issues.length > 0) {
    log('❌ Statistical accuracy issues found:');
    issues.forEach(issue => log(`  - ${issue}`));
    testResults.statisticalAccuracyTest = {
      status: 'FAIL',
      issues
    };
  } else {
    log('✅ All statistical accuracy tests passed');
    testResults.statisticalAccuracyTest = {
      status: 'PASS'
    };
  }
}

// Verify data completeness
async function verifyDataCompleteness(verificationData) {
  log('\n🔍 Testing data completeness and mapping...');
  
  const { summary, emotionDistribution, marketDistribution, strategyDistribution, trades } = verificationData;
  const issues = [];
  
  // Test 1: Required summary fields
  const requiredSummaryFields = [
    'totalTrades', 'tradesWithPnL', 'winningTrades', 'losingTrades', 
    'totalPnL', 'winRate', 'totalStrategies', 'activeStrategies'
  ];
  
  requiredSummaryFields.forEach(field => {
    if (summary[field] === undefined || summary[field] === null) {
      issues.push(`Missing required summary field: ${field}`);
    }
  });
  
  // Test 2: Trade sample structure
  if (trades && trades.length > 0) {
    const requiredTradeFields = ['id', 'symbol', 'market', 'pnl', 'strategyId', 'emotions'];
    trades.forEach((trade, index) => {
      requiredTradeFields.forEach(field => {
        if (trade[field] === undefined || trade[field] === null) {
          issues.push(`Trade ${index} missing required field: ${field}`);
        }
      });
    });
    log('✅ Trade sample structure is complete');
  } else {
    log('⚠️ No trade samples available for verification');
  }
  
  // Test 3: Emotional states mapping
  const expectedEmotions = ['CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'];
  const foundEmotions = Object.keys(emotionDistribution);
  const missingEmotions = expectedEmotions.filter(emotion => !foundEmotions.includes(emotion));
  
  if (missingEmotions.length > 0 && summary.totalTrades > 0) {
    log(`⚠️ Some expected emotions not found: ${missingEmotions.join(', ')}`);
  } else {
    log('✅ Emotional state mapping is complete');
  }
  
  // Test 4: Market distribution completeness
  const expectedMarkets = ['Stock', 'Crypto', 'Forex', 'Futures'];
  const foundMarkets = Object.keys(marketDistribution);
  const missingMarkets = expectedMarkets.filter(market => !foundMarkets.includes(market));
  
  if (missingMarkets.length > 0 && summary.totalTrades > 0) {
    log(`⚠️ Some expected markets not found: ${missingMarkets.join(', ')}`);
  } else {
    log('✅ Market distribution is complete');
  }
  
  // Test 5: Strategy name mapping
  if (Object.keys(strategyDistribution).length === 0 && summary.totalStrategies > 0) {
    issues.push('Strategy distribution is empty but strategies exist');
  } else {
    log('✅ Strategy name mapping is working');
  }
  
  if (issues.length > 0) {
    log('❌ Data completeness issues found:');
    issues.forEach(issue => log(`  - ${issue}`));
    testResults.dataCompletenessTest = {
      status: 'FAIL',
      issues
    };
  } else {
    log('✅ All data completeness tests passed');
    testResults.dataCompletenessTest = {
      status: 'PASS'
    };
  }
}

// Test error handling
async function testErrorHandling(accessToken) {
  log('\n🚨 Testing error handling scenarios...');
  
  const issues = [];
  
  // Test 1: Invalid action
  try {
    const invalidActionResponse = await page.evaluate((token) => {
      return fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'invalid-action' })
      }).then(response => response.json());
    }, accessToken);
    
    if (invalidActionResponse.error) {
      log('✅ Invalid action properly handled with error message');
    } else {
      issues.push('Invalid action should return error message');
    }
  } catch (error) {
    issues.push(`Error testing invalid action: ${error.message}`);
  }
  
  // Test 2: Missing action
  try {
    const missingActionResponse = await page.evaluate((token) => {
      return fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      }).then(response => response.json());
    }, accessToken);
    
    if (missingActionResponse.error) {
      log('✅ Missing action properly handled with error message');
    } else {
      issues.push('Missing action should return error message');
    }
  } catch (error) {
    issues.push(`Error testing missing action: ${error.message}`);
  }
  
  if (issues.length > 0) {
    log('❌ Error handling issues found:');
    issues.forEach(issue => log(`  - ${issue}`));
    testResults.errorHandlingTest = {
      status: 'FAIL',
      issues
    };
  } else {
    log('✅ All error handling tests passed');
    testResults.errorHandlingTest = {
      status: 'PASS'
    };
  }
}

// Run test
if (require.main === module) {
  runDataVerificationTest().catch(console.error);
}

module.exports = { runDataVerificationTest, TEST_CONFIG };