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

function DiagnosticContent() {
  const { session } = useAuth();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>({});

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

        console.log('🔍 [DIAGNOSTIC] Starting fetch process...');

        // Fetch all trades for PnL chart
        const allTradesResponse = await fetch('/api/confluence-trades?limit=2000&sortBy=trade_date&sortOrder=asc', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('🔍 [DIAGNOSTIC] API Response status:', allTradesResponse.status);

        if (!allTradesResponse.ok) {
          throw new Error(`Failed to fetch all trades: ${allTradesResponse.statusText}`);
        }

        const allTradesData = await allTradesResponse.json();
        
        console.log('🔍 [DIAGNOSTIC] Raw API response:', {
          tradesCount: allTradesData.trades?.length || 0,
          totalCount: allTradesData.totalCount,
          sampleTrade: allTradesData.trades?.[0]
        });

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

        console.log('🔍 [DIAGNOSTIC] Processed trades data:', {
          processedCount: processedAllTrades.length,
          hasRequiredFields: processedAllTrades[0] ? {
            hasTradeDate: !!processedAllTrades[0].trade_date,
            hasPnl: !!processedAllTrades[0].pnl,
            hasId: !!processedAllTrades[0].id
          } : null,
          sampleProcessedTrade: processedAllTrades[0]
        });

        setAllTrades(processedAllTrades);
        
        // Set diagnostic info
        setDiagnosticInfo({
          rawTradesCount: allTradesData.trades?.length || 0,
          processedTradesCount: processedAllTrades.length,
          totalPnL: processedAllTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
          dateRange: {
            first: processedAllTrades[0]?.trade_date,
            last: processedAllTrades[processedAllTrades.length - 1]?.trade_date
          }
        });

      } catch (err) {
        console.error('🔍 [DIAGNOSTIC] Error fetching all trades:', err);
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
          <div className="text-xl">Loading diagnostic data...</div>
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
          <h1 className="text-4xl font-bold text-[#E6D5B8]">PnL Chart Diagnostic</h1>
          <p className="text-xl text-[#9ca3af]">
            Comprehensive diagnosis of PnL chart data flow
          </p>
        </div>

        {/* Diagnostic Information */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Diagnostic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-lg">Raw Trades Count: <span className="text-[#2EBD85] font-bold">{diagnosticInfo.rawTradesCount}</span></p>
              <p className="text-lg">Processed Trades Count: <span className="text-[#2EBD85] font-bold">{diagnosticInfo.processedTradesCount}</span></p>
              <p className="text-lg">Total P&L: <span className="text-[#C5A065] font-bold">${diagnosticInfo.totalPnL?.toFixed(2)}</span></p>
            </div>
            <div className="space-y-2">
              <p className="text-lg">Date Range:</p>
              <p className="text-sm text-[#9ca3af]">First: <span className="text-[#EAEAEA]">{diagnosticInfo.dateRange?.first}</span></p>
              <p className="text-sm text-[#9ca3af]">Last: <span className="text-[#EAEAEA]">{diagnosticInfo.dateRange?.last}</span></p>
            </div>
          </div>
        </div>

        {/* Chart Test */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">PnL Chart Test</h2>
          <div className="h-96 border border-[#333] rounded">
            {(() => {
              console.log('🔍 [DIAGNOSTIC] About to render PnlChart with:', {
                tradesCount: allTrades.length,
                hasTrades: allTrades.length > 0,
                sampleTrade: allTrades[0]
              });
              return null;
            })()}
            <PnlChart trades={allTrades} />
          </div>
        </div>

        {/* Manual Data Structure Test */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Data Structure Verification</h2>
          <div className="space-y-4">
            <div className="bg-[#2A2A2A] p-4 rounded">
              <h3 className="text-lg font-medium text-[#E6D5B8] mb-2">First Trade Sample:</h3>
              <pre className="text-xs text-[#9ca3af] overflow-x-auto">
                {JSON.stringify(allTrades[0] || {}, null, 2)}
              </pre>
            </div>
            <div className="bg-[#2A2A2A] p-4 rounded">
              <h3 className="text-lg font-medium text-[#E6D5B8] mb-2">Last Trade Sample:</h3>
              <pre className="text-xs text-[#9ca3af] overflow-x-auto">
                {JSON.stringify(allTrades[allTrades.length - 1] || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Manual Cumulative Calculation */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-[#E6D5B8] mb-4">Manual Cumulative P&L Calculation</h2>
          <div className="space-y-2">
            <p className="text-lg">First 10 Cumulative Values:</p>
            <div className="grid grid-cols-5 gap-2 text-sm">
              {(() => {
                let cumulative = 0;
                return allTrades.slice(0, 10).map((trade, index) => {
                  cumulative += trade.pnl || 0;
                  return (
                    <div key={index} className="bg-[#2A2A2A] p-2 rounded text-center">
                      <div className="text-[#9ca3af]">#{index + 1}</div>
                      <div className="text-[#EAEAEA] font-bold">${cumulative.toFixed(2)}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with authentication guard
function DiagnosticWithAuth() {
  return (
    <AuthGuard requireAuth={true}>
      <UnifiedLayout>
        <DiagnosticContent />
      </UnifiedLayout>
    </AuthGuard>
  );
}

export default DiagnosticWithAuth;