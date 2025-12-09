'use client';

import React, { useState, useEffect } from 'react';
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
  pnl?: number;
  trade_date?: string;
}

function SimpleTestContent() {
  const { session } = useAuth();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllTrades = async () => {
      if (!session?.access_token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all trades for PnL chart
        const allTradesResponse = await fetch('/api/confluence-trades?limit=2000&sortBy=trade_date&sortOrder=asc', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!allTradesResponse.ok) {
          throw new Error('Failed to fetch all trades');
        }

        const allTradesData = await allTradesResponse.json();

        // Process all trades data
        const processedAllTrades: Trade[] = (allTradesData.trades || []).map((trade: any) => ({
          id: trade.id,
          date: new Date(trade.trade_date).toLocaleDateString(),
          symbol: trade.symbol,
          side: trade.side,
          entry: trade.entry_price,
          exit: trade.exit_price || 0,
          return: trade.pnl || 0,
          pnl: trade.pnl || 0,
          trade_date: trade.trade_date,
        }));

        setAllTrades(processedAllTrades);

      } catch (err) {
        console.error('Error fetching all trades:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    fetchAllTrades();
  }, [session]);

  // Manual chart rendering test
  const renderSimpleChart = () => {
    try {
      console.log('🔍 [SIMPLE_TEST] Attempting to render simple chart...');
      
      // Create cumulative P&L data manually
      let cumulativePnL = 0;
      const chartData = allTrades.map((trade) => {
        cumulativePnL += trade.pnl || 0;
        return {
          x: trade.trade_date,
          y: cumulativePnL
        };
      });

      console.log('🔍 [SIMPLE_TEST] Manual chart data:', {
        totalPoints: chartData.length,
        firstPoint: chartData[0],
        lastPoint: chartData[chartData.length - 1],
        finalPnL: cumulativePnL
      });

      // Try to render using Canvas API directly
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Simple line chart drawing
      const width = 800;
      const height = 400;
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Set styles
      ctx.strokeStyle = '#E6D5B8';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#050505';

      // Fill background
      ctx.fillRect(0, 0, width, height);

      if (chartData.length === 0) {
        ctx.fillStyle = '#EAEAEA';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return canvas;
      }

      // Find min and max values for scaling
      const minY = Math.min(...chartData.map(d => d.y));
      const maxY = Math.max(...chartData.map(d => d.y));
      const rangeY = maxY - minY || 1;

      // Draw line
      ctx.beginPath();
      chartData.forEach((point, index) => {
        const x = (index / (chartData.length - 1)) * (width - 40) + 20;
        const y = height - 40 - ((point.y - minY) / rangeY) * (height - 80);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw axes
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, height - 40);
      ctx.lineTo(width - 20, height - 40);
      ctx.moveTo(20, 20);
      ctx.lineTo(20, height - 40);
      ctx.stroke();

      // Draw labels
      ctx.fillStyle = '#555';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(`$${maxY.toFixed(0)}`, 15, 25);
      ctx.fillText(`$${minY.toFixed(0)}`, 15, height - 35);

      return canvas;

    } catch (err) {
      console.error('🔍 [SIMPLE_TEST] Chart rendering error:', err);
      setChartError(err instanceof Error ? err.message : 'Chart rendering failed');
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter'] flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading trades data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter'] flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-['Inter'] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#E6D5B8]">Simple PnL Chart Test</h1>
          <p className="text-xl text-[#9ca3af]">
            Testing chart rendering with {allTrades.length} trades
          </p>
        </div>

        {/* Trade Count Verification */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Data Verification</h2>
          <div className="space-y-2">
            <p className="text-lg">Total trades fetched: <span className="text-[#2EBD85] font-bold">{allTrades.length}</span></p>
            <p className="text-lg">Expected trades: <span className="text-[#C5A065] font-bold">995</span></p>
            <p className="text-lg">Total P&L: <span className="text-[#E6D5B8] font-bold">${allTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0).toFixed(2)}</span></p>
            <p className="text-lg">Status: 
              <span className={`font-bold ${allTrades.length === 995 ? 'text-[#2EBD85]' : 'text-[#F6465D]'}`}>
                {allTrades.length === 995 ? ' ✅ PASS' : ' ❌ FAIL'}
              </span>
            </p>
          </div>
        </div>

        {/* Simple Canvas Chart */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Simple Canvas Chart</h2>
          <div className="flex justify-center">
            {(() => {
              const canvas = renderSimpleChart();
              if (canvas) {
                return <div ref={(node) => {
                  if (node) {
                    node.appendChild(canvas);
                  }
                }} />;
              } else {
                return <div className="text-red-500">Chart rendering failed</div>;
              }
            })()}
          </div>
          {chartError && (
            <div className="mt-4 text-red-500">
              Chart Error: {chartError}
            </div>
          )}
        </div>

        {/* Raw Data Sample */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Raw Data Sample</h2>
          <div className="space-y-2">
            <p className="text-sm text-[#9ca3af]">First 3 trades:</p>
            <pre className="text-xs text-[#EAEAEA] bg-[#2A2A2A] p-2 rounded overflow-x-auto">
              {JSON.stringify(allTrades.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with authentication guard
function SimpleTestWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <SimpleTestContent />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default SimpleTestWithAuth;