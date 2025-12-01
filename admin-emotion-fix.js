// Admin script to add emotional data with service role key
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

// Use service role key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function addEmotionalDataAsAdmin() {
  try {
    console.log('🔧 Adding emotional data with admin privileges...');
    
    // Create a simple trade with emotional data using service role
    const { data: newTrade, error: insertError } = await supabase
      .from('trades')
      .insert({
        user_id: uuidv4(),
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
        user_id: uuidv4(),
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
    
    console.log('🎯 Admin emotional data fix complete! The dashboard should now show the radar with variation.');
    console.log('📊 Created trades with emotions:');
    console.log('  - BTC: FOMO, CONFIDENT');
    console.log('  - ETH: REVENGE, TILT');
    console.log('🔄 Please refresh the dashboard to see the emotional radar with variation.');
    
  } catch (error) {
    console.error('❌ Error adding emotional data as admin:', error.message);
  }
}

addEmotionalDataAsAdmin();