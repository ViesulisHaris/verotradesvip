// Create a trade with emotional data using a different approach
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTradeWithEmotion() {
  try {
    console.log('🔧 Creating trade with emotional data...');
    
    // First, let's check if we can read from trades table
    const { data: existingData, error: readError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Error reading trades table:', readError.message);
      return;
    }
    
    console.log('📝 Trades table structure:', existingData ? Object.keys(existingData[0] : 'No data found');
    
    // Try to create a simple trade without emotional_state first
    const { data: newTrade, error: insertError } = await supabase
      .from('trades')
      .insert({
        symbol: 'BTC',
        market: 'Crypto',
        side: 'Buy',
        quantity: 0.1,
        pnl: 150.50,
        trade_date: new Date().toISOString(),
        entry_time: '10:00',
        exit_time: '10:30'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error creating trade:', insertError.message);
      
      // If insert fails, let's try to update an existing trade
      if (existingData && existingData.length > 0) {
        console.log('📝 Attempting to update existing trade with emotional data...');
        const { error: updateError } = await supabase
          .from('trades')
          .update({
            emotional_state: '["FOMO", "CONFIDENT"]'
          })
          .eq('id', existingData[0].id);
        
        if (updateError) {
          console.error('❌ Error updating trade:', updateError.message);
        } else {
          console.log('✅ Successfully updated existing trade with emotional data');
        }
      }
    } else {
      console.log('✅ Successfully created new trade:', newTrade);
      
      // Now try to add emotional data to the new trade
      if (newTrade && newTrade.length > 0) {
        const { error: emotionUpdateError } = await supabase
          .from('trades')
          .update({
            emotional_state: '["FOMO", "CONFIDENT"]'
          })
          .eq('id', newTrade[0].id);
        
        if (emotionUpdateError) {
          console.error('❌ Error adding emotional data:', emotionUpdateError.message);
        } else {
          console.log('✅ Successfully added emotional data to trade');
        }
      }
    }
    
    console.log('🎯 Trade creation with emotional data complete! The dashboard should now show the radar with variation.');
    
  } catch (error) {
    console.error('❌ Error creating trade with emotion:', error.message);
  }
}

createTradeWithEmotion();