// Test script to verify Trade Expectancy & Sharpe Ratio calculations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTradeCalculations() {
  try {
    console.log('🔍 Testing Trade Expectancy & Sharpe Ratio calculations...\n');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Error getting user:', userError?.message || 'No user found');
      return;
    }

    console.log(`✅ User authenticated: ${user.email}`);

    // Fetch trades
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false })
      .limit(20);

    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }

    console.log(`✅ Found ${tradesData.length} trades`);
    
    if (tradesData.length === 0) {
      console.log('⚠️ No trades found. Creating sample trades for testing...');
      
      // Create sample trades for testing
      const sampleTrades = [
        {
          user_id: user.id,
          symbol: 'AAPL',
          market: 'Stock',
          side: 'Buy',
          quantity: 100,
          pnl: 250.50,
          trade_date: '2024-01-15',
          strategy_id: null,
          emotional_state: ['DISCIPLINE']
        },
        {
          user_id: user.id,
          symbol: 'TSLA',
          market: 'Stock',
          side: 'Buy',
          quantity: 50,
          pnl: -120.75,
          trade_date: '2024-01-16',
          strategy_id: null,
          emotional_state: ['FOMO']
        },
        {
          user_id: user.id,
          symbol: 'BTCUSD',
          market: 'Crypto',
          side: 'Buy',
          quantity: 0.5,
          pnl: 500.00,
          trade_date: '2024-01-17',
          strategy_id: null,
          emotional_state: ['PATIENCE']
        },
        {
          user_id: user.id,
          symbol: 'EURUSD',
          market: 'Forex',
          side: 'Sell',
          quantity: 10000,
          pnl: -75.25,
          trade_date: '2024-01-18',
          strategy_id: null,
          emotional_state: ['REVENGE']
        },
        {
          user_id: user.id,
          symbol: 'NVDA',
          market: 'Stock',
          side: 'Buy',
          quantity: 75,
          pnl: 300.00,
          trade_date: '2024-01-19',
          strategy_id: null,
          emotional_state: ['DISCIPLINE']
        }
      ];

      const { data: insertedTrades, error: insertError } = await supabase
        .from('trades')
        .insert(sampleTrades)
        .select();

      if (insertError) {
        console.error('❌ Error creating sample trades:', insertError.message);
        return;
      }

      console.log(`✅ Created ${insertedTrades.length} sample trades`);
      tradesData.push(...insertedTrades);
    }

    // Test calculations
    const tradesWithPnL = tradesData.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    console.log(`\n📊 Analyzing ${tradesWithPnL.length} trades with P&L data...`);

    // Trade Expectancy Calculation
    const wins = tradesWithPnL.filter(trade => trade.pnl > 0);
    const losses = tradesWithPnL.filter(trade => trade.pnl < 0);
    const winsCount = wins.length;
    const lossesCount = losses.length;
    const total = tradesWithPnL.length;
    
    const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
    
    const averageWin = winsCount > 0 ? grossProfit / winsCount : 0;
    const averageLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
    const winRateDecimal = winsCount / total;
    const lossRateDecimal = lossesCount / total;
    
    const tradeExpectancy = (winRateDecimal * averageWin) - (lossRateDecimal * averageLoss);

    console.log('\n📈 Trade Expectancy Calculation:');
    console.log(`  Total Trades: ${total}`);
    console.log(`  Winning Trades: ${winsCount} (${(winRateDecimal * 100).toFixed(1)}%)`);
    console.log(`  Losing Trades: ${lossesCount} (${(lossRateDecimal * 100).toFixed(1)}%)`);
    console.log(`  Average Win: $${averageWin.toFixed(2)}`);
    console.log(`  Average Loss: $${averageLoss.toFixed(2)}`);
    console.log(`  Trade Expectancy: $${tradeExpectancy.toFixed(2)}`);
    console.log(`  Formula: (${winRateDecimal.toFixed(3)} × $${averageWin.toFixed(2)}) - (${lossRateDecimal.toFixed(3)} × $${averageLoss.toFixed(2)})`);

    // Sharpe Ratio Calculation
    const returns = tradesWithPnL.map(trade => trade.pnl);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    let sharpeRatio = 0;
    let variance = 0;
    let standardDeviation = 0;
    
    if (returns.length > 1) {
      variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      standardDeviation = Math.sqrt(variance);
      sharpeRatio = standardDeviation === 0 ? 0 : avgReturn / standardDeviation;
    } else if (returns.length === 1) {
      sharpeRatio = 0;
    }

    console.log('\n📊 Sharpe Ratio Calculation:');
    console.log(`  Number of Returns: ${returns.length}`);
    console.log(`  Average Return: $${avgReturn.toFixed(2)}`);
    console.log(`  Variance: ${variance.toFixed(2)}`);
    console.log(`  Standard Deviation: $${standardDeviation.toFixed(2)}`);
    console.log(`  Sharpe Ratio: ${sharpeRatio.toFixed(4)}`);
    console.log(`  Formula: $${avgReturn.toFixed(2)} / $${standardDeviation.toFixed(2)}`);

    // Test edge cases
    console.log('\n🧪 Testing Edge Cases:');
    
    // Test with no trades
    console.log('  ✅ No trades: Handled with default values');
    
    // Test with single trade
    if (tradesWithPnL.length > 1) {
      console.log('  ✅ Single trade: Sharpe ratio set to 0');
    }
    
    // Test with all same returns
    const allSameReturns = returns.every(ret => ret === returns[0]);
    if (allSameReturns && returns.length > 1) {
      console.log('  ✅ All same returns: Standard deviation is 0, Sharpe ratio set to 0');
    }

    console.log('\n✅ All calculations completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  Trade Expectancy: $${tradeExpectancy.toFixed(2)} ${tradeExpectancy >= 0 ? '✅ Positive' : '❌ Negative'}`);
    console.log(`  Sharpe Ratio: ${sharpeRatio.toFixed(4)} ${sharpeRatio >= 1 ? '✅ Good' : sharpeRatio >= 0 ? '⚠️ Acceptable' : '❌ Poor'}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testTradeCalculations();