require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test user credentials
const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

async function executeDirectTestDataGeneration() {
  console.log('🚀 Starting direct test data generation...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Step 1: Authenticate
    console.log('\n📝 Step 1: Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      
      // Try to sign up if login fails
      console.log('🔄 Trying to sign up...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        return;
      }
      
      console.log('✅ Sign up successful');
      
      // Try to sign in again
      const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (retryAuthError) {
        console.error('❌ Retry authentication failed:', retryAuthError.message);
        return;
      }
      
      var session = retryAuthData.session;
    } else {
      console.log('✅ Authentication successful');
      var session = authData.session;
    }
    
    if (!session) {
      console.error('❌ No session obtained');
      return;
    }
    
    const token = session.access_token;
    console.log(`🔑 Got JWT token (length: ${token.length})`);
    
    // Create authenticated client for API calls
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const userId = session.user.id;
    console.log(`👤 User ID: ${userId}`);
    
    // Step 2: Delete All Data - DISABLED FOR DATA PROTECTION
    console.log('\n🚨 DANGEROUS OPERATION BLOCKED: Step 2 - Deleting all existing data has been DISABLED');
    console.log('⚠️  This operation was responsible for complete loss of user trading data.');
    console.log('📝 To proceed with testing, please manually clear data using database admin tools.');
    console.log('🔒 This safeguard prevents accidental data loss in production environment.');
    
    // Skip deletion step to protect existing data
    console.log('✅ Data protection enabled - skipping deletion step');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Create Strategies
    console.log('\n📈 Step 3: Creating trading strategies...');
    
    const STRATEGY_TEMPLATES = [
      {
        name: 'Momentum Breakout Strategy',
        description: 'Focuses on identifying momentum breakouts and riding the trend for maximum profit',
        rules: [
          'Wait for confirmation breakout above resistance',
          'Enter trade on first pullback',
          'Use 2:1 risk/reward ratio',
          'Take partial profits at key levels',
          'Stop loss below breakout candle low'
        ]
      },
      {
        name: 'Mean Reversion Strategy',
        description: 'Capitalizes on price reversals after extreme movements',
        rules: [
          'Identify overbought/oversold conditions',
          'Wait for reversal confirmation',
          'Enter on first reversal signal',
          'Use tight stop losses',
          'Target previous support/resistance levels'
        ]
      },
      {
        name: 'Scalping Strategy',
        description: 'Quick in-and-out trades capturing small price movements',
        rules: [
          'Trade only during high volume sessions',
          'Take 5-10 pip profits quickly',
          'Use immediate breakeven stops',
          'No overnight positions',
          'Maximum 2 trades per hour'
        ]
      },
      {
        name: 'Swing Trading Strategy',
        description: 'Medium-term trades capturing larger price swings over several days',
        rules: [
          'Trade with the dominant trend',
          'Use wider stop losses for volatility',
          'Scale into positions gradually',
          'Take profits at key Fibonacci levels',
          'Hold trades 2-5 days typically'
        ]
      },
      {
        name: 'Options Income Strategy',
        description: 'Generating consistent income through options selling strategies',
        rules: [
          'Sell options with 30-45 days DTE',
          'Target 0.5-2% monthly returns',
          'Manage Greeks actively',
          'Roll positions when necessary',
          'Maintain defined risk per trade'
        ]
      }
    ];
    
    const createdStrategies = [];
    
    for (const template of STRATEGY_TEMPLATES) {
      const { data: strategy, error } = await authSupabase
        .from('strategies')
        .insert({
          user_id: userId,
          name: template.name,
          description: template.description,
          rules: template.rules,
          is_active: true,
          winrate_min: 60,
          winrate_max: 80,
          profit_factor_min: 1.5,
          net_pnl_min: -1000,
          net_pnl_max: 5000,
          max_drawdown_max: 20,
          sharpe_ratio_min: 1.0,
          avg_hold_period_min: 1,
          avg_hold_period_max: 120
        })
        .select()
        .single();
        
      if (error) {
        console.error(`❌ Failed to create strategy ${template.name}:`, error.message);
        return;
      }
      
      createdStrategies.push(strategy);
      console.log(`✅ Created strategy: ${template.name}`);
    }
    
    console.log(`📊 Created ${createdStrategies.length} strategies`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Generate Trades
    console.log('\n📊 Step 4: Generating trades with emotional states...');
    
    const TRADING_SYMBOLS = [
      'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'NFLX',
      'BTCUSD', 'ETHUSD', 'SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'OIL', 'NG'
    ];
    
    const MARKETS = ['Stock', 'Crypto', 'Forex', 'Futures'];
    
    const EMOTIONAL_STATES = [
      'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'
    ];
    
    function getRandomElement(array) {
      return array[Math.floor(Math.random() * array.length)];
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
      const hours = Math.floor(Math.random() * 10) + 6; // 6 AM - 4 PM (trading hours)
      const minutes = Math.floor(Math.random() * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    function calculatePnL(isWin) {
      if (isWin) {
        // Winning trades: $50 - $500
        return Math.floor(Math.random() * 450) + 50;
      } else {
        // Losing trades: -$25 to -$300
        return -(Math.floor(Math.random() * 275) + 25);
      }
    }
    
    const TOTAL_TRADES = 100;
    const WINNING_TRADES = 71; // 71% win rate
    const LOSING_TRADES = 29;
    
    console.log(`📊 Generating ${TOTAL_TRADES} trades with ${WINNING_TRADES} wins and ${LOSING_TRADES} losses`);
    
    const generatedTrades = [];
    
    // Generate winning trades
    for (let i = 0; i < WINNING_TRADES; i++) {
      const strategyId = getRandomElement(createdStrategies).id;
      const symbol = getRandomElement(TRADING_SYMBOLS);
      const market = getRandomElement(MARKETS);
      const side = getRandomElement(['Buy', 'Sell']);
      const quantity = Math.floor(Math.random() * 900) + 100; // 100-1000
      const entryPrice = Math.floor(Math.random() * 900) + 10; // $10 - $910
      const pnl = calculatePnL(true);
      const exitPrice = side === 'Buy'
        ? entryPrice + (pnl / quantity)
        : entryPrice - (pnl / quantity);
      
      const tradeDate = generateRandomDate(
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        new Date()
      );
      
      const entryTime = generateRandomTime();
      const exitTime = generateRandomTime();
      
      // Ensure balanced emotional distribution across all trades
      const baseEmotion = EMOTIONAL_STATES[i % EMOTIONAL_STATES.length];
      
      // Add 1-2 additional random emotions to create variety (30% chance of additional emotions)
      let emotionalStates = [baseEmotion];
      if (Math.random() < 0.3) {
        const additionalEmotions = EMOTIONAL_STATES.filter(e => e !== baseEmotion);
        const additionalCount = Math.floor(Math.random() * 2) + 1; // 1-2 additional emotions
        const selectedAdditional = additionalEmotions.sort(() => 0.5 - Math.random()).slice(0, additionalCount);
        emotionalStates = [...emotionalStates, ...selectedAdditional];
      }
      
      const trade = {
        user_id: userId,
        symbol,
        market,
        strategy_id: strategyId,
        trade_date: tradeDate.toISOString().split('T')[0],
        side,
        quantity,
        entry_price: entryPrice,
        exit_price: exitPrice,
        pnl,
        entry_time: entryTime,
        exit_time: exitTime,
        emotional_state: emotionalStates,
        notes: `Generated test trade ${i + 1} of ${TOTAL_TRADES} - WIN`
      };
      
      trades.push(trade);
    }
    
    // Generate losing trades
    for (let i = 0; i < LOSING_TRADES; i++) {
      const strategyId = getRandomElement(createdStrategies).id;
      const symbol = getRandomElement(TRADING_SYMBOLS);
      const market = getRandomElement(MARKETS);
      const side = getRandomElement(['Buy', 'Sell']);
      const quantity = Math.floor(Math.random() * 900) + 100; // 100-1000
      const entryPrice = Math.floor(Math.random() * 900) + 10; // $10 - $910
      const pnl = calculatePnL(false);
      const exitPrice = side === 'Buy'
        ? entryPrice + (pnl / quantity)
        : entryPrice - (pnl / quantity);
      
      const tradeDate = generateRandomDate(
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        new Date()
      );
      
      const entryTime = generateRandomTime();
      const exitTime = generateRandomTime();
      
      // Ensure balanced emotional distribution across all trades
      const baseEmotion = EMOTIONAL_STATES[(WINNING_TRADES + i) % EMOTIONAL_STATES.length];
      
      // Add 1-2 additional random emotions to create variety (30% chance of additional emotions)
      let emotionalStates = [baseEmotion];
      if (Math.random() < 0.3) {
        const additionalEmotions = EMOTIONAL_STATES.filter(e => e !== baseEmotion);
        const additionalCount = Math.floor(Math.random() * 2) + 1; // 1-2 additional emotions
        const selectedAdditional = additionalEmotions.sort(() => 0.5 - Math.random()).slice(0, additionalCount);
        emotionalStates = [...emotionalStates, ...selectedAdditional];
      }
      
      const trade = {
        user_id: userId,
        symbol,
        market,
        strategy_id: strategyId,
        trade_date: tradeDate.toISOString().split('T')[0],
        side,
        quantity,
        entry_price: entryPrice,
        exit_price: exitPrice,
        pnl,
        entry_time: entryTime,
        exit_time: exitTime,
        emotional_state: emotionalStates,
        notes: `Generated test trade ${WINNING_TRADES + i + 1} of ${TOTAL_TRADES} - LOSS`
      };
      
      generatedTrades.push(trade);
    }
    
    // Shuffle trades to randomize order
    const shuffledTrades = generatedTrades.sort(() => Math.random() - 0.5);
    
    // Insert trades in batches to avoid timeouts
    const batchSize = 10;
    let insertedTrades = [];
    
    for (let i = 0; i < shuffledTrades.length; i += batchSize) {
      const batch = shuffledTrades.slice(i, i + batchSize);
      const { data: insertedBatch, error: insertError } = await authSupabase
        .from('trades')
        .insert(batch)
        .select();
      
      if (insertError) {
        console.error(`❌ Failed to insert batch ${Math.floor(i / batchSize) + 1}:`, insertError.message);
        return;
      }
      
      if (insertedBatch && insertedBatch.length > 0) {
        insertedTrades.push(...insertedBatch);
      }
      
      console.log(`📊 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(shuffledTrades.length / batchSize)}`);
    }
    
    const generatedTotalPnL = insertedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const actualWins = insertedTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const actualWinRate = ((actualWins / insertedTrades.length) * 100).toFixed(1);
    
    console.log(`✅ Generated ${insertedTrades.length} trades successfully`);
    console.log(`📈 Total P&L: $${generatedTotalPnL.toFixed(2)}`);
    console.log(`🎯 Win rate: ${actualWinRate}% (${actualWins}/${insertedTrades.length})`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Verify Data
    console.log('\n🔍 Step 5: Verifying generated data...');
    
    // Get trades count
    const { data: tradesData, error: tradesError } = await authSupabase
      .from('trades')
      .select('id, pnl, strategy_id, emotional_state, market, symbol')
      .eq('user_id', userId);
    
    // Get strategies count
    const { data: strategiesData, error: strategiesError } = await authSupabase
      .from('strategies')
      .select('id, name, is_active')
      .eq('user_id', userId);
    
    if (tradesError || strategiesError) {
      console.error('❌ Failed to verify data:', tradesError?.message || strategiesError?.message);
      return;
    }
    
    const verifiedTrades = tradesData || [];
    const strategies = strategiesData || [];
    
    // Calculate statistics
    const tradesWithPnL = verifiedTrades.filter(trade => trade.pnl !== null);
    const winningTrades = tradesWithPnL.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = tradesWithPnL.filter(trade => (trade.pnl || 0) < 0);
    
    const verifiedTotalPnL = tradesWithPnL.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winRate = tradesWithPnL.length > 0 
      ? ((winningTrades.length / tradesWithPnL.length) * 100).toFixed(1)
      : '0';
    
    // Analyze emotional states distribution
    const emotionDistribution = {};
    verifiedTrades.forEach(trade => {
      if (trade.emotional_state) {
        let emotions = [];
        
        // Handle both array and JSON string formats
        if (Array.isArray(trade.emotional_state)) {
          emotions = trade.emotional_state;
        } else if (typeof trade.emotional_state === 'string') {
          try {
            emotions = JSON.parse(trade.emotional_state);
          } catch (e) {
            // If parsing fails, treat as single emotion
            emotions = [trade.emotional_state];
          }
        }
        
        emotions.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
      }
    });
    
    // Analyze market distribution
    const marketDistribution = {};
    verifiedTrades.forEach(trade => {
      marketDistribution[trade.market || 'Unknown'] = (marketDistribution[trade.market || 'Unknown'] || 0) + 1;
    });
    
    // Analyze strategy distribution
    const strategyDistribution = {};
    verifiedTrades.forEach(trade => {
      if (trade.strategy_id) {
        const strategy = strategies.find(s => s.id === trade.strategy_id);
        if (strategy) {
          strategyDistribution[strategy.name] = (strategyDistribution[strategy.name] || 0) + 1;
        }
      }
    });
    
    console.log('\n📊 Verification Results:');
    console.log(`📈 Total Trades: ${verifiedTrades.length}`);
    console.log(`🎯 Win Rate: ${winRate}%`);
    console.log(`💰 Total P&L: $${verifiedTotalPnL.toFixed(2)}`);
    console.log(`📋 Total Strategies: ${strategies.length}`);
    
    console.log('\n😊 Emotional States Distribution:');
    Object.entries(emotionDistribution).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count}`);
    });
    
    console.log('\n🏢 Market Distribution:');
    Object.entries(marketDistribution).forEach(([market, count]) => {
      console.log(`  ${market}: ${count}`);
    });
    
    console.log('\n📋 Strategy Usage:');
    Object.entries(strategyDistribution).forEach(([strategy, count]) => {
      console.log(`  ${strategy}: ${count}`);
    });
    
    // Check if emotional states are properly distributed
    const emotionCount = Object.keys(emotionDistribution).length;
    if (emotionCount >= 8) {
      console.log('\n✅ SUCCESS: All 8 emotional states are represented in the data!');
    } else {
      console.log(`\n⚠️  WARNING: Only ${emotionCount} emotional states found (expected 8)`);
    }
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('📝 You can now navigate to /confluence or /dashboard to see the emotional analysis in action.');
    
  } catch (error) {
    console.error('❌ Error during test data generation:', error.message);
  }
}

// Execute the test data generation
executeDirectTestDataGeneration();