const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase credentials not available');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmotionalData() {
  try {
    console.log('\n🔍 Checking for emotional data...');
    
    // Check for trades with emotional data (without authentication)
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, emotional_state, side, user_id')
      .not('emotional_state', 'is', null)
      .limit(5);
    
    if (tradesError) {
      console.log('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    console.log('📊 Found', trades?.length || 0, 'trades with emotional data (sample of first 5)');
    
    if (trades && trades.length > 0) {
      console.log('\n🔍 Sample emotional data:');
      trades.forEach((trade, i) => {
        console.log(`  ${i+1}. Trade ID: ${trade.id}, User: ${trade.user_id}, Side: ${trade.side}, Emotional State: ${JSON.stringify(trade.emotional_state)}`);
      });
    } else {
      console.log('\n❌ No trades with emotional data found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking emotional data:', error.message);
  }
}

checkEmotionalData();