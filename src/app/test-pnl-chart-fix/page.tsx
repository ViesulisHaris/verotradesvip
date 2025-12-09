'use client';

import React, { useState, useEffect } from 'react';
import { PnlChart } from '@/components/Charts';
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

function TestContent() {
  const { session } = useAuth();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="text-4xl font-bold text-[#E6D5B8]">PnL Chart Test</h1>
          <p className="text-xl text-[#9ca3af]">
            Verifying that the PnL chart receives all {allTrades.length} trades
          </p>
        </div>

        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Trade Count Verification</h2>
          <div className="space-y-2">
            <p className="text-lg">Total trades fetched: <span className="text-[#2EBD85] font-bold">{allTrades.length}</span></p>
            <p className="text-lg">Expected trades: <span className="text-[#C5A065] font-bold">995</span></p>
            <p className="text-lg">Status: 
              <span className={`font-bold ${allTrades.length === 995 ? 'text-[#2EBD85]' : 'text-[#F6465D]'}`}>
                {allTrades.length === 995 ? ' ✅ PASS' : ' ❌ FAIL'}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">PnL Chart</h2>
          <div className="h-96">
            <PnlChart trades={allTrades} />
          </div>
        </div>

        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Trade Sample</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-2 px-4 font-medium text-[#9ca3af]">Date</th>
                  <th className="text-left py-2 px-4 font-medium text-[#9ca3af]">Symbol</th>
                  <th className="text-left py-2 px-4 font-medium text-[#9ca3af]">Side</th>
                  <th className="text-right py-2 px-4 font-medium text-[#9ca3af]">P&L</th>
                </tr>
              </thead>
              <tbody>
                {allTrades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="border-b border-[#333]">
                    <td className="py-2 px-4 text-[#EAEAEA]">{trade.date}</td>
                    <td className="py-2 px-4 text-[#EAEAEA] font-medium">{trade.symbol}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        trade.side === 'Buy'
                          ? 'bg-[#2EBD85]/20 text-[#2EBD85]'
                          : 'bg-[#F6465D]/20 text-[#F6465D]'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className={`py-2 px-4 text-right font-medium ${
                      (trade.pnl || 0) > 0 ? 'text-[#2EBD85]' : 'text-[#F6465D]'
                    }`}>
                      ${trade.pnl?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allTrades.length > 10 && (
              <p className="text-center text-[#9ca3af] mt-4">
                Showing first 10 of {allTrades.length} trades
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with authentication guard
function TestWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <TestContent />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default TestWithAuth;