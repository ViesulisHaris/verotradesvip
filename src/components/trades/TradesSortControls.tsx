'use client';

import React, { useCallback, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import EnhancedSortControls from '@/components/ui/EnhancedSortControls';
import { SortConfig, TRADE_SORT_OPTIONS } from '@/lib/filtering-types';
import { useTradesFilter } from '@/contexts/TradesFilterContext';
import { performanceUtils, createSortDebouncedFunction } from '@/lib/performance-optimization';

interface TradesSortControlsProps {
  className?: string;
  disabled?: boolean;
}

export default function TradesSortControls({ 
  className = '', 
  disabled = false 
}: TradesSortControlsProps) {
  const { state: filterState, actions: filterActions } = useTradesFilter();
  
  // Extract sort state from filters
  const currentSortConfig: SortConfig = useMemo(() => {
    const sortBy = filterState.filters.sortBy || 'trade_date';
    const sortOrder = filterState.filters.sortOrder || 'desc';
    
    // Find the matching sort option
    const matchingOption = TRADE_SORT_OPTIONS.find(
      option => option.field === sortBy && option.direction === sortOrder
    );
    
    return matchingOption || TRADE_SORT_OPTIONS[0];
  }, [filterState.filters.sortBy, filterState.filters.sortOrder]) as SortConfig;

  // Optimized sort change handler with debouncing
  const handleSortChange = useMemo(
    () => createSortDebouncedFunction((newSortConfig: SortConfig) => {
      // Update filter context with new sort values
      filterActions.setFilters({
        sortBy: newSortConfig.field,
        sortOrder: newSortConfig.direction
      });
    }),
    [filterActions]
  );

  // Memoized quick sort buttons for common options
  const quickSortButtons = useMemo(() => [
    {
      field: 'trade_date',
      direction: 'desc' as const,
      label: 'Date (Newest)',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Show newest trades first'
    },
    {
      field: 'trade_date',
      direction: 'asc' as const,
      label: 'Date (Oldest)',
      icon: <Calendar className="w-4 h-4 rotate-180" />,
      description: 'Show oldest trades first'
    },
    {
      field: 'pnl',
      direction: 'desc' as const,
      label: 'P&L (Highest)',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Show highest profit first'
    },
    {
      field: 'pnl',
      direction: 'asc' as const,
      label: 'P&L (Lowest)',
      icon: <TrendingUp className="w-4 h-4 rotate-180" />,
      description: 'Show lowest profit first'
    },
    {
      field: 'symbol',
      direction: 'asc' as const,
      label: 'Symbol (A-Z)',
      icon: <ArrowUpDown className="w-4 h-4" />,
      description: 'Sort alphabetically A-Z'
    },
    {
      field: 'symbol',
      direction: 'desc' as const,
      label: 'Symbol (Z-A)',
      icon: <ArrowUpDown className="w-4 h-4 rotate-180" />,
      description: 'Sort alphabetically Z-A'
    }
  ], []); // Empty dependency array - buttons are static

  // Optimized quick sort handler with debouncing
  const handleQuickSort = useMemo(
    () => createSortDebouncedFunction((field: string, direction: 'asc' | 'desc') => {
      filterActions.setFilters({
        sortBy: field,
        sortOrder: direction
      });
    }),
    [filterActions]
  );

  // Memoized quick sort active checker
  const isQuickSortActive = useCallback((field: string, direction: 'asc' | 'desc') => {
    return currentSortConfig.field === field && currentSortConfig.direction === direction;
  }, [currentSortConfig]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Horizontal Sort Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Quick Sort Buttons */}
        <div className="flex flex-wrap gap-2">
          {quickSortButtons.map((button) => {
            const isActive = isQuickSortActive(button.field, button.direction);
            
            return (
              <button
                key={`${button.field}-${button.direction}`}
                onClick={() => handleQuickSort(button.field, button.direction)}
                disabled={disabled}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 hover:border-white/20'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={button.description}
              >
                {button.icon}
                <span className="hidden sm:inline">{button.label}</span>
                <span className="sm:hidden">{button.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Sort Instructions - Removed redundant text */}
    </div>
  );
}

// Export a compact version for mobile/small screens
export function CompactTradesSortControls({
  className = '',
  disabled = false
}: TradesSortControlsProps) {
  const { state: filterState, actions: filterActions } = useTradesFilter();
  
  const currentSortConfig: SortConfig = useMemo(() => {
    const sortBy = filterState.filters.sortBy || 'trade_date';
    const sortOrder = filterState.filters.sortOrder || 'desc';
    
    const matchingOption = TRADE_SORT_OPTIONS.find(
      option => option.field === sortBy && option.direction === sortOrder
    );
    
    return matchingOption || TRADE_SORT_OPTIONS[0];
  }, [filterState.filters.sortBy, filterState.filters.sortOrder]) as SortConfig;

  // Optimized sort change handler with debouncing
  const handleSortChange = useMemo(
    () => createSortDebouncedFunction((newSortConfig: SortConfig) => {
      filterActions.setFilters({
        sortBy: newSortConfig.field,
        sortOrder: newSortConfig.direction
      });
    }),
    [filterActions]
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-400 hidden sm:inline">Sort:</span>
      <EnhancedSortControls
        sortConfig={currentSortConfig}
        onSortChange={handleSortChange}
        options={TRADE_SORT_OPTIONS}
        disabled={disabled}
        className="min-w-[150px]"
      />
    </div>
  );
}