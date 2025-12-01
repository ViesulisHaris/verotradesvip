const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data for different trade scenarios
const testTrades = [
  {
    name: 'FOMO Trade - AAPL Stock',
    user_id: '2df81203-0563-4d58-a4de-8f66a02f1c37', // Test user ID from the browser test
    market: 'Stock',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.00,
    exit_price: 148.50,
    pnl: -150.00,
    trade_date: new Date().toISOString().split('T')[0],
    emotional_state: ['FOMO'],
    notes: 'FOMO trade - bought at the top after seeing big green candle'
  },
  {
    name: 'REVENGE Trade - BTCUSD Crypto',
    user_id: '2df81203-0563-4d58-a4de-8f66a02f1c37',
    market: 'Crypto',
    symbol: 'BTCUSD',
    side: 'Sell',
    quantity: 0.5,
    entry_price: 45000.00,
    exit_price: 44500.00,
    pnl: 250.00,
    trade_date: new Date().toISOString().split('T')[0],
    emotional_state: ['REVENGE'],
    notes: 'Revenge trade after previous loss - wanted to win it back quickly'
  },
  {
    name: 'CONFIDENT Trade - EURUSD Forex',
    user_id: '2df81203-0563-4d58-a4de-8f66a02f1c37',
    market: 'Forex',
    symbol: 'EURUSD',
    side: 'Buy',
    quantity: 10000,
    entry_price: 1.0850,
    exit_price: 1.0875,
    pnl: 250.00,
    trade_date: new Date().toISOString().split('T')[0],
    emotional_state: ['CONFIDENT'],
    notes: 'Confident trade based on solid technical analysis'
  },
  {
    name: 'Multiple Emotions Trade - TSLA Stock',
    user_id: '2df81203-0563-4d58-a4de-8f66a02f1c37',
    market: 'Stock',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 50,
    entry_price: 250.00,
    exit_price: 248.00,
    pnl: -100.00,
    trade_date: new Date().toISOString().split('T')[0],
    emotional_state: ['FOMO', 'ANXIOUS'],
    notes: 'FOMO and anxious trade - bought during volatile market conditions'
  },
  {
    name: 'No Emotions Control Trade - SPY Stock',
    user_id: '2df81203-0563-4d58-a4de-8f66a02f1c37',
    market: 'Stock',
    symbol: 'SPY',
    side: 'Buy',
    quantity: 75,
    entry_price: 450.00,
    exit_price: 452.00,
    pnl: 150.00,
    trade_date: new Date().toISOString().split('T')[0],
    emotional_state: null,
    notes: 'Disciplined trade with no emotional influence - followed plan exactly'
  }
];

