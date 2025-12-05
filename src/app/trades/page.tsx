'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';
import MarketBadge from '@/components/ui/MarketBadge';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, DollarSign, Target, Timer, Edit, Trash2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import EditTradeModal from '@/components/trades/EditTradeModal';
import DeleteTradeModal from '@/components/trades/DeleteTradeModal';
import { validateUUID } from '@/lib/uuid-validation';
import { fetchTradesPaginated, fetchTradesStatistics, getAvailableSymbols, getAvailableStrategies } from '@/lib/optimized-queries';
import { PaginationOptions, PaginatedResult } from '@/lib/pagination';
import { memoizedTradeProcessing, createFilterDebouncedFunction, createStatsDebouncedFunction } from '@/lib/memoization';
import EnhancedSortControls, { SortIndicator } from '@/components/ui/EnhancedSortControls';
import {
  TradeFilterOptions,
  SortConfig,
  TRADE_SORT_OPTIONS
} from '@/lib/filtering-types';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext-simple';
import { TradesFilterProvider, useTradesFilter } from '@/contexts/TradesFilterContext';
import TradesFilterBar from '@/components/trades/TradesFilterBar';
import TradesSortControls from '@/components/trades/TradesSortControls';
import {
  forceCleanupNavigationBlockers,
  safeNavigation,
  initializeNavigationSafety,
  resetNavigationSafetyFlags,
  handleTradesPageNavigation
} from '@/lib/navigation-safety';
import {
  performanceUtils,
  createFilterDebouncedFunction as createOptimizedFilterDebouncedFunction,
  createSortDebouncedFunction
} from '@/lib/performance-optimization';
import TorchCard from '@/components/TorchCard';

// Dynamic GSAP imports for proper Next.js SSR compatibility
const GSAPAnimations = dynamic(() => import('@/components/ui/GSAPAnimations'), {
  ssr: false,
  loading: () => null
});

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
  emotional_state?: string | string[];
  strategies?: {
    id: string;
    name: string;
    rules?: string[];
  };
  notes?: string;
  market?: string;
}

// Helper function to calculate trade duration - memoized to prevent infinite re-renders
const calculateTradeDuration = (() => {
  const cache = new Map<string, string | null>();
  
  return (entryTime?: string, exitTime?: string): string | null => {
    if (!entryTime || !exitTime) {
      return null;
    }

    // Create cache key
    const cacheKey = `${entryTime}-${exitTime}`;
    
    // Return cached result if available
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) || null;
    }

    try {
      // Parse the times
      const [entryHours, entryMinutes] = entryTime.split(':').map(Number);
      const [exitHours, exitMinutes] = exitTime.split(':').map(Number);
      
      // Use a fixed date for consistent calculations
      const baseDate = new Date(2000, 0, 1); // Fixed reference date
      const entryDate = new Date(baseDate);
      entryDate.setHours(entryHours || 0, entryMinutes || 0);
      
      const exitDate = new Date(baseDate);
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
      let result: string;
      if (hours > 0) {
        result = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        result = `${minutes}m`;
      } else {
        result = `${seconds}s`;
      }
      
      // Cache the result
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error calculating trade duration:', error);
      cache.set(cacheKey, null);
      return null;
    }
  };
})();

