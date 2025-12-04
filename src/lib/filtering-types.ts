// Comprehensive filtering and sorting types for the trading journal

// Base filtering interface
export interface BaseFilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Trade-specific filtering options
export interface TradeFilterOptions extends BaseFilterOptions {
  symbol?: string;
  market?: 'stock' | 'crypto' | 'forex' | 'futures' | '';
  dateFrom?: string;
  dateTo?: string;
  pnlFilter?: 'all' | 'profitable' | 'lossable';
  strategyId?: string;
  side?: 'Buy' | 'Sell' | '';
  emotionalStates?: string[];
}

// Strategy-specific filtering options
export interface StrategyFilterOptions extends BaseFilterOptions {
  isActive?: boolean | null; // null = all, true = active, false = inactive
  performanceMin?: number;
  performanceMax?: number;
  minTrades?: number;
  hasRules?: boolean | null;
}

// Sort configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// Available sort options for trades
export const TRADE_SORT_OPTIONS: SortConfig[] = [
  { field: 'trade_date', direction: 'desc', label: 'Date (Newest First)' },
  { field: 'trade_date', direction: 'asc', label: 'Date (Oldest First)' },
  { field: 'symbol', direction: 'asc', label: 'Symbol (A-Z)' },
  { field: 'symbol', direction: 'desc', label: 'Symbol (Z-A)' },
  { field: 'pnl', direction: 'desc', label: 'P&L (Highest First)' },
  { field: 'pnl', direction: 'asc', label: 'P&L (Lowest First)' },
  { field: 'entry_price', direction: 'desc', label: 'Entry Price (High to Low)' },
  { field: 'entry_price', direction: 'asc', label: 'Entry Price (Low to High)' },
  { field: 'quantity', direction: 'desc', label: 'Quantity (High to Low)' },
  { field: 'quantity', direction: 'asc', label: 'Quantity (Low to High)' },
];

// Available sort options for strategies
export const STRATEGY_SORT_OPTIONS: SortConfig[] = [
  { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
  { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  { field: 'created_at', direction: 'desc', label: 'Created (Newest First)' },
  { field: 'created_at', direction: 'asc', label: 'Created (Oldest First)' },
  { field: 'total_trades', direction: 'desc', label: 'Total Trades (High to Low)' },
  { field: 'total_trades', direction: 'asc', label: 'Total Trades (Low to High)' },
  { field: 'win_rate', direction: 'desc', label: 'Win Rate (High to Low)' },
  { field: 'win_rate', direction: 'asc', label: 'Win Rate (Low to High)' },
  { field: 'total_pnl', direction: 'desc', label: 'Total P&L (High to Low)' },
  { field: 'total_pnl', direction: 'asc', label: 'Total P&L (Low to High)' },
];

// Market type options
export const MARKET_OPTIONS = [
  { value: '', label: 'All Markets' },
  { value: 'stock', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'forex', label: 'Forex' },
  { value: 'futures', label: 'Futures' },
];

// P&L filter options
export const PNL_FILTER_OPTIONS = [
  { value: 'all', label: 'All Trades' },
  { value: 'profitable', label: 'Profitable Only' },
  { value: 'lossable', label: 'Lossable Only' },
];

// Trade side options
export const SIDE_OPTIONS = [
  { value: '', label: 'All Sides' },
  { value: 'Buy', label: 'Buy Only' },
  { value: 'Sell', label: 'Sell Only' },
];

// Strategy status options
export const STRATEGY_STATUS_OPTIONS = [
  { value: '', label: 'All Strategies' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
];

// Filter state interface for persistence
export interface FilterState {
  trades: TradeFilterOptions;
  strategies: StrategyFilterOptions;
  lastUpdated: number;
}

// Filter persistence keys
export const FILTER_STORAGE_KEYS = {
  TRADE_FILTERS: 'trading_journal_trade_filters',
  STRATEGY_FILTERS: 'trading_journal_strategy_filters',
  FILTER_STATE: 'trading_journal_filter_state',
} as const;

// Filter action types for state management
export type FilterAction =
  | { type: 'SET_TRADE_FILTERS'; payload: Partial<TradeFilterOptions> }
  | { type: 'SET_STRATEGY_FILTERS'; payload: Partial<StrategyFilterOptions> }
  | { type: 'CLEAR_TRADE_FILTERS' }
  | { type: 'CLEAR_STRATEGY_FILTERS' }
  | { type: 'RESET_ALL_FILTERS' }
  | { type: 'LOAD_SAVED_FILTERS'; payload: FilterState };

// Filter validation result
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Filter statistics
export interface FilterStats {
  totalItems: number;
  filteredItems: number;
  activeFilters: number;
  hasActiveFilters: boolean;
}

// Auto-complete option for symbol search
export interface SymbolOption {
  value: string;
  label: string;
  count: number;
}

// Filter component props
export interface FilterComponentProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Sort component props
export interface SortComponentProps {
  sortConfig: SortConfig;
  onSortChange: (sortConfig: SortConfig) => void;
  options: SortConfig[];
  disabled?: boolean;
  className?: string;
}

// Filter badge props for showing active filters
export interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
  className?: string;
}

// Advanced filter options
export interface AdvancedFilterOptions {
  includeEmotionalStates?: boolean;
  includeTimeRanges?: boolean;
  includePerformanceMetrics?: boolean;
  customDateRanges?: Array<{ label: string; from: string; to: string }>;
}

// Date range preset options
export const DATE_RANGE_PRESETS = [
  { label: 'Today', from: () => new Date().toISOString().split('T')[0], to: () => new Date().toISOString().split('T')[0] },
  { label: 'Yesterday', from: () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }, to: () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }},
  { label: 'Last 7 Days', from: () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, to: () => new Date().toISOString().split('T')[0] },
  { label: 'Last 30 Days', from: () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }, to: () => new Date().toISOString().split('T')[0] },
  { label: 'This Month', from: () => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  }, to: () => new Date().toISOString().split('T')[0] },
  { label: 'Last Month', from: () => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }, to: () => {
    const date = new Date();
    date.setDate(0);
    return date.toISOString().split('T')[0];
  }},
  { label: 'This Year', from: () => {
    const date = new Date();
    date.setMonth(0, 1);
    return date.toISOString().split('T')[0];
  }, to: () => new Date().toISOString().split('T')[0] },
];

// Filter statistics function
export function getFilterStats(filters: TradeFilterOptions | StrategyFilterOptions): FilterStats {
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  return {
    totalItems: 0, // This would be populated with actual data
    filteredItems: 0, // This would be populated with actual data
    activeFilters,
    hasActiveFilters: activeFilters > 0
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

// Filter persistence functions (these would be implemented elsewhere)
// export function saveTradeFilters(filters: TradeFilterOptions): void;
// export function saveStrategyFilters(filters: StrategyFilterOptions): void;
// export function loadTradeFilters(): TradeFilterOptions | null;
// export function loadStrategyFilters(): StrategyFilterOptions | null;
// export function clearTradeFilters(): void;
// export function clearStrategyFilters(): void;
// export function useFilterSync(callback: (state: FilterState | null) => void): () => void;
// export function validateFilterState(state: any): FilterState | null;