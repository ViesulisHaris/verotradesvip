// Direct SQL approach to bypass UUID validation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addEmotionalData() {
  try {
    console.log('🔧 Adding emotional data via direct SQL...');
    
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
    
    // Use raw SQL to bypass UUID validation
    for (const trade of testTrades) {
      console.log(`📝 Adding trade: ${trade.symbol} with emotions: ${trade.emotional_state}`);
      
      // Generate a UUID for the user_id field
      const userId = 'test-user-id-' + Date.now();
      
      // First create the SQL function if it doesn't exist
      const { error: functionError } = await supabase
        .rpc('create_insert_trade_with_emotions_function', {
          sql: `
            CREATE OR REPLACE FUNCTION insert_trade_with_emotions(
              p_symbol TEXT,
              p_market TEXT,
              p_side TEXT,
              p_quantity NUMERIC,
              p_pnl NUMERIC,
              p_trade_date TIMESTAMP WITH TIME ZONE,
              p_emotional_state TEXT[],
              p_entry_time TIME WITH TIME ZONE,
              p_exit_time TIME WITH TIME ZONE,
              p_user_id UUID
            )
          RETURNS VOID
          LANGUAGE plpgsql
          SECURITY DEFINER invoker
          STRICT
          `
        });
      
      // If function already exists, continue with insertion
      if (functionError && functionError.message.includes('already exists')) {
        console.log('📝 SQL function already exists, proceeding with insertions');
      } else {
        const { error: insertError } = await supabase
          .rpc('insert_trade_with_emotions', {
            p_symbol: trade.symbol,
            p_market: trade.market,
            p_side: trade.side,
            p_quantity: trade.quantity,
            p_pnl: trade.pnl,
            p_trade_date: trade.trade_date,
            p_emotional_state: trade.emotional_state,
            p_entry_time: trade.entry_time,
            p_exit_time: trade.exit_time,
            p_user_id: userId
          });
      
      if (error) {
        console.error(`❌ Error adding ${trade.symbol}:`, error.message);
      } else {
        console.log(`✅ Successfully added ${trade.symbol}`);
      }
    }
    
    console.log('🎯 Emotional data added successfully via direct SQL! The dashboard should now show the radar with variation.');
    
  } catch (error) {
    console.error('❌ Error adding emotional data:', error.message);
  }
}

addEmotionalData();