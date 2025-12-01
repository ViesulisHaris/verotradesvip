'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestStrategySelectionFix() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results = [];

    try {
      // Test 1: Check if log-trade page loads
      results.push({
        test: 'Log Trade Page Load',
        status: 'info',
        message: 'Navigate to /log-trade to test the strategy selection fix',
        action: 'manual'
      });

      // Test 2: Strategy selection behavior
      results.push({
        test: 'Strategy Selection - No Strategy Selected',
        status: 'info',
        message: 'When no strategy is selected, no rules should be displayed',
        action: 'manual'
      });

      // Test 3: Strategy selection with custom rules
      results.push({
        test: 'Strategy Selection - Custom Rules as Checkboxes',
        status: 'info',
        message: 'When a strategy is selected, custom rules should appear as checkboxes',
        action: 'manual'
      });

      // Test 4: Performance metrics removal
      results.push({
        test: 'Strategy Selection - Performance Metrics Removed',
        status: 'info',
        message: 'When a strategy is selected, performance metrics should NOT be displayed',
        action: 'manual'
      });

      // Test 5: Only checkboxes visible
      results.push({
        test: 'Strategy Selection - Only Checkboxes Visible',
        status: 'info',
        message: 'When a strategy is selected, only custom rule checkboxes should be visible',
        action: 'manual'
      });

      // Test 6: Checkbox functionality
      results.push({
        test: 'Custom Rules - Checkbox Functionality',
        status: 'info',
        message: 'Custom rule checkboxes should be interactive and toggle correctly',
        action: 'manual'
      });

      // Test 7: Strategy change behavior
      results.push({
        test: 'Strategy Change - Reset Behavior',
        status: 'info',
        message: 'When changing strategies, custom rules should reset appropriately',
        action: 'manual'
      });

      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      results.push({
        test: 'Test Execution',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        action: 'none'
      });
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Strategy Selection Fix Test</h1>
          <p className="text-white/70">
            Test the strategy selection behavior in the log trade page
          </p>
        </div>

        {/* Test Controls */}
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
            <Link
              href="/log-trade"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Log Trade Page
            </Link>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-3 text-white/80">
            <p>
              <strong>1. Navigate to Log Trade Page:</strong> Click the "Go to Log Trade Page" button above
            </p>
            <p>
              <strong>2. Test No Strategy Selected:</strong> Verify that no rules are displayed when no strategy is selected
            </p>
            <p>
              <strong>3. Test Strategy Selection:</strong> Select a strategy and verify:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Custom rules appear as checkboxes (not just text)</li>
              <li>Performance metrics are NOT displayed</li>
              <li>Only checkboxes are visible for the strategy rules</li>
              <li>Checkboxes are interactive and can be toggled</li>
            </ul>
            <p>
              <strong>4. Test Strategy Change:</strong> Change to a different strategy and verify the rules reset correctly
            </p>
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Expected Behavior</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-white font-medium">Custom Rules as Checkboxes</h3>
                <p className="text-white/70 text-sm">When a strategy is selected, custom rules should appear as interactive checkboxes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-white font-medium">Performance Metrics Removed</h3>
                <p className="text-white/70 text-sm">Performance metrics (winrate, profit factor, etc.) should NOT be displayed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-white font-medium">Only Checkboxes Visible</h3>
                <p className="text-white/70 text-sm">When strategy is selected, only custom rule checkboxes should be visible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{result.test}</h3>
                    <p className="text-white/70 text-sm">{result.message}</p>
                    {result.action === 'manual' && (
                      <p className="text-blue-400 text-xs mt-1">→ Manual verification required</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}