const { createClient } = require('@supabase/supabase-js');

async function createTestData() {
  console.log('🔍 [TEST_DATA] Creating test strategy with trades...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Create a test strategy
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: 'Test Strategy for Performance Tab',
        description: 'A test strategy to verify performance tab functionality',
        is_active: true,
        user_id: '00000000-0000-0000-0000-000000000001'
      })
      .select()
      .single();
    
    if (strategyError) {
      console.error('🔍 [TEST_DATA] Error creating strategy:', strategyError);
      return;
    }
    
    console.log('🔍 [TEST_DATA] Strategy created:', strategyData);
    
    // Create some test trades
    const trades = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 10; i++) {
      const tradeDate = new Date(startDate);
      tradeDate.setDate(startDate.getDate() + i * 7);
      
      const pnl = Math.random() > 0.5 ? 
        Math.round(Math.random() * 1000 + 100) : 
        -Math.round(Math.random() * 500 + 50);
      
      trades.push({
        strategy_id: strategyData.id,
        pnl,
        trade_date: tradeDate.toISOString(),
        entry_price: Math.round(Math.random() * 100 + 50),
        exit_price: Math.round(Math.random() * 100 + 50),
        quantity: Math.round(Math.random() * 10 + 1),
        market: 'EUR/USD',
        status: 'closed'
      });
    }
    
    // Insert trades
    const { data: tradeData, error: tradeError } = await supabase
      .from('trades')
      .insert(trades)
      .select();
    
    if (tradeError) {
      console.error('🔍 [TEST_DATA] Error creating trades:', tradeError);
      return;
    }
    
    console.log('🔍 [TEST_DATA] Created', tradeData.length, 'test trades');
    
    // Calculate and save strategy stats
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    const losingTrades = trades.filter(trade => trade.pnl < 0).length;
    const grossProfit = trades.filter(trade => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0);
    const grossLoss = trades.filter(trade => trade.pnl < 0).reduce((sum, trade) => sum + trade.pnl, 0);
    
    const stats = {
      total_trades: trades.length,
      winning_trades: winningTrades,
      total_pnl: totalPnL,
      winrate: (winningTrades / trades.length) * 100,
      profit_factor: grossLoss !== 0 ? Math.abs(grossProfit / grossLoss) : grossProfit,
      gross_profit: grossProfit,
      gross_loss: grossLoss,
      max_drawdown: Math.min(...trades.map((_, i) => {
        let cumulative = 0;
        let maxDrawdown = 0;
        for (let j = 0; j <= i; j++) {
          cumulative += trades[j].pnl;
          maxDrawdown = Math.min(maxDrawdown, cumulative);
        }
        return maxDrawdown;
      })),
      sharpe_ratio: totalPnL > 0 ? (totalPnL / trades.length) / (Math.sqrt(trades.reduce((sum, trade) => sum + Math.pow(trade.pnl - (totalPnL / trades.length), 2), 0) / trades.length) : 0,
      avg_hold_period: 1440
    };
    
    // Save stats
    const { error: statsError } = await supabase
      .from('strategy_stats')
      .insert({
        strategy_id: strategyData.id,
        ...stats,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (statsError) {
      console.error('🔍 [TEST_DATA] Error creating stats:', statsError);
    } else {
      console.log('🔍 [TEST_DATA] Stats created successfully');
    }
    
    console.log('🔍 [TEST_DATA] Test data creation complete!');
    console.log('🔍 [TEST_DATA] Strategy ID:', strategyData.id);
    console.log('🔍 [TEST_DATA] Trades created:', trades.length);
    console.log('🔍 [TEST_DATA] You can now test the performance tab');
    
  } catch (error) {
    console.error('🔍 [TEST_DATA] Unexpected error:', error);
  }
}

createTestData().catch(console.error);