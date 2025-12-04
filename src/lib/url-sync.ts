'use client';

import { TradeFilterOptions, createDefaultTradeFilters } from './filtering-types';

// URL parameter mapping
const URL_PARAM_MAP = {
  symbol: 'symbol',
  market: 'market',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  pnlFilter: 'pnlFilter',
  strategyId: 'strategyId',
  side: 'side',
  emotionalStates: 'emotionalStates',
  sortBy: 'sortBy',
  sortOrder: 'sortOrder',
} as const;

// Default values for URL parameters
const URL_DEFAULTS = {
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
} as const;

/**
 * Parse URL parameters and return filter options
 */
export function parseURLParams(): Partial<TradeFilterOptions> {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const filters: Partial<TradeFilterOptions> = {};

  // Parse each parameter
  Object.entries(URL_PARAM_MAP).forEach(([filterKey, urlKey]) => {
    const value = params.get(urlKey);
    
    if (value !== null) {
      // Handle special cases
      if (filterKey === 'emotionalStates') {
        // Parse emotional states as comma-separated values
        (filters as any)[filterKey] = value.split(',').filter(s => s.trim());
      } else if (filterKey === 'pnlFilter') {
        // Validate pnlFilter values
        if (['all', 'profitable', 'lossable'].includes(value)) {
          (filters as any)[filterKey] = value;
        }
      } else if (filterKey === 'side') {
        // Validate side values
        if (['Buy', 'Sell', ''].includes(value)) {
          (filters as any)[filterKey] = value;
        }
      } else if (filterKey === 'market') {
        // Validate market values
        if (['stock', 'crypto', 'forex', 'futures', ''].includes(value)) {
          (filters as any)[filterKey] = value;
        }
      } else {
        // Direct assignment for other fields
        (filters as any)[filterKey] = value;
      }
    }
  });

  return filters;
}

/**
 * Update URL parameters with current filter state
 */
export function updateURLParams(filters: Partial<TradeFilterOptions>): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  // Update parameters based on current filters
  Object.entries(URL_PARAM_MAP).forEach(([filterKey, urlKey]) => {
    const value = filters[filterKey as keyof TradeFilterOptions];
    
    if (value !== undefined && value !== null && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      // Handle special cases
      if (filterKey === 'emotionalStates') {
        params.set(urlKey, (value as string[]).join(','));
      } else {
        params.set(urlKey, String(value));
      }
    } else {
      // Remove parameter if value is empty or default
      params.delete(urlKey);
    }
  });

  // Update URL without triggering a page reload
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newURL);
}

/**
 * Debounced version of updateURLParams
 */
export function debouncedURLUpdate(
  filters: Partial<TradeFilterOptions>,
  delay: number = 500
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      updateURLParams(filters);
    }, delay);
  };
}

/**
 * Initialize filters from URL parameters
 */
export function initializeFromURL(): TradeFilterOptions {
  const urlFilters = parseURLParams();
  return {
    ...createDefaultTradeFilters(),
    ...urlFilters,
  };
}

/**
 * Get URL parameter as a specific type
 */
export function getURLParam(key: keyof typeof URL_PARAM_MAP): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get(URL_PARAM_MAP[key]);
}

/**
 * Set a single URL parameter
 */
export function setURLParam(
  key: keyof typeof URL_PARAM_MAP,
  value: string | string[] | null
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const urlKey = URL_PARAM_MAP[key];

  if (value !== null && value !== undefined && value !== '' && 
      (!Array.isArray(value) || value.length > 0)) {
    if (Array.isArray(value)) {
      params.set(urlKey, value.join(','));
    } else {
      params.set(urlKey, String(value));
    }
  } else {
    params.delete(urlKey);
  }

  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newURL);
}

/**
 * Clear all URL parameters
 */
export function clearURLParams(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  
  // Remove all filter-related parameters
  Object.values(URL_PARAM_MAP).forEach(urlKey => {
    params.delete(urlKey);
  });

  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newURL);
}

/**
 * Create a shareable URL with current filters
 */
