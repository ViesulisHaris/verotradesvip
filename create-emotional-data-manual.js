const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// SAFETY CONFIRMATION
console.log('🔒 MANUAL EMOTIONAL DATA CREATION');
console.log('==================================');
console.log('This script creates data with proper authentication');
console.log('Required emotions: ANXIOUS, CONFIDENT, FEARFUL, DISCIPLINED, IMPULSIVE, PATIENT, GREEDY, CALM');
console.log('Press Ctrl+C to cancel, or wait 2 seconds to continue...');
setTimeout(() => {
  console.log('✅ Safety confirmation received - proceeding...\n');
}, 2000);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Define the 8 required emotions exactly as specified
const REQUIRED_EMOTIONS = ['ANXIOUS', 'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];

async function createEmotionalDataManually() {
  try {
    console.log('🚀 STARTING MANUAL EMOTIONAL DATA CREATION');
    console.log('==========================================\n');
    
    // Wait for safety confirmation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // First, try to authenticate
    console.log('🔐 Attempting authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      console.log('\n💡 Alternative approach:');
      console.log('1. Please visit http://localhost:3000/login');
      console.log('2. Login with test@example.com / testpassword123');
      console.log('3. Then run this script again');
      return;
    }
    
    console.log(`✅ Authenticated as: ${authData.user.email}`);
    const userId = authData.user.id;
    
    // Create strategies first
    console.log('\n🎯 Creating strategies...');
    const strategies = [
      {
        user_id: userId,
        name: 'Momentum Breakout',
        description: 'Capture strong price movements with volume confirmation',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: userId,
        name: 'Mean Reversion',
        description: 'Trade reversals from overextended conditions',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: userId,
        name: 'Trend Following',
        description: 'Follow established trends with pullback entries',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const createdStrategies = [];
    for (let i = 0; i < strategies.length; i++) {
      const { data, error } = await supabase
        .from('strategies')
        .insert(strategies[i])
        .select();
      
      if (error) {
        console.error(`❌ Error creating strategy ${strategies[i].name}:`, error.message);
      } else {
        console.log(`✅ Created strategy: ${strategies[i].name} (ID: ${data[0].id})`);
        createdStrategies.push(data[0]);
      }
    }
    
    // Create trades with all 8 emotions
    console.log('\n📈 Creating trades with emotional states...');
    
    const trades = [];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC', 'ETH', 'SPY', 'QQQ'];
    const markets = ['Stock', 'Crypto', 'ETF'];
    
    for (let i = 0; i < REQUIRED_EMOTIONS.length; i++) {
      const emotion = REQUIRED_EMOTIONS[i];
      const isBuy = i % 2 === 0;
      
      const trade = {
        user_id: userId,
        symbol: symbols[i],
        market: markets[i % markets.length],
        side: isBuy ? 'Buy' : 'Sell',
        quantity: 100 + (i * 50),
        entry_price: 100 + (i * 25),
        exit_price: 105 + (i * 20),
        pnl: isBuy ? 50 + (i * 25) : -30 - (i * 15),
        trade_date: new Date(Date.now() - (REQUIRED_EMOTIONS.length - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strategy_id: createdStrategies[i % createdStrategies.length]?.id || null,
        emotional_state: [emotion],
        entry_time: '09:30:00',
        exit_time: '10:30:00',
        notes: `Manual test trade - ${emotion} emotional state`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('trades')
        .insert(trade)
        .select();
      
      if (error) {
        console.error(`❌ Error creating trade for ${emotion}:`, error.message);
      } else {
        console.log(`✅ Created ${emotion} trade (ID: ${data[0].id})`);
        trades.push(data[0]);
      }
    }
    
    // Create a few additional trades with multiple emotions
    console.log('\n🎭 Creating trades with multiple emotions...');
    
    const multiEmotionTrades = [
      {
        user_id: userId,
        symbol: 'NVDA',
        market: 'Stock',
        side: 'Buy',
        quantity: 150,
        entry_price: 200,
        exit_price: 220,
        pnl: 300,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: createdStrategies[0]?.id || null,
        emotional_state: ['CONFIDENT', 'PATIENT'],
        entry_time: '11:00:00',
        exit_time: '12:00:00',
        notes: 'Multi-emotion trade - Confident and Patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: userId,
        symbol: 'META',
        market: 'Stock',
        side: 'Sell',
        quantity: 200,
        entry_price: 150,
        exit_price: 140,
        pnl: 200,
        trade_date: new Date().toISOString().split('T')[0],
        strategy_id: createdStrategies[1]?.id || null,
        emotional_state: ['DISCIPLINED', 'CALM'],
        entry_time: '13:00:00',
        exit_time: '14:00:00',
        notes: 'Multi-emotion trade - Disciplined and Calm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (let i = 0; i < multiEmotionTrades.length; i++) {
      const { data, error } = await supabase
        .from('trades')
        .insert(multiEmotionTrades[i])
        .select();
      
      if (error) {
        console.error(`❌ Error creating multi-emotion trade ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Created multi-emotion trade ${i + 1} (ID: ${data[0].id})`);
        trades.push(data[0]);
      }
    }
    
    // Verify the data
    console.log('\n🔍 Verifying created data...');
    
    const { data: allTrades, error: fetchError } = await supabase
      .from('trades')
      .select('emotional_state, symbol, pnl')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error('❌ Error fetching trades for verification:', fetchError.message);
      return;
    }
    
    const uniqueEmotions = new Set();
    allTrades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
        trade.emotional_state.forEach(emotion => {
          uniqueEmotions.add(emotion.toUpperCase());
        });
      }
    });
    
    const foundEmotions = Array.from(uniqueEmotions).sort();
    console.log('\n📊 Summary:');
    console.log(`✅ Created ${createdStrategies.length} strategies`);
    console.log(`✅ Created ${allTrades.length} trades`);
    console.log('\n🎭 Emotions found in database:');
    foundEmotions.forEach(emotion => console.log(`  ✓ ${emotion}`));
    
    const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => !foundEmotions.includes(emotion));
    
    if (missingEmotions.length === 0) {
      console.log('\n🎉 SUCCESS: All required emotions are present!');
      console.log('\n🚀 Emotional state analysis should now work on dashboard and confluence pages!');
      console.log('\n📋 Next steps:');
      console.log('1. Visit http://localhost:3000/dashboard to check emotional analysis');
      console.log('2. Visit http://localhost:3000/confluence to verify radar charts');
      console.log('3. Test emotion filtering functionality');
    } else {
      console.log(`\n❌ ISSUE: Missing emotions: ${missingEmotions.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error during manual emotional data creation:', error.message);
  }
}

// Run the manual data creation
createEmotionalDataManually().then(() => {
  console.log('\n✅ Manual emotional data creation process completed');
}).catch(error => {
  console.error('❌ Error during data creation:', error);
});