// Unit tests for URL synchronization functionality
import {
  parseURLParams,
  updateURLParams,
  debouncedURLUpdate,
  initializeFromURL,
  getURLParam,
  setURLParam,
  clearURLParams,
  createShareableURL,
  validateURLParam,
  getSortURLParams,
  updateSortURLParams,
  clearSortURLParams,
  createSortableURL,
  getFilterStateForBookmark,
  applyBookmarkedFilterState,
} from '@/lib/url-sync';
import { createDefaultTradeFilters } from '@/lib/filtering-types';

// Mock window.location for testing
const mockLocation = {
  href: 'http://localhost:3000/trades',
  origin: 'http://localhost:3000',
  pathname: '/trades',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock URLSearchParams
const mockURLSearchParams = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  toString: jest.fn(() => ''),
};

describe('URL Synchronization', () => {
  beforeEach(() => {
    // Reset mocks
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    
    global.URLSearchParams = jest.fn(() => mockURLSearchParams) as any;
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('parseURLParams', () => {
    test('should parse empty URL parameters', () => {
      mockLocation.search = '';
      mockURLSearchParams.get.mockReturnValue(null);
      
      const result = parseURLParams();
      
      expect(result).toEqual({});
      expect(mockURLSearchParams.get).toHaveBeenCalledTimes(10); // Should check all params
    });

    test('should parse single URL parameter', () => {
      mockLocation.search = '?symbol=AAPL';
      mockURLSearchParams.get.mockImplementation((key) => {
        if (key === 'symbol') return 'AAPL';
        return null;
      });
      
      const result = parseURLParams();
      
      expect(result).toEqual({ symbol: 'AAPL' });
    });

    test('should parse multiple URL parameters', () => {
      mockLocation.search = '?symbol=AAPL&market=stock&pnlFilter=profitable';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string> = {
          symbol: 'AAPL',
          market: 'stock',
          pnlFilter: 'profitable',
        };
        return params[key] || null;
      });
      
      const result = parseURLParams();
      
      expect(result).toEqual({
        symbol: 'AAPL',
        market: 'stock',
        pnlFilter: 'profitable',
      });
    });

    test('should parse emotional states as array', () => {
      mockLocation.search = '?emotionalStates=Confident,Disciplined,Anxious';
      mockURLSearchParams.get.mockImplementation((key) => {
        if (key === 'emotionalStates') return 'Confident,Disciplined,Anxious';
        return null;
      });
      
      const result = parseURLParams();
      
      expect(result).toEqual({
        emotionalStates: ['Confident', 'Disciplined', 'Anxious'],
      });
    });

    test('should validate pnlFilter values', () => {
      mockLocation.search = '?pnlFilter=invalid';
      mockURLSearchParams.get.mockImplementation((key) => {
        if (key === 'pnlFilter') return 'invalid';
        return null;
      });
      
      const result = parseURLParams();
      
      expect(result).not.toHaveProperty('pnlFilter');
    });

    test('should validate side values', () => {
      mockLocation.search = '?side=invalid';
      mockURLSearchParams.get.mockImplementation((key) => {
        if (key === 'side') return 'invalid';
        return null;
      });
      
      const result = parseURLParams();
      
      expect(result).not.toHaveProperty('side');
    });

    test('should validate market values', () => {
      mockLocation.search = '?market=invalid';
      mockURLSearchParams.get.mockImplementation((key) => {
        if (key === 'market') return 'invalid';
        return null;
      });
      
      const result = parseURLParams();
      
      expect(result).not.toHaveProperty('market');
    });

    test('should handle SSR environment', () => {
      // Mock SSR environment
      const originalWindow = global.window;
      delete (global as any).window;
      
      const result = parseURLParams();
      
      expect(result).toEqual({});
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('updateURLParams', () => {
    test('should update URL with single parameter', () => {
      const filters = { symbol: 'AAPL' };
      mockURLSearchParams.toString.mockReturnValue('symbol=AAPL');
      mockLocation.replace = jest.fn();
      
      updateURLParams(filters);
      
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('symbol', 'AAPL');
      expect(mockLocation.replace).toHaveBeenCalledWith(
        'http://localhost:3000/trades?symbol=AAPL'
      );
    });

    test('should update URL with multiple parameters', () => {
      const filters = {
        symbol: 'AAPL',
        market: 'stock',
        pnlFilter: 'profitable' as const,
      };
      mockURLSearchParams.toString.mockReturnValue('symbol=AAPL&market=stock&pnlFilter=profitable');
      mockLocation.replace = jest.fn();
      
      updateURLParams(filters);
      
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('symbol', 'AAPL');
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('market', 'stock');
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('pnlFilter', 'profitable');
      expect(mockLocation.replace).toHaveBeenCalledWith(
        'http://localhost:3000/trades?symbol=AAPL&market=stock&pnlFilter=profitable'
      );
    });

    test('should handle emotional states array', () => {
      const filters = {
        emotionalStates: ['Confident', 'Disciplined'],
      };
      mockURLSearchParams.toString.mockReturnValue('emotionalStates=Confident,Disciplined');
      mockLocation.replace = jest.fn();
      
      updateURLParams(filters);
      
      expect(mockURLSearchParams.set).toHaveBeenCalledWith(
        'emotionalStates',
        'Confident,Disciplined'
      );
    });

    test('should remove empty parameters', () => {
      const filters = {
        symbol: '',
        market: 'stock',
      };
      mockURLSearchParams.toString.mockReturnValue('market=stock');
      mockLocation.replace = jest.fn();
      
      updateURLParams(filters);
      
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('symbol');
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('market', 'stock');
    });

    test('should handle SSR environment', () => {
      const filters = { symbol: 'AAPL' };
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => updateURLParams(filters)).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('debouncedURLUpdate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce URL updates', () => {
      const filters = { symbol: 'AAPL' };
      mockLocation.replace = jest.fn();
      
      const debouncedFn = debouncedURLUpdate(filters, 100);
      debouncedFn();
      
      // Should not update immediately
      expect(mockLocation.replace).not.toHaveBeenCalled();
      
      // Should update after delay
      jest.advanceTimersByTime(100);
      expect(mockLocation.replace).toHaveBeenCalled();
    });

    test('should cancel previous debounce', () => {
      const filters1 = { symbol: 'AAPL' };
      const filters2 = { symbol: 'GOOGL' };
      mockLocation.replace = jest.fn();
      
      const debouncedFn = debouncedURLUpdate(filters1, 100);
      debouncedFn();
      debouncedFn(); // Call with different filters
      
      jest.advanceTimersByTime(100);
      
      // Should only update with latest filters
      expect(mockLocation.replace).toHaveBeenCalledTimes(1);
      expect(mockURLSearchParams.set).toHaveBeenLastCalledWith('symbol', 'GOOGL');
    });

    test('should use default delay', () => {
      const filters = { symbol: 'AAPL' };
      mockLocation.replace = jest.fn();
      
      const debouncedFn = debouncedURLUpdate(filters);
      debouncedFn();
      
      jest.advanceTimersByTime(500); // Default delay
      
      expect(mockLocation.replace).toHaveBeenCalled();
    });
  });

  describe('initializeFromURL', () => {
    test('should initialize filters from URL parameters', () => {
      mockLocation.search = '?symbol=AAPL&market=stock';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string> = {
          symbol: 'AAPL',
          market: 'stock',
        };
        return params[key] || null;
      });
      
      const result = initializeFromURL();
      
      expect(result).toEqual({
        ...createDefaultTradeFilters(),
        symbol: 'AAPL',
        market: 'stock',
      });
    });

    test('should return default filters when URL is empty', () => {
      mockLocation.search = '';
      mockURLSearchParams.get.mockReturnValue(null);
      
      const result = initializeFromURL();
      
      expect(result).toEqual(createDefaultTradeFilters());
    });

    test('should merge URL params with defaults', () => {
      mockLocation.search = '?symbol=AAPL';
      mockURLSearchParams.get.mockImplementation((key) => {
        if (key === 'symbol') return 'AAPL';
        return null;
      });
      
      const result = initializeFromURL();
      
      expect(result.symbol).toBe('AAPL');
      expect(result.market).toBe(createDefaultTradeFilters().market);
      expect(result.sortBy).toBe(createDefaultTradeFilters().sortBy);
    });
  });

  describe('getURLParam', () => {
    test('should get specific URL parameter', () => {
      mockURLSearchParams.get.mockReturnValue('AAPL');
      
      const result = getURLParam('symbol');
      
      expect(result).toBe('AAPL');
      expect(mockURLSearchParams.get).toHaveBeenCalledWith('symbol');
    });

    test('should return null for missing parameter', () => {
      mockURLSearchParams.get.mockReturnValue(null);
      
      const result = getURLParam('symbol');
      
      expect(result).toBeNull();
    });

    test('should handle SSR environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const result = getURLParam('symbol');
      
      expect(result).toBeNull();
      
      global.window = originalWindow;
    });
  });

  describe('setURLParam', () => {
    test('should set specific URL parameter', () => {
      mockURLSearchParams.toString.mockReturnValue('symbol=AAPL');
      mockLocation.replace = jest.fn();
      
      setURLParam('symbol', 'AAPL');
      
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('symbol', 'AAPL');
      expect(mockLocation.replace).toHaveBeenCalledWith(
        'http://localhost:3000/trades?symbol=AAPL'
      );
    });

    test('should remove parameter when value is null', () => {
      mockURLSearchParams.toString.mockReturnValue('');
      mockLocation.replace = jest.fn();
      
      setURLParam('symbol', null);
      
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('symbol');
      expect(mockLocation.replace).toHaveBeenCalledWith('http://localhost:3000/trades');
    });

    test('should handle array values', () => {
      mockURLSearchParams.toString.mockReturnValue('emotionalStates=Confident,Disciplined');
      mockLocation.replace = jest.fn();
      
      setURLParam('emotionalStates', ['Confident', 'Disciplined']);
      
      expect(mockURLSearchParams.set).toHaveBeenCalledWith(
        'emotionalStates',
        'Confident,Disciplined'
      );
    });
  });

  describe('clearURLParams', () => {
    test('should clear all filter parameters', () => {
      mockURLSearchParams.toString.mockReturnValue('');
      mockLocation.replace = jest.fn();
      
      clearURLParams();
      
      // Should delete all filter-related parameters
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('symbol');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('market');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('dateFrom');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('dateTo');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('pnlFilter');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('strategyId');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('side');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('emotionalStates');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('sortBy');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('sortOrder');
      
      expect(mockLocation.replace).toHaveBeenCalledWith('http://localhost:3000/trades');
    });
  });

  describe('createShareableURL', () => {
    test('should create URL with filter parameters', () => {
      const filters = {
        symbol: 'AAPL',
        market: 'stock',
        pnlFilter: 'profitable' as const,
      };
      
      const result = createShareableURL(filters);
      
      expect(result).toBe('http://localhost:3000/trades?symbol=AAPL&market=stock&pnlFilter=profitable');
    });

    test('should handle empty filters', () => {
      const filters = {};
      
      const result = createShareableURL(filters);
      
      expect(result).toBe('http://localhost:3000/trades');
    });

    test('should handle SSR environment', () => {
      const filters = { symbol: 'AAPL' };
      const originalWindow = global.window;
      delete (global as any).window;
      
      const result = createShareableURL(filters);
      
      expect(result).toBe('');
      
      global.window = originalWindow;
    });
  });

  describe('validateURLParam', () => {
    test('should validate pnlFilter parameter', () => {
      expect(validateURLParam('pnlFilter', 'all')).toBe(true);
      expect(validateURLParam('pnlFilter', 'profitable')).toBe(true);
      expect(validateURLParam('pnlFilter', 'lossable')).toBe(true);
      expect(validateURLParam('pnlFilter', 'invalid')).toBe(false);
    });

    test('should validate side parameter', () => {
      expect(validateURLParam('side', 'Buy')).toBe(true);
      expect(validateURLParam('side', 'Sell')).toBe(true);
      expect(validateURLParam('side', '')).toBe(true);
      expect(validateURLParam('side', 'invalid')).toBe(false);
    });

    test('should validate market parameter', () => {
      expect(validateURLParam('market', 'stock')).toBe(true);
      expect(validateURLParam('market', 'crypto')).toBe(true);
      expect(validateURLParam('market', 'forex')).toBe(true);
      expect(validateURLParam('market', 'futures')).toBe(true);
      expect(validateURLParam('market', '')).toBe(true);
      expect(validateURLParam('market', 'invalid')).toBe(false);
    });

    test('should validate sortBy parameter', () => {
      expect(validateURLParam('sortBy', 'trade_date')).toBe(true);
      expect(validateURLParam('sortBy', 'symbol')).toBe(true);
      expect(validateURLParam('sortBy', 'pnl')).toBe(true);
      expect(validateURLParam('sortBy', 'invalid')).toBe(false);
    });

    test('should validate sortOrder parameter', () => {
      expect(validateURLParam('sortOrder', 'asc')).toBe(true);
      expect(validateURLParam('sortOrder', 'desc')).toBe(true);
      expect(validateURLParam('sortOrder', 'invalid')).toBe(false);
    });
  });

  describe('Sort URL Operations', () => {
    test('should get sort URL parameters', () => {
      mockLocation.search = '?sortBy=symbol&sortOrder=asc';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string> = {
          sortBy: 'symbol',
          sortOrder: 'asc',
        };
        return params[key] || null;
      });
      
      const result = getSortURLParams();
      
      expect(result).toEqual({
        sortBy: 'symbol',
        sortOrder: 'asc',
      });
    });

    test('should update sort URL parameters', () => {
      mockURLSearchParams.toString.mockReturnValue('sortBy=symbol&sortOrder=asc');
      mockLocation.replace = jest.fn();
      
      updateSortURLParams('symbol', 'asc');
      
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('sortBy', 'symbol');
      expect(mockURLSearchParams.set).toHaveBeenCalledWith('sortOrder', 'asc');
      expect(mockLocation.replace).toHaveBeenCalledWith(
        'http://localhost:3000/trades?sortBy=symbol&sortOrder=asc'
      );
    });

    test('should clear sort URL parameters', () => {
      mockURLSearchParams.toString.mockReturnValue('');
      mockLocation.replace = jest.fn();
      
      clearSortURLParams();
      
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('sortBy');
      expect(mockURLSearchParams.delete).toHaveBeenCalledWith('sortOrder');
      expect(mockLocation.replace).toHaveBeenCalledWith('http://localhost:3000/trades');
    });

    test('should create sortable URL', () => {
      const filters = {
        symbol: 'AAPL',
        market: 'stock',
      };
      
      const result = createSortableURL(filters, 'symbol', 'asc');
      
      expect(result).toBe('http://localhost:3000/trades?symbol=AAPL&market=stock&sortBy=symbol&sortOrder=asc');
    });
  });

  describe('Bookmarking Functionality', () => {
    test('should get filter state for bookmarking', () => {
      mockLocation.search = '?symbol=AAPL&market=stock&pnlFilter=profitable';
      
      const result = getFilterStateForBookmark();
      
      expect(result).toBe('?symbol=AAPL&market=stock&pnlFilter=profitable');
    });

    test('should apply bookmarked filter state', () => {
      const searchParams = '?symbol=AAPL&market=stock&pnlFilter=profitable';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string> = {
          symbol: 'AAPL',
          market: 'stock',
          pnlFilter: 'profitable',
        };
        return params[key] || null;
      });
      
      const result = applyBookmarkedFilterState(searchParams);
      
      expect(result).toEqual({
        symbol: 'AAPL',
        market: 'stock',
        pnlFilter: 'profitable',
      });
    });

    test('should handle invalid bookmarked state', () => {
      const searchParams = '?symbol=AAPL&pnlFilter=invalid';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string> = {
          symbol: 'AAPL',
          pnlFilter: 'invalid',
        };
        return params[key] || null;
      });
      
      const result = applyBookmarkedFilterState(searchParams);
      
      expect(result).toEqual({
        symbol: 'AAPL',
      });
      expect(result).not.toHaveProperty('pnlFilter');
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed URL parameters', () => {
      mockLocation.search = '?symbol=&market=invalid&pnlFilter=profitable';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string | null> = {
          symbol: '',
          market: 'invalid',
          pnlFilter: 'profitable',
        };
        return params[key] || null;
      });
      
      const result = parseURLParams();
      
      expect(result).toEqual({
        pnlFilter: 'profitable',
      });
      expect(result).not.toHaveProperty('symbol');
      expect(result).not.toHaveProperty('market');
    });

    test('should handle very long parameter values', () => {
      const longSymbol = 'A'.repeat(1000);
      mockLocation.search = `?symbol=${longSymbol}`;
      mockURLSearchParams.get.mockReturnValue(longSymbol);
      
      const result = parseURLParams();
      
      expect(result).toEqual({ symbol: longSymbol });
    });

    test('should handle special characters in parameters', () => {
      mockLocation.search = '?symbol=AAPL%20Inc&market=stock%2Ccrypto';
      mockURLSearchParams.get.mockImplementation((key) => {
        const params: Record<string, string> = {
          symbol: 'AAPL Inc',
          market: 'stock,crypto',
        };
        return params[key] || null;
      });
      
      const result = parseURLParams();
      
      expect(result).toEqual({
        symbol: 'AAPL Inc',
        market: 'stock,crypto',
      });
    });
  });
});