export function createShareableURL(filters: Partial<TradeFilterOptions>): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams();

  // Add filter parameters
  Object.entries(URL_PARAM_MAP).forEach(([filterKey, urlKey]) => {
    const value = filters[filterKey as keyof TradeFilterOptions];
    
    if (value !== undefined && value !== null && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      if (filterKey === 'emotionalStates') {
        params.set(urlKey, (value as string[]).join(','));
      } else {
        params.set(urlKey, String(value));
      }
    }
  });

  const baseURL = `${window.location.origin}${window.location.pathname}`;
  return `${baseURL}${params.toString() ? '?' + params.toString() : ''}`;
}

/**
 * Validate URL parameter values
 */
export function validateURLParam(
  key: keyof typeof URL_PARAM_MAP,
  value: string
): boolean {
  switch (key) {
    case 'pnlFilter':
      return ['all', 'profitable', 'lossable'].includes(value);
    case 'side':
      return ['Buy', 'Sell', ''].includes(value);
    case 'market':
      return ['stock', 'crypto', 'forex', 'futures', ''].includes(value);
    case 'sortBy':
      return ['trade_date', 'symbol', 'pnl', 'entry_price', 'quantity'].includes(value);
    case 'sortOrder':
      return ['asc', 'desc'].includes(value);
    default:
      return true; // No specific validation for other fields
  }
}

/**
 * Get sort-specific URL parameters
 */
export function getSortURLParams(): { sortBy?: string; sortOrder?: 'asc' | 'desc' } {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const sortBy = params.get('sortBy');
  const sortOrder = params.get('sortOrder') as 'asc' | 'desc' | null;

  return {
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined
  };
}

/**
 * Update only sort-related URL parameters
 */
export function updateSortURLParams(sortBy: string, sortOrder: 'asc' | 'desc'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  
  // Update sort parameters
  params.set('sortBy', sortBy);
  params.set('sortOrder', sortOrder);

  // Update URL without triggering a page reload
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newURL);
}

/**
 * Clear sort-related URL parameters (reset to defaults)
 */
export function clearSortURLParams(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  
  // Remove sort parameters to reset to defaults
  params.delete('sortBy');
  params.delete('sortOrder');

  // Update URL without triggering a page reload
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newURL);
}

/**
 * Create a shareable URL with specific sort parameters
 */
export function createSortableURL(
  filters: Partial<TradeFilterOptions>,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams();

  // Add filter parameters
  Object.entries(URL_PARAM_MAP).forEach(([filterKey, urlKey]) => {
    const value = filters[filterKey as keyof TradeFilterOptions];
    
    if (value !== undefined && value !== null && value !== '' &&
        (!Array.isArray(value) || value.length > 0)) {
      if (filterKey === 'emotionalStates') {
        params.set(urlKey, (value as string[]).join(','));
      } else {
        params.set(urlKey, String(value));
      }
    }
  });

  // Ensure sort parameters are set
  params.set('sortBy', sortBy);
  params.set('sortOrder', sortOrder);

  const baseURL = `${window.location.origin}${window.location.pathname}`;
  return `${baseURL}${params.toString() ? '?' + params.toString() : ''}`;
}

/**
 * Get filter state from URL for bookmarking/sharing
 */
export function getFilterStateForBookmark(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.search;
}

/**
 * Apply bookmarked filter state
 */
export function applyBookmarkedFilterState(searchParams: string): Partial<TradeFilterOptions> {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(searchParams);
  const filters: Partial<TradeFilterOptions> = {};

  Object.entries(URL_PARAM_MAP).forEach(([filterKey, urlKey]) => {
    const value = params.get(urlKey);
    
    if (value !== null && validateURLParam(filterKey as keyof typeof URL_PARAM_MAP, value)) {
      if (filterKey === 'emotionalStates') {
        (filters as any)[filterKey] = value.split(',').filter(s => s.trim());
      } else {
        (filters as any)[filterKey] = value;
      }
    }
  });

  return filters;
}