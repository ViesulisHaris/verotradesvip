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
const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

async function verifyEmotionalTrades() {
  console.log('🔍 VERIFYING TRADES WITH EMOTIONS');
  console.log('===================================');
  
  try {
    // Get all trades for the test user
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    
    if (fetchError) {
      console.error('❌ Error fetching trades:', fetchError.message);
      return;
    }
    
    console.log(`📊 Total trades found: ${trades ? trades.length : 0}`);
    
    if (!trades || trades.length === 0) {
      console.log('❌ No trades found in the database');
      console.log('');
      console.log('📝 Please follow the manual trade creation guide to create trades with emotions');
      return;
    }
    
    // Check for trades with emotional states
    const tradesWithEmotions = trades.filter(trade => 
      trade.emotional_state && 
      Array.isArray(trade.emotional_state) && 
      trade.emotional_state.length > 0
    );
    
    console.log(`📊 Trades with emotional states: ${tradesWithEmotions.length}`);
    
    if (tradesWithEmotions.length === 0) {
      console.log('❌ No trades with emotional states found');
      console.log('');
      console.log('📝 Please follow the manual trade creation guide to create trades with emotions');
      return;
    }
    
    // Display all emotions found
    const allEmotions = new Set();
    tradesWithEmotions.forEach(trade => {
      trade.emotional_state.forEach(emotion => {
        allEmotions.add(emotion);
      });
    });
    
    console.log('\n🎭 EMOTIONS FOUND:');
    console.log('==================');
    Array.from(allEmotions).forEach(emotion => {
      console.log(`  - ${emotion}`);
    });
    
    // Display trade details
    console.log('\n📋 TRADE DETAILS:');
    console.log('=================');
    tradesWithEmotions.forEach(trade => {
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`Emotion: ${trade.emotional_state.join(', ')}`);
      console.log(`P&L: $${trade.pnl}`);
      console.log(`Notes: ${trade.notes || 'No notes'}`);
      console.log('---');
    });
    
    // Check for required emotions
    const requiredEmotions = ['CONFIDENT', 'ANXIOUS', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'];
    const foundEmotions = Array.from(allEmotions);
    const missingEmotions = requiredEmotions.filter(emotion => !foundEmotions.includes(emotion));
    
    console.log('\n✅ VERIFICATION RESULTS:');
    console.log('=======================');
    
    if (missingEmotions.length === 0) {
      console.log('🎉 ALL REQUIRED EMOTIONS ARE PRESENT!');
      console.log('✅ Ready to test emotional analysis on dashboard and confluence pages');
    } else {
      console.log(`⚠️  Missing emotions: ${missingEmotions.join(', ')}`);
      console.log('📝 Please create trades with the missing emotions');
    }
    
    console.log('\n🌐 NEXT STEPS:');
    console.log('===============');
    console.log('1. Navigate to: http://localhost:3000/dashboard');
    console.log('2. Check if the emotional state analysis radar chart shows emotions');
    console.log('3. Navigate to: http://localhost:3000/confluence');
    console.log('4. Check if the emotional state analysis shows identical emotions');
    console.log('5. Test emotion filtering functionality');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the verification
verifyEmotionalTrades();