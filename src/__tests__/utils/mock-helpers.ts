// Mock helpers for API responses and utilities
import { MockTrade, MockStrategy } from './test-data-generators';
import { TradeFilterOptions, StrategyFilterOptions } from '@/lib/filtering-types';

// Mock user data
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock session data
export const mockSession = {
  user: mockUser,
  session: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
  },
};

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      in: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
      ilike: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      order: jest.fn(() => ({
        range: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      range: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
    signIn: jest.fn(() => Promise.resolve({ data: mockSession, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    })),
  },
});

// Mock localStorage
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    length: Object.keys(store).length,
  };
};

// Mock URLSearchParams
export const createMockURLSearchParams = (initialParams?: Record<string, string>) => {
  const params = new URLSearchParams(initialParams);
  
  return {
    get: jest.fn(params.get.bind(params)),
    set: jest.fn(params.set.bind(params)),
    delete: jest.fn(params.delete.bind(params)),
    has: jest.fn(params.has.bind(params)),
    toString: jest.fn(params.toString.bind(params)),
  };
};

// Mock window.location
export const createMockLocation = (search?: string) => ({
  href: 'http://localhost:3000/trades',
  origin: 'http://localhost:3000',
  pathname: '/trades',
  search: search || '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
});

// Mock performance API
export const createMockPerformance = () => ({
  now: jest.fn(() => Date.now()),
  timing: {
    navigationStart: Date.now() - 1000,
    loadEventEnd: Date.now(),
  },
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2048 * 1024 * 1024, // 2GB
  },
});

// Mock IntersectionObserver
export const createMockIntersectionObserver = () => {
  const callbacks: Array<(entries: any[]) => void> = [];
  
  return {
    observe: jest.fn((element) => {
      // Simulate intersection after a short delay
      setTimeout(() => {
        callbacks.forEach(callback => callback([{
          target: element,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: element.getBoundingClientRect(),
        }]));
      }, 100);
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    callback: jest.fn((callback) => {
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      };
    }),
  };
};

// Mock ResizeObserver
export const createMockResizeObserver = () => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});

// Mock fetch API
export const createMockFetch = (responses: Array<{ url: string; response: any; error?: any }>) => {
  return jest.fn((url: string) => {
    const mockResponse = responses.find(r => r.url === url);
    
    if (mockResponse?.error) {
      return Promise.reject(mockResponse.error);
    }
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse?.response || {}),
      text: () => Promise.resolve(JSON.stringify(mockResponse?.response || {})),
    });
  });
};

