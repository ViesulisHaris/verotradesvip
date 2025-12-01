import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID } from '@/lib/uuid-validation';

interface ConfluenceTradesResponse {
  trades: Array<{
    id: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    quantity: number;
    entry_price: number;
    exit_price?: number;
    pnl?: number;
    trade_date: string;
    entry_time?: string;
    exit_time?: string;
    emotional_state?: string[];
    strategy_id?: string;
    market?: string;
    notes?: string;
    strategies?: {
      id: string;
      name: string;
    };
  }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export async function GET(request: Request) {
  try {
    console.log('🔄 [CONFLUENCE_TRADES] Fetching filtered trades...');
    
    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
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
      console.error('❌ [CONFLUENCE_TRADES] Authentication failed:', authError?.message);
      return NextResponse.json({
        error: 'Authentication required',
        details: authError?.message
      }, { status: 401 });
    }

    const userId = validateUUID(user.id, 'user_id');

    // Build base query
    let query = supabase
      .from('trades')
      .select(`
        *,
        strategies (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

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

    console.log('🔄 [CONFLUENCE_TRADES] Applying filters:', {
      emotionalStates,
      strategyId,
      symbol,
      market,
      dateFrom,
      dateTo,
      pnlFilter,
      side,
      page,
      limit
    });

    // Execute query to get all trades (we'll filter emotional states client-side for now)
    const { data: allTrades, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('❌ [CONFLUENCE_TRADES] Error fetching trades:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch trades',
        details: fetchError.message
      }, { status: 500 });
    }

    let filteredTrades = allTrades || [];

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

    // Calculate pagination
    const totalCount = filteredTrades.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

    // Process trades to ensure consistent format
    const processedTrades = paginatedTrades.map(trade => {
      let processedEmotionalState: string[] = [];
      
      if (trade.emotional_state) {
        if (Array.isArray(trade.emotional_state)) {
          processedEmotionalState = trade.emotional_state;
        } else if (typeof trade.emotional_state === 'string') {
          try {
            processedEmotionalState = JSON.parse(trade.emotional_state);
          } catch (e) {
            processedEmotionalState = [trade.emotional_state];
          }
        }
      }

      return {
        id: trade.id || '',
        symbol: trade.symbol || '',
        side: trade.side || 'Buy',
        quantity: trade.quantity || 0,
        entry_price: trade.entry_price || 0,
        exit_price: trade.exit_price,
        pnl: trade.pnl,
        trade_date: trade.trade_date || '',
        entry_time: trade.entry_time,
        exit_time: trade.exit_time,
        emotional_state: processedEmotionalState,
        strategy_id: trade.strategy_id,
        market: trade.market,
        notes: trade.notes,
        strategies: trade.strategies
      };
    });

    const response: ConfluenceTradesResponse = {
      trades: processedTrades,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    console.log('✅ [CONFLUENCE_TRADES] Trades fetched successfully:', {
      totalCount,
      filteredCount: filteredTrades.length,
      currentPage: page,
      totalPages,
      returnedTrades: processedTrades.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [CONFLUENCE_TRADES] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}