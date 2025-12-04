// Unit tests for sorting logic and utilities
import { 
  generateMockTrades, 
  generatePerformanceTestData 
} from '../utils/test-data-generators';
import { 
  TRADE_SORT_OPTIONS,
  STRATEGY_SORT_OPTIONS,
  SortConfig 
} from '@/lib/filtering-types';

// Mock sorting function for testing
const applySorting = (trades: any[], sortBy: string, sortOrder: 'asc' | 'desc') => {
  const sorted = [...trades];
  
  if (sortBy) {
    sorted.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }
  
  return sorted;
};

describe('Sorting Logic', () => {
  let mockTrades: any[];

  beforeEach(() => {
    mockTrades = generateMockTrades(50);
  });

  describe('Sort Options Validation', () => {
    test('should have correct trade sort options', () => {
      expect(TRADE_SORT_OPTIONS).toHaveLength(10);
      
      // Check for required sort fields
      const sortFields = TRADE_SORT_OPTIONS.map(option => option.field);
      expect(sortFields).toContain('trade_date');
      expect(sortFields).toContain('symbol');
      expect(sortFields).toContain('pnl');
      expect(sortFields).toContain('entry_price');
      expect(sortFields).toContain('quantity');
    });

    test('should have correct strategy sort options', () => {
      expect(STRATEGY_SORT_OPTIONS).toHaveLength(10);
      
      // Check for required sort fields
      const sortFields = STRATEGY_SORT_OPTIONS.map(option => option.field);
      expect(sortFields).toContain('name');
      expect(sortFields).toContain('created_at');
      expect(sortFields).toContain('total_trades');
      expect(sortFields).toContain('win_rate');
      expect(sortFields).toContain('total_pnl');
    });

    test('should have both ascending and descending options', () => {
      const allTradeOptions = [...TRADE_SORT_OPTIONS];
      const ascendingOptions = allTradeOptions.filter(option => option.direction === 'asc');
      const descendingOptions = allTradeOptions.filter(option => option.direction === 'desc');
      
      expect(ascendingOptions.length).toBeGreaterThan(0);
      expect(descendingOptions.length).toBeGreaterThan(0);
      
      // Check that each field has both directions
      const fields = new Set(allTradeOptions.map(option => option.field));
      fields.forEach(field => {
        const fieldOptions = allTradeOptions.filter(option => option.field === field);
        expect(fieldOptions).toHaveLength(2); // Should have both asc and desc
      });
    });
  });

  describe('Date Sorting', () => {
    test('should sort by trade date ascending', () => {
      const sorted = applySorting(mockTrades, 'trade_date', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].trade_date >= sorted[i - 1].trade_date).toBe(true);
      }
    });

    test('should sort by trade date descending', () => {
      const sorted = applySorting(mockTrades, 'trade_date', 'desc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].trade_date <= sorted[i - 1].trade_date).toBe(true);
      }
    });

    test('should handle same dates gracefully', () => {
      const tradesWithSameDate = [
        { trade_date: '2023-01-01', symbol: 'A' },
        { trade_date: '2023-01-01', symbol: 'B' },
        { trade_date: '2023-01-01', symbol: 'C' },
      ];
      
      const sorted = applySorting(tradesWithSameDate, 'trade_date', 'asc');
      
      expect(sorted).toHaveLength(3);
      expect(sorted.map(t => t.trade_date)).toEqual(['2023-01-01', '2023-01-01', '2023-01-01']);
    });
  });

  describe('Symbol Sorting', () => {
    test('should sort by symbol ascending', () => {
      const sorted = applySorting(mockTrades, 'symbol', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].symbol.toLowerCase() >= sorted[i - 1].symbol.toLowerCase()).toBe(true);
      }
    });

    test('should sort by symbol descending', () => {
      const sorted = applySorting(mockTrades, 'symbol', 'desc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].symbol.toLowerCase() <= sorted[i - 1].symbol.toLowerCase()).toBe(true);
      }
    });

    test('should be case insensitive', () => {
      const mixedCaseTrades = [
        { symbol: 'AAPL', pnl: 100 },
        { symbol: 'aapl', pnl: 200 },
        { symbol: 'GOOGL', pnl: 150 },
        { symbol: 'googl', pnl: 250 },
      ];
      
      const sortedAsc = applySorting(mixedCaseTrades, 'symbol', 'asc');
      const sortedDesc = applySorting(mixedCaseTrades, 'symbol', 'desc');
      
      // Should group same symbols together regardless of case
      expect(sortedAsc[0].symbol.toLowerCase()).toBe(sortedAsc[1].symbol.toLowerCase());
      expect(sortedDesc[0].symbol.toLowerCase()).toBe(sortedDesc[1].symbol.toLowerCase());
    });
  });

  describe('P&L Sorting', () => {
    test('should sort by P&L ascending', () => {
      const sorted = applySorting(mockTrades, 'pnl', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].pnl >= sorted[i - 1].pnl).toBe(true);
      }
    });

    test('should sort by P&L descending', () => {
      const sorted = applySorting(mockTrades, 'pnl', 'desc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].pnl <= sorted[i - 1].pnl).toBe(true);
      }
    });

    test('should handle negative P&L values', () => {
      const tradesWithLosses = [
        { pnl: -1000, symbol: 'A' },
        { pnl: 500, symbol: 'B' },
        { pnl: -200, symbol: 'C' },
        { pnl: 1000, symbol: 'D' },
      ];
      
      const sortedAsc = applySorting(tradesWithLosses, 'pnl', 'asc');
      const sortedDesc = applySorting(tradesWithLosses, 'pnl', 'desc');
      
      expect(sortedAsc.map(t => t.pnl)).toEqual([-1000, -200, 500, 1000]);
      expect(sortedDesc.map(t => t.pnl)).toEqual([1000, 500, -200, -1000]);
    });
  });

  describe('Price Sorting', () => {
    test('should sort by entry price ascending', () => {
      const sorted = applySorting(mockTrades, 'entry_price', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].entry_price >= sorted[i - 1].entry_price).toBe(true);
      }
    });

    test('should sort by entry price descending', () => {
      const sorted = applySorting(mockTrades, 'entry_price', 'desc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].entry_price <= sorted[i - 1].entry_price).toBe(true);
      }
    });

    test('should handle decimal prices correctly', () => {
      const tradesWithDecimals = [
        { entry_price: 100.25, symbol: 'A' },
        { entry_price: 100.125, symbol: 'B' },
        { entry_price: 100.5, symbol: 'C' },
        { entry_price: 100.375, symbol: 'D' },
      ];
      
      const sorted = applySorting(tradesWithDecimals, 'entry_price', 'asc');
      
      expect(sorted.map(t => t.entry_price)).toEqual([100.125, 100.25, 100.375, 100.5]);
    });
  });

  describe('Quantity Sorting', () => {
    test('should sort by quantity ascending', () => {
      const sorted = applySorting(mockTrades, 'quantity', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].quantity >= sorted[i - 1].quantity).toBe(true);
      }
    });

    test('should sort by quantity descending', () => {
      const sorted = applySorting(mockTrades, 'quantity', 'desc');
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].quantity <= sorted[i - 1].quantity).toBe(true);
      }
    });

    test('should handle zero quantities', () => {
      const tradesWithZeros = [
        { quantity: 0, symbol: 'A' },
        { quantity: 100, symbol: 'B' },
        { quantity: 0, symbol: 'C' },
        { quantity: 50, symbol: 'D' },
      ];
      
      const sorted = applySorting(tradesWithZeros, 'quantity', 'asc');
      
      expect(sorted.map(t => t.quantity)).toEqual([0, 0, 50, 100]);
    });
  });

  describe('Strategy Sorting', () => {
    test('should sort by strategy name ascending', () => {
      const sorted = applySorting(mockTrades, 'strategy', 'asc');
      
      for (let i = 1; i < sorted.length; i++) {
        const currentName = (sorted[i].strategy || '').toLowerCase();
        const previousName = (sorted[i - 1].strategy || '').toLowerCase();
        expect(currentName >= previousName).toBe(true);
      }
    });

    test('should sort by strategy name descending', () => {
      const sorted = applySorting(mockTrades, 'strategy', 'desc');
      
      for (let i = 1; i < sorted.length; i++) {
        const currentName = (sorted[i].strategy || '').toLowerCase();
        const previousName = (sorted[i - 1].strategy || '').toLowerCase();
        expect(currentName <= previousName).toBe(true);
      }
    });

    test('should handle null/undefined strategy names', () => {
      const tradesWithNullStrategies = [
        { strategy: null, symbol: 'A' },
        { strategy: undefined, symbol: 'B' },
        { strategy: 'Strategy C', symbol: 'C' },
        { strategy: '', symbol: 'D' },
      ];
      
      const sorted = applySorting(tradesWithNullStrategies, 'strategy', 'asc');
      
      // Null/undefined should be treated as empty strings and come first
      expect(sorted[0].strategy || '').toBe('');
      expect(sorted[1].strategy || '').toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty array', () => {
      const sorted = applySorting([], 'symbol', 'asc');
      
      expect(sorted).toHaveLength(0);
      expect(Array.isArray(sorted)).toBe(true);
    });

    test('should handle single item array', () => {
      const singleTrade = [{ symbol: 'AAPL', pnl: 100 }];
      const sorted = applySorting(singleTrade, 'symbol', 'asc');
      
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toEqual(singleTrade[0]);
    });

    test('should handle missing sort field', () => {
      const tradesWithoutField = [{ symbol: 'AAPL' }, { symbol: 'GOOGL' }];
      const sorted = applySorting(tradesWithoutField, 'nonexistent_field', 'asc');
      
      expect(sorted).toHaveLength(2);
      expect(sorted[0]).toEqual(tradesWithoutField[0]);
      expect(sorted[1]).toEqual(tradesWithoutField[1]);
    });

    test('should handle mixed data types', () => {
      const mixedData = [
        { symbol: 'AAPL', pnl: '100' }, // String number
        { symbol: 'GOOGL', pnl: 200 }, // Actual number
        { symbol: 'MSFT', pnl: null }, // Null
        { symbol: 'TSLA', pnl: undefined }, // Undefined
      ];
      
      expect(() => applySorting(mixedData, 'pnl', 'asc')).not.toThrow();
    });
  });

  describe('Performance with Large Datasets', () => {
    test('should sort large datasets efficiently', () => {
      const largeTrades = generatePerformanceTestData().large;
      
      const startTime = performance.now();
      const sorted = applySorting(largeTrades, 'symbol', 'asc');
      const endTime = performance.now();
      
      expect(sorted).toHaveLength(largeTrades.length);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
    });

    test('should handle multiple sort operations efficiently', () => {
      const largeTrades = generatePerformanceTestData().large;
      
      const startTime = performance.now();
      
      // Perform multiple sort operations
      applySorting(largeTrades, 'symbol', 'asc');
      applySorting(largeTrades, 'pnl', 'desc');
      applySorting(largeTrades, 'trade_date', 'desc');
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(150); // Should complete in <150ms
    });
  });

  describe('Sort Stability', () => {
    test('should maintain stable sort for equal values', () => {
      const tradesWithEqualValues = [
        { symbol: 'AAPL', pnl: 100, trade_date: '2023-01-01' },
        { symbol: 'GOOGL', pnl: 100, trade_date: '2023-01-02' },
        { symbol: 'MSFT', pnl: 100, trade_date: '2023-01-03' },
      ];
      
      const sorted = applySorting(tradesWithEqualValues, 'pnl', 'asc');
      
      // Should maintain original order for equal values
      expect(sorted[0].trade_date).toBe('2023-01-01');
      expect(sorted[1].trade_date).toBe('2023-01-02');
      expect(sorted[2].trade_date).toBe('2023-01-03');
    });

    test('should handle repeated sorting operations', () => {
      let sorted = applySorting(mockTrades, 'symbol', 'asc');
      const firstSort = [...sorted];
      
      // Sort the same array multiple times
      sorted = applySorting(sorted, 'symbol', 'asc');
      sorted = applySorting(sorted, 'symbol', 'asc');
      
      expect(sorted).toEqual(firstSort);
    });
  });

  describe('Sort Configuration', () => {
    test('should validate sort configuration structure', () => {
      const validConfig: SortConfig = {
        field: 'symbol',
        direction: 'asc',
        label: 'Symbol (A-Z)',
      };
      
      expect(validConfig.field).toBeDefined();
      expect(validConfig.direction).toBeDefined();
      expect(validConfig.label).toBeDefined();
      expect(['asc', 'desc']).toContain(validConfig.direction);
    });

    test('should handle all trade sort configurations', () => {
      TRADE_SORT_OPTIONS.forEach(config => {
        expect(config.field).toBeDefined();
        expect(config.direction).toBeDefined();
        expect(config.label).toBeDefined();
        expect(['asc', 'desc']).toContain(config.direction);
      });
    });

    test('should handle all strategy sort configurations', () => {
      STRATEGY_SORT_OPTIONS.forEach(config => {
        expect(config.field).toBeDefined();
        expect(config.direction).toBeDefined();
        expect(config.label).toBeDefined();
        expect(['asc', 'desc']).toContain(config.direction);
      });
    });
  });

  describe('Integration with Filtering', () => {
    test('should work correctly with filtered data', () => {
      const filteredTrades = mockTrades.filter(trade => trade.pnl > 0); // Only profitable trades
      
      const sorted = applySorting(filteredTrades, 'symbol', 'asc');
      
      expect(sorted.every(trade => trade.pnl > 0)).toBe(true);
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].symbol.toLowerCase() >= sorted[i - 1].symbol.toLowerCase()).toBe(true);
      }
    });

    test('should maintain filter results when sorting', () => {
      const filters = {
        market: 'stock',
        pnlFilter: 'profitable' as const,
      };
      
      // Simulate filtering first
      const filtered = mockTrades.filter(trade => 
        trade.market === 'stock' && trade.pnl > 0
      );
      
      // Then sort
      const sorted = applySorting(filtered, 'trade_date', 'desc');
      
      expect(sorted.every(trade => 
        trade.market === 'stock' && trade.pnl > 0
      )).toBe(true);
    });
  });
});