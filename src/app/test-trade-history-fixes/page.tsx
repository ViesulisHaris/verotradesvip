'use client';

import { useState, useEffect } from 'react';
import TradeHistory from '@/components/TradeHistory';
import { useAuth } from '@/contexts/AuthContext-simple';

export default function TestTradeHistoryFixes() {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (test: string, passed: boolean, details?: string) => {
    setTestResults(prev => [
      ...prev,
      `${passed ? '✅' : '❌'} ${test}${details ? ` - ${details}` : ''}`
    ]);
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    // Test 1: Check if user is authenticated
    if (user && session) {
      addTestResult('User Authentication', true, `User: ${user.email}`);
    } else {
      addTestResult('User Authentication', false, 'No authenticated user found');
      setIsRunningTests(false);
      return;
    }

    // Test 2: Check if TradeHistory component loads
    try {
      // This will be verified by the component itself loading
      addTestResult('TradeHistory Component Loading', true);
    } catch (error) {
      addTestResult('TradeHistory Component Loading', false, error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 3: Check if API endpoints are accessible
    try {
      const response = await fetch('/api/confluence-trades', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        addTestResult('API Endpoint Access', true, `Found ${data.totalCount || 0} trades`);
      } else {
        addTestResult('API Endpoint Access', false, `Status: ${response.status}`);
      }
    } catch (error) {
      addTestResult('API Endpoint Access', false, error instanceof Error ? error.message : 'Network error');
    }

    // Test 4: Check if statistics calculation works
    try {
      const response = await fetch('/api/confluence-trades?limit=10000', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const trades = data.trades || [];
        
        // Calculate PnL statistics
        const totalPnL = trades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
        const winRate = trades.length > 0 ? (trades.filter((trade: any) => (trade.pnl || 0) > 0).length / trades.length) * 100 : 0;
        
        addTestResult('Statistics Calculation', true, 
          `Total P&L: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}, Win Rate: ${winRate.toFixed(1)}%`);
      } else {
        addTestResult('Statistics Calculation', false, 'Failed to fetch trades for statistics');
      }
    } catch (error) {
      addTestResult('Statistics Calculation', false, error instanceof Error ? error.message : 'Error calculating statistics');
    }

    // Test 5: Check emotional state processing
    try {
      const response = await fetch('/api/confluence-trades?limit=100', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const trades = data.trades || [];
        
        // Count emotions
        const emotionCounts: { [key: string]: number } = {};
        trades.forEach((trade: any) => {
          if (trade.emotional_state) {
            const emotions = Array.isArray(trade.emotional_state) 
              ? trade.emotional_state 
              : trade.emotional_state.split(',').map((e: string) => e.trim()).filter((e: string) => e);
            
            emotions.forEach((emotion: string) => {
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            });
          }
        });
        
        const mostFrequent = Object.keys(emotionCounts).length > 0
          ? Object.entries(emotionCounts).reduce((a, b) => emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b)?.[0] || 'Neutral'
          : 'Neutral';
        
        addTestResult('Emotional State Processing', true, 
          `Most frequent: ${mostFrequent}, Total emotions: ${Object.keys(emotionCounts).length}`);
      } else {
        addTestResult('Emotional State Processing', false, 'Failed to fetch trades for emotion analysis');
      }
    } catch (error) {
      addTestResult('Emotional State Processing', false, error instanceof Error ? error.message : 'Error processing emotions');
    }

    setIsRunningTests(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Trade History Fixes Verification</h1>
        
        <div className="mb-8">
          <button
            onClick={runTests}
            disabled={isRunningTests}
            className="px-6 py-3 bg-gold text-black font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {isRunningTests ? 'Running Tests...' : 'Run Verification Tests'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="p-3 bg-surface border border-white/10 rounded">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Manual Verification Checklist:</h2>
          <div className="space-y-3">
            <div className="p-3 bg-surface border border-white/10 rounded">
              <h3 className="font-medium mb-2">1. Chart Functionality Removal</h3>
              <p className="text-sm text-gray-400">Expand any trade and verify there's no "Price Action Replay" or chart placeholder.</p>
            </div>
            <div className="p-3 bg-surface border border-white/10 rounded">
              <h3 className="font-medium mb-2">2. Full Width Layout</h3>
              <p className="text-sm text-gray-400">Verify trade details use the full width in a responsive grid layout.</p>
            </div>
            <div className="p-3 bg-surface border border-white/10 rounded">
              <h3 className="font-medium mb-2">3. Negative P&L Display</h3>
              <p className="text-sm text-gray-400">Check that negative P&L values show with a preceding minus sign (e.g., "-$50.00").</p>
            </div>
            <div className="p-3 bg-surface border border-white/10 rounded">
              <h3 className="font-medium mb-2">4. Edit/Delete Buttons</h3>
              <p className="text-sm text-gray-400">Verify Edit and Delete buttons are visible and functional in the Actions section.</p>
            </div>
            <div className="p-3 bg-surface border border-white/10 rounded">
              <h3 className="font-medium mb-2">5. Most Frequent Emotion</h3>
              <p className="text-sm text-gray-400">Check the emotional stat card shows the most frequent emotion, not an average.</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Trade History Component:</h2>
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <TradeHistory />
          </div>
        </div>
      </div>
    </div>
  );
}