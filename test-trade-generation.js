const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const cleanLine = line.trim().replace(/^["']|["']$/g, '');
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/generate-test-data`;
const TEST_EMAIL = 'testuser@verotrade.com';
const TEST_PASSWORD = 'TestPassword123!';

// Test results tracking
const testResults = {
  authentication: { passed: false, details: null },
  tradeGeneration: { passed: false, details: null },
  tradeCount: { passed: false, expected: 100, actual: 0 },
  winRate: { passed: false, expected: 71, actual: 0 },
  dataIntegrity: { passed: false, details: {} },
  pnlRanges: { passed: false, details: {} },
  dateDistribution: { passed: false, details: {} },
  strategyDistribution: { passed: false, details: {} },
  errorHandling: { passed: false, details: {} }
};

let session = null;

// Helper function to make authenticated requests using service key
async function makeAuthenticatedRequest(session, action) {
  console.log('🔍 Debug - Session object:', JSON.stringify(session, null, 2));
  console.log('🔍 Debug - Available env vars:', {
    NEXT_PUBLIC_SUPABASE_URL: !!envVars.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!envVars.SUPABASE_SERVICE_ROLE_KEY
  });
  
  // Use service key approach like the API does internally
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Debug - Service key length:', supabaseServiceKey ? supabaseServiceKey.length : 'undefined');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseServiceKey}`
  };

  console.log('🔍 Debug - Request headers:', headers);
  console.log('🔍 Debug - Action:', action);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action })
    });

    console.log('🔍 Debug - Response status:', response.status);
    console.log('🔍 Debug - Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('🔍 Debug - Response data:', data);
    
    return { status: response.status, data };
  } catch (error) {
    console.error('Request failed:', error);
    return { status: 0, data: { error: error.message } };
  }
}

