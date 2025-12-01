'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Filter, ChevronDown, Calendar, TrendingUp } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { 
  FilterComponentProps, 
  TradeFilterOptions, 
  StrategyFilterOptions,
  MARKET_OPTIONS,
  PNL_FILTER_OPTIONS,
  SIDE_OPTIONS,
  STRATEGY_STATUS_OPTIONS,
  DATE_RANGE_PRESETS,
  getFilterStats,
} from '@/lib/filtering-types';

interface EnhancedFilterControlsProps extends FilterComponentProps {
  type: 'trades' | 'strategies';
  availableStrategies?: Array<{ id: string; name: string }>;
  availableSymbols?: Array<{ value: string; label: string; count: number }>;
  onSymbolSearch?: (query: string) => void;
  showAdvanced?: boolean;
  compact?: boolean;
}

export default function EnhancedFilterControls({
  type,
  filters,
  onFiltersChange,
  onClearFilters,
  availableStrategies = [],
  availableSymbols = [],
  onSymbolSearch,
  showAdvanced = false,
  compact = false,
  loading = false,
  disabled = false,
  className = ''
}: EnhancedFilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [showDatePresets, setShowDatePresets] = useState(false);
  
  const filterStats = getFilterStats(filters);
  const isTradeFilters = type === 'trades';
  
  // Initialize symbol query from filters
  useEffect(() => {
    if (isTradeFilters) {
      setSymbolQuery((filters as TradeFilterOptions).symbol || '');
    }
  }, [filters, isTradeFilters]);

  // Debounced symbol search
  const debouncedSymbolSearch = useCallback(
    (query: string) => {
      if (onSymbolSearch && query !== (filters as TradeFilterOptions).symbol) {
        onSymbolSearch(query);
      }
    },
    [onSymbolSearch, filters]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSymbolSearch(symbolQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [symbolQuery, debouncedSymbolSearch]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    if (disabled) return;
    
    const newFilters = {
      ...filters,
      [key]: value
    };
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange, disabled]);

  const handleDatePresetClick = useCallback((preset: typeof DATE_RANGE_PRESETS[0]) => {
    const from = preset.from();
    const to = preset.to();
    
    handleFilterChange('dateFrom', from);
    handleFilterChange('dateTo', to);
    setShowDatePresets(false);
  }, [handleFilterChange]);

  const clearAllFilters = useCallback(() => {
    if (disabled) return;
    setSymbolQuery('');
    onClearFilters();
  }, [onClearFilters, disabled]);

  const renderTradeFilters = () => {
    const tradeFilters = filters as TradeFilterOptions;
    
    return (
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* Symbol Search with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-primary">Symbol</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={symbolQuery}
              onChange={(e) => setSymbolQuery(e.target.value)}
              placeholder="Search symbol..."
              className="metallic-input w-full pl-10"
              disabled={disabled || loading}
            />
            {symbolQuery && (
              <button
                onClick={() => setSymbolQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Symbol Suggestions Dropdown */}
          {availableSymbols.length > 0 && symbolQuery && (
            <div className="absolute z-50 w-full mt-1 max-h-40 overflow-auto rounded-lg shadow-2xl border border-white/10 scrollbar-glass">
              {availableSymbols.slice(0, 5).map((symbol) => (
                <div
                  key={symbol.value}
                  className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm text-white"
                  onClick={() => {
                    setSymbolQuery(symbol.value);
                    handleFilterChange('symbol', symbol.value);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>{symbol.label}</span>
                    <span className="text-xs text-white/50">{symbol.count} trades</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Market</label>
          <CustomDropdown
            value={tradeFilters.market || ''}
            onChange={(value) => handleFilterChange('market', value)}
            options={MARKET_OPTIONS}
            disabled={disabled || loading}
            className="w-full"
          />
        </div>

        {/* P&L Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">P&L</label>
          <CustomDropdown
            value={tradeFilters.pnlFilter || 'all'}
            onChange={(value) => handleFilterChange('pnlFilter', value)}
            options={PNL_FILTER_OPTIONS}
            disabled={disabled || loading}
            className="w-full"
          />
        </div>

        {/* Trade Side Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Side</label>
          <CustomDropdown
            value={tradeFilters.side || ''}
            onChange={(value) => handleFilterChange('side', value)}
            options={SIDE_OPTIONS}
            disabled={disabled || loading}
            className="w-full"
          />
        </div>

        {/* Date Range Filters */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">From Date</label>
          <div className="relative">
            <input
              type="date"
              value={tradeFilters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="date-enhanced w-full px-4 py-3"
              disabled={disabled || loading}
            />
            <button
              type="button"
              onClick={() => setShowDatePresets(!showDatePresets)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
              disabled={disabled || loading}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          
          {/* Date Presets Dropdown */}
          {showDatePresets && (
            <div className="absolute z-50 w-full mt-1 rounded-lg shadow-2xl border border-white/10 scrollbar-glass">
              {DATE_RANGE_PRESETS.map((preset) => (
                <div
                  key={preset.label}
                  className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm text-white"
                  onClick={() => handleDatePresetClick(preset)}
                >
                  {preset.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-primary">To Date</label>
          <input
            type="date"
            value={tradeFilters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="date-enhanced w-full px-4 py-3"
            disabled={disabled || loading}
          />
        </div>

        {/* Strategy Filter */}
        {availableStrategies.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-primary">Strategy</label>
            <CustomDropdown
              value={tradeFilters.strategyId || ''}
              onChange={(value) => handleFilterChange('strategyId', value)}
              options={[
                { value: '', label: 'All Strategies' },
                ...availableStrategies.map(s => ({ value: s.id, label: s.name }))
              ]}
              disabled={disabled || loading}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  };

  const renderStrategyFilters = () => {
    const strategyFilters = filters as StrategyFilterOptions;
    
    return (
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {/* Search */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={strategyFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search strategies..."
              className="metallic-input w-full pl-10"
              disabled={disabled || loading}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Status</label>
          <CustomDropdown
            value={
              strategyFilters.isActive === null ? '' : 
              strategyFilters.isActive ? 'active' : 'inactive'
            }
            onChange={(value) => {
              const isActive = value === '' ? null : value === 'active';
              handleFilterChange('isActive', isActive);
            }}
            options={STRATEGY_STATUS_OPTIONS}
            disabled={disabled || loading}
            className="w-full"
          />
        </div>

        {/* Performance Range */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Min Win Rate (%)</label>
          <input
            type="number"
            value={strategyFilters.performanceMin || ''}
            onChange={(e) => handleFilterChange('performanceMin', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            max="100"
            className="metallic-input w-full"
            disabled={disabled || loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Max Win Rate (%)</label>
          <input
            type="number"
            value={strategyFilters.performanceMax || ''}
            onChange={(e) => handleFilterChange('performanceMax', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="100"
            min="0"
            max="100"
            className="metallic-input w-full"
            disabled={disabled || loading}
          />
        </div>

        {/* Minimum Trades */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Min Trades</label>
          <input
            type="number"
            value={strategyFilters.minTrades || ''}
            onChange={(e) => handleFilterChange('minTrades', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            className="metallic-input w-full"
            disabled={disabled || loading}
          />
        </div>

        {/* Has Rules Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-primary">Rules</label>
          <CustomDropdown
            value={
              strategyFilters.hasRules === null ? '' :
              strategyFilters.hasRules ? 'has-rules' : 'no-rules'
            }
            onChange={(value) => {
              const hasRules = value === '' ? null : value === 'has-rules';
              handleFilterChange('hasRules', hasRules);
            }}
            options={[
              { value: '', label: 'All Strategies' },
              { value: 'has-rules', label: 'Has Rules' },
              { value: 'no-rules', label: 'No Rules' }
            ]}
            disabled={disabled || loading}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`card-unified p-6 rounded-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-primary">Filters</h3>
          {filterStats.hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              {filterStats.activeFilters} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {filterStats.hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm bg-white/10 text-primary rounded-lg hover:bg-white/20 transition-colors"
              disabled={disabled || loading}
            >
              Clear All
            </button>
          )}
          
          {!compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={disabled || loading}
            >
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`${compact || isExpanded ? 'block' : 'hidden lg:block'}`}>
        {isTradeFilters ? renderTradeFilters() : renderStrategyFilters()}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}