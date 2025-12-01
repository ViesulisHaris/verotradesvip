const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  credentials: {
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  },
  expectedResults: {
    totalTrades: 100,
    winRate: 0.71, // 71%
    winningTrades: 71,
    losingTrades: 29,
    winAmountRange: { min: 50, max: 500 },
    lossAmountRange: { min: -300, max: -25 },
    tradingHours: { start: 6, end: 16 }, // 6 AM to 4 PM
    markets: ['Stock', 'Crypto', 'Forex', 'Futures'],
    expectedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'BTC', 'ETH', 'EUR/USD', 'GBP/USD', 'ES', 'NQ', 'YM']
  }
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  testPhase: 'initialization',
  passed: [],
  failed: [],
  warnings: [],
  tradeData: null,
  detailedAnalysis: {}
};

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logEntry);
  
  if (level === 'error') {
    testResults.failed.push(message);
  } else if (level === 'warning') {
    testResults.warnings.push(message);
  } else {
    testResults.passed.push(message);
  }
}

// Save test results to JSON file
function saveResults() {
  const filename = `trade-generation-test-results-simple-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
  log(`Test results saved to ${filename}`);
}

// Main test function
async function runTradeGenerationTest() {
  let browser;
  let page;
  
  try {
    log('Starting trade generation browser test (SIMPLE)...');
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
    
    // Verify we're on the login page
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
      log('Successfully authenticated and redirected to dashboard');
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
    
    // Step 4: Make API request using page route interception
    testResults.testPhase = 'api-request';
    log('Making API request to generate test trades...');
    
    // Set up request interception to add auth headers
    await page.route('**/api/generate-test-data', async (route) => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.accessToken}`
      };
      
      const response = await route.fetch({
        method: 'POST',
        headers,
        postData: JSON.stringify({ action: 'generate-trades' })
      });
      
      return response;
    });
    
    // Navigate to a page to trigger the API request
    const apiResponse = await page.evaluate(() => {
      return fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'generate-trades' })
      }).then(response => response.json());
    });
    
    // Step 5: Verify API response
    testResults.testPhase = 'response-verification';
    
    if (!apiResponse || apiResponse.error) {
      throw new Error(`API request failed: ${JSON.stringify(apiResponse)}`);
    }
    
    log('API request successful');
    testResults.tradeData = apiResponse;
    
    // Step 6: Verify trade count and basic structure
    testResults.testPhase = 'trade-count-verification';
    const trades = apiResponse.trades || [];
    
    if (!Array.isArray(trades)) {
      throw new Error('Response does not contain a trades array');
    }
    
    const actualTradeCount = trades.length;
    log(`Generated ${actualTradeCount} trades (expected: ${TEST_CONFIG.expectedResults.totalTrades})`);
    
    if (actualTradeCount !== TEST_CONFIG.expectedResults.totalTrades) {
      log(`Warning: Expected ${TEST_CONFIG.expectedResults.totalTrades} trades, got ${actualTradeCount}`, 'warning');
    }
    
    // Step 7: Verify win rate
    testResults.testPhase = 'win-rate-verification';
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl < 0);
    
    const actualWinningTrades = winningTrades.length;
    const actualLosingTrades = losingTrades.length;
    const actualWinRate = actualWinningTrades / actualTradeCount;
    
    log(`Winning trades: ${actualWinningTrades} (expected: ${TEST_CONFIG.expectedResults.winningTrades})`);
    log(`Losing trades: ${actualLosingTrades} (expected: ${TEST_CONFIG.expectedResults.losingTrades})`);
    log(`Actual win rate: ${(actualWinRate * 100).toFixed(2)}% (expected: ${(TEST_CONFIG.expectedResults.winRate * 100).toFixed(2)}%)`);
    
    if (actualWinningTrades !== TEST_CONFIG.expectedResults.winningTrades) {
      log(`Warning: Expected ${TEST_CONFIG.expectedResults.winningTrades} winning trades, got ${actualWinningTrades}`, 'warning');
    }
    
    if (actualLosingTrades !== TEST_CONFIG.expectedResults.losingTrades) {
      log(`Warning: Expected ${TEST_CONFIG.expectedResults.losingTrades} losing trades, got ${actualLosingTrades}`, 'warning');
    }
    
    // Step 8: Verify trade data integrity
    testResults.testPhase = 'data-integrity-verification';
    await verifyTradeDataIntegrity(trades);
    
    // Step 9: Verify P&L value ranges
    testResults.testPhase = 'pnl-range-verification';
    await verifyPnLRanges(winningTrades, losingTrades);
    
    // Step 10: Verify weekday and trading hours distribution
    testResults.testPhase = 'time-distribution-verification';
    await verifyTimeDistribution(trades);
    
    // Step 11: Verify strategy distribution
    testResults.testPhase = 'strategy-distribution-verification';
    await verifyStrategyDistribution(trades);
    
    // Step 12: Verify date distribution over past 2 months
    testResults.testPhase = 'date-distribution-verification';
    await verifyDateDistribution(trades);
    
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

