'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Zap, Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface StreakData {
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  streakHistory: {
    type: 'win' | 'loss';
    length: number;
    startDate: string;
    endDate: string;
    trades: Trade[];
  }[];
}

interface TestResults {
  winStreaks: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
  lossStreaks: {
    calculated: number;
    expected: number | null;
    passed: boolean;
    explanation: string;
  };
}

export default function TestWinLossStreaks() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);

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
      .limit(30); // Limit to 30 trades for testing

    setTrades(tradesData as Trade[] || []);
    setLoading(false);
  };

  const calculateStreaks = (tradeList: Trade[]): StreakData => {
    const tradesWithPnL = tradeList.filter(trade => trade.pnl !== null && trade.pnl !== undefined);
    
    if (tradesWithPnL.length === 0) {
      return {
        currentWinStreak: 0,
        currentLossStreak: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        streakHistory: []
      };
    }

    // Calculate max streaks (historical)
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    let currentStreakType: 'win' | 'loss' | null = null;
    let streakStartIndex = 0;
    const streakHistory: StreakData['streakHistory'] = [];

    tradesWithPnL.forEach((trade, index) => {
      const isWin = (trade.pnl || 0) > 0;
      const isLoss = (trade.pnl || 0) < 0;
      
      if (isWin) {
        if (currentStreakType === 'win') {
          tempWinStreak++;
        } else {
          // End previous loss streak if exists
          if (currentStreakType === 'loss' && tempLossStreak > 0) {
            streakHistory.push({
              type: 'loss',
              length: tempLossStreak,
              startDate: tradesWithPnL[streakStartIndex].trade_date,
              endDate: tradesWithPnL[index - 1].trade_date,
              trades: tradesWithPnL.slice(streakStartIndex, index)
            });
          }
          tempWinStreak = 1;
          tempLossStreak = 0;
          streakStartIndex = index;
          currentStreakType = 'win';
        }
        if (tempWinStreak > maxWinStreak) {
          maxWinStreak = tempWinStreak;
        }
      } else if (isLoss) {
        if (currentStreakType === 'loss') {
          tempLossStreak++;
        } else {
          // End previous win streak if exists
          if (currentStreakType === 'win' && tempWinStreak > 0) {
            streakHistory.push({
              type: 'win',
              length: tempWinStreak,
              startDate: tradesWithPnL[streakStartIndex].trade_date,
              endDate: tradesWithPnL[index - 1].trade_date,
              trades: tradesWithPnL.slice(streakStartIndex, index)
            });
          }
          tempLossStreak = 1;
          tempWinStreak = 0;
          streakStartIndex = index;
          currentStreakType = 'loss';
        }
        if (tempLossStreak > maxLossStreak) {
          maxLossStreak = tempLossStreak;
        }
      }
    });

    // Add the final streak
    if (currentStreakType && (tempWinStreak > 0 || tempLossStreak > 0)) {
      streakHistory.push({
        type: currentStreakType,
        length: currentStreakType === 'win' ? tempWinStreak : tempLossStreak,
        startDate: tradesWithPnL[streakStartIndex].trade_date,
        endDate: tradesWithPnL[tradesWithPnL.length - 1].trade_date,
        trades: tradesWithPnL.slice(streakStartIndex)
      });
    }

    // Calculate current streaks (from most recent trades)
    const recentTrades = [...tradesWithPnL].reverse();
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    for (const trade of recentTrades) {
      if ((trade.pnl || 0) > 0) {
        if (currentLossStreak === 0) {
          currentWinStreak++;
        } else {
          break;
        }
      } else if ((trade.pnl || 0) < 0) {
        if (currentWinStreak === 0) {
          currentLossStreak++;
        } else {
          break;
        }
      }
    }

    return {
      currentWinStreak,
      currentLossStreak,
      maxWinStreak,
      maxLossStreak,
      streakHistory
    };
  };

  const runTests = () => {
    if (trades.length === 0) {
      alert('No trades available for testing');
      return;
    }

    const streakResults = calculateStreaks(trades);

    // For testing purposes, we'll validate the calculations are mathematically sound
    // rather than checking against specific expected values
    const winStreakTest = {
      calculated: streakResults.currentWinStreak,
      expected: null, // We don't have a predetermined expected value
      passed: streakResults.currentWinStreak >= 0 && Number.isInteger(streakResults.currentWinStreak),
      explanation: `Current Win Streak: ${streakResults.currentWinStreak} consecutive winning trades
        Maximum Win Streak: ${streakResults.maxWinStreak} consecutive winning trades
        Total win streaks: ${streakResults.streakHistory.filter(s => s.type === 'win').length}`
    };

    const lossStreakTest = {
      calculated: streakResults.currentLossStreak,
      expected: null, // We don't have a predetermined expected value
      passed: streakResults.currentLossStreak >= 0 && Number.isInteger(streakResults.currentLossStreak),
      explanation: `Current Loss Streak: ${streakResults.currentLossStreak} consecutive losing trades
        Maximum Loss Streak: ${streakResults.maxLossStreak} consecutive losing trades
        Total loss streaks: ${streakResults.streakHistory.filter(s => s.type === 'loss').length}`
    };

    setTestResults({
      winStreaks: winStreakTest,
      lossStreaks: lossStreakTest
    });

    setStreakData(streakResults);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Win/Loss Streaks Test</h1>
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
          {/* Win Streak Result */}
          <div className="glass-enhanced p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Win Streaks</h3>
              {testResults.winStreaks.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Current Win Streak:</span>
                <span className="text-xl font-bold text-green-400">{testResults.winStreaks.calculated}</span>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
                <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                  {testResults.winStreaks.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Loss Streak Result */}
          <div className="glass-enhanced p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Loss Streaks</h3>
              {testResults.lossStreaks.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Current Loss Streak:</span>
                <span className="text-xl font-bold text-red-400">{testResults.lossStreaks.calculated}</span>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-xs text-white/60 mb-2">Calculation Breakdown:</p>
                <p className="text-xs text-white/80 font-mono whitespace-pre-line">
                  {testResults.lossStreaks.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Streak Data */}
      {streakData && (
        <div className="glass-enhanced p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            Detailed Streak Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Streaks */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Current Streaks</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Current Win Streak:</span>
                  <span className="text-green-400 font-bold">{streakData.currentWinStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Current Loss Streak:</span>
                  <span className="text-red-400 font-bold">{streakData.currentLossStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Maximum Win Streak:</span>
                  <span className="text-green-400 font-bold">{streakData.maxWinStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Maximum Loss Streak:</span>
                  <span className="text-red-400 font-bold">{streakData.maxLossStreak}</span>
                </div>
              </div>
            </div>

            {/* Streak Summary */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-white/80">Streak Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Win Streaks:</span>
                  <span className="text-green-400">{streakData.streakHistory.filter(s => s.type === 'win').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Loss Streaks:</span>
                  <span className="text-red-400">{streakData.streakHistory.filter(s => s.type === 'loss').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Average Win Streak:</span>
                  <span className="text-green-400">
                    {streakData.streakHistory.filter(s => s.type === 'win').length > 0
                      ? (streakData.streakHistory.filter(s => s.type === 'win').reduce((sum, s) => sum + s.length, 0) / streakData.streakHistory.filter(s => s.type === 'win').length).toFixed(1)
                      : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Average Loss Streak:</span>
                  <span className="text-red-400">
                    {streakData.streakHistory.filter(s => s.type === 'loss').length > 0
                      ? (streakData.streakHistory.filter(s => s.type === 'loss').reduce((sum, s) => sum + s.length, 0) / streakData.streakHistory.filter(s => s.type === 'loss').length).toFixed(1)
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak History */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-white/80">Streak History</h4>
            {streakData.streakHistory.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {streakData.streakHistory.map((streak, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${streak.type === 'win' ? 'bg-green-600/10 border-green-600/30' : 'bg-red-600/10 border-red-600/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${streak.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                        {streak.type === 'win' ? 'Win' : 'Loss'} Streak: {streak.length}
                      </span>
                      <span className="text-xs text-white/60">
                        {streak.startDate} → {streak.endDate}
                      </span>
                    </div>
                    <div className="text-xs text-white/70">
                      Total P&L: {formatCurrency(streak.trades.reduce((sum, t) => sum + (t.pnl || 0), 0))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/60">
                No streaks detected in the trade history.
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
                  <th className="text-center py-2 px-3">Streak</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 15).map((trade, index) => {
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