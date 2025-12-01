import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID } from '@/lib/uuid-validation';

// Test data generation configuration
const TRADING_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'NFLX',
  'BTCUSD', 'ETHUSD', 'SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'OIL', 'NG'
];

const MARKETS = ['Stock', 'Crypto', 'Forex', 'Futures'];

const EMOTIONAL_STATES = [
  'CONFIDENT', 'FEARFUL', 'DISCIPLINED', 'IMPULSIVE', 'PATIENT', 'ANXIOUS', 'GREEDY', 'CALM'
];

const STRATEGY_TEMPLATES = [
  {
    name: 'Momentum Breakout Strategy',
    description: 'Focuses on identifying momentum breakouts and riding the trend for maximum profit',
    rules: [
      'Wait for confirmation breakout above resistance',
      'Enter trade on first pullback',
      'Use 2:1 risk/reward ratio',
      'Take partial profits at key levels',
      'Stop loss below breakout candle low'
    ]
  },
  {
    name: 'Mean Reversion Strategy',
    description: 'Capitalizes on price reversals after extreme movements',
    rules: [
      'Identify overbought/oversold conditions',
      'Wait for reversal confirmation',
      'Enter on first reversal signal',
      'Use tight stop losses',
      'Target previous support/resistance levels'
    ]
  },
  {
    name: 'Scalping Strategy',
    description: 'Quick in-and-out trades capturing small price movements',
    rules: [
      'Trade only during high volume sessions',
      'Take 5-10 pip profits quickly',
      'Use immediate breakeven stops',
      'No overnight positions',
      'Maximum 2 trades per hour'
    ]
  },
  {
    name: 'Swing Trading Strategy',
    description: 'Medium-term trades capturing larger price swings over several days',
    rules: [
      'Trade with the dominant trend',
      'Use wider stop losses for volatility',
      'Scale into positions gradually',
      'Take profits at key Fibonacci levels',
      'Hold trades 2-5 days typically'
    ]
  },
  {
    name: 'Options Income Strategy',
    description: 'Generating consistent income through options selling strategies',
    rules: [
      'Sell options with 30-45 days DTE',
      'Target 0.5-2% monthly returns',
      'Manage Greeks actively',
      'Roll positions when necessary',
      'Maintain defined risk per trade'
    ]
  }
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  
  // Ensure it's a weekday (Monday-Friday)
  const day = date.getDay();
  if (day === 0) { // Sunday
    date.setDate(date.getDate() + 1); // Move to Monday
  } else if (day === 6) { // Saturday
    date.setDate(date.getDate() + 2); // Move to Monday
  }
  
  return date;
}

