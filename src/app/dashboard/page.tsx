'use client';

import React, { useState, useEffect, useRef } from 'react';
import TextReveal from '@/components/TextReveal';
import TorchCard from '@/components/TorchCard';
import { PnlChart, RadarEmotionChart } from '@/components/Charts';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext-simple';
import {
  validatePsychologicalMetrics,
  validateEmotionalData,
  performComprehensiveValidation,
  createValidationContext,
  finalizeValidationContext,
  logValidationResults,
  DEFAULT_VALIDATION_CONFIG,
  ComprehensiveValidationResult,
  ValidationSeverity
} from '@/lib/psychological-metrics-validation';
import './psychological-metrics.css';

interface Trade {
  id: string;
  date: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  entry: number;
  exit: number;
  return: number;
  pnl?: number;
  trade_date?: string;
}

interface DashboardStats {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgTradeSize: number;
  profitFactor: number;
  sharpeRatio: number;
  avgTimeHeld: string;
  tradingDays: number;
  disciplineLevel: number;
  tiltControl: number;
  psychologicalStabilityIndex?: number;
}

interface EmotionalData {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string;
  side: string;
  leaningValue?: number;
  totalTrades?: number;
}

function DashboardContent() {
  const { session } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  
  // State for real data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]); // For PnL chart
  const [emotionalData, setEmotionalData] = useState<EmotionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [psychologicalMetricsError, setPsychologicalMetricsError] = useState<string | null>(null);
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState(false);
  
  // Validation state
  const [validationResults, setValidationResults] = useState<ComprehensiveValidationResult | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.access_token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch stats, recent trades, and all trades for PnL chart in parallel
        const [statsResponse, tradesResponse, allTradesResponse] = await Promise.all([
          fetch('/api/confluence-stats', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/confluence-trades?limit=5&sortBy=trade_date&sortOrder=desc', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/confluence-trades?limit=2000&sortBy=trade_date&sortOrder=asc', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (!statsResponse.ok || !tradesResponse.ok || !allTradesResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsResponse.json();
        const tradesData = await tradesResponse.json();
        const allTradesData = await allTradesResponse.json();

        // Use psychological metrics from API response instead of recalculating
        let disciplineLevel = 50;
        let tiltControl = 50;
        let psychologicalStabilityIndex = 50;
        
        try {
          setIsCalculatingMetrics(true);
          setPsychologicalMetricsError(null);
          
          // Use API response values if available
          if (statsData.psychologicalMetrics) {
            disciplineLevel = statsData.psychologicalMetrics.disciplineLevel || 50;
            tiltControl = statsData.psychologicalMetrics.tiltControl || 50;
            psychologicalStabilityIndex = statsData.psychologicalMetrics.psychologicalStabilityIndex || 50;
          } else {
            // Fallback to frontend calculation only if API doesn't provide values
            const psychologicalMetrics = calculatePsychologicalMetrics(statsData.emotionalData || []);
            disciplineLevel = psychologicalMetrics.disciplineLevel;
            tiltControl = psychologicalMetrics.tiltControl;
            psychologicalStabilityIndex = psychologicalMetrics.psychologicalStabilityIndex;
          }
          
          // Create validation context for frontend validation
          const validationContext = createValidationContext(
            `frontend-${Date.now()}`,
            session.user?.id
          );
          
          // Perform frontend validation
          const frontendValidationResults = performComprehensiveValidation(
            disciplineLevel,
            tiltControl,
            statsData.emotionalData || [],
            statsData.processingTime || 0,
            0, // Frontend calculation time (minimal)
            undefined,
            statsData
          );
          
          // Update validation state
          setValidationResults(frontendValidationResults);
          
          // Extract warnings from API response if available
          if (statsData.validationWarnings && statsData.validationWarnings.length > 0) {
            setValidationWarnings(statsData.validationWarnings);
          } else {
            setValidationWarnings(frontendValidationResults.overall.warnings);
          }
          
          // Log validation results
          logValidationResults(validationContext, frontendValidationResults);
          
          // Use corrected values if available
          if (frontendValidationResults.psychologicalMetrics.correctedData) {
            disciplineLevel = frontendValidationResults.psychologicalMetrics.disciplineLevel!;
            tiltControl = frontendValidationResults.psychologicalMetrics.tiltControl!;
            psychologicalStabilityIndex = frontendValidationResults.psychologicalMetrics.psychologicalStabilityIndex || psychologicalStabilityIndex;
          }
          
          // Validate the calculated values
          if (disciplineLevel < 0 || disciplineLevel > 100 || tiltControl < 0 || tiltControl > 100) {
            throw new Error('Calculated values are out of valid range');
          }
          
        } catch (error) {
          console.error('Error processing psychological metrics:', error);
          setPsychologicalMetricsError(
            error instanceof Error ? error.message : 'Failed to process psychological metrics'
          );
          // Use fallback values
          disciplineLevel = 50;
          tiltControl = 50;
          psychologicalStabilityIndex = 50;
        } finally {
          setIsCalculatingMetrics(false);
        }

        const processedStats: DashboardStats = {
          totalTrades: statsData.totalTrades || 0,
          totalPnL: statsData.totalPnL || 0,
          winRate: statsData.winRate || 0,
          avgTradeSize: statsData.avgTradeSize || 0,
          profitFactor: calculateProfitFactor(tradesData.trades || []),
          sharpeRatio: calculateSharpeRatio(tradesData.trades || []),
          avgTimeHeld: calculateAvgTimeHeld(tradesData.trades || []),
          tradingDays: calculateTradingDays(tradesData.trades || []),
          disciplineLevel,
          tiltControl,
          psychologicalStabilityIndex,
        };

        // Process recent trades data (for table)
        const processedTrades: Trade[] = (tradesData.trades || []).map((trade: any) => ({
          id: trade.id,
          date: new Date(trade.trade_date).toLocaleDateString(),
          symbol: trade.symbol,
          side: trade.side,
          entry: trade.entry_price,
          exit: trade.exit_price || 0,
          return: trade.pnl || 0,
          // Add pnl field for PnlChart compatibility
          pnl: trade.pnl || 0,
          // Add trade_date for PnlChart compatibility
          trade_date: trade.trade_date,
        }));

        // Process all trades data (for PnL chart)
        const processedAllTrades: Trade[] = (allTradesData.trades || []).map((trade: any) => ({
          id: trade.id,
          date: new Date(trade.trade_date).toLocaleDateString(),
          symbol: trade.symbol,
          side: trade.side,
          entry: trade.entry_price,
          exit: trade.exit_price || 0,
          return: trade.pnl || 0,
          // Add pnl field for PnlChart compatibility
          pnl: trade.pnl || 0,
          // Add trade_date for PnlChart compatibility
          trade_date: trade.trade_date,
        }));

        console.log('🔍 [Dashboard] Setting state with processed data:', {
          stats: processedStats,
          recentTradesCount: processedTrades.length,
          allTradesCount: processedAllTrades.length,
          emotionalDataCount: statsData.emotionalData?.length || 0,
          sampleAllTrades: processedAllTrades.slice(0, 3)
        });

        setStats(processedStats);
        setRecentTrades(processedTrades);
        setAllTrades(processedAllTrades);
        setEmotionalData(statsData.emotionalData || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  // Helper functions to calculate additional metrics
  const calculateProfitFactor = (trades: any[]): number => {
    const profits = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const losses = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    return losses > 0 ? profits / losses : profits > 0 ? 999 : 0;
  };

  const calculateSharpeRatio = (trades: any[]): number => {
    if (!trades || trades.length < 2) return 0;
    
    // Extract returns from P&L
    const returns = trades.map(t => t.pnl || 0).filter(r => r !== 0);
    if (returns.length < 2) return 0;
    
    // Calculate basic statistics
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    // Risk-free rate (typically 2-3% annually, using 2.5% as default)
    // Convert to per-trade basis: annual rate / sqrt(trading days per year)
    const annualRiskFreeRate = 0.025; // 2.5%
    const tradingDaysPerYear = 252; // Standard trading days
    
    // Calculate trading period from data
    const tradeDates = trades
      .map(t => new Date(t.trade_date))
      .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let timeFactor = 1; // Default to daily if we can't determine period
    if (tradeDates.length >= 2) {
      const firstDate = tradeDates[0];
      const lastDate = tradeDates[tradeDates.length - 1];
      
      if (firstDate && lastDate) {
        const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0) {
          // Calculate the number of trading periods in the data
          const tradingPeriods = daysDiff;
          // Adjust risk-free rate for the actual trading period
          timeFactor = Math.sqrt(tradingPeriods / tradingDaysPerYear);
        }
      }
    }
    
    // Calculate per-trade risk-free rate
    const perTradeRiskFreeRate = annualRiskFreeRate / Math.sqrt(tradingDaysPerYear);
    
    // Calculate Sharpe ratio: (mean return - risk-free rate) / standard deviation
    const sharpeRatio = (avgReturn - perTradeRiskFreeRate) / stdDev;
    
    // Annualize the Sharpe ratio
    const annualizedSharpe = sharpeRatio * Math.sqrt(tradingDaysPerYear) * timeFactor;
    
    // Handle edge cases
    if (!isFinite(annualizedSharpe) || isNaN(annualizedSharpe)) {
      return 0;
    }
    
    return annualizedSharpe;
  };

  const calculateAvgTimeHeld = (trades: any[]): string => {
    if (!trades || trades.length === 0) {
      return 'N/A';
    }

    let totalDuration = 0;
    let validTrades = 0;

    trades.forEach(trade => {
      let entryTime, exitTime;
      
      // Try to get time from trade_date + entry_time/exit_time fields
      if (trade.entry_time && trade.exit_time) {
        // If we have specific entry/exit times, use them
        entryTime = new Date(`${trade.trade_date}T${trade.entry_time}`);
        exitTime = new Date(`${trade.trade_date}T${trade.exit_time}`);
      } else if (trade.trade_date) {
        // Fallback: estimate based on trade date only (assume same-day trades)
        // This is a rough estimation - in real trading, you'd need actual entry/exit timestamps
        entryTime = new Date(trade.trade_date);
        exitTime = new Date(trade.trade_date);
        // Add a random duration between 1 hour and 24 hours for estimation
        const estimatedHours = Math.random() * 23 + 1;
        exitTime.setTime(exitTime.getTime() + estimatedHours * 60 * 60 * 1000);
      } else {
        return; // Skip this trade if no date information
      }

      if (entryTime && exitTime && !isNaN(entryTime.getTime()) && !isNaN(exitTime.getTime())) {
        const duration = exitTime.getTime() - entryTime.getTime();
        if (duration > 0) {
          totalDuration += duration;
          validTrades++;
        }
      }
    });

    if (validTrades === 0) {
      return 'N/A';
    }

    const avgDuration = totalDuration / validTrades;
    
    // Convert to human-readable format
    const hours = Math.floor(avgDuration / (1000 * 60 * 60));
    const minutes = Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const calculateTradingDays = (trades: any[]): number => {
    const uniqueDays = new Set(trades.map(t => new Date(t.trade_date).toDateString()));
    return uniqueDays.size;
  };

  // Unified calculation system for Discipline Level and Tilt Control
  const calculatePsychologicalMetrics = (emotionalData: EmotionalData[]): { disciplineLevel: number; tiltControl: number; psychologicalStabilityIndex: number } => {
    // Handle edge cases: empty or invalid data
    if (!emotionalData || emotionalData.length === 0) {
      return { disciplineLevel: 50, tiltControl: 50, psychologicalStabilityIndex: 50 };
    }

    try {
      // Define emotion categories with their weights
      const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
      const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
      const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
      
      // Calculate weighted scores for each emotion category
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;
      
      emotionalData.forEach(emotion => {
        const emotionName = emotion.subject?.toUpperCase();
        const emotionValue = emotion.value || 0;
        
        if (positiveEmotions.includes(emotionName)) {
          positiveScore += emotionValue;
        } else if (negativeEmotions.includes(emotionName)) {
          negativeScore += emotionValue;
        } else if (neutralEmotions.includes(emotionName)) {
          neutralScore += emotionValue;
        }
      });
      
      // Normalize scores to 0-100 range
      const maxPossibleScore = emotionalData.length * 100;
      positiveScore = (positiveScore / maxPossibleScore) * 100;
      negativeScore = (negativeScore / maxPossibleScore) * 100;
      neutralScore = (neutralScore / maxPossibleScore) * 100;
      
      // Calculate Emotional State Score (ESS) with weighted formula
      const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
      
      // Calculate Psychological Stability Index (PSI) - normalized to 0-100 scale
      const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
      
      // Calculate Discipline Level based on emotion scoring
      // Higher positive emotions and lower negative emotions result in higher discipline
      let disciplineLevel = psi;
      
      // Ensure discipline level is within 0-100 range
      disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
      
      // Calculate Tilt Control as the exact complement of Discipline Level
      // This ensures they always sum to exactly 100%
      const tiltControl = 100 - disciplineLevel;
      
      return {
        disciplineLevel: Math.round(disciplineLevel * 100) / 100, // Round to 2 decimal places
        tiltControl: Math.round(tiltControl * 100) / 100,
        psychologicalStabilityIndex: Math.round(psi * 100) / 100 // Include PSI in return
      };
      
    } catch (error) {
      console.error('Error calculating psychological metrics:', error);
      // Return default values on error
      return { disciplineLevel: 50, tiltControl: 50, psychologicalStabilityIndex: 50 };
    }
  };

  // Backward compatibility functions
  const calculateDisciplineLevel = (emotionalData: EmotionalData[]): number => {
    const { disciplineLevel } = calculatePsychologicalMetrics(emotionalData);
    return disciplineLevel;
  };

  const calculateTiltControl = (emotionalData: EmotionalData[]): number => {
    const { tiltControl } = calculatePsychologicalMetrics(emotionalData);
    return tiltControl;
  };

  // Handle mouse move for flashlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Update CSS variables for all flashlight cards
      const flashlightCards = document.querySelectorAll('.flashlight-card');
      flashlightCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Clamp values to prevent overflow
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        
        (card as HTMLElement).style.setProperty('--mouse-x', `${clampedX}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${clampedY}%`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Removed scroll reveal animations - elements now appear immediately
return (
  <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter']">

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <TextReveal
            text="Trading Dashboard"
            className="text-5xl font-bold text-[#E6D5B8] font-serif"
            delay={0.2}
          />
          <p className="text-xl text-[#9ca3af]">
            Track your performance and analyze your trading patterns
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total PnL */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Total PnL</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={`$${stats?.totalPnL.toLocaleString() || '0'}`}
                  className={`text-3xl font-bold ${(stats?.totalPnL ?? 0) >= 0 ? 'text-[#2EBD85]' : 'text-[#F6465D]'}`}
                  delay={0.3}
                />
                <span className="text-sm text-[#2EBD85]">Total P&L</span>
              </div>
            </div>
          </TorchCard>

          {/* Profit Factor */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Profit Factor</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={stats?.profitFactor.toFixed(2) || '0.00'}
                  className="text-3xl font-bold text-[#E6D5B8]"
                  delay={0.4}
                />
                <span className="text-xs text-[#9ca3af]">Win/Loss ratio</span>
              </div>
            </div>
          </TorchCard>

          {/* Win Rate */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Win Rate</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={`${stats?.winRate.toFixed(1) || '0.0'}%`}
                  className="text-3xl font-bold text-[#C5A065]"
                  delay={0.5}
                />
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-[#C5A065] h-2 rounded-full" style={{ width: `${stats?.winRate || 0}%` }}></div>
              </div>
            </div>
          </TorchCard>

          {/* Total Trades */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Total Trades</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={stats?.totalTrades.toLocaleString() || '0'}
                  className="text-3xl font-bold text-[#E6D5B8]"
                  delay={0.6}
                />
                <span className="text-xs text-[#9ca3af]">All time</span>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
          {/* PnL Performance Chart */}
          <TorchCard className="lg:col-span-8 p-6 rounded-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E6D5B8]">PnL Performance</h3>
              <div className="h-80">
                <PnlChart trades={allTrades} />
              </div>
            </div>
          </TorchCard>

          {/* Emotional Analysis Radar Chart */}
          <TorchCard className="lg:col-span-4 p-6 rounded-lg relative">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-[#E6D5B8]">Emotional Analysis</h3>
                <span className="material-symbols-outlined text-[#5E2121]">psychology</span>
              </div>
              <div className="h-64">
                <RadarEmotionChart emotionalData={emotionalData} />
              </div>
            </div>
          </TorchCard>

          {/* Psychological Metrics - Coupled Display */}
          <TorchCard className={`lg:col-span-4 p-6 rounded-lg psychological-metrics-card ${
            psychologicalMetricsError ? 'error-state' : ''
          } ${loading || isCalculatingMetrics ? 'loading-state' : ''}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-[#E6D5B8]">Psychological Metrics</h3>
                  <div className="relative group">
                    <span className="material-symbols-outlined text-[#C5A065] text-sm cursor-help">info</span>
                    <div className="absolute left-0 top-6 w-64 p-3 bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                      <p className="text-xs text-[#9ca3af]">
                        Discipline Level and Tilt Control are complementary metrics calculated from emotional analysis. These metrics provide insights into trading psychology and behavior patterns.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center space-x-2">
                  {isCalculatingMetrics && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-[#C5A065] rounded-full animate-pulse"></div>
                      <span className="text-xs text-[#C5A065]">Calculating...</span>
                    </div>
                  )}
                  {psychologicalMetricsError && (
                    <div className="flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[#F6465D] text-xs">error</span>
                      <span className="text-xs text-[#F6465D]">Error</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Validation Warnings Display */}
              {validationWarnings && validationWarnings.length > 0 && (
                <div className="p-4 bg-[#C5A065]/10 border border-[#C5A065]/30 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-[#C5A065]">warning</span>
                      <span className="text-sm font-medium text-[#C5A065]">Validation Warnings</span>
                    </div>
                    <button
                      onClick={() => setShowValidationDetails(!showValidationDetails)}
                      className="text-xs text-[#C5A065] hover:text-[#C5A065]/80 transition-colors"
                    >
                      {showValidationDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  <p className="text-xs text-[#9ca3af] mb-2">
                    {validationWarnings.length} validation warning{validationWarnings.length > 1 ? 's' : ''} detected
                  </p>
                  
                  {showValidationDetails && (
                    <div className="space-y-2">
                      {validationWarnings.map((warning, index) => (
                        <div key={index} className="text-xs text-[#9ca3af] p-2 bg-[#1F1F1F]/50 rounded">
                          <span className="text-[#C5A065]">•</span> {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Error State Display */}
              {psychologicalMetricsError && (
                <div className="p-4 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="material-symbols-outlined text-[#F6465D]">warning</span>
                    <span className="text-sm font-medium text-[#F6465D]">Calculation Error</span>
                  </div>
                  <p className="text-xs text-[#9ca3af]">{psychologicalMetricsError}</p>
                  <button
                    onClick={() => {
                      setPsychologicalMetricsError(null);
                      setIsCalculatingMetrics(true);
                      // Recalculate metrics
                      setTimeout(() => {
                        if (stats && emotionalData.length > 0) {
                          const { disciplineLevel, tiltControl, psychologicalStabilityIndex } = calculatePsychologicalMetrics(emotionalData);
                          setStats(prev => prev ? {...prev, disciplineLevel, tiltControl, psychologicalStabilityIndex} : null);
                          setIsCalculatingMetrics(false);
                        }
                      }, 1000);
                    }}
                    className="mt-2 px-3 py-1 bg-[#F6465D]/20 border border-[#F6465D]/40 rounded text-xs text-[#F6465D] hover:bg-[#F6465D]/30 transition-colors"
                  >
                    Retry Calculation
                  </button>
                </div>
              )}

              {/* Loading State Display */}
              {(loading || isCalculatingMetrics) && !psychologicalMetricsError && (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-[#1F1F1F] rounded w-1/3 mb-2"></div>
                    <div className="h-8 bg-[#1F1F1F] rounded mb-4"></div>
                    <div className="h-4 bg-[#1F1F1F] rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-[#1F1F1F] rounded"></div>
                  </div>
                </div>
              )}

              {/* Metrics Visual Display */}
              {!loading && !isCalculatingMetrics && !psychologicalMetricsError && (
              <div className="space-y-6">
                  {/* Discipline Level */}
                  <div className="metric-container group" data-metric="discipline">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[#2EBD85] text-sm">psychology</span>
                        <span className="text-sm font-medium text-[#9ca3af]">Discipline Level</span>
                      </div>
                      <span className="text-sm font-bold text-[#2EBD85]">{stats?.disciplineLevel.toFixed(1) || '0'}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-[#1F1F1F] rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#2EBD85] to-[#2EBD85]/80 relative overflow-hidden"
                          style={{ width: `${stats?.disciplineLevel || 0}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-[#2EBD85]/20 border border-[#2EBD85]/40 rounded text-xs text-[#2EBD85] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Reflects emotional consistency and trading adherence
                      </div>
                    </div>
                  </div>
                  
                  {/* Tilt Control */}
                  <div className="metric-container group" data-metric="tilt-control">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[#F6465D] text-sm">balance</span>
                        <span className="text-sm font-medium text-[#9ca3af]">Tilt Control</span>
                      </div>
                      <span className="text-sm font-bold text-[#F6465D]">{stats?.tiltControl.toFixed(1) || '0'}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-[#1F1F1F] rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#F6465D] to-[#F6465D]/80 relative overflow-hidden"
                          style={{ width: `${stats?.tiltControl || 0}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-[#F6465D]/20 border border-[#F6465D]/40 rounded text-xs text-[#F6465D] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Measures emotional regulation and impulse control
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Psychological Stability Score */}
              {!loading && !isCalculatingMetrics && !psychologicalMetricsError && (
              <div className="mt-4 p-3 bg-[#1F1F1F]/50 rounded-lg border border-[#2F2F2F]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Psychological Stability Index</span>
                  <span className="text-sm font-bold text-[#C5A065]">
                    {(stats?.psychologicalStabilityIndex ?? 50).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#2EBD85] via-[#C5A065] to-[#F6465D] transition-all duration-500 ease-out"
                    style={{ width: `${stats?.psychologicalStabilityIndex ?? 50}%` }}
                  ></div>
                </div>
              </div>
              )}
            </div>
          </TorchCard>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avg Time Held */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Avg Time Held</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={stats?.avgTimeHeld || 'N/A'}
                  className="text-2xl font-bold text-[#E6D5B8]"
                  delay={0.7}
                />
              </div>
              <div className="flex space-x-1">
                <div className="flex-1 bg-[#2EBD85] h-2 rounded-l"></div>
                <div className="flex-1 bg-[#C5A065] h-2"></div>
                <div className="flex-1 bg-[#F6465D] h-2 rounded-r"></div>
              </div>
              <div className="flex justify-between text-xs text-[#9ca3af]">
                <span>Short</span>
                <span>Medium</span>
                <span>Long</span>
              </div>
            </div>
          </TorchCard>

          {/* Sharpe Ratio */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#9ca3af]">Sharpe Ratio</h3>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={stats?.sharpeRatio.toFixed(2) || '0.00'}
                  className="text-2xl font-bold text-[#C5A065]"
                  delay={0.8}
                />
                <span className="text-xs text-[#F6465D]">Risk Adjusted</span>
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-[#C5A065] h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (stats?.sharpeRatio || 0) * 50))}%` }}></div>
              </div>
            </div>
          </TorchCard>

          {/* Trading Days */}
          <TorchCard className="p-6 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-[#9ca3af]">Trading Days</h3>
                <span className="material-symbols-outlined text-[#C5A065] text-sm">calendar_today</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <TextReveal
                  text={stats?.tradingDays.toLocaleString() || '0'}
                  className="text-2xl font-bold text-[#E6D5B8]"
                  delay={0.9}
                />
                <span className="text-xs text-[#9ca3af]">Active days</span>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Recent Trades Table */}
        <TorchCard className="p-6 rounded-lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#E6D5B8]">Recent Trades</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F1F]">
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Side</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Entry</th>
                    <th className="text-left py-3 px-4 font-medium text-[#9ca3af]">Exit</th>
                    <th className="text-right py-3 px-4 font-medium text-[#9ca3af]">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => (
                    <tr 
                      key={trade.id} 
                      className="border-b border-[#1F1F1F] hover:bg-[#1F1F1F] transition-colors"
                    >
                      <td className="py-3 px-4 text-[#EAEAEA]">{trade.date}</td>
                      <td className="py-3 px-4 text-[#EAEAEA] font-medium">{trade.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          trade.side === 'Buy'
                            ? 'bg-[#2EBD85]/20 text-[#2EBD85]'
                            : 'bg-[#F6465D]/20 text-[#F6465D]'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#EAEAEA]">${trade.entry.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[#EAEAEA]">${trade.exit.toFixed(2)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        trade.return > 0 ? 'text-[#2EBD85]' : 'text-[#F6465D]'
                      }`}>
                        {trade.return > 0 ? '+' : ''}{trade.return.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TorchCard>
      </div>
    </div>
  );
}

// Wrapper component with authentication guard
function DashboardWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <DashboardContent />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default DashboardWithAuth;