// Test 1: Authentication
async function testAuthentication() {
  console.log('\n🔐 Testing authentication...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      testResults.authentication.details = `Authentication failed: ${error.message}`;
      console.log('❌ Authentication failed:', error.message);
      return false;
    }
    
    session = data.session;
    testResults.authentication.passed = true;
    testResults.authentication.details = {
      userId: data.user.id,
      email: data.user.email,
      sessionValid: !!data.session
    };
    console.log('✅ Authentication successful');
    console.log(`👤 User ID: ${data.user.id}`);
    console.log(`📧 Email: ${data.user.email}`);
    return true;
    
  } catch (error) {
    testResults.authentication.details = `Authentication error: ${error.message}`;
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

// Test 2: Trade Generation
async function testTradeGeneration() {
  console.log('\n📊 Testing trade generation...');
  
  try {
    const result = await makeAuthenticatedRequest(session, 'generate-trades');
    
    if (result.status === 200 && result.data.trades) {
      testResults.tradeGeneration.passed = true;
      testResults.tradeGeneration.details = result.data;
      console.log('✅ Trade generation successful');
      console.log(`📈 Generated ${result.data.count} trades`);
      console.log(`🎯 Win rate: ${result.data.stats.winRate}% (${result.data.stats.wins}/${result.data.count})`);
      console.log(`💰 Total P&L: $${result.data.stats.totalPnL.toFixed(2)}`);
      
      // Store data for further tests
      testResults.tradeCount.actual = result.data.count;
      testResults.winRate.actual = parseFloat(result.data.stats.winRate);
      
      return result.data;
    } else {
      testResults.tradeGeneration.details = `Trade generation failed: ${result.data.error}`;
      console.log('❌ Trade generation failed:', result.data.error);
      return null;
    }
    
  } catch (error) {
    testResults.tradeGeneration.details = `Trade generation error: ${error.message}`;
    console.log('❌ Trade generation error:', error.message);
    return null;
  }
}

// Test 3: Verify Trade Count and Win Rate
async function testTradeCountAndWinRate() {
  console.log('\n🔢 Testing trade count and win rate...');
  
  const expectedCount = 100;
  const expectedWinRate = 71;
  const actualCount = testResults.tradeCount.actual;
  const actualWinRate = testResults.winRate.actual;
  
  testResults.tradeCount.passed = actualCount === expectedCount;
  testResults.winRate.passed = actualWinRate === expectedWinRate;
  
  console.log(`📊 Trade Count: Expected ${expectedCount}, Got ${actualCount} - ${testResults.tradeCount.passed ? '✅' : '❌'}`);
  console.log(`🎯 Win Rate: Expected ${expectedWinRate}%, Got ${actualWinRate}% - ${testResults.winRate.passed ? '✅' : '❌'}`);
}

// Test 4: Verify Data Integrity
async function testDataIntegrity(tradesData) {
  console.log('\n🔍 Testing data integrity...');
  
  if (!tradesData || !tradesData.trades) {
    console.log('❌ No trade data available for integrity testing');
    return;
  }
  
  const trades = tradesData.trades;
  const symbols = new Set();
  const markets = new Set();
  const emotionalStates = new Set();
  const sides = new Set();
  
  // Expected values from the API
  const expectedSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'NFLX', 'BTCUSD', 'ETHUSD', 'SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'OIL', 'NG'];
  const expectedMarkets = ['Stock', 'Crypto', 'Forex', 'Futures'];
  const expectedEmotions = ['CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'];
  const expectedSides = ['Buy', 'Sell'];
  
  let validSymbols = 0;
  let validMarkets = 0;
  let validEmotions = 0;
  let validSides = 0;
  let validDates = 0;
  let validTimes = 0;
  
  trades.forEach(trade => {
    // Check symbols
    if (expectedSymbols.includes(trade.symbol)) {
      validSymbols++;
      symbols.add(trade.symbol);
    }
    
    // Check markets
    if (expectedMarkets.includes(trade.market)) {
      validMarkets++;
      markets.add(trade.market);
    }
    
    // Check emotional states
    if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
      trade.emotional_state.forEach(emotion => {
        if (expectedEmotions.includes(emotion)) {
          validEmotions++;
          emotionalStates.add(emotion);
        }
      });
    }
    
    // Check sides
    if (expectedSides.includes(trade.side)) {
      validSides++;
      sides.add(trade.side);
    }
    
    // Check dates (should be weekdays only)
    if (trade.trade_date) {
      const date = new Date(trade.trade_date);
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday or Saturday
        validDates++;
      }
    }
    
    // Check times (should be within trading hours 6 AM - 4 PM)
    if (trade.entry_time && trade.exit_time) {
      const [entryHour] = trade.entry_time.split(':').map(Number);
      const [exitHour] = trade.exit_time.split(':').map(Number);
      if (entryHour >= 6 && entryHour <= 16 && exitHour >= 6 && exitHour <= 16) {
        validTimes++;
      }
    }
  });
  
  testResults.dataIntegrity.details = {
    symbols: { valid: validSymbols, total: trades.length, unique: Array.from(symbols) },
    markets: { valid: validMarkets, total: trades.length, unique: Array.from(markets) },
    emotions: { valid: validEmotions, total: trades.length * 1.5, unique: Array.from(emotionalStates) }, // Average 1.5 emotions per trade
    sides: { valid: validSides, total: trades.length, unique: Array.from(sides) },
    dates: { valid: validDates, total: trades.length },
    times: { valid: validTimes, total: trades.length }
  };
  
  testResults.dataIntegrity.passed = 
    validSymbols === trades.length &&
    validMarkets === trades.length &&
    validSides === trades.length &&
    validDates === trades.length &&
    validTimes === trades.length;
  
  console.log(`📊 Symbols: ${validSymbols}/${trades.length} valid - ${validSymbols === trades.length ? '✅' : '❌'}`);
  console.log(`🏢 Markets: ${validMarkets}/${trades.length} valid - ${validMarkets === trades.length ? '✅' : '❌'}`);
  console.log(`😊 Emotions: ${validEmotions} valid instances - ${validEmotions > 0 ? '✅' : '❌'}`);
  console.log(`📈 Sides: ${validSides}/${trades.length} valid - ${validSides === trades.length ? '✅' : '❌'}`);
  console.log(`📅 Dates: ${validDates}/${trades.length} valid (weekdays only) - ${validDates === trades.length ? '✅' : '❌'}`);
  console.log(`⏰ Times: ${validTimes}/${trades.length} valid (trading hours) - ${validTimes === trades.length ? '✅' : '❌'}`);
}

