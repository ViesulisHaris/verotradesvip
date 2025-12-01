'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { X, Clock, TrendingUp, TrendingDown, Calendar, DollarSign, Timer, FileText } from 'lucide-react';
import MarketBadge from '@/components/ui/MarketBadge';

// Helper function to format emotions as boxes
const formatEmotionsAsBoxes = (emotionalState: string[] | null | string) => {
  if (!emotionalState) {
    return <span className="text-gray-400">None</span>;
  }

  let emotions: string[] = [];
  
  if (Array.isArray(emotionalState)) {
    emotions = emotionalState
      .filter((e: any) => typeof e === 'string' && e.trim())
      .map((e: any) => e.trim().toUpperCase());
  } else if (typeof emotionalState === 'string') {
    const trimmed = emotionalState.trim();
    if (trimmed) {
      // Quick check if it's JSON format
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            emotions = parsed.map((e: any) => typeof e === 'string' ? e.trim().toUpperCase() : e);
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
  
  const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
    'FOMO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    'REVENGE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    'TILT': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    'OVERRISK': { bg: 'emotion-box-bg', text: 'emotion-box-text', border: 'border-yellow-500/50' },
    'PATIENCE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    'REGRET': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    'DISCIPLINE': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    'CONFIDENT': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    'ANXIOUS': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {emotions.map((emotion, index) => {
        const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
        return (
          <div
            key={index}
            className={`px-2 py-1 rounded-md ${emotionColor.bg} ${emotionColor.text} text-xs border ${emotionColor.border}`}
          >
            {emotion}
          </div>
        );
      })}
    </div>
  );
};

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
  notes?: string;
  market?: string;
  strategies?: {
    id: string;
    name: string;
  };
}

interface Props {
  trades: Trade[];
  selectedDate: string;
  onClose: () => void;
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
    entryDate.setHours(entryHours, entryMinutes, 0, 0);
    
    const exitDate = new Date();
    exitDate.setHours(exitHours, exitMinutes, 0, 0);
    
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
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    console.error('Error calculating trade duration:', error);
    return null;
  }
};

