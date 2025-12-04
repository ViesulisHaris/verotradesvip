const { createClient } = require('@supabase/supabase-js');

// Use the anon key but with a different approach
const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk'
);

async function checkAllTrades() {
  try {
    console.log('🔍 [DIRECT_DB_CHECK] Checking all trades without user filter...');
    
    // Try to get all trades (no user filter)
    const { data: allTrades, error: allError } = await supabase
      .from('trades')
      .select('*')
      .limit(10);
    
    if (allError) {
      console.error('🔍 [DIRECT_DB_CHECK] Error getting all trades:', allError);
    } else {
      console.log('✅ [DIRECT_DB_CHECK] All trades found:', {
        count: allTrades?.length || 0,
        sample: allTrades?.slice(0, 2)
      });
    }
    
    // Try to get trades with different user IDs
    const testUserIds = [
      '00000000-0000-0000-0000-000000000001',
      'test-user-id',
      '123e4567-e89b-12d3-a456-426614174000'
    ];
    
    for (const testUserId of testUserIds) {
      console.log(`🔍 [DIRECT_DB_CHECK] Checking trades for user: ${testUserId}`);
      
      const { data: userTrades, error: userError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', testUserId)
        .limit(5);
      
      if (userError) {
        console.error(`🔍 [DIRECT_DB_CHECK] Error for user ${testUserId}:`, userError);
      } else {
        console.log(`✅ [DIRECT_DB_CHECK] Trades for user ${testUserId}:`, {
          count: userTrades?.length || 0,
          sample: userTrades?.slice(0, 1)
        });
      }
    }
    
    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('trades')
      .select('id, user_id, symbol, side, quantity, entry_price, exit_price, pnl, trade_date')
      .limit(1);
    
    if (tableError) {
      console.error('🔍 [DIRECT_DB_CHECK] Table structure error:', tableError);
    } else {
      console.log('✅ [DIRECT_DB_CHECK] Table structure sample:', tableInfo);
    }
    
  } catch (error) {
    console.error('🔍 [DIRECT_DB_CHECK] Exception:', error);
  }
}

checkAllTrades();