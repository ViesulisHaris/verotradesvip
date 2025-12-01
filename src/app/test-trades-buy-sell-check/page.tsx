'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function TestTradesBuySellCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        setUser(user);
      } else {
        setIsAuthenticated(false);
        setError('Please log in to run this test. You can log in at /login');
      }
    };

    checkAuth();
  }, []);

  const addTestResult = (testName: string, status: 'PASSED' | 'FAILED' | 'ERROR', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTest = async (testName: string, tradeData: any) => {
    setCurrentTest(testName);
    
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: result, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          ...tradeData
        })
        .select();

      if (error) {
        if (error.message.includes('trades_buy_sell_check')) {
          addTestResult(testName, 'FAILED', `CONSTRAINT VIOLATION: ${error.message}`, { error: error.message });
          return 'CONSTRAINT_VIOLATION';
        } else {
          addTestResult(testName, 'ERROR', `OTHER ERROR: ${error.message}`, { error: error.message });
          return 'OTHER_ERROR';
        }
      } else {
        addTestResult(testName, 'PASSED', 'Trade inserted successfully', { data: result });
        
        // Clean up test data
        await supabase.from('trades').delete().eq('symbol', tradeData.symbol);
        
        return 'PASSED';
      }
    } catch (unexpectedError) {
      const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error';
      addTestResult(testName, 'ERROR', `UNEXPECTED ERROR: ${errorMessage}`, { error: errorMessage });
      return 'UNEXPECTED_ERROR';
    }
  };

  const runComprehensiveTest = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to run this test');
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    setError(null);

    const testCases = [
      {
        name: 'Buy Trade Test',
        data: {
          symbol: 'TEST_BUY',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 100,
          entry_price: 50.25,
          exit_price: 55.50,
          pnl: 525.00
        }
      },
      {
        name: 'Sell Trade Test',
        data: {
          symbol: 'TEST_SELL',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Sell',
          quantity: 100,
          entry_price: 55.50,
          exit_price: 50.25,
          pnl: -525.00
        }
      },
      {
        name: 'Minimum Values Test',
        data: {
          symbol: 'TEST_MIN',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 1,
          entry_price: 0.01,
          exit_price: 0.02,
          pnl: 0.01
        }
      },
      {
        name: 'Maximum Values Test',
        data: {
          symbol: 'TEST_MAX',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Sell',
          quantity: 999999,
          entry_price: 999999.99,
          exit_price: 999999.98,
          pnl: -0.01
        }
      },
      {
        name: 'Decimal Values Test',
        data: {
          symbol: 'TEST_DEC',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'Buy',
          quantity: 1.5,
          entry_price: 12.345,
          exit_price: 13.678,
          pnl: 1.995
        }
      },
      {
        name: 'Invalid Side Test (Should Fail)',
        data: {
          symbol: 'TEST_INVALID',
          trade_date: new Date().toISOString().split('T')[0],
          side: 'InvalidSide',
          quantity: 100,
          entry_price: 50.00,
          exit_price: 55.00,
          pnl: 500.00
        }
      }
    ];

    let constraintViolations = 0;
    let passedTests = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await runTest(testCase.name, testCase.data);
      
      if (result === 'CONSTRAINT_VIOLATION') {
        constraintViolations++;
      } else if (result === 'PASSED') {
        passedTests++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest('');
    setIsTesting(false);

    // Generate summary
    const summary = `
      Test Summary:
      - Total Tests: ${testCases.length}
      - Passed: ${passedTests}
      - Constraint Violations: ${constraintViolations}
      - Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%
    `;

    if (constraintViolations > 0) {
      setError(`CONSTRAINT ISSUE DETECTED! ${summary}\n\nSOLUTION: Run the SQL fix in TRADES_BUY_SELL_CHECK_FIX.sql in Supabase SQL Editor.`);
    } else {
      addTestResult('SUMMARY', 'PASSED', summary, { passedTests, constraintViolations });
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-xl">
            <h1 className="text-3xl font-bold text-white mb-6">Trades Buy/Sell Check Constraint Test</h1>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <h3 className="text-red-400 font-semibold mb-2">Authentication Required</h3>
                <p className="text-red-200 mb-4">{error}</p>
                <a
                  href="/login"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-8 rounded-xl">
          <h1 className="text-3xl font-bold text-white mb-6">Trades Buy/Sell Check Constraint Test</h1>
          
          <div className="mb-6">
            <p className="text-white/80 mb-4">
              This comprehensive test will identify and help fix the "new row for relation 'trades' violates check constraint 'trades_buy_sell_check'" error.
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <h3 className="text-blue-400 font-semibold mb-2">Test Information:</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Tests both "Buy" and "Sell" trade sides</li>
                <li>• Tests minimum, maximum, and decimal values</li>
                <li>• Tests invalid side values (should fail)</li>
                <li>• Provides real-time feedback on constraint violations</li>
                <li>• Automatically cleans up test data</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runComprehensiveTest}
              disabled={isTesting}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Running Tests...
                </span>
              ) : (
                'Run Comprehensive Test'
              )}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isTesting}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Results
            </button>
          </div>
          
          {currentTest && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-400 font-semibold mb-2">Currently Testing:</h3>
              <p className="text-yellow-200">{currentTest}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-semibold mb-2">Error Detected:</h3>
              <pre className="text-red-200 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Test Results:</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'PASSED'
                        ? 'bg-green-500/10 border-green-500/20'
                        : result.status === 'FAILED'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-yellow-500/10 border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-semibold ${
                        result.status === 'PASSED'
                          ? 'text-green-400'
                          : result.status === 'FAILED'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                        {result.testName}
                      </h4>
                      <span className="text-white/60 text-sm">{result.timestamp}</span>
                    </div>
                    <p className={`text-sm ${
                      result.status === 'PASSED'
                        ? 'text-green-200'
                        : result.status === 'FAILED'
                        ? 'text-red-200'
                        : 'text-yellow-200'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/log-trade"
              className="block p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg hover:bg-blue-600/20 transition-colors"
            >
              <h3 className="text-blue-400 font-semibold mb-1">Test Trade Form</h3>
              <p className="text-blue-200 text-sm">Go to the trade logging form to test manually</p>
            </a>
            
            <a
              href="/trades"
              className="block p-4 bg-green-600/10 border border-green-500/20 rounded-lg hover:bg-green-600/20 transition-colors"
            >
              <h3 className="text-green-400 font-semibold mb-1">View Trades</h3>
              <p className="text-green-200 text-sm">Check if your trades are appearing correctly</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}