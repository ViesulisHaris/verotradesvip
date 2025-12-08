'use client';

import React, { useState, useEffect, useRef } from 'react';
import TextReveal from '@/components/TextReveal';
import TorchCard from '@/components/TorchCard';
import { PnlChart, RadarEmotionChart } from '@/components/Charts';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext-simple';

interface Trade {
  id: string;
  date: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  entry: number;
  exit: number;
  return: number;
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
  const [emotionalData, setEmotionalData] = useState<EmotionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch stats and recent trades in parallel
        const [statsResponse, tradesResponse] = await Promise.all([
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
        ]);

        if (!statsResponse.ok || !tradesResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsResponse.json();
        const tradesData = await tradesResponse.json();

        // Process stats data
        const processedStats: DashboardStats = {
          totalTrades: statsData.totalTrades || 0,
          totalPnL: statsData.totalPnL || 0,
          winRate: statsData.winRate || 0,
          avgTradeSize: statsData.avgTradeSize || 0,
          profitFactor: calculateProfitFactor(tradesData.trades || []),
          sharpeRatio: calculateSharpeRatio(tradesData.trades || []),
          avgTimeHeld: calculateAvgTimeHeld(tradesData.trades || []),
          tradingDays: calculateTradingDays(tradesData.trades || []),
          disciplineLevel: calculateDisciplineLevel(statsData.emotionalData || []),
          tiltControl: calculateTiltControl(statsData.emotionalData || []),
        };

        // Process trades data
        const processedTrades: Trade[] = (tradesData.trades || []).map((trade: any) => ({
          id: trade.id,
          date: new Date(trade.trade_date).toLocaleDateString(),
          symbol: trade.symbol,
          side: trade.side,
          entry: trade.entry_price,
          exit: trade.exit_price || 0,
          return: trade.pnl || 0,
        }));

        setStats(processedStats);
        setRecentTrades(processedTrades);
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
    if (trades.length < 2) return 0;
    const returns = trades.map(t => t.pnl || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? avgReturn / stdDev : 0;
  };

  const calculateAvgTimeHeld = (trades: any[]): string => {
    // This would need entry_time and exit_time to calculate properly
    // For now, return a placeholder
    return '12h 8m';
  };

  const calculateTradingDays = (trades: any[]): number => {
    const uniqueDays = new Set(trades.map(t => new Date(t.trade_date).toDateString()));
    return uniqueDays.size;
  };

  const calculateDisciplineLevel = (emotionalData: EmotionalData[]): number => {
    const discipline = emotionalData.find(d => d.subject === 'DISCIPLINE');
    return discipline ? Math.min(100, discipline.value * 10) : 85;
  };

  const calculateTiltControl = (emotionalData: EmotionalData[]): number => {
    const tilt = emotionalData.find(d => d.subject === 'TILT');
    return tilt ? Math.max(0, 100 - (tilt.value * 10)) : 72;
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

  // Handle scroll reveal animations with IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before element comes into view
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add 'in-view' class to trigger animation
          entry.target.classList.add('in-view');
          
          // Find TextReveal components within this element and trigger their animations
          const textRevealElements = entry.target.querySelectorAll('.text-reveal-letter');
          textRevealElements.forEach((el, index) => {
            setTimeout(() => {
              (el as HTMLElement).style.animationPlayState = 'running';
            }, index * 50); // Stagger the text reveals
          });
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-item class
    const scrollItems = document.querySelectorAll('.scroll-item');
    scrollItems.forEach((item) => {
      observerRef.current?.observe(item);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
return (
  <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter']">

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4 scroll-item">
          <TextReveal
            text="Trading Dashboard"
            className="text-5xl font-bold text-[#E6D5B8] font-serif"
            delay={0.2}
          />
          <p className="text-xl text-[#9ca3af] fade-in">
            Track your performance and analyze your trading patterns
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total PnL */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-1">
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
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-2">
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
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-3">
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
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-4">
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
          <TorchCard className="lg:col-span-8 p-6 rounded-lg scroll-item scroll-animate stagger-delay-5">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E6D5B8]">PnL Performance</h3>
              <div className="h-80">
                <PnlChart trades={recentTrades} />
              </div>
            </div>
          </TorchCard>

          {/* Emotional Analysis Radar Chart */}
          <TorchCard className="lg:col-span-4 p-6 rounded-lg scroll-item scroll-animate stagger-delay-6 relative">
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

          {/* Discipline/Tilt Progress Bar */}
          <TorchCard className="lg:col-span-4 p-6 rounded-lg scroll-item scroll-animate stagger-delay-7">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E6D5B8]">Discipline Level</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Discipline</span>
                  <span className="text-[#2EBD85]">{stats?.disciplineLevel.toFixed(0) || '0'}%</span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-3">
                  <div className="bg-[#2EBD85] h-3 rounded-full" style={{ width: `${stats?.disciplineLevel || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Tilt Control</span>
                  <span className="text-[#F6465D]">{stats?.tiltControl.toFixed(0) || '0'}%</span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-3">
                  <div className="bg-[#F6465D] h-3 rounded-full" style={{ width: `${stats?.tiltControl || 0}%` }}></div>
                </div>
              </div>
            </div>
          </TorchCard>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avg Time Held */}
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-8">
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
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-9">
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
          <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-10">
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
        <TorchCard className="p-6 rounded-lg scroll-item scroll-animate stagger-delay-11">
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
                        {trade.return > 0 ? '+' : ''}{trade.return.toFixed(2)}%
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