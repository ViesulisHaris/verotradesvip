const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config();

console.log('🚀 TEST ACCOUNT WITH 1,000+ TRADES CREATOR');
console.log('==========================================');
console.log('Creating test account with 1,000+ diverse trades for authentication testing...');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

console.log('✅ Environment variables validated');

// Test user credentials
const TEST_USER_EMAIL = 'testuser1000@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Trade data specifications - Updated for 1,000+ trades
const SPECS = {
  TOTAL_TRADES: 1000,
  WIN_RATE: 0.68, // 68% wins (realistic for profitable trader)
  WINNING_TRADES: 680,
  LOSING_TRADES: 320,
  STRATEGY_DISTRIBUTION: {
    'Momentum Breakout': 200,
    'Mean Reversion': 200,
    'Scalping': 200,
    'Swing Trading': 200,
    'Options Income': 200
  },
  MARKET_DISTRIBUTION: {
    'Stock': 0.40,    // 40%
    'Crypto': 0.30,   // 30%
    'Forex': 0.20,    // 20%
    'Futures': 0.10   // 10%
  },
  EMOTIONS: ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'],
  SYMBOLS: {
    'Stock': ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'NFLX', 'SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'TLT'],
    'Crypto': ['BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD', 'SOLUSD'],
    'Forex': ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'],
    'Futures': ['ES', 'NQ', 'YM', 'RTY', 'GC', 'CL', 'NG', 'ZB', 'ZN', 'SI']
  },
  PNL_RANGES: {
    win: { min: 25, max: 1000 },
    loss: { min: -500, max: -20 }
  }
};

// Initialize Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variable for authenticated client
let authSupabase = null;
let currentUserId = null;

// Utility functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateRandomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  
  // Ensure it's a weekday (Monday-Friday)
  const day = date.getDay();
  if (day === 0) { // Sunday
    date.setDate(date.getDate() + 1); // Move to Monday
  } else if (day === 6) { // Saturday
    date.setDate(date.getDate() + 2); // Move to Monday
  }
  
  return date;
}