function generateRandomTime(): string {
  const hours = Math.floor(Math.random() * 10) + 6; // 6 AM - 4 PM (trading hours)
  const minutes = Math.floor(Math.random() * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculatePnL(isWin: boolean): number {
  if (isWin) {
    // Winning trades: $50 - $500
    return Math.floor(Math.random() * 450) + 50;
  } else {
    // Losing trades: -$25 to -$300
    return -(Math.floor(Math.random() * 275) + 25);
  }
}

function generateTradeData(strategyId: string, tradeIndex: number, totalTrades: number, isWinningTrade: boolean, emotionIndex: number) {
  const symbol = getRandomElement(TRADING_SYMBOLS);
  const market = getRandomElement(MARKETS);
  const side: 'Buy' | 'Sell' = getRandomElement(['Buy', 'Sell']);
  const quantity = Math.floor(Math.random() * 900) + 100; // 100-1000
  const entryPrice = Math.floor(Math.random() * 900) + 10; // $10 - $910
  const pnl = calculatePnL(isWinningTrade);
  const exitPrice = side === 'Buy'
    ? entryPrice + (pnl / quantity)
    : entryPrice - (pnl / quantity);
  
  const tradeDate = generateRandomDate(
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    new Date()
  );
  
  const entryTime = generateRandomTime();
  const exitTime = generateRandomTime();
  
  // Ensure exit time is after entry time
  const [entryHour, entryMin] = entryTime.split(':').map(Number);
  const [exitHour, exitMin] = exitTime.split(':').map(Number);
  let finalExitTime = exitTime;
  
  if ((exitHour || 0) < (entryHour || 0) || ((exitHour || 0) === (entryHour || 0) && (exitMin || 0) < (entryMin || 0))) {
    finalExitTime = generateRandomTime();
  }
  
  // Ensure balanced emotional distribution across all trades
  // Each emotion will appear roughly the same number of times
  const baseEmotion = EMOTIONAL_STATES[emotionIndex % EMOTIONAL_STATES.length];
  
  // Add 1-2 additional random emotions to create variety (30% chance of additional emotions)
  let emotionalStates = [baseEmotion];
  if (Math.random() < 0.3) {
    const additionalEmotions = EMOTIONAL_STATES.filter(e => e !== baseEmotion);
    const additionalCount = Math.floor(Math.random() * 2) + 1; // 1-2 additional emotions
    const selectedAdditional = getRandomElements(additionalEmotions, additionalCount);
    emotionalStates = [...emotionalStates, ...selectedAdditional];
  }
  
  return {
    user_id: '', // Will be set in the API handler
    symbol,
    market,
    strategy_id: strategyId,
    trade_date: tradeDate.toISOString().split('T')[0],
    side,
    quantity,
    entry_price: entryPrice,
    exit_price: exitPrice,
    pnl,
    entry_time: entryTime,
    exit_time: finalExitTime,
    emotional_state: emotionalStates,
    notes: `Generated test trade ${tradeIndex + 1} of ${totalTrades} - ${isWinningTrade ? 'WIN' : 'LOSS'}`
  };
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔍 DEBUG: Authorization header:', authHeader ? 'Present' : 'Missing');
    
    let supabase;
    let user = null;
    let authError = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔍 DEBUG: Using provided JWT token (length:', token.length, ')');
      
      // Create Supabase client with the ANON key (not service role key) for JWT validation
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      
      // Get user using the token
      const result = await supabase.auth.getUser(token);
      user = result.data?.user;
      authError = result.error;
      
      console.log('🔍 DEBUG: JWT auth result:', {
        hasUser: !!user,
        authError: authError?.message,
        userId: user?.id
      });
    } else {
      console.log('🔍 DEBUG: No Authorization header found, creating default client');
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      // Try to get user without token
      const result = await supabase.auth.getUser();
      user = result.data?.user;
      authError = result.error;
    }
    
    console.log('🔍 DEBUG: Auth result:', {
      hasUser: !!user,
      authError: authError?.message,
      userId: user?.id
    });
    
    if (authError || !user) {
      console.log('🔍 DEBUG: Authentication failed, checking request headers...');
      console.log('🔍 DEBUG: Request headers:', Object.fromEntries(request.headers));
      
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    if (action === 'delete-all') {
      console.log('🚨 DANGEROUS OPERATION BLOCKED: delete-all action disabled for data protection');
      
      return NextResponse.json({
        error: 'DANGEROUS OPERATION BLOCKED',
        message: 'The delete-all functionality has been disabled to prevent accidental data loss. This operation was responsible for complete deletion of user trading data.',
        details: 'This endpoint performed destructive operations without proper safeguards. Use manual database operations if absolutely necessary.',
        blocked: true
      }, { status: 403 });
    }

    if (action === 'create-strategies') {
      console.log('📈 Creating trading strategies...');
      
      const createdStrategies = [];
      
      for (const template of STRATEGY_TEMPLATES) {
        const { data: strategy, error } = await supabase
          .from('strategies')
          .insert({
            user_id: userId,
            name: template.name,
            description: template.description,
            rules: template.rules,
            is_active: true,
            winrate_min: 60,
            winrate_max: 80,
            profit_factor_min: 1.5,
            net_pnl_min: -1000,
            net_pnl_max: 5000,
            max_drawdown_max: 20,
            sharpe_ratio_min: 1.0,
            avg_hold_period_min: 1,
            avg_hold_period_max: 120
          })
          .select()
          .single();
          
        if (error) {
          console.error(`❌ Failed to create strategy ${template.name}:`, error);
          return NextResponse.json({ 
            error: `Failed to create strategy ${template.name}`,
            details: error.message 
          }, { status: 500 });
        }
        
        createdStrategies.push(strategy);
        console.log(`✅ Created strategy: ${template.name}`);
      }

      return NextResponse.json({ 
        message: 'Strategies created successfully',
        strategies: createdStrategies,
        count: createdStrategies.length
      });
    }

    if (action === 'generate-trades') {
      console.log('📊 Generating test trades...');
      
      // Get existing strategies
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('id')
        .eq('user_id', userId);
        
      if (strategiesError || !strategies || strategies.length === 0) {
        return NextResponse.json({ 
          error: 'No strategies found. Please create strategies first.',
          details: strategiesError?.message 
        }, { status: 400 });
      }

      const TOTAL_TRADES = 100;
      const WINNING_TRADES = 71; // 71% win rate
      const LOSING_TRADES = 29;

      console.log(`📊 Generating ${TOTAL_TRADES} trades with ${WINNING_TRADES} wins and ${LOSING_TRADES} losses`);

      const trades = [];
      
      // Generate winning trades
      for (let i = 0; i < WINNING_TRADES; i++) {
        const strategyId = getRandomElement(strategies).id;
        const trade = generateTradeData(strategyId, i, TOTAL_TRADES, true, i);
        trades.push(trade);
      }
      
      // Generate losing trades
      for (let i = 0; i < LOSING_TRADES; i++) {
        const strategyId = getRandomElement(strategies).id;
        const trade = generateTradeData(strategyId, WINNING_TRADES + i, TOTAL_TRADES, false, WINNING_TRADES + i);
        trades.push(trade);
      }

      // Shuffle trades to randomize order
      const shuffledTrades = trades.sort(() => Math.random() - 0.5);

      // Insert trades in batches to avoid timeouts
      const batchSize = 10;
      let insertedTrades = [];
      
      for (let i = 0; i < shuffledTrades.length; i += batchSize) {
        const batch = shuffledTrades.slice(i, i + batchSize);
        const { data: insertedBatch, error: insertError } = await supabase
          .from('trades')
          .insert(batch.map(trade => ({ ...trade, user_id: userId })))
          .select();
        
        if (insertError) {
          console.error(`❌ Failed to insert batch ${i / batchSize + 1}:`, insertError);
          return NextResponse.json({ 
            error: 'Failed to insert trades',
            details: insertError.message,
            batch: Math.floor(i / batchSize) + 1
          }, { status: 500 });
        }
        
        if (insertedBatch && insertedBatch.length > 0) {
          insertedTrades.push(...insertedBatch);
        }
      }

      const totalPnL = insertedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const actualWins = insertedTrades.filter(trade => (trade.pnl || 0) > 0).length;
      const actualWinRate = ((actualWins / insertedTrades.length) * 100).toFixed(1);

      console.log(`✅ Generated ${insertedTrades.length} trades successfully`);
      console.log(`📈 Total P&L: $${totalPnL.toFixed(2)}`);
      console.log(`🎯 Win rate: ${actualWinRate}% (${actualWins}/${insertedTrades.length})`);

      return NextResponse.json({ 
        message: 'Trades generated successfully',
        trades: insertedTrades,
        count: insertedTrades.length,
        stats: {
          totalPnL,
          winRate: actualWinRate,
          wins: actualWins,
          losses: insertedTrades.length - actualWins
        }
      });
    }

    if (action === 'verify-data') {
      console.log('🔍 Verifying generated data...');
      
      // Get trades count
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('id, pnl, strategy_id, emotional_state, market, symbol')
        .eq('user_id', userId);
      
      // Get strategies count
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name, is_active')
        .eq('user_id', userId);

      if (tradesError || strategiesError) {
        return NextResponse.json({ 
          error: 'Failed to verify data',
          details: tradesError?.message || strategiesError?.message 
        }, { status: 500 });
      }

      const trades = tradesData || [];
      const strategies = strategiesData || [];

      // Calculate statistics
      const tradesWithPnL = trades.filter(trade => trade.pnl !== null);
      const winningTrades = tradesWithPnL.filter(trade => (trade.pnl || 0) > 0);
      const losingTrades = tradesWithPnL.filter(trade => (trade.pnl || 0) < 0);
      
      const totalPnL = tradesWithPnL.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winRate = tradesWithPnL.length > 0 
        ? ((winningTrades.length / tradesWithPnL.length) * 100).toFixed(1)
        : '0';

      // Analyze emotional states distribution
      const emotionDistribution: Record<string, number> = {};
      trades.forEach(trade => {
        if (trade.emotional_state) {
          let emotions: string[] = [];
          
          // Handle both array and JSON string formats
          if (Array.isArray(trade.emotional_state)) {
            emotions = trade.emotional_state;
          } else if (typeof trade.emotional_state === 'string') {
            try {
              emotions = JSON.parse(trade.emotional_state);
            } catch (e) {
              // If parsing fails, treat as single emotion
              emotions = [trade.emotional_state];
            }
          }
          
          emotions.forEach(emotion => {
            emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
          });
        }
      });

      // Analyze market distribution
      const marketDistribution: Record<string, number> = {};
      trades.forEach(trade => {
        marketDistribution[trade.market || 'Unknown'] = (marketDistribution[trade.market || 'Unknown'] || 0) + 1;
      });

      // Analyze strategy distribution
      const strategyDistribution: Record<string, number> = {};
      trades.forEach(trade => {
        if (trade.strategy_id) {
          const strategy = strategies.find(s => s.id === trade.strategy_id);
          if (strategy) {
            strategyDistribution[strategy.name] = (strategyDistribution[strategy.name] || 0) + 1;
          }
        }
      });

      const verification = {
        summary: {
          totalTrades: trades.length,
          tradesWithPnL: tradesWithPnL.length,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
          totalPnL,
          winRate: parseFloat(winRate),
          totalStrategies: strategies.length,
          activeStrategies: strategies.filter(s => s.is_active).length
        },
        emotionDistribution,
        marketDistribution,
        strategyDistribution,
        trades: trades.slice(0, 10).map(trade => ({
          id: trade.id,
          symbol: trade.symbol,
          market: trade.market,
          pnl: trade.pnl,
          strategyId: trade.strategy_id,
          emotions: trade.emotional_state
        }))
      };

      console.log('✅ Data verification completed');
      console.log(`📊 Found ${trades.length} trades with ${winRate}% win rate`);
      console.log(`📈 Found ${strategies.length} strategies`);

      return NextResponse.json({ 
        message: 'Data verification completed',
        verification
      });
    }

    return NextResponse.json({
      error: 'Invalid action',
      availableActions: ['create-strategies', 'generate-trades', 'verify-data'],
      disabledActions: ['delete-all - DISABLED FOR DATA PROTECTION'],
      note: 'Destructive operations have been disabled to prevent accidental data loss'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Error in generate-test-data API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}