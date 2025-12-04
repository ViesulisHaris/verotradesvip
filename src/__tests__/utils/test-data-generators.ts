// Comprehensive test data generators for filtering and sorting tests
import { TradeFilterOptions, StrategyFilterOptions } from '@/lib/filtering-types';

// Enhanced trade interface matching the actual database structure
export interface MockTrade {
  id: string;
  user_id: string;
  symbol: string;
  market: 'stock' | 'crypto' | 'forex' | 'futures';
  side: 'Buy' | 'Sell';
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  trade_date: string;
  strategy_id?: string;
  strategy?: string;
  emotional_state?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Strategy interface
export interface MockStrategy {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  created_at: string;
  updated_at: string;
}

// Market types for realistic test data
const MARKET_TYPES: Array<'stock' | 'crypto' | 'forex' | 'futures'> = ['stock', 'crypto', 'forex', 'futures'];
const TRADE_SIDES: Array<'Buy' | 'Sell'> = ['Buy', 'Sell'];

// Stock symbols for realistic data
const STOCK_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
  'WMT', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'PFE', 'CSCO', 'ADBE'
];

// Crypto symbols for realistic data
const CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'MATIC', 'AVAX',
  'LINK', 'UNI', 'LTC', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP', 'HBAR'
];

// Forex pairs for realistic data
const FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY',
  'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPCHF', 'CHFJPY', 'CADJPY'
];

// Futures contracts for realistic data
const FUTURES_CONTRACTS = [
  'ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'ZB', 'ZN', 'ZF', 'ZN', 'ZT',
  'YC', 'ZW', 'ZS', 'ZC', 'ZL', 'HE', 'LE', 'GF', 'KC', 'CT', 'SB', 'CC'
];

// Emotional states for realistic trading data
const EMOTIONAL_STATES = [
  'Confident', 'Anxious', 'Greedy', 'Fearful', 'Patient', 'Impulsive', 'Disciplined', 'Revenge Trading',
  'Calm', 'Excited', 'Frustrated', 'Overconfident', 'Hesitant', 'Decisive', 'Stressed', 'Focused'
];

// Strategy names for realistic data
const STRATEGY_NAMES = [
  'Momentum Breakout', 'Mean Reversion', 'Trend Following', 'Scalping', 'Swing Trading',
  'Position Trading', 'Day Trading', 'Arbitrage', 'Market Making', 'Statistical Arbitrage',
  'Pairs Trading', 'Options Strategy', 'Futures Spread', 'Carry Trade', 'Breakout Pullback'
];

/**
 * Generate a single realistic mock trade
 */
export const generateMockTrade = (overrides: Partial<MockTrade> = {}): MockTrade => {
  const market = overrides.market || MARKET_TYPES[Math.floor(Math.random() * MARKET_TYPES.length)];
  const side = overrides.side || TRADE_SIDES[Math.floor(Math.random() * TRADE_SIDES.length)];
  
  let symbol = overrides.symbol;
  if (!symbol) {
    switch (market) {
      case 'stock':
        symbol = STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)];
        break;
      case 'crypto':
        symbol = CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)];
        break;
      case 'forex':
        symbol = FOREX_PAIRS[Math.floor(Math.random() * FOREX_PAIRS.length)];
        break;
      case 'futures':
        symbol = FUTURES_CONTRACTS[Math.floor(Math.random() * FUTURES_CONTRACTS.length)];
        break;
    }
  }

  const entryPrice = overrides.entry_price || Math.random() * 1000 + 10;
  const priceMovement = (Math.random() - 0.5) * 0.1; // ±5% price movement
  const exitPrice = overrides.exit_price || entryPrice * (1 + priceMovement);
  const quantity = overrides.quantity || Math.floor(Math.random() * 1000) + 10;
  
  // Calculate P&L based on side and price movement
  let pnl: number;
  if (side === 'Buy') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    pnl = (entryPrice - exitPrice) * quantity;
  }
  
  // Add some randomness to P&L
  pnl = overrides.pnl || pnl * (0.8 + Math.random() * 0.4);

  // Generate a random date within the last 2 years
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));
  const tradeDate = new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));

  const strategyId = `strategy-${Math.floor(Math.random() * 50) + 1}`;
  const strategy = STRATEGY_NAMES[Math.floor(Math.random() * STRATEGY_NAMES.length)];
  const emotionalState = EMOTIONAL_STATES[Math.floor(Math.random() * EMOTIONAL_STATES.length)];

  return {
    id: overrides.id || `trade-${Math.random().toString(36).substr(2, 9)}`,
    user_id: overrides.user_id || 'test-user-123',
    symbol: symbol || 'AAPL',
    market: market || 'stock',
    side: side || 'Buy',
    entry_price: Math.round(entryPrice * 100) / 100,
    exit_price: Math.round(exitPrice * 100) / 100,
    quantity,
    pnl: Math.round(pnl * 100) / 100,
    trade_date: overrides.trade_date || tradeDate.toISOString().split('T')[0],
    strategy_id: overrides.strategy_id || strategyId,
    strategy: overrides.strategy || strategy,
    emotional_state: overrides.emotional_state || emotionalState,
    notes: overrides.notes || `Test trade notes for ${symbol || 'AAPL'}`,
    created_at: overrides.created_at || tradeDate.toISOString(),
    updated_at: overrides.updated_at || tradeDate.toISOString(),
    ...overrides,
  };
};

