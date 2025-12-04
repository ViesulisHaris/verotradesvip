// Unit tests for filtering logic and utilities
import { 
  generateMockTrades, 
  generateTradesForFiltering,
  generateTestFilters 
} from '../utils/test-data-generators';
import { createMockFilterResponse } from '../utils/mock-helpers';
import { 
  createDefaultTradeFilters,
  TradeFilterOptions,
  MARKET_OPTIONS,
  PNL_FILTER_OPTIONS,
  SIDE_OPTIONS 
} from '@/lib/filtering-types';

// Mock filter function for testing
const applyFilters = (trades: any[], filters: TradeFilterOptions) => {
  return createMockFilterResponse(trades, filters).data;
};

describe('Filtering Logic', () => {
  let mockTrades: any[];

  beforeEach(() => {
    mockTrades = generateTradesForFiltering();
  });

  describe('Default Filters', () => {
    test('should create default trade filters', () => {
      const defaultFilters = createDefaultTradeFilters();
      
      expect(defaultFilters).toEqual({
        symbol: '',
        market: '',
        dateFrom: '',
        dateTo: '',
        pnlFilter: 'all',
        strategyId: '',
        side: '',
        emotionalStates: [],
        sortBy: 'trade_date',
        sortOrder: 'desc',
      });
    });

    test('should return all trades with default filters', () => {
      const defaultFilters = createDefaultTradeFilters();
      const filtered = applyFilters(mockTrades, defaultFilters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Symbol Filtering', () => {
    test('should filter trades by symbol (case insensitive)', () => {
      const filters = { symbol: 'AAPL' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => 
        trade.symbol.toLowerCase().includes('aapl'.toLowerCase())
      )).toBe(true);
    });

    test('should filter trades by partial symbol match', () => {
      const filters = { symbol: 'AA' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => 
        trade.symbol.toLowerCase().includes('aa'.toLowerCase())
      )).toBe(true);
    });

    test('should return empty array for non-matching symbol', () => {
      const filters = { symbol: 'NONEXISTENT' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(0);
    });

    test('should handle empty symbol filter', () => {
      const filters = { symbol: '' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Market Filtering', () => {
    test('should filter trades by market type', () => {
      const filters = { market: 'stock' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.market === 'stock')).toBe(true);
    });

    test('should filter crypto trades', () => {
      const filters = { market: 'crypto' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.market === 'crypto')).toBe(true);
    });

    test('should filter forex trades', () => {
      const filters = { market: 'forex' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.market === 'forex')).toBe(true);
    });

    test('should filter futures trades', () => {
      const filters = { market: 'futures' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.market === 'futures')).toBe(true);
    });

    test('should handle empty market filter', () => {
      const filters = { market: '' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Side Filtering', () => {
    test('should filter buy trades only', () => {
      const filters = { side: 'Buy' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.side === 'Buy')).toBe(true);
    });

    test('should filter sell trades only', () => {
      const filters = { side: 'Sell' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.side === 'Sell')).toBe(true);
    });

    test('should handle empty side filter', () => {
      const filters = { side: '' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('P&L Filtering', () => {
    test('should filter profitable trades only', () => {
      const filters = { pnlFilter: 'profitable' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.pnl > 0)).toBe(true);
    });

    test('should filter lossable trades only', () => {
      const filters = { pnlFilter: 'lossable' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.pnl < 0)).toBe(true);
    });

    test('should return all trades with all P&L filter', () => {
      const filters = { pnlFilter: 'all' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Date Range Filtering', () => {
    test('should filter trades by date from', () => {
      const filters = { dateFrom: '2023-03-01' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.trade_date >= '2023-03-01')).toBe(true);
    });

    test('should filter trades by date to', () => {
      const filters = { dateTo: '2023-05-31' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.trade_date <= '2023-05-31')).toBe(true);
    });

    test('should filter trades by date range', () => {
      const filters = { 
        dateFrom: '2023-02-01',
        dateTo: '2023-04-30'
      };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => 
        trade.trade_date >= '2023-02-01' && 
        trade.trade_date <= '2023-04-30'
      )).toBe(true);
    });

    test('should handle empty date range', () => {
      const filters = { 
        dateFrom: '',
        dateTo: ''
      };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Strategy Filtering', () => {
    test('should filter trades by strategy ID', () => {
      const filters = { strategyId: 'strategy-1' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => trade.strategy_id === 'strategy-1')).toBe(true);
    });

    test('should handle empty strategy filter', () => {
      const filters = { strategyId: '' };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Emotional State Filtering', () => {
    test('should filter trades by single emotional state', () => {
      const filters = { emotionalStates: ['Confident'] };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => 
        trade.emotional_state === 'Confident'
      )).toBe(true);
    });

    test('should filter trades by multiple emotional states', () => {
      const filters = { 
        emotionalStates: ['Confident', 'Disciplined', 'Patient']
      };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => 
        ['Confident', 'Disciplined', 'Patient'].includes(trade.emotional_state)
      )).toBe(true);
    });

    test('should handle empty emotional states', () => {
      const filters = { emotionalStates: [] };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered).toHaveLength(mockTrades.length);
    });
  });

  describe('Complex Filtering', () => {
    test('should apply multiple filters simultaneously', () => {
      const filters = {
        market: 'stock',
        side: 'Buy',
        pnlFilter: 'profitable' as const,
        dateFrom: '2023-01-01',
        dateTo: '2023-06-30',
      };
      const filtered = applyFilters(mockTrades, filters);
      
      expect(filtered.every(trade => 
        trade.market === 'stock' &&
        trade.side === 'Buy' &&
        trade.pnl > 0 &&
        trade.trade_date >= '2023-01-01' &&
        trade.trade_date <= '2023-06-30'
      )).toBe(true);
    });

    test('should handle all possible filter combinations', () => {
      const testCases = [
        { symbol: 'AAPL', market: 'stock' },
        { side: 'Sell', pnlFilter: 'lossable' as const },
        { dateFrom: '2023-01-01', strategyId: 'strategy-1' },
        { market: 'crypto', emotionalStates: ['Confident'] },
        { symbol: 'BTC', side: 'Buy', pnlFilter: 'profitable' as const },
      ];

      testCases.forEach((filters, index) => {
        const filtered = applyFilters(mockTrades, filters);
        expect(filtered).toBeDefined();
        expect(Array.isArray(filtered)).toBe(true);
        expect(filtered.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined filters gracefully', () => {
      const filters = {
        symbol: undefined as any,
        market: null as any,
        side: undefined as any,
        pnlFilter: null as any,
      };
      
      expect(() => applyFilters(mockTrades, filters)).not.toThrow();
    });

    test('should handle empty trades array', () => {
      const filters = { symbol: 'AAPL' };
      const filtered = applyFilters([], filters);
      
      expect(filtered).toHaveLength(0);
      expect(Array.isArray(filtered)).toBe(true);
    });

    test('should handle malformed dates', () => {
      const filters = {
        dateFrom: 'invalid-date',
        dateTo: '2023-12-31',
      };
      
      expect(() => applyFilters(mockTrades, filters)).not.toThrow();
    });

    test('should handle very large filter values', () => {
      const filters = {
        symbol: 'A'.repeat(1000),
        emotionalStates: Array(100).fill('Test'),
      };
      
      expect(() => applyFilters(mockTrades, filters)).not.toThrow();
    });
  });

  describe('Performance with Large Datasets', () => {
    test('should handle large trade datasets efficiently', () => {
      const largeTrades = generateMockTrades(1000);
      const filters = { market: 'stock' };
      
      const startTime = performance.now();
      const filtered = applyFilters(largeTrades, filters);
      const endTime = performance.now();
      
      expect(filtered).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    test('should handle complex filters on large datasets', () => {
      const largeTrades = generateMockTrades(1000);
      const filters = generateTestFilters.complex;
      
      const startTime = performance.now();
      const filtered = applyFilters(largeTrades, filters);
      const endTime = performance.now();
      
      expect(filtered).toBeDefined();
      expect(endTime - startTime).toBeLessThan(200); // Should complete in <200ms
    });
  });

  describe('Filter Validation', () => {
    test('should validate market filter values', () => {
      const validMarkets = MARKET_OPTIONS.map(option => option.value);
      const invalidMarket = 'invalid-market';
      
      expect(validMarkets).toContain('');
      expect(validMarkets).toContain('stock');
      expect(validMarkets).toContain('crypto');
      expect(validMarkets).toContain('forex');
      expect(validMarkets).toContain('futures');
      expect(validMarkets).not.toContain(invalidMarket);
    });

    test('should validate P&L filter values', () => {
      const validPnLFilters = PNL_FILTER_OPTIONS.map(option => option.value);
      
      expect(validPnLFilters).toContain('all');
      expect(validPnLFilters).toContain('profitable');
      expect(validPnLFilters).toContain('lossable');
    });

    test('should validate side filter values', () => {
      const validSides = SIDE_OPTIONS.map(option => option.value);
      
      expect(validSides).toContain('');
      expect(validSides).toContain('Buy');
      expect(validSides).toContain('Sell');
    });
  });

  describe('Filter Statistics', () => {
    test('should calculate correct filter statistics', () => {
      const filters = {
        symbol: 'AAPL',
        market: 'stock',
        pnlFilter: 'profitable' as const,
      };
      
      const filtered = applyFilters(mockTrades, filters);
      const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }).length;
      
      expect(activeFilterCount).toBe(3);
      expect(filtered.length).toBeLessThanOrEqual(mockTrades.length);
    });

    test('should detect when no filters are active', () => {
      const filters = createDefaultTradeFilters();
      const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }).length;
      
      expect(activeFilterCount).toBe(0);
    });
  });
});