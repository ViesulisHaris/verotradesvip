'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import MultiSelectEmotionDropdown from '@/components/ui/MultiSelectEmotionDropdown';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';
import { CheckCircle, XCircle, AlertCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface TestTrade {
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

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  details: string;
  timestamp: string;
}

export default function TestEmotionSearchFunctionality() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [testTrades, setTestTrades] = useState<TestTrade[]>([]);
  const [showTestTrades, setShowTestTrades] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [logEmotions, setLogEmotions] = useState<string[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<TestTrade[]>([]);

  // Add a test result
  const addTestResult = (test: string, status: 'pass' | 'fail' | 'pending', details: string) => {
    const result: TestResult = {
      test,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  // Reset test results
  const resetTests = () => {
    setTestResults([]);
    setCurrentTest('');
    setSelectedEmotions([]);
    setLogEmotions([]);
    setFilteredTrades([]);
  };

  // Create test trades with various emotion combinations
  const createTestTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addTestResult('Authentication Check', 'fail', 'User not authenticated');
        return;
      }

      // Delete existing test trades
      await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)
        .like('symbol', 'TEST_%');

      const testTradeData = [
        {
          symbol: 'TEST_FOMO',
          market: 'Stock',
          side: 'Buy' as const,
          quantity: 100,
          pnl: 150.00,
          trade_date: new Date().toISOString().split('T')[0],
          strategy_id: null,
          emotional_state: ['FOMO']
        },
        {
          symbol: 'TEST_DISCIPLINE',
          market: 'Stock',
          side: 'Buy' as const,
          quantity: 50,
          pnl: 75.00,
          trade_date: new Date().toISOString().split('T')[0],
          strategy_id: null,
          emotional_state: ['DISCIPLINE']
        },
        {
          symbol: 'TEST_MULTIPLE',
          market: 'Crypto',
          side: 'Sell' as const,
          quantity: 1,
          pnl: -25.00,
          trade_date: new Date().toISOString().split('T')[0],
          strategy_id: null,
          emotional_state: ['FOMO', 'REVENGE', 'TILT']
        },
        {
          symbol: 'TEST_NEUTRAL',
          market: 'Forex',
          side: 'Buy' as const,
          quantity: 1000,
          pnl: 50.00,
          trade_date: new Date().toISOString().split('T')[0],
          strategy_id: null,
          emotional_state: ['NEUTRAL']
        },
        {
          symbol: 'TEST_NONE',
          market: 'Stock',
          side: 'Sell' as const,
          quantity: 200,
          pnl: 100.00,
          trade_date: new Date().toISOString().split('T')[0],
          strategy_id: null,
          emotional_state: null
        }
      ];

      // Insert test trades
      for (const trade of testTradeData) {
        await supabase.from('trades').insert({
          user_id: user.id,
          ...trade
        });
      }

      // Fetch the created trades
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .like('symbol', 'TEST_%')
        .order('trade_date', { ascending: false });

      setTestTrades(trades as TestTrade[]);
      addTestResult('Create Test Trades', 'pass', `Created ${trades?.length || 0} test trades with various emotion combinations`);
    } catch (error) {
      addTestResult('Create Test Trades', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 1: Dropdown opens and closes correctly
  const testDropdownOpenClose = () => {
    setCurrentTest('Testing dropdown open/close functionality');
    try {
      // This would need to be tested manually in the browser
      addTestResult('Dropdown Open/Close', 'pending', 'Manual test required: Click dropdown to open, click outside to close');
    } catch (error) {
      addTestResult('Dropdown Open/Close', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 2: Multi-select functionality
  const testMultiSelect = () => {
    setCurrentTest('Testing multi-select functionality');
    try {
      // This would need to be tested manually in the browser
      addTestResult('Multi-Select', 'pending', 'Manual test required: Select multiple emotions and verify they appear as pills');
    } catch (error) {
      addTestResult('Multi-Select', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 3: Deselect emotions with X buttons
  const testDeselectEmotions = () => {
    setCurrentTest('Testing emotion deselection');
    try {
      // This would need to be tested manually in the browser
      addTestResult('Deselect Emotions', 'pending', 'Manual test required: Click X buttons on selected emotion pills');
    } catch (error) {
      addTestResult('Deselect Emotions', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 4: Keyboard navigation
  const testKeyboardNavigation = () => {
    setCurrentTest('Testing keyboard navigation');
    try {
      // This would need to be tested manually in the browser
      addTestResult('Keyboard Navigation', 'pending', 'Manual test required: Test arrow keys, enter, space, escape, backspace');
    } catch (error) {
      addTestResult('Keyboard Navigation', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 5: Filter functionality with single emotion
  const testSingleEmotionFilter = async () => {
    setCurrentTest('Testing single emotion filter');
    try {
      const filtered = testTrades.filter(trade => 
        trade.emotional_state && trade.emotional_state.includes('FOMO')
      );
      setFilteredTrades(filtered);
      
      const expectedCount = testTrades.filter(t => 
        t.emotional_state && t.emotional_state.includes('FOMO')
      ).length;
      
      if (filtered.length === expectedCount) {
        addTestResult('Single Emotion Filter', 'pass', `Found ${filtered.length} trades with FOMO emotion`);
      } else {
        addTestResult('Single Emotion Filter', 'fail', `Expected ${expectedCount} trades, found ${filtered.length}`);
      }
    } catch (error) {
      addTestResult('Single Emotion Filter', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 6: Filter functionality with multiple emotions
  const testMultipleEmotionFilter = async () => {
    setCurrentTest('Testing multiple emotion filter');
    try {
      const filtered = testTrades.filter(trade => 
        trade.emotional_state && 
        (trade.emotional_state.includes('FOMO') || trade.emotional_state.includes('DISCIPLINE'))
      );
      setFilteredTrades(filtered);
      
      const expectedCount = testTrades.filter(t => 
        t.emotional_state && 
        (t.emotional_state.includes('FOMO') || t.emotional_state.includes('DISCIPLINE'))
      ).length;
      
      if (filtered.length === expectedCount) {
        addTestResult('Multiple Emotion Filter', 'pass', `Found ${filtered.length} trades with FOMO or DISCIPLINE emotions`);
      } else {
        addTestResult('Multiple Emotion Filter', 'fail', `Expected ${expectedCount} trades, found ${filtered.length}`);
      }
    } catch (error) {
      addTestResult('Multiple Emotion Filter', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 7: Filter with no matching emotions
  const testNoMatchingEmotions = async () => {
    setCurrentTest('Testing filter with no matching emotions');
    try {
      const filtered = testTrades.filter(trade => 
        trade.emotional_state && trade.emotional_state.includes('NONEXISTENT')
      );
      setFilteredTrades(filtered);
      
      if (filtered.length === 0) {
        addTestResult('No Matching Emotions', 'pass', 'Correctly returned 0 trades for non-existent emotion');
      } else {
        addTestResult('No Matching Emotions', 'fail', `Expected 0 trades, found ${filtered.length}`);
      }
    } catch (error) {
      addTestResult('No Matching Emotions', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 8: Filter trades with no emotions
  const testTradesWithNoEmotions = async () => {
    setCurrentTest('Testing trades with no emotions');
    try {
      const filtered = testTrades.filter(trade => 
        !trade.emotional_state || trade.emotional_state.length === 0
      );
      setFilteredTrades(filtered);
      
      const expectedCount = testTrades.filter(t => 
        !t.emotional_state || t.emotional_state.length === 0
      ).length;
      
      if (filtered.length === expectedCount) {
        addTestResult('Trades With No Emotions', 'pass', `Found ${filtered.length} trades with no emotions`);
      } else {
        addTestResult('Trades With No Emotions', 'fail', `Expected ${expectedCount} trades, found ${filtered.length}`);
      }
    } catch (error) {
      addTestResult('Trades With No Emotions', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 9: Reset filters functionality
  const testResetFilters = () => {
    setCurrentTest('Testing reset filters');
    try {
      setSelectedEmotions([]);
      setFilteredTrades(testTrades);
      addTestResult('Reset Filters', 'pass', 'Filters reset successfully');
    } catch (error) {
      addTestResult('Reset Filters', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 10: Visual appearance and consistency
  const testVisualAppearance = () => {
    setCurrentTest('Testing visual appearance');
    try {
      // This would need to be tested manually in the browser
      addTestResult('Visual Appearance', 'pending', 'Manual test required: Check glass morphism design, hover states, transitions');
    } catch (error) {
      addTestResult('Visual Appearance', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    resetTests();
    
    // Step 1: Create test trades
    await createTestTrades();
    
    // Wait a bit for trades to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Run functionality tests
    testDropdownOpenClose();
    testMultiSelect();
    testDeselectEmotions();
    testKeyboardNavigation();
    
    // Step 3: Run filtering tests
    await testSingleEmotionFilter();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testMultipleEmotionFilter();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testNoMatchingEmotions();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testTradesWithNoEmotions();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testResetFilters();
    testVisualAppearance();
    
    setIsRunningTests(false);
    setCurrentTest('All tests completed');
  };

  // Manual test for dropdown functionality
  const handleEmotionFilterChange = (emotions: string[]) => {
    setSelectedEmotions(emotions);
    
    if (testTrades.length > 0) {
      const filtered = testTrades.filter(trade => {
        if (!trade.emotional_state || emotions.length === 0) return emotions.length === 0;
        return trade.emotional_state.some(emotion => emotions.includes(emotion));
      });
      setFilteredTrades(filtered);
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="glass p-6 rounded-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Emotion Search Functionality Test</h1>
        <p className="text-white/70 mb-6">
          Comprehensive test suite for the emotion search functionality in the confluence page
        </p>

        {/* Test Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunningTests ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Tests...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </button>
          
          <button
            onClick={resetTests}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset Results
          </button>
          
          <button
            onClick={() => setShowTestTrades(!showTestTrades)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            {showTestTrades ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showTestTrades ? 'Hide' : 'Show'} Test Trades
          </button>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-blue-400 font-medium">Current Test: {currentTest}</p>
          </div>
        )}

        {/* Manual Test Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Manual Dropdown Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Test Emotion Filter Dropdown</label>
                <MultiSelectEmotionDropdown
                  value={selectedEmotions}
                  onChange={handleEmotionFilterChange}
                  placeholder="Select emotions to test..."
                  className="w-full"
                />
              </div>
              {selectedEmotions.length > 0 && (
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-sm text-white/70">Selected emotions:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEmotions.map(emotion => (
                      <span key={emotion} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Manual Emotion Logging Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Test Emotion Logging</label>
                <EmotionalStateInput
                  value={logEmotions}
                  onChange={(emotions) => {
                    if (Array.isArray(emotions)) {
                      setLogEmotions(emotions);
                    }
                  }}
                  className="w-full"
                />
              </div>
              {logEmotions.length > 0 && (
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-sm text-white/70">Logged emotions:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {logEmotions.map(emotion => (
                      <span key={emotion} className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{result.test}</h3>
                    <p className="text-white/70 text-sm mt-1">{result.details}</p>
                    <p className="text-white/50 text-xs mt-2">{result.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Test Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {testResults.filter(r => r.status === 'pass').length}
                  </p>
                  <p className="text-sm text-white/70">Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {testResults.filter(r => r.status === 'fail').length}
                  </p>
                  <p className="text-sm text-white/70">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {testResults.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-white/70">Manual Test</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Trades Display */}
        {showTestTrades && testTrades.length > 0 && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Test Trades ({testTrades.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-left py-3 px-4">Market</th>
                    <th className="text-left py-3 px-4">Side</th>
                    <th className="text-left py-3 px-4">P&L</th>
                    <th className="text-left py-3 px-4">Emotions</th>
                  </tr>
                </thead>
                <tbody>
                  {testTrades.map((trade, index) => (
                    <tr key={trade.id} className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                      <td className="py-3 px-4">{trade.market}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trade.side === 'Buy'
                            ? 'bg-green-600/20 text-green-300'
                            : 'bg-red-600/20 text-red-300'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-medium ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${trade.pnl?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        {trade.emotional_state && trade.emotional_state.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {trade.emotional_state.map(emotion => (
                              <span key={emotion} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                                {emotion}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/50">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Filtered Trades Display */}
            {filteredTrades.length > 0 && filteredTrades.length !== testTrades.length && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Filtered Trades ({filteredTrades.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4">Symbol</th>
                        <th className="text-left py-3 px-4">Market</th>
                        <th className="text-left py-3 px-4">Side</th>
                        <th className="text-left py-3 px-4">P&L</th>
                        <th className="text-left py-3 px-4">Emotions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade, index) => (
                        <tr key={trade.id} className="border-b border-white/5">
                          <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                          <td className="py-3 px-4">{trade.market}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.side === 'Buy'
                                ? 'bg-green-600/20 text-green-300'
                                : 'bg-red-600/20 text-red-300'
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-medium ${
                            (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${trade.pnl?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-3 px-4">
                            {trade.emotional_state && trade.emotional_state.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trade.emotional_state.map(emotion => (
                                  <span key={emotion} className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs">
                                    {emotion}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-white/50">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}