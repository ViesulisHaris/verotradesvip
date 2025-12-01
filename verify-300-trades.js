const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 VERIFYING 300 TRADES GENERATION RESULTS');
console.log('===========================================');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expected specifications
const EXPECTED = {
  TOTAL_TRADES: 300,
  WIN_RATE: 0.68, // 68% wins
  WINNING_TRADES: 204, // 68% of 300
  LOSING_TRADES: 96,   // 32% of 300
  STRATEGY_DISTRIBUTION: {
    'Momentum Breakout Strategy': 60,
    'Mean Reversion Strategy': 60,
    'Scalping Strategy': 60,
    'Swing Trading Strategy': 60,
    'Options Income Strategy': 60
  },
  MARKET_DISTRIBUTION: {
    'Stock': 0.40,    // 40%
    'Crypto': 0.30,   // 30%
    'Forex': 0.20,    // 20%
    'Futures': 0.10   // 10%
  }
};

let authSupabase = null;
let currentUserId = null;

// Authenticate function
async function authenticate() {
  console.log('\n🔐 Authenticating user...');
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      throw authError;
    }
    
    if (!authData.session) {
      throw new Error('No session obtained after authentication');
    }
    
    // Create authenticated client
    authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    currentUserId = authData.session.user.id;
    console.log(`✅ Authenticated user ID: ${currentUserId}`);
    
    return authData.session;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Function to get the most recent 300 trades
async function getRecentTrades() {
  console.log('\n📊 Fetching the most recent 300 trades...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(300);
    
    if (error) {
      console.error('❌ Error fetching trades:', error.message);
      throw error;
    }
    
    if (!trades || trades.length === 0) {
      console.log('⚠️  No trades found');
      return [];
    }
    
    console.log(`✅ Found ${trades.length} recent trades`);
    return trades;
  } catch (error) {
    console.error('❌ Failed to fetch trades:', error);
    throw error;
  }
}

// Function to analyze the trades
function analyzeTrades(trades) {
  console.log('\n🔍 Analyzing trade data...');
  
  const results = {
    totalTrades: trades.length,
    winningTrades: 0,
    losingTrades: 0,
    marketDistribution: {},
    strategyDistribution: {},
    emotionalStatesPresent: false,
    tradesWithEmotionalData: 0
  };
  
  // Analyze each trade
  trades.forEach(trade => {
    // Count wins/losses
    if (trade.pnl > 0) {
      results.winningTrades++;
    } else if (trade.pnl < 0) {
      results.losingTrades++;
    }
    
    // Count market distribution
    if (trade.market) {
      results.marketDistribution[trade.market] = (results.marketDistribution[trade.market] || 0) + 1;
    }
    
    // Count strategy distribution
    if (trade.strategy_id) {
      results.strategyDistribution[trade.strategy_id] = (results.strategyDistribution[trade.strategy_id] || 0) + 1;
    }
    
    // Check for emotional states
    if (trade.emotional_state) {
      let emotionalStates = [];
      
      // Handle both string and array formats
      if (typeof trade.emotional_state === 'string') {
        try {
          emotionalStates = JSON.parse(trade.emotional_state);
        } catch (e) {
          // If parsing fails, it's not valid emotional data
        }
      } else if (Array.isArray(trade.emotional_state)) {
        emotionalStates = trade.emotional_state;
      }
      
      if (emotionalStates.length > 0) {
        results.tradesWithEmotionalData++;
        results.emotionalStatesPresent = true;
      }
    }
  });
  
  return results;
}

// Function to get strategy names
async function getStrategyNames() {
  console.log('\n📋 Fetching strategy names...');
  
  try {
    const { data: strategies, error } = await authSupabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching strategies:', error.message);
      throw error;
    }
    
    return strategies || [];
  } catch (error) {
    console.error('❌ Failed to fetch strategies:', error);
    throw error;
  }
}

