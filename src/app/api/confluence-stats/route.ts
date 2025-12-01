import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID } from '@/lib/uuid-validation';

// Define the valid emotions from the TradeForm
const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

interface ConfluenceStatsResponse {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgTradeSize: number;
  lastSyncTime: number;
  emotionalData: Array<{
    subject: string;
    value: number;
    fullMark: number;
    leaning: string;
    side: string;
    leaningValue?: number;
    totalTrades?: number;
  }>;
}

export async function GET(request: Request) {
  try {
    console.log('🔄 [CONFLUENCE_STATS] Fetching confluence statistics...');
    
    // Parse URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const emotionalStates = searchParams.get('emotionalStates')?.split(',').filter(Boolean) || [];
    const strategyId = searchParams.get('strategyId') || undefined;
    const symbol = searchParams.get('symbol') || undefined;
    const market = searchParams.get('market') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const pnlFilter = searchParams.get('pnlFilter') as 'all' | 'profitable' | 'lossable' || 'all';
    const side = searchParams.get('side') as 'Buy' | 'Sell' | '' || '';
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user = null;
    let authError = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
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
      
      const result = await supabase.auth.getUser(token);
      user = result.data?.user;
      authError = result.error;
    } else {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      const result = await supabase.auth.getUser();
      user = result.data?.user;
      authError = result.error;
    }
    
    if (authError || !user) {
      console.error('❌ [CONFLUENCE_STATS] Authentication failed:', authError?.message);
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    // Build base query for trades with emotional states
    let query = supabase
      .from('trades')
      .select(`
        id,
        symbol,
        side,
        quantity,
        entry_price,
        exit_price,
        pnl,
        trade_date,
        emotional_state,
        strategy_id,
        user_id,
        market
      `)
      .eq('user_id', userId)
      .not('pnl', 'is', null);

    // Apply filters
    if (strategyId) {
      const validatedStrategyId = validateUUID(strategyId, 'strategy_id');
      query = query.eq('strategy_id', validatedStrategyId);
    }

    if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`);
    }

    if (market) {
      query = query.eq('market', market);
    }

    if (dateFrom) {
      query = query.gte('trade_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('trade_date', dateTo);
    }

    // P&L filter
    if (pnlFilter && pnlFilter !== 'all') {
      if (pnlFilter === 'profitable') {
        query = query.gt('pnl', 0);
      } else if (pnlFilter === 'lossable') {
        query = query.lt('pnl', 0);
      }
    }

    // Trade side filter
    if (side) {
      query = query.eq('side', side);
    }

    console.log('🔄 [CONFLUENCE_STATS] Applying filters:', {
      emotionalStates,
      strategyId,
      symbol,
      market,
      dateFrom,
      dateTo,
      pnlFilter,
      side
    });

    // Execute query to get all trades
    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error('❌ [CONFLUENCE_STATS] Error fetching trades:', tradesError);
      return NextResponse.json({
        error: 'Failed to fetch trades',
        details: tradesError.message
      }, { status: 500 });
    }

    let filteredTrades = trades || [];

    // Apply emotional states filter if provided
    if (emotionalStates && emotionalStates.length > 0) {
      filteredTrades = filteredTrades.filter(trade => {
        if (!trade.emotional_state) return false;
        
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
        
        // Check if any of the trade's emotions match the filter
        const normalizedTradeEmotions = emotions.map(e => e.toUpperCase().trim());
        const normalizedFilterEmotions = emotionalStates.map(e => e.toUpperCase().trim());
        
        return normalizedTradeEmotions.some(tradeEmotion =>
          normalizedFilterEmotions.includes(tradeEmotion)
        );
      });
    }

    if (!filteredTrades || filteredTrades.length === 0) {
      console.log('📊 [CONFLUENCE_STATS] No trades found for user with applied filters');
      return NextResponse.json({
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        avgTradeSize: 0,
        lastSyncTime: Date.now(),
        emotionalData: []
      } as ConfluenceStatsResponse);
    }

    // Calculate basic statistics based on filtered trades
    const totalTrades = filteredTrades.length;
    const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = filteredTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgTradeSize = filteredTrades.reduce((sum, trade) => sum + (trade.quantity || 0), 0) / totalTrades;

    // Process emotional data for radar chart
    const emotionStats: Record<string, {
      count: number;
      totalPnL: number;
      buyCount: number;
      sellCount: number;
      trades: any[];
    }> = {};

    // Initialize all valid emotions with zero values
    VALID_EMOTIONS.forEach(emotion => {
      emotionStats[emotion] = {
        count: 0,
        totalPnL: 0,
        buyCount: 0,
        sellCount: 0,
        trades: []
      };
    });

    // Process each trade's emotional states (using filtered trades)
    filteredTrades.forEach(trade => {
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
        
        // Process each emotion for this trade
        emotions.forEach(emotion => {
          const normalizedEmotion = emotion.toUpperCase().trim();
          if (VALID_EMOTIONS.includes(normalizedEmotion)) {
            const stats = emotionStats[normalizedEmotion];
            if (stats) {
              stats.count++;
              stats.totalPnL += trade.pnl || 0;
              stats.trades.push(trade);
              
              if (trade.side === 'Buy') {
                stats.buyCount++;
              } else if (trade.side === 'Sell') {
                stats.sellCount++;
              }
            }
          }
        });
      }
    });

    // Convert to radar chart format
    const emotionalData = VALID_EMOTIONS.map(emotion => {
      const stats = emotionStats[emotion];
      if (!stats) {
        return {
          subject: emotion,
          value: 0,
          fullMark: 100,
          leaning: 'Balanced',
          side: 'NULL',
          leaningValue: 0,
          totalTrades: 0
        };
      }
      
      const frequency = totalTrades > 0 ? (stats.count / totalTrades) * 100 : 0;
      
      // Determine leaning based on buy/sell ratio and P&L
      let leaning = 'Balanced';
      let leaningValue = 0;
      
      if (stats.count > 0) {
        const buyRatio = stats.buyCount / stats.count;
        const avgPnL = stats.totalPnL / stats.count;
        
        if (buyRatio > 0.6) {
          leaning = 'Buy Leaning';
          leaningValue = 50 + (avgPnL > 0 ? Math.min(50, avgPnL) : 0);
        } else if (buyRatio < 0.4) {
          leaning = 'Sell Leaning';
          leaningValue = -50 - (avgPnL > 0 ? Math.min(50, avgPnL) : 0);
        } else {
          leaning = 'Balanced';
          leaningValue = avgPnL > 0 ? Math.min(50, avgPnL) : Math.max(-50, avgPnL);
        }
      }
      
      return {
        subject: emotion,
        value: frequency,
        fullMark: 100,
        leaning,
        side: stats.buyCount > stats.sellCount ? 'Buy' : stats.sellCount > stats.buyCount ? 'Sell' : 'NULL',
        leaningValue,
        totalTrades: stats.count
      };
    });

    const response: ConfluenceStatsResponse = {
      totalTrades,
      totalPnL,
      winRate,
      avgTradeSize,
      lastSyncTime: Date.now(),
      emotionalData
    };

    console.log('✅ [CONFLUENCE_STATS] Statistics calculated successfully:', {
      totalTrades,
      totalPnL,
      winRate: winRate.toFixed(1) + '%',
      emotionsProcessed: emotionalData.filter(d => d.totalTrades! > 0).length,
      filtersApplied: {
        emotionalStates,
        strategyId,
        symbol,
        market,
        dateFrom,
        dateTo,
        pnlFilter,
        side
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [CONFLUENCE_STATS] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}