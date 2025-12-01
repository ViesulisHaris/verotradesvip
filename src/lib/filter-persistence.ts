// Filter persistence utilities for localStorage
import { 
  FilterState, 
  TradeFilterOptions, 
  StrategyFilterOptions, 
  FILTER_STORAGE_KEYS 
} from './filtering-types';

/**
 * Save filter state to localStorage
 */
export function saveFilterState(state: FilterState): void {
  try {
    if (typeof window !== 'undefined') {
      // Check if we're approaching the localStorage quota limit
      const stateJson = JSON.stringify(state);
      const stateSize = new Blob([stateJson]).size;
      
      // If the state is too large, don't save it
      if (stateSize > 1024 * 1024) { // 1MB limit
        console.warn('Filter state is too large to save to localStorage');
        return;
      }
      
      localStorage.setItem(FILTER_STORAGE_KEYS.FILTER_STATE, stateJson);
      
      // Also save individual filter types for easier access
      const tradesJson = JSON.stringify(state.trades);
      const strategiesJson = JSON.stringify(state.strategies);
      
      // Check individual filter sizes
      if (new Blob([tradesJson]).size <= 1024 * 1024) {
        localStorage.setItem(FILTER_STORAGE_KEYS.TRADE_FILTERS, tradesJson);
      }
      
      if (new Blob([strategiesJson]).size <= 1024 * 1024) {
        localStorage.setItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS, strategiesJson);
      }
      
      // Dispatch storage event to sync across tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: FILTER_STORAGE_KEYS.FILTER_STATE,
        newValue: stateJson,
      }));
    }
  } catch (error) {
    // If we hit the quota limit, clear the localStorage and try again with just essential data
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        // Clear all filter-related items
        localStorage.removeItem(FILTER_STORAGE_KEYS.FILTER_STATE);
        localStorage.removeItem(FILTER_STORAGE_KEYS.TRADE_FILTERS);
        localStorage.removeItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS);
        
        // Save only essential data
        const essentialState = {
          trades: {
            symbol: state.trades?.symbol || '',
            market: state.trades?.market || '',
            dateFrom: state.trades?.dateFrom || '',
            dateTo: state.trades?.dateTo || '',
            pnlFilter: state.trades?.pnlFilter || 'all',
            strategyId: state.trades?.strategyId || '',
            side: state.trades?.side || '',
            sortBy: state.trades?.sortBy || 'trade_date',
            sortOrder: state.trades?.sortOrder || 'desc',
          },
          strategies: {
            search: state.strategies?.search || '',
            isActive: state.strategies?.isActive,
            performanceMin: state.strategies?.performanceMin,
            performanceMax: state.strategies?.performanceMax,
            minTrades: state.strategies?.minTrades,
            hasRules: state.strategies?.hasRules,
            sortBy: state.strategies?.sortBy || 'created_at',
            sortOrder: state.strategies?.sortOrder || 'desc',
          },
          lastUpdated: Date.now(),
        };
        
        localStorage.setItem(FILTER_STORAGE_KEYS.FILTER_STATE, JSON.stringify(essentialState));
        localStorage.setItem(FILTER_STORAGE_KEYS.TRADE_FILTERS, JSON.stringify(essentialState.trades));
        localStorage.setItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS, JSON.stringify(essentialState.strategies));
      } catch (clearError) {
        console.warn('Failed to save even essential filter state to localStorage:', clearError);
      }
    } else {
      console.warn('Failed to save filter state to localStorage:', error);
    }
  }
}

/**
 * Load filter state from localStorage
 */
export function loadFilterState(): FilterState | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEYS.FILTER_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the structure
        if (parsed && typeof parsed === 'object' && 'trades' in parsed && 'strategies' in parsed) {
          return parsed as FilterState;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load filter state from localStorage:', error);
  }
  return null;
}

/**
 * Save trade filters specifically
 */