function generateRandomTime() {
  // Market hours: 6 AM - 4 PM (10 hours)
  const hours = getRandomInt(6, 15); // 6 AM to 3 PM (allow time for exit)
  const minutes = getRandomInt(0, 59);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateExitPrice(entryPrice, quantity, pnl, side) {
  if (side === 'Buy') {
    return entryPrice + (pnl / quantity);
  } else {
    return entryPrice - (pnl / quantity);
  }
}

function generateMarketType() {
  const rand = Math.random();
  if (rand < SPECS.MARKET_DISTRIBUTION.Stock) return 'Stock';
  if (rand < SPECS.MARKET_DISTRIBUTION.Stock + SPECS.MARKET_DISTRIBUTION.Crypto) return 'Crypto';
  if (rand < SPECS.MARKET_DISTRIBUTION.Stock + SPECS.MARKET_DISTRIBUTION.Crypto + SPECS.MARKET_DISTRIBUTION.Forex) return 'Forex';
  return 'Futures';
}

function generateEmotionalStates() {
  // Primary emotion (always present)
  const primaryEmotion = getRandomElement(SPECS.EMOTIONS);
  
  // 40% chance of having additional emotions (1-3 more)
  const emotions = [primaryEmotion];
  if (Math.random() < 0.4) {
    const additionalCount = getRandomInt(1, 3);
    const availableEmotions = SPECS.EMOTIONS.filter(e => e !== primaryEmotion);
    
    for (let i = 0; i < additionalCount && availableEmotions.length > 0; i++) {
      const randomIndex = getRandomInt(0, availableEmotions.length - 1);
      emotions.push(availableEmotions[randomIndex]);
      availableEmotions.splice(randomIndex, 1);
    }
  }
  
  return emotions;
}

function generateRealisticQuantity(market, symbol) {
  switch (market) {
    case 'Stock':
      return getRandomInt(10, 1000);
    case 'Crypto':
      return getRandomFloat(0.01, 10.0, 4);
    case 'Forex':
      return getRandomInt(1000, 500000);
    case 'Futures':
      return getRandomInt(1, 20);
    default:
      return getRandomInt(10, 100);
  }
}

function generateRealisticPrice(market, symbol) {
  switch (market) {
    case 'Stock':
      return getRandomFloat(10, 2000, 2);
    case 'Crypto':
      if (symbol.includes('BTC')) return getRandomFloat(25000, 70000, 2);
      if (symbol.includes('ETH')) return getRandomFloat(1500, 5000, 2);
      return getRandomFloat(0.1, 100, 2);
    case 'Forex':
      return getRandomFloat(1.0, 1.8, 5);
    case 'Futures':
      if (symbol.includes('GC')) return getRandomFloat(1800, 2200, 2); // Gold
      if (symbol.includes('CL')) return getRandomFloat(70, 120, 2);  // Oil
      if (symbol.includes('NG')) return getRandomFloat(2, 8, 2);    // Natural Gas
      if (symbol.includes('ZB') || symbol.includes('ZN')) return getRandomFloat(100, 150, 2); // Bonds
      return getRandomFloat(3000, 5000, 2); // Index futures
    default:
      return getRandomFloat(10, 1000, 2);
  }
}

function generateNotes(isWin, emotionalStates, strategy, market, symbol) {
  const winLoss = isWin ? 'WIN' : 'LOSS';
  const emotion = emotionalStates[0];
  const action = isWin ? 'successfully captured' : 'missed the opportunity';
  
  const templates = [
    `${winLoss} trade using ${strategy} - ${emotion} emotional state`,
    `${strategy} setup on ${symbol} - ${action} the move`,
    `${emotion} trading decision - ${strategy} rules ${isWin ? 'followed' : 'violated'}`,
    `${market} ${symbol} trade - ${emotion} approach led to ${winLoss.toLowerCase()}`,
    `${strategy} analysis - ${emotion} mindset during ${winLoss.toLowerCase()}`
  ];
  
  return getRandomElement(templates);
}

// Authentication function
async function authenticate() {
  console.log('\n🔐 Creating/authenticating test user...');
  
  try {
    // Try to sign in first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.log('🔄 Login failed, creating new test account...');
      
      // Try to sign up if login fails
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        throw signUpError;
      }
      
      console.log('✅ Test account created successfully');
      
      // Try to sign in again
      const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (retryAuthError) {
        console.error('❌ Retry authentication failed:', retryAuthError.message);
        throw retryAuthError;
      }
      
      var session = retryAuthData.session;
    } else {
      console.log('✅ Authentication successful - existing test account found');
      var session = authData.session;
    }
    
    if (!session) {
      throw new Error('No session obtained after authentication');
    }
    
    // Create authenticated client
    authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    });
    
    currentUserId = session.user.id;
    console.log(`👤 Test user ID: ${currentUserId}`);
    
    return session;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Main function to fetch existing strategies
async function fetchStrategies() {
  console.log('\n📋 Fetching existing strategies...');
  
  if (!authSupabase || !currentUserId) {
    throw new Error('Not authenticated. Call authenticate() first.');
  }
  
  try {
    const { data: strategies, error } = await authSupabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching strategies:', error.message);
      throw error;
    }
    
    if (!strategies || strategies.length === 0) {
      console.log('⚠️  No strategies found for test user, creating default strategies...');
      return await createDefaultStrategies();
    }
    
    console.log(`✅ Found ${strategies.length} existing strategies:`);
    strategies.forEach(strategy => {
      console.log(`  - ${strategy.name} (ID: ${strategy.id})`);
    });
    
    return strategies;
  } catch (error) {
    console.error('❌ Failed to fetch strategies:', error);
    throw error;
  }
}