// Test 5: Verify P&L Ranges
async function testPnLRanges(tradesData) {
  console.log('\n💰 Testing P&L ranges...');
  
  if (!tradesData || !tradesData.trades) {
    console.log('❌ No trade data available for P&L testing');
    return;
  }
  
  const trades = tradesData.trades;
  let validWinRanges = 0;
  let validLossRanges = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  
  trades.forEach(trade => {
    if (trade.pnl > 0) {
      winningTrades++;
      if (trade.pnl >= 50 && trade.pnl <= 500) {
        validWinRanges++;
      }
    } else if (trade.pnl < 0) {
      losingTrades++;
      if (trade.pnl >= -300 && trade.pnl <= -25) {
        validLossRanges++;
      }
    }
  });
  
  testResults.pnlRanges.details = {
    winningTrades: { count: winningTrades, validRanges: validWinRanges },
    losingTrades: { count: losingTrades, validRanges: validLossRanges }
  };
  
  testResults.pnlRanges.passed = 
    validWinRanges === winningTrades && 
    validLossRanges === losingTrades;
  
  console.log(`📈 Winning trades: ${validWinRanges}/${winningTrades} in correct range ($50-$500) - ${validWinRanges === winningTrades ? '✅' : '❌'}`);
  console.log(`📉 Losing trades: ${validLossRanges}/${losingTrades} in correct range (-$25 to -$300) - ${validLossRanges === losingTrades ? '✅' : '❌'}`);
}

// Test 6: Verify Date Distribution
async function testDateDistribution(tradesData) {
  console.log('\n📅 Testing date distribution...');
  
  if (!tradesData || !tradesData.trades) {
    console.log('❌ No trade data available for date distribution testing');
    return;
  }
  
  const trades = tradesData.trades;
  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  let validDateRange = 0;
  const dateDistribution = {};
  
  trades.forEach(trade => {
    if (trade.trade_date) {
      const tradeDate = new Date(trade.trade_date);
      
      // Check if date is within the last 2 months
      if (tradeDate >= twoMonthsAgo && tradeDate <= now) {
        validDateRange++;
      }
      
      // Track distribution by month
      const monthKey = tradeDate.toISOString().slice(0, 7); // YYYY-MM
      dateDistribution[monthKey] = (dateDistribution[monthKey] || 0) + 1;
    }
  });
  
  testResults.dateDistribution.details = {
    validDateRange: { count: validDateRange, total: trades.length },
    distribution: dateDistribution
  };
  
  testResults.dateDistribution.passed = validDateRange === trades.length;
  
  console.log(`📅 Date range: ${validDateRange}/${trades.length} trades within last 2 months - ${validDateRange === trades.length ? '✅' : '❌'}`);
  console.log('📊 Monthly distribution:', dateDistribution);
}

// Test 7: Verify Strategy Distribution
async function testStrategyDistribution(tradesData) {
  console.log('\n🎯 Testing strategy distribution...');
  
  if (!tradesData || !tradesData.trades) {
    console.log('❌ No trade data available for strategy distribution testing');
    return;
  }
  
  const trades = tradesData.trades;
  const strategyDistribution = {};
  let tradesWithStrategies = 0;
  
  trades.forEach(trade => {
    if (trade.strategy_id) {
      tradesWithStrategies++;
      strategyDistribution[trade.strategy_id] = (strategyDistribution[trade.strategy_id] || 0) + 1;
    }
  });
  
  testResults.strategyDistribution.details = {
    tradesWithStrategies: { count: tradesWithStrategies, total: trades.length },
    distribution: strategyDistribution
  };
  
  testResults.strategyDistribution.passed = tradesWithStrategies === trades.length;
  
  console.log(`🎯 Strategy assignment: ${tradesWithStrategies}/${trades.length} trades have strategies - ${tradesWithStrategies === trades.length ? '✅' : '❌'}`);
  console.log('📊 Strategy distribution:', strategyDistribution);
}