// Optimized text reveal animation hook with memoization
const useTextReveal = (text: string, delay: number = 0) => {
  const [revealedText, setRevealedText] = useState<React.ReactNode>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Memoize character elements to prevent recreation
    const chars = text.split('');
    const elements = chars.map((char, i) => (
      <span key={`${char}-${i}`} className="char" style={{
        animationDelay: `${delay + i * 0.03}s`,
        animation: 'textReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

    setRevealedText(
      <span className="reveal-text">
        {elements.map((el, i) => (
          <span key={i} className="char-wrapper">{el}</span>
        ))}
      </span>
    );
  }, [text, delay]);

  return revealedText;
};

// Optimized GSAP animations hook (moved to separate component)
const useGSAPAnimations = () => {
  // GSAP animations are now handled by the dynamically imported GSAPAnimations component
  // This hook is kept for compatibility but simplified
  useEffect(() => {
    // No-op - animations handled by GSAPAnimations component
  }, []);
};

// Memoize the main content component to prevent unnecessary re-renders
const TradesPageContent = memo(function TradesPageContent() {
  const { user } = useAuth();
  const { state: filterState, actions: filterActions } = useTradesFilter();
  const { filters } = filterState;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginatedResult<Trade> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Get sort state from filter context
  const sortConfig: SortConfig = useMemo(() => {
    const sortBy = filters.sortBy || 'trade_date';
    const sortOrder = filters.sortOrder || 'desc';
    
    const matchingOption = TRADE_SORT_OPTIONS.find(
      option => option.field === sortBy && option.direction === sortOrder
    );
    
    return matchingOption || TRADE_SORT_OPTIONS[0];
  }, [filters.sortBy, filters.sortOrder]) as SortConfig;
  
  // Use refs to store stable references
  const sortConfigRef = useRef(sortConfig);
  
  // Update refs only when values actually change
  useEffect(() => {
    sortConfigRef.current = sortConfig;
  }, [sortConfig]);
  
  const [availableSymbols, setAvailableSymbols] = useState<Array<{ value: string; label: string; count: number }>>([]);
  const [availableStrategies, setAvailableStrategies] = useState<Array<{ id: string; name: string }>>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [statistics, setStatistics] = useState<{
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
  } | null>(null);

  // Initialize custom hooks
  useGSAPAnimations();
  const titleRevealed = useTextReveal("Trade History", 0.5);
  

  // Ensure scroll items are visible after component mounts
  useEffect(() => {
    let timer: NodeJS.Timeout;
    timer = setTimeout(() => {
      const scrollItems = document.querySelectorAll('.scroll-item');
      scrollItems.forEach(item => {
        item.classList.add('visible');
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Simplified authentication state handling
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Load available symbols and strategies for autocomplete
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
  }, [user]);

  // Optimized fetch statistics function
  const fetchStatistics = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      // Call fetchTradesStatistics with the user ID and current filters
      const stats = await fetchTradesStatistics(user.id, {
        symbol: filters.symbol,
        market: filters.market,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        pnlFilter: filters.pnlFilter,
        side: filters.side,
        emotionalStates: filters.emotionalStates
      });
      
      // Set the statistics state with the returned data
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Don't set error state to avoid disrupting the UI, just log the error
    }
  }, [user?.id, filters]); // Include filters in dependencies

  // Optimized debounced functions using performance utilities
  const debouncedFetchStatistics = useMemo(() => {
    return createOptimizedFilterDebouncedFunction(fetchStatistics);
  }, [fetchStatistics]);

  const debouncedFetchTrades = useMemo(() => {
    return createOptimizedFilterDebouncedFunction(async (page: number, filters: TradeFilterOptions, sort: SortConfig) => {
      if (!user) return;
      
      try {
        setLoading(true);
        const paginationOptions: PaginationOptions & {
          strategyId?: string;
          symbol?: string;
          market?: string;
          dateFrom?: string;
          dateTo?: string;
          pnlFilter?: 'all' | 'profitable' | 'lossable';
          side?: 'Buy' | 'Sell' | '';
          emotionalStates?: string[];
        } = {
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching trades:', err);
        }
      } finally {
        setLoading(false);
      }
    });
  }, [user?.id, pageSize]);

  // Simplified modal cleanup function
  const cleanupModalOverlays = useCallback(() => {
    // Only remove actual modal overlays
    const modalSelectors = [
      '.modal-backdrop',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '.ReactModal__Overlay',
      '.ReactModal__Content'
    ];
    
    const overlays = document.querySelectorAll(modalSelectors.join(', '));
    
    overlays.forEach(overlay => {
      const element = overlay as HTMLElement;
      const isActualModal = element.classList.contains('modal-backdrop') ||
                           element.getAttribute('aria-modal') === 'true' ||
                           element.classList.contains('ReactModal__Overlay') ||
                           element.classList.contains('ReactModal__Content');
      
      if (isActualModal && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Clean up body classes
    document.body.classList.remove('modal-open', 'overflow-hidden', 'ReactModal__Body--open');
  }, []);

  useEffect(() => {
    // Initialize navigation safety on component mount
    initializeNavigationSafety();
  }, []);

  // Simplified effect for trades fetching - using the new filter context
  useEffect(() => {
    // Only fetch if we have a valid user with ID
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    // Validate user ID format
    try {
      validateUUID(user.id, 'user_id');
    } catch (error) {
      console.error('Invalid user ID format:', error);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    // Simple direct fetch without debouncing to avoid issues
    const fetchTrades = async () => {
      try {
        const paginationOptions: PaginationOptions & {
          strategyId?: string;
          symbol?: string;
          market?: string;
          dateFrom?: string;
          dateTo?: string;
          pnlFilter?: 'all' | 'profitable' | 'lossable';
          side?: 'Buy' | 'Sell' | '';
          emotionalStates?: string[];
        } = {
          page: currentPage,
          limit: pageSize,
          sortBy: sortConfig.field,
          sortOrder: sortConfig.direction,
          ...filters
        };

        const result = await fetchTradesPaginated(user.id, paginationOptions);
        
        setPagination(result);
        setTrades(result?.data || []);
        
        // Also fetch statistics when we fetch trades
        if (user) {
          try {
            const stats = await fetchTradesStatistics(user.id, {
              symbol: filters.symbol,
              market: filters.market,
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
              pnlFilter: filters.pnlFilter,
              side: filters.side,
              emotionalStates: filters.emotionalStates
            });
            setStatistics(stats);
          } catch (statsError) {
            console.error('Error fetching statistics:', statsError);
          }
        }
      } catch (err) {
        setError('Error fetching trades');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrades();
  }, [currentPage, pageSize, user?.id, filters, sortConfig]);

  // Combined cleanup effect with performance tracking
  useEffect(() => {
    const performCleanup = () => {
      const currentPath = window.location?.pathname || '';
      if (currentPath.includes('/trades')) {
        cleanupModalOverlays();
        
        // Optimized overlay cleanup with batch DOM operations
        const remainingOverlays = document.querySelectorAll('.fixed.inset-0, .modal-backdrop, [role="dialog"]');
        if (remainingOverlays.length > 0) {
          const fragment = document.createDocumentFragment();
          remainingOverlays.forEach(overlay => {
            if (overlay.parentNode) {
              fragment.appendChild(overlay);
            }
          });
          fragment.textContent = '';
        }
      }
    };

    // Track cleanup timeout for memory management
    const cleanupTimeout = performanceUtils.trackTimeout(
      setTimeout(performCleanup, 100),
      'trades-page-cleanup'
    );

    // Track event listeners for cleanup
    const handleVisibilityChange = performanceUtils.createThrottled(() => {
      if (document.hidden) {
        performCleanup();
      }
    }, 100);

    const handleBeforeUnload = () => {
      performCleanup();
    };

    performanceUtils.trackEventListener(document, 'visibilitychange', handleVisibilityChange, 'trades-page-visibility');
    performanceUtils.trackEventListener(window, 'beforeunload', handleBeforeUnload, 'trades-page-unload');

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(cleanupTimeout as unknown as NodeJS.Timeout);
    };
  }, [cleanupModalOverlays]);

  // Optimized trade expansion with memory management
  const toggleTradeExpansion = useCallback((tradeId: string) => {
    setExpandedTrades(prev => {
      // Limit expanded trades to prevent memory issues with large datasets
      if (prev.size >= 10 && !prev.has(tradeId)) {
        return prev;
      }
      
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  }, []);

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setShowEditModal(true);
  };

  const handleDeleteTrade = (trade: Trade) => {
    setDeletingTrade(trade);
  };

  const confirmDelete = async (tradeId: string) => {
    if (!user) return;

    try {
      setIsDeleting(true);
      // Validate UUIDs before delete operation
      const validatedTradeId = validateUUID(tradeId, 'trade_id');
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
        setTrades(prev => prev.filter(trade => trade.id !== tradeId));
        
        // Trigger storage event to notify other pages (like confluence) to refresh
        localStorage.setItem('trade-deleted', Date.now().toString());
        
        setDeletingTrade(null);
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting the trade');
      console.error('Error deleting trade:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTrade = async (updatedTrade: Partial<Trade>) => {
    if (!editingTrade || !user) return;

    try {
      // Validate UUIDs before update operation
      const validatedTradeId = validateUUID(editingTrade.id, 'trade_id');
      const validatedUserId = validateUUID(user.id, 'user_id');
      
      // Handle emotional_state conversion from array to string if needed
      let emotionalStateValue: string | undefined;
      if (updatedTrade.emotional_state) {
        if (Array.isArray(updatedTrade.emotional_state)) {
          emotionalStateValue = updatedTrade.emotional_state.join(', ');
        } else {
          emotionalStateValue = updatedTrade.emotional_state;
        }
      }
      
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
        emotional_state: emotionalStateValue,
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
    <div className="min-h-screen flex flex-col antialiased">
      {/* Main Content */}
      <main className="flex-grow pt-4 px-6 lg:px-12 max-w-[1800px] w-full mx-auto pb-20">
        
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="font-serif text-5xl md:text-6xl text-white mb-4">
            {titleRevealed}
          </h1>
          <p className="text-gray-400 max-w-xl text-lg font-light tracking-wide scroll-item">
            Review your trading performance, analyze P&L, and refine your strategies.
          </p>
        </header>

        {/* GSAP Animations Component */}
        <GSAPAnimations />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat Card 1 */}
          <TorchCard className="scroll-item p-6">
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
              Trades
            </div>
            <div className="text-3xl font-mono text-white font-medium">
              {statistics?.totalTrades || pagination?.totalCount || 0}
            </div>
          </TorchCard>

           {/* Stat Card 2 */}
           <TorchCard className="scroll-item p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Total P&L
              </div>
              <div className="text-3xl font-mono text-white font-medium">
                {formatCurrency(statistics?.totalPnL || 0)}
              </div>
          </TorchCard>

           {/* Stat Card 3 */}
           <TorchCard className="scroll-item p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Win Rate
              </div>
              <div className="text-3xl font-mono text-white font-medium">
                {statistics && statistics.winRate !== null ? `${statistics.winRate.toFixed(1)}%` : '0%'}
              </div>
          </TorchCard>

          {/* Stat Card 4 */}
          <TorchCard className="scroll-item p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Top Emotion
              </div>
              <div className="text-3xl font-serif italic text-torch-orange-light capitalize">
                {(() => {
                  // Calculate the most common emotion from trades data
                  if (!trades || trades.length === 0) return 'Neutral';
                  
                  const emotionCounts: Record<string, number> = {};
                  
                  trades.forEach(trade => {
                    if (trade.emotional_state) {
                      // Handle comma-separated emotions
                      const emotions = typeof trade.emotional_state === 'string'
                        ? trade.emotional_state.split(',').map(e => e.trim())
                        : trade.emotional_state;
                      emotions.forEach(emotion => {
                        if (emotion) {
                          // Clean emotion name by removing brackets, parentheses, and extra formatting
                          const cleanEmotion = emotion.replace(/[\[\](){}]/g, '').trim();
                          if (cleanEmotion) {
                            emotionCounts[cleanEmotion] = (emotionCounts[cleanEmotion] || 0) + 1;
                          }
                        }
                      });
                    }
                  });
                  
                  // If no emotions found, return Neutral
                  if (Object.keys(emotionCounts).length === 0) return 'Neutral';
                  
                  // Find the most common emotion
                  let mostCommonEmotion = 'Neutral';
                  let maxCount = 0;
                  
                  Object.entries(emotionCounts).forEach(([emotion, count]) => {
                    if (count > maxCount) {
                      maxCount = count;
                      mostCommonEmotion = emotion;
                    }
                  });
                  
                  return mostCommonEmotion;
                })()}
              </div>
          </TorchCard>
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          <TradesFilterBar />
          
          {/* Sort Controls Section */}
          <TorchCard className="mb-4 p-4">
            <TradesSortControls />
          </TorchCard>
        </div>

        {/* Trades Table Area */}
        <div className="scroll-item">
          {/* Controls */}
          <TorchCard className="mb-6 p-4">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-4">
                <TorchCard className="p-2">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                    className="bg-surface border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-gold"
                  >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                  </select>
                </TorchCard>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">Page <span className="text-white font-mono">{currentPage}</span> of <span className="text-white font-mono">{pagination?.totalPages || 1}</span></span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded border border-white/10 hover:border-gold hover:text-gold text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination?.totalPages || 1, prev + 1))}
                    disabled={currentPage === (pagination?.totalPages || 1)}
                    className="w-8 h-8 flex items-center justify-center rounded border border-white/10 hover:border-gold hover:text-gold text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </TorchCard>

          {/* Headers */}
          <TorchCard className="px-6 py-4 mb-4">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-widest">
              <div className="col-span-2">Date / Time</div>
              <div className="col-span-2">Symbol</div>
              <div className="col-span-2 text-right">Entry Price</div>
              <div className="col-span-2 text-right">P&L</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right flex items-center justify-end gap-2">
                <span>Status</span>
              </div>
            </div>
          </TorchCard>

          {/* Trade Rows Container */}
          <div className="space-y-3 mt-4 min-h-[200px] relative z-10">
            {trades.map((trade) => {
                const isWin = (trade.pnl || 0) > 0;
                const pnlClass = isWin ? 'text-profit' : 'text-loss';
                const pnlSign = isWin ? '+' : '';
                const pnlFormatted = pnlSign + formatCurrency(Math.abs(trade.pnl || 0));
               
                return (
                  <TorchCard key={trade.id} className="scroll-item mb-3 group relative">
                    {/* Main Row Content */}
                    <div className="relative z-10 px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => toggleTradeExpansion(trade.id)}>
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <div className="text-sm text-white font-medium">{new Date(trade.trade_date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500 mt-1">{trade.entry_time || 'N/A'}</div>
                          </div>
                          <div className="col-span-2 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-xs font-bold text-gold font-serif">
                              {trade.symbol.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-white tracking-wide">{trade.symbol}</div>
                              {trade.market && (
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-800 rounded px-1.5 py-0.5">
                                  {trade.market}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-mono text-sm text-gray-300">${trade.entry_price ? trade.entry_price.toFixed(2) : '0.00'}</div>
                          <div className="col-span-2 text-right font-mono text-sm font-bold">{pnlFormatted}</div>
                          <div className="col-span-2 text-right text-sm text-gray-400">
                            {trade.quantity} <span className="text-xs text-gray-600">shares</span>
                          </div>
                          <div className="col-span-2 flex justify-end items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-profit shadow-[0_0_8px_rgba(46,189,133,0.5)]' : 'bg-loss shadow-[0_0_8px_rgba(246,70,93,0.5)]'}`}></div>
                               <span className="text-xs text-gray-500 italic cursor-pointer">
                                 {expandedTrades.has(trade.id) ? 'Click to collapse' : 'Click to expand'}
                               </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <div className={`accordion-content bg-[#080808] border-t border-white/5 relative z-10 ${expandedTrades.has(trade.id) ? 'active' : ''}`}>
                        <div className="p-8">
                          <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trade Details</h3>
                            <div className="h-px bg-white/10 flex-grow"></div>
                          </div>
                            
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entry Price</div>
                              <div className="text-base font-mono text-white">${trade.entry_price ? trade.entry_price.toFixed(2) : '0.00'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Exit Price</div>
                              <div className="text-base font-mono text-white">
                                {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total P&L</div>
                              <div className={`text-lg font-mono font-bold ${pnlClass}`}>{pnlFormatted}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Duration</div>
                              <div className="text-base text-white font-serif italic">
                                {calculateTradeDuration(trade.entry_time, trade.exit_time) || 'N/A'}
                              </div>
                            </div>
                             
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Strategy</div>
                              {trade.strategies ? (
                                <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gold-light">
                                  {trade.strategies.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">No strategy</span>
                              )}
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Emotional State</div>
                              {trade.emotional_state ? (
                                <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400 uppercase tracking-wide">
                                  {trade.emotional_state}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Not recorded</span>
                              )}
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Side</div>
                              <span className={`${trade.side === 'Buy' ? 'text-profit' : 'text-loss'} font-medium text-sm uppercase`}>
                                {trade.side}
                              </span>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Actions</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTrade(trade);
                                  }}
                                  className="px-3 py-1.5 bg-[#1A1A1A]/80 hover:bg-[#2A2A2A]/80 border border-white/10 hover:border-torch-orange/40 rounded-lg transition-all flex items-center gap-1.5 text-xs text-gray-300 hover:text-torch-orange backdrop-blur-sm"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTrade(trade);
                                  }}
                                  className="px-3 py-1.5 bg-[#1A1A1A]/80 hover:bg-[#2A2A2A]/80 border border-white/10 hover:border-red-400/40 rounded-lg transition-all flex items-center gap-1.5 text-xs text-gray-300 hover:text-red-400 backdrop-blur-sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TorchCard>
                );
              })}
             
            {/* No trades message */}
            {!loading && trades.length === 0 && (
              <TorchCard className="p-section text-center relative z-10">
                  <TrendingUp className="w-16 h-16 mx-auto mb-component" style={{ color: 'var(--muted-gray)' }} />
                  <h3 className="h2-section mb-element">No trades yet</h3>
                  <p className="body-text mb-component">
                    {user
                      ? "Start logging your trades to see them here"
                      : "Please log in to view your trades"}
                  </p>
                  <button
                    onClick={() => window.location.href = user ? '/log-trade' : '/login'}
                    className="button-primary"
                  >
                    {user ? 'Log Your First Trade' : 'Log In'}
                  </button>
                </TorchCard>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        <EditTradeModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTrade(null);
          }}
          trade={editingTrade ? {
            ...editingTrade,
            emotional_state: editingTrade.emotional_state
              ? (typeof editingTrade.emotional_state === 'string'
                  ? editingTrade.emotional_state.split(', ').filter(e => e.trim())
                  : editingTrade.emotional_state)
              : undefined
          } : null}
          onSave={handleUpdateTrade}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteTradeModal
          isOpen={!!deletingTrade}
          onClose={() => setDeletingTrade(null)}
          trade={deletingTrade ? {
            ...deletingTrade,
            emotional_state: deletingTrade.emotional_state
              ? (typeof deletingTrade.emotional_state === 'string'
                  ? deletingTrade.emotional_state.split(', ').filter(e => e.trim())
                  : deletingTrade.emotional_state)
              : undefined
          } : null}
          onDelete={confirmDelete}
          isLoading={isDeleting}
        />
      </main>
    </div>
  );
});


// Main page component with authentication guard
export default function TradesPage() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <TradesFilterProvider>
          <TradesPageContent />
        </TradesFilterProvider>
      </UnifiedLayout>
    </AuthGuard>
  );
}