// Verify trade data integrity (symbols, markets, emotions)
async function verifyTradeDataIntegrity(trades) {
  log('Verifying trade data integrity...');
  
  // Check symbols
  const symbols = [...new Set(trades.map(trade => trade.symbol))];
  log(`Found ${symbols.length} unique symbols: ${symbols.join(', ')}`);
  
  // Verify expected symbols are present
  const foundExpectedSymbols = TEST_CONFIG.expectedResults.expectedSymbols.filter(symbol => 
    symbols.includes(symbol)
  );
  
  if (foundExpectedSymbols.length < TEST_CONFIG.expectedResults.expectedSymbols.length * 0.5) {
    log(`Warning: Only ${foundExpectedSymbols.length} of expected symbols found`, 'warning');
  }
  
  // Check markets
  const markets = [...new Set(trades.map(trade => trade.market))];
  log(`Found markets: ${markets.join(', ')}`);
  
  // Verify all expected markets are present
  const missingMarkets = TEST_CONFIG.expectedResults.markets.filter(market => 
    !markets.includes(market)
  );
  
  if (missingMarkets.length > 0) {
    log(`Warning: Missing markets: ${missingMarkets.join(', ')}`, 'warning');
  }
  
  // Check emotional states
  const emotions = [...new Set(trades.map(trade => trade.emotional_state).flat())];
  log(`Found ${emotions.length} unique emotional states: ${emotions.join(', ')}`);
  
  if (emotions.length < 3) {
    log(`Warning: Only ${emotions.length} emotional states found, expected more diversity`, 'warning');
  }
  
  // Store detailed analysis
  testResults.detailedAnalysis.dataIntegrity = {
    symbols: symbols,
    markets: markets,
    emotions: emotions,
    symbolCount: symbols.length,
    marketCount: markets.length,
    emotionCount: emotions.length
  };
}

// Verify P&L value ranges
async function verifyPnLRanges(winningTrades, losingTrades) {
  log('Verifying P&L value ranges...');
  
  // Check winning trades
  const winAmounts = winningTrades.map(trade => trade.pnl);
  const minWin = Math.min(...winAmounts);
  const maxWin = Math.max(...winAmounts);
  
  log(`Winning trades P&L range: $${minWin.toFixed(2)} - $${maxWin.toFixed(2)}`);
  log(`Expected winning range: $${TEST_CONFIG.expectedResults.winAmountRange.min} - $${TEST_CONFIG.expectedResults.winAmountRange.max}`);
  
  if (minWin < TEST_CONFIG.expectedResults.winAmountRange.min) {
    log(`Warning: Some winning trades below minimum expected amount`, 'warning');
  }
  
  if (maxWin > TEST_CONFIG.expectedResults.winAmountRange.max) {
    log(`Warning: Some winning trades above maximum expected amount`, 'warning');
  }
  
  // Check losing trades
  const lossAmounts = losingTrades.map(trade => trade.pnl);
  const minLoss = Math.min(...lossAmounts);
  const maxLoss = Math.max(...lossAmounts);
  
  log(`Losing trades P&L range: $${minLoss.toFixed(2)} - $${maxLoss.toFixed(2)}`);
  log(`Expected losing range: $${TEST_CONFIG.expectedResults.lossAmountRange.min} - $${TEST_CONFIG.expectedResults.lossAmountRange.max}`);
  
  if (minLoss < TEST_CONFIG.expectedResults.lossAmountRange.min) {
    log(`Warning: Some losing trades below minimum expected loss`, 'warning');
  }
  
  if (maxLoss > TEST_CONFIG.expectedResults.lossAmountRange.max) {
    log(`Warning: Some losing trades above maximum expected loss`, 'warning');
  }
  
  // Store detailed analysis
  testResults.detailedAnalysis.pnlRanges = {
    winning: { min: minWin, max: maxWin, count: winningTrades.length },
    losing: { min: minLoss, max: maxLoss, count: losingTrades.length }
  };
}

