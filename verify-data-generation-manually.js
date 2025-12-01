// Manual verification script to check data generation results
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verifyDataGeneration() {
  console.log('🔍 Verifying data generation results manually...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get trades data
    console.log('📊 Checking trades...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*');
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades`);
    
    if (trades.length > 0) {
      const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
      const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winRate = ((winningTrades.length / trades.length) * 100).toFixed(1);
      
      console.log(`📈 Win Rate: ${winRate}% (${winningTrades.length} wins, ${losingTrades.length} losses)`);
      console.log(`💰 Total P&L: $${totalPnL.toFixed(2)}`);
      
      // Check emotional states
      const emotions = new Set();
      trades.forEach(trade => {
        if (trade.emotional_state && Array.isArray(trade.emotional_state)) {
          trade.emotional_state.forEach(emotion => emotions.add(emotion));
        }
      });
      console.log(`😊 Emotional States: ${Array.from(emotions).join(', ')}`);
      
      // Check markets
      const markets = new Set();
      trades.forEach(trade => markets.add(trade.market));
      console.log(`🏢 Markets: ${Array.from(markets).join(', ')}`);
      
      // Check date range
      const dates = trades.map(trade => new Date(trade.trade_date)).sort((a, b) => a - b);
      if (dates.length > 0) {
        const startDate = dates[0].toLocaleDateString();
        const endDate = dates[dates.length - 1].toLocaleDateString();
        console.log(`📅 Date Range: ${startDate} to ${endDate}`);
      }
    }
    
    // Get strategies data
    console.log('\n📋 Checking strategies...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*');
    
    if (strategiesError) {
      console.error('❌ Error fetching strategies:', strategiesError.message);
      return;
    }
    
    console.log(`✅ Found ${strategies.length} strategies`);
    
    strategies.forEach((strategy, index) => {
      console.log(`  ${index + 1}. ${strategy.name}`);
      console.log(`     ${strategy.description}`);
      console.log(`     Rules: ${strategy.rules?.length || 0}`);
    });
    
    // Summary
    console.log('\n📊 === VERIFICATION SUMMARY ===');
    console.log(`Total Trades: ${trades.length} (Expected: 100) ${trades.length === 100 ? '✅' : '❌'}`);
    const actualWinRate = trades.length > 0 ? ((trades.filter(t => (t.pnl || 0) > 0).length / trades.length * 100).toFixed(1) : 0);
    const winRateMatch = trades.length > 0 && Math.abs(((trades.filter(t => (t.pnl || 0) > 0).length / trades.length * 100) - 71) < 5;
    console.log(`Win Rate: ${actualWinRate}% (Expected: ~71%) ${winRateMatch ? '✅' : '❌'}`);
    console.log(`Total Strategies: ${strategies.length} (Expected: 5) ${strategies.length === 5 ? '✅' : '❌'}`);
    
    // Check if we have the expected data
    const hasExpectedTrades = trades.length === 100;
    const hasExpectedWinRate = trades.length > 0 && Math.abs(((trades.filter(t => (t.pnl || 0) > 0).length / trades.length * 100) - 71) < 5;
    const hasExpectedStrategies = strategies.length === 5;
    
    console.log(`\n🎯 Overall Status: ${hasExpectedTrades && hasExpectedWinRate && hasExpectedStrategies ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);
    
    return {
      trades: trades.length,
      winRate: actualWinRate,
      strategies: strategies.length,
      success: hasExpectedTrades && hasExpectedWinRate && hasExpectedStrategies
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return null;
  }
}

// Run verification
verifyDataGeneration().then(result => {
  if (result) {
    console.log('\n✅ Verification completed successfully');
  } else {
    console.log('\n❌ Verification failed');
  }
}).catch(console.error);