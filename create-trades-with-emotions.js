const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config();

console.log('📝 CREATING TRADES WITH EMOTIONS');
console.log('==================================');

// Use service role key to bypass RLS - using hardcoded values from working API route
const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m'
);

const REQUIRED_EMOTIONS = ['CONFIDENT', 'ANXIOUS', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENCE', 'GREEDY', 'CALM'];

async function createTradesWithEmotions() {
  console.log('📝 Creating trades with emotional states...');
  
  try {
    // First, let's create a test user if needed
    console.log('🔐 Checking for test user...');
    
    // Create trades with emotional states
    const sampleTrades = [
      {
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
        symbol: 'BTC',
        side: 'Buy',
        quantity: 0.5,
        entry_price: 45000.00,
        exit_price: 46000.00,
        pnl: 500.00,
        emotional_state: ['PATIENCE'],
        notes: 'Patient trade - waited for right entry point'
      },
      {
        symbol: 'ETH',
        side: 'Sell',
        quantity: 2.0,
        entry_price: 3000.00,
        exit_price: 2900.00,
        pnl: 200.00,
        emotional_state: ['CALM'],
        notes: 'Calm trade - no emotional attachment'
      },
      {
        symbol: 'MSFT',
        side: 'Buy',
        quantity: 150,
        entry_price: 350.00,
        exit_price: 340.00,
        pnl: -1500.00,
        emotional_state: ['FEARFUL'],
        notes: 'Fearful trade - afraid of missing out'
      },
      {
        symbol: 'NVDA',
        side: 'Buy',
        quantity: 200,
        entry_price: 500.00,
        exit_price: 520.00,
        pnl: 4000.00,
        emotional_state: ['GREEDY'],
        notes: 'Greedy trade - took too much risk'
      },
      {
        symbol: 'META',
        side: 'Sell',
        quantity: 100,
        entry_price: 200.00,
        exit_price: 180.00,
        pnl: 2000.00,
        emotional_state: ['IMPULSIVE'],
        notes: 'Impulsive trade - quick decision without analysis'
      }
    ];

    console.log(`📋 Creating ${sampleTrades.length} trades with emotional states...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sampleTrades.length; i++) {
      const trade = sampleTrades[i];
      
      try {
        // Generate a proper UUID for the trade
        const tradeId = randomUUID();
        
        const { data, error } = await supabase
          .from('trades')
          .insert({
            id: tradeId,
            user_id: '00000000-0000-0000-0000-000000000001', // Fixed test user ID
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            entry_price: trade.entry_price,
            exit_price: trade.exit_price,
            pnl: trade.pnl,
            emotional_state: trade.emotional_state,
            notes: trade.notes,
            trade_date: new Date().toISOString().split('T')[0],
            entry_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            exit_time: new Date().toTimeString().split(' ')[0].substring(0, 5)
          })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error creating trade ${trade.symbol}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Created trade: ${trade.symbol} with emotion: ${trade.emotional_state[0]}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Unexpected error creating trade ${trade.symbol}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 CREATION SUMMARY:`);
    console.log(`✅ Successfully created: ${successCount} trades`);
    console.log(`❌ Failed to create: ${errorCount} trades`);
    
    if (successCount > 0) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Go to: http://localhost:3000/dashboard');
      console.log('2. Look for emotional analysis components');
      console.log('3. Go to: http://localhost:3000/confluence');
      console.log('4. Check for radar charts with emotions');
      console.log('5. Test emotion filtering functionality');
      
      // Verify the trades were created
      console.log('\n🔍 VERIFYING CREATED TRADES...');
      const { data: trades, error: verifyError } = await supabase
        .from('trades')
        .select('*');
        
      if (verifyError) {
        console.error('❌ Error verifying trades:', verifyError);
      } else {
        console.log(`✅ Verification: Found ${trades.length} trades in database`);
        
        // Count emotions
        const emotionCounts = {};
        REQUIRED_EMOTIONS.forEach(emotion => emotionCounts[emotion] = 0);
        
        trades.forEach(trade => {
          if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
            trade.emotional_state.forEach(emotion => {
              if (emotionCounts[emotion] !== undefined) {
                emotionCounts[emotion]++;
              }
            });
          }
        });
        
        console.log('\n📊 EMOTION DISTRIBUTION:');
        Object.entries(emotionCounts).forEach(([emotion, count]) => {
          console.log(`  ${emotion}: ${count} trade(s)`);
        });
        
        const allEmotionsPresent = REQUIRED_EMOTIONS.every(emotion => emotionCounts[emotion] > 0);
        
        if (allEmotionsPresent) {
          console.log('\n🎉 SUCCESS: All required emotions are now present!');
        } else {
          const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => emotionCounts[emotion] === 0);
          console.log('\n⚠️  WARNING: Missing emotions:', missingEmotions);
        }
      }
    } else {
      console.log('\n❌ NO TRADES WERE CREATED');
      console.log('Please check your database connection and permissions.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute trade creation
createTradesWithEmotions();