/**
 * Comprehensive VRating Calculation Accuracy Test Suite
 * 
 * This test suite validates the VRating calculation system for:
 * - Mathematical accuracy of all scoring bands
 * - Edge case handling (empty data, single trades, extreme values)
 * - Performance and loading times
 * - Data consistency across multiple runs
 * - Integration with VRatingCard and DashboardCard components
 */

// Since we're running in Node.js, we need to mock the VRating functions for testing
// In a real TypeScript environment, these would be imported from the .ts file

// Mock VRating calculation functions for testing
// These would normally be imported from './src/lib/vrating-calculations.ts'

// Test configuration
const TEST_CONFIG = {
  performanceThreshold: 100, // ms
  consistencyRuns: 10,
  tolerance: 0.01 // Allow 0.01 difference for floating point calculations
};

// Test results tracking
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    performance: {
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    }
  },
  categories: {
    profitability: { passed: 0, failed: 0 },
    riskManagement: { passed: 0, failed: 0 },
    consistency: { passed: 0, failed: 0 },
    emotionalDiscipline: { passed: 0, failed: 0 },
    journalingAdherence: { passed: 0, failed: 0 }
  },
  edgeCases: { passed: 0, failed: 0 },
  performance: { passed: 0, failed: 0 },
  consistency: { passed: 0, failed: 0 },
  details: []
};

/**
 * Helper function to run a test and track results
 */