// Test 8: Error Handling
async function testErrorHandling() {
  console.log('\n⚠️ Testing error handling...');
  
  let errorTestsPassed = 0;
  let totalErrorTests = 2;
  
  // Test 1: Invalid action
  try {
    const result = await makeAuthenticatedRequest(session, 'invalid-action');
    
    if (result.status === 400 && result.data.error === 'Invalid action') {
      errorTestsPassed++;
      console.log('✅ Invalid action error handling works correctly');
    } else {
      console.log('❌ Invalid action error handling failed');
    }
  } catch (error) {
    console.log('❌ Invalid action test error:', error.message);
  }
  
  // Test 2: Generate trades without strategies (if we can test this)
  // This would require deleting strategies first, which might be disruptive
  // For now, we'll assume this works based on the code review
  
  testResults.errorHandling.passed = errorTestsPassed === totalErrorTests;
  testResults.errorHandling.details = { passed: errorTestsPassed, total: totalErrorTests };
  
  console.log(`⚠️ Error handling: ${errorTestsPassed}/${totalErrorTests} tests passed - ${errorTestsPassed === totalErrorTests ? '✅' : '❌'}`);
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE TRADE GENERATION TEST REPORT');
  console.log('='.repeat(60));
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(test => test.passed).length;
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  
  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${testName.toUpperCase()}: ${status}`);
    
    if (testName === 'tradeGeneration' && result.details) {
      console.log(`   - Generated ${result.details.count} trades`);
      console.log(`   - Win rate: ${result.details.stats.winRate}%`);
      console.log(`   - Total P&L: $${result.details.stats.totalPnL.toFixed(2)}`);
    }
    
    if (testName === 'dataIntegrity' && result.details) {
      console.log(`   - Symbols: ${result.details.symbols.valid}/${result.details.symbols.total} valid`);
      console.log(`   - Markets: ${result.details.markets.valid}/${result.details.markets.total} valid`);
      console.log(`   - Dates: ${result.details.dates.valid}/${result.details.dates.total} valid`);
      console.log(`   - Times: ${result.details.times.valid}/${result.details.times.total} valid`);
    }
    
    if (testName === 'pnlRanges' && result.details) {
      console.log(`   - Winning trades in range: ${result.details.winningTrades.validRanges}/${result.details.winningTrades.count}`);
      console.log(`   - Losing trades in range: ${result.details.losingTrades.validRanges}/${result.details.losingTrades.count}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Save results to file
  const fs = require('fs');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1)
    },
    detailedResults: testResults
  };
  
  fs.writeFileSync('trade-generation-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('📄 Detailed results saved to: trade-generation-test-results.json');
  
  return reportData;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting comprehensive trade generation tests...');
  console.log('📅 Test started at:', new Date().toISOString());
  
  try {
    // Test authentication first
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('❌ Authentication failed. Cannot proceed with other tests.');
      return generateTestReport();
    }
    
    // Test trade generation
    const tradesData = await testTradeGeneration();
    if (!tradesData) {
      console.log('❌ Trade generation failed. Cannot proceed with data validation tests.');
      return generateTestReport();
    }
    
    // Run all validation tests
    await testTradeCountAndWinRate();
    await testDataIntegrity(tradesData);
    await testPnLRanges(tradesData);
    await testDateDistribution(tradesData);
    await testStrategyDistribution(tradesData);
    await testErrorHandling();
    
    // Generate final report
    return generateTestReport();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return generateTestReport();
  }
}

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };