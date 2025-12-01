'use client';

import React, { useState } from 'react';
import { PlusCircle, CheckCircle, AlertCircle, RefreshCw, Target, BarChart3 } from 'lucide-react';

interface TestResult {
  action: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  timestamp: string;
}

interface StrategyData {
  name: string;
  description: string;
  rules: string[];
  is_active: boolean;
  winrate_min: number;
  winrate_max: number;
  profit_factor_min: number;
  net_pnl_min: number;
  net_pnl_max: number;
  max_drawdown_max: number;
  sharpe_ratio_min: number;
  avg_hold_period_min: number;
  avg_hold_period_max: number;
}

const EXPECTED_STRATEGIES = [
  {
    name: 'Momentum Breakout Strategy',
    description: 'Focuses on identifying momentum breakouts and riding the trend for maximum profit',
    rulesCount: 5
  },
  {
    name: 'Mean Reversion Strategy',
    description: 'Capitalizes on price reversals after extreme movements',
    rulesCount: 5
  },
  {
    name: 'Scalping Strategy',
    description: 'Quick in-and-out trades capturing small price movements',
    rulesCount: 5
  },
  {
    name: 'Swing Trading Strategy',
    description: 'Medium-term trades capturing larger price swings over several days',
    rulesCount: 5
  },
  {
    name: 'Options Income Strategy',
    description: 'Generating consistent income through options selling strategies',
    rulesCount: 5
  }
];

