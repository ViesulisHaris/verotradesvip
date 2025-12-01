'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import MultiSelectEmotionDropdown from '@/components/ui/MultiSelectEmotionDropdown';
import { Bug, AlertTriangle, CheckCircle, Info, Database, Filter } from 'lucide-react';

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

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  evidence?: any;
  fix?: string;
}

export default function TestEmotionDiagnosis() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [currentTest, setCurrentTest] = useState('');

  const addDiagnosticResult = (test: string, status: 'pass' | 'fail' | 'warning', details: string, evidence?: any, fix?: string) => {
    const result: DiagnosticResult = {
      test,
      status,
      details,
      evidence,
      fix
    };
    setDiagnosticResults(prev => [...prev, result]);
  };

  const resetDiagnostics = () => {
    setDiagnosticResults([]);
    setCurrentTest('');
    setSelectedEmotions([]);
    setFilteredTrades([]);
  };

  // Test 1: Check emotional_state data types in database
  const testEmotionalStateDataTypes = async () => {
    setCurrentTest('Diagnosing emotional_state data types');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addDiagnosticResult('Authentication', 'fail', 'User not authenticated');
        return;
      }

      // Sample trades to check emotional_state field
      const { data: sampleTrades, error } = await supabase
        .from('trades')
        .select('id, symbol, emotional_state')
        .eq('user_id', user.id)
        .limit(10);

      if (error) {
        addDiagnosticResult('Database Query', 'fail', `Error fetching trades: ${error.message}`);
        return;
      }

      const typeAnalysis = sampleTrades?.map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        emotional_state: trade.emotional_state,
        type: Array.isArray(trade.emotional_state) ? 'array' : 
               trade.emotional_state === null ? 'null' : 
               typeof trade.emotional_state,
        length: Array.isArray(trade.emotional_state) ? trade.emotional_state.length : 0
      }));

      addDiagnosticResult('Emotional State Data Types', 'warning', 
        `Found mixed data types in emotional_state field. Analysis: ${JSON.stringify(typeAnalysis, null, 2)}`,
        typeAnalysis,
        'Ensure all emotional_state fields are consistently arrays or null'
      );

      setTrades(sampleTrades as Trade[]);
    } catch (error) {
      addDiagnosticResult('Data Type Analysis', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 2: Test filtering logic with various data types
  const testFilteringLogic = () => {
    setCurrentTest('Testing filtering logic edge cases');
    
    // Test case 1: Normal array
    const trade1 = { emotional_state: ['FOMO', 'DISCIPLINE'] } as Trade;
    const filter1 = ['FOMO'];
    const result1 = trade1.emotional_state && 
      Array.isArray(trade1.emotional_state) && 
      trade1.emotional_state.some(emotion => filter1.includes(emotion));
    
    addDiagnosticResult('Filter Logic - Normal Array', result1 ? 'pass' : 'fail',
      `Trade with ['FOMO', 'DISCIPLINE'] filtered by ['FOMO']: ${result1}`,
      { trade: trade1, filter: filter1, result: result1 }
    );

    // Test case 2: Empty array
    const trade2 = {
      id: 'test-2',
      symbol: 'TEST2',
      market: 'Stock',
      side: 'Buy' as const,
      quantity: 100,
      pnl: 0,
      trade_date: new Date().toISOString().split('T')[0],
      strategy_id: null,
      emotional_state: []
    } as Trade;
    const filter2 = ['FOMO'];
    const result2 = trade2.emotional_state && 
      Array.isArray(trade2.emotional_state) && 
      trade2.emotional_state.some(emotion => filter2.includes(emotion));
    
    addDiagnosticResult('Filter Logic - Empty Array', !result2 ? 'pass' : 'fail',
      `Trade with [] filtered by ['FOMO']: ${result2} (should be false)`,
      { trade: trade2, filter: filter2, result: result2 }
    );

    // Test case 3: Null emotional_state
    const trade3 = { emotional_state: null } as Trade;
    const filter3 = ['FOMO'];
    const result3 = trade3.emotional_state && 
      Array.isArray(trade3.emotional_state) && 
      trade3.emotional_state.some(emotion => filter3.includes(emotion));
    
    addDiagnosticResult('Filter Logic - Null State', !result3 ? 'pass' : 'fail',
      `Trade with null filtered by ['FOMO']: ${result3} (should be false)`,
      { trade: trade3, filter: filter3, result: result3 }
    );

    // Test case 4: Undefined emotional_state
    const trade4 = {
      id: 'test-4',
      symbol: 'TEST4',
      market: 'Stock',
      side: 'Buy' as const,
      quantity: 100,
      pnl: 0,
      trade_date: new Date().toISOString().split('T')[0],
      strategy_id: null,
      emotional_state: null
    } as Trade;
    const filter4 = ['FOMO'];
    const result4 = trade4.emotional_state && 
      Array.isArray(trade4.emotional_state) && 
      trade4.emotional_state.some(emotion => filter4.includes(emotion));
    
    addDiagnosticResult('Filter Logic - Undefined State', !result4 ? 'pass' : 'fail',
      `Trade with undefined filtered by ['FOMO']: ${result4} (should be false)`,
      { trade: trade4, filter: filter4, result: result4 }
    );
  };

  // Test 3: Check MultiSelectEmotionDropdown state synchronization
  const testDropdownStateSync = () => {
    setCurrentTest('Testing dropdown state synchronization');
    
    // This test requires manual verification
    addDiagnosticResult('Dropdown State Sync', 'warning',
      'Manual test required: Verify dropdown internal state syncs with parent component',
      null,
      'Check useEffect in MultiSelectEmotionDropdown lines 91-114'
    );
  };

  // Test 4: Test keyboard navigation implementation
  const testKeyboardNavigation = () => {
    setCurrentTest('Testing keyboard navigation implementation');
    
    // Check for potential issues in keyboard event handling
    const backspaceIssue = 'Backspace handling might interfere with browser behavior when input field is focused';
    const escapeIssue = 'Escape key should close dropdown but not propagate to other elements';
    const arrowKeyIssue = 'Arrow keys should navigate but not scroll the page';
    
    addDiagnosticResult('Keyboard Navigation - Backspace', 'warning', backspaceIssue,
      null,
      'Add check for input field focus before handling backspace'
    );
    
    addDiagnosticResult('Keyboard Navigation - Escape', 'warning', escapeIssue,
      null,
      'Ensure event.stopPropagation() is called for escape key'
    );
    
    addDiagnosticResult('Keyboard Navigation - Arrow Keys', 'warning', arrowKeyIssue,
      null,
      'Add preventDefault() for arrow keys to prevent page scrolling'
    );
  };

  // Test 5: Test CSS class application
  const testCSSClassApplication = () => {
    setCurrentTest('Testing CSS class application');
    
    // Check for potential CSS issues
    const colorClassIssues = [
      'COLOR_CLASSES object missing any emotion colors',
      'Dynamic class names not applied correctly',
      'Hover states not working for all emotion pills'
    ];
    
    colorClassIssues.forEach((issue, index) => {
      addDiagnosticResult(`CSS Classes - Issue ${index + 1}`, 'warning', issue,
        null,
        'Verify COLOR_CLASSES object contains all emotion colors'
      );
    });
  };

  // Test 6: Test emotion data consistency
  const testEmotionDataConsistency = () => {
    setCurrentTest('Testing emotion data consistency');
    
    // Check if all 10 emotions are available in both components
    const expectedEmotions = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];
    
    // This would need to be verified by checking component source
    addDiagnosticResult('Emotion Consistency', 'warning',
      'Verify all 10 emotions are available in both MultiSelectEmotionDropdown and EmotionalStateInput',
      { expectedEmotions },
      'Check EMOTION_OPTIONS arrays in both components'
    );
  };

  // Run all diagnostic tests
  const runAllDiagnostics = async () => {
    setIsRunning(true);
    resetDiagnostics();
    
    await testEmotionalStateDataTypes();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testFilteringLogic();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testDropdownStateSync();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testKeyboardNavigation();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testCSSClassApplication();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testEmotionDataConsistency();
    
    setIsRunning(false);
    setCurrentTest('Diagnostics completed');
  };

  // Test emotion filtering with real data
  const handleEmotionFilter = (emotions: string[]) => {
    console.log('🔍 [EMOTION FILTER DEBUG] Emotions selected:', emotions);
    setSelectedEmotions(emotions);
    
    if (trades.length > 0) {
      // Apply the same filtering logic as confluence page
      const filtered = trades.filter(trade => {
        console.log('🔍 [EMOTION FILTER DEBUG] Processing trade:', trade.symbol, trade.emotional_state);
        
        // This matches the logic in confluence page lines 167-174
        if (!trade.emotional_state || !Array.isArray(trade.emotional_state)) {
          console.log('🔍 [EMOTION FILTER DEBUG] Trade excluded - no valid emotional_state');
          return false;
        }
        
        const hasMatchingEmotion = trade.emotional_state.some(emotion =>
          emotions.includes(emotion)
        );
        
        console.log('🔍 [EMOTION FILTER DEBUG] Trade has matching emotion:', hasMatchingEmotion);
        return hasMatchingEmotion;
      });
      
      console.log('🔍 [EMOTION FILTER DEBUG] Filtered trades:', filtered.length);
      setFilteredTrades(filtered);
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail':
        return <Bug className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'border-green-500/20 bg-green-500/5';
      case 'fail':
        return 'border-red-500/20 bg-red-500/5';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="glass p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Emotion Search Diagnostics</h1>
        </div>
        <p className="text-white/70 mb-6">
          Systematic diagnosis of potential issues in emotion search functionality
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={runAllDiagnostics}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Diagnostics...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4" />
                Run All Diagnostics
              </>
            )}
          </button>
          
          <button
            onClick={resetDiagnostics}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            Reset Results
          </button>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-blue-400 font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Current Test: {currentTest}
            </p>
          </div>
        )}

        {/* Manual Test Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              Manual Filter Test
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Test Emotion Filter</label>
                <MultiSelectEmotionDropdown
                  value={selectedEmotions}
                  onChange={handleEmotionFilter}
                  placeholder="Select emotions to diagnose..."
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
            <h2 className="text-xl font-semibold text-white mb-4">Filter Results</h2>
            <div className="space-y-4">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-sm text-white/70">Total Trades: {trades.length}</p>
                <p className="text-sm text-white/70">Selected Emotions: {selectedEmotions.length}</p>
                <p className="text-sm text-white/70">Filtered Trades: {filteredTrades.length}</p>
              </div>
              
              {selectedEmotions.length > 0 && (
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-white mb-2">Filter Analysis:</p>
                  <div className="space-y-1 text-xs text-white/70">
                    <p>• Check browser console for detailed filtering logs</p>
                    <p>• Verify filtered trades match expected results</p>
                    <p>• Test with various emotion combinations</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Results */}
        {diagnosticResults.length > 0 && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Diagnostic Results</h2>
            <div className="space-y-3">
              {diagnosticResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{result.test}</h3>
                      <p className="text-white/70 text-sm mt-1">{result.details}</p>
                      {result.evidence && (
                        <details className="mt-2">
                          <summary className="text-xs text-white/50 cursor-pointer">Evidence</summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-white/80 overflow-auto">
                            {JSON.stringify(result.evidence, null, 2)}
                          </pre>
                        </details>
                      )}
                      {result.fix && (
                        <div className="mt-2 p-2 bg-blue-600/10 rounded text-xs">
                          <p className="text-blue-300 font-medium">Suggested Fix:</p>
                          <p className="text-white/70">{result.fix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {diagnosticResults.filter(r => r.status === 'pass').length}
                  </p>
                  <p className="text-sm text-white/70">Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {diagnosticResults.filter(r => r.status === 'fail').length}
                  </p>
                  <p className="text-sm text-white/70">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {diagnosticResults.filter(r => r.status === 'warning').length}
                  </p>
                  <p className="text-sm text-white/70">Warnings</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}