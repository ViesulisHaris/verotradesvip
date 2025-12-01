// Execute the multiple markets cleanup script
// This script will identify and remove corrupted trades with multiple markets

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeCleanup() {
  console.log('🔧 Starting multiple markets cleanup...');
  
  try {
    // Step 1: Identify corrupted trades
    console.log('\n📊 Step 1: Identifying trades with multiple markets...');
    const { data: corruptedTrades, error: identifyError } = await supabase
      .from('trades')
      .select('id, user_id, market, symbol, trade_date, side, created_at')
      .like('market', '%,%')
      .order('created_at', { ascending: false });
    
    if (identifyError) {
      console.error('❌ Error identifying corrupted trades:', identifyError);
      return;
    }
    
    console.log(`📋 Found ${corruptedTrades.length} trades with multiple markets`);
    
    if (corruptedTrades.length > 0) {
      console.log('\n🔍 Sample of corrupted trades:');
      console.table(corruptedTrades.slice(0, 5));
      
      // Step 2: Count affected users
      const affectedUsers = new Set(corruptedTrades.map(trade => trade.user_id));
      console.log(`👥 Affected users: ${affectedUsers.size}`);
      
      // Step 3: Show market combinations
      const marketCombinations = {};
      corruptedTrades.forEach(trade => {
        marketCombinations[trade.market] = (marketCombinations[trade.market] || 0) + 1;
      });
      
      console.log('\n📈 Market combinations found:');
      Object.entries(marketCombinations)
        .sort(([,a], [,b]) => b - a)
        .forEach(([market, count]) => {
          console.log(`  "${market}": ${count} trades`);
        });
      
      // Step 4: Delete corrupted trades
      console.log('\n🗑️  Step 4: Deleting corrupted trades...');
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .like('market', '%,%');
      
      if (deleteError) {
        console.error('❌ Error deleting corrupted trades:', deleteError);
        return;
      }
      
      console.log(`✅ Successfully deleted ${corruptedTrades.length} corrupted trades`);
    } else {
      console.log('✅ No corrupted trades found - database is already clean!');
    }
    
    // Step 5: Verify cleanup
    console.log('\n🔍 Step 5: Verifying cleanup...');
    const { data: verificationData, error: verificationError } = await supabase
      .from('trades')
      .select('id, market')
      .like('market', '%,%');
    
    if (verificationError) {
      console.error('❌ Error during verification:', verificationError);
      return;
    }
    
    if (verificationData.length === 0) {
      console.log('✅ Verification successful - no corrupted trades remaining');
    } else {
      console.log(`⚠️  Verification failed - ${verificationData.length} corrupted trades still exist`);
    }
    
    // Step 6: Get final statistics
    const { data: finalStats, error: statsError } = await supabase
      .from('trades')
      .select('market');
    
    if (!statsError && finalStats) {
      const uniqueMarkets = [...new Set(finalStats.map(t => t.market))];
      console.log(`\n📊 Final database statistics:`);
      console.log(`  Total trades: ${finalStats.length}`);
      console.log(`  Unique markets: ${uniqueMarkets.join(', ')}`);
    }
    
    console.log('\n🎉 Multiple markets cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
executeCleanup();