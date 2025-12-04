const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk'
);

async function testDbConnection() {
  try {
    // Test basic connection
    console.log('Testing database connection...');
    const { data, error } = await supabase.from('trades').select('count');
    
    if (error) {
      console.error('Connection error:', error);
      return;
    }
    
    console.log('Connection successful. Current trades count:', data);
    
    // Try to add a simple test trade
    console.log('Adding a simple test trade...');
    const testTrade = {
      symbol: 'TEST',
      side: 'Buy',
      quantity: 1,
      entry_price: 100,
      exit_price: 110,
      pnl: 10,
      trade_date: '2025-12-04',
      entry_time: '12:00',
      exit_time: '12:30',
      emotional_state: 'TEST',
      market: 'test',
      user_id: 'test-user'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('trades')
      .insert(testTrade);
    
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Insert successful:', insertData);
    }
    
    // Check trades again
    const { data: checkData, error: checkError } = await supabase
      .from('trades')
      .select('symbol, side, quantity')
      .limit(5);
    
    if (checkError) {
      console.error('Check error:', checkError);
    } else {
      console.log('Trades in database:', checkData);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testDbConnection();