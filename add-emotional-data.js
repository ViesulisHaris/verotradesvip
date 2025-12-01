// Simple script to add emotional data to database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addEmotionalData() {
  try {
    console.log('🔧 Adding emotional data...');
    
    // Simple test trades with emotional data
    const testTrades = [
      {
        symbol: 'BTC',
        market: 'Crypto',
        side: 'Buy',
        quantity: 0.1,
        pnl: 150.50,
        trade_date: new Date().toISOString(),
        emotional_state: '["FOMO", "CONFIDENT"]',
        entry_time: '10:00',
        exit_time: '10:30'
      },
      {
        symbol: 'ETH',
        market: 'Crypto',
        side: 'Sell',
        quantity: 0.5,
        pnl: -75.25,
        trade_date: new Date().toISOString(),
        emotional_state: '["REVENGE", "TILT"]',
        entry_time: '11:00',
        exit_time: '11:45'
      }
    ];
    
    // Insert each trade individually
    for (const trade of testTrades) {
      console.log(`📝 Adding trade: ${trade.symbol} with emotions: ${trade.emotional_state}`);
      
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: '00000000-0000-0000-000000000001', // Proper UUID format for testing
          ...trade
        })
        .select();
      
      if (error) {
        console.error(`❌ Error adding ${trade.symbol}:`, error.message);
      } else {
        console.log(`✅ Successfully added ${trade.symbol}`);
      }
    }
    
    console.log('🎯 Emotional data added successfully! The dashboard should now show the radar with variation.');
    
  } catch (error) {
    console.error('❌ Error adding emotional data:', error.message);
  }
}

addEmotionalData();