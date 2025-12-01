const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Small batch test version - only creates 10 trades to test functionality
console.log('🧪 SMALL BATCH TEST - SAFE DATA GENERATION');
console.log('==========================================');
console.log('This will create only 10 trades with all 8 emotions for testing');
console.log('Press Ctrl+C to cancel, or wait 2 seconds to continue...');
setTimeout(() => {
  console.log('✅ Proceeding with small batch test...\n');
}, 2000);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Define the 8 required emotions exactly as specified
const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateRealisticPnL(emotion) {
  const ranges = {
    'CONFIDENT': { min: 50, max: 500, positiveBias: 0.8 },
    'DISCIPLINED': { min: 25, max: 300, positiveBias: 0.75 },
    'PATIENT': { min: 30, max: 400, positiveBias: 0.7 },
    'CALM': { min: 20, max: 250, positiveBias: 0.65 },
    'ANXIOUS': { min: -200, max: 150, positiveBias: 0.4 },
    'FEARFUL': { min: -300, max: 100, positiveBias: 0.3 },
    'IMPULSIVE': { min: -400, max: 200, positiveBias: 0.35 },
    'GREEDY': { min: -250, max: 600, positiveBias: 0.45 }
  };
  
  const config = ranges[emotion] || ranges['CALM'];
  const isPositive = Math.random() < config.positiveBias;
  
  if (isPositive) {
    return getRandomFloat(config.min, config.max);
  } else {
    return -getRandomFloat(Math.abs(config.min), Math.abs(config.max));
  }
}

async function createSmallBatchTest() {
  try {
    // Wait for safety confirmation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Get current user
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication required. Please ensure you are logged in.');
      return false;
    }
    
    console.log(`✅ Authenticated as user: ${user.email || user.id}`);
    
    // Create a simple test strategy first
    console.log('\n🎯 Creating test strategy...');
    const testStrategy = {
      user_id: user.id,
      name: 'Test Emotional Analysis Strategy',
      description: 'Strategy for testing emotional state analysis functionality',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert(testStrategy)
      .select();
    
    if (strategyError) {
      console.error('❌ Error creating test strategy:', strategyError.message);
      return false;
    }
    
    console.log(`✅ Created test strategy (ID: ${strategyData[0].id})`);
    
    // Create 10 trades - ensure each emotion appears at least once
    console.log('\n📈 Creating 10 test trades with emotional states...');
    
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC', 'ETH', 'SPY', 'QQQ', 'NVDA', 'META'];
    const markets = ['Stock', 'Crypto', 'ETF'];
    
    for (let i = 0; i < 10; i++) {
      const emotion = REQUIRED_EMOTIONS[i % REQUIRED_EMOTIONS.length]; // Ensure all emotions are covered
      const isBuy = i % 2 === 0;
      
      const trade = {
        user_id: user.id,
        symbol: symbols[i],
        market: getRandomElement(markets),
        side: isBuy ? 'Buy' : 'Sell',
        quantity: Math.floor(Math.random() * 400) + 100,
        entry_price: getRandomFloat(50, 300),
        exit_price: getRandomFloat(50, 300),
        pnl: generateRealisticPnL(emotion),
        trade_date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strategy_id: strategyData[0].id,
        emotional_state: [emotion], // Single emotion per trade for clarity
        entry_time: '09:30:00',
        exit_time: '10:30:00',
        notes: `Small batch test - ${emotion} emotional state`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('trades')
        .insert(trade)
        .select();
      
      if (error) {
        console.error(`❌ Error creating trade for ${emotion}:`, error.message);
        return false;
      } else {
        console.log(`✅ Created ${emotion} trade (ID: ${data[0].id})`);
      }
    }
    
    // Verify the data
    console.log('\n🔍 Verifying created emotional data...');
    
    const { data: trades, error } = await supabase
      .from('trades')
      .select('emotional_state')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Error verifying trades:', error.message);
      return false;
    }
    
    const foundEmotions = new Set();
    trades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        trade.emotional_state.forEach(emotion => {
          if (typeof emotion === 'string') {
            foundEmotions.add(emotion.toUpperCase());
          }
        });
      }
    });
    
    console.log('\n📊 Verification Results:');
    console.log(`Total trades created: ${trades.length}`);
    console.log('Emotions found:', Array.from(foundEmotions).sort());
    
    const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => !Array.from(foundEmotions).includes(emotion));
    
    if (missingEmotions.length === 0) {
      console.log('\n🎉 SMALL BATCH TEST SUCCESSFUL!');
      console.log('All 8 required emotions are present');
      console.log('✅ Ready to proceed with full data generation');
      return true;
    } else {
      console.log(`\n❌ Missing emotions: ${missingEmotions.join(', ')}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error during small batch test:', error.message);
    return false;
  }
}

// Run the small batch test
createSmallBatchTest().then(success => {
  if (success) {
    console.log('\n✅ Small batch test completed successfully');
    console.log('💡 You can now run the full data generation script');
  } else {
    console.log('\n❌ Small batch test failed');
  }
}).catch(error => {
  console.error('❌ Error during small batch test:', error);
});