export function saveTradeFilters(filters: TradeFilterOptions): void {
  try {
    if (typeof window !== 'undefined') {
      // Check if we're approaching the localStorage quota limit
      const filtersJson = JSON.stringify(filters);
      const filtersSize = new Blob([filtersJson]).size;
      
      // If the filters are too large, don't save them
      if (filtersSize > 1024 * 1024) { // 1MB limit
        console.warn('Trade filters are too large to save to localStorage');
        return;
      }
      
      localStorage.setItem(FILTER_STORAGE_KEYS.TRADE_FILTERS, filtersJson);
      
      // Update the combined state
      const currentState = loadFilterState() || createDefaultFilterState();
      currentState.trades = { ...filters, lastUpdated: Date.now() } as any;
      saveFilterState(currentState);
    }
  } catch (error) {
    // If we hit the quota limit, clear the localStorage and try again
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        // Clear all filter-related items and try again with just the essential filters
        localStorage.removeItem(FILTER_STORAGE_KEYS.FILTER_STATE);
        localStorage.removeItem(FILTER_STORAGE_KEYS.TRADE_FILTERS);
        localStorage.removeItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS);
        
        // Save only essential filters
        const essentialFilters = {
          symbol: filters.symbol || '',
          market: filters.market || '',
          dateFrom: filters.dateFrom || '',
          dateTo: filters.dateTo || '',
          pnlFilter: filters.pnlFilter || 'all',
          strategyId: filters.strategyId || '',
          side: filters.side || '',
          sortBy: filters.sortBy || 'trade_date',
          sortOrder: filters.sortOrder || 'desc',
        };
        
        localStorage.setItem(FILTER_STORAGE_KEYS.TRADE_FILTERS, JSON.stringify(essentialFilters));
      } catch (clearError) {
        console.warn('Failed to save even essential trade filters to localStorage:', clearError);
      }
    } else {
      console.warn('Failed to save trade filters to localStorage:', error);
    }
  }
}

/**
 * Save strategy filters specifically
 */
export function saveStrategyFilters(filters: StrategyFilterOptions): void {
  try {
    if (typeof window !== 'undefined') {
      // Check if we're approaching the localStorage quota limit
      const filtersJson = JSON.stringify(filters);
      const filtersSize = new Blob([filtersJson]).size;
      
      // If the filters are too large, don't save them
      if (filtersSize > 1024 * 1024) { // 1MB limit
        console.warn('Strategy filters are too large to save to localStorage');
        return;
      }
      
      localStorage.setItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS, filtersJson);
      
      // Update the combined state
      const currentState = loadFilterState() || createDefaultFilterState();
      currentState.strategies = { ...filters, lastUpdated: Date.now() } as any;
      saveFilterState(currentState);
    }
  } catch (error) {
    // If we hit the quota limit, clear the localStorage and try again
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        // Clear all filter-related items and try again with just the essential filters
        localStorage.removeItem(FILTER_STORAGE_KEYS.FILTER_STATE);
        localStorage.removeItem(FILTER_STORAGE_KEYS.TRADE_FILTERS);
        localStorage.removeItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS);
        
        // Save only essential filters
        const essentialFilters = {
          search: filters.search || '',
          isActive: filters.isActive,
          performanceMin: filters.performanceMin,
          performanceMax: filters.performanceMax,
          minTrades: filters.minTrades,
          hasRules: filters.hasRules,
          sortBy: filters.sortBy || 'created_at',
          sortOrder: filters.sortOrder || 'desc',
        };
        
        localStorage.setItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS, JSON.stringify(essentialFilters));
      } catch (clearError) {
        console.warn('Failed to save even essential strategy filters to localStorage:', clearError);
      }
    } else {
      console.warn('Failed to save strategy filters to localStorage:', error);
    }
  }
}

/**
 * Load trade filters specifically
 */
export function loadTradeFilters(): TradeFilterOptions | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEYS.TRADE_FILTERS);
      if (saved) {
        return JSON.parse(saved) as TradeFilterOptions;
      }
    }
  } catch (error) {
    console.warn('Failed to load trade filters from localStorage:', error);
  }
  return null;
}

/**
 * Load strategy filters specifically
 */
export function loadStrategyFilters(): StrategyFilterOptions | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS);
      if (saved) {
        return JSON.parse(saved) as StrategyFilterOptions;
      }
    }
  } catch (error) {
    console.warn('Failed to load strategy filters from localStorage:', error);
  }
  return null;
}

/**
 * Clear all filter state from localStorage
 */
export function clearFilterState(): void {
  try {
    if (typeof window !== 'undefined') {
      Object.values(FILTER_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Dispatch storage event to sync across tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: FILTER_STORAGE_KEYS.FILTER_STATE,
        newValue: null,
      }));
    }
  } catch (error) {
    console.warn('Failed to clear filter state from localStorage:', error);
  }
}

/**
 * Clear trade filters specifically
 */
export function clearTradeFilters(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FILTER_STORAGE_KEYS.TRADE_FILTERS);
      
      // Update the combined state
      const currentState = loadFilterState() || createDefaultFilterState();
      currentState.trades = createDefaultTradeFilters();
      saveFilterState(currentState);
    }
  } catch (error) {
    console.warn('Failed to clear trade filters from localStorage:', error);
  }
}

/**
 * Clear strategy filters specifically
 */
