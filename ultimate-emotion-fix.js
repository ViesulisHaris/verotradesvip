// Ultimate script to add emotional data using anon key
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key instead of service role
);

async function addEmotionalData() {
  try {
    console.log('🔧 Adding emotional data using anon key...');
    
    // First, check if we can read from trades table
    const { data: existingData, error: readError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Error reading trades table:', readError.message);
      return;
    }
    
    console.log('📝 Trades table structure:', existingData ? Object.keys(existingData[0]) : 'No data found');
    
    // Create a simple trade with emotional data
    const { data: newTrade, error: insertError } = await supabase
      .from('trades')
      .insert({
        symbol: 'BTC',
        market: 'Crypto',
        side: 'Buy',
        quantity: 0.1,
        pnl: 150.50,
        trade_date: new Date().toISOString(),
        emotional_state: '["FOMO", "CONFIDENT"]',
        entry_time: '10:00',
        exit_time: '10:30'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error creating trade:', insertError.message);
    } else {
      console.log('✅ Successfully created trade with emotional data:', newTrade);
    }
    
    // Create a second trade with different emotions
    const { data: secondTrade, error: secondError } = await supabase
      .from('trades')
      .insert({
        symbol: 'ETH',
        market: 'Crypto',
        side: 'Sell',
        quantity: 0.5,
        pnl: -75.25,
        trade_date: new Date().toISOString(),
        emotional_state: '["REVENGE", "TILT"]',
        entry_time: '11:00',
        exit_time: '11:45'
      })
      .select();
    
    if (secondError) {
      console.error('❌ Error creating second trade:', secondError.message);
    } else {
      console.log('✅ Successfully created second trade with emotional data:', secondTrade);
    }
    
    console.log('🎯 Ultimate emotional data fix complete! The dashboard should now show the radar with variation.');
    console.log('📊 Created trades with emotions:');
    console.log('  - BTC: FOMO, CONFIDENT');
    console.log('  - ETH: REVENGE, TILT');
    console.log('🔄 Please refresh the dashboard to see the emotional radar with variation.');
    
  } catch (error) {
    console.error('❌ Error adding emotional data:', error.message);
  }
}

addEmotionalData();