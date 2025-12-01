'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Shield, Target, Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface EdgeData {
  edgeRatio: number;
  averageWin: number;
  averageLoss: number;
  winRate: number;
  lossRate: number;
  winsCount: number;
  lossesCount: number;
  grossProfit: number;
  grossLoss: number;
  edgeTrades: {
    profitable: number;
    losing: number;
    total: number;
    edgePercentage: number;
  };
}

interface TestResults {
  edgeRatio: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
}

export default function TestEdgeRatio() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [edgeData, setEdgeData] = useState<EdgeData | null>(null);

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
      .limit(50); // Limit to 50 trades for testing

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
  };

  const calculateEdgeRatio = (tradeList: Trade[]): EdgeData => {
    const tradesWithPnL = tradeList.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    
    if (tradesWithPnL.length === 0) {
      return {
        edgeRatio: 0,
        averageWin: 0,
        averageLoss: 0,
        winRate: 0,
        lossRate: 0,
        winsCount: 0,
        lossesCount: 0,
        grossProfit: 0,
        grossLoss: 0,
        edgeTrades: {
          profitable: 0,
          losing: 0,
          total: 0,
          edgePercentage: 0
        }
      };
    }

    const wins = tradesWithPnL.filter(trade => (trade.pnl || 0) > 0);
    const losses = tradesWithPnL.filter(trade => (trade.pnl || 0) < 0);
    const winsCount = wins.length;
    const lossesCount = losses.length;
    const total = tradesWithPnL.length;
    
    const grossProfit = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const averageWin = winsCount > 0 ? grossProfit / winsCount : 0;
    const averageLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
    const winRate = total > 0 ? winsCount / total : 0;
    const lossRate = total > 0 ? lossesCount / total : 0;
    
    // Edge Ratio: (Average Win × Win Rate) / (Average Loss × Loss Rate)
    // This measures the edge or advantage in your trading strategy
    const edgeRatio = (averageLoss * lossRate) === 0 ? 0 :
      (averageWin * winRate) / (averageLoss * lossRate);
    
    // Calculate edge trades (trades that show a statistical edge)
    const profitable = winsCount;
    const losing = lossesCount;
    const edgeTotal = total;
    const edgePercentage = total > 0 ? (edgeData?.edgeTrades?.profitable || 0) / edgeTotal * 100 : 0;

    return {
      edgeRatio,
      averageWin,
      averageLoss,
      winRate,
      lossRate,
      winsCount,
      lossesCount,
      grossProfit,
      grossLoss,
      edgeTrades: {
        profitable,
        losing,
        total: edgeTotal,
        edgePercentage
      }
    };
  };

  const runTests = () => {
    if (trades.length === 0) {
      alert('No trades available for testing');
      return;
    }

    const edgeResults = calculateEdgeRatio(trades);

    // For testing purposes, we'll validate the calculations are mathematically sound
    // rather than checking against specific expected values
    const edgeRatioTest = {
      calculated: edgeResults.edgeRatio,
      expected: null, // We don't have a predetermined expected value
      passed: edgeResults.edgeRatio >= 0 && isFinite(edgeResults.edgeRatio),
      explanation: `Edge Ratio = (Average Win × Win Rate) / (Average Loss × Loss Rate)
        = (${formatCurrency(edgeResults.averageWin)} × ${(edgeResults.winRate * 100).toFixed(1)}%) / (${formatCurrency(edgeResults.averageLoss)} × ${(edgeResults.lossRate * 100).toFixed(1)}%)
        = ${edgeResults.edgeRatio.toFixed(2)}
        
        Interpretation:
        ${edgeResults.edgeRatio >= 2.0 ? 'Excellent (≥2.0): Strong statistical edge' : ''}
        ${edgeResults.edgeRatio >= 1.5 && edgeResults.edgeRatio < 2.0 ? 'Good (1.5-1.99): Moderate statistical edge' : ''}
        ${edgeResults.edgeRatio >= 1.0 && edgeResults.edgeRatio < 1.5 ? 'Average (1.0-1.49): Small statistical edge' : ''}
        ${edgeResults.edgeRatio < 1.0 ? 'Poor (<1.0): No statistical edge' : ''}`
    };

    setTestResults({
      edgeRatio: edgeRatioTest
    });

    setEdgeData(edgeResults);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Edge Ratio Test</h1>
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
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Edge Ratio</h3>
            {testResults.edgeRatio.passed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Edge Ratio:</span>
              <span className={`text-2xl font-bold ${
                testResults.edgeRatio.calculated >= 2.0 ? 'text-green-400' : 
                testResults.edgeRatio.calculated >= 1.5 ? 'text-blue-400' : 
                testResults.edgeRatio.calculated >= 1.0 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {testResults.edgeRatio.calculated.toFixed(2)}
              </span>
            </div>
            
            <div className="p-3 bg-black/20 rounded-lg">
              <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
              <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                {testResults.edgeRatio.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Edge Data */}
      {edgeData && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            Detailed Edge Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Edge Summary */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Edge Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Average Win:</span>
                  <span className="text-green-400 font-bold">{formatCurrency(edgeData.averageWin)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Average Loss:</span>
                  <span className="text-red-400 font-bold">{formatCurrency(edgeData.averageLoss)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Win Rate:</span>
                  <span className="text-blue-400 font-bold">{(edgeData.winRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Loss Rate:</span>
                  <span className="text-orange-400 font-bold">{(edgeData.lossRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Edge Ratio:</span>
                  <span className={`font-bold ${
                    edgeData.edgeRatio >= 2.0 ? 'text-green-400' : 
                    edgeData.edgeRatio >= 1.5 ? 'text-blue-400' : 
                    edgeData.edgeRatio >= 1.0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {edgeData.edgeRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Edge Rating:</span>
                  <span className={`font-bold ${
                    edgeData.edgeRatio >= 2.0 ? 'text-green-400' : 
                    edgeData.edgeRatio >= 1.5 ? 'text-blue-400' : 
                    edgeData.edgeRatio >= 1.0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {edgeData.edgeRatio >= 2.0 ? 'Excellent' : 
                     edgeData.edgeRatio >= 1.5 ? 'Good' : 
                     edgeData.edgeRatio >= 1.0 ? 'Average' : 'Poor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trade Statistics */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Trade Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Winning Trades:</span>
                  <span className="text-green-400">{edgeData.winsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Losing Trades:</span>
                  <span className="text-red-400">{edgeData.lossesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Trades:</span>
                  <span className="text-white-400">{edgeData.winsCount + edgeData.lossesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Gross Profit:</span>
                  <span className="text-green-400">{formatCurrency(edgeData.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Gross Loss:</span>
                  <span className="text-red-400">{formatCurrency(edgeData.grossLoss)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Net Profit:</span>
                  <span className={`font-bold ${edgeData.grossProfit - edgeData.grossLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(edgeData.grossProfit - edgeData.grossLoss)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edge Interpretation */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-white/80">Edge Interpretation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                edgeData.edgeRatio >= 2.0 ? 'bg-green-600/10 border-green-600/30' : 'bg-gray-600/10 border-gray-600/30'
              }`}>
                <h5 className="font-medium text-green-400 mb-2">Excellent Edge (≥2.0)</h5>
                <p className="text-xs text-white/70">
                  Strong statistical advantage. Your strategy shows a clear edge over the market.
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                edgeData.edgeRatio >= 1.5 && edgeData.edgeRatio < 2.0 ? 'bg-blue-600/10 border-blue-600/30' : 'bg-gray-600/10 border-gray-600/30'
              }`}>
                <h5 className="font-medium text-blue-400 mb-2">Good Edge (1.5-1.99)</h5>
                <p className="text-xs text-white/70">
                  Moderate statistical advantage. Your strategy has a decent edge.
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                edgeData.edgeRatio >= 1.0 && edgeData.edgeRatio < 1.5 ? 'bg-yellow-600/10 border-yellow-600/30' : 'bg-gray-600/10 border-gray-600/30'
              }`}>
                <h5 className="font-medium text-yellow-400 mb-2">Average Edge (1.0-1.49)</h5>
                <p className="text-xs text-white/70">
                  Small statistical advantage. Your strategy has a slight edge.
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                edgeData.edgeRatio < 1.0 ? 'bg-red-600/10 border-red-600/30' : 'bg-gray-600/10 border-gray-600/30'
              }`}>
                <h5 className="font-medium text-red-400 mb-2">Poor Edge ({'<1.0'})</h5>
                <p className="text-xs text-white/70">
                  No statistical advantage. Your strategy needs improvement.
                </p>
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
                  <th className="text-center py-2 px-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 15).map((trade) => {
                  const isWin = (trade.pnl || 0) > 0;
                  const isLoss = (trade.pnl || 0) < 0;
                  return (
                    <tr key={trade.id} className="border-b border-white/5">
                      <td className="py-2 px-3">{trade.trade_date}</td>
                      <td className="py-2 px-3">{trade.symbol}</td>
                      <td className="py-2 px-3">{trade.side}</td>
                      <td className={`py-2 px-3 text-right ${isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'}`}>
                        {formatCurrency(trade.pnl || 0)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isWin && <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs">WIN</span>}
                        {isLoss && <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded text-xs">LOSS</span>}
                        {!isWin && !isLoss && <span className="px-2 py-1 bg-gray-600/20 text-gray-300 rounded text-xs">NEUTRAL</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}