// Function to compare results with expectations
function compareResults(results, strategies) {
  console.log('\n📊 Comparing results with expectations...');
  
  // Check total trades
  console.log(`\n📈 Total Trades:`);
  console.log(`  Expected: ${EXPECTED.TOTAL_TRADES}`);
  console.log(`  Actual: ${results.totalTrades}`);
  console.log(`  Status: ${results.totalTrades === EXPECTED.TOTAL_TRADES ? '✅ PASS' : '❌ FAIL'}`);
  
  // Check win rate
  const actualWinRate = results.totalTrades > 0 ? (results.winningTrades / results.totalTrades) : 0;
  console.log(`\n📈 Win Rate:`);
  console.log(`  Expected: ${(EXPECTED.WIN_RATE * 100).toFixed(1)}% (${EXPECTED.WINNING_TRADES} wins, ${EXPECTED.LOSING_TRADES} losses)`);
  console.log(`  Actual: ${(actualWinRate * 100).toFixed(1)}% (${results.winningTrades} wins, ${results.losingTrades} losses)`);
  console.log(`  Status: ${Math.abs(actualWinRate - EXPECTED.WIN_RATE) < 0.01 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Check market distribution
  console.log(`\n🏢 Market Distribution:`);
  Object.entries(EXPECTED.MARKET_DISTRIBUTION).forEach(([market, expectedPercentage]) => {
    const expectedCount = Math.round(EXPECTED.TOTAL_TRADES * expectedPercentage);
    const actualCount = results.marketDistribution[market] || 0;
    const actualPercentage = results.totalTrades > 0 ? (actualCount / results.totalTrades) : 0;
    
    console.log(`  ${market}:`);
    console.log(`    Expected: ${expectedCount} trades (${(expectedPercentage * 100).toFixed(0)}%)`);
    console.log(`    Actual: ${actualCount} trades (${(actualPercentage * 100).toFixed(1)}%)`);
    console.log(`    Status: ${Math.abs(actualPercentage - expectedPercentage) < 0.05 ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  // Check strategy distribution
  console.log(`\n📋 Strategy Distribution:`);
  Object.entries(EXPECTED.STRATEGY_DISTRIBUTION).forEach(([strategyName, expectedCount]) => {
    const strategy = strategies.find(s => s.name === strategyName);
    const actualCount = strategy ? (results.strategyDistribution[strategy.id] || 0) : 0;
    
    console.log(`  ${strategyName}:`);
    console.log(`    Expected: ${expectedCount} trades`);
    console.log(`    Actual: ${actualCount} trades`);
    console.log(`    Status: ${actualCount === expectedCount ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  // Check emotional states
  console.log(`\n😊 Emotional States:`);
  console.log(`  Expected: All trades should have emotional data`);
  console.log(`  Actual: ${results.tradesWithEmotionalData}/${results.totalTrades} trades have emotional data`);
  console.log(`  Status: ${results.tradesWithEmotionalData === results.totalTrades ? '✅ PASS' : '❌ FAIL'}`);
  
  // Overall assessment
  const totalChecks = 4; // Total trades, win rate, market distribution, strategy distribution, emotional states
  let passedChecks = 0;
  
  if (results.totalTrades === EXPECTED.TOTAL_TRADES) passedChecks++;
  if (Math.abs(actualWinRate - EXPECTED.WIN_RATE) < 0.01) passedChecks++;
  if (results.tradesWithEmotionalData === results.totalTrades) passedChecks++;
  
  // Check market distribution (all markets within 5% tolerance)
  let marketDistPass = true;
  Object.entries(EXPECTED.MARKET_DISTRIBUTION).forEach(([market, expectedPercentage]) => {
    const actualCount = results.marketDistribution[market] || 0;
    const actualPercentage = results.totalTrades > 0 ? (actualCount / results.totalTrades) : 0;
    if (Math.abs(actualPercentage - expectedPercentage) >= 0.05) {
      marketDistPass = false;
    }
  });
  if (marketDistPass) passedChecks++;
  
  // Check strategy distribution (all strategies have correct count)
  let strategyDistPass = true;
  Object.entries(EXPECTED.STRATEGY_DISTRIBUTION).forEach(([strategyName, expectedCount]) => {
    const strategy = strategies.find(s => s.name === strategyName);
    const actualCount = strategy ? (results.strategyDistribution[strategy.id] || 0) : 0;
    if (actualCount !== expectedCount) {
      strategyDistPass = false;
    }
  });
  if (strategyDistPass) passedChecks++;
  
  console.log(`\n🎯 Overall Assessment:`);
  console.log(`  Passed Checks: ${passedChecks}/${totalChecks + 1}`); // +1 for strategy distribution
  console.log(`  Status: ${passedChecks === totalChecks + 1 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return passedChecks === totalChecks + 1;
}

// Main execution function
async function main() {
  try {
    // Authenticate
    await authenticate();
    
    // Get recent trades
    const trades = await getRecentTrades();
    
    if (trades.length === 0) {
      console.log('❌ No trades found to verify');
      return;
    }
    
    // Analyze trades
    const results = analyzeTrades(trades);
    
    // Get strategy names
    const strategies = await getStrategyNames();
    
    // Compare with expectations
    const allTestsPassed = compareResults(results, strategies);
    
    console.log('\n🎉 VERIFICATION COMPLETED');
    console.log('===========================================');
    
    if (allTestsPassed) {
      console.log('✅ All tests passed! The generate-300-trades.js script works correctly.');
    } else {
      console.log('❌ Some tests failed. Please review the results above.');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during verification:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, analyzeTrades };