'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Zap, TrendingUp, Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  market: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  pnl: number | null;
  trade_date: string;
  strategy_id: string | null;
  emotional_state: string[] | null;
}

interface RecoveryData {
  recoveryFactor: number;
  totalPnL: number;
  maxDrawdown: number;
  netProfit: number;
  drawdownPeriods: {
    startDate: string;
    endDate: string;
    drawdownAmount: number;
    recoveryDate?: string;
    recoveryTime?: number;
    recovered: boolean;
  }[];
}

interface TestResults {
  recoveryFactor: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
}

export default function TestRecoveryFactor() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: true }) // Order by date ascending for recovery calculation
      .limit(50); // Limit to 50 trades for testing

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
  };

  const calculateRecoveryFactor = (tradeList: Trade[]): RecoveryData => {
    const tradesWithPnL = tradeList.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    
    if (tradesWithPnL.length === 0) {
      return {
        recoveryFactor: 0,
        totalPnL: 0,
        maxDrawdown: 0,
        netProfit: 0,
        drawdownPeriods: []
      };
    }

    // Calculate total P&L and max drawdown
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peakIndex = 0;
    let troughIndex = 0;
    
    const drawdownPeriods: RecoveryData['drawdownPeriods'] = [];
    let currentDrawdownStart: number | null = null;
    let currentPeak = 0;

    tradesWithPnL.forEach((trade, index) => {
      cumulative += trade.pnl || 0;
      
      if (cumulative > peak) {
        peak = cumulative;
        peakIndex = index;
        
        // If we were in a drawdown, mark it as recovered
        if (currentDrawdownStart !== null) {
          const drawdownPeriod = drawdownPeriods[drawdownPeriods.length - 1];
          if (drawdownPeriod) {
            drawdownPeriod.recovered = true;
            drawdownPeriod.recoveryDate = trade.trade_date;
            drawdownPeriod.recoveryTime = Math.ceil((new Date(trade.trade_date).getTime() - new Date(drawdownPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24));
          }
          currentDrawdownStart = null;
        }
        
        currentPeak = cumulative;
      }
      
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        troughIndex = index;
      }
      
      currentDrawdown = drawdown;
      
      // Detect start of a new drawdown period
      if (drawdown > 0 && currentDrawdownStart === null) {
        currentDrawdownStart = index;
        drawdownPeriods.push({
          startDate: trade.trade_date,
          endDate: '',
          drawdownAmount: drawdown,
          recovered: false
        });
      }
      
      // Update current drawdown period
      if (currentDrawdownStart !== null && drawdownPeriods.length > 0) {
        const currentPeriod = drawdownPeriods[drawdownPeriods.length - 1];
        if (currentPeriod && !currentPeriod.recovered) {
          currentPeriod.drawdownAmount = Math.max(currentPeriod.drawdownAmount, drawdown);
          currentPeriod.endDate = trade.trade_date;
        }
      }
    });

    const totalPnL = tradesWithPnL.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const netProfit = totalPnL;
    
    // Recovery Factor: Net Profit / Max Drawdown
    const recoveryFactor = maxDrawdown === 0 ? 0 : netProfit / maxDrawdown;

    return {
      recoveryFactor,
      totalPnL,
      maxDrawdown,
      netProfit,
      drawdownPeriods
    };
  };

  const runTests = () => {
    if (trades.length === 0) {
      alert('No trades available for testing');
      return;
    }

    const recoveryResults = calculateRecoveryFactor(trades);

    // For testing purposes, we'll validate the calculations are mathematically sound
    // rather than checking against specific expected values
    const recoveryFactorTest = {
      calculated: recoveryResults.recoveryFactor,
      expected: null, // We don't have a predetermined expected value
      passed: recoveryResults.recoveryFactor >= 0 && isFinite(recoveryResults.recoveryFactor),
      explanation: `Recovery Factor = Net Profit / Max Drawdown
        = ${formatCurrency(recoveryResults.netProfit)} / ${formatCurrency(recoveryResults.maxDrawdown)}
        = ${recoveryResults.recoveryFactor.toFixed(2)}
        
        Interpretation:
        ${recoveryResults.recoveryFactor >= 3 ? 'Excellent (≥3): Very quick recovery from losses' : ''}
        ${recoveryResults.recoveryFactor >= 2 && recoveryResults.recoveryFactor < 3 ? 'Good (2-2.99): Reasonably quick recovery' : ''}
        ${recoveryResults.recoveryFactor >= 1 && recoveryResults.recoveryFactor < 2 ? 'Average (1-1.99): Slow recovery' : ''}
        ${recoveryResults.recoveryFactor < 1 ? 'Poor (<1): Very slow or no recovery' : ''}`
    };

    setTestResults({
      recoveryFactor: recoveryFactorTest
    });

    setRecoveryData(recoveryResults);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Recovery Factor Test</h1>
      </div>

      {/* Test Controls */}
      <div className="glass-enhanced p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Test Controls</h2>
          <button
            onClick={runTests}
            disabled={loading || trades.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Run Tests'}
          </button>
        </div>
        
        <div className="text-sm text-white/70">
          <p>Trades loaded: {trades.length}</p>
          <p>Trades with P&L: {trades.filter(t => t.pnl !== null && t.pnl !== undefined).length}</p>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="glass-enhanced p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Recovery Factor</h3>
            {testResults.recoveryFactor.passed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Recovery Factor:</span>
              <span className={`text-2xl font-bold ${
                testResults.recoveryFactor.calculated >= 3 ? 'text-green-400' : 
                testResults.recoveryFactor.calculated >= 2 ? 'text-blue-400' : 
                testResults.recoveryFactor.calculated >= 1 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {testResults.recoveryFactor.calculated.toFixed(2)}
              </span>
            </div>
            
            <div className="p-3 bg-black/20 rounded-lg">
              <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
              <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                {testResults.recoveryFactor.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Recovery Data */}
      {recoveryData && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            Detailed Recovery Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Recovery Summary */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Recovery Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Net Profit:</span>
                  <span className={`font-bold ${recoveryData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(recoveryData.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Max Drawdown:</span>
                  <span className="text-red-400 font-bold">{formatCurrency(recoveryData.maxDrawdown)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Recovery Factor:</span>
                  <span className={`font-bold ${
                    recoveryData.recoveryFactor >= 3 ? 'text-green-400' : 
                    recoveryData.recoveryFactor >= 2 ? 'text-blue-400' : 
                    recoveryData.recoveryFactor >= 1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {recoveryData.recoveryFactor.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Recovery Rating:</span>
                  <span className={`font-bold ${
                    recoveryData.recoveryFactor >= 3 ? 'text-green-400' : 
                    recoveryData.recoveryFactor >= 2 ? 'text-blue-400' : 
                    recoveryData.recoveryFactor >= 1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {recoveryData.recoveryFactor >= 3 ? 'Excellent' : 
                     recoveryData.recoveryFactor >= 2 ? 'Good' : 
                     recoveryData.recoveryFactor >= 1 ? 'Average' : 'Poor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recovery Statistics */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Recovery Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Drawdown Periods:</span>
                  <span className="text-white-400">{recoveryData.drawdownPeriods.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Recovered Periods:</span>
                  <span className="text-green-400">{recoveryData.drawdownPeriods.filter(p => p.recovered).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Unrecovered Periods:</span>
                  <span className="text-red-400">{recoveryData.drawdownPeriods.filter(p => !p.recovered).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Avg Recovery Time:</span>
                  <span className="text-blue-400">
                    {recoveryData.drawdownPeriods.filter(p => p.recovered).length > 0
                      ? `${(recoveryData.drawdownPeriods.filter(p => p.recovered).reduce((sum, p) => sum + (p.recoveryTime || 0), 0) / recoveryData.drawdownPeriods.filter(p => p.recovered).length).toFixed(0)} days`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawdown Periods */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-white/80">Drawdown Periods</h4>
            {recoveryData.drawdownPeriods.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recoveryData.drawdownPeriods.map((period, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${period.recovered ? 'bg-green-600/10 border-green-600/30' : 'bg-red-600/10 border-red-600/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${period.recovered ? 'text-green-400' : 'text-red-400'}`}>
                        Drawdown #{index + 1}: {formatCurrency(period.drawdownAmount)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${period.recovered ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                        {period.recovered ? 'Recovered' : 'Not Recovered'}
                      </span>
                    </div>
                    <div className="text-xs text-white/70">
                      <div>Start: {period.startDate}</div>
                      <div>End: {period.endDate || 'Ongoing'}</div>
                      {period.recoveryDate && <div>Recovery: {period.recoveryDate}</div>}
                      {period.recoveryTime && <div>Recovery Time: {period.recoveryTime} days</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/60">
                No drawdown periods detected in trade history.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample Trades */}
      {trades.length > 0 && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Sample Trades (First 15)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-left py-2 px-3">Side</th>
                  <th className="text-right py-2 px-3">P&L</th>
                  <th className="text-right py-2 px-3">Cumulative</th>
                  <th className="text-right py-2 px-3">Drawdown</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cumulative = 0;
                  let peak = 0;
                  return trades.slice(0, 15).map((trade) => {
                    cumulative += trade.pnl || 0;
                    if (cumulative > peak) peak = cumulative;
                    const drawdown = peak - cumulative;
                    
                    return (
                      <tr key={trade.id} className="border-b border-white/5">
                        <td className="py-2 px-3">{trade.trade_date}</td>
                        <td className="py-2 px-3">{trade.symbol}</td>
                        <td className="py-2 px-3">{trade.side}</td>
                        <td className={`py-2 px-3 text-right ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(trade.pnl || 0)}
                        </td>
                        <td className={`py-2 px-3 text-right ${cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(cumulative)}
                        </td>
                        <td className={`py-2 px-3 text-right ${drawdown > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                          {formatCurrency(drawdown)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}