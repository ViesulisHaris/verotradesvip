// Simple script to create emotional data without complex schema issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createEmotionalData() {
  try {
    console.log('🔧 Creating emotional data...');
    
    // Simple approach - directly insert trades with emotional data
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
      },
      {
        symbol: 'SOL',
        market: 'Crypto',
        side: 'Buy',
        quantity: 10,
        pnl: 200.00,
        trade_date: new Date().toISOString(),
        emotional_state: '["PATIENCE", "DISCIPLINE"]',
        entry_time: '09:00',
        exit_time: '09:15'
      },
      {
        symbol: 'ADA',
        market: 'Crypto',
        side: 'Sell',
        quantity: 100,
        pnl: 50.75,
        trade_date: new Date().toISOString(),
        emotional_state: '["OVERRISK", "ANXIOUS"]',
        entry_time: '14:00',
        exit_time: '14:20'
      },
      {
        symbol: 'DOT',
        market: 'Crypto',
        side: 'Buy',
        quantity: 50,
        pnl: -25.50,
        trade_date: new Date().toISOString(),
        emotional_state: '["REGRET", "NEUTRAL"]',
        entry_time: '15:30',
        exit_time: '16:00'
      }
    ];
    
    // Insert each trade individually to avoid any complex operations
    for (const trade of testTrades) {
      console.log(`📝 Inserting trade: ${trade.symbol} with emotions: ${trade.emotional_state}`);
      
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: '00000000-0000-0000-000000000000', // Default user ID for testing
          ...trade
        })
        .select();
      
      if (error) {
        console.error(`❌ Error inserting ${trade.symbol}:`, error.message);
      } else {
        console.log(`✅ Successfully inserted ${trade.symbol}`);
      }
    }
    
    console.log('🎯 Emotional data creation complete! The dashboard should now show the radar with variation.');
    
  } catch (error) {
    console.error('❌ Error creating emotional data:', error.message);
  }
}

createEmotionalData();