// Verify weekday and trading hours distribution
async function verifyTimeDistribution(trades) {
  log('Verifying weekday and trading hours distribution...');
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayCounts = {};
  const tradingHourViolations = [];
  
  trades.forEach(trade => {
    const tradeDate = new Date(trade.trade_date);
    const weekday = weekdays[tradeDate.getDay()];
    const hour = parseInt(trade.entry_time.split(':')[0]);
    
    weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1;
    
    // Check if trade is within trading hours (6 AM - 4 PM)
    if (hour < TEST_CONFIG.expectedResults.tradingHours.start || 
        hour > TEST_CONFIG.expectedResults.tradingHours.end) {
      tradingHourViolations.push({
        date: trade.trade_date,
        hour: hour,
        symbol: trade.symbol
      });
    }
  });
  
  log('Weekday distribution:');
  Object.entries(weekdayCounts).forEach(([day, count]) => {
    log(`  ${day}: ${count} trades`);
  });
  
  // Check for weekend trades (should be minimal or none)
  const weekendTrades = (weekdayCounts['Saturday'] || 0) + (weekdayCounts['Sunday'] || 0);
  if (weekendTrades > trades.length * 0.1) { // Allow up to 10% weekend trades
    log(`Warning: High number of weekend trades (${weekendTrades})`, 'warning');
  }
  
  // Check trading hours violations
  if (tradingHourViolations.length > 0) {
    log(`Warning: ${tradingHourViolations.length} trades outside trading hours (6 AM - 4 PM)`, 'warning');
    tradingHourViolations.slice(0, 5).forEach(violation => {
      log(`  ${violation.date} (${violation.hour}:00) - ${violation.symbol}`, 'warning');
    });
  }
  
  // Store detailed analysis
  testResults.detailedAnalysis.timeDistribution = {
    weekdayCounts: weekdayCounts,
    weekendTrades: weekendTrades,
    tradingHourViolations: tradingHourViolations.length
  };
}

// Verify strategy distribution
async function verifyStrategyDistribution(trades) {
  log('Verifying strategy distribution...');
  
  const strategyCounts = {};
  trades.forEach(trade => {
    const strategy = trade.strategy_id || 'Unknown';
    strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
  });
  
  log('Strategy distribution:');
  Object.entries(strategyCounts).forEach(([strategy, count]) => {
    const percentage = ((count / trades.length) * 100).toFixed(1);
    log(`  ${strategy}: ${count} trades (${percentage}%)`);
  });
  
  // Check if strategies are reasonably distributed
  const strategyCount = Object.keys(strategyCounts).length;
  if (strategyCount < 3) {
    log(`Warning: Only ${strategyCount} strategies found, expected more diversity`, 'warning');
  }
  
  // Store detailed analysis
  testResults.detailedAnalysis.strategyDistribution = strategyCounts;
}

// Verify date distribution over past 2 months
async function verifyDateDistribution(trades) {
  log('Verifying date distribution over past 2 months...');
  
  const now = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  const dates = trades.map(trade => new Date(trade.trade_date));
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));
  
  log(`Date range: ${oldestDate.toISOString().split('T')[0]} to ${newestDate.toISOString().split('T')[0]}`);
  
  // Check if all trades are within the past 2 months
  const tradesOutsideRange = trades.filter(trade => {
    const tradeDate = new Date(trade.trade_date);
    return tradeDate < twoMonthsAgo || tradeDate > now;
  });
  
  if (tradesOutsideRange.length > 0) {
    log(`Warning: ${tradesOutsideRange.length} trades outside the expected 2-month range`, 'warning');
  }
  
  // Check distribution across weeks
  const weeks = {};
  trades.forEach(trade => {
    const tradeDate = new Date(trade.trade_date);
    const weekStart = new Date(tradeDate);
    weekStart.setDate(tradeDate.getDate() - tradeDate.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });
  
  const weekCount = Object.keys(weeks).length;
  log(`Trades distributed across ${weekCount} weeks`);
  
  // Store detailed analysis
  testResults.detailedAnalysis.dateDistribution = {
    oldestDate: oldestDate.toISOString(),
    newestDate: newestDate.toISOString(),
    tradesOutsideRange: tradesOutsideRange.length,
    weekCount: weekCount,
    weeklyDistribution: weeks
  };
}

// Run the test
if (require.main === module) {
  runTradeGenerationTest().catch(console.error);
}

module.exports = { runTradeGenerationTest, TEST_CONFIG };