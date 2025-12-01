// Create the SQL function for inserting emotional data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createEmotionSQLFunction() {
  try {
    console.log('🔧 Creating insert_trade_with_emotions SQL function...');
    
    const { error } = await supabase.rpc('create_insert_trade_with_emotions_function', {
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
    
    if (error) {
      console.error('❌ Error creating SQL function:', error.message);
      return;
    }
    
    console.log('✅ Successfully created insert_trade_with_emotions SQL function');
    
  } catch (error) {
    console.error('❌ Error creating SQL function:', error.message);
  }
}

createEmotionSQLFunction();