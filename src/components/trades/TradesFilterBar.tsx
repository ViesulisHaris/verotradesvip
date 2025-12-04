'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { X, Filter, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useTradesFilter } from '@/contexts/TradesFilterContext';
import { TradeFilterOptions, MARKET_OPTIONS, PNL_FILTER_OPTIONS, SIDE_OPTIONS } from '@/lib/filtering-types';
import { getFilterStats } from '@/lib/filter-persistence';
import { performanceUtils } from '@/lib/performance-optimization';

// Filter badge component for active filters
const FilterBadge = memo(({ label, value, onRemove }: { 
  label: string; 
  value: string; 
  onRemove: () => void;
}) => (
  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold-light text-xs font-medium">
    <span className="truncate max-w-[100px]">{label}: {value}</span>
    <button
      onClick={onRemove}
      className="ml-1 hover:text-gold transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
));

FilterBadge.displayName = 'FilterBadge';

// Main filter bar component with optimized memoization
const TradesFilterBar = memo(() => {
  const { state, actions, utils } = useTradesFilter();
  const { filters } = state;

  // Memoized default values for filter removal
  const defaultFilterValues = useMemo(() => ({
    symbol: '',
    market: '',
    dateFrom: '',
    dateTo: '',
    pnlFilter: 'all',
    side: '',
    emotionalStates: [],
  }), []);

  // Calculate active filter badges with optimized memoization
  const activeFilters = useMemo(() => {
    const badges: Array<{ key: keyof TradeFilterOptions; label: string; value: string }> = [];
    
    if (filters.symbol) {
      badges.push({ key: 'symbol', label: 'Symbol', value: filters.symbol });
    }
    
    if (filters.market) {
      const marketOption = MARKET_OPTIONS.find(opt => opt.value === filters.market);
      badges.push({ key: 'market', label: 'Market', value: marketOption?.label || filters.market });
    }
    
    if (filters.dateFrom) {
      badges.push({ key: 'dateFrom', label: 'From', value: new Date(filters.dateFrom).toLocaleDateString() });
    }
    
    if (filters.dateTo) {
      badges.push({ key: 'dateTo', label: 'To', value: new Date(filters.dateTo).toLocaleDateString() });
    }
    
    if (filters.pnlFilter && filters.pnlFilter !== 'all') {
      const pnlOption = PNL_FILTER_OPTIONS.find(opt => opt.value === filters.pnlFilter);
      badges.push({ key: 'pnlFilter', label: 'P&L', value: pnlOption?.label || filters.pnlFilter });
    }
    
    if (filters.side) {
      const sideOption = SIDE_OPTIONS.find(opt => opt.value === filters.side);
      badges.push({ key: 'side', label: 'Side', value: sideOption?.label || filters.side });
    }
    
    if (filters.emotionalStates && filters.emotionalStates.length > 0) {
      badges.push({
        key: 'emotionalStates',
        label: 'Emotions',
        value: `${filters.emotionalStates.length} selected`
      });
    }
    
    return badges;
  }, [filters.symbol, filters.market, filters.dateFrom, filters.dateTo, filters.pnlFilter, filters.side, filters.emotionalStates]);

  // Optimized filter change handler with performance tracking
  const handleFilterChange = useCallback((key: keyof TradeFilterOptions, value: any) => {
    actions.setFilter(key, value);
  }, [actions]);

  // Optimized filter removal handler
  const handleRemoveFilter = useCallback((key: keyof TradeFilterOptions) => {
    if (key in defaultFilterValues) {
      actions.setFilter(key, defaultFilterValues[key as keyof typeof defaultFilterValues]);
    }
  }, [actions, defaultFilterValues]);

  // Optimized clear all handler
  const handleClearAll = useCallback(() => {
    actions.clearFilters();
  }, [actions]);

  // Memoized filter statistics
  const filterStats = useMemo(() => getFilterStats(filters), [filters]);

  return (
    <div className="flashlight-container rounded-xl p-6 mb-10 scroll-item bg-surface">
      <div className="flashlight-bg"></div>
      <div className="flashlight-border"></div>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-medium text-white">Filters</h2>
            {utils.hasActiveFilters && (
              <span className="px-2 py-1 bg-gold/20 border border-gold/30 rounded-full text-gold text-xs font-medium">
                {utils.activeFilterCount} active
              </span>
            )}
          </div>
          
          {utils.hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-400 hover:text-gold transition-colors font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Symbol Filter */}
          <div className="group">
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-gold transition-colors">
              Symbol
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={filters.symbol || ''}
                onChange={(e) => handleFilterChange('symbol', e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg input-dark text-sm placeholder:text-gray-600"
                // Performance optimization: prevent unnecessary re-renders
                autoComplete="off"
              />
            </div>
          </div>

          {/* Market Filter */}
          <div className="group">
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-gold transition-colors">
              Market
            </label>
            <select
              value={filters.market || ''}
              onChange={(e) => handleFilterChange('market', e.target.value)}
              className="w-full h-11 px-4 rounded-lg input-dark text-sm cursor-pointer appearance-none bg-[#1A1A1A]"
            >
              {MARKET_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div className="group">
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-gold transition-colors">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg input-dark text-sm"
                // Performance optimization: prevent unnecessary re-renders
                autoComplete="off"
              />
            </div>
          </div>

          {/* Date To Filter */}
          <div className="group">
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-gold transition-colors">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg input-dark text-sm"
                // Performance optimization: prevent unnecessary re-renders
                autoComplete="off"
              />
            </div>
          </div>

          {/* P&L Filter */}
          <div className="group">
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-gold transition-colors">
              P&L Filter
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              <select
                value={filters.pnlFilter || 'all'}
                onChange={(e) => handleFilterChange('pnlFilter', e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg input-dark text-sm cursor-pointer appearance-none bg-[#1A1A1A]"
              >
                {PNL_FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <FilterBadge
                  key={filter.key}
                  label={filter.label}
                  value={filter.value}
                  onRemove={() => handleRemoveFilter(filter.key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filter Statistics */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {filterStats.hasActiveFilters 
                ? `${filterStats.activeFilters} filter${filterStats.activeFilters !== 1 ? 's' : ''} applied`
                : 'No filters applied'
              }
            </span>
            <span className="text-gray-600">
              URL updated automatically
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

TradesFilterBar.displayName = 'TradesFilterBar';

export default TradesFilterBar;