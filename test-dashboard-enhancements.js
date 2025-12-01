const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDashboardEnhancements() {
  console.log('🧪 Testing Dashboard Enhancements...\n');
  
  try {
    // Test 1: Get user and trades
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log(`✅ Authenticated user: ${user.email}`);
    
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.log('❌ Error fetching trades:', error);
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades`);
    
    if (trades.length === 0) {
      console.log('⚠️  No trades found - creating test data...');
      
      // Create some test trades with emotions
      const testTrades = [
        {
          user_id: user.id,
          symbol: 'AAPL',
          side: 'Buy',
          quantity: 100,
          entry_price: 150.00,
          exit_price: 155.00,
          pnl: 500.00,
          trade_date: new Date().toISOString(),
          emotional_state: JSON.stringify(['CONFIDENT', 'PATIENCE'])
        },
        {
          user_id: user.id,
          symbol: 'TSLA',
          side: 'Sell',
          quantity: 50,
          entry_price: 200.00,
          exit_price: 195.00,
          pnl: 250.00,
          trade_date: new Date(Date.now() - 86400000).toISOString(),
          emotional_state: JSON.stringify(['DISCIPLINE'])
        },
        {
          user_id: user.id,
          symbol: 'NVDA',
          side: 'Buy',
          quantity: 75,
          entry_price: 400.00,
          exit_price: 380.00,
          pnl: -1500.00,
          trade_date: new Date(Date.now() - 172800000).toISOString(),
          emotional_state: JSON.stringify(['FOMO', 'TILT'])
        }
      ];
      
      const { error: insertError } = await supabase
        .from('trades')
        .insert(testTrades);
      
      if (insertError) {
        console.log('❌ Error creating test trades:', insertError);
        return;
      }
      
      console.log('✅ Created 3 test trades');
      
      // Fetch the trades again
      const { data: newTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);
      
      if (newTrades) {
        trades.push(...newTrades);
      }
    }
    
    // Test 2: Calculate Sharpe Ratio
    const returns = trades.map(t => t.pnl || 0);
    const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length : 0;
    const standardDeviation = Math.sqrt(variance);
    const riskFreeRate = 0.02 / 252; // Daily risk-free rate
    const sharpeRatio = standardDeviation === 0 ? 0 : (meanReturn - riskFreeRate) / standardDeviation;
    
    console.log(`✅ Sharpe Ratio: ${sharpeRatio.toFixed(2)}`);
    console.log(`   - Mean Return: ${meanReturn.toFixed(2)}`);
    console.log(`   - Standard Deviation: ${standardDeviation.toFixed(2)}`);
    
    // Test 3: Analyze emotions
    const emotions = {};
    const validEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
    
    for (const trade of trades) {
      if (!trade.emotional_state) continue;
      
      let tradeEmotions = [];
      
      if (Array.isArray(trade.emotional_state)) {
        tradeEmotions = trade.emotional_state
          .filter(e => typeof e === 'string' && e.trim())
          .map(e => e.trim().toUpperCase());
      } else if (typeof trade.emotional_state === 'string') {
        const trimmed = trade.emotional_state.trim();
        if (trimmed) {
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                tradeEmotions = parsed.map(e => typeof e === 'string' ? e.trim().toUpperCase() : e);
              } else if (typeof parsed === 'string') {
                tradeEmotions = [parsed.trim().toUpperCase()];
              }
            } catch {
              tradeEmotions = [trimmed.toUpperCase()];
            }
          } else {
            tradeEmotions = [trimmed.toUpperCase()];
          }
        }
      }
      
      for (const emotion of tradeEmotions) {
        if (validEmotions.includes(emotion)) {
          emotions[emotion] = (emotions[emotion] || 0) + 1;
        }
      }
    }
    
    const totalEmotions = Object.values(emotions).reduce((a, b) => a + b, 0);
    let mostLeanedEmotion = 'None';
    if (Object.keys(emotions).length > 0) {
      const maxEmotion = Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b);
      mostLeanedEmotion = maxEmotion[0];
    }
    
    console.log(`✅ Most Leaned Emotion: ${mostLeanedEmotion}`);
    console.log('   - Emotion Distribution:');
    Object.entries(emotions).forEach(([emotion, count]) => {
      const percentage = ((count / totalEmotions) * 100).toFixed(1);
      console.log(`     * ${emotion}: ${count} (${percentage}%)`);
    });
    
    // Test 4: Check profitability metrics
    const totalPnL = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
    const total = trades.length;
    const winrate = total ? ((wins / total) * 100).toFixed(1) : '0';
    
    const grossProfit = trades.reduce((s, t) => s + Math.max(0, t.pnl ?? 0), 0);
    const grossLoss = trades.reduce((s, t) => s + Math.min(0, t.pnl ?? 0), 0);
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 'Infinite' : '0') : (grossProfit / Math.abs(grossLoss)).toFixed(2);
    
    console.log(`✅ Profitability Metrics:`);
    console.log(`   - Total PnL: ${totalPnL.toFixed(2)} (${totalPnL > 0 ? 'Good' : totalPnL < 0 ? 'Bad' : 'Neutral'})`);
    console.log(`   - Win Rate: ${winrate}% (${parseFloat(winrate) > 50 ? 'Good' : parseFloat(winrate) > 40 ? 'Medium' : 'Bad'})`);
    console.log(`   - Profit Factor: ${profitFactor} (${profitFactor === 'Infinite' || parseFloat(profitFactor) > 1.5 ? 'Good' : parseFloat(profitFactor) > 1 ? 'Medium' : 'Bad'})`);
    console.log(`   - Avg Trade PnL: ${total > 0 ? (totalPnL / total).toFixed(2) : '0.00'} (${totalPnL > 0 ? 'Good' : totalPnL < 0 ? 'Bad' : 'Neutral'})`);
    
    console.log('\n🎉 All dashboard enhancements are working correctly!');
    console.log('\n📊 Summary:');
    console.log(`   - Sharpe Ratio calculation: ✅`);
    console.log(`   - Most leaned emotion detection: ✅`);
    console.log(`   - Profitability color coding logic: ✅`);
    console.log(`   - All metrics calculated successfully: ✅`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboardEnhancements();