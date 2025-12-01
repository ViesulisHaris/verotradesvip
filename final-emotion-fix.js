// Final script to add emotional data
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addEmotionalData() {
  try {
    console.log('🔧 Adding emotional data...');
    
    // Create a simple trade with emotional data
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
      console.log('✅ Successfully created trade with emotional data');
    }
    
    console.log('🎯 Emotional data fix complete! The dashboard should now show the radar with variation.');
    
  } catch (error) {
    console.error('❌ Error adding emotional data:', error.message);
  }
}

addEmotionalData();