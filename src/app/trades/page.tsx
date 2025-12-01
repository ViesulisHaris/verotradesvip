'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';
import MarketBadge from '@/components/ui/MarketBadge';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, DollarSign, Target, Timer, Edit, Trash2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { validateUUID } from '@/lib/uuid-validation';
import { fetchTradesPaginated, getAvailableSymbols, getAvailableStrategies } from '@/lib/optimized-queries';
import { PaginationOptions, PaginatedResult } from '@/lib/pagination';
import { memoizedTradeProcessing, createDebouncedFunction } from '@/lib/memoization';
import EnhancedFilterControls from '@/components/ui/EnhancedFilterControls';
import EnhancedSortControls, { SortIndicator } from '@/components/ui/EnhancedSortControls';
import {
  TradeFilterOptions,
  SortConfig,
  TRADE_SORT_OPTIONS
} from '@/lib/filtering-types';
import {
  createDefaultTradeFilters,
  saveTradeFilters,
  loadTradeFilters,
  useFilterSync,
  getFilterStats as getFilterStatsFromPersistence
} from '@/lib/filter-persistence';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext-simple';
import {
  forceCleanupNavigationBlockers,
  safeNavigation,
  initializeNavigationSafety,
  resetNavigationSafetyFlags,
  handleTradesPageNavigation
} from '@/lib/navigation-safety';
import { startMenuFreezingLogger, exportMenuFreezingLogs } from '@/lib/menu-freezing-logger';

interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  trade_date: string;
  entry_time?: string;
  exit_time?: string;
  emotional_state?: string;
  strategies?: {
    id: string;
    name: string;
    rules?: string[];
  };
  notes?: string;
  market?: string;
}

// Helper function to calculate trade duration
const calculateTradeDuration = (entryTime?: string, exitTime?: string): string | null => {
  if (!entryTime || !exitTime) {
    return null;
  }

  try {
    // Parse the times
    const [entryHours, entryMinutes] = entryTime.split(':').map(Number);
    const [exitHours, exitMinutes] = exitTime.split(':').map(Number);
    
    // Create date objects for the same day
    const entryDate = new Date();
    entryDate.setHours(entryHours || 0, entryMinutes || 0);
    
    const exitDate = new Date();
    exitDate.setHours(exitHours || 0, exitMinutes || 0);
    
    // Calculate duration in milliseconds
    let durationMs = exitDate.getTime() - entryDate.getTime();
    
    // Handle overnight trades (if exit time is earlier than entry time)
    if (durationMs < 0) {
      // Add 24 hours to handle overnight trades
      durationMs += 24 * 60 * 60 * 1000;
    }
    
    // Convert to hours, minutes, seconds
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Format the duration string
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    console.error('Error calculating trade duration:', error);
    return null;
  }
};

function TradesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginatedResult<Trade> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<TradeFilterOptions>(createDefaultTradeFilters());
  const [sortConfig, setSortConfig] = useState<SortConfig>(TRADE_SORT_OPTIONS[0] || { field: 'trade_date', direction: 'desc', label: 'Date (Newest First)' }); // Default: Date (Newest First)
  
  // Memoize filters and sortConfig to prevent recreation on every render
  const memoizedFilters = useMemo(() => JSON.stringify(filters), [filters]);
  const memoizedSortConfig = useMemo(() => JSON.stringify(sortConfig), [sortConfig]);
  const [availableSymbols, setAvailableSymbols] = useState<Array<{ value: string; label: string; count: number }>>([]);
  const [availableStrategies, setAvailableStrategies] = useState<Array<{ id: string; name: string }>>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  // REMOVED: overlayCleanup state as it was causing unnecessary re-renders
  // const [overlayCleanup, setOverlayCleanup] = useState(false);

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetchTrades = useMemo(() => {
    return createDebouncedFunction(async (page: number, filters: TradeFilterOptions, sort: SortConfig) => {
      console.log('🔍 INFINITE RENDER DEBUG: debouncedFetchTrades called with:', { page, filters, sort });
      if (!user) return;
      
      try {
        setLoading(true);
        const paginationOptions: PaginationOptions = {
          page,
          limit: pageSize,
          sortBy: sort.field,
          sortOrder: sort.direction,
          ...filters
        };

        const result = await fetchTradesPaginated(user.id, paginationOptions);
        setPagination(result);
        setTrades(result.data);
      } catch (err) {
        setError('Error fetching trades');
        console.error('Error fetching trades:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [user?.id, pageSize, memoizedFilters, memoizedSortConfig]); // Include memoized dependencies

  // FIXED: Modal cleanup function with navigation safety improvements
  const cleanupModalOverlays = useCallback(() => {
    console.log('🧹 TradesPage: Cleaning up modal overlays for navigation safety...');
    console.log('🔍 TRADES PAGE DEBUG: cleanupModalOverlays called - FIXED VERSION');
    console.log('🔍 INFINITE RENDER DEBUG: cleanupModalOverlays function called', {
      timestamp: Date.now(),
      showEditModal,
      showDeleteConfirm,
      editingTrade: !!editingTrade,
      deletingTradeId
    });
    
    // CRITICAL DIAGNOSTIC: Check if this cleanup is being called during navigation
    const currentPath = window.location?.pathname;
    const isOnTradesPage = currentPath?.includes('/trades');
    const navigationInProgress = (window as any).navigationSafety?.isNavigating || false;
    
    // ENHANCED DIAGNOSTIC: Log current state when cleanup is called
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Cleanup triggered - checking navigation state');
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Current pathname:', currentPath);
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Is on trades page:', isOnTradesPage);
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Navigation in progress:', navigationInProgress);
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Active element:', document.activeElement?.tagName, document.activeElement?.className);
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Modal states:', {
      showEditModal,
      showDeleteConfirm,
      editingTrade: !!editingTrade,
      deletingTradeId
    });
    
    // CRITICAL FIX: Skip cleanup entirely if not on Trades page to prevent navigation interference
    if (!isOnTradesPage) {
      console.log('🚫 CRITICAL TRADES PAGE DIAGNOSTIC: Cleanup called from non-Trades page - SKIPPING CLEANUP to prevent navigation interference!');
      console.log('🔍 TRADES PAGE DIAGNOSTIC: This is the root cause - cleanup interfering with other pages');
      return;
    }
    
    // CRITICAL DIAGNOSTIC: If cleanup is called during navigation, it might be the issue
    if (navigationInProgress) {
      console.log('🚫 CRITICAL TRADES PAGE DIAGNOSTIC: Cleanup called during navigation - this might be blocking navigation!');
    }
    
    // CRITICAL FIX: Only run cleanup if there are actually open modals
    if (!showEditModal && !showDeleteConfirm && !editingTrade && !deletingTradeId) {
      console.log('🚨 TRADES PAGE DIAGNOSTIC: No open modals detected - SKIPPING CLEANUP to prevent navigation interference');
      return;
    }
    
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Open modals detected - proceeding with cleanup');
    
    // FIXED: Less aggressive modal overlay removal - only remove actual modal overlays
    const modalSelectors = [
      '.modal-backdrop',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '.ReactModal__Overlay',
      '.ReactModal__Content'
      // REMOVED: '.fixed.inset-0', '[style*="position: fixed"]', '.fixed.z-50' etc. to avoid removing navigation elements
    ];
    
    const overlays = document.querySelectorAll(modalSelectors.join(', '));
    
    overlays.forEach(overlay => {
      const element = overlay as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      const zIndex = parseInt(computedStyle.zIndex) || 0;
      
      // CRITICAL FIX: Never remove navigation elements or their parents
      const isNavigationElement = element.closest('nav, a, [role="navigation"], .nav-link, .sidebar, .desktop-sidebar, header') !== null;
      
      // FIXED: More specific criteria - only remove actual modal elements
      const isActualModal = element.classList.contains('modal-backdrop') ||
                           element.getAttribute('aria-modal') === 'true' ||
                           element.classList.contains('ReactModal__Overlay') ||
                           element.classList.contains('ReactModal__Content');
      
      // ENHANCED DIAGNOSTIC: Log all elements being evaluated for removal
      console.log('🚨 TRADES PAGE DIAGNOSTIC: Evaluating element for removal:', {
        element: element.tagName,
        className: element.className,
        id: element.id,
        zIndex,
        position: computedStyle.position,
        pointerEvents: computedStyle.pointerEvents,
        isActualModal,
        isNavigationElement,
        willRemove: isActualModal && !isNavigationElement
      });
      
      // CRITICAL FIX: Only remove if it's actually a modal AND not a navigation element
      if (isActualModal && !isNavigationElement) {
        console.log('🗑️ TradesPage: Removing actual modal overlay:', element, 'z-index:', zIndex);
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      } else if (isNavigationElement) {
        console.log('🛑 TRADES PAGE CRITICAL: Skipping navigation element to prevent blocking:', element);
      } else {
        // DEBUG: Log skipped elements to ensure we're not removing navigation elements
        console.log('🔍 TRADES PAGE DEBUG: Skipping non-modal element:', {
          element: element.tagName,
          className: element.className,
          zIndex,
          position: computedStyle.position
        });
      }
    });
    
    // Reset modal states
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setEditingTrade(null);
    setDeletingTradeId(null);
    
    // Gentle body cleanup - only remove modal-related classes
    document.body.classList.remove('modal-open', 'overflow-hidden', 'ReactModal__Body--open');
    
    // FIXED: Only remove specific problematic styles, not all styles
    const bodyStyle = document.body.getAttribute('style');
    if (bodyStyle) {
      // Only remove pointer-events: none if it exists
      if (bodyStyle.includes('pointer-events: none')) {
        document.body.style.pointerEvents = '';
      }
      // Only remove overflow: hidden if it exists
      if (bodyStyle.includes('overflow: hidden')) {
        document.body.style.overflow = '';
      }
    }
    
    // CRITICAL FIX: Only ensure navigation elements are interactive if they're blocked
    const navElements = document.querySelectorAll('nav a, [role="navigation"] a, .nav-link, .sidebar a, .desktop-sidebar a, header a');
    navElements.forEach(nav => {
      const element = nav as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      // Only fix if pointer-events is actually none
      if (computedStyle.pointerEvents === 'none') {
        console.log('🔧 TRADES PAGE FIX: Restoring pointer-events for navigation element:', element);
        element.style.pointerEvents = 'auto';
        // Also ensure parent elements don't block clicks
        let parent = element.parentElement;
        while (parent) {
          if (window.getComputedStyle(parent).pointerEvents === 'none') {
            parent.style.pointerEvents = 'auto';
            console.log('🔧 TRADES PAGE FIX: Restoring pointer-events for parent element:', parent);
          }
          parent = parent.parentElement;
        }
      }
    });
    
    // Trigger cleanup state change - FIXED: Remove rapid state updates that could cause re-renders
    // The overlayCleanup state is not actually used anywhere in the component, so we can remove these state updates
    console.log('🔍 INFINITE RENDER DEBUG: Skipping overlayCleanup state updates to prevent re-renders');
    // setOverlayCleanup(true);
    // setTimeout(() => {
    //   console.log('🔍 INFINITE RENDER DEBUG: Setting overlayCleanup state to false after timeout');
    //   setOverlayCleanup(false);
    // }, 50);
    
    console.log('✅ TRADES PAGE: Cleanup completed successfully');
  }, [showEditModal, showDeleteConfirm, editingTrade, deletingTradeId]);

  // DEBUG: Log when cleanupModalOverlays is recreated
  useEffect(() => {
    console.log('🔍 INFINITE RENDER DEBUG: cleanupModalOverlays function recreated', {
      showEditModal,
      showDeleteConfirm,
      editingTrade: !!editingTrade,
      deletingTradeId,
      timestamp: Date.now()
    });
  }, [cleanupModalOverlays]);

  // NEW: Make cleanup function globally accessible with enhanced reliability
  useEffect(() => {
    // Export cleanup function to global scope for access from other components
    (window as any).cleanupModalOverlays = cleanupModalOverlays;
    
    // Add fallback for direct access with multiple aliases
    (window as any).forceCleanupAllOverlays = cleanupModalOverlays;
    (window as any).tradesPageCleanup = cleanupModalOverlays;
    
    // Also add to navigation safety object if it exists
    if ((window as any).navigationSafety) {
      (window as any).navigationSafety.tradesPageCleanup = cleanupModalOverlays;
    }
    
    // Log successful export for debugging
    console.log('🔗 TradesPage: Modal cleanup function exported to global scope');
    
    return () => {
      // Clean up global reference on unmount
      delete (window as any).cleanupModalOverlays;
      delete (window as any).forceCleanupAllOverlays;
      delete (window as any).tradesPageCleanup;
      if ((window as any).navigationSafety) {
        delete (window as any).navigationSafety.tradesPageCleanup;
      }
      console.log('🗑️ TradesPage: Modal cleanup function removed from global scope');
    };
  }, [cleanupModalOverlays]);

  // ENHANCED: Navigation click handler with comprehensive safety
  const handleNavigationClick = useCallback((href: string, label: string) => {
    // CRITICAL DIAGNOSTIC: Check if this navigation function is being called
    const navigationSafetyState = (window as any).navigationSafety || {};
    const isNavigationBlocked = navigationSafetyState.isNavigating || navigationSafetyState.userInteractionInProgress;
    
    console.log('🖱️ TradesPage: Navigation click attempted:', {
      href,
      label,
      timestamp: Date.now(),
      navigationSafetyState: {
        isNavigating: navigationSafetyState.isNavigating,
        userInteractionInProgress: navigationSafetyState.userInteractionInProgress,
        navigationStartTime: navigationSafetyState.navigationStartTime,
        lastCleanupTime: navigationSafetyState.lastCleanupTime
      },
      isNavigationBlocked,
      currentPath: window.location?.pathname
    });
    
    // CRITICAL DIAGNOSTIC: If navigation is blocked, log it and reset flags
    if (isNavigationBlocked) {
      console.log('🚫 CRITICAL TRADES PAGE DIAGNOSTIC: Navigation blocked by navigation safety flags - resetting flags and retrying');
      resetNavigationSafetyFlags();
    }
    
    // Use special Trades page navigation handling
    console.log('🚨 TRADES PAGE DIAGNOSTIC: Using special Trades page navigation handling...');
    handleTradesPageNavigation(href, label);
  }, []);

  useEffect(() => {
    // Initialize navigation safety on component mount
    initializeNavigationSafety();
    
    // Start menu freezing logger to capture real-time data
    startMenuFreezingLogger();
    
    // Load saved filters
    const savedFilters = loadTradeFilters();
    if (savedFilters) {
      setFilters(savedFilters);
    }
    
    // Load available symbols and strategies for autocomplete
    if (user) {
      const loadFilterOptions = async () => {
        try {
          const [symbolsData, strategiesData] = await Promise.all([
            getAvailableSymbols(user.id),
            getAvailableStrategies(user.id)
          ]);
          setAvailableSymbols(symbolsData);
          setAvailableStrategies(strategiesData);
        } catch (error) {
          console.warn('Failed to load filter options:', error);
        }
      };
      
      loadFilterOptions();
    }
    
    // Export logs on unmount for analysis
    return () => {
      const logs = exportMenuFreezingLogs();
      console.log('🔍 MENU FREEZING LOGS EXPORTED:', logs);
    };
  }, [user]);

  // Fetch trades when page, filters, or sort change
  useEffect(() => {
    console.log('🔍 INFINITE RENDER DEBUG: useEffect for fetching trades triggered', {
      currentPage,
      filters,
      sortConfig,
      userId: user?.id,
      timestamp: Date.now()
    });
    
    if (!user) return;
    
    // Create a simple debounced function inside useEffect to avoid circular dependencies
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const paginationOptions: PaginationOptions = {
          page: currentPage,
          limit: pageSize,
          sortBy: sortConfig.field,
          sortOrder: sortConfig.direction,
          ...filters
        };

        const result = await fetchTradesPaginated(user.id, paginationOptions);
        setPagination(result);
        setTrades(result.data);
      } catch (err) {
        setError('Error fetching trades');
        console.error('Error fetching trades:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, filters, sortConfig, user?.id, pageSize]);

  // Save filters when they change
  useEffect(() => {
    if (user) {
      saveTradeFilters(memoizedFilters);
    }
  }, [memoizedFilters, user]);

  // Sync filters across tabs
  useEffect(() => {
    return useFilterSync((state) => {
      if (state && user) {
        setFilters(state.trades);
      }
    });
  }, [user, setFilters]);

  // ENHANCED: Add cleanup effect that runs when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 TradesPage unmounting - performing comprehensive cleanup');
      
      // CRITICAL FIX: Only run cleanup if we're actually on the Trades page
      const currentPath = window.location?.pathname || '';
      if (currentPath.includes('/trades')) {
        console.log('🧹 TradesPage: On Trades page - running cleanup');
        cleanupModalOverlays();
        
        // Additional cleanup for any remaining overlays
        const remainingOverlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
        remainingOverlays.forEach(overlay => {
          const element = overlay as HTMLElement;
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      } else {
        console.log('🧹 TradesPage: NOT on Trades page - SKIPPING cleanup to prevent navigation interference');
      }
    };
  }, [cleanupModalOverlays]);

  // ENHANCED: Add page visibility change handler with reduced frequency
  useEffect(() => {
    let cleanupTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      // CRITICAL FIX: Only run cleanup if we're actually on the Trades page
      const currentPath = window.location?.pathname || '';
      if (currentPath.includes('/trades')) {
        console.log('🧹 TradesPage: On Trades page - handling visibility change');
        
        if (document.hidden) {
          // Debounce cleanup to prevent excessive calls
          clearTimeout(cleanupTimeout);
          cleanupTimeout = setTimeout(() => {
            cleanupModalOverlays();
          }, 100);
        } else {
          console.log('🧹 TradesPage: On Trades page - visibility changed, but page is visible');
        }
      } else {
        console.log('🧹 TradesPage: NOT on Trades page - SKIPPING visibility cleanup to prevent navigation interference');
      }
    };

    const handleBeforeUnload = () => {
      // CRITICAL FIX: Only run cleanup if we're actually on the Trades page
      const currentPath = window.location?.pathname || '';
      if (currentPath.includes('/trades')) {
        console.log('🧹 TradesPage: On Trades page - handling beforeunload');
        cleanupModalOverlays();
      } else {
        console.log('🧹 TradesPage: NOT on Trades page - SKIPPING beforeunload cleanup to prevent navigation interference');
      }
    };

    // Add event listeners for additional cleanup triggers
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(cleanupTimeout);
    };
  }, [cleanupModalOverlays]);

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setShowEditModal(true);
  };

  const handleDeleteTrade = (tradeId: string) => {
    setDeletingTradeId(tradeId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingTradeId || !user) return;

    try {
      // Validate UUIDs before delete operation
      const validatedTradeId = validateUUID(deletingTradeId, 'trade_id');
      const validatedUserId = validateUUID(user.id, 'user_id');
      
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', validatedTradeId)
        .eq('user_id', validatedUserId);

      if (error) {
        setError(`Error deleting trade: ${error.message}`);
      } else {
        // Update the trades list to remove the deleted trade
        setTrades(prev => prev.filter(trade => trade.id !== deletingTradeId));
        
        // Trigger storage event to notify other pages (like confluence) to refresh
        localStorage.setItem('trade-deleted', Date.now().toString());
        
        setShowDeleteConfirm(false);
        setDeletingTradeId(null);
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting the trade');
      console.error('Error deleting trade:', err);
    }
  };

  const handleUpdateTrade = async (updatedTrade: Partial<Trade>) => {
    if (!editingTrade || !user) return;

    try {
      // Validate UUIDs before update operation
      const validatedTradeId = validateUUID(editingTrade.id, 'trade_id');
      const validatedUserId = validateUUID(user.id, 'user_id');
      
      // Use direct object assignment to avoid TypeScript issues with supabase
      const updateData = {
        symbol: updatedTrade.symbol || '',
        side: updatedTrade.side || 'Buy',
        quantity: updatedTrade.quantity || 0,
        entry_price: updatedTrade.entry_price || 0,
        exit_price: updatedTrade.exit_price,
        pnl: updatedTrade.pnl,
        trade_date: updatedTrade.trade_date || '',
        entry_time: updatedTrade.entry_time,
        exit_time: updatedTrade.exit_time,
        emotional_state: updatedTrade.emotional_state,
        notes: updatedTrade.notes || '',
        market: updatedTrade.market || '',
      };
      
      const { error } = await (supabase
        .from('trades')
        .update(updateData as any)
        .eq('id', validatedTradeId)
        .eq('user_id', validatedUserId) as any);

      if (error) {
        setError(`Error updating trade: ${error.message}`);
      } else {
        // Update the trades list with the updated trade
        setTrades(prev => prev.map(trade =>
          trade.id === editingTrade.id
            ? { ...trade, ...updatedTrade }
            : trade
        ));
        setShowEditModal(false);
        setEditingTrade(null);
      }
    } catch (err) {
      setError('An unexpected error occurred while updating the trade');
      console.error('Error updating trade:', err);
    }
  };

  return (
    <div className="verotrade-content-wrapper">
      {/* Main container with exact spacing */}
      <div className="mb-section">
        
        {/* Header Section - Exact Typography and Styling */}
        <div className="mb-component">
          <h1 className="h1-dashboard mb-element">Trade History</h1>
          <p className="body-text mb-element">View and expand your past trades for detailed information</p>
        </div>

        {/* Filters Section - Responsive Grid Layout */}
        <div className="dashboard-card mb-component">
          <h2 className="h2-section mb-component">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-element mb-component">
            <div>
              <label className="block label-text mb-2">Symbol</label>
              <input
                type="text"
                value={filters.symbol}
                onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="Search symbol..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block label-text mb-2">Market</label>
              <select
                value={filters.market}
                onChange={(e) => setFilters(prev => ({ ...prev, market: e.target.value as TradeFilterOptions['market'] }))}
                className="input-field"
              >
                <option value="">All Markets</option>
                <option value="stock">Stocks</option>
                <option value="crypto">Crypto</option>
                <option value="forex">Forex</option>
                <option value="futures">Futures</option>
              </select>
            </div>
            <div>
              <label className="block label-text mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block label-text mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-button-group">
            <button
              onClick={() => setFilters({ symbol: '', market: '', dateFrom: '', dateTo: '' })}
              className="button-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Stats Section - 4-Column Grid Layout */}
        {pagination && pagination.totalCount > 0 && (
          <div className="key-metrics-grid mb-component">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-opacity-20 bg-dusty-gold flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                  </div>
                  <h3 className="h3-metric-label">Total Trades</h3>
                </div>
              </div>
              <p className="metric-value">{pagination.totalCount}</p>
            </div>
            
            <div className="dashboard-card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                  <h3 className="h3-metric-label">Total P&L</h3>
                </div>
              </div>
              <p className={`metric-value ${(pagination.data.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0) >= 0 ? '' : 'text-rust-red'}`} 
                 style={{ color: (pagination.data.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0) >= 0 ? 'var(--warm-off-white)' : 'var(--rust-red)' }}>
                {formatCurrency(pagination.data.reduce((sum, t) => sum + (t.pnl || 0), 0))}
              </p>
            </div>
            
            <div className="dashboard-card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                  <h3 className="h3-metric-label">Win Rate</h3>
                </div>
              </div>
              <p className="metric-value">
                {(() => {
                  if (pagination.data.length === 0) return '0%';
                  const winRate = (pagination.data.filter(t => (t.pnl || 0) > 0).length / pagination.data.length) * 100;
                  return `${winRate.toFixed(1)}%`;
                })()}
              </p>
            </div>
            
            <div className="dashboard-card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: 'var(--dusty-gold)' }} />
                  <h3 className="h3-metric-label">Page</h3>
                </div>
              </div>
              <p className="metric-value">
                {currentPage} of {pagination.totalPages}
              </p>
            </div>
          </div>
        )}

        {/* Pagination Controls - Clean Styling and Responsive Behavior */}
        {pagination && pagination.totalPages > 1 && (
          <div className="dashboard-card mb-component">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="label-text">Trades per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="input-field w-auto"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
             
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="button-secondary p-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="body-text font-medium px-3">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="button-secondary p-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Page Numbers */}
            <div className="flex items-center justify-center gap-1 mt-4">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                const isEllipsis = pageNum === 5 && pagination.totalPages > 5;
                
                if (isEllipsis) {
                  return <span key="ellipsis" className="secondary-text px-2">...</span>;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-all min-h-[44px] ${
                      isActive
                        ? 'button-primary'
                        : 'button-secondary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Trades List - Updated with 12px Border Radius */}
        {trades.length === 0 ? (
          <div className="dashboard-card p-section text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-component" style={{ color: 'var(--muted-gray)' }} />
            <h3 className="h2-section mb-element">No trades yet</h3>
            <p className="body-text mb-component">Start logging your trades to see them here</p>
            <button
              onClick={() => window.location.href = '/log-trade'}
              className="button-primary"
            >
              Log Your First Trade
            </button>
          </div>
        ) : (
          <div className="gap-component">
            {/* Table Header with Sort Controls */}
            <div className="dashboard-card p-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-muted-gray mb-2 sm:mb-3">
                <div></div> {/* Spacer for expand/collapse */}
                <SortIndicator
                  field="trade_date"
                  currentSort={sortConfig}
                  onSort={(fieldDirection) => {
                    const [field, direction] = fieldDirection.split('-');
                    const newSortConfig = TRADE_SORT_OPTIONS.find(opt =>
                      opt.field === field && opt.direction === direction
                    );
                    if (newSortConfig) {
                      setSortConfig(newSortConfig);
                    }
                  }}
                  label="Date"
                />
                <SortIndicator
                  field="symbol"
                  currentSort={sortConfig}
                  onSort={(fieldDirection) => {
                    const [field, direction] = fieldDirection.split('-');
                    const newSortConfig = TRADE_SORT_OPTIONS.find(opt =>
                      opt.field === field && opt.direction === direction
                    );
                    if (newSortConfig) {
                      setSortConfig(newSortConfig);
                    }
                  }}
                  label="Symbol"
                />
                <SortIndicator
                  field="entry_price"
                  currentSort={sortConfig}
                  onSort={(fieldDirection) => {
                    const [field, direction] = fieldDirection.split('-');
                    const newSortConfig = TRADE_SORT_OPTIONS.find(opt =>
                      opt.field === field && opt.direction === direction
                    );
                    if (newSortConfig) {
                      setSortConfig(newSortConfig);
                    }
                  }}
                  label="Entry Price"
                />
                <SortIndicator
                  field="pnl"
                  currentSort={sortConfig}
                  onSort={(fieldDirection) => {
                    const [field, direction] = fieldDirection.split('-');
                    const newSortConfig = TRADE_SORT_OPTIONS.find(opt =>
                      opt.field === field && opt.direction === direction
                    );
                    if (newSortConfig) {
                      setSortConfig(newSortConfig);
                    }
                  }}
                  label="P&L"
                />
                <SortIndicator
                  field="quantity"
                  currentSort={sortConfig}
                  onSort={(fieldDirection) => {
                    const [field, direction] = fieldDirection.split('-');
                    const newSortConfig = TRADE_SORT_OPTIONS.find(opt =>
                      opt.field === field && opt.direction === direction
                    );
                    if (newSortConfig) {
                      setSortConfig(newSortConfig);
                    }
                  }}
                  label="Quantity"
                />
                <div></div> {/* Spacer for actions */}
              </div>
            </div>

            {trades.map((trade) => (
              <div key={trade.id} className="dashboard-card overflow-hidden transform transition-all hover:translate-y-[-2px] hover:shadow-card-hover">
                {/* Trade Summary - Always Visible */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          trade.side === 'Buy' ? 'bg-opacity-20' : 'bg-opacity-20'
                        }`} style={{ backgroundColor: trade.side === 'Buy' ? 'rgba(184, 155, 94, 0.2)' : 'rgba(167, 53, 45, 0.2)' }}>
                          <span className={`text-sm font-bold ${
                            trade.side === 'Buy' ? 'text-dusty-gold' : 'text-rust-red'
                          }`}>
                            {trade.side === 'Buy' ? 'B' : 'S'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* Compact Symbol Display */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-gray font-medium uppercase tracking-wider">SYMBOL</span>
                              <h3 className="text-sm font-bold body-text bg-opacity-10 px-2 py-1 rounded-lg border" 
                                 style={{ backgroundColor: 'rgba(184, 155, 94, 0.1)', borderColor: 'var(--dusty-gold)' }}>
                                {trade.symbol || 'N/A'}
                              </h3>
                            </div>
                            {/* Compact Market Type Display - Same size as symbol */}
                            {trade.market && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-gray font-medium uppercase tracking-wider">MARKET</span>
                                <MarketBadge market={trade.market} size="compact" />
                              </div>
                            )}
                          </div>
                          <p className="body-text text-sm">
                            {new Date(trade.trade_date).toLocaleDateString()} • {trade.quantity} shares
                          </p>
                          {(() => {
                            const duration = calculateTradeDuration(trade.entry_time, trade.exit_time);
                            return duration ? (
                              <div className="flex items-center gap-1 mt-1">
                                <Timer className="w-3 h-3" style={{ color: 'var(--dusty-gold)' }} />
                                <span className="text-xs" style={{ color: 'var(--dusty-gold)' }}>{duration}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      {trade.strategies && (
                        <div className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(184, 155, 94, 0.1)' }}>
                          <span className="text-sm" style={{ color: 'var(--dusty-gold)' }}>{trade.strategies.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          (trade.pnl || 0) >= 0 ? 'text-dusty-gold' : 'text-rust-red'
                        }`} style={{ color: (trade.pnl || 0) >= 0 ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                          {formatCurrency(trade.pnl || 0)}
                        </p>
                        <p className="body-text text-sm">
                          ${trade.entry_price} {trade.exit_price && `→ $${trade.exit_price}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTrade(trade);
                            }}
                            className="p-3 rounded-lg transition-all min-h-[44px] min-w-[44px] hover:bg-opacity-10"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(184, 155, 94, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Edit trade"
                          >
                            <Edit className="w-4 h-4" style={{ color: 'var(--dusty-gold)' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrade(trade.id);
                            }}
                            className="p-3 rounded-lg transition-all min-h-[44px] min-w-[44px] hover:bg-opacity-10"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(167, 53, 45, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Delete trade"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: 'var(--rust-red)' }} />
                          </button>
                          <button
                            className="p-3 rounded-lg transition-all min-h-[44px] min-w-[44px] hover:bg-opacity-10"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 91, 74, 0.1)' }
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => toggleTradeExpansion(trade.id)}
                          >
                            {expandedTrades.has(trade.id) ? (
                              <ChevronUp className="w-5 h-5" style={{ color: 'var(--muted-gray)' }} />
                            ) : (
                              <ChevronDown className="w-5 h-5" style={{ color: 'var(--muted-gray)' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedTrades.has(trade.id) && (
                    <div className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Trade Details */}
                          <div>
                            <h4 className="h3-card-title text-sm mb-3 uppercase tracking-wider">Trade Details</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="secondary-text">Entry Price:</span>
                                <span className="body-text font-medium">${trade.entry_price}</span>
                              </div>
                              {trade.exit_price && (
                                <div className="flex justify-between">
                                  <span className="secondary-text">Exit Price:</span>
                                  <span className="body-text font-medium">${trade.exit_price}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="secondary-text">Quantity:</span>
                                <span className="body-text font-medium">{trade.quantity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="secondary-text">Side:</span>
                                <span className={`font-medium ${
                                  trade.side === 'Buy' ? 'text-dusty-gold' : 'text-rust-red'
                                }`} style={{ color: trade.side === 'Buy' ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                                  {trade.side}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="secondary-text">Symbol:</span>
                                <span className="text-sm font-bold body-text bg-opacity-10 px-2 py-1 rounded-lg border" 
                                   style={{ backgroundColor: 'rgba(184, 155, 94, 0.1)', borderColor: 'var(--dusty-gold)' }}>
                                  {trade.symbol || 'N/A'}
                                </span>
                              </div>
                              {trade.market && (
                                <div className="flex justify-between">
                                  <span className="secondary-text">Market:</span>
                                  <MarketBadge market={trade.market} size="compact" />
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="secondary-text">P&L:</span>
                                <span className={`font-bold ${
                                  (trade.pnl || 0) >= 0 ? 'text-dusty-gold' : 'text-rust-red'
                                }`} style={{ color: (trade.pnl || 0) >= 0 ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                                  {formatCurrency(trade.pnl || 0)}
                                </span>
                              </div>
                              {trade.entry_time && trade.exit_time && (
                                <div className="flex justify-between">
                                  <span className="secondary-text">Duration:</span>
                                  <span className="font-medium" style={{ color: 'var(--dusty-gold)' }}>
                                    {calculateTradeDuration(trade.entry_time, trade.exit_time)}
                                  </span>
                                </div>
                              )}
                              {trade.entry_time && (
                                <div className="flex justify-between">
                                  <span className="secondary-text">Entry Time:</span>
                                  <span className="body-text font-medium">{trade.entry_time}</span>
                                </div>
                              )}
                              {trade.exit_time && (
                                <div className="flex justify-between">
                                  <span className="secondary-text">Exit Time:</span>
                                  <span className="body-text font-medium">{trade.exit_time}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Strategy & Emotion */}
                          <div>
                            {trade.strategies ? (
                              <div className="mb-4">
                                <p className="secondary-text mb-2">Strategy: {trade.strategies.name}</p>
                                {trade.strategies.rules && trade.strategies.rules.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="secondary-text text-sm mb-2">Rules followed:</p>
                                    {trade.strategies.rules.map((rule, index) => (
                                      <div key={index} className="flex items-center gap-2 text-xs secondary-text">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--dusty-gold)' }}></div>
                                        {rule}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="secondary-text mb-4">No strategy assigned</p>
                            )}
                           
                            {trade.emotional_state && (
                              <div>
                                <p className="secondary-text mb-1">Emotional State:</p>
                                <div className="flex flex-wrap gap-1">
                                  {(() => {
                                    // Parse emotional state and display as formatted boxes
                                    let emotions: string[] = [];
                                    
                                    if (Array.isArray(trade.emotional_state)) {
                                      emotions = trade.emotional_state
                                        .filter(e => typeof e === 'string' && e.trim())
                                        .map(e => e.trim().toUpperCase());
                                    } else if (typeof trade.emotional_state === 'string') {
                                      const trimmed = trade.emotional_state.trim();
                                      if (trimmed) {
                                        // Quick check if it's JSON format
                                        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                                          try {
                                            const parsed = JSON.parse(trimmed);
                                            if (Array.isArray(parsed)) {
                                              emotions = parsed.map(e => typeof e === 'string' ? e.trim().toUpperCase() : e);
                                            } else if (typeof parsed === 'string') {
                                              emotions = [parsed.trim().toUpperCase()];
                                            }
                                          } catch {
                                            emotions = [trimmed.toUpperCase()];
                                          }
                                        } else {
                                          emotions = [trimmed.toUpperCase()];
                                        }
                                      }
                                    }
                                    
                                    return emotions.map((emotion, index) => {
                                      const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
                                        'FOMO': { bg: 'rgba(184, 155, 94, 0.1)', text: 'var(--dusty-gold)', border: 'var(--dusty-gold)' },
                                        'REVENGE': { bg: 'rgba(167, 53, 45, 0.1)', text: 'var(--rust-red)', border: 'var(--rust-red)' },
                                        'TILT': { bg: 'rgba(147, 51, 234, 0.1)', text: 'var(--dusty-gold)', border: 'var(--dusty-gold)' },
                                        'OVERRISK': { bg: 'rgba(184, 155, 94, 0.1)', text: 'var(--dusty-gold)', border: 'var(--dusty-gold)' },
                                        'PATIENCE': { bg: 'rgba(79, 91, 74, 0.1)', text: 'var(--muted-olive)', border: 'var(--muted-olive)' },
                                        'REGRET': { bg: 'rgba(184, 155, 94, 0.1)', text: 'var(--dusty-gold)', border: 'var(--dusty-gold)' },
                                        'DISCIPLINE': { bg: 'rgba(20, 184, 166, 0.1)', text: 'var(--muted-olive)', border: 'var(--muted-olive)' },
                                        'CONFIDENT': { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--dusty-gold)', border: 'var(--dusty-gold)' },
                                        'ANXIOUS': { bg: 'rgba(236, 72, 153, 0.1)', text: 'var(--dusty-gold)', border: 'var(--dusty-gold)' },
                                        'NEUTRAL': { bg: 'rgba(154, 154, 154, 0.1)', text: 'var(--muted-gray)', border: 'var(--muted-gray)' }
                                      };
                                      
                                      const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
                                      
                                      return (
                                        <div
                                          key={index}
                                          className="px-2 py-1 rounded-md text-xs border"
                                          style={{
                                            backgroundColor: emotionColor?.bg || 'rgba(154, 154, 154, 0.1)',
                                            color: emotionColor?.text || 'var(--muted-gray)',
                                            borderColor: emotionColor?.border || 'var(--muted-gray)'
                                          }}
                                        >
                                          {emotion}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Edit Modal */}
            {showEditModal && editingTrade && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50">
                <div className="dashboard-card p-6 sm:p-8 w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border" style={{ borderColor: 'rgba(184, 155, 94, 0.3)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="h2-section text-2xl">Edit Trade</h2>
                    <button
                      onClick={() => {
                        // NEW: Use enhanced cleanup
                        cleanupModalOverlays();
                        setShowEditModal(false);
                        setEditingTrade(null);
                      }}
                      className="p-2 rounded-lg transition-all"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 91, 74, 0.1)' }
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <XCircle className="w-5 h-5" style={{ color: 'var(--muted-gray)' }} />
                    </button>
                  </div>

                  <EditTradeForm
                    trade={editingTrade}
                    onSave={handleUpdateTrade}
                    onCancel={() => {
                      // NEW: Use enhanced cleanup
                      cleanupModalOverlays();
                      setShowEditModal(false);
                      setEditingTrade(null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50">
                <div className="dashboard-card p-6 sm:p-8 w-full max-w-full sm:max-w-md border" style={{ borderColor: 'rgba(167, 53, 45, 0.3)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(167, 53, 45, 0.1)' }}>
                      <Trash2 className="w-5 h-5" style={{ color: 'var(--rust-red)' }} />
                    </div>
                    <h2 className="h2-section text-xl">Delete Trade</h2>
                  </div>
                 
                  <p className="body-text mb-6">
                    Are you sure you want to delete this trade? This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletingTradeId(null);
                      }}
                      className="button-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 font-medium py-3 px-6 rounded-lg transition-all min-h-[44px] border"
                      style={{ 
                        backgroundColor: 'var(--rust-red)', 
                        color: 'var(--warm-off-white)',
                        borderColor: 'var(--rust-red)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(167, 53, 45, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--rust-red)';
                      }}
                    >
                      Delete Trade
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Edit Trade Form Component
interface EditTradeFormProps {
  trade: Trade;
  onSave: (updatedTrade: Partial<Trade>) => void;
  onCancel: () => void;
}

function EditTradeForm({ trade, onSave, onCancel }: EditTradeFormProps) {
  const [formData, setFormData] = useState({
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity.toString(),
    entry_price: trade.entry_price.toString(),
    exit_price: trade.exit_price?.toString() || '',
    pnl: trade.pnl?.toString() || '',
    trade_date: trade.trade_date,
    entry_time: trade.entry_time || '',
    exit_time: trade.exit_time || '',
    emotional_state: trade.emotional_state || '',
    market: trade.market || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateEmotionalState = (emotions: string[] | { [key: string]: boolean }) => {
    // Convert to string array if it's an object
    const emotionArray = Array.isArray(emotions) ? emotions : 
      Object.entries(emotions).filter(([_, isSelected]) => isSelected).map(([emotion]) => emotion);
    
    setFormData(prev => ({
      ...prev,
      emotional_state: emotionArray.length > 0 ? emotionArray.join(', ') : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedTrade = {
        symbol: formData.symbol,
        side: formData.side as 'Buy' | 'Sell',
        quantity: parseFloat(formData.quantity) || 0,
        entry_price: parseFloat(formData.entry_price) || 0,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
        trade_date: formData.trade_date,
        entry_time: formData.entry_time || undefined,
        exit_time: formData.exit_time || undefined,
        emotional_state: formData.emotional_state || undefined,
        market: formData.market,
      };

      await onSave(updatedTrade);
    } catch (error) {
      console.error('Error updating trade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block label-text mb-2">Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block label-text mb-2">Side</label>
          <select
            value={formData.side}
            onChange={(e) => setFormData({ ...formData, side: e.target.value as 'Buy' | 'Sell' })}
            className="input-field"
          >
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </div>
        <div>
          <label className="block label-text mb-2">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block label-text mb-2">Entry Price</label>
          <input
            type="number"
            value={formData.entry_price}
            onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block label-text mb-2">Exit Price</label>
          <input
            type="number"
            value={formData.exit_price || ''}
            onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block label-text mb-2">P&L</label>
          <input
            type="number"
            value={formData.pnl || ''}
            onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block label-text mb-2">Market</label>
          <input
            type="text"
            value={formData.market}
            onChange={(e) => setFormData({ ...formData, market: e.target.value })}
            placeholder="e.g., stock, crypto, forex, futures"
            className="input-field"
          />
        </div>
        <div>
          <label className="block label-text mb-2">Trade Date</label>
          <input
            type="date"
            value={formData.trade_date}
            onChange={(e) => setFormData({ ...formData, trade_date: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block label-text mb-2">Emotional State</label>
          <EmotionalStateInput
            value={typeof formData.emotional_state === 'string' ? formData.emotional_state.split(', ').filter(e => e.trim()) : formData.emotional_state}
            onChange={updateEmotionalState}
            placeholder="Select emotions you felt during this trade..."
            className="mt-2"
          />
        </div>
        <div>
          <label className="block label-text mb-2">Entry Time</label>
          <input
            type="time"
            value={formData.entry_time || ''}
            onChange={(e) => setFormData({ ...formData, entry_time: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block label-text mb-2">Exit Time</label>
          <input
            type="time"
            value={formData.exit_time || ''}
            onChange={(e) => setFormData({ ...formData, exit_time: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="button-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="button-primary flex-1 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// Wrapper component with authentication guard
function TradesPageWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <TradesPage />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default TradesPageWithAuth;