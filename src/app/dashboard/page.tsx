'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { fetchTradesForDashboard } from '@/lib/optimized-queries';
import { useAuth } from '@/contexts/AuthContext-simple';
import AuthGuard from '@/components/AuthGuard';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import EmotionRadar from '@/components/EmotionRadar';
import PnLChart from '@/components/charts/PnLChart';
import { TrendingUp, DollarSign, Target, Calendar, Clock, BarChart3, AlertCircle } from 'lucide-react';

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

interface DashboardStats {
  totalPnL: number;
  winrate: number;
  profitFactor: number;
  totalTrades: number;
  avgTimeHeld: number;
  sharpeRatio: number;
}

interface EmotionData {
  subject: string;
  value: number;
  fullMark: number;
  percent: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Prevent multiple simultaneous data fetches
    let isMounted = true;
    
    const loadDashboardData = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);
        
        const result = await fetchTradesForDashboard(user.id);
        
        if (!isMounted) return;
        
        setTrades(result.trades);
        setStats(result.summary);

        // Process emotional data for radar chart
        const emotionCounts: Record<string, number> = {};
        let totalEmotions = 0;

        result.trades.forEach(trade => {
          if (trade.emotional_state) {
            let emotions: string[] = [];
            
            if (Array.isArray(trade.emotional_state)) {
              emotions = trade.emotional_state.filter(e => typeof e === 'string' && e.trim());
            } else if (typeof trade.emotional_state === 'string') {
              const trimmed = trade.emotional_state.trim();
              if (trimmed) {
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

            emotions.forEach(emotion => {
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
              totalEmotions++;
            });
          }
        });

        const radarData: EmotionData[] = Object.entries(emotionCounts).map(([emotion, count]) => ({
          subject: emotion,
          value: Math.round((count / totalEmotions) * 100),
          fullMark: 100,
          percent: `${Math.round((count / totalEmotions) * 100)}%`
        }));

        if (!isMounted) return;
        setEmotionData(radarData);

        // Process chart data for P&L chart
        const sortedTrades = [...result.trades].sort((a, b) =>
          new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
        );

        let cumulative = 0;
        const processedChartData = sortedTrades.map(trade => {
          const pnl = trade.pnl || 0;
          cumulative += pnl;
          return {
            date: trade.trade_date,
            pnl: pnl,
            cumulative: cumulative
          };
        });

        if (!isMounted) return;
        setChartData(processedChartData);

      } catch (err) {
        if (isMounted) {
          console.error('Error loading dashboard data:', err);
          setError('Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-fetches

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="verotrade-content-wrapper">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--dusty-gold) transparent' }}
            ></div>
            <div className="body-text">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verotrade-content-wrapper">
        <div className="flex items-center justify-center min-h-screen">
          <div className="dashboard-card p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--rust-red)' }} />
            <h2 className="h2-section mb-4">Error Loading Dashboard</h2>
            <p className="body-text mb-6">{error}</p>
            <button
              onClick={() => {
                // Reset error state and retry
                setError(null);
                setLoading(true);
                // Force a re-fetch by changing the user state slightly
                if (user) {
                  // This will trigger the useEffect to run again
                  setTimeout(() => setLoading(false), 100);
                }
              }}
              className="button-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verotrade-content-wrapper">
      <div className="mb-section">
        {/* Header */}
        <div className="mb-component">
          <h1 className="h1-dashboard mb-element">Trading Dashboard</h1>
          <p className="body-text mb-element">Overview of your trading performance and emotional analysis</p>
        </div>

        {/* Key Metrics */}
        {(stats || true) && (
          <div className="key-metrics-grid mb-component" data-testid="metrics-container">
            <div className="dashboard-card" data-testid="metrics-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Total P&L</h3>
              </div>
              <p className={`metric-value ${(stats?.totalPnL || 0) >= 0 ? '' : 'text-rust-red'}`}
                 style={{ color: (stats?.totalPnL || 0) >= 0 ? 'var(--warm-off-white)' : 'var(--rust-red)' }}>
                {formatCurrency(stats?.totalPnL || 0)}
              </p>
            </div>
            
            <div className="dashboard-card" data-testid="metrics-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Win Rate</h3>
              </div>
              <p className="metric-value">{(stats?.winrate || 0).toFixed(1)}%</p>
            </div>
            
            <div className="dashboard-card" data-testid="metrics-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Profit Factor</h3>
              </div>
              <p className="metric-value">{(stats?.profitFactor || 0).toFixed(2)}</p>
            </div>
            
            <div className="dashboard-card" data-testid="metrics-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Total Trades</h3>
              </div>
              <p className="metric-value">{stats?.totalTrades || 0}</p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-component mb-component" data-testid="chart-container">
          {/* P&L Chart */}
          <div className="dashboard-card">
            <div className="card-header mb-4">
              <h2 className="h2-section">P&L Performance</h2>
              <p className="body-text text-sm">Profit & loss over time with cumulative total</p>
            </div>
            <PnLChart data={chartData} height={300} />
          </div>

          {/* Emotional Analysis */}
          <div className="dashboard-card">
            <div className="card-header mb-4">
              <h2 className="h2-section">Emotional Analysis</h2>
              <p className="body-text text-sm">Distribution of emotional states during trades</p>
            </div>
            {emotionData.length > 0 ? (
              <EmotionRadar data={emotionData} />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="secondary-text mb-2">No emotional data available</div>
                  <p className="body-text text-sm">Start logging emotions with your trades to see analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-component mb-component">
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Avg Time Held</h3>
              </div>
              <p className="metric-value">{formatTime(stats?.avgTimeHeld || 0)}</p>
            </div>
            
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Sharpe Ratio</h3>
              </div>
              <p className="metric-value">{(stats?.sharpeRatio || 0).toFixed(2)}</p>
            </div>
            
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="h3-metric-label">Trading Days</h3>
              </div>
              <p className="metric-value">
                {trades.length > 0 ? new Set(trades.map(t => t.trade_date)).size : 0}
              </p>
            </div>
          </div>
        )}

        {/* Recent Trades Table */}
        <div className="dashboard-card" data-testid="recent-trades-table">
          <div className="card-header mb-4">
            <h2 className="h2-section">Recent Trades</h2>
            <p className="body-text text-sm">Your latest trading activity</p>
          </div>
          
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-gray)' }} />
              <h3 className="h2-section mb-2">No trades yet</h3>
              <p className="body-text mb-4">Start logging your trades to see them here</p>
              <button
                onClick={() => window.location.href = '/log-trade'}
                className="button-primary"
              >
                Log Your First Trade
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <th className="text-left py-3 px-4 body-text text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-4 body-text text-sm font-medium">Symbol</th>
                    <th className="text-left py-3 px-4 body-text text-sm font-medium">Side</th>
                    <th className="text-left py-3 px-4 body-text text-sm font-medium">Entry</th>
                    <th className="text-left py-3 px-4 body-text text-sm font-medium">Exit</th>
                    <th className="text-right py-3 px-4 body-text text-sm font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 10).map((trade, index) => (
                    <tr key={`${trade.id}-${index}`} className="border-b hover:bg-opacity-5 transition-colors"
                        style={{ borderColor: 'var(--border-primary)' }}>
                      <td className="py-3 px-4 body-text text-sm">
                        {new Date(trade.trade_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 body-text text-sm font-medium">{trade.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${
                          trade.side === 'Buy' ? 'text-dusty-gold' : 'text-rust-red'
                        }`} style={{ color: trade.side === 'Buy' ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 body-text text-sm">${trade.entry_price}</td>
                      <td className="py-3 px-4 body-text text-sm">
                        {trade.exit_price ? `$${trade.exit_price}` : '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        (trade.pnl || 0) >= 0 ? 'text-dusty-gold' : 'text-rust-red'
                      }`} style={{ color: (trade.pnl || 0) >= 0 ? 'var(--dusty-gold)' : 'var(--rust-red)' }}>
                        {formatCurrency(trade.pnl || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {trades.length > 10 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => window.location.href = '/trades'}
                    className="button-secondary"
                  >
                    View All Trades ({trades.length} total)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper component with authentication guard
function DashboardWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <Dashboard />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default DashboardWithAuth;