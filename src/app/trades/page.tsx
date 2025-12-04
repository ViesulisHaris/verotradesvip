'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';
import MarketBadge from '@/components/ui/MarketBadge';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, DollarSign, Target, Timer, Edit, Trash2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  emotional_state?: string;
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

// Optimized flashlight effect hook with throttling
const useFlashlightEffect = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = performanceUtils.createThrottled((e: Event) => {
      const cards = document.querySelectorAll('.flashlight-container, .flashlight-row');
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        for(const card of cards) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
          (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
        }
      });
    }, 16); // ~60fps throttling

    // Track event listener for cleanup
    performanceUtils.trackEventListener(document, 'mousemove', handleMouseMove, 'flashlight-effect');
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  
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
  useFlashlightEffect();
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
      clearTimeout(cleanupTimeout);
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
    <div className="min-h-screen flex flex-col antialiased">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center transition-all duration-500">
        <div className="max-w-[1800px] w-full mx-auto px-6 lg:px-12 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 flex items-center justify-center">
               <span className="font-serif text-3xl text-gold italic font-bold">V</span>
               <span className="font-serif text-3xl text-gold absolute left-3 top-0">T</span>
            </div>
            <span className="font-serif text-xl tracking-wide text-white group-hover:text-gold transition-colors duration-300">VeroTrade</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined">dashboard</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gold bg-gold/10 border border-gold/20">
              <span className="material-symbols-outlined">candlestick_chart</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined">school</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-4">
             <button className="btn-beam px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase text-gray-300 group">
                <div className="btn-beam-content rounded-full bg-background px-4">
                  <span className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">logout</span> Logout
                  </span>
                </div>
             </button>
             <div className="w-9 h-9 rounded bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-black font-serif font-bold text-lg shadow-[0_0_15px_rgba(197,160,101,0.4)]">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 px-6 lg:px-12 max-w-[1800px] w-full mx-auto pb-20">
        
        {/* Header Section */}
        <header className="mb-12">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Stat Card 1 */}
          <div className="flashlight-container rounded-2xl p-6 scroll-item">
            <div className="flashlight-bg"></div>
            <div className="flashlight-border"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                Trades
              </div>
              <div className="text-3xl font-mono text-white font-medium">
                {statistics?.totalTrades || pagination?.totalCount || 0}
              </div>
            </div>
          </div>

           {/* Stat Card 2 */}
           <div className="flashlight-container rounded-2xl p-6 scroll-item">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                      Total P&L
                  </div>
                  <div className="text-3xl font-mono text-white font-medium">
                    {formatCurrency(statistics?.totalPnL || 0)}
                  </div>
              </div>
          </div>

           {/* Stat Card 3 */}
           <div className="flashlight-container rounded-2xl p-6 scroll-item">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                      Win Rate
                  </div>
                  <div className="text-3xl font-mono text-white font-medium">
                    {statistics ? `${statistics.winRate.toFixed(1)}%` : '0%'}
                  </div>
              </div>
          </div>

          {/* Stat Card 4 */}
          <div className="flashlight-container rounded-2xl p-6 scroll-item">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                      Avg Emotion
                  </div>
                  <div className="text-3xl font-serif italic text-gold-light">Neutral</div>
              </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          <TradesFilterBar />
          
          {/* Sort Controls Section */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-gold">sort</span>
              Sort Options
            </h3>
            <TradesSortControls />
          </div>
        </div>

        {/* Trades Table Area */}
        <div className="scroll-item">
          {/* Controls */}
          <div className="flex flex-wrap justify-between items-center mb-6 px-1">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Trades per page:</span>
              <div className="relative w-20">
                   <select
                     value={pageSize}
                     onChange={(e) => {
                       setPageSize(Number(e.target.value));
                       setCurrentPage(1); // Reset to first page when changing page size
                     }}
                     className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-gold"
                   >
                       <option value={10}>10</option>
                       <option value={25}>25</option>
                       <option value={50}>50</option>
                       <option value={100}>100</option>
                   </select>
              </div>
              
              {/* Current sort indicator for mobile */}
              <div className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <span className="text-xs text-blue-400">Sort:</span>
                <span className="text-sm text-white truncate max-w-[120px]">{sortConfig.label}</span>
              </div>
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

          {/* Headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-widest">
            <div className="col-span-2">Date / Time</div>
            <div className="col-span-2">Symbol</div>
            <div className="col-span-2 text-right">Entry Price</div>
            <div className="col-span-2 text-right">P&L</div>
            <div className="col-span-2 text-right">Quantity</div>
            <div className="col-span-2 text-right flex items-center justify-end gap-2">
              <span>Status</span>
              {/* Sort indicator on desktop */}
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-blue-600/10 border border-blue-500/20 rounded text-xs">
                <span className="text-blue-400">Sort:</span>
                <span className="text-white truncate max-w-[100px]">{sortConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Trade Rows Container */}
          <div className="space-y-3 mt-4 min-h-[200px] relative z-10">
            {trades.map((trade) => {
                const isWin = (trade.pnl || 0) > 0;
                const pnlClass = isWin ? 'text-profit' : 'text-loss';
                const pnlSign = isWin ? '+' : '';
                const pnlFormatted = pnlSign + formatCurrency(Math.abs(trade.pnl || 0));
                
                return (
                  <div key={trade.id} className="flashlight-container rounded-lg overflow-hidden scroll-item mb-3 group">
                    <div className="flashlight-bg"></div>
                    <div className="flashlight-border"></div>
                    
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
                        <div className="col-span-2 text-right font-mono text-sm text-gray-300">${trade.entry_price.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-mono text-sm font-bold">{pnlFormatted}</div>
                        <div className="col-span-2 text-right text-sm text-gray-400">
                          {trade.quantity} <span className="text-xs text-gray-600">shares</span>
                        </div>
                        <div className="col-span-2 flex justify-end items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-profit shadow-[0_0_8px_rgba(46,189,133,0.5)]' : 'bg-loss shadow-[0_0_8px_rgba(246,70,93,0.5)]'}`}></div>
                             <span className={`material-symbols-outlined text-gray-600 chevron-icon ${expandedTrades.has(trade.id) ? 'rotate' : ''}`}>
                               expand_more
                             </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <div className={`accordion-content bg-[#080808] border-t border-white/5 relative z-10 ${expandedTrades.has(trade.id) ? 'active' : ''}`}>
                      <div className="p-8 grid grid-cols-12 gap-8">
                         
                        {/* Left Info */}
                        <div className="col-span-12 md:col-span-8">
                          <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trade Details</h3>
                            <div className="h-px bg-white/10 flex-grow"></div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entry Price</div>
                              <div className="text-base font-mono text-white">${trade.entry_price.toFixed(2)}</div>
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
                                  className="hover:text-gold transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTrade(trade.id);
                                  }}
                                  className="hover:text-loss transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Decor/Chart Placeholder */}
                        <div className="col-span-12 md:col-span-4 flex items-center justify-center bg-white/[0.02] rounded-lg border border-white/5 min-h-[150px] relative overflow-hidden group/chart">
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-0 group-hover/chart:opacity-100 transition-opacity"></div>
                          <div className="text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-700 mb-2 group-hover/chart:text-gold transition-colors">show_chart</span>
                            <p className="text-xs text-gray-600 uppercase tracking-widest">Price Action Replay</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            
            {/* No trades message */}
            {!loading && trades.length === 0 && (
              <div className="dashboard-card p-section text-center relative z-10">
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
                </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingTrade && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50">
            <div className="dashboard-card p-6 sm:p-8 w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border" style={{ borderColor: 'rgba(184, 155, 94, 0.3)' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="h2-section text-2xl">Edit Trade</h2>
                <button
                  onClick={() => {
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
      </main>
    </div>
  );
});

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