// Mock API responses
export const mockApiResponses = {
  // Trades API responses
  trades: {
    success: {
      data: [
        {
          id: 'trade-1',
          user_id: 'test-user-123',
          symbol: 'AAPL',
          market: 'stock',
          side: 'Buy',
          entry_price: 150.00,
          exit_price: 155.00,
          quantity: 100,
          pnl: 500.00,
          trade_date: '2023-01-15',
          strategy_id: 'strategy-1',
          strategy: 'Momentum Breakout',
          emotional_state: 'Confident',
          notes: 'Test trade',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2023-01-15T10:00:00Z',
        },
      ],
      error: null,
    },
    error: {
      data: null,
      error: { message: 'Failed to fetch trades' },
    },
    empty: {
      data: [],
      error: null,
    },
  },
  
  // Strategies API responses
  strategies: {
    success: {
      data: [
        {
          id: 'strategy-1',
          user_id: 'test-user-123',
          name: 'Momentum Breakout',
          description: 'Test strategy',
          is_active: true,
          total_trades: 150,
          win_rate: 0.65,
          total_pnl: 15000.00,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    },
    error: {
      data: null,
      error: { message: 'Failed to fetch strategies' },
    },
    empty: {
      data: [],
      error: null,
    },
  },
  
  // Statistics API responses
  statistics: {
    success: {
      data: {
        total_trades: 100,
        total_pnl: 5000.00,
        win_rate: 0.65,
        profitable_trades: 65,
        lossable_trades: 35,
        average_win: 150.00,
        average_loss: -75.00,
        largest_win: 1000.00,
        largest_loss: -500.00,
      },
      error: null,
    },
    error: {
      data: null,
      error: { message: 'Failed to fetch statistics' },
    },
  },
};

// Mock filter responses
export const createMockFilterResponse = (
  trades: MockTrade[],
  filters: TradeFilterOptions,
  totalCount?: number
) => {
  let filteredTrades = [...trades];
  
  // Apply filters
  if (filters.symbol) {
    filteredTrades = filteredTrades.filter(trade => 
      trade.symbol.toLowerCase().includes(filters.symbol!.toLowerCase())
    );
  }
  
  if (filters.market) {
    filteredTrades = filteredTrades.filter(trade => trade.market === filters.market);
  }
  
  if (filters.side) {
    filteredTrades = filteredTrades.filter(trade => trade.side === filters.side);
  }
  
  if (filters.pnlFilter) {
    filteredTrades = filteredTrades.filter(trade => {
      if (filters.pnlFilter === 'profitable') return trade.pnl > 0;
      if (filters.pnlFilter === 'lossable') return trade.pnl < 0;
      return true;
    });
  }
  
  if (filters.dateFrom) {
    filteredTrades = filteredTrades.filter(trade => trade.trade_date >= filters.dateFrom!);
  }
  
  if (filters.dateTo) {
    filteredTrades = filteredTrades.filter(trade => trade.trade_date <= filters.dateTo!);
  }
  
  if (filters.strategyId) {
    filteredTrades = filteredTrades.filter(trade => trade.strategy_id === filters.strategyId);
  }
  
  if (filters.emotionalStates && filters.emotionalStates.length > 0) {
    filteredTrades = filteredTrades.filter(trade => 
      filters.emotionalStates!.includes(trade.emotional_state || '')
    );
  }
  
  // Apply sorting
  if (filters.sortBy) {
    filteredTrades.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof MockTrade];
      let bValue: any = b[filters.sortBy as keyof MockTrade];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }
  
  return {
    data: filteredTrades,
    totalCount: totalCount || filteredTrades.length,
    filteredCount: filteredTrades.length,
  };
};

// Mock pagination helper
export const createMockPaginatedResponse = <T>(
  items: T[],
  page: number,
  limit: number
) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = items.slice(startIndex, endIndex);
  
  return {
    data,
    totalCount: items.length,
    currentPage: page,
    totalPages: Math.ceil(items.length / limit),
    hasNextPage: endIndex < items.length,
    hasPreviousPage: page > 1,
  };
};

// Mock error responses
export const mockErrors = {
  networkError: new Error('Network error'),
  authError: new Error('Authentication failed'),
  validationError: new Error('Validation failed'),
  serverError: new Error('Internal server error'),
  timeoutError: new Error('Request timeout'),
  quotaExceededError: new Error('Storage quota exceeded'),
};

// Mock event handlers
export const createMockEventHandler = () => {
  const listeners: Array<(event: any) => void> = [];
  
  return {
    addEventListener: jest.fn((event: string, listener: (event: any) => void) => {
      listeners.push(listener);
    }),
    removeEventListener: jest.fn((event: string, listener: (event: any) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    }),
    dispatchEvent: jest.fn((event: any) => {
      listeners.forEach(listener => listener(event));
    }),
    listeners,
  };
};

// Mock React hooks
export const createMockHook = <T>(initialValue: T) => {
  let value = initialValue;
  const listeners: Array<(value: T) => void> = [];
  
  return {
    current: value,
    setValue: jest.fn((newValue: T) => {
      value = newValue;
      listeners.forEach(listener => listener(newValue));
    }),
    subscribe: jest.fn((listener: (value: T) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    }),
    listeners,
  };
};

// Performance testing helpers
export const createPerformanceTimer = () => {
  const times: Record<string, number> = {};
  
  return {
    start: jest.fn((label: string) => {
      times[label] = performance.now();
    }),
    end: jest.fn((label: string) => {
      if (times[label]) {
        return performance.now() - times[label];
      }
      return 0;
    }),
    times,
  };
};

// Utility functions for testing
export const testUtils = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Flush all promises
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  // Create a delay for testing debouncing
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random string for testing
  randomString: (length: number = 10) => 
    Math.random().toString(36).substring(2, length + 2),
  
  // Check if object is deeply equal
  deepEqual: (obj1: any, obj2: any) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },
  
  // Create a spy that tracks calls
  createSpy: (implementation?: Function) => {
    const calls: Array<{ args: any[]; result: any }> = [];
    const spy = jest.fn(implementation);
    
    spy.mockImplementation((...args) => {
      const result = implementation ? implementation(...args) : undefined;
      calls.push({ args, result });
      return result;
    });
    
    return {
      spy,
      calls,
      callCount: () => calls.length,
      lastCall: () => calls[calls.length - 1],
      calledWith: (...args: any[]) => 
        calls.some(call => 
          call.args.length === args.length && 
          call.args.every((arg, index) => arg === args[index])
        ),
    };
  },
};