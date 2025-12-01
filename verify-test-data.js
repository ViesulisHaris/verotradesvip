const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 COMPREHENSIVE TEST DATA VERIFICATION');
console.log('======================================');
console.log('Verifying 100 diverse trades were inserted correctly...');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Expected specifications from the generator
const EXPECTED_SPECS = {
  TOTAL_TRADES: 100,
  WIN_RATE: 0.71, // 71% wins
  WINNING_TRADES: 71,
  LOSING_TRADES: 29,
  STRATEGY_DISTRIBUTION: {
    'Momentum Breakout': 20,
    'Mean Reversion': 20,
    'Scalping': 20,
    'Swing Trading': 20,
    'Options Income': 20
  },
  MARKET_DISTRIBUTION: {
    'Stock': 0.40,    // 40%
    'Crypto': 0.30,   // 30%
    'Forex': 0.20,    // 20%
    'Futures': 0.10   // 10%
  },
  EMOTIONS: ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL']
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let authSupabase = null;
let currentUserId = null;

// Authentication function
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

// Function to verify total trade count
async function verifyTradeCount() {
  console.log('\n📊 Verifying total trade count...');
  
  try {
    const { data: trades, error, count } = await authSupabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error counting trades:', error.message);
      return false;
    }
    
    console.log(`📈 Total trades found: ${count}`);
    
    if (count === EXPECTED_SPECS.TOTAL_TRADES) {
      console.log('✅ Trade count matches expected 100 trades');
      return true;
    } else {
      console.log(`❌ Expected ${EXPECTED_SPECS.TOTAL_TRADES} trades, found ${count}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying trade count:', error.message);
    return false;
  }
}

// Function to verify win rate
async function verifyWinRate() {
  console.log('\n📈 Verifying win rate...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('pnl')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for win rate:', error.message);
      return false;
    }
    
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl < 0);
    const actualWinRate = (winningTrades.length / trades.length);
    
    console.log(`📊 Win Rate Analysis:`);
    console.log(`  Winning trades: ${winningTrades.length}`);
    console.log(`  Losing trades: ${losingTrades.length}`);
    console.log(`  Actual win rate: ${(actualWinRate * 100).toFixed(1)}%`);
    console.log(`  Expected win rate: ${(EXPECTED_SPECS.WIN_RATE * 100).toFixed(1)}%`);
    
    // Allow small deviation (±2%)
    const deviation = Math.abs(actualWinRate - EXPECTED_SPECS.WIN_RATE);
    if (deviation <= 0.02) {
      console.log('✅ Win rate is within acceptable range');
      return true;
    } else {
      console.log(`⚠️  Win rate deviation: ${(deviation * 100).toFixed(1)}% (outside ±2% tolerance)`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying win rate:', error.message);
    return false;
  }
}

// Function to verify market distribution
async function verifyMarketDistribution() {
  console.log('\n🏢 Verifying market distribution...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('market')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for market distribution:', error.message);
      return false;
    }
    
    const marketDistribution = {};
    trades.forEach(trade => {
      marketDistribution[trade.market] = (marketDistribution[trade.market] || 0) + 1;
    });
    
    console.log('📊 Market Distribution Analysis:');
    let allMarketsValid = true;
    
    Object.entries(marketDistribution).forEach(([market, count]) => {
      const actualPercentage = (count / trades.length);
      const expectedPercentage = EXPECTED_SPECS.MARKET_DISTRIBUTION[market];
      const deviation = Math.abs(actualPercentage - expectedPercentage);
      
      console.log(`  ${market}: ${count} trades (${(actualPercentage * 100).toFixed(1)}%) - Expected: ${(expectedPercentage * 100).toFixed(1)}%`);
      
      // Allow ±5% deviation for market distribution
      if (deviation > 0.05) {
        console.log(`    ⚠️  Deviation: ${(deviation * 100).toFixed(1)}% (outside ±5% tolerance)`);
        allMarketsValid = false;
      } else {
        console.log(`    ✅ Within acceptable range`);
      }
    });
    
    return allMarketsValid;
  } catch (error) {
    console.error('❌ Error verifying market distribution:', error.message);
    return false;
  }
}

// Function to verify strategy distribution
async function verifyStrategyDistribution() {
  console.log('\n📋 Verifying strategy distribution...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('strategy_id')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for strategy distribution:', error.message);
      return false;
    }
    
    const { data: strategies, error: strategyError } = await authSupabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', currentUserId);
    
    if (strategyError) {
      console.error('❌ Error fetching strategies:', strategyError.message);
      return false;
    }
    
    const strategyDistribution = {};
    trades.forEach(trade => {
      const strategy = strategies.find(s => s.id === trade.strategy_id);
      if (strategy) {
        strategyDistribution[strategy.name] = (strategyDistribution[strategy.name] || 0) + 1;
      }
    });
    
    console.log('📊 Strategy Distribution Analysis:');
    let allStrategiesValid = true;
    
    Object.entries(strategyDistribution).forEach(([strategy, count]) => {
      const expectedCount = EXPECTED_SPECS.STRATEGY_DISTRIBUTION[strategy];
      const deviation = Math.abs(count - expectedCount);
      
      console.log(`  ${strategy}: ${count} trades - Expected: ${expectedCount}`);
      
      // Allow ±2 trades deviation for strategy distribution
      if (deviation > 2) {
        console.log(`    ⚠️  Deviation: ${deviation} trades (outside ±2 tolerance)`);
        allStrategiesValid = false;
      } else {
        console.log(`    ✅ Within acceptable range`);
      }
    });
    
    return allStrategiesValid;
  } catch (error) {
    console.error('❌ Error verifying strategy distribution:', error.message);
    return false;
  }
}

// Function to verify emotional states
async function verifyEmotionalStates() {
  console.log('\n😊 Verifying emotional states...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('emotional_state')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for emotional states:', error.message);
      return false;
    }
    
    const emotionDistribution = {};
    let tradesWithEmotions = 0;
    
    trades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        tradesWithEmotions++;
        trade.emotional_state.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
      }
    });
    
    console.log('📊 Emotional States Analysis:');
    console.log(`  Trades with emotional data: ${tradesWithEmotions}/${trades.length} (${((tradesWithEmotions/trades.length)*100).toFixed(1)}%)`);
    
    let allEmotionsPresent = true;
    
    EXPECTED_SPECS.EMOTIONS.forEach(expectedEmotion => {
      const count = emotionDistribution[expectedEmotion] || 0;
      if (count > 0) {
        console.log(`  ✅ ${expectedEmotion}: ${count} occurrences`);
      } else {
        console.log(`  ❌ ${expectedEmotion}: 0 occurrences (MISSING)`);
        allEmotionsPresent = false;
      }
    });
    
    return allEmotionsPresent && tradesWithEmotions === trades.length;
  } catch (error) {
    console.error('❌ Error verifying emotional states:', error.message);
    return false;
  }
}

// Function to verify P&L ranges
async function verifyPnLRanges() {
  console.log('\n💰 Verifying P&L ranges...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('pnl')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for P&L analysis:', error.message);
      return false;
    }
    
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl < 0);
    
    const winValues = winningTrades.map(t => t.pnl);
    const lossValues = losingTrades.map(t => t.pnl);
    
    const minWin = Math.min(...winValues);
    const maxWin = Math.max(...winValues);
    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    
    console.log('📊 P&L Range Analysis:');
    console.log(`  Winning trades: $${minWin.toFixed(2)} - $${maxWin.toFixed(2)} (Expected: $50-$500)`);
    console.log(`  Losing trades: $${minLoss.toFixed(2)} - $${maxLoss.toFixed(2)} (Expected: -$25 to -$300)`);
    
    const winsInRange = minWin >= 50 && maxWin <= 500;
    const lossesInRange = minLoss >= -300 && maxLoss <= -25;
    
    if (winsInRange && lossesInRange) {
      console.log('✅ P&L ranges are within expected specifications');
      return true;
    } else {
      if (!winsInRange) console.log('❌ Winning P&L outside expected range');
      if (!lossesInRange) console.log('❌ Losing P&L outside expected range');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying P&L ranges:', error.message);
    return false;
  }
}

// Function to verify date range
async function verifyDateRange() {
  console.log('\n📅 Verifying date range...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('trade_date')
      .eq('user_id', currentUserId)
      .order('trade_date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching trades for date range:', error.message);
      return false;
    }
    
    const minDate = new Date(trades[0].trade_date);
    const maxDate = new Date(trades[trades.length - 1].trade_date);
    const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    const expectedMinDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const expectedMaxDate = new Date();
    
    console.log('📊 Date Range Analysis:');
    console.log(`  Earliest Trade: ${minDate.toISOString().split('T')[0]}`);
    console.log(`  Latest Trade: ${maxDate.toISOString().split('T')[0]}`);
    console.log(`  Trading Period: ${daysDiff} days`);
    console.log(`  Expected Range: ~60 days ending today`);
    
    // Check if date range is reasonable (within 65 days and includes recent dates)
    const dateRangeValid = daysDiff >= 50 && daysDiff <= 65 && maxDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (dateRangeValid) {
      console.log('✅ Date range is within expected specifications');
      return true;
    } else {
      console.log('⚠️  Date range may be outside expected specifications');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying date range:', error.message);
    return false;
  }
}

// Function to check data quality and completeness
async function verifyDataQuality() {
  console.log('\n🔍 Verifying data quality and completeness...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for quality check:', error.message);
      return false;
    }
    
    let qualityIssues = [];
    
    trades.forEach((trade, index) => {
      // Check required fields
      if (!trade.symbol) qualityIssues.push(`Trade ${index + 1}: Missing symbol`);
      if (!trade.market) qualityIssues.push(`Trade ${index + 1}: Missing market`);
      if (!trade.strategy_id) qualityIssues.push(`Trade ${index + 1}: Missing strategy_id`);
      if (!trade.trade_date) qualityIssues.push(`Trade ${index + 1}: Missing trade_date`);
      if (!trade.side) qualityIssues.push(`Trade ${index + 1}: Missing side`);
      if (trade.quantity === null || trade.quantity === undefined) qualityIssues.push(`Trade ${index + 1}: Missing quantity`);
      if (trade.entry_price === null || trade.entry_price === undefined) qualityIssues.push(`Trade ${index + 1}: Missing entry_price`);
      if (trade.exit_price === null || trade.exit_price === undefined) qualityIssues.push(`Trade ${index + 1}: Missing exit_price`);
      if (trade.pnl === null || trade.pnl === undefined) qualityIssues.push(`Trade ${index + 1}: Missing pnl`);
      
      // Check data validity
      if (trade.side && !['Buy', 'Sell'].includes(trade.side)) {
        qualityIssues.push(`Trade ${index + 1}: Invalid side value: ${trade.side}`);
      }
      if (trade.market && !['Stock', 'Crypto', 'Forex', 'Futures'].includes(trade.market)) {
        qualityIssues.push(`Trade ${index + 1}: Invalid market value: ${trade.market}`);
      }
    });
    
    console.log(`📊 Data Quality Analysis:`);
    console.log(`  Total trades checked: ${trades.length}`);
    console.log(`  Quality issues found: ${qualityIssues.length}`);
    
    if (qualityIssues.length > 0) {
      console.log('\n❌ Quality Issues:');
      qualityIssues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
      if (qualityIssues.length > 10) {
        console.log(`  ... and ${qualityIssues.length - 10} more issues`);
      }
      return false;
    } else {
      console.log('✅ All trades passed data quality checks');
      return true;
    }
  } catch (error) {
    console.error('❌ Error verifying data quality:', error.message);
    return false;
  }
}

// Main verification function
async function main() {
  try {
    console.log('🚀 Starting comprehensive test data verification...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Run all verification checks
    const results = {
      tradeCount: await verifyTradeCount(),
      winRate: await verifyWinRate(),
      marketDistribution: await verifyMarketDistribution(),
      strategyDistribution: await verifyStrategyDistribution(),
      emotionalStates: await verifyEmotionalStates(),
      pnlRanges: await verifyPnLRanges(),
      dateRange: await verifyDateRange(),
      dataQuality: await verifyDataQuality()
    };
    
    // Step 3: Generate comprehensive report
    console.log('\n📋 COMPREHENSIVE VERIFICATION REPORT');
    console.log('====================================');
    
    const passedChecks = Object.values(results).filter(result => result).length;
    const totalChecks = Object.keys(results).length;
    
    Object.entries(results).forEach(([check, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const checkName = check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${status} ${checkName}`);
    });
    
    console.log(`\n📊 Overall Result: ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL VERIFICATION CHECKS PASSED!');
      console.log('✅ The 100 diverse trades were inserted correctly and meet all specifications');
    } else {
      console.log('\n⚠️  SOME VERIFICATION CHECKS FAILED');
      console.log('❌ Please review the failed checks above and address any issues');
    }
    
    // Step 4: Save verification results to file
    const verificationReport = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      expectedSpecs: EXPECTED_SPECS,
      verificationResults: results,
      summary: {
        passedChecks,
        totalChecks,
        overallStatus: passedChecks === totalChecks ? 'PASS' : 'FAIL'
      }
    };
    
    require('fs').writeFileSync(
      `test-data-verification-results-${Date.now()}.json`,
      JSON.stringify(verificationReport, null, 2)
    );
    
    console.log(`\n💾 Detailed verification results saved to: test-data-verification-results-${Date.now()}.json`);
    
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

module.exports = { main, verifyTradeCount, verifyWinRate };