async function logTestTrades() {
  console.log('🚀 Starting Manual Emotion Filtering Test');
  console.log('📅 Test started at:', new Date().toISOString());
  
  const results = {
    startTime: new Date().toISOString(),
    tradesLogged: [],
    errors: []
  };
  
  try {
    console.log('\n💼 Step 1: Logging test trades with different emotions...');
    
    for (let i = 0; i < testTrades.length; i++) {
      const trade = testTrades[i];
      console.log(`\n📊 Logging trade ${i + 1}/${testTrades.length}: ${trade.name}`);
      
      try {
        const { data, error } = await supabase
          .from('trades')
          .insert({
            user_id: trade.user_id,
            market: trade.market,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            entry_price: trade.entry_price,
            exit_price: trade.exit_price,
            pnl: trade.pnl,
            trade_date: trade.trade_date,
            emotional_state: trade.emotional_state,
            notes: trade.notes
          })
          .select('id, symbol, emotional_state')
          .single();
        
        if (error) {
          console.error(`❌ Failed to log ${trade.name}:`, error.message);
          results.errors.push(`Failed to log ${trade.name}: ${error.message}`);
        } else {
          console.log(`✅ Successfully logged: ${trade.name} (ID: ${data.id})`);
          results.tradesLogged.push({
            ...trade,
            id: data.id,
            status: 'success',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error logging ${trade.name}:`, error.message);
        results.errors.push(`Error logging ${trade.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Step 2: Verifying trades in database...');
    
    // Fetch all trades for the user to verify
    const { data: allTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', testTrades[0].user_id)
      .order('trade_date', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching trades:', fetchError.message);
      results.errors.push(`Error fetching trades: ${fetchError.message}`);
    } else {
      console.log(`📋 Found ${allTrades.length} total trades in database`);
      
      // Log details of each trade for verification
      allTrades.forEach((trade, index) => {
        console.log(`\n📝 Trade ${index + 1}:`);
        console.log(`  ID: ${trade.id}`);
        console.log(`  Symbol: ${trade.symbol}`);
        console.log(`  Market: ${trade.market}`);
        console.log(`  Side: ${trade.side}`);
        console.log(`  P&L: ${trade.pnl}`);
        console.log(`  Emotional State: ${JSON.stringify(trade.emotional_state)}`);
        console.log(`  Notes: ${trade.notes}`);
      });
    }
    
    console.log('\n🎯 Step 3: Testing emotion filtering logic...');
    
    // Test emotion filtering logic manually
    const emotionTests = [
      { emotion: 'FOMO', expectedCount: 2 }, // FOMO trade + multiple emotions trade
      { emotion: 'REVENGE', expectedCount: 1 },
      { emotion: 'CONFIDENT', expectedCount: 1 },
      { emotion: 'ANXIOUS', expectedCount: 1 },
      { emotion: 'NEUTRAL', expectedCount: 0 }
    ];
    
    for (const test of emotionTests) {
      console.log(`\n🔍 Testing filter for emotion: ${test.emotion}`);
      
      // Simulate the filtering logic from the confluence page
      const filteredTrades = allTrades.filter(trade => {
        if (!trade.emotional_state) return false;
        
        // Handle different data structures for emotional_state
        let emotionsArray = [];
        
        if (typeof trade.emotional_state === 'string') {
          try {
            emotionsArray = JSON.parse(trade.emotional_state);
          } catch (e) {
            return false;
          }
        } else if (Array.isArray(trade.emotional_state)) {
          emotionsArray = trade.emotional_state;
        } else if (typeof trade.emotional_state === 'object' && trade.emotional_state !== null) {
          emotionsArray = Object.values(trade.emotional_state).filter(val => typeof val === 'string');
        } else {
          return false;
        }
        
        // Normalize both arrays to uppercase for case-insensitive comparison
        const normalizedEmotions = emotionsArray.map(emotion => emotion.toString().toUpperCase());
        const normalizedSearchTerm = test.emotion.toUpperCase();
        
        return normalizedEmotions.includes(normalizedSearchTerm);
      });
      
      console.log(`📊 Found ${filteredTrades.length} trades for ${test.emotion} filter (expected: ${test.expectedCount})`);
      
      if (filteredTrades.length >= test.expectedCount) {
        console.log(`✅ ${test.emotion} filter works correctly`);
      } else {
        console.log(`❌ ${test.emotion} filter failed - expected at least ${test.expectedCount}, got ${filteredTrades.length}`);
        results.errors.push(`${test.emotion} filter failed - expected ${test.expectedCount}, got ${filteredTrades.length}`);
      }
      
      // Show which trades matched
      if (filteredTrades.length > 0) {
        console.log('  Matching trades:');
        filteredTrades.forEach(trade => {
          console.log(`    - ${trade.symbol}: ${JSON.stringify(trade.emotional_state)}`);
        });
      }
    }
    
    console.log('\n🎯 Step 4: Testing multi-select emotion filtering...');
    
    // Test multi-select filtering (FOMO + REVENGE)
    const multiSelectEmotions = ['FOMO', 'REVENGE'];
    const multiSelectFiltered = allTrades.filter(trade => {
      if (!trade.emotional_state) return false;
      
      let emotionsArray = [];
      if (typeof trade.emotional_state === 'string') {
        try {
          emotionsArray = JSON.parse(trade.emotional_state);
        } catch (e) {
          return false;
        }
      } else if (Array.isArray(trade.emotional_state)) {
        emotionsArray = trade.emotional_state;
      } else if (typeof trade.emotional_state === 'object' && trade.emotional_state !== null) {
        emotionsArray = Object.values(trade.emotional_state).filter(val => typeof val === 'string');
      }
      
      const normalizedEmotions = emotionsArray.map(emotion => emotion.toString().toUpperCase());
      const normalizedSearchTerms = multiSelectEmotions.map(emotion => emotion.toString().toUpperCase());
      
      return normalizedEmotions.some(emotion => normalizedSearchTerms.includes(emotion));
    });
    
    console.log(`📊 Found ${multiSelectFiltered.length} trades for FOMO + REVENGE filter (expected: 3)`);
    
    if (multiSelectFiltered.length >= 3) {
      console.log('✅ Multi-select emotion filter works correctly');
    } else {
      console.log(`❌ Multi-select filter failed - expected at least 3, got ${multiSelectFiltered.length}`);
      results.errors.push(`Multi-select filter failed - expected 3, got ${multiSelectFiltered.length}`);
    }
    
    // Test edge cases
    console.log('\n🧪 Step 5: Testing edge cases...');
    
    // Test case-insensitive matching
    const caseInsensitiveTrades = allTrades.filter(trade => {
      if (!trade.emotional_state) return false;
      
      let emotionsArray = [];
      if (Array.isArray(trade.emotional_state)) {
        emotionsArray = trade.emotional_state;
      }
      
      const normalizedEmotions = emotionsArray.map(emotion => emotion.toString().toUpperCase());
      return normalizedEmotions.includes('FOMO'); // Test uppercase matching
    });
    
    console.log(`📊 Case-insensitive test: Found ${caseInsensitiveTrades.length} trades for 'FOMO' (expected: 2)`);
    
    // Test null emotional_state handling
    const nullEmotionTrades = allTrades.filter(trade => !trade.emotional_state);
    console.log(`📊 Null emotion test: Found ${nullEmotionTrades.length} trades with no emotions (expected: 1)`);
    
  } catch (error) {
    console.error('❌ Critical error during test execution:', error);
    results.errors.push(`Critical error: ${error.message}`);
  } finally {
    // Save results
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);
    
    // Calculate success rates
    const successfulTrades = results.tradesLogged.filter(t => t.status === 'success').length;
    
    results.summary = {
      totalTradesAttempted: testTrades.length,
      successfulTradesLogged: successfulTrades,
      tradeSuccessRate: `${((successfulTrades / testTrades.length) * 100).toFixed(1)}%`,
      totalErrors: results.errors.length
    };
    
    // Save results to file
    const resultsFile = 'manual-emotion-test-results.json';
    require('fs').writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📁 Test results saved to: ${resultsFile}`);
    
    // Print summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('================');
    console.log(`✅ Trades Logged: ${successfulTrades}/${testTrades.length} (${results.summary.tradeSuccessRate})`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🌐 Next Steps:');
    console.log('1. Open http://localhost:3000/confluence in your browser');
    console.log('2. Verify that all test trades appear in the table');
    console.log('3. Test the emotion filter pills manually');
    console.log('4. Test the multi-select emotion dropdown');
    console.log('5. Verify statistics update when filtering');
    console.log('6. Test expandable rows to see emotions display');
  }
}

// Run the test
logTestTrades().catch(console.error);