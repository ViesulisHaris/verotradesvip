const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the same hardcoded credentials as the working API route
const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user ID (consistent with API route)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// Test strategy ID (consistent with API route)
const TEST_STRATEGY_ID = '11111111-1111-1111-1111-111111111111';

// Trades with emotional states to create
const tradesWithEmotions = [
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 100,
    entry_price: 150.00,
    exit_price: 155.00,
    pnl: 500.00,
    emotional_state: ['CONFIDENT'],
    notes: 'Confident trade - strong technical analysis'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
    symbol: 'GOOGL',
    side: 'Sell',
    quantity: 50,
    entry_price: 2800.00,
    exit_price: 2750.00,
    pnl: 2500.00,
    emotional_state: ['DISCIPLINED'],
    notes: 'Disciplined trade - followed exit plan exactly'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 75,
    entry_price: 250.00,
    exit_price: 240.00,
    pnl: -750.00,
    emotional_state: ['ANXIOUS'],
    notes: 'Anxious trade - worried about missing opportunity'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04',
    symbol: 'BTC',
    side: 'Buy',
    quantity: 0.5,
    entry_price: 45000.00,
    exit_price: 47000.00,
    pnl: 1000.00,
    emotional_state: ['GREEDY'],
    notes: 'Greedy trade - wanted more profits'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05',
    symbol: 'ETH',
    side: 'Sell',
    quantity: 10,
    entry_price: 3200.00,
    exit_price: 3150.00,
    pnl: 500.00,
    emotional_state: ['PATIENT'],
    notes: 'Patient trade - waited for right entry'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06',
    symbol: 'MSFT',
    side: 'Buy',
    quantity: 60,
    entry_price: 300.00,
    exit_price: 295.00,
    pnl: -300.00,
    emotional_state: ['FEARFUL'],
    notes: 'Fearful trade - scared of losses'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07',
    symbol: 'NVDA',
    side: 'Buy',
    quantity: 40,
    entry_price: 500.00,
    exit_price: 520.00,
    pnl: 800.00,
    emotional_state: ['IMPULSIVE'],
    notes: 'Impulsive trade - jumped in without analysis'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee08',
    symbol: 'META',
    side: 'Sell',
    quantity: 30,
    entry_price: 350.00,
    exit_price: 345.00,
    pnl: 150.00,
    emotional_state: ['CALM'],
    notes: 'Calm trade - followed the plan'
  }
];

async function createTradesWithEmotions() {
  console.log('📝 CREATING TRADES WITH EMOTIONS');
  console.log('==================================');
  console.log('📝 Creating trades with emotional states...');
  
  try {
    // First, ensure the test strategy exists
    console.log('🔐 Ensuring test strategy exists...');
    const { error: strategyError } = await supabase
      .from('strategies')
      .upsert({
        id: TEST_STRATEGY_ID,
        user_id: TEST_USER_ID,
        name: 'Test Strategy for Emotions',
        description: 'Strategy for testing emotional states',
        rules: ['Test rule for emotional analysis'],
        is_active: true
      }, { onConflict: 'id' });
    
    if (strategyError) {
      console.error('❌ Error creating test strategy:', strategyError.message);
      return;
    }
    
    console.log('✅ Test strategy ensured');
    
    // Create trades with emotional states
    console.log('📋 Creating 8 trades with emotional states...');
    let successCount = 0;
    let failCount = 0;
    
    for (const trade of tradesWithEmotions) {
      try {
        const { data, error } = await supabase
          .from('trades')
          .insert({
            id: trade.id,
            user_id: TEST_USER_ID,
            strategy_id: TEST_STRATEGY_ID,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            entry_price: trade.entry_price,
            exit_price: trade.exit_price,
            pnl: trade.pnl,
            emotional_state: trade.emotional_state,
            notes: trade.notes,
            trade_date: new Date().toISOString().split('T')[0],
            entry_time: '09:30:00',
            exit_time: '10:30:00'
          })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error creating trade ${trade.symbol}:`, error.message);
          failCount++;
        } else {
          console.log(`✅ Successfully created trade: ${trade.symbol} with emotion: ${trade.emotional_state[0]}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error creating trade ${trade.symbol}:`, err.message);
        failCount++;
      }
    }
    
    console.log('\n📊 CREATION SUMMARY:');
    console.log(`✅ Successfully created: ${successCount} trades`);
    console.log(`❌ Failed to create: ${failCount} trades`);
    
    if (successCount > 0) {
      console.log('\n🎉 TRADES WITH EMOTIONS CREATED SUCCESSFULLY!');
      
      // Verify the trades were created
      console.log('\n🔍 VERIFYING CREATED TRADES...');
      const { data: createdTrades, error: verifyError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .not('emotional_state', 'is', null);
      
      if (verifyError) {
        console.error('❌ Error verifying trades:', verifyError.message);
      } else {
        console.log(`✅ Found ${createdTrades.length} trades with emotional states:`);
        createdTrades.forEach(trade => {
          console.log(`  - ${trade.symbol}: ${trade.emotional_state ? trade.emotional_state.join(', ') : 'No emotion'}`);
        });
      }
    } else {
      console.log('\n❌ NO TRADES WERE CREATED');
      console.log('Please check your database connection and permissions.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the function
createTradesWithEmotions();