/**
 * Generate multiple realistic mock trades with diverse characteristics
 */
export const generateMockTrades = (count: number, options: {
  userId?: string;
  dateRange?: { start: Date; end: Date };
  markets?: Array<'stock' | 'crypto' | 'forex' | 'futures'>;
  pnlDistribution?: { profitable: number; lossable: number };
} = {}): MockTrade[] => {
  const {
    userId = 'test-user-123',
    dateRange,
    markets = MARKET_TYPES,
    pnlDistribution = { profitable: 0.6, lossable: 0.4 }
  } = options;

  return Array.from({ length: count }, (_, index) => {
    const isProfitable = Math.random() < pnlDistribution.profitable;
    const market = markets[Math.floor(Math.random() * markets.length)];
    
    let tradeDate: Date;
    if (dateRange) {
      tradeDate = new Date(
        dateRange.start.getTime() +
        Math.random() * (dateRange.end.getTime() - dateRange.start.getTime())
      );
    } else {
      const now = new Date();
      const twoYearsAgo = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));
      tradeDate = new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));
    }

    // Generate P&L based on profitability requirement
    let pnl: number;
    if (isProfitable) {
      pnl = Math.random() * 5000 + 50; // $50 to $5000 profit
    } else {
      pnl = -(Math.random() * 3000 + 50); // -$50 to -$3000 loss
    }

    return generateMockTrade({
      id: `trade-${index + 1}`,
      user_id: userId,
      market,
      pnl,
      trade_date: tradeDate.toISOString().split('T')[0],
      created_at: tradeDate.toISOString(),
      updated_at: tradeDate.toISOString(),
    });
  });
};

/**
 * Generate a single realistic mock strategy
 */
export const generateMockStrategy = (overrides: Partial<MockStrategy> = {}): MockStrategy => {
  const totalTrades = overrides.total_trades || Math.floor(Math.random() * 500) + 10;
  const winRate = overrides.win_rate || Math.random() * 0.4 + 0.4; // 40% to 80% win rate
  const avgWin = Math.random() * 1000 + 100; // $100 to $1100 average win
  const avgLoss = Math.random() * 500 + 50; // $50 to $550 average loss
  const wins = Math.floor(totalTrades * winRate);
  const losses = totalTrades - wins;
  const totalPnl = (wins * avgWin) - (losses * avgLoss);

  const now = new Date();
  const created = new Date(now.getTime() - Math.random() * (365 * 24 * 60 * 60 * 1000));

  return {
    id: overrides.id || `strategy-${Math.random().toString(36).substr(2, 9)}`,
    user_id: overrides.user_id || 'test-user-123',
    name: overrides.name || STRATEGY_NAMES[Math.floor(Math.random() * STRATEGY_NAMES.length)],
    description: overrides.description || `Test strategy description`,
    is_active: overrides.is_active !== undefined ? overrides.is_active : Math.random() > 0.3,
    total_trades: totalTrades,
    win_rate: Math.round(winRate * 100) / 100,
    total_pnl: Math.round(totalPnl * 100) / 100,
    created_at: overrides.created_at || created.toISOString(),
    updated_at: overrides.updated_at || now.toISOString(),
    ...overrides,
  };
};

/**
 * Generate multiple realistic mock strategies
 */
export const generateMockStrategies = (count: number, userId: string = 'test-user-123'): MockStrategy[] => {
  return Array.from({ length: count }, (_, index) =>
    generateMockStrategy({
      id: `strategy-${index + 1}`,
      user_id: userId,
      name: `${STRATEGY_NAMES[index % STRATEGY_NAMES.length]} ${index + 1}`,
    })
  );
};

/**
 * Generate trades specifically for filtering tests
 */
