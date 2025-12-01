const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 VERIFYING TRADES AND EMOTIONS');
console.log('==================================');

// Use anon key for basic operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const REQUIRED_EMOTIONS = ['CONFIDENT', 'ANXIOUS', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENCE', 'GREEDY', 'CALM'];

async function verifyTradesAndEmotions() {
  console.log('🔍 Checking for existing trades with emotional states...');
  
  try {
    // Get all trades
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('*');
      
    if (fetchError) {
      console.error('❌ Error fetching trades:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${trades.length} total trades in database`);
    
    if (trades.length === 0) {
      console.log('\n❌ NO TRADES FOUND');
      console.log('You need to create trades first using the TradeForm at: http://localhost:3000/log-trade');
      console.log('Follow the manual creation guide in final-manual-data-creation-guide.js');
      return;
    }
    
    // Check for emotional states
    let tradesWithEmotions = 0;
    const emotionCounts = {};
    REQUIRED_EMOTIONS.forEach(emotion => emotionCounts[emotion] = 0);
    
    trades.forEach(trade => {
      if (trade.emotional_state && Array.isArray(trade.emotional_state) && trade.emotional_state.length > 0) {
        tradesWithEmotions++;
        trade.emotional_state.forEach(emotion => {
          if (emotionCounts[emotion] !== undefined) {
            emotionCounts[emotion]++;
          }
        });
      }
    });
    
    console.log(`✅ Found ${tradesWithEmotions} trades with emotional states`);
    
    console.log('\n📊 EMOTION DISTRIBUTION:');
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count} trade(s)`);
    });
    
    const allEmotionsPresent = REQUIRED_EMOTIONS.every(emotion => emotionCounts[emotion] > 0);
    
    if (allEmotionsPresent) {
      console.log('\n🎉 SUCCESS: All required emotions are present in the database!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Go to: http://localhost:3000/dashboard');
      console.log('2. Look for emotional analysis components');
      console.log('3. Go to: http://localhost:3000/confluence');
      console.log('4. Check for radar charts with all emotions');
      console.log('5. Test emotion filtering functionality');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some emotions are missing');
      const missingEmotions = REQUIRED_EMOTIONS.filter(emotion => emotionCounts[emotion] === 0);
      console.log('Missing emotions:', missingEmotions);
      console.log('\n📝 RECOMMENDATION:');
      console.log('Create trades with missing emotions using the TradeForm at: http://localhost:3000/log-trade');
    }
    
    // Show sample trades
    console.log('\n📋 SAMPLE TRADES WITH EMOTIONS:');
    const sampleTrades = trades.filter(trade => 
      trade.emotional_state && 
      Array.isArray(trade.emotional_state) && 
      trade.emotional_state.length > 0
    ).slice(0, 3);
    
    sampleTrades.forEach((trade, index) => {
      console.log(`\n  Trade ${index + 1}:`);
      console.log(`    Symbol: ${trade.symbol}`);
      console.log(`    Side: ${trade.side}`);
      console.log(`    P&L: $${trade.pnl}`);
      console.log(`    Emotional State: ${JSON.stringify(trade.emotional_state)}`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute verification
verifyTradesAndEmotions();