export function clearStrategyFilters(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FILTER_STORAGE_KEYS.STRATEGY_FILTERS);
      
      // Update the combined state
      const currentState = loadFilterState() || createDefaultFilterState();
      currentState.strategies = createDefaultStrategyFilters();
      saveFilterState(currentState);
    }
  } catch (error) {
    console.warn('Failed to clear strategy filters from localStorage:', error);
  }
}

/**
 * Create default filter state
 */
export function createDefaultFilterState(): FilterState {
  return {
    trades: createDefaultTradeFilters(),
    strategies: createDefaultStrategyFilters(),
    lastUpdated: Date.now(),
  };
}

/**
 * Create default trade filters
 */
export function createDefaultTradeFilters(): TradeFilterOptions {
  return {
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
  };
}

/**
 * Create default strategy filters
 */
export function createDefaultStrategyFilters(): StrategyFilterOptions {
  return {
    search: '',
    isActive: null,
    performanceMin: undefined,
    performanceMax: undefined,
    minTrades: undefined,
    hasRules: null,
    sortBy: 'created_at',
    sortOrder: 'desc',
  };
}

/**
 * Validate filter state
 */
export function validateFilterState(state: any): FilterState | null {
  if (!state || typeof state !== 'object') {
    return null;
  }
  
  try {
    // Basic structure validation
    if (!('trades' in state) || !('strategies' in state) || !('lastUpdated' in state)) {
      return null;
    }
    
    // Type validation for trades
    const trades = state.trades;
    if (trades && typeof trades === 'object') {
      // Ensure required fields exist with proper types
      if (trades.sortOrder && !['asc', 'desc'].includes(trades.sortOrder)) {
        trades.sortOrder = 'desc';
      }
      if (trades.pnlFilter && !['all', 'profitable', 'lossable'].includes(trades.pnlFilter)) {
        trades.pnlFilter = 'all';
      }
      if (trades.side && !['Buy', 'Sell', ''].includes(trades.side)) {
        trades.side = '';
      }
    }
    
    // Type validation for strategies
    const strategies = state.strategies;
    if (strategies && typeof strategies === 'object') {
      if (strategies.sortOrder && !['asc', 'desc'].includes(strategies.sortOrder)) {
        strategies.sortOrder = 'desc';
      }
    }
    
    return state as FilterState;
  } catch (error) {
    console.warn('Filter state validation failed:', error);
    return null;
  }
}

/**
 * Get filter statistics
 */
export function getFilterStats(filters: TradeFilterOptions | StrategyFilterOptions | string): {
  activeFilters: number;
  hasActiveFilters: boolean;
} {
  let activeFilters = 0;
  
  // Handle case where filters might be a stringified JSON object
  let parsedFilters: TradeFilterOptions | StrategyFilterOptions;
  
  if (typeof filters === 'string') {
    try {
      parsedFilters = JSON.parse(filters);
    } catch (error) {
      console.warn('Failed to parse filter string in getFilterStats:', error);
      return {
        activeFilters: 0,
        hasActiveFilters: false,
      };
    }
  } else {
    parsedFilters = filters;
  }
  
  // Now safely check properties on the parsed object
  if ('symbol' in parsedFilters) {
    const tradeFilters = parsedFilters as TradeFilterOptions;
    if (tradeFilters.symbol) activeFilters++;
    if (tradeFilters.market) activeFilters++;
    if (tradeFilters.dateFrom) activeFilters++;
    if (tradeFilters.dateTo) activeFilters++;
    if (tradeFilters.pnlFilter && tradeFilters.pnlFilter !== 'all') activeFilters++;
    if (tradeFilters.strategyId) activeFilters++;
    if (tradeFilters.side) activeFilters++;
    if (tradeFilters.emotionalStates && tradeFilters.emotionalStates.length > 0) activeFilters++;
  } else {
    const strategyFilters = parsedFilters as StrategyFilterOptions;
    if (strategyFilters.search) activeFilters++;
    if (strategyFilters.isActive !== null) activeFilters++;
    if (strategyFilters.performanceMin !== undefined) activeFilters++;
    if (strategyFilters.performanceMax !== undefined) activeFilters++;
    if (strategyFilters.minTrades !== undefined) activeFilters++;
    if (strategyFilters.hasRules !== null) activeFilters++;
  }
  
  return {
    activeFilters,
    hasActiveFilters: activeFilters > 0,
  };
}

/**
 * Hook for listening to filter changes across tabs
 */
export function useFilterSync(callback: (state: FilterState | null) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }
  
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === FILTER_STORAGE_KEYS.FILTER_STATE) {
      if (event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          const validatedState = validateFilterState(newState);
          callback(validatedState);
        } catch (error) {
          console.warn('Failed to parse synced filter state:', error);
        }
      } else {
        callback(null);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}