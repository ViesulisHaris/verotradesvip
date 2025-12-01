// Simple data verification script
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verifyData() {
  console.log('🔍 Verifying data generation results...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*');
    
    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }
    
    console.log(`📊 Total Trades: ${trades.length}`);
    
    if (trades.length > 0) {
      const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
      const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
      const winRate = ((winningTrades.length / trades.length) * 100).toFixed(1);
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
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
    }
    
    // Check strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*');
    
    if (strategiesError) {
      console.error('❌ Error fetching strategies:', strategiesError.message);
      return;
    }
    
    console.log(`📋 Total Strategies: ${strategies.length}`);
    
    strategies.forEach((strategy, index) => {
      console.log(`  ${index + 1}. ${strategy.name}`);
    });
    
    // Summary
    console.log('\n📊 === VERIFICATION SUMMARY ===');
    const tradeCountMatch = trades.length === 100;
    const strategyCountMatch = strategies.length === 5;
    const winRateMatch = trades.length > 0 && Math.abs(((winningTrades.length / trades.length * 100) - 71) < 5);
    
    console.log(`Trade Count (100): ${tradeCountMatch ? '✅' : '❌'} - Actual: ${trades.length}`);
    console.log(`Win Rate (~71%): ${winRateMatch ? '✅' : '❌'} - Actual: ${winRate}%`);
    console.log(`Strategy Count (5): ${strategyCountMatch ? '✅' : '❌'} - Actual: ${strategies.length}`);
    
    const overallSuccess = tradeCountMatch && strategyCountMatch && winRateMatch;
    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);
    
    return {
      trades: trades.length,
      winRate: parseFloat(winRate),
      strategies: strategies.length,
      success: overallSuccess
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return null;
  }
}

verifyData().then(result => {
  console.log('\n✅ Verification completed');
}).catch(console.error);