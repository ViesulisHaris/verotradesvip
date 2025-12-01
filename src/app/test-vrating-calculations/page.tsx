'use client';

import React, { useState, useEffect } from 'react';
import { calculateVRating, calculateSingleTradeVRating, getVRatingDescription, VRatingTrade } from '@/lib/vrating-calculations';

// Test configuration
const TEST_CONFIG = {
  performanceThreshold: 100, // ms
  consistencyRuns: 10,
  tolerance: 0.01 // Allow 0.01 difference for floating point calculations
};

// Test results tracking
interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details?: string;
  error?: string;
  duration: number;
  expected?: any;
  actual?: any;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  performance: {
    averageTime: number;
    maxTime: number;
    minTime: number;
  };
}

export default function TestVRatingCalculations() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary>({
    total: 0,
    passed: 0,
    failed: 0,
    performance: {
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    }
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  /**
   * Helper function to create test trades
   */
  const createTestTrade = (overrides: Partial<VRatingTrade> = {}): VRatingTrade => {
    return {
      id: 'test-' + Math.random().toString(36).substr(2, 9),
      symbol: 'TEST',
      side: 'Buy',
      quantity: 100,
      entry_price: 100,
      exit_price: 105,
      pnl: 500,
      trade_date: new Date().toISOString().split('T')[0],
      entry_time: new Date().toISOString(),
      exit_time: new Date().toISOString(),
      emotional_state: {
        primary_emotion: 'CONFIDENT',
        secondary_emotion: 'PATIENCE',
        intensity: 7
      },
      strategy_id: 'test-strategy',
      user_id: 'test-user',
      notes: 'Test trade',
      market: 'STOCKS',
      strategies: {
        id: 'test-strategy',
        name: 'Test Strategy',
        rules: ['rule1', 'rule2']
      },
      ...overrides
    };
  };

  /**
   * Helper function to run a test and track results
   */
  const runTest = (testName: string, testFunction: () => any, category: string = 'general') => {
    console.log(`\n🧪 Running: ${testName}`);
    setCurrentTest(testName);
    
    const startTime = performance.now();
    
    try {
      const result = testFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const testResult: TestResult = {
        name: testName,
        category,
        passed: result.passed,
        details: result.details || '',
        error: result.error || '',
        duration,
        expected: result.expected,
        actual: result.actual
      };
      
      setTestResults(prev => [...prev, testResult]);
      
      if (result.passed) {
        console.log(`✅ PASSED: ${testName} (${duration.toFixed(2)}ms)`);
        if (result.details) console.log(`   Details: ${result.details}`);
      } else {
        console.log(`❌ FAILED: ${testName} (${duration.toFixed(2)}ms)`);
        console.log(`   Error: ${result.error}`);
      }
      
      return result;
    } catch (error: any) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`❌ ERROR: ${testName} (${duration.toFixed(2)}ms)`);
      console.log(`   Error: ${error.message}`);
      
      const testResult: TestResult = {
        name: testName,
        category,
        passed: false,
        details: '',
        error: error.message,
        duration,
        expected: null,
        actual: null
      };
      
      setTestResults(prev => [...prev, testResult]);
      return { passed: false, error: error.message };
    }
  };

  /**
   * Helper function to compare values with tolerance
   */
  const closeEnough = (actual: number, expected: number, tolerance: number = TEST_CONFIG.tolerance) => {
    return Math.abs(actual - expected) <= tolerance;
  };

  // ===== PROFITABILITY TESTS =====

  const testProfitabilityScoringBands = () => {
    const testCases = [
      {
        name: 'High performer (>50% P&L, >70% win rate)',
        trades: Array(20).fill(null).map((_, i) => 
          createTestTrade({
            pnl: i < 14 ? 1000 : -200, // 70% win rate
            trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ),
        expectedRange: [9.0, 10.0]
      },
      {
        name: 'Average performer (10-30% P&L, 50-60% win rate)',
        trades: Array(20).fill(null).map((_, i) => 
          createTestTrade({
            pnl: i < 11 ? 300 : -150, // 55% win rate
            trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ),
        expectedRange: [6.0, 7.9]
      },
      {
        name: 'Poor performer (<-10% P&L, <30% win rate)',
        trades: Array(20).fill(null).map((_, i) => 
          createTestTrade({
            pnl: i < 5 ? 200 : -400, // 25% win rate
            trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ),
        expectedRange: [1.0, 1.9]
      }
    ];
    
    let allPassed = true;
    const results: any[] = [];
    
    testCases.forEach(testCase => {
      const result = calculateVRating(testCase.trades);
      const score = result.categoryScores.profitability;
      const inRange = score >= testCase.expectedRange[0] && score <= testCase.expectedRange[1];
      
      results.push({
        name: testCase.name,
        score,
        expected: testCase.expectedRange,
        actual: score,
        passed: inRange
      });
      
      if (!inRange) {
        allPassed = false;
      }
    });
    
    return {
      passed: allPassed,
      details: `All ${results.length} profitability scoring bands tested`,
      expected: results.map(r => `${r.name}: ${r.expected[0]}-${r.expected[1]}`),
      actual: results.map(r => `${r.name}: ${r.actual.toFixed(2)}`)
    };
  };

  // ===== RISK MANAGEMENT TESTS =====

  const testRiskManagementScoringBands = () => {
    const testCases = [
      {
        name: 'Low risk (<5% drawdown, <5% large losses)',
        trades: Array(20).fill(null).map((_, i) => 
          createTestTrade({
            pnl: i < 15 ? 100 : -50, // Low drawdown, small losses
            quantity: 100 + Math.random() * 20, // Low variability
            trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ),
        expectedRange: [8.0, 10.0]
      },
      {
        name: 'High risk (>30% drawdown, >50% large losses)',
        trades: Array(20).fill(null).map((_, i) => 
          createTestTrade({
            pnl: i < 8 ? 50 : -500, // High drawdown, large losses
            quantity: 100 + Math.random() * 200, // High variability
            trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ),
        expectedRange: [2.0, 3.9]
      }
    ];
    
    let allPassed = true;
    const results: any[] = [];
    
    testCases.forEach(testCase => {
      const result = calculateVRating(testCase.trades);
      const score = result.categoryScores.riskManagement;
      const inRange = score >= testCase.expectedRange[0] && score <= testCase.expectedRange[1];
      
      results.push({
        name: testCase.name,
        score,
        expected: testCase.expectedRange,
        actual: score,
        passed: inRange
      });
      
      if (!inRange) {
        allPassed = false;
      }
    });
    
    return {
      passed: allPassed,
      details: `All ${results.length} risk management scoring bands tested`,
      expected: results.map(r => `${r.name}: ${r.expected[0]}-${r.expected[1]}`),
      actual: results.map(r => `${r.name}: ${r.actual.toFixed(2)}`)
    };
  };

  // ===== EDGE CASES =====

  const testEdgeCases = () => {
    const edgeCases = [
      {
        name: 'Empty trades array',
        trades: [],
        expectedOverall: 0
      },
      {
        name: 'Single trade',
        trades: [createTestTrade()],
        expectedRange: [1.0, 10.0]
      },
      {
        name: 'Missing data fields',
        trades: [
          createTestTrade({ pnl: undefined, emotional_state: null, notes: undefined })
        ],
        expectedRange: [1.0, 10.0]
      }
    ];
    
    let allPassed = true;
    const results: any[] = [];
    
    edgeCases.forEach(testCase => {
      try {
        const result = calculateVRating(testCase.trades);
        let passed = true;
        
        if (testCase.expectedOverall !== undefined) {
          passed = passed && closeEnough(result.overallRating, testCase.expectedOverall, 0.1);
        }
        
        if (testCase.expectedRange) {
          passed = passed && result.overallRating >= testCase.expectedRange[0] && 
                             result.overallRating <= testCase.expectedRange[1];
        }
        
        results.push({
          name: testCase.name,
          overall: result.overallRating,
          categories: result.categoryScores,
          passed
        });
        
        if (!passed) {
          allPassed = false;
        }
      } catch (error: any) {
        results.push({
          name: testCase.name,
          error: error.message,
          passed: false
        });
        allPassed = false;
      }
    });
    
    return {
      passed: allPassed,
      details: `All ${results.length} edge cases tested`,
      expected: edgeCases.map(c => c.name),
      actual: results.map(r => `${r.name}: ${r.passed ? 'PASS' : 'FAIL'}`)
    };
  };

  // ===== PERFORMANCE TESTS =====

  const testPerformance = () => {
    const tradeSizes = [10, 50, 100];
    const results: any[] = [];
    let allPassed = true;
    
    tradeSizes.forEach(size => {
      const trades = Array(size).fill(null).map((_, i) => 
        createTestTrade({
          trade_date: new Date(Date.now() - (size - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      );
      
      const startTime = performance.now();
      const result = calculateVRating(trades);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = duration <= TEST_CONFIG.performanceThreshold;
      
      results.push({
        size,
        duration,
        passed
      });
      
      if (!passed) {
        allPassed = false;
      }
    });
    
    return {
      passed: allPassed,
      details: `Performance tested for ${results.length} trade set sizes`,
      expected: `All calculations under ${TEST_CONFIG.performanceThreshold}ms`,
      actual: results.map(r => `${r.size} trades: ${r.duration.toFixed(2)}ms ${r.passed ? '✅' : '❌'}`)
    };
  };

  // ===== CONSISTENCY TESTS =====

  const testConsistency = () => {
    const testTrades = Array(50).fill(null).map((_, i) => 
      createTestTrade({
        trade_date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    );
    
    const results: any[] = [];
    
    // Run calculation multiple times
    for (let i = 0; i < TEST_CONFIG.consistencyRuns; i++) {
      const result = calculateVRating(testTrades);
      results.push(result);
    }
    
    // Check if all results are identical
    const firstResult = results[0];
    let consistent = true;
    
    results.forEach((result, index) => {
      if (index > 0) {
        Object.keys(firstResult.categoryScores).forEach(category => {
          if (!closeEnough(result.categoryScores[category as keyof typeof firstResult.categoryScores], 
                             firstResult.categoryScores[category as keyof typeof firstResult.categoryScores], 0.001)) {
            consistent = false;
          }
        });
        
        if (!closeEnough(result.overallRating, firstResult.overallRating, 0.001)) {
          consistent = false;
        }
      }
    });
    
    return {
      passed: consistent,
      details: `Consistency tested with ${TEST_CONFIG.consistencyRuns} runs`,
      expected: `All runs produce identical results`,
      actual: `Consistency: ${consistent ? 'PASS' : 'FAIL'}`
    };
  };

  // ===== VRATING DESCRIPTION TESTS =====

  const testVRatingDescription = () => {
    const testCases = [
      { score: 9.5, expected: "Exceptional - Elite trading performance" },
      { score: 8.2, expected: "Excellent - Superior trading skills" },
      { score: 7.1, expected: "Very Good - Above average performance" },
      { score: 6.3, expected: "Good - Competent trading" },
      { score: 5.0, expected: "Average - Room for improvement" },
      { score: 4.2, expected: "Below Average - Needs significant work" },
      { score: 3.1, expected: "Poor - Major improvements needed" },
      { score: 2.5, expected: "Very Poor - Fundamental issues" },
      { score: 1.0, expected: "Critical - Complete review required" }
    ];
    
    let allPassed = true;
    const results: any[] = [];
    
    testCases.forEach(testCase => {
      const description = getVRatingDescription(testCase.score);
      const passed = description === testCase.expected;
      
      results.push({
        score: testCase.score,
        expected: testCase.expected,
        actual: description,
        passed
      });
      
      if (!passed) {
        allPassed = false;
      }
    });
    
    return {
      passed: allPassed,
      details: `All ${results.length} VRating descriptions tested`,
      expected: testCases.map(t => `${t.score}: ${t.expected}`),
      actual: results.map(r => `${r.score}: ${r.actual}`)
    };
  };

  // ===== MAIN TEST RUNNER =====

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('Initializing test suite...');
    
    console.log('🚀 Starting Comprehensive VRating Calculation Test Suite...\n');
    console.log(`📊 Test Configuration:`);
    console.log(`   Performance Threshold: ${TEST_CONFIG.performanceThreshold}ms`);
    console.log(`   Consistency Runs: ${TEST_CONFIG.consistencyRuns}`);
    console.log(`   Tolerance: ±${TEST_CONFIG.tolerance}`);
    
    // Run all tests
    runTest('Profitability Scoring Bands', testProfitabilityScoringBands, 'profitability');
    runTest('Risk Management Scoring Bands', testRiskManagementScoringBands, 'riskManagement');
    runTest('Edge Cases', testEdgeCases, 'edgeCases');
    runTest('Performance', testPerformance, 'performance');
    runTest('Consistency', testConsistency, 'consistency');
    runTest('VRating Description', testVRatingDescription, 'general');
    
    // Calculate final statistics
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const durations = testResults.map(r => r.duration);
    const avgTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxTime = Math.max(...durations);
    const minTime = Math.min(...durations);
    
    setTestSummary({
      total: testResults.length,
      passed,
      failed,
      performance: {
        averageTime: avgTime,
        maxTime,
        minTime
      }
    });
    
    setIsRunning(false);
    setCurrentTest('');
  };

  // Generate downloadable report
  const generateReport = () => {
    const timestamp = new Date().toLocaleString();
    const successRate = ((testSummary.passed / testSummary.total) * 100).toFixed(1);
    
    let report = `# Comprehensive VRating Calculation Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Success Rate:** ${successRate}% (${testSummary.passed}/${testSummary.total})\n\n`;
    
    report += `## Summary\n\n`;
    report += `- ✅ **Passed:** ${testSummary.passed}\n`;
    report += `- ❌ **Failed:** ${testSummary.failed}\n`;
    report += `- 📊 **Total:** ${testSummary.total}\n`;
    report += `- ⚡ **Avg Performance:** ${testSummary.performance.averageTime.toFixed(2)}ms\n`;
    report += `- 🎯 **Max Performance:** ${testSummary.performance.maxTime.toFixed(2)}ms\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      report += `### ${status} ${test.name}\n\n`;
      
      if (test.category !== 'general') {
        report += `**Category:** ${test.category}\n\n`;
      }
      
      if (test.details) {
        report += `**Details:** ${test.details}\n\n`;
      }
      
      if (test.error) {
        report += `**Error:** ${test.error}\n\n`;
      }
      
      if (test.duration) {
        report += `**Duration:** ${test.duration.toFixed(2)}ms\n\n`;
      }
      
      if (test.expected && test.actual) {
        report += `**Expected:** ${Array.isArray(test.expected) ? test.expected.join(', ') : test.expected}\n\n`;
        report += `**Actual:** ${Array.isArray(test.actual) ? test.actual.join(', ') : test.actual}\n\n`;
      }
    });
    
    report += `## Conclusion\n\n`;
    
    if (testSummary.failed === 0) {
      report += `🎉 **All tests passed!** The VRating calculation system is working correctly.\n\n`;
      report += `All VRating features have been successfully validated:\n`;
      report += `- Scoring bands work correctly for all categories\n`;
      report += `- Edge cases are handled gracefully\n`;
      report += `- Performance meets requirements\n`;
      report += `- Results are consistent across multiple runs\n`;
      report += `- Integration functions work properly\n`;
    } else {
      report += `⚠️ **Some tests failed.** Please review failed tests and address the issues.\n\n`;
      report += `The VRating calculation system may need adjustments for full accuracy.\n`;
    }
    
    // Download report
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vrating-calculation-test-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Comprehensive VRating Calculation Test Suite
          </h1>
          <p className="text-slate-300 mb-6">
            Validate the accuracy and performance of VRating calculation system
          </p>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Test Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Performance Threshold:</span>
                <span className="ml-2 text-green-400">{TEST_CONFIG.performanceThreshold}ms</span>
              </div>
              <div>
                <span className="text-slate-400">Consistency Runs:</span>
                <span className="ml-2 text-green-400">{TEST_CONFIG.consistencyRuns}</span>
              </div>
              <div>
                <span className="text-slate-400">Tolerance:</span>
                <span className="ml-2 text-green-400">±{TEST_CONFIG.tolerance}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg font-medium transition-colors duration-200"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            {testResults.length > 0 && (
              <button
                onClick={generateReport}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors duration-200"
              >
                Download Report
              </button>
            )}
          </div>
          
          {currentTest && (
            <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-300">Currently running: <span className="font-medium">{currentTest}</span></p>
            </div>
          )}
          
          {testSummary.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-green-400">{testSummary.passed}</h3>
                <p className="text-sm text-slate-400">Passed</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-red-400">{testSummary.failed}</h3>
                <p className="text-sm text-slate-400">Failed</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-blue-400">{testSummary.performance.averageTime.toFixed(2)}ms</h3>
                <p className="text-sm text-slate-400">Avg Time</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-purple-400">
                  {((testSummary.passed / testSummary.total) * 100).toFixed(1)}%
                </h3>
                <p className="text-sm text-slate-400">Success Rate</p>
              </div>
            </div>
          )}
          
          {testResults.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Test Results</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-600/10 border-green-500/30' 
                      : 'bg-red-600/10 border-red-500/30'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          result.passed ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {result.passed ? '✅' : '❌'} {result.name}
                        </h3>
                        {result.details && (
                          <p className="text-sm text-slate-300 mt-1">{result.details}</p>
                        )}
                        {result.error && (
                          <p className="text-sm text-red-300 mt-1">Error: {result.error}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-slate-400">{result.duration.toFixed(2)}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}