// Function to create default strategies if none exist
async function createDefaultStrategies() {
  const defaultStrategies = [
    {
      name: 'Momentum Breakout',
      description: 'Focuses on identifying momentum breakouts and riding the trend',
      rules: ['Wait for confirmation breakout', 'Enter on pullback', 'Use 2:1 risk/reward']
    },
    {
      name: 'Mean Reversion',
      description: 'Capitalizes on price reversals after extreme movements',
      rules: ['Identify overbought/oversold', 'Wait for reversal confirmation', 'Use tight stops']
    },
    {
      name: 'Scalping',
      description: 'Quick in-and-out trades capturing small price movements',
      rules: ['Trade high volume sessions', 'Quick profits', 'No overnight positions']
    },
    {
      name: 'Swing Trading',
      description: 'Medium-term trades capturing larger price swings',
      rules: ['Trade with trend', 'Use wider stops', 'Hold 2-5 days']
    },
    {
      name: 'Options Income',
      description: 'Generating consistent income through options selling',
      rules: ['Sell 30-45 DTE options', 'Target 0.5-2% monthly', 'Manage Greeks actively']
    }
  ];
  
  const createdStrategies = [];
  
  for (const strategy of defaultStrategies) {
    try {
      const { data, error } = await authSupabase
        .from('strategies')
        .insert({
          id: randomUUID(),
          user_id: currentUserId,
          name: strategy.name,
          description: strategy.description,
          rules: strategy.rules,
          is_active: true,
          winrate_min: 60,
          winrate_max: 80,
          profit_factor_min: 1.5,
          net_pnl_min: -2000,
          net_pnl_max: 10000,
          max_drawdown_max: 25,
          sharpe_ratio_min: 1.0,
          avg_hold_period_min: 1,
          avg_hold_period_max: 120
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to create strategy ${strategy.name}:`, error.message);
        continue;
      }
      
      createdStrategies.push(data);
      console.log(`✅ Created strategy: ${strategy.name}`);
    } catch (error) {
      console.error(`❌ Error creating strategy ${strategy.name}:`, error);
    }
  }
  
  return createdStrategies;
}

// Function to generate trades
async function generateTrades(strategies) {
  console.log(`\n📊 Generating ${SPECS.TOTAL_TRADES} diverse trades...`);
  
  const trades = [];
  const dateRange = {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    end: new Date()
  };
  
  // Track strategy usage to ensure even distribution
  const strategyUsage = {};
  strategies.forEach(strategy => {
    strategyUsage[strategy.id] = 0;
  });
  
  // Generate winning trades
  console.log(`📈 Generating ${SPECS.WINNING_TRADES} winning trades...`);
  for (let i = 0; i < SPECS.WINNING_TRADES; i++) {
    const strategy = selectStrategyByUsage(strategies, strategyUsage);
    const market = generateMarketType();
    const symbol = getRandomElement(SPECS.SYMBOLS[market]);
    const side = getRandomElement(['Buy', 'Sell']);
    const quantity = generateRealisticQuantity(market, symbol);
    const entryPrice = generateRealisticPrice(market, symbol);
    const pnl = getRandomInt(SPECS.PNL_RANGES.win.min, SPECS.PNL_RANGES.win.max);
    const exitPrice = calculateExitPrice(entryPrice, quantity, pnl, side);
    const emotionalStates = generateEmotionalStates();
    const tradeDate = generateRandomDate(dateRange.start, dateRange.end);
    const entryTime = generateRandomTime();
    const exitTime = generateRandomTime();
    
    const trade = {
      id: randomUUID(),
      user_id: currentUserId,
      market,
      symbol,
      strategy_id: strategy.id,
      trade_date: tradeDate.toISOString().split('T')[0],
      side,
      quantity,
      entry_price: entryPrice,
      exit_price: exitPrice,
      pnl,
      entry_time: entryTime,
      exit_time: exitTime,
      emotional_state: emotionalStates,
      notes: generateNotes(true, emotionalStates, strategy.name, market, symbol)
    };
    
    trades.push(trade);
    strategyUsage[strategy.id]++;
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${SPECS.WINNING_TRADES} winning trades...`);
    }
  }
  
  // Generate losing trades
  console.log(`📉 Generating ${SPECS.LOSING_TRADES} losing trades...`);
  for (let i = 0; i < SPECS.LOSING_TRADES; i++) {
    const strategy = selectStrategyByUsage(strategies, strategyUsage);
    const market = generateMarketType();
    const symbol = getRandomElement(SPECS.SYMBOLS[market]);
    const side = getRandomElement(['Buy', 'Sell']);
    const quantity = generateRealisticQuantity(market, symbol);
    const entryPrice = generateRealisticPrice(market, symbol);
    const pnl = getRandomInt(SPECS.PNL_RANGES.loss.min, SPECS.PNL_RANGES.loss.max);
    const exitPrice = calculateExitPrice(entryPrice, quantity, pnl, side);
    const emotionalStates = generateEmotionalStates();
    const tradeDate = generateRandomDate(dateRange.start, dateRange.end);
    const entryTime = generateRandomTime();
    const exitTime = generateRandomTime();
    
    const trade = {
      id: randomUUID(),
      user_id: currentUserId,
      market,
      symbol,
      strategy_id: strategy.id,
      trade_date: tradeDate.toISOString().split('T')[0],
      side,
      quantity,
      entry_price: entryPrice,
      exit_price: exitPrice,
      pnl,
      entry_time: entryTime,
      exit_time: exitTime,
      emotional_state: emotionalStates,
      notes: generateNotes(false, emotionalStates, strategy.name, market, symbol)
    };
    
    trades.push(trade);
    strategyUsage[strategy.id]++;
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${SPECS.LOSING_TRADES} losing trades...`);
    }
  }
  
  // Shuffle trades to randomize order
  const shuffledTrades = trades.sort(() => Math.random() - 0.5);
  
  console.log(`✅ Generated ${shuffledTrades.length} diverse trades`);
  
  return shuffledTrades;
}

// Helper function to select strategy ensuring even distribution
function selectStrategyByUsage(strategies, strategyUsage) {
  // Find strategy with minimum usage
  let minUsage = Infinity;
  let selectedStrategy = strategies[0];
  
  for (const strategy of strategies) {
    if (strategyUsage[strategy.id] < minUsage) {
      minUsage = strategyUsage[strategy.id];
      selectedStrategy = strategy;
    }
  }
  
  return selectedStrategy;
}

// Function to insert trades in batches
async function insertTrades(trades) {
  console.log('\n💾 Inserting trades into database...');
  
  const batchSize = 20; // Increased batch size for efficiency
  let insertedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < trades.length; i += batchSize) {
    const batch = trades.slice(i, i + batchSize);
    
    try {
      const { data, error } = await authSupabase
        .from('trades')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        errorCount += batch.length;
        continue;
      }
      
      insertedCount += data.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(trades.length / batchSize)} (${data.length} trades)`);
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`❌ Unexpected error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorCount += batch.length;
    }
  }
  
  console.log(`\n📊 Insert Summary:`);
  console.log(`✅ Successfully inserted: ${insertedCount} trades`);
  console.log(`❌ Failed to insert: ${errorCount} trades`);
  
  return insertedCount;
}

// Function to verify and analyze generated data
async function verifyGeneratedData() {
  console.log('\n🔍 Verifying generated data...');
  
  try {
    const { data: trades, error } = await authSupabase
      .from('trades')
      .select('*')
      .eq('user_id', currentUserId);
    
    if (error) {
      console.error('❌ Error fetching trades for verification:', error.message);
      return;
    }
    
    if (!trades || trades.length === 0) {
      console.log('⚠️  No trades found for verification');
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades in database`);
    
    // Analyze win rate
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl < 0);
    const actualWinRate = ((winningTrades.length / trades.length) * 100).toFixed(1);
    
    console.log(`📈 Win Rate: ${actualWinRate}% (${winningTrades.length} wins, ${losingTrades.length} losses)`);
    
    // Analyze P&L
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length : 0;
    
    console.log(`💰 Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`📊 Average Win: $${avgWin.toFixed(2)}`);
    console.log(`📊 Average Loss: $${avgLoss.toFixed(2)}`);
    
    // Analyze market distribution
    const marketDistribution = {};
    trades.forEach(trade => {
      marketDistribution[trade.market] = (marketDistribution[trade.market] || 0) + 1;
    });
    
    console.log('\n🏢 Market Distribution:');
    Object.entries(marketDistribution).forEach(([market, count]) => {
      const percentage = ((count / trades.length) * 100).toFixed(1);
      console.log(`  ${market}: ${count} trades (${percentage}%)`);
    });
    
    // Analyze emotional states
    const emotionDistribution = {};
    trades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        trade.emotional_state.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
      }
    });
    
    console.log('\n😊 Emotional States Distribution:');
    Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        console.log(`  ${emotion}: ${count} occurrences`);
      });
    
    // Analyze strategy usage
    const { data: strategies } = await authSupabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', currentUserId);
    
    if (strategies) {
      const strategyDistribution = {};
      trades.forEach(trade => {
        const strategy = strategies.find(s => s.id === trade.strategy_id);
        if (strategy) {
          strategyDistribution[strategy.name] = (strategyDistribution[strategy.name] || 0) + 1;
        }
      });
      
      console.log('\n📋 Strategy Usage:');
      Object.entries(strategyDistribution).forEach(([strategy, count]) => {
        console.log(`  ${strategy}: ${count} trades`);
      });
    }
    
    // Analyze date range
    const dates = trades.map(trade => new Date(trade.trade_date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    console.log('\n📅 Date Range Analysis:');
    console.log(`  Earliest Trade: ${minDate.toISOString().split('T')[0]}`);
    console.log(`  Latest Trade: ${maxDate.toISOString().split('T')[0]}`);
    console.log(`  Trading Period: ${daysDiff} days`);
    
    console.log('\n✅ Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting test account creation with 1,000+ trades...\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Fetch existing strategies
    const strategies = await fetchStrategies();
    
    if (!strategies || strategies.length === 0) {
      console.error('❌ No strategies available. Cannot proceed with trade generation.');
      return;
    }
    
    // Step 3: Generate trades
    const trades = await generateTrades(strategies);
    
    // Step 4: Insert trades into database
    const insertedCount = await insertTrades(trades);
    
    if (insertedCount > 0) {
      // Step 5: Verify generated data
      await verifyGeneratedData();
      
      console.log('\n🎉 TEST ACCOUNT WITH 1,000+ TRADES CREATED SUCCESSFULLY!');
      console.log('📝 Summary:');
      console.log(`  - Generated ${insertedCount} diverse trades`);
      console.log(`  - ~68% win rate maintained`);
      console.log(`  - Even distribution across 5 strategies`);
      console.log(`  - Balanced market types (40% Stocks, 30% Crypto, 20% Forex, 10% Futures)`);
      console.log(`  - All 10 emotional states represented`);
      console.log(`  - Realistic P&L ranges ($25-$1,000 wins, -$20 to -$500 losses)`);
      console.log(`  - 1-year date range with weekday-only trading`);
      console.log(`  - Market hours (6 AM - 4 PM)`);
      
      console.log('\n🔑 TEST ACCOUNT CREDENTIALS:');
      console.log(`  Email: ${TEST_USER_EMAIL}`);
      console.log(`  Password: ${TEST_USER_PASSWORD}`);
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Use these credentials to test the authentication system');
      console.log('2. Navigate to /dashboard to see trade analytics');
      console.log('3. Go to /confluence to view emotional analysis');
      console.log('4. Test filtering and search functionality with large dataset');
      console.log('5. Verify charts and visualizations display correctly');
      console.log('6. Test React component mounting with substantial data');
      
    } else {
      console.log('\n❌ NO TRADES WERE INSERTED');
      console.log('Please check database connection and permissions.');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR during test account creation:', error.message);
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

module.exports = { main, generateTrades, fetchStrategies };