export default function TradeModal({ trades, selectedDate, onClose }: Props) {
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
  const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0).length;

  // Prevent body scroll when modal is open and handle ESC key
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalStyleHtml = window.getComputedStyle(document.documentElement).overflow;
    
    console.log('🔍 [TRADEMODAL] Background diagnostics before modal open:', {
      bodyOverflow: originalStyle,
      htmlOverflow: originalStyleHtml,
      computedBackground: window.getComputedStyle(document.body).background,
      computedBackdropFilter: window.getComputedStyle(document.body).backdropFilter,
      modalZIndex: 'z-[999999]',
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    
    // Prevent scroll on both body and html
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Handle ESC key press
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔍 [TRADEMODAL] ESC key pressed, closing modal');
        onClose();
      }
    };
    
    // Add event listener for ESC key
    document.addEventListener('keydown', handleEscKey);
    
    console.log('🔍 [TRADEMODAL] Background diagnostics after modal open:', {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      scrollPosition: { x: window.scrollX, y: window.scrollY }
    });
    
    return () => {
      console.log('🔍 [TRADEMODAL] Restoring overflow on modal close:', {
        restoringBodyOverflow: originalStyle,
        restoringHtmlOverflow: originalStyleHtml
      });
      document.body.style.overflow = originalStyle;
      document.documentElement.style.overflow = originalStyleHtml;
      // Remove event listener for ESC key
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  return (
    <>
      {console.log('🔍 [TRADEMODAL] Rendering modal backdrop with background check:', {
        backdropClass: 'bg-black/70 backdrop-blur-md',
        zIndex: 'z-[999999]',
        position: 'fixed',
        viewportCoverage: '100vw x 100vh',
        tradesCount: trades.length,
        selectedDate
      })}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 animate-fade-in"
        style={{
          position: 'fixed',
          top: '0px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          width: '100vw',
          height: '100vh',
          minWidth: '100vw',
          minHeight: '100vh',
          margin: '0',
          padding: '0',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
        onClick={onClose}
      >
      <div
        className="glass max-w-5xl w-full max-h-[95vh] rounded-2xl shadow-2xl animate-scale-up border border-white/10 flex flex-col overflow-y-auto scrollbar-glass"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 md:p-8 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group hover:scale-110"
          >
            <X className="w-5 h-5 text-white/70 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 glass rounded-lg">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Trade Details</h3>
              <p className="text-sm text-white/60 mt-1">Complete trading activity breakdown</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-white/70">
            <span className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="text-white/50 hidden sm:inline">•</span>
            <span className="text-sm font-medium">{trades.length} trade{trades.length !== 1 ? 's' : ''} executed</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 md:p-8 border-b border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="glass p-5 rounded-xl hover:scale-105 transition-all duration-200 border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Total P&L</span>
              </div>
              <p className={`text-xl md:text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} transition-colors`}>
                {formatCurrency(totalPnL)}
              </p>
              <p className="text-xs text-white/40 mt-1">Net result</p>
            </div>
            
            <div className="glass p-5 rounded-xl hover:scale-105 transition-all duration-200 border border-green-500/30 shadow-lg shadow-green-500/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Winners</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-green-400">{winningTrades}</p>
              <p className="text-xs text-white/40 mt-1">Profitable trades</p>
            </div>
            
            <div className="glass p-5 rounded-xl hover:scale-105 transition-all duration-200 border border-red-500/30 shadow-lg shadow-red-500/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Losers</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-red-400">{losingTrades}</p>
              <p className="text-xs text-white/40 mt-1">Losing trades</p>
            </div>
            
            <div className="glass p-5 rounded-xl hover:scale-105 transition-all duration-200 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Timer className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Win Rate</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {trades.length > 0 ? `${((winningTrades / trades.length) * 100).toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-white/40 mt-1">Success ratio</p>
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 glass rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-semibold text-white">Individual Trades</h4>
              <p className="text-sm text-white/60 mt-1">Detailed breakdown of each position</p>
            </div>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            {trades.map((trade, index) => (
              <div key={trade.id} className="glass p-5 md:p-6 rounded-xl border border-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl group">
                {/* Trade Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      trade.side === 'Buy' ? 'bg-green-500/20 border-2 border-green-500/30' : 'bg-red-500/20 border-2 border-red-500/30'
                    } group-hover:scale-110 transition-all duration-200`}>
                      <span className={`text-lg font-bold ${
                        trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.side === 'Buy' ? 'B' : 'S'}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                        <span className="text-sm md:text-base font-bold text-white bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-200">
                          {trade.symbol || 'N/A'}
                        </span>
                        {trade.market && (
                          <MarketBadge market={trade.market} size="compact" />
                        )}
                      </div>
                      <p className="text-sm text-white/60">
                        {trade.quantity} shares • {trade.side}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-xl md:text-2xl font-bold ${
                      (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    } transition-colors`}>
                      {formatCurrency(trade.pnl || 0)}
                    </p>
                    <p className="text-sm text-white/60 font-mono">
                      ${trade.entry_price} {trade.exit_price && `→ $${trade.exit_price}`}
                    </p>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs uppercase tracking-wider">Entry Time</span>
                      <span className="text-white font-medium">{trade.entry_time || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs uppercase tracking-wider">Exit Time</span>
                      <span className="text-white font-medium">{trade.exit_time || 'N/A'}</span>
                    </div>
                    {(() => {
                      const duration = calculateTradeDuration(trade.entry_time, trade.exit_time);
                      return duration ? (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-xs uppercase tracking-wider">Duration</span>
                          <span className="text-white font-medium flex items-center gap-2">
                            <Timer className="w-4 h-4 text-blue-400" />
                            {duration}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  
                  <div className="space-y-3">
                    {trade.strategies && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs uppercase tracking-wider">Strategy</span>
                        <span className="text-white font-medium">{trade.strategies.name}</span>
                      </div>
                    )}
                    {trade.emotional_state && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs uppercase tracking-wider">Emotion</span>
                        <div className="flex justify-end">
                          {formatEmotionsAsBoxes(trade.emotional_state)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                {trade.notes && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">Notes</p>
                        <p className="text-sm text-white/90 leading-relaxed">{trade.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 hover:scale-[1.02] transition-all duration-200 font-medium text-base shadow-lg hover:shadow-xl border border-white/10 hover:border-white/20"
          >
            <span className="flex items-center justify-center gap-2">
              Close Details
              <span className="text-xs text-white/60">ESC</span>
            </span>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
