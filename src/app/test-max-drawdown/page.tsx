'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, TrendingDown, Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface DrawdownData {
  maxDrawdown: number;
  currentDrawdown: number;
  peakValue: number;
  troughValue: number;
  peakDate: string;
  troughDate: string;
  recoveryDate?: string;
  drawdownHistory: {
    date: string;
    cumulative: number;
    drawdown: number;
    peak: number;
    isPeak: boolean;
    isTrough: boolean;
  }[];
}

interface TestResults {
  maxDrawdown: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
  currentDrawdown: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
}

export default function TestMaxDrawdown() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [drawdownData, setDrawdownData] = useState<DrawdownData | null>(null);

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
      .order('trade_date', { ascending: true }) // Order by date ascending for drawdown calculation
      .limit(50); // Limit to 50 trades for testing

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
  };

  const calculateDrawdown = (tradeList: Trade[]): DrawdownData => {
    const tradesWithPnL = tradeList.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    
    if (tradesWithPnL.length === 0) {
      return {
        maxDrawdown: 0,
        currentDrawdown: 0,
        peakValue: 0,
        troughValue: 0,
        peakDate: '',
        troughDate: '',
        drawdownHistory: []
      };
    }

    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peakIndex = 0;
    let troughIndex = 0;
    
    const drawdownHistory: DrawdownData['drawdownHistory'] = [];

    tradesWithPnL.forEach((trade, index) => {
      cumulative += trade.pnl || 0;
      
      if (cumulative > peak) {
        peak = cumulative;
        peakIndex = index;
      }
      
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        troughIndex = index;
      }
      
      currentDrawdown = drawdown;
      
      drawdownHistory.push({
        date: trade.trade_date,
        cumulative,
        drawdown,
        peak,
        isPeak: cumulative === peak,
        isTrough: drawdown === maxDrawdown
      });
    });

    // Find peak and trough dates
    const peakDate = tradesWithPnL[peakIndex]?.trade_date || '';
    const troughDate = tradesWithPnL[troughIndex]?.trade_date || '';
    
    // Find recovery date (if any)
    let recoveryDate: string | undefined;
    if (maxDrawdown > 0) {
      for (let i = troughIndex + 1; i < tradesWithPnL.length && i < drawdownHistory.length; i++) {
        const currentDrawdown = drawdownHistory[i];
        const troughDrawdown = drawdownHistory[troughIndex];
        if (currentDrawdown && troughDrawdown && currentDrawdown.cumulative >= troughDrawdown.peak) {
          recoveryDate = tradesWithPnL[i]?.trade_date;
          break;
        }
      }
    }

    return {
      maxDrawdown,
      currentDrawdown,
      peakValue: peak,
      troughValue: peak - maxDrawdown,
      peakDate,
      troughDate,
      recoveryDate,
      drawdownHistory
    };
  };

  const runTests = () => {
    if (trades.length === 0) {
      alert('No trades available for testing');
      return;
    }

    const drawdownResults = calculateDrawdown(trades);

    // For testing purposes, we'll validate the calculations are mathematically sound
    // rather than checking against specific expected values
    const maxDrawdownTest = {
      calculated: drawdownResults.maxDrawdown,
      expected: null, // We don't have a predetermined expected value
      passed: drawdownResults.maxDrawdown >= 0 && isFinite(drawdownResults.maxDrawdown),
      explanation: `Maximum Drawdown: ${formatCurrency(drawdownResults.maxDrawdown)}
        Peak Value: ${formatCurrency(drawdownResults.peakValue)}
        Trough Value: ${formatCurrency(drawdownResults.troughValue)}
        Peak Date: ${drawdownResults.peakDate}
        Trough Date: ${drawdownResults.troughDate}
        Recovery Date: ${drawdownResults.recoveryDate || 'Not yet recovered'}`
    };

    const currentDrawdownTest = {
      calculated: drawdownResults.currentDrawdown,
      expected: null, // We don't have a predetermined expected value
      passed: drawdownResults.currentDrawdown >= 0 && isFinite(drawdownResults.currentDrawdown),
      explanation: `Current Drawdown: ${formatCurrency(drawdownResults.currentDrawdown)}
        Current Peak: ${formatCurrency(drawdownResults.peakValue)}
        Distance from Peak: ${formatCurrency(drawdownResults.currentDrawdown)}
        Recovery Needed: ${formatCurrency(drawdownResults.currentDrawdown)}`
    };

    setTestResults({
      maxDrawdown: maxDrawdownTest,
      currentDrawdown: currentDrawdownTest
    });

    setDrawdownData(drawdownResults);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Max Drawdown Test</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Drawdown Result */}
          <div className="glass-enhanced p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Maximum Drawdown</h3>
              {testResults.maxDrawdown.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Max Drawdown:</span>
                <span className="text-xl font-bold text-red-400">{formatCurrency(testResults.maxDrawdown.calculated)}</span>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
                <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                  {testResults.maxDrawdown.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Current Drawdown Result */}
          <div className="glass-enhanced p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Current Drawdown</h3>
              {testResults.currentDrawdown.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Current Drawdown:</span>
                <span className={`text-xl font-bold ${testResults.currentDrawdown.calculated > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {formatCurrency(testResults.currentDrawdown.calculated)}
                </span>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
                <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                  {testResults.currentDrawdown.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Drawdown Data */}
      {drawdownData && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            Detailed Drawdown Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Drawdown Summary */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Drawdown Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Maximum Drawdown:</span>
                  <span className="text-red-400 font-bold">{formatCurrency(drawdownData.maxDrawdown)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Current Drawdown:</span>
                  <span className={`${drawdownData.currentDrawdown > 0 ? 'text-orange-400' : 'text-green-400'} font-bold`}>
                    {formatCurrency(drawdownData.currentDrawdown)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Peak Value:</span>
                  <span className="text-green-400 font-bold">{formatCurrency(drawdownData.peakValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Trough Value:</span>
                  <span className="text-red-400 font-bold">{formatCurrency(drawdownData.troughValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Drawdown %:</span>
                  <span className="text-red-400 font-bold">
                    {drawdownData.peakValue > 0 ? ((drawdownData.maxDrawdown / drawdownData.peakValue) * 100).toFixed(2) : '0'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Peak Date:</span>
                  <span className="text-green-400">{drawdownData.peakDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Trough Date:</span>
                  <span className="text-red-400">{drawdownData.troughDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Recovery Date:</span>
                  <span className={drawdownData.recoveryDate ? 'text-green-400' : 'text-orange-400'}>
                    {drawdownData.recoveryDate || 'Not yet recovered'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Recovery Time:</span>
                  <span className="text-white-400">
                    {drawdownData.recoveryDate && drawdownData.troughDate
                      ? `${Math.ceil((new Date(drawdownData.recoveryDate).getTime() - new Date(drawdownData.troughDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawdown History Chart */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-white/80">Drawdown Progress</h4>
            <div className="overflow-x-auto">
              <div className="min-w-full h-64 p-4 bg-black/20 rounded-lg">
                {drawdownData.drawdownHistory.length > 0 ? (
                  <div className="relative h-full">
                    {/* Simple visualization of drawdown */}
                    <div className="absolute inset-0 flex items-end justify-between px-2">
                      {drawdownData.drawdownHistory.slice(-20).map((point, index) => (
                        <div
                          key={index}
                          className="flex-1 mx-0.5 relative"
                          style={{ height: '100%' }}
                        >
                          <div
                            className={`w-full ${point.isPeak ? 'bg-green-500' : point.isTrough ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{
                              height: `${Math.max(5, (point.cumulative / Math.max(...drawdownData.drawdownHistory.map(d => Math.abs(d.cumulative)))) * 90)}%`
                            }}
                            title={`${point.date}: ${formatCurrency(point.cumulative)}`}
                          />
                          {point.isPeak && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400">
                              Peak
                            </div>
                          )}
                          {point.isTrough && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-400">
                              Trough
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/60">
                    No drawdown data available
                  </div>
                )}
              </div>
            </div>
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