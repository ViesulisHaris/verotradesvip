const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk'
);

async function addTestTrades() {
  console.log('🔍 [ADD_TEST_TRADES] Adding test trades with proper UUID...');
  
  // Generate a valid UUID for testing
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  const testTrades = [
    {
      symbol: 'AAPL',
      side: 'Buy',
      quantity: 100,
      entry_price: 150.25,
      exit_price: 155.50,
      pnl: 525.00,
      trade_date: '2025-12-01',
      entry_time: '09:30',
      exit_time: '10:15',
      emotional_state: 'CONFIDENT',
      market: 'stock',
      user_id: testUserId
    },
    {
      symbol: 'GOOGL',
      side: 'Sell',
      quantity: 50,
      entry_price: 2800.00,
      exit_price: 2750.00,
      pnl: 250.00,
      trade_date: '2025-12-02',
      entry_time: '14:20',
      exit_time: '15:45',
      emotional_state: 'PATIENT',
      market: 'stock',
      user_id: testUserId
    },
    {
      symbol: 'BTC',
      side: 'Buy',
      quantity: 0.5,
      entry_price: 45000.00,
      exit_price: 46000.00,
      pnl: 500.00,
      trade_date: '2025-12-03',
      entry_time: '11:00',
      exit_time: '11:30',
      emotional_state: 'EXCITED',
      market: 'crypto',
      user_id: testUserId
    },
    {
      symbol: 'TSLA',
      side: 'Buy',
      quantity: 75,
      entry_price: 650.00,
      exit_price: 675.00,
      pnl: 187.50,
      trade_date: '2025-12-04',
      entry_time: '10:00',
      exit_time: '10:45',
      emotional_state: 'NEUTRAL',
      market: 'stock',
      user_id: testUserId
    },
    {
      symbol: 'ETH',
      side: 'Sell',
      quantity: 2.0,
      entry_price: 3200.00,
      exit_price: 3100.00,
      pnl: 200.00,
      trade_date: '2025-12-04',
      entry_time: '13:00',
      exit_time: '13:30',
      emotional_state: 'ANXIOUS',
      market: 'crypto',
      user_id: testUserId
    }
  ];
  
  try {
    console.log('🔍 [ADD_TEST_TRADES] Attempting to insert trades...');
    const { data, error } = await supabase
      .from('trades')
      .insert(testTrades);
    
    if (error) {
      console.error('🔍 [ADD_TEST_TRADES] Error adding test trades:', error);
      console.error('🔍 [ADD_TEST_TRADES] Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ [ADD_TEST_TRADES] Successfully added test trades:', data?.length);
    }
    
    // Check if trades were added
    console.log('🔍 [ADD_TEST_TRADES] Checking if trades were added...');
    const { data: checkData, error: checkError } = await supabase
      .from('trades')
      .select('id, symbol, side, quantity, entry_price, pnl, trade_date')
      .limit(10);
    
    if (checkError) {
      console.error('🔍 [ADD_TEST_TRADES] Error checking trades:', checkError);
    } else {
      console.log('✅ [ADD_TEST_TRADES] Trades in database:', checkData?.length);
      console.log('🔍 [ADD_TEST_TRADES] Sample trades:', checkData);
    }
    
    // Get total count
    const { count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ [ADD_TEST_TRADES] Total trades count:', count);
  } catch (error) {
    console.error('🔍 [ADD_TEST_TRADES] Exception adding test trades:', error);
  }
}

addTestTrades();