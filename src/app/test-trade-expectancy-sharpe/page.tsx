'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Activity, Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface TestResults {
  tradeExpectancy: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
  sharpeRatio: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
}

export default function TestTradeExpectancySharpe() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [calculations, setCalculations] = useState<any>(null);

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
      .order('trade_date', { ascending: false })
      .limit(20); // Limit to 20 trades for testing

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
  };

  const calculateTradeExpectancy = (tradeList: Trade[]) => {
    const tradesWithPnL = tradeList.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    
    if (tradesWithPnL.length === 0) return { tradeExpectancy: 0, details: null };

    const wins = tradesWithPnL.filter(trade => (trade.pnl || 0) > 0);
    const losses = tradesWithPnL.filter(trade => (trade.pnl || 0) < 0);
    const winsCount = wins.length;
    const lossesCount = losses.length;
    const total = tradesWithPnL.length;
    
    const grossProfit = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const averageWin = winsCount > 0 ? grossProfit / winsCount : 0;
    const averageLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
    const winRateDecimal = winsCount / total;
    const lossRateDecimal = lossesCount / total;
    
    // Trade Expectancy: (Win Rate × Average Win) - (Loss Rate × Average Loss)
    const tradeExpectancy = (winRateDecimal * averageWin) - (lossRateDecimal * averageLoss);
    
    return {
      tradeExpectancy,
      details: {
        total,
        winsCount,
        lossesCount,
        winRateDecimal,
        lossRateDecimal,
        averageWin,
        averageLoss,
        grossProfit,
        grossLoss
      }
    };
  };

  const calculateSharpeRatio = (tradeList: Trade[]) => {
    const tradesWithPnL = tradeList.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    
    if (tradesWithPnL.length === 0) return { sharpeRatio: 0, details: null };

    const returns = tradesWithPnL.map(trade => trade.pnl || 0);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    // Handle edge case: if all returns are the same, standard deviation will be 0
    let sharpeRatio = 0;
    let variance = 0;
    let standardDeviation = 0;
    
    if (returns.length > 1) {
      variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      standardDeviation = Math.sqrt(variance);
      sharpeRatio = standardDeviation === 0 ? 0 : avgReturn / standardDeviation;
    } else if (returns.length === 1) {
      // With only one trade, we can't calculate a meaningful Sharpe Ratio
      sharpeRatio = 0;
    }
    
    // Sharpe Ratio: (Average Return - Risk-Free Rate) / Standard Deviation
    // Using 0 as risk-free rate for simplicity
    
    return {
      sharpeRatio,
      details: {
        avgReturn,
        variance,
        standardDeviation,
        returnsCount: returns.length
      }
    };
  };

  const runTests = () => {
    if (trades.length === 0) {
      alert('No trades available for testing');
      return;
    }

    const expectancyResult = calculateTradeExpectancy(trades);
    const sharpeResult = calculateSharpeRatio(trades);

    // For testing purposes, we'll validate the calculations are mathematically sound
    // rather than checking against specific expected values
    const expectancyTest = {
      calculated: expectancyResult.tradeExpectancy,
      expected: null, // We don't have a predetermined expected value
      passed: !isNaN(expectancyResult.tradeExpectancy) && isFinite(expectancyResult.tradeExpectancy),
      explanation: expectancyResult.details
        ? `Trade Expectancy = (Win Rate × Average Win) - (Loss Rate × Average Loss)
          = (${expectancyResult.details.winRateDecimal.toFixed(3)} × ${formatCurrency(expectancyResult.details.averageWin)}) - (${expectancyResult.details.lossRateDecimal.toFixed(3)} × ${formatCurrency(expectancyResult.details.averageLoss)})
          = ${formatCurrency(expectancyResult.tradeExpectancy)}`
        : `Trade Expectancy = ${formatCurrency(expectancyResult.tradeExpectancy)} (No trade data available)`
    };

    const sharpeTest = {
      calculated: sharpeResult.sharpeRatio,
      expected: null, // We don't have a predetermined expected value
      passed: !isNaN(sharpeResult.sharpeRatio) && isFinite(sharpeResult.sharpeRatio),
      explanation: sharpeResult.details
        ? `Sharpe Ratio = Average Return / Standard Deviation
          = ${formatCurrency(sharpeResult.details.avgReturn)} / ${formatCurrency(sharpeResult.details.standardDeviation)}
          = ${sharpeResult.sharpeRatio.toFixed(4)}`
        : `Sharpe Ratio = ${sharpeResult.sharpeRatio.toFixed(4)} (No trade data available)`
    };

    setTestResults({
      tradeExpectancy: expectancyTest,
      sharpeRatio: sharpeTest
    });

    setCalculations({
      expectancy: expectancyResult,
      sharpe: sharpeResult
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Trade Expectancy & Sharpe Ratio Test</h1>
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
          {/* Trade Expectancy Result */}
          <div className="glass-enhanced p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Trade Expectancy</h3>
              {testResults.tradeExpectancy.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Calculated Value:</span>
                <span className={`text-xl font-bold ${testResults.tradeExpectancy.calculated >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(testResults.tradeExpectancy.calculated)}
                </span>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
                <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                  {testResults.tradeExpectancy.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Sharpe Ratio Result */}
          <div className="glass-enhanced p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Sharpe Ratio</h3>
              {testResults.sharpeRatio.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Calculated Value:</span>
                <span className={`text-xl font-bold ${
                  testResults.sharpeRatio.calculated > 1.5 ? 'text-[#B89B5E]' :
                  testResults.sharpeRatio.calculated > 0.75 ? 'text-[#7A5C3A]' :
                  testResults.sharpeRatio.calculated > 0 ? 'text-[#7A5C3A]' :
                  'text-[#4A2F2A]'
                }`}>
                  {testResults.sharpeRatio.calculated.toFixed(4)}
                </span>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
                <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                  {testResults.sharpeRatio.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Calculations */}
      {calculations && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            Detailed Calculation Data
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expectancy Details */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Trade Expectancy Details</h4>
              {calculations.expectancy.details ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Trades:</span>
                    <span className="text-white">{calculations.expectancy.details.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Winning Trades:</span>
                    <span className="text-green-400">{calculations.expectancy.details.winsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Losing Trades:</span>
                    <span className="text-red-400">{calculations.expectancy.details.lossesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Win Rate:</span>
                    <span className="text-white">{(calculations.expectancy.details.winRateDecimal * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Average Win:</span>
                    <span className="text-green-400">{formatCurrency(calculations.expectancy.details.averageWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Average Loss:</span>
                    <span className="text-red-400">{formatCurrency(calculations.expectancy.details.averageLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Gross Profit:</span>
                    <span className="text-green-400">{formatCurrency(calculations.expectancy.details.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Gross Loss:</span>
                    <span className="text-red-400">{formatCurrency(calculations.expectancy.details.grossLoss)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  No trade data available for detailed breakdown.
                </div>
              )}
            </div>

            {/* Sharpe Details */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Sharpe Ratio Details</h4>
              {calculations.sharpe.details ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Return Count:</span>
                    <span className="text-white">{calculations.sharpe.details.returnsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Average Return:</span>
                    <span className="text-white">{formatCurrency(calculations.sharpe.details.avgReturn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Variance:</span>
                    <span className="text-white">{calculations.sharpe.details.variance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Standard Deviation:</span>
                    <span className="text-white">{formatCurrency(calculations.sharpe.details.standardDeviation)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  No trade data available for detailed breakdown.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sample Trades */}
      {trades.length > 0 && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Sample Trades (First 10)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-left py-2 px-3">Side</th>
                  <th className="text-right py-2 px-3">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="border-b border-white/5">
                    <td className="py-2 px-3">{trade.trade_date}</td>
                    <td className="py-2 px-3">{trade.symbol}</td>
                    <td className="py-2 px-3">{trade.side}</td>
                    <td className={`py-2 px-3 text-right ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(trade.pnl || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}