'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { TradeFilterOptions, createDefaultTradeFilters } from '@/lib/filtering-types';
import { saveTradeFilters, loadTradeFilters } from '@/lib/filter-persistence';
import {
  parseURLParams,
  updateURLParams,
  debouncedURLUpdate,
  initializeFromURL
} from '@/lib/url-sync';
import {
  createFilterDebouncedFunction,
  createURLUpdateDebouncedFunction,
  performanceUtils
} from '@/lib/performance-optimization';

// Enhanced filter state interface
interface FilterState {
  filters: TradeFilterOptions;
  isLoading: boolean;
  lastUpdated: number;
}

// Filter action types
type FilterAction =
  | { type: 'SET_FILTER'; payload: { key: keyof TradeFilterOptions; value: any } }
  | { type: 'SET_FILTERS'; payload: Partial<TradeFilterOptions> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'RESET_FILTERS' }
  | { type: 'LOAD_FROM_URL'; payload: TradeFilterOptions }
  | { type: 'LOAD_FROM_STORAGE'; payload: TradeFilterOptions }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SYNC_COMPLETE' }
  | { type: 'SET_SORT'; payload: { sortBy: string; sortOrder: 'asc' | 'desc' } }
  | { type: 'RESET_SORT' };

// Initial state
const initialState: FilterState = {
  filters: createDefaultTradeFilters(),
  isLoading: false,
  lastUpdated: Date.now(),
};

// Reducer function
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
        lastUpdated: Date.now(),
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        lastUpdated: Date.now(),
      };
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: createDefaultTradeFilters(),
        lastUpdated: Date.now(),
      };
    
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: createDefaultTradeFilters(),
        lastUpdated: Date.now(),
      };
    
    case 'LOAD_FROM_URL':
      return {
        ...state,
        filters: action.payload,
        lastUpdated: Date.now(),
      };
    
    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        filters: action.payload,
        lastUpdated: Date.now(),
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SYNC_COMPLETE':
      return {
        ...state,
        lastUpdated: Date.now(),
      };
    
    case 'SET_SORT':
      return {
        ...state,
        filters: {
          ...state.filters,
          sortBy: action.payload.sortBy,
          sortOrder: action.payload.sortOrder,
        },
        lastUpdated: Date.now(),
      };
    
    case 'RESET_SORT':
      return {
        ...state,
        filters: {
          ...state.filters,
          sortBy: 'trade_date',
          sortOrder: 'desc',
        },
        lastUpdated: Date.now(),
      };
    
    default:
      return state;
  }
}

// Context interface
interface TradesFilterContextType {
  state: FilterState;
  actions: {
    setFilter: (key: keyof TradeFilterOptions, value: any) => void;
    setFilters: (filters: Partial<TradeFilterOptions>) => void;
    clearFilters: () => void;
    resetFilters: () => void;
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
    resetSort: () => void;
  };
  utils: {
    hasActiveFilters: boolean;
    activeFilterCount: number;
    hasActiveSort: boolean;
    currentSort: { sortBy: string; sortOrder: 'asc' | 'desc' };
  };
}

// Create context
const TradesFilterContext = createContext<TradesFilterContextType | undefined>(undefined);

// Provider component
export function TradesFilterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, initialState);
  const isInitializedRef = useRef(false);

  // Use optimized debounced functions from performance utilities
  const debouncedUpdateURL = useMemo(
    () => createURLUpdateDebouncedFunction(updateURLParams),
    []
  );

  const debouncedSaveFilters = useMemo(
    () => createFilterDebouncedFunction(saveTradeFilters),
    []
  );

  // Initialize filters from URL and localStorage (optimized single effect)
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const initializeFilters = () => {
      try {
        // Priority: URL > localStorage > defaults
        const urlFilters = parseURLParams();
        
        if (Object.keys(urlFilters).length > 0) {
          // URL parameters take precedence
          dispatch({ type: 'LOAD_FROM_URL', payload: urlFilters });
        } else {
          // Try to load from localStorage
          const savedFilters = loadTradeFilters();
          if (savedFilters) {
            dispatch({ type: 'LOAD_FROM_STORAGE', payload: savedFilters });
          }
        }
        
        isInitializedRef.current = true;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error initializing filters:', error);
        }
        isInitializedRef.current = true;
      }
    };

    initializeFilters();
  }, []); // Single dependency array - no re-runs

  // Combined effect for saving filters and updating URL (reduced from 3 to 1 effect)
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    // Save to localStorage (debounced)
    debouncedSaveFilters(state.filters);
    
    // Update URL (debounced)
    debouncedUpdateURL(state.filters);
  }, [state.filters, debouncedSaveFilters, debouncedUpdateURL]);

  // Listen for browser back/forward navigation (optimized with cleanup tracking)
  useEffect(() => {
    const handlePopState = () => {
      const urlFilters = parseURLParams();
      if (Object.keys(urlFilters).length > 0) {
        dispatch({ type: 'LOAD_FROM_URL', payload: urlFilters });
      }
    };

    // Track event listener for cleanup
    performanceUtils.trackEventListener(window, 'popstate', handlePopState, 'filter-context-popstate');
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Action creators
  const actions = {
    setFilter: useCallback((key: keyof TradeFilterOptions, value: any) => {
      dispatch({ type: 'SET_FILTER', payload: { key, value } });
    }, []),

    setFilters: useCallback((filters: Partial<TradeFilterOptions>) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []),

    clearFilters: useCallback(() => {
      dispatch({ type: 'CLEAR_FILTERS' });
    }, []),

    resetFilters: useCallback(() => {
      dispatch({ type: 'RESET_FILTERS' });
    }, []),

    setSort: useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
      dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
    }, []),

    resetSort: useCallback(() => {
      dispatch({ type: 'RESET_SORT' });
    }, []),
  };

  // Memoized utility functions to prevent recalculation
  const utils = useMemo(() => {
    const hasActiveFilters = Object.entries(state.filters).some(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
    
    const activeFilterCount = Object.entries(state.filters).filter(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      
      // Exclude default values
      if (key === 'pnlFilter' && value === 'all') return false;
      if (key === 'sortBy' && value === 'trade_date') return false;
      if (key === 'sortOrder' && value === 'desc') return false;
      if (key === 'strategyId' && value === '') return false;
      
      return true;
    }).length;

    const hasActiveSort = !!(state.filters.sortBy && state.filters.sortOrder &&
      (state.filters.sortBy !== 'trade_date' || state.filters.sortOrder !== 'desc'));

    return {
      hasActiveFilters,
      activeFilterCount,
      hasActiveSort,
      currentSort: {
        sortBy: state.filters.sortBy || 'trade_date',
        sortOrder: (state.filters.sortOrder as 'asc' | 'desc') || 'desc'
      },
    };
  }, [state.filters]); // Only recalculate when filters change

  const contextValue: TradesFilterContextType = {
    state,
    actions,
    utils,
  };

  return (
    <TradesFilterContext.Provider value={contextValue}>
      {children}
    </TradesFilterContext.Provider>
  );
}

// Hook to use the context
export function useTradesFilter() {
  const context = useContext(TradesFilterContext);
  if (context === undefined) {
    throw new Error('useTradesFilter must be used within a TradesFilterProvider');
  }
  return context;
}

// Export the context for advanced usage
export { TradesFilterContext };