export const generateTradesForFiltering = (): MockTrade[] => {
  const baseDate = new Date('2023-01-01');
  return [
    // Profitable trades
    generateMockTrade({
      id: 'profit-1',
      symbol: 'AAPL',
      market: 'stock',
      side: 'Buy',
      pnl: 1500,
      trade_date: '2023-01-15',
      strategy: 'Momentum Breakout',
      emotional_state: 'Confident',
    }),
    generateMockTrade({
      id: 'profit-2',
      symbol: 'BTC',
      market: 'crypto',
      side: 'Buy',
      pnl: 2500,
      trade_date: '2023-02-20',
      strategy: 'Trend Following',
      emotional_state: 'Patient',
    }),
    generateMockTrade({
      id: 'profit-3',
      symbol: 'EURUSD',
      market: 'forex',
      side: 'Sell',
      pnl: 800,
      trade_date: '2023-03-10',
      strategy: 'Mean Reversion',
      emotional_state: 'Disciplined',
    }),
    
    // Lossable trades
    generateMockTrade({
      id: 'loss-1',
      symbol: 'TSLA',
      market: 'stock',
      side: 'Buy',
      pnl: -750,
      trade_date: '2023-04-05',
      strategy: 'Scalping',
      emotional_state: 'Impulsive',
    }),
    generateMockTrade({
      id: 'loss-2',
      symbol: 'ETH',
      market: 'crypto',
      side: 'Sell',
      pnl: -1200,
      trade_date: '2023-05-12',
      strategy: 'Day Trading',
      emotional_state: 'Fearful',
    }),
    
    // Mixed scenarios
    generateMockTrade({
      id: 'mixed-1',
      symbol: 'ES',
      market: 'futures',
      side: 'Buy',
      pnl: 3000,
      trade_date: '2023-06-18',
      strategy: 'Breakout Pullback',
      emotional_state: 'Focused',
    }),
    generateMockTrade({
      id: 'mixed-2',
      symbol: 'GOOGL',
      market: 'stock',
      side: 'Sell',
      pnl: -500,
      trade_date: '2023-07-22',
      strategy: 'Swing Trading',
      emotional_state: 'Anxious',
    }),
  ];
};

/**
 * Generate strategies specifically for filtering tests
 */
export const generateStrategiesForFiltering = (): MockStrategy[] => {
  return [
    generateMockStrategy({
      id: 'active-1',
      name: 'Active Momentum Strategy',
      is_active: true,
      total_trades: 150,
      win_rate: 0.65,
      total_pnl: 15000,
    }),
    generateMockStrategy({
      id: 'active-2',
      name: 'Active Crypto Strategy',
      is_active: true,
      total_trades: 200,
      win_rate: 0.58,
      total_pnl: 22000,
    }),
    generateMockStrategy({
      id: 'inactive-1',
      name: 'Inactive Forex Strategy',
      is_active: false,
      total_trades: 75,
      win_rate: 0.45,
      total_pnl: -2500,
    }),
    generateMockStrategy({
      id: 'inactive-2',
      name: 'Inactive Futures Strategy',
      is_active: false,
      total_trades: 50,
      win_rate: 0.38,
      total_pnl: -8000,
    }),
  ];
};

/**
 * Generate test data for performance testing (1000+ records)
 */
export const generatePerformanceTestData = (tradeCount: number = 1000): MockTrade[] => {
  return generateMockTrades(tradeCount, {
    dateRange: {
      start: new Date('2022-01-01'),
      end: new Date('2024-12-31'),
    },
    pnlDistribution: {
      profitable: 0.55,
      lossable: 0.45,
    },
  });
};

/**
 * Generate filter options for testing
 */
export const generateTestFilters = {
  // All filters cleared
  empty: {} as TradeFilterOptions,
  
  // Single filter tests
  symbolOnly: { symbol: 'AAPL' } as TradeFilterOptions,
  marketOnly: { market: 'stock' } as TradeFilterOptions,
  sideOnly: { side: 'Buy' } as TradeFilterOptions,
  profitableOnly: { pnlFilter: 'profitable' } as TradeFilterOptions,
  lossableOnly: { pnlFilter: 'lossable' } as TradeFilterOptions,
  
  // Date range filters
  dateRange: {
    dateFrom: '2023-01-01',
    dateTo: '2023-12-31',
  } as TradeFilterOptions,
  
  // Complex filters
  complex: {
    symbol: 'AAPL',
    market: 'stock',
    side: 'Buy',
    pnlFilter: 'profitable',
    dateFrom: '2023-01-01',
    dateTo: '2023-06-30',
    emotionalStates: ['Confident', 'Disciplined'],
    sortBy: 'trade_date',
    sortOrder: 'desc',
  } as TradeFilterOptions,
  
  // Strategy filters
  strategyOnly: { strategyId: 'strategy-1' } as TradeFilterOptions,
  
  // Sorting filters
  sortByDate: { sortBy: 'trade_date', sortOrder: 'desc' } as TradeFilterOptions,
  sortByPnl: { sortBy: 'pnl', sortOrder: 'desc' } as TradeFilterOptions,
  sortBySymbol: { sortBy: 'symbol', sortOrder: 'asc' } as TradeFilterOptions,
};

/**
 * Generate strategy filter options for testing
 */
export const generateTestStrategyFilters = {
  empty: {} as StrategyFilterOptions,
  
  searchOnly: { search: 'Momentum' } as StrategyFilterOptions,
  activeOnly: { isActive: true } as StrategyFilterOptions,
  inactiveOnly: { isActive: false } as StrategyFilterOptions,
  
  performanceRange: {
    performanceMin: 1000,
    performanceMax: 50000,
  } as StrategyFilterOptions,
  
  minTrades: { minTrades: 50 } as StrategyFilterOptions,
  hasRules: { hasRules: true } as StrategyFilterOptions,
  
  complex: {
    search: 'Strategy',
    isActive: true,
    performanceMin: 5000,
    minTrades: 25,
    hasRules: true,
    sortBy: 'total_pnl',
    sortOrder: 'desc',
  } as StrategyFilterOptions,
};