function runTest(testName, testFunction, category = 'general') {
  console.log(`\n🧪 Running: ${testName}`);
  testResults.summary.total++;
  
  const startTime = performance.now();
  
  try {
    const result = testFunction();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Update performance tracking
    testResults.summary.performance.maxTime = Math.max(testResults.summary.performance.maxTime, duration);
    testResults.summary.performance.minTime = Math.min(testResults.summary.performance.minTime, duration);
    testResults.summary.performance.averageTime += duration;
    
    if (result.passed) {
      console.log(`✅ PASSED: ${testName} (${duration.toFixed(2)}ms)`);
      if (result.details) console.log(`   Details: ${result.details}`);
      testResults.summary.passed++;
      
      if (testResults.categories[category]) {
        testResults.categories[category].passed++;
      } else if (category === 'edgeCases') {
        testResults.edgeCases.passed++;
      } else if (category === 'performance') {
        testResults.performance.passed++;
      } else if (category === 'consistency') {
        testResults.consistency.passed++;
      }
    } else {
      console.log(`❌ FAILED: ${testName} (${duration.toFixed(2)}ms)`);
      console.log(`   Error: ${result.error}`);
      testResults.summary.failed++;
      
      if (testResults.categories[category]) {
        testResults.categories[category].failed++;
      } else if (category === 'edgeCases') {
        testResults.edgeCases.failed++;
      } else if (category === 'performance') {
        testResults.performance.failed++;
      } else if (category === 'consistency') {
        testResults.consistency.failed++;
      }
    }
    
    testResults.details.push({
      name: testName,
      category,
      passed: result.passed,
      details: result.details || '',
      error: result.error || '',
      duration,
      expected: result.expected,
      actual: result.actual
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`❌ ERROR: ${testName} (${duration.toFixed(2)}ms)`);
    console.log(`   Error: ${error.message}`);
    testResults.summary.failed++;
    
    if (testResults.categories[category]) {
      testResults.categories[category].failed++;
    } else if (category === 'edgeCases') {
      testResults.edgeCases.failed++;
    } else if (category === 'performance') {
      testResults.performance.failed++;
    } else if (category === 'consistency') {
      testResults.consistency.failed++;
    }
    
    testResults.details.push({
      name: testName,
      category,
      passed: false,
      details: '',
      error: error.message,
      duration,
      expected: null,
      actual: null
    });
    
    return { passed: false, error: error.message };
  }
}

/**
 * Helper function to create test trades
 */
function createTestTrade(overrides = {}) {
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
}

/**
 * Helper function to compare values with tolerance
 */
function closeEnough(actual, expected, tolerance = TEST_CONFIG.tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

// ===== PROFITABILITY TESTS =====

function testProfitabilityScoringBands() {
  const testCases = [
    {
      name: 'High performer (>50% P&L, >70% win rate)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 14 ? 1000 : -200, // 70% win rate
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [9.0, 10.0]
    },
    {
      name: 'Average performer (10-30% P&L, 50-60% win rate)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 11 ? 300 : -150, // 55% win rate
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [6.0, 7.9]
    },
    {
      name: 'Poor performer (<-10% P&L, <30% win rate)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 5 ? 200 : -400, // 25% win rate
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [1.0, 1.9]
    },
    {
      name: 'Linear scaling verification (20% P&L, 55% win rate)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 11 ? 400 : -200, // 55% win rate, 20% avg P&L
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [6.0, 7.0] // Should be around 6.0 + (20-10)*0.1 = 7.0
    }
  ];
  
  let allPassed = true;
  const results = [];
  
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
}

// ===== RISK MANAGEMENT TESTS =====

function testRiskManagementScoringBands() {
  const testCases = [
    {
      name: 'Low risk (<5% drawdown, <5% large losses)',
      trades: Array(20).fill().map((_, i) => 
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
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 8 ? 50 : -500, // High drawdown, large losses
          quantity: 100 + Math.random() * 200, // High variability
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [2.0, 3.9]
    },
    {
      name: 'Quantity variability penalty test',
      trades: [
        ...Array(10).fill().map(() => createTestTrade({ quantity: 100 })),
        ...Array(10).fill().map(() => createTestTrade({ quantity: 500 })) // High variability
      ],
      expectedRange: [4.0, 6.0] // Should be penalized for variability
    }
  ];
  
  let allPassed = true;
  const results = [];
  
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
}

// ===== CONSISTENCY TESTS =====

function testConsistencyScoringBands() {
  const testCases = [
    {
      name: 'Consistent trader (<5% std dev, ≤3 loss streak)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: 100 + Math.random() * 50 - 25, // Low variability
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [8.0, 10.0]
    },
    {
      name: 'Inconsistent trader (>20% std dev, >10 loss streak)',
      trades: [
        ...Array(5).fill().map(() => createTestTrade({ pnl: 1000 })),
        ...Array(15).fill().map(() => createTestTrade({ pnl: -200 })) // High variability, long loss streak
      ],
      expectedRange: [2.0, 3.9]
    },
    {
      name: 'Monthly consistency ratio calculation',
      trades: [
        ...Array(5).fill().map((_, i) => createTestTrade({ 
          pnl: 100, 
          trade_date: '2025-01-01' 
        })),
        ...Array(5).fill().map((_, i) => createTestTrade({ 
          pnl: 100, 
          trade_date: '2025-02-01' 
        })),
        ...Array(5).fill().map((_, i) => createTestTrade({ 
          pnl: -50, 
          trade_date: '2025-03-01' 
        }))
      ],
      expectedRange: [6.0, 8.0] // 2/3 positive months
    }
  ];
  
  let allPassed = true;
  const results = [];
  
  testCases.forEach(testCase => {
    const result = calculateVRating(testCase.trades);
    const score = result.categoryScores.consistency;
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
    details: `All ${results.length} consistency scoring bands tested`,
    expected: results.map(r => `${r.name}: ${r.expected[0]}-${r.expected[1]}`),
    actual: results.map(r => `${r.name}: ${r.actual.toFixed(2)}`)
  };
}

// ===== EMOTIONAL DISCIPLINE TESTS =====

function testEmotionalDisciplineScoringBands() {
  const testCases = [
    {
      name: 'High discipline (>90% positive emotions, <10% negative impact)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 15 ? 100 : -50, // Good win rate
          emotional_state: {
            primary_emotion: 'CONFIDENT',
            secondary_emotion: 'PATIENCE'
          },
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [8.0, 10.0]
    },
    {
      name: 'Low discipline (<10% positive emotions, >70% negative impact)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          pnl: i < 5 ? 100 : -200, // Poor win rate
          emotional_state: {
            primary_emotion: 'FOMO',
            secondary_emotion: 'REVENGE'
          },
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [2.0, 3.9]
    },
    {
      name: 'Emotion-win correlation bonus test',
      trades: [
        ...Array(10).fill().map(() => createTestTrade({
          pnl: 100,
          emotional_state: { primary_emotion: 'CONFIDENT' }
        })),
        ...Array(5).fill().map(() => createTestTrade({
          pnl: -50,
          emotional_state: { primary_emotion: 'FOMO' }
        }))
      ],
      expectedRange: [7.0, 9.0] // Should get bonus for correlation
    }
  ];
  
  let allPassed = true;
  const results = [];
  
  testCases.forEach(testCase => {
    const result = calculateVRating(testCase.trades);
    const score = result.categoryScores.emotionalDiscipline;
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
    details: `All ${results.length} emotional discipline scoring bands tested`,
    expected: results.map(r => `${r.name}: ${r.expected[0]}-${r.expected[1]}`),
    actual: results.map(r => `${r.name}: ${r.actual.toFixed(2)}`)
  };
}

// ===== JOURNALING ADHERENCE TESTS =====

function testJournalingAdherenceScoringBands() {
  const testCases = [
    {
      name: 'Excellent logging (>95% completeness, <2 day gaps)',
      trades: Array(20).fill().map((_, i) => 
        createTestTrade({
          trade_date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Detailed notes for this trade',
          emotional_state: { primary_emotion: 'CONFIDENT' },
          strategies: { id: 'strategy', name: 'Strategy' }
        })
      ),
      expectedRange: [8.0, 10.0]
    },
    {
      name: 'Poor logging (<20% completeness, >14 day gaps)',
      trades: Array(5).fill().map((_, i) => 
        createTestTrade({
          trade_date: new Date(Date.now() - (90 - i * 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          // Missing notes, emotional_state, and strategies
        })
      ),
      expectedRange: [2.0, 3.9]
    },
    {
      name: 'Strategy and notes completeness verification',
      trades: Array(10).fill().map((_, i) => 
        createTestTrade({
          notes: 'Detailed notes',
          strategies: { id: 'strategy', name: 'Strategy' },
          trade_date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      ),
      expectedRange: [6.0, 8.0] // Should be good but not perfect
    }
  ];
  
  let allPassed = true;
  const results = [];
  
  testCases.forEach(testCase => {
    const result = calculateVRating(testCase.trades);
    const score = result.categoryScores.journalingAdherence;
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
    details: `All ${results.length} journaling adherence scoring bands tested`,
    expected: results.map(r => `${r.name}: ${r.expected[0]}-${r.expected[1]}`),
    actual: results.map(r => `${r.name}: ${r.actual.toFixed(2)}`)
  };
}

// ===== EDGE CASES =====

function testEdgeCases() {
  const edgeCases = [
    {
      name: 'Empty trades array',
      trades: [],
      expectedOverall: 0,
      expectedCategories: { profitability: 0, riskManagement: 0, consistency: 0, emotionalDiscipline: 0, journalingAdherence: 0 }
    },
    {
      name: 'Single trade',
      trades: [createTestTrade()],
      expectedRange: [1.0, 10.0] // Should be valid
    },
    {
      name: 'Missing data fields',
      trades: [
        createTestTrade({ pnl: undefined, emotional_state: null, notes: undefined })
      ],
      expectedRange: [1.0, 10.0] // Should handle gracefully
    },
    {
      name: 'Extreme values (very high P&L)',
      trades: Array(10).fill().map(() => createTestTrade({ pnl: 10000 })),
      expectedRange: [8.0, 10.0] // Should be very high
    },
    {
      name: 'Extreme values (very low P&L)',
      trades: Array(10).fill().map(() => createTestTrade({ pnl: -10000 })),
      expectedRange: [1.0, 3.0] // Should be very low
    },
    {
      name: 'Incomplete emotional data',
      trades: Array(10).fill().map(() => createTestTrade({ 
        emotional_state: 'invalid_json' 
      })),
      expectedRange: [1.0, 10.0] // Should handle gracefully
    }
  ];
  
  let allPassed = true;
  const results = [];
  
  edgeCases.forEach(testCase => {
    try {
      const result = calculateVRating(testCase.trades);
      let passed = true;
      
      if (testCase.expectedOverall !== undefined) {
        passed = passed && closeEnough(result.overallRating, testCase.expectedOverall, 0.1);
      }
      
      if (testCase.expectedCategories) {
        Object.keys(testCase.expectedCategories).forEach(category => {
          passed = passed && closeEnough(
            result.categoryScores[category], 
            testCase.expectedCategories[category], 
            0.1
          );
        });
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
    } catch (error) {
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
}

// ===== PERFORMANCE TESTS =====

function testPerformance() {
  const tradeSizes = [10, 50, 100, 500, 1000];
  const results = [];
  let allPassed = true;
  
  tradeSizes.forEach(size => {
    const trades = Array(size).fill().map((_, i) => 
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
}

// ===== CONSISTENCY TESTS =====

function testConsistency() {
  const testTrades = Array(50).fill().map((_, i) => 
    createTestTrade({
      trade_date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
  );
  
  const results = [];
  let allPassed = true;
  
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
        if (!closeEnough(result.categoryScores[category], firstResult.categoryScores[category], 0.001)) {
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
}

// ===== INTEGRATION TESTS =====

function testVRatingDescription() {
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
  const results = [];
  
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
}

function testSingleTradeVRating() {
  const testCases = [
    {
      name: 'Profitable trade with positive emotion',
      trade: createTestTrade({ pnl: 100, emotional_state: { primary_emotion: 'CONFIDENT' } }),
      expectedRange: [7.0, 10.0]
    },
    {
      name: 'Loss trade with negative emotion',
      trade: createTestTrade({ pnl: -100, emotional_state: { primary_emotion: 'FOMO' } }),
      expectedRange: [1.0, 5.0]
    },
    {
      name: 'Complete journaling',
      trade: createTestTrade({ 
        pnl: 50, 
        notes: 'Good trade',
        emotional_state: { primary_emotion: 'PATIENCE' },
        strategies: { id: 'test', name: 'Test' }
      }),
      expectedRange: [6.0, 10.0]
    }
  ];
  
  let allPassed = true;
  const results = [];
  
  testCases.forEach(testCase => {
    const score = calculateSingleTradeVRating(testCase.trade);
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
    details: `All ${results.length} single trade VRating calculations tested`,
    expected: results.map(r => `${r.name}: ${r.expected[0]}-${r.expected[1]}`),
    actual: results.map(r => `${r.name}: ${r.actual.toFixed(2)}`)
  };
}

// ===== MAIN TEST RUNNER =====

async function runComprehensiveVRatingTest() {
  console.log('🚀 Starting Comprehensive VRating Calculation Test Suite...\n');
  console.log(`📊 Test Configuration:`);
  console.log(`   Performance Threshold: ${TEST_CONFIG.performanceThreshold}ms`);
  console.log(`   Consistency Runs: ${TEST_CONFIG.consistencyRuns}`);
  console.log(`   Tolerance: ±${TEST_CONFIG.tolerance}`);
  
  // Run all tests
  runTest('Profitability Scoring Bands', testProfitabilityScoringBands, 'profitability');
  runTest('Risk Management Scoring Bands', testRiskManagementScoringBands, 'riskManagement');
  runTest('Consistency Scoring Bands', testConsistencyScoringBands, 'consistency');
  runTest('Emotional Discipline Scoring Bands', testEmotionalDisciplineScoringBands, 'emotionalDiscipline');
  runTest('Journaling Adherence Scoring Bands', testJournalingAdherenceScoringBands, 'journalingAdherence');
  runTest('Edge Cases', testEdgeCases, 'edgeCases');
  runTest('Performance', testPerformance, 'performance');
  runTest('Consistency', testConsistency, 'consistency');
  runTest('VRating Description', testVRatingDescription, 'general');
  runTest('Single Trade VRating', testSingleTradeVRating, 'general');
  
  // Calculate final statistics
  testResults.summary.performance.averageTime = testResults.summary.performance.averageTime / testResults.summary.total;
  
  // Generate report
  generateTestReport();
  
  return testResults;
}

function generateTestReport() {
  const timestamp = new Date().toLocaleString();
  const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  
  let report = `# Comprehensive VRating Calculation Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Success Rate:** ${successRate}% (${testResults.summary.passed}/${testResults.summary.total})\n\n`;
  
  report += `## Summary\n\n`;
  report += `- ✅ **Passed:** ${testResults.summary.passed}\n`;
  report += `- ❌ **Failed:** ${testResults.summary.failed}\n`;
  report += `- 📊 **Total:** ${testResults.summary.total}\n`;
  report += `- ⚡ **Avg Performance:** ${testResults.summary.performance.averageTime.toFixed(2)}ms\n`;
  report += `- 🎯 **Max Performance:** ${testResults.summary.performance.maxTime.toFixed(2)}ms\n\n`;
  
  report += `## Category Breakdown\n\n`;
  Object.keys(testResults.categories).forEach(category => {
    const cat = testResults.categories[category];
    const catTotal = cat.passed + cat.failed;
    const catRate = catTotal > 0 ? ((cat.passed / catTotal) * 100).toFixed(1) : '0.0';
    report += `- **${category}:** ${cat.passed}/${catTotal} (${catRate}%)\n`;
  });
  
  report += `\n## Edge Cases\n\n`;
  report += `- **Passed:** ${testResults.edgeCases.passed}\n`;
  report += `- **Failed:** ${testResults.edgeCases.failed}\n\n`;
  
  report += `## Performance\n\n`;
  report += `- **Passed:** ${testResults.performance.passed}\n`;
  report += `- **Failed:** ${testResults.performance.failed}\n`;
  report += `- **Threshold:** ${TEST_CONFIG.performanceThreshold}ms\n\n`;
  
  report += `## Consistency\n\n`;
  report += `- **Passed:** ${testResults.consistency.passed}\n`;
  report += `- **Failed:** ${testResults.consistency.failed}\n`;
  report += `- **Runs:** ${TEST_CONFIG.consistencyRuns}\n\n`;
  
  report += `## Detailed Results\n\n`;
  
  testResults.details.forEach(test => {
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
  
  if (testResults.summary.failed === 0) {
    report += `🎉 **All tests passed!** The VRating calculation system is working correctly.\n\n`;
    report += `All VRating features have been successfully validated:\n`;
    report += `- Scoring bands work correctly for all categories\n`;
    report += `- Edge cases are handled gracefully\n`;
    report += `- Performance meets requirements\n`;
    report += `- Results are consistent across multiple runs\n`;
    report += `- Integration functions work properly\n`;
  } else {
    report += `⚠️ **Some tests failed.** Please review the failed tests and address the issues.\n\n`;
    report += `The VRating calculation system may need adjustments for full accuracy.\n`;
  }
  
  // Save report to file
  const fs = require('fs');
  fs.writeFileSync('comprehensive-vrating-calculation-test-report.md', report);
  fs.writeFileSync('comprehensive-vrating-calculation-test-results.json', JSON.stringify(testResults, null, 2));
  
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Average Performance: ${testResults.summary.performance.averageTime.toFixed(2)}ms`);
  
  console.log('\n📄 Reports generated:');
  console.log('   - comprehensive-vrating-calculation-test-report.md (readable report)');
  console.log('   - comprehensive-vrating-calculation-test-results.json (detailed results)');
}

// Run the test suite
if (require.main === module) {
  runComprehensiveVRatingTest().catch(console.error);
}

module.exports = {
  runComprehensiveVRatingTest,
  testResults
};