export default function TestStrategyCreationPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdStrategies, setCreatedStrategies] = useState<StrategyData[]>([]);

  const addResult = (action: string, status: TestResult['status'], message: string, details?: any) => {
    const newResult: TestResult = {
      action,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [newResult, ...prev.slice(0, 9)]);
  };

  const executeAction = async (action: string) => {
    setIsLoading(true);
    addResult(action, 'running', `Starting ${action}...`);

    try {
      const response = await fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (response.ok) {
        addResult(action, 'success', data.message, data);
        
        if (action === 'create-strategies' && data.strategies) {
          setCreatedStrategies(data.strategies);
          
          // Run data integrity tests
          setTimeout(() => runDataIntegrityTests(data.strategies), 1000);
        }
      } else {
        addResult(action, 'error', data.error || 'Unknown error', data.details);
      }
    } catch (error) {
      addResult(action, 'error', 'Network error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const runDataIntegrityTests = (strategies: StrategyData[]) => {
    console.log('🧪 Running Data Integrity Tests');
    
    let allTestsPassed = true;
    const testDetails = [];

    // Test 1: Check if all expected strategies were created
    if (strategies.length !== EXPECTED_STRATEGIES.length) {
      addResult('data-integrity-count', 'error', 
        `Expected ${EXPECTED_STRATEGIES.length} strategies, got ${strategies.length}`);
      allTestsPassed = false;
    } else {
      addResult('data-integrity-count', 'success', 
        `Correct number of strategies created: ${strategies.length}`);
    }

    // Test 2: Verify each strategy's data
    for (const expectedStrategy of EXPECTED_STRATEGIES) {
      const createdStrategy = strategies.find(s => s.name === expectedStrategy.name);
      
      if (!createdStrategy) {
        addResult(`data-integrity-${expectedStrategy.name}`, 'error', 
          `Missing strategy: ${expectedStrategy.name}`);
        allTestsPassed = false;
        continue;
      }

      // Check description
      if (createdStrategy.description !== expectedStrategy.description) {
        addResult(`data-integrity-${expectedStrategy.name}-desc`, 'error', 
          `Description mismatch for ${expectedStrategy.name}`);
        allTestsPassed = false;
      }

      // Check rules count
      if (!createdStrategy.rules || createdStrategy.rules.length !== expectedStrategy.rulesCount) {
        addResult(`data-integrity-${expectedStrategy.name}-rules`, 'error', 
          `Rules count mismatch for ${expectedStrategy.name}`);
        allTestsPassed = false;
      }

      addResult(`data-integrity-${expectedStrategy.name}`, 'success', 
        `Strategy verified: ${expectedStrategy.name}`);
    }

    // Test 3: Verify configuration parameters
    const expectedConfig = {
      winrate_min: 60,
      winrate_max: 80,
      profit_factor_min: 1.5,
      net_pnl_min: -1000,
      net_pnl_max: 5000,
      max_drawdown_max: 20,
      sharpe_ratio_min: 1.0,
      avg_hold_period_min: 1,
      avg_hold_period_max: 120,
      is_active: true
    };

    for (const strategy of strategies) {
      for (const [param, expectedValue] of Object.entries(expectedConfig)) {
        if (strategy[param as keyof StrategyData] !== expectedValue) {
          addResult(`config-${strategy.name}-${param}`, 'error', 
            `Config mismatch for ${strategy.name}.${param}: expected ${expectedValue}, got ${strategy[param as keyof StrategyData]}`);
          allTestsPassed = false;
        }
      }
    }

    if (allTestsPassed) {
      addResult('data-integrity-summary', 'success', 'All data integrity tests passed');
    } else {
      addResult('data-integrity-summary', 'error', 'Some data integrity tests failed');
    }
  };

  const runDuplicateTest = async () => {
    addResult('duplicate-test', 'running', 'Testing duplicate strategy creation...');
    
    try {
      const response = await fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create-strategies' })
      });

      const data = await response.json();

      if (response.ok) {
        addResult('duplicate-test', 'success', 
          'Duplicate creation handled gracefully', data);
      } else if (response.status === 400) {
        addResult('duplicate-test', 'success', 
          'Duplicate creation properly rejected', data);
      } else {
        addResult('duplicate-test', 'error', 
          'Unexpected duplicate handling response', data);
      }
    } catch (error) {
      addResult('duplicate-test', 'error', 'Network error', error);
    }
  };

  const clearResults = () => {
    setResults([]);
    setCreatedStrategies([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'running':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Strategy Creation Functionality Test</h1>
          <p className="text-gray-300 mb-6">
            Test the strategy creation functionality of the comprehensive test data generation system.
            This page will verify that all 5 predefined trading strategies are created correctly.
          </p>
        </div>

        {/* Strategy Count Overview */}
        {createdStrategies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Created Strategies</h3>
              </div>
              <p className="text-2xl font-bold text-white">{createdStrategies.length}</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Expected Strategies</h3>
              </div>
              <p className="text-2xl font-bold text-white">{EXPECTED_STRATEGIES.length}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => executeAction('create-strategies')}
            disabled={isLoading}
            className="flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">Create Strategies</span>
          </button>

          <button
            onClick={runDuplicateTest}
            disabled={isLoading || createdStrategies.length === 0}
            className="flex items-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Test Duplicate Creation</span>
          </button>

          <button
            onClick={clearResults}
            disabled={isLoading}
            className="flex items-center gap-3 px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Clear Results</span>
          </button>
        </div>

        {/* Results Log */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result: TestResult, index: number) => (
                <div
                  key={index}
                  className={`border-l-4 pl-4 py-3 ${
                    result.status === 'success' ? 'border-green-600 bg-green-900/20' :
                    result.status === 'error' ? 'border-red-600 bg-red-900/20' :
                    'border-gray-600 bg-gray-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-white">{result.action}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="text-white text-sm">
                    <div className="font-medium mb-1">{result.message}</div>
                    
                    {result.details && (
                      <div className="text-gray-300 text-xs">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Created Strategies Details */}
        {createdStrategies.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Created Strategies Details</h2>
            
            <div className="space-y-4">
              {createdStrategies.map((strategy, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">{strategy.name}</h3>
                  <p className="text-gray-300 mb-2">{strategy.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <span className="text-gray-400 text-sm">Win Rate Range:</span>
                      <p className="text-white">{strategy.winrate_min}% - {strategy.winrate_max}%</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Profit Factor Min:</span>
                      <p className="text-white">{strategy.profit_factor_min}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Max Drawdown:</span>
                      <p className="text-white">{strategy.max_drawdown_max}%</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Active:</span>
                      <p className="text-white">{strategy.is_active ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm">Rules ({strategy.rules.length}):</span>
                    <ul className="text-gray-300 text-sm mt-1 space-y-1">
                      {strategy.rules.map((rule, ruleIndex) => (
                        <li key={ruleIndex} className="flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <p><strong>Step 1:</strong> Click "Create Strategies" to test basic strategy creation</p>
            <p><strong>Step 2:</strong> The system will automatically run data integrity tests</p>
            <p><strong>Step 3:</strong> Click "Test Duplicate Creation" to verify duplicate handling</p>
            <p><strong>Step 4:</strong> Review the test results and strategy details</p>
            <p><strong>Expected:</strong> 5 strategies with correct names, descriptions, rules, and configuration</p>
          </div>
        </div>
      </div>
    </div>
  );
}