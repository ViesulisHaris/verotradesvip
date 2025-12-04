const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk'
);

async function checkTrades() {
  console.log('🔍 [DB_CHECK] Checking if there are any trades in the database...');
  
    
  const { data, error, count } = await supabase
    .from('trades')
    .select('id, symbol, side, quantity, entry_price, pnl, trade_date')
    .limit(5);
  
  if (error) {
    console.error('🔍 [DB_CHECK] Error checking trades:', error);
    return;
  }
  
  console.log('🔍 [DB_CHECK] Trades check result:', {
    count,
    hasData: !!(data && data.length > 0),
    dataLength: data?.length || 0,
    sampleTrades: data?.slice(0, 2) || []
  });
  
  if (data && data.length > 0) {
    console.log('✅ [DB_CHECK] TRADES FOUND IN DATABASE! Sample trades:');
    data.forEach((trade, index) => {
      console.log(`  Trade ${index + 1}: ${trade.symbol} - ${trade.side} - $${trade.entry_price} - P&L: $${trade.pnl || 0} - Date: ${trade.trade_date}`);
    });
  } else {
    console.log('❌ [DB_CHECK] NO TRADES FOUND IN DATABASE');
  }
}

checkTrades().then(() => {
  console.log('🔍 [DB_CHECK] Check completed');
  process.exit(0);
}).catch((error) => {
  console.error('🔍 [DB_CHECK] Exception checking trades:', error);
  process.exit(1);
});