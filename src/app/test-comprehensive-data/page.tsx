'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TestResult {
  action: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
}

interface VerificationData {
  summary: {
    totalTrades: number;
    tradesWithPnL: number;
    winningTrades: number;
    losingTrades: number;
    totalPnL: number;
    winRate: number;
    totalStrategies: number;
    activeStrategies: number;
  };
  emotionDistribution: Record<string, number>;
  marketDistribution: Record<string, number>;
  strategyDistribution: Record<string, number>;
}

export default function TestComprehensiveData() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const addResult = (action: string, status: 'success' | 'error', message: string, data?: any) => {
    const newResult: TestResult = {
      action,
      status,
      message,
      data,
      timestamp: new Date()
    };
    setResults(prev => [...prev, newResult]);
  };

  const executeAction = async (action: string) => {
    setIsLoading(true);
    setCurrentAction(action);
    
    try {
      // Get current session
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        addResult(action, 'error', 'Authentication required. Please log in first.');
        setIsLoading(false);
        return;
      }

      // Make API request
      const response = await fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action })
      });

      const result = await response.json();

      if (response.ok) {
        addResult(action, 'success', result.message, result);
        
        // Store verification data if this is a verify action
        if (action === 'verify-data' && result.verification) {
          setVerificationData(result.verification);
        }
      } else {
        addResult(action, 'error', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      addResult(action, 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const executeAllSteps = async () => {
    // Clear previous results
    setResults([]);
    setVerificationData(null);
    
    // Step 1: Delete All Data
    await executeAction('delete-all');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Create Strategies
    await executeAction('create-strategies');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Generate Trades
    await executeAction('generate-trades');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Verify Data
    await executeAction('verify-data');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⭕';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comprehensive Test Data Generation</h1>
          <p className="text-gray-600">
            Generate realistic test data for your trading journal with 100 trades, 71% win rate, and 5 diverse strategies
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Control Panel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => executeAction('delete-all')}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading && currentAction === 'delete-all' ? '⏳ Deleting...' : '🗑️ Delete All Data'}
            </button>
            
            <button
              onClick={() => executeAction('create-strategies')}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading && currentAction === 'create-strategies' ? '⏳ Creating...' : '📈 Create Strategies'}
            </button>
            
            <button
              onClick={() => executeAction('generate-trades')}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading && currentAction === 'generate-trades' ? '⏳ Generating...' : '📊 Generate Trades'}
            </button>
            
            <button
              onClick={() => executeAction('verify-data')}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading && currentAction === 'verify-data' ? '⏳ Verifying...' : '✅ Verify Data'}
            </button>
          </div>
          
          <button
            onClick={executeAllSteps}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100"
          >
            {isLoading ? '🔄 Executing All Steps...' : '🚀 Execute Complete 4-Step Process'}
          </button>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution Results</h2>
          
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No actions executed yet. Click the buttons above to start.</p>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${result.status === 'success' ? 'border-green-200 bg-green-50' : result.status === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{getStatusIcon(result.status)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {result.action.replace('-', ' ')}
                        </h3>
                        <p className={`text-sm ${getStatusColor(result.status)}`}>
                          {result.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {result.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show additional data for successful actions */}
                  {result.status === 'success' && result.data && (
                    <div className="mt-3 ml-8 text-sm text-gray-600">
                      {result.action === 'create-strategies' && (
                        <div>
                          <span className="font-medium">Created:</span> {result.data.count} strategies
                        </div>
                      )}
                      {result.action === 'generate-trades' && (
                        <div>
                          <span className="font-medium">Generated:</span> {result.data.count} trades
                          <br />
                          <span className="font-medium">Win Rate:</span> {result.data.stats?.winRate}%
                          <br />
                          <span className="font-medium">Total P&L:</span> ${result.data.stats?.totalPnL?.toFixed(2)}
                        </div>
                      )}
                      {result.action === 'delete-all' && (
                        <div>
                          <span className="font-medium">Cleared:</span> All trades and strategies
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Data */}
        {verificationData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Verification Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">Total Trades</h3>
                <p className="text-2xl font-bold text-blue-600">{verificationData.summary.totalTrades}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900">Win Rate</h3>
                <p className="text-2xl font-bold text-green-600">{verificationData.summary.winRate.toFixed(1)}%</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900">Total Strategies</h3>
                <p className="text-2xl font-bold text-purple-600">{verificationData.summary.totalStrategies}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900">Total P&L</h3>
                <p className="text-2xl font-bold text-yellow-600">${verificationData.summary.totalPnL.toFixed(2)}</p>
              </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Emotion Distribution */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Emotional States</h3>
                <div className="space-y-2">
                  {Object.entries(verificationData.emotionDistribution).map(([emotion, count]) => (
                    <div key={emotion} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{emotion}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Distribution */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Markets</h3>
                <div className="space-y-2">
                  {Object.entries(verificationData.marketDistribution).map(([market, count]) => (
                    <div key={market} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{market}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Distribution */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Strategy Usage</h3>
                <div className="space-y-2">
                  {Object.entries(verificationData.strategyDistribution).map(([strategy, count]) => (
                    <div key={strategy} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{strategy}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Delete All Data" to clear existing strategies and trades</li>
            <li>Click "Create Strategies" to generate 5 diverse trading strategies</li>
            <li>Click "Generate Trades" to create 100 trades with 71% win rate over 2 months</li>
            <li>Click "Verify Data" to confirm data was created correctly</li>
            <li>Alternatively, use "Execute Complete 4-Step Process" to run all steps automatically</li>
          </ol>
          <p className="text-sm text-blue-700 mt-4">
            After generating data, navigate to the <a href="/confluence" className="underline font-medium">Confluence page</a> to test the emotional analysis and filtering functionality.
          </p>
        </div>
      </div>
    </div>
  );
}