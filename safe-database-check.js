const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function safeDatabaseCheck() {
  console.log('🔍 SAFE DATABASE STATE CHECK');
  console.log('=============================\n');

  // Initialize Supabase client with anon key (safe read-only operations)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔐 Checking current database state (read-only)...');
    
    // Check if we can access the trades table
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id')
      .limit(1);
    
    if (tradesError) {
      console.error('❌ Error accessing trades table:', tradesError.message);
      return;
    }
    
    console.log(`📊 Current trades count: ${trades.length}`);
    
    // Check if we can access the strategies table
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);
    
    if (strategiesError) {
      console.error('❌ Error accessing strategies table:', strategiesError.message);
      return;
    }
    
    console.log(`🎯 Current strategies count: ${strategies.length}`);
    
    // Get total counts safely
    const { count: totalTrades, error: totalTradesError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });
      
    const { count: totalStrategies, error: totalStrategiesError } = await supabase
      .from('strategies')
      .select('*', { count: 'exact', head: true });
    
    if (!totalTradesError && !totalStrategiesError) {
      console.log(`\n📊 DATABASE SUMMARY:`);
      console.log(`📈 Total Trades: ${totalTrades}`);
      console.log(`🎯 Total Strategies: ${totalStrategies}`);
      
      if (totalTrades === 0 && totalStrategies === 0) {
        console.log('✅ Database is empty - ready for safe data generation');
      } else {
        console.log('⚠️ Database contains data - will proceed with additional data only');
      }
    }
    
    // Check emotional states if any trades exist
    if (totalTrades > 0) {
      const { data: emotionalTrades, error: emotionalError } = await supabase
        .from('trades')
        .select('emotional_state')
        .not('emotional_state', 'is', null)
        .limit(5);
      
      if (!emotionalError && emotionalTrades.length > 0) {
        console.log('\n🎭 Sample emotional states found:');
        emotionalTrades.forEach((trade, index) => {
          console.log(`  ${index + 1}. ${JSON.stringify(trade.emotional_state)}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during safe database check:', error.message);
  }
}

// Run the safe check
safeDatabaseCheck().then(() => {
  console.log('\n✅ Safe database check completed');
}).catch(error => {
  console.error('❌ Error during database check:', error);
});