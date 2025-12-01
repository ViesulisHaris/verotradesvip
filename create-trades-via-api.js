// This script will call the existing working API endpoint to create test data
// Then we'll add emotional states to the created trades

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

// Emotions to add to existing trades
const emotionsToAdd = [
  'CONFIDENT', 'ANXIOUS', 'FEARFUL', 'DISCIPLINED', 
  'IMPULSIVE', 'PATIENT', 'GREEDY', 'CALM'
];

async function createTradesViaAPI() {
  console.log('📝 CREATING TRADES VIA API');
  console.log('==========================');
  
  try {
    // First, call the API endpoint to create test data
    console.log('📋 Calling API to create test data...');
    
    const response = await fetch('http://localhost:3000/api/create-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ API call successful:', result);
    
    // Now add emotional states to the created trades
    console.log('\n🎭 Adding emotional states to trades...');
    
    // Get all trades for the test user
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', TEST_USER_ID);
    
    if (fetchError) {
      console.error('❌ Error fetching trades:', fetchError.message);
      return;
    }
    
    if (!trades || trades.length === 0) {
      console.log('❌ No trades found to update');
      return;
    }
    
    console.log(`📊 Found ${trades.length} trades to update with emotions`);
    
    let updateCount = 0;
    
    // Update each trade with an emotional state
    for (let i = 0; i < trades.length && i < emotionsToAdd.length; i++) {
      const trade = trades[i];
      const emotion = emotionsToAdd[i];
      
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          emotional_state: [emotion],
          notes: `${trade.notes || ''} (Emotion: ${emotion})`
        })
        .eq('id', trade.id);
      
      if (updateError) {
        console.error(`❌ Error updating trade ${trade.symbol}:`, updateError.message);
      } else {
        console.log(`✅ Updated trade ${trade.symbol} with emotion: ${emotion}`);
        updateCount++;
      }
    }
    
    console.log('\n📊 UPDATE SUMMARY:');
    console.log(`✅ Successfully updated: ${updateCount} trades with emotions`);
    console.log(`❌ Failed to update: ${trades.length - updateCount} trades`);
    
    if (updateCount > 0) {
      console.log('\n🎉 TRADES WITH EMOTIONS CREATED SUCCESSFULLY!');
      
      // Verify the trades were updated
      console.log('\n🔍 VERIFYING TRADES WITH EMOTIONS...');
      const { data: updatedTrades, error: verifyError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .not('emotional_state', 'is', null);
      
      if (verifyError) {
        console.error('❌ Error verifying trades:', verifyError.message);
      } else {
        console.log(`✅ Found ${updatedTrades.length} trades with emotional states:`);
        updatedTrades.forEach(trade => {
          console.log(`  - ${trade.symbol}: ${trade.emotional_state ? trade.emotional_state.join(', ') : 'No emotion'}`);
        });
      }
    } else {
      console.log('\n❌ NO TRADES WERE UPDATED WITH EMOTIONS');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the function
createTradesViaAPI();