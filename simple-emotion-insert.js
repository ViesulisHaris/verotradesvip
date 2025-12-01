// Simple script to insert emotional data
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function insertEmotionalData() {
  try {
    console.log('🔧 Inserting emotional data...');
    
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
    
    for (const trade of testTrades) {
      console.log(`📝 Inserting trade: ${trade.symbol} with emotions: ${trade.emotional_state}`);
      
      const { error } = await supabase
        .from('trades')
        .insert({
          user_id: uuidv4(), // Generate proper UUID
          ...trade
        });
      
      if (error) {
        console.error(`❌ Error inserting ${trade.symbol}:`, error.message);
      } else {
        console.log(`✅ Successfully inserted ${trade.symbol}`);
      }
    }
    
    console.log('🎯 Emotional data insertion complete!');
    
  } catch (error) {
    console.error('❌ Error inserting emotional data:', error.message);
  }
}

insertEmotionalData();