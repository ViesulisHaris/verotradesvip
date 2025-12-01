const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkEmotionalData() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  });
  
  const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: 'Bearer ' + authData.session.access_token
      }
    }
  });
  
  const { data: trades } = await authSupabase
    .from('trades')
    .select('id, emotional_state')
    .eq('user_id', authData.session.user.id)
    .limit(5);
  
  console.log('Sample emotional data:');
  trades.forEach((trade, i) => {
    console.log('Trade ' + (i+1) + ':');
    console.log('  emotional_state type: ' + typeof trade.emotional_state);
    console.log('  emotional_state value: ' + JSON.stringify(trade.emotional_state));
    console.log('  Is array: ' + Array.isArray(trade.emotional_state));
    console.log('');
  });
}

checkEmotionalData().catch(console.error);