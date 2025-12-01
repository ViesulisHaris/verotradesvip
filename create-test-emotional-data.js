const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase credentials not available');
  process.exit(1);
}

// Create admin client to bypass schema cache
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function createTestEmotionalData() {
  try {
    console.log('🔧 Creating test emotional data...');
    
    // First, let's get a user to associate with trades
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.log('❌ Error getting user:', userError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found to create test data');
      return;
    }
    
    const userId = users[0].id;
    console.log('✅ Using user ID:', userId);
    
    // Create test trades with emotional data
    const testTrades = [
      {
        user_id: userId,
        symbol: 'BTC',
        market: 'Crypto',
        side: 'Buy',
        quantity: 0.1,
        pnl: 150.50,
        trade_date: new Date().toISOString(),
        emotional_state: ['FOMO', 'CONFIDENT'],
        entry_time: '10:00',
        exit_time: '10:30',
        strategy_id: null
      },
      {
        user_id: userId,
        symbol: 'ETH',
        market: 'Crypto',
        side: 'Sell',
        quantity: 0.5,
        pnl: -75.25,
        trade_date: new Date().toISOString(),
        emotional_state: ['REVENGE', 'TILT'],
        entry_time: '11:00',
        exit_time: '11:45',
        strategy_id: null
      },
      {
        user_id: userId,
        symbol: 'SOL',
        market: 'Crypto',
        side: 'Buy',
        quantity: 10,
        pnl: 200.00,
        trade_date: new Date().toISOString(),
        emotional_state: ['PATIENCE', 'DISCIPLINE'],
        entry_time: '09:00',
        exit_time: '09:15',
        strategy_id: null
      },
      {
        user_id: userId,
        symbol: 'ADA',
        market: 'Crypto',
        side: 'Sell',
        quantity: 100,
        pnl: 50.75,
        trade_date: new Date().toISOString(),
        emotional_state: ['OVERRISK', 'ANXIOUS'],
        entry_time: '14:00',
        exit_time: '14:20',
        strategy_id: null
      },
      {
        user_id: userId,
        symbol: 'DOT',
        market: 'Crypto',
        side: 'Buy',
        quantity: 50,
        pnl: -25.50,
        trade_date: new Date().toISOString(),
        emotional_state: ['REGRET', 'NEUTRAL'],
        entry_time: '15:30',
        exit_time: '16:00',
        strategy_id: null
      }
    ];
    
    console.log(`📝 Creating ${testTrades.length} test trades with emotional data...`);
    
    // Insert the test trades
    const { data: insertedTrades, error: insertError } = await supabase
      .from('trades')
      .insert(testTrades)
      .select();
    
    if (insertError) {
      console.log('❌ Error inserting test trades:', insertError.message);
      return;
    }
    
    console.log('✅ Successfully created', insertedTrades?.length || 0, 'test trades with emotional data');
    console.log('🎯 The emotional radar should now show data with variation!');
    
  } catch (error) {
    console.error('❌ Error creating test emotional data:', error.message);
  }
}

createTestEmotionalData();