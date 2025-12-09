'use client';

import { useState, useEffect, useRef, memo } from 'react';
import Head from 'next/head';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, DollarSign, Target, Timer, Edit, Trash2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { validateUUID } from '@/lib/uuid-validation';
import { useAuth } from '@/contexts/AuthContext-simple';
import { EditTradeModal, DeleteTradeModal } from '@/components/modals';
import { fetchWithJWTValidation, validateJWTWithLogging } from '@/lib/jwt-validation';

// Trade interface
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
    
    // Use a fixed date for consistent calculations
    const baseDate = new Date(2000, 0, 1);
    const entryDate = new Date(baseDate);
    entryDate.setHours(entryHours || 0, entryMinutes || 0);
    
    const exitDate = new Date(baseDate);
    exitDate.setHours(exitHours || 0, exitMinutes || 0);
    
    // Calculate duration in milliseconds
    let durationMs = exitDate.getTime() - entryDate.getTime();
    
    // Handle overnight trades
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000;
    }
    
    // Convert to hours, minutes, seconds
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    // Format the duration string
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${totalSeconds % 60}s`;
    }
  } catch (error) {
    console.error('Error calculating trade duration:', error);
    return null;
  }
};

// Flashlight effect hook
const useFlashlightEffect = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.flashlight-container, .flashlight-row');
      
      requestAnimationFrame(() => {
        for(const card of cards) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
          (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};

// DetailItem component
const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-base text-white">{value}</div>
  </div>
);

// InputGroup component
const InputGroup = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  options 
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}) => {
  const inputElement = type === 'select' ? (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold"
      required={required}
    >
      {options?.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  ) : (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold"
      required={required}
    />
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      {inputElement}
    </div>
  );
};


// TradeItem component
const TradeItem = ({ 
  trade, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete 
}: {
  trade: Trade;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const isWin = (trade.pnl || 0) > 0;
  const pnlClass = isWin ? 'text-profit' : 'text-loss';
  const pnlSign = (trade.pnl || 0) >= 0 ? '+' : '-';
  const pnlFormatted = pnlSign + formatCurrency(Math.abs(trade.pnl || 0));

  return (
    <div className="flashlight-container rounded-lg overflow-hidden mb-3 group">
      <div className="flashlight-bg"></div>
      <div className="flashlight-border"></div>
      
      {/* Main Row Content */}
      <div
        className="relative z-10 px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-2">
            <div className="text-sm text-white font-medium">{new Date(trade.trade_date).toLocaleDateString()}</div>
            <div className="text-xs text-gray-500 mt-1">{trade.entry_time || 'N/A'}</div>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs font-bold text-gold font-serif">
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
            <span className={`material-symbols-outlined text-gray-600 chevron-icon ${isExpanded ? 'rotate' : ''}`}>
              click to expand
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`accordion-content bg-surface border-t border-white/5 relative z-10 ${isExpanded ? 'active' : ''}`}>
        <div className="p-8">
          {/* Trade Details - Full Width */}
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trade Details</h3>
            <div className="h-px bg-white/10 flex-grow"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailItem
              label="Entry Price"
              value={`$${trade.entry_price.toFixed(2)}`}
            />
            <DetailItem
              label="Exit Price"
              value={trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : 'N/A'}
            />
            <DetailItem
              label="Total P&L"
              value={<span className={`text-lg font-mono font-bold ${pnlClass}`}>{pnlFormatted}</span>}
            />
            <DetailItem
              label="Duration"
              value={
                <span className="text-white font-serif italic">
                  {calculateTradeDuration(trade.entry_time, trade.exit_time) || 'N/A'}
                </span>
              }
            />
            
            <DetailItem
              label="Strategy"
              value={
                trade.strategies ? (
                  <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gold-light">
                    {trade.strategies.name}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">No strategy</span>
                )
              }
            />
            <DetailItem
              label="Emotional State"
              value={
                trade.emotional_state ? (
                  <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400 uppercase tracking-wide">
                    {trade.emotional_state}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Not recorded</span>
                )
              }
            />
            <DetailItem
              label="Side"
              value={
                <span className={`${trade.side === 'Buy' ? 'text-profit' : 'text-loss'} font-medium text-sm uppercase`}>
                  {trade.side}
                </span>
              }
            />
            <DetailItem
              label="Actions"
              value={
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="hover:text-gold transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="hover:text-loss transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              }
            />
          </div>
          
          {trade.notes && (
            <div className="mt-6">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Notes</div>
              <p className="text-sm text-gray-300 italic">{trade.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main TradeHistory component
const TradeHistory = () => {
  const { user, session } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTradesForStats, setAllTradesForStats] = useState<Trade[]>([]);
  
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // Sorting state
  const [sorting, setSorting] = useState({
    sortBy: 'trade_date',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Initialize flashlight effect
  useFlashlightEffect();

  // Fetch all trades for statistics calculation
  const fetchAllTradesForStats = async () => {
    if (!user || !session) return [];

    try {
      // DEBUG: Log JWT token details before large request
      const token = session.access_token;
      console.log('🔍 [JWT_DEBUG] fetchAllTradesForStats - Token analysis:', {
        tokenLength: token?.length || 0,
        tokenSegments: token?.split('.').length || 0,
        tokenStart: token?.substring(0, 20) + '...',
        tokenEnd: '...' + token?.substring(token.length - 20),
        timestamp: new Date().toISOString()
      });

      // Build query parameters to get all trades
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Get all trades
        sortBy: 'trade_date',
        sortOrder: 'desc'
      });
      
      const requestStartTime = Date.now();
      const response = await fetchWithJWTValidation(
        `/api/confluence-trades?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        },
        'fetchAllTradesForStats'
      );
      const requestDuration = Date.now() - requestStartTime;
      
      console.log('🔍 [JWT_DEBUG] fetchAllTradesForStats - Request completed:', {
        requestDuration: `${requestDuration}ms`,
        responseStatus: response.status,
        responseOk: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch all trades for stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match the Trade interface
      const transformedTrades: Trade[] = data.trades.map((trade: any) => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        pnl: trade.pnl,
        trade_date: trade.trade_date,
        entry_time: trade.entry_time,
        exit_time: trade.exit_time,
        emotional_state: Array.isArray(trade.emotional_state)
          ? trade.emotional_state.join(', ')
          : trade.emotional_state,
        strategies: trade.strategies,
        notes: trade.notes,
        market: trade.market
      }));

      return transformedTrades;
    } catch (err) {
      console.error('Error fetching all trades for stats:', err);
      return [];
    }
  };

  // Fetch trades from API
  const fetchTrades = async (page?: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    if (!user || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // DEBUG: Log JWT token details before small request
      const token = session.access_token;
      console.log('🔍 [JWT_DEBUG] fetchTrades - Token analysis:', {
        tokenLength: token?.length || 0,
        tokenSegments: token?.split('.').length || 0,
        tokenStart: token?.substring(0, 20) + '...',
        tokenEnd: '...' + token?.substring(token.length - 20),
        timestamp: new Date().toISOString()
      });
      
      // Build query parameters
      const params = new URLSearchParams({
        page: (page || pagination.currentPage).toString(),
        limit: '50',
        sortBy: sortBy || sorting.sortBy,
        sortOrder: sortOrder || sorting.sortOrder
      });
      
      const requestStartTime = Date.now();
      const response = await fetchWithJWTValidation(
        `/api/confluence-trades?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        },
        'fetchTrades'
      );
      const requestDuration = Date.now() - requestStartTime;
      
      console.log('🔍 [JWT_DEBUG] fetchTrades - Request completed:', {
        requestDuration: `${requestDuration}ms`,
        responseStatus: response.status,
        responseOk: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match the Trade interface
      const transformedTrades: Trade[] = data.trades.map((trade: any) => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        pnl: trade.pnl,
        trade_date: trade.trade_date,
        entry_time: trade.entry_time,
        exit_time: trade.exit_time,
        emotional_state: Array.isArray(trade.emotional_state)
          ? trade.emotional_state.join(', ')
          : trade.emotional_state,
        strategies: trade.strategies,
        notes: trade.notes,
        market: trade.market
      }));

      setTrades(transformedTrades);
      
      // Update pagination state
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage
      });
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting change
  const handleSortChange = (sortBy: string) => {
    const newSortOrder = sorting.sortBy === sortBy && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    setSorting({ sortBy, sortOrder: newSortOrder });
    fetchTrades(pagination.currentPage, sortBy, newSortOrder);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    fetchTrades(page, sorting.sortBy, sorting.sortOrder);
  };

  // Fetch trades on component mount and when user/session changes
  useEffect(() => {
    if (user && session) {
      fetchTrades();
      // Also fetch all trades for statistics
      fetchAllTradesForStats().then(allTrades => {
        setAllTradesForStats(allTrades);
      });
    } else {
      setLoading(false);
    }
  }, [user, session]);

  // Toggle trade expansion
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

  // Handle edit trade
  const handleEditTrade = (trade: Trade) => {
    console.log('🎭 [TradeHistory] Edit trade requested:', trade);
    setEditingTrade(trade);
    setShowEditModal(true);
  };

  // Handle delete trade
  const handleDeleteTrade = (tradeId: string) => {
    console.log('🎭 [TradeHistory] Delete trade requested:', tradeId);
    setDeletingTradeId(tradeId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingTradeId || !session) return;

    try {
      const response = await fetchWithJWTValidation(
        `/api/trades/${deletingTradeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        },
        'deleteTrade'
      );

      if (!response.ok) {
        throw new Error(`Failed to delete trade: ${response.statusText}`);
      }

      // Update local state to remove the deleted trade
      setTrades(prev => prev.filter(trade => trade.id !== deletingTradeId));
      // Also update allTradesForStats
      setAllTradesForStats(prev => prev.filter(trade => trade.id !== deletingTradeId));
      setShowDeleteConfirm(false);
      setDeletingTradeId(null);
      console.log('🎭 [TradeHistory] Trade deleted successfully');
    } catch (error) {
      console.error('🎭 [TradeHistory] Error deleting trade:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete trade');
    }
  };

  // Handle update trade
  const handleUpdateTrade = async (updatedTrade: Partial<Trade>) => {
    if (!editingTrade || !session) return;

    try {
      const response = await fetchWithJWTValidation(
        `/api/trades/${editingTrade.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedTrade)
        },
        'updateTrade'
      );

      if (!response.ok) {
        throw new Error(`Failed to update trade: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state with the updated trade
      setTrades(prev => prev.map(trade =>
        trade.id === editingTrade.id
          ? { ...trade, ...data.trade }
          : trade
      ));
      // Also update allTradesForStats
      setAllTradesForStats(prev => prev.map(trade =>
        trade.id === editingTrade.id
          ? { ...trade, ...data.trade }
          : trade
      ));
      setShowEditModal(false);
      setEditingTrade(null);
      console.log('🎭 [TradeHistory] Trade updated successfully');
    } catch (error) {
      console.error('🎭 [TradeHistory] Error updating trade:', error);
      setError(error instanceof Error ? error.message : 'Failed to update trade');
    }
  };

  // Helper function to get most frequent emotion
  const getMostFrequentEmotion = (tradesList: Trade[]): string => {
    const emotionCounts: { [key: string]: number } = {};
    
    tradesList.forEach(trade => {
      if (trade.emotional_state) {
        const emotions = trade.emotional_state.split(',').map(e => e.trim()).filter(e => e);
        emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      }
    });
    
    if (Object.keys(emotionCounts).length === 0) return 'Neutral';
    
    const mostFrequent = Object.entries(emotionCounts).reduce((a, b) =>
      (emotionCounts[a[0]] || 0) > (emotionCounts[b[0]] || 0) ? a : b
    )?.[0] || 'Neutral';
    
    return mostFrequent;
  };

  // Calculate statistics (using all trades combined)
  const statistics = {
    totalTrades: allTradesForStats.length,
    totalPnL: allTradesForStats.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
    winRate: allTradesForStats.length > 0 ? (allTradesForStats.filter(trade => (trade.pnl || 0) > 0).length / allTradesForStats.length) * 100 : 0,
    winningTrades: allTradesForStats.filter(trade => (trade.pnl || 0) > 0).length,
    losingTrades: allTradesForStats.filter(trade => (trade.pnl || 0) < 0).length,
    mostFrequentEmotion: getMostFrequentEmotion(allTradesForStats)
  };

  return (
    <>
      <Head>
        <title>Trade History - VeroTrade</title>
        <style>{`
          /* Flashlight effect styles */
          .flashlight-container {
            position: relative;
            overflow: hidden;
          }
          
          .flashlight-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(
              600px circle at var(--mouse-x, 0) var(--mouse-y, 0),
              rgba(197, 160, 101, 0.06),
              transparent 40%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .flashlight-border {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: radial-gradient(
              600px circle at var(--mouse-x, 0) var(--mouse-y, 0),
              rgba(197, 160, 101, 0.1),
              transparent 40%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .flashlight-container:hover .flashlight-bg,
          .flashlight-container:hover .flashlight-border {
            opacity: 1;
          }
          
          /* Accordion styles */
          .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }
          
          .accordion-content.active {
            max-height: 800px;
            transition: max-height 0.5s ease-in;
          }
          
          .chevron-icon {
            transition: transform 0.3s ease;
          }
          
          .chevron-icon.rotate {
            transform: rotate(180deg);
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #050505;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </Head>

      <div className="min-h-screen flex flex-col antialiased">
        {/* Main Content */}
        <main className="flex-grow pt-32 px-6 lg:px-12 max-w-[1800px] w-full mx-auto pb-20">
          
          {/* Header Section */}
          <header className="mb-12">
            <h1 className="font-serif text-5xl md:text-6xl text-white mb-4">
              Trade History
            </h1>
            <p className="text-gray-400 max-w-xl text-lg font-light tracking-wide">
              Review your trading performance, analyze P&L, and refine your strategies.
            </p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Stat Card 1 */}
            <div className="flashlight-container rounded-2xl p-6">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Trades
                </div>
                <div className="text-3xl font-mono text-white font-medium">
                  {statistics.totalTrades}
                </div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="flashlight-container rounded-2xl p-6">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Total P&L
                </div>
                <div className={`text-3xl font-mono font-medium ${statistics.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {statistics.totalPnL >= 0 ? '+' : '-'}{formatCurrency(Math.abs(statistics.totalPnL))}
                </div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="flashlight-container rounded-2xl p-6">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Win Rate
                </div>
                <div className="text-3xl font-mono text-white font-medium">
                  {statistics.winRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="flashlight-container rounded-2xl p-6">
              <div className="flashlight-bg"></div>
              <div className="flashlight-border"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider font-medium">
                  Most Frequent Emotion
                </div>
                <div className="text-3xl font-serif italic text-gold-light capitalize">
                  {statistics.mostFrequentEmotion}
                </div>
              </div>
            </div>
          </div>

          {/* Trades Table Area */}
          <div>
            {/* Headers */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-widest">
              <button
                onClick={() => handleSortChange('trade_date')}
                className="col-span-2 flex items-center gap-1 hover:text-gold transition-colors text-left"
              >
                Date / Time
                {sorting.sortBy === 'trade_date' && (
                  <span className="text-gold">
                    {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSortChange('symbol')}
                className="col-span-2 flex items-center gap-1 hover:text-gold transition-colors text-left"
              >
                Symbol
                {sorting.sortBy === 'symbol' && (
                  <span className="text-gold">
                    {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSortChange('entry_price')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-gold transition-colors text-right"
              >
                Entry Price
                {sorting.sortBy === 'entry_price' && (
                  <span className="text-gold">
                    {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSortChange('pnl')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-gold transition-colors text-right"
              >
                P&L
                {sorting.sortBy === 'pnl' && (
                  <span className="text-gold">
                    {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSortChange('quantity')}
                className="col-span-2 flex items-center justify-end gap-1 hover:text-gold transition-colors text-right"
              >
                Quantity
                {sorting.sortBy === 'quantity' && (
                  <span className="text-gold">
                    {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Trade Rows Container */}
            <div className="space-y-3 mt-4 min-h-[200px] relative z-10">
              {/* Loading state */}
              {loading && (
                <div className="flashlight-container rounded-2xl p-12 text-center">
                  <div className="flashlight-bg"></div>
                  <div className="flashlight-border"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-xl font-bold text-white mb-3">Loading trades...</h3>
                    <p className="text-gray-400">
                      Fetching your trading data from the database
                    </p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="flashlight-container rounded-2xl p-12 text-center">
                  <div className="flashlight-bg"></div>
                  <div className="flashlight-border"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Error loading trades</h3>
                    <p className="text-gray-400 mb-6">
                      {error}
                    </p>
                    <button
                      onClick={() => fetchTrades()}
                      className="px-6 py-3 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* No trades message */}
              {!loading && !error && trades.length === 0 && (
                <div className="flashlight-container rounded-2xl p-12 text-center">
                  <div className="flashlight-bg"></div>
                  <div className="flashlight-border"></div>
                  <div className="relative z-10">
                    <TrendingUp className="w-16 h-16 mx-auto mb-6 text-gray-600" />
                    <h3 className="text-xl font-bold text-white mb-3">No trades yet</h3>
                    <p className="text-gray-400 mb-6">
                      Start logging your trades to see them here
                    </p>
                    <button
                      onClick={() => window.location.href = '/log-trade'}
                      className="px-6 py-3 bg-gold rounded-lg text-black font-medium hover:bg-gold-light transition-colors"
                    >
                      Log Your First Trade
                    </button>
                  </div>
                </div>
              )}

              {/* Trades list */}
              {!loading && !error && trades.map((trade) => (
                <TradeItem
                  key={trade.id}
                  trade={trade}
                  isExpanded={expandedTrades.has(trade.id)}
                  onToggle={() => toggleTradeExpansion(trade.id)}
                  onEdit={() => handleEditTrade(trade)}
                  onDelete={() => handleDeleteTrade(trade.id)}
                />
              ))}

              {/* Pagination Controls */}
              {!loading && !error && trades.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
                  <div className="text-sm text-gray-400">
                    Showing {((pagination.currentPage - 1) * 50) + 1} to {Math.min(pagination.currentPage * 50, pagination.totalCount)} of {pagination.totalCount} trades
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="p-2 rounded-lg bg-surface border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              pageNum === pagination.currentPage
                                ? 'bg-gold text-black'
                                : 'bg-surface border border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="p-2 rounded-lg bg-surface border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <EditTradeModal
        isOpen={showEditModal}
        onClose={() => {
          console.log('🎭 [TradeHistory] Edit modal closing');
          setShowEditModal(false);
          setEditingTrade(null);
        }}
        onSave={handleUpdateTrade}
        trade={editingTrade}
      />

      {/* Delete Modal */}
      <DeleteTradeModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          console.log('🎭 [TradeHistory] Delete modal closing');
          setShowDeleteConfirm(false);
          setDeletingTradeId(null);
        }}
        onConfirm={confirmDelete}
        tradeSymbol={trades.find(t => t.id === deletingTradeId)?.symbol || ''}
        tradeId={deletingTradeId || undefined}
      />
    </>
  );
};

export default TradeHistory;