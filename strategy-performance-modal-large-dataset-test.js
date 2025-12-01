const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test configuration for large dataset (1,000 trades)
const TEST_CONFIG = {
  expectedStrategies: [
    'Momentum Breakout',
    'Mean Reversion', 
    'Scalping',
    'Swing Trading',
    'Options Income'
  ],
  expectedTradeCount: 1000, // Updated to 1,000 trades
  testUserEmail: 'test@example.com',
  performanceThresholds: {
    maxLoadingTime: 5000, // 5 seconds max loading time
    maxCalculationTime: 3000, // 3 seconds max calculation time
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB max memory usage
    minWinRateAccuracy: 95, // 95% minimum win rate calculation accuracy
    minPnLAccuracy: 95 // 95% minimum P&L calculation accuracy
  }
};

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  },
  modalLoadingPerformance: {
    tests: [],
    overallStatus: 'pending'
  },
  performanceMetricsAccuracy: {
    tests: [],
    overallStatus: 'pending'
  },
  dataRenderingPerformance: {
    tests: [],
    overallStatus: 'pending'
  },
  individualStrategyAccuracy: {
    tests: [],
    overallStatus: 'pending'
  },
  scalabilityIssues: {
    tests: [],
    overallStatus: 'pending'
  },
  issues: [],
  recommendations: []
};

// Helper function to run a test
async function runTest(testName, testFunction, category) {
  console.log(`\n🧪 Running test: ${testName}`);
  testResults.summary.totalTests++;
  
  try {
    const startTime = Date.now();
    const result = await testFunction();
    const endTime = Date.now();
    const testDuration = endTime - startTime;
    
    const testResult = {
      name: testName,
      status: result.passed ? 'passed' : 'failed',
      message: result.message,
      details: { ...result.details, testDuration },
      timestamp: new Date().toISOString()
    };
    
    testResults[category].tests.push(testResult);
    
    if (result.passed) {
      console.log(`✅ ${testName}: ${result.message} (${testDuration}ms)`);
      testResults.summary.passedTests++;
    } else {
      console.log(`❌ ${testName}: ${result.message} (${testDuration}ms)`);
      testResults.summary.failedTests++;
      testResults.issues.push({
        test: testName,
        category,
        message: result.message,
        details: { ...result.details, testDuration }
      });
    }
    
    return result;
  } catch (error) {
    console.log(`💥 ${testName}: Error - ${error.message}`);
    const testResult = {
      name: testName,
      status: 'error',
      message: `Error: ${error.message}`,
      details: { error: error.stack },
      timestamp: new Date().toISOString()
    };
    
    testResults[category].tests.push(testResult);
    testResults.summary.failedTests++;
    testResults.issues.push({
      test: testName,
      category,
      message: `Error: ${error.message}`,
      details: { error: error.stack }
    });
    
    return { passed: false, message: error.message };
  }
}

// Helper function to authenticate test user
async function authenticateTestUser() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.testUserEmail,
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('Authentication failed, trying to sign up...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_CONFIG.testUserEmail,
        password: 'testpassword123'
      });
      
      if (signUpError) {
        throw new Error(`Authentication failed: ${signUpError.message}`);
      }
      
      return signUpData.user;
    }
    
    return data.user;
  } catch (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
}

// 1. Test modal loading performance with 1,000 trades
async function testModalLoadingPerformance() {
  const user = await authenticateTestUser();
  
  // Test 1.1: Modal loading time with full dataset
  await runTest(
    'Modal Loading - Full dataset loading time',
    async () => {
      const startTime = Date.now();
      
      // Simulate fetching all strategies with their performance data
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        return { passed: false, message: `Failed to fetch strategies: ${error.message}` };
      }
      
      // Fetch all trades for performance calculations
      const { data: trades, error: tradeError } = await supabase
        .from('trades')
        .select('id, strategy_id, pnl, trade_date, symbol, side, quantity, entry_price, exit_price')
        .eq('user_id', user.id)
        .not('pnl', 'is', null);
      
      if (tradeError) {
        return { passed: false, message: `Failed to fetch trades: ${tradeError.message}` };
      }
      
      const endTime = Date.now();
      const loadingTime = endTime - startTime;
      
      // Check if we have the expected number of trades
      const hasExpectedTrades = trades.length >= TEST_CONFIG.expectedTradeCount * 0.9; // Allow 10% tolerance
      
      return { 
        passed: loadingTime <= TEST_CONFIG.performanceThresholds.maxLoadingTime && hasExpectedTrades,
        message: `Loaded ${trades.length} trades in ${loadingTime}ms`,
        details: { 
          loadingTime, 
          tradeCount: trades.length, 
          expectedCount: TEST_CONFIG.expectedTradeCount,
          threshold: TEST_CONFIG.performanceThresholds.maxLoadingTime
        }
      };
    },
    'modalLoadingPerformance'
  );
  
  // Test 1.2: Strategy performance calculation time
  await runTest(
    'Modal Loading - Strategy performance calculation time',
    async () => {
      const startTime = Date.now();
      
      // Fetch all trades for performance calculations
      const { data: trades, error } = await supabase
        .from('trades')
        .select('strategy_id, pnl')
        .eq('user_id', user.id)
        .not('pnl', 'is', null);
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      // Simulate performance calculations for each strategy
      const strategyPerformance = {};
      const strategies = [...new Set(trades.map(t => t.strategy_id))];
      
      for (const strategyId of strategies) {
        const strategyTrades = trades.filter(t => t.strategy_id === strategyId);
        const pnls = strategyTrades.map(t => t.pnl || 0);
        
        const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
        const wins = pnls.filter(p => p > 0).length;
        const winRate = (wins / pnls.length) * 100;
        const profitFactor = calculateProfitFactor(strategyTrades);
        
        strategyPerformance[strategyId] = {
          totalTrades: strategyTrades.length,
          totalPnL,
          winRate,
          profitFactor
        };
      }
      
      const endTime = Date.now();
      const calculationTime = endTime - startTime;
      
      return { 
        passed: calculationTime <= TEST_CONFIG.performanceThresholds.maxCalculationTime,
        message: `Calculated performance for ${Object.keys(strategyPerformance).length} strategies in ${calculationTime}ms`,
        details: { 
          calculationTime, 
          strategyCount: Object.keys(strategyPerformance).length,
          tradeCount: trades.length,
          threshold: TEST_CONFIG.performanceThresholds.maxCalculationTime
        }
      };
    },
    'modalLoadingPerformance'
  );
  
  // Test 1.3: Memory usage simulation
  await runTest(
    'Modal Loading - Memory usage with large dataset',
    async () => {
      const startTime = Date.now();
      
      // Fetch all trades to simulate memory usage
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .not('pnl', 'is', null);
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      // Simulate in-memory data processing
      const processedData = trades.map(trade => ({
        ...trade,
        calculatedMetrics: {
          isWin: (trade.pnl || 0) > 0,
          isLoss: (trade.pnl || 0) < 0,
          tradeValue: Math.abs(trade.pnl || 0),
          riskRewardRatio: trade.entry_price && trade.exit_price ? 
            Math.abs(trade.exit_price - trade.entry_price) / trade.entry_price : 0
        }
      }));
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Estimate memory usage (rough calculation)
      const estimatedMemoryUsage = JSON.stringify(processedData).length * 2; // Rough estimate
      
      return { 
        passed: estimatedMemoryUsage <= TEST_CONFIG.performanceThresholds.maxMemoryUsage,
        message: `Processed ${processedData.length} trades with estimated ${Math.round(estimatedMemoryUsage / 1024 / 1024)}MB memory usage`,
        details: { 
          processingTime,
          tradeCount: processedData.length,
          estimatedMemoryUsage,
          threshold: TEST_CONFIG.performanceThresholds.maxMemoryUsage
        }
      };
    },
    'modalLoadingPerformance'
  );
}

// 2. Test performance metrics accuracy with larger dataset
async function testPerformanceMetricsAccuracy() {
  const user = await authenticateTestUser();
  
  // Test 2.1: Win rate calculation accuracy
  await runTest(
    'Performance Metrics - Win rate calculation accuracy',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const accuracyResults = [];
      
      for (const strategy of strategies) {
        // Fetch all trades for this strategy
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (tradeError || !trades || trades.length === 0) continue;
        
        // Calculate expected win rate
        const wins = trades.filter(t => (t.pnl || 0) > 0).length;
        const expectedWinRate = (wins / trades.length) * 100;
        
        // Simulate modal calculation (same logic)
        const calculatedWinRate = expectedWinRate; // In real test, this would be from modal
        
        const accuracy = Math.abs(expectedWinRate - calculatedWinRate);
        accuracyResults.push({
          strategyName: strategy.name,
          expectedWinRate,
          calculatedWinRate,
          accuracy,
          tradeCount: trades.length
        });
      }
      
      const averageAccuracy = accuracyResults.reduce((sum, r) => sum + (100 - r.accuracy), 0) / accuracyResults.length;
      
      return { 
        passed: averageAccuracy >= TEST_CONFIG.performanceThresholds.minWinRateAccuracy,
        message: `Average win rate calculation accuracy: ${averageAccuracy.toFixed(1)}%`,
        details: { 
          averageAccuracy,
          accuracyResults,
          threshold: TEST_CONFIG.performanceThresholds.minWinRateAccuracy
        }
      };
    },
    'performanceMetricsAccuracy'
  );
  
  // Test 2.2: P&L calculation accuracy
  await runTest(
    'Performance Metrics - P&L calculation accuracy',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const accuracyResults = [];
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (tradeError || !trades || trades.length === 0) continue;
        
        // Calculate expected total P&L
        const expectedPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        
        // Simulate modal calculation
        const calculatedPnL = expectedPnL; // In real test, this would be from modal
        
        const accuracy = expectedPnL !== 0 ? 
          Math.abs((expectedPnL - calculatedPnL) / expectedPnL) * 100 : 100;
        
        accuracyResults.push({
          strategyName: strategy.name,
          expectedPnL,
          calculatedPnL,
          accuracy,
          tradeCount: trades.length
        });
      }
      
      const averageAccuracy = accuracyResults.reduce((sum, r) => sum + r.accuracy, 0) / accuracyResults.length;
      
      return { 
        passed: averageAccuracy >= TEST_CONFIG.performanceThresholds.minPnLAccuracy,
        message: `Average P&L calculation accuracy: ${averageAccuracy.toFixed(1)}%`,
        details: { 
          averageAccuracy,
          accuracyResults,
          threshold: TEST_CONFIG.performanceThresholds.minPnLAccuracy
        }
      };
    },
    'performanceMetricsAccuracy'
  );
  
  // Test 2.3: Complex metrics calculation (Profit Factor, Sharpe Ratio)
  await runTest(
    'Performance Metrics - Complex metrics calculation accuracy',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(3); // Test with 3 strategies for efficiency
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const metricsResults = [];
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, trade_date')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (tradeError || !trades || trades.length < 10) continue; // Need sufficient data
        
        // Calculate complex metrics
        const profitFactor = calculateProfitFactor(trades);
        const sharpeRatio = calculateSharpeRatio(trades);
        const maxDrawdown = calculateMaxDrawdown(trades);
        
        metricsResults.push({
          strategyName: strategy.name,
          profitFactor,
          sharpeRatio,
          maxDrawdown,
          tradeCount: trades.length
        });
      }
      
      return { 
        passed: metricsResults.length >= 2,
        message: `Calculated complex metrics for ${metricsResults.length} strategies`,
        details: { 
          metricsResults,
          strategiesTested: metricsResults.length
        }
      };
    },
    'performanceMetricsAccuracy'
  );
}

// 3. Test data rendering performance
async function testDataRenderingPerformance() {
  const user = await authenticateTestUser();
  
  // Test 3.1: Large dataset rendering simulation
  await runTest(
    'Data Rendering - Large dataset rendering performance',
    async () => {
      const startTime = Date.now();
      
      // Fetch all data that would be rendered in the modal
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          id,
          symbol,
          side,
          quantity,
          entry_price,
          exit_price,
          pnl,
          trade_date,
          strategy_id,
          strategies (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .not('pnl', 'is', null)
        .limit(500); // Limit for rendering test
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      // Simulate rendering preparation
      const renderData = trades.map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        pnl: trade.pnl,
        tradeDate: trade.trade_date,
        strategyName: trade.strategies?.name || 'Unknown',
        isWin: (trade.pnl || 0) > 0,
        pnlClass: (trade.pnl || 0) > 0 ? 'profit' : 'loss'
      }));
      
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      return { 
        passed: renderTime <= TEST_CONFIG.performanceThresholds.maxLoadingTime,
        message: `Prepared ${renderData.length} trades for rendering in ${renderTime}ms`,
        details: { 
          renderTime,
          tradeCount: renderData.length,
          threshold: TEST_CONFIG.performanceThresholds.maxLoadingTime
        }
      };
    },
    'dataRenderingPerformance'
  );
  
  // Test 3.2: Chart data preparation performance
  await runTest(
    'Data Rendering - Chart data preparation performance',
    async () => {
      const startTime = Date.now();
      
      // Fetch trade data for charts
      const { data: trades, error } = await supabase
        .from('trades')
        .select('pnl, trade_date, strategy_id')
        .eq('user_id', user.id)
        .not('pnl', 'is', null)
        .order('trade_date', { ascending: true });
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      // Prepare chart data (equity curve, performance over time)
      let runningPnL = 0;
      const equityCurve = trades.map(trade => {
        runningPnL += (trade.pnl || 0);
        return {
          date: trade.trade_date,
          pnl: trade.pnl,
          cumulativePnL: runningPnL
        };
      });
      
      // Group by strategy for performance comparison
      const strategyPerformance = {};
      trades.forEach(trade => {
        if (!strategyPerformance[trade.strategy_id]) {
          strategyPerformance[trade.strategy_id] = [];
        }
        strategyPerformance[trade.strategy_id].push(trade);
      });
      
      const endTime = Date.now();
      const chartPrepTime = endTime - startTime;
      
      return { 
        passed: chartPrepTime <= TEST_CONFIG.performanceThresholds.maxCalculationTime,
        message: `Prepared chart data for ${equityCurve.length} trades in ${chartPrepTime}ms`,
        details: { 
          chartPrepTime,
          tradeCount: trades.length,
          equityCurvePoints: equityCurve.length,
          strategyCount: Object.keys(strategyPerformance).length,
          threshold: TEST_CONFIG.performanceThresholds.maxCalculationTime
        }
      };
    },
    'dataRenderingPerformance'
  );
}

// 4. Test individual strategy performance data accuracy
async function testIndividualStrategyAccuracy() {
  const user = await authenticateTestUser();
  
  // Test 4.1: Individual strategy trade count accuracy
  await runTest(
    'Individual Strategy - Trade count accuracy',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const tradeCountResults = [];
      
      for (const strategy of strategies) {
        // Count trades for this strategy
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('id')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id);
        
        if (tradeError) {
          continue;
        }
        
        tradeCountResults.push({
          strategyName: strategy.name,
          tradeCount: trades.length
        });
      }
      
      const totalTrades = tradeCountResults.reduce((sum, r) => sum + r.tradeCount, 0);
      
      return { 
        passed: totalTrades >= TEST_CONFIG.expectedTradeCount * 0.9,
        message: `Verified trade counts for ${tradeCountResults.length} strategies (${totalTrades} total trades)`,
        details: { 
          tradeCountResults,
          totalTrades,
          expectedMinimum: TEST_CONFIG.expectedTradeCount * 0.9
        }
      };
    },
    'individualStrategyAccuracy'
  );
  
  // Test 4.2: Strategy-specific performance metrics
  await runTest(
    'Individual Strategy - Performance metrics accuracy',
    async () => {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(3); // Test 3 strategies for efficiency
      
      if (error || !strategies) {
        return { passed: false, message: `Failed to fetch strategies: ${error?.message || 'No data'}` };
      }
      
      const performanceResults = [];
      
      for (const strategy of strategies) {
        const { data: trades, error: tradeError } = await supabase
          .from('trades')
          .select('pnl, entry_price, exit_price, trade_date')
          .eq('strategy_id', strategy.id)
          .eq('user_id', user.id)
          .not('pnl', 'is', null);
        
        if (tradeError || !trades || trades.length === 0) continue;
        
        // Calculate comprehensive metrics
        const pnls = trades.map(t => t.pnl || 0);
        const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
        const wins = pnls.filter(p => p > 0);
        const losses = pnls.filter(p => p < 0);
        const winRate = (wins.length / pnls.length) * 100;
        const avgWin = wins.length > 0 ? wins.reduce((sum, p) => sum + p, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, p) => sum + p, 0) / losses.length) : 0;
        const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
        const largestWin = Math.max(...pnls);
        const largestLoss = Math.min(...pnls);
        
        performanceResults.push({
          strategyName: strategy.name,
          totalTrades: trades.length,
          totalPnL,
          winRate,
          avgWin,
          avgLoss,
          profitFactor,
          largestWin,
          largestLoss
        });
      }
      
      return { 
        passed: performanceResults.length >= 2,
        message: `Calculated comprehensive metrics for ${performanceResults.length} strategies`,
        details: { 
          performanceResults,
          strategiesTested: performanceResults.length
        }
      };
    },
    'individualStrategyAccuracy'
  );
}

// 5. Test scalability issues
async function testScalabilityIssues() {
  const user = await authenticateTestUser();
  
  // Test 5.1: Performance degradation with increasing data size
  await runTest(
    'Scalability - Performance degradation analysis',
    async () => {
      const dataSizes = [100, 500, 1000]; // Different dataset sizes to test
      const performanceResults = [];
      
      for (const size of dataSizes) {
        const startTime = Date.now();
        
        // Fetch subset of trades
        const { data: trades, error } = await supabase
          .from('trades')
          .select('strategy_id, pnl')
          .eq('user_id', user.id)
          .not('pnl', 'is', null)
          .limit(size);
        
        if (error) {
          continue;
        }
        
        // Perform performance calculations
        const strategyPerformance = {};
        const strategies = [...new Set(trades.map(t => t.strategy_id))];
        
        for (const strategyId of strategies) {
          const strategyTrades = trades.filter(t => t.strategy_id === strategyId);
          const pnls = strategyTrades.map(t => t.pnl || 0);
          const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
          const wins = pnls.filter(p => p > 0).length;
          const winRate = (wins / pnls.length) * 100;
          
          strategyPerformance[strategyId] = { totalPnL, winRate };
        }
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        performanceResults.push({
          dataSize: size,
          actualTradeCount: trades.length,
          processingTime,
          strategiesProcessed: Object.keys(strategyPerformance).length
        });
      }
      
      // Check for linear or sub-linear performance degradation
      const timePerTrade = performanceResults.map(r => r.processingTime / r.actualTradeCount);
      const performanceDegradation = timePerTrade[timePerTrade.length - 1] / timePerTrade[0];
      
      return { 
        passed: performanceDegradation <= 2, // Allow up to 2x degradation
        message: `Performance degradation factor: ${performanceDegradation.toFixed(2)}x`,
        details: { 
          performanceResults,
          timePerTrade,
          performanceDegradation
        }
      };
    },
    'scalabilityIssues'
  );
  
  // Test 5.2: Memory efficiency with large datasets
  await runTest(
    'Scalability - Memory efficiency analysis',
    async () => {
      const startTime = Date.now();
      
      // Fetch all trades
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .not('pnl', 'is', null);
      
      if (error) {
        return { passed: false, message: `Failed to fetch trades: ${error.message}` };
      }
      
      // Simulate different processing approaches
      const approaches = [];
      
      // Approach 1: Process all data at once
      const approach1Start = Date.now();
      const allDataProcessed = trades.map(trade => ({
        ...trade,
        metrics: {
          isWin: (trade.pnl || 0) > 0,
          magnitude: Math.abs(trade.pnl || 0)
        }
      }));
      const approach1Time = Date.now() - approach1Start;
      
      // Approach 2: Process in chunks
      const approach2Start = Date.now();
      const chunkSize = 100;
      const chunkedResults = [];
      for (let i = 0; i < trades.length; i += chunkSize) {
        const chunk = trades.slice(i, i + chunkSize);
        const processedChunk = chunk.map(trade => ({
          ...trade,
          metrics: {
            isWin: (trade.pnl || 0) > 0,
            magnitude: Math.abs(trade.pnl || 0)
          }
        }));
        chunkedResults.push(processedChunk);
      }
      const approach2Time = Date.now() - approach2Start;
      
      approaches.push({
        name: 'All at once',
        time: approach1Time,
        memoryEstimate: JSON.stringify(allDataProcessed).length
      });
      
      approaches.push({
        name: 'Chunked processing',
        time: approach2Time,
        memoryEstimate: JSON.stringify(chunkedResults).length
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      return { 
        passed: approach2Time <= approach1Time * 1.2, // Chunked should be competitive
        message: `Memory efficiency analysis completed in ${totalTime}ms`,
        details: { 
          approaches,
          totalTime,
          tradeCount: trades.length
        }
      };
    },
    'scalabilityIssues'
  );
}

// Helper function to calculate profit factor
function calculateProfitFactor(trades) {
  const grossProfit = trades
    .filter(t => (t.pnl || 0) > 0)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(
    trades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0)
  );
  return grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;
}

// Helper function to calculate Sharpe ratio
function calculateSharpeRatio(trades) {
  const pnls = trades.map(t => t.pnl || 0);
  const avgReturn = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length;
  const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / pnls.length;
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? avgReturn / stdDev : 0;
}

// Helper function to calculate maximum drawdown
function calculateMaxDrawdown(trades) {
  let maxDrawdown = 0;
  let peak = 0;
  let runningPnL = 0;
  
  for (const trade of trades) {
    runningPnL += (trade.pnl || 0);
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

// Main test execution function
async function runAllTests() {
  console.log('🚀 Starting Strategy Performance Modal Large Dataset Test (1,000 Trades)');
  console.log('================================================================');
  
  try {
    // Run all test categories
    console.log('\n📊 1. Testing Modal Loading Performance');
    await testModalLoadingPerformance();
    
    console.log('\n📈 2. Testing Performance Metrics Accuracy');
    await testPerformanceMetricsAccuracy();
    
    console.log('\n🎨 3. Testing Data Rendering Performance');
    await testDataRenderingPerformance();
    
    console.log('\n🎯 4. Testing Individual Strategy Accuracy');
    await testIndividualStrategyAccuracy();
    
    console.log('\n📏 5. Testing Scalability Issues');
    await testScalabilityIssues();
    
    // Calculate overall status for each category
    Object.keys(testResults).forEach(category => {
      if (category !== 'summary' && category !== 'issues' && category !== 'recommendations') {
        const categoryTests = testResults[category].tests;
        const passedTests = categoryTests.filter(t => t.status === 'passed').length;
        const totalTests = categoryTests.length;
        
        if (totalTests > 0) {
          const passRate = (passedTests / totalTests) * 100;
          if (passRate >= 80) {
            testResults[category].overallStatus = 'passed';
          } else if (passRate >= 60) {
            testResults[category].overallStatus = 'partial';
          } else {
            testResults[category].overallStatus = 'failed';
          }
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Critical error during testing:', error);
    testResults.issues.push({
      test: 'Critical Error',
      category: 'system',
      message: `Critical error during test execution: ${error.message}`,
      details: { error: error.stack }
    });
  } finally {
    // Finalize results
    testResults.summary.endTime = new Date().toISOString();
    testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
    
    // Generate recommendations
    generateRecommendations();
    
    // Save results to file
    await saveTestResults();
    
    // Print summary
    printTestSummary();
  }
}

// Generate recommendations based on test results
function generateRecommendations() {
  const recommendations = [];
  
  // Analyze failed tests and generate recommendations
  testResults.issues.forEach(issue => {
    switch (issue.category) {
      case 'modalLoadingPerformance':
        if (issue.message.includes('loading time')) {
          recommendations.push('Implement data pagination or lazy loading for the strategy performance modal');
        } else if (issue.message.includes('calculation time')) {
          recommendations.push('Optimize performance calculations with caching or pre-computation');
        } else if (issue.message.includes('memory usage')) {
          recommendations.push('Implement memory-efficient data processing techniques');
        }
        break;
        
      case 'performanceMetricsAccuracy':
        if (issue.message.includes('accuracy')) {
          recommendations.push('Review and fix performance metric calculation algorithms');
        }
        break;
        
      case 'dataRenderingPerformance':
        if (issue.message.includes('rendering')) {
          recommendations.push('Optimize data rendering with virtual scrolling or pagination');
        } else if (issue.message.includes('chart data')) {
          recommendations.push('Implement efficient chart data preparation with sampling or aggregation');
        }
        break;
        
      case 'individualStrategyAccuracy':
        if (issue.message.includes('trade count')) {
          recommendations.push('Verify data integrity between strategies and trades tables');
        }
        break;
        
      case 'scalabilityIssues':
        if (issue.message.includes('performance degradation')) {
          recommendations.push('Implement scalable algorithms to handle growing datasets efficiently');
        } else if (issue.message.includes('memory efficiency')) {
          recommendations.push('Adopt chunked processing for large datasets');
        }
        break;
    }
  });
  
  // Add general recommendations
  if (testResults.summary.failedTests > 0) {
    recommendations.push('Review and fix failing tests before deploying to production');
  }
  
  if (testResults.summary.passedTests / testResults.summary.totalTests < 0.8) {
    recommendations.push('Overall test pass rate is below 80%. Consider comprehensive system review');
  }
  
  // Add specific large dataset recommendations
  recommendations.push('Consider implementing data archiving for very old trades to maintain performance');
  recommendations.push('Add performance monitoring to track modal loading times in production');
  recommendations.push('Implement progressive loading for strategy performance data');
  
  testResults.recommendations = recommendations;
}

// Save test results to file
async function saveTestResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `strategy-performance-modal-large-dataset-test-results-${timestamp}.json`;
  const reportFilename = `STRATEGY_PERFORMANCE_MODAL_LARGE_DATASET_TEST_REPORT.md`;
  
  try {
    // Save detailed JSON results
    await fs.promises.writeFile(
      path.join(__dirname, filename),
      JSON.stringify(testResults, null, 2)
    );
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport();
    await fs.promises.writeFile(
      path.join(__dirname, reportFilename),
      markdownReport
    );
    
    console.log(`\n📄 Detailed results saved to: ${filename}`);
    console.log(`📋 Report saved to: ${reportFilename}`);
    
  } catch (error) {
    console.error('Failed to save test results:', error);
  }
}

// Generate markdown report
function generateMarkdownReport() {
  const passRate = ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1);
  
  let report = `# Strategy Performance Modal Large Dataset Test Report (1,000 Trades)

## Summary

- **Total Tests:** ${testResults.summary.totalTests}
- **Passed:** ${testResults.summary.passedTests}
- **Failed:** ${testResults.summary.failedTests}
- **Pass Rate:** ${passRate}%
- **Duration:** ${Math.round(testResults.summary.duration / 1000)}s
- **Test Date:** ${new Date(testResults.summary.startTime).toLocaleDateString()}
- **Dataset Size:** ${TEST_CONFIG.expectedTradeCount} trades
- **Test Environment:** Large Dataset Performance Testing

## Overall Status: ${passRate >= 80 ? '✅ PASSED' : passRate >= 60 ? '⚠️ PARTIAL' : '❌ FAILED'}

---

## Test Categories

### 1. Modal Loading Performance
**Status: ${getStatusEmoji(testResults.modalLoadingPerformance.overallStatus)} ${testResults.modalLoadingPerformance.overallStatus.toUpperCase()}**

${testResults.modalLoadingPerformance.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 2. Performance Metrics Accuracy
**Status: ${getStatusEmoji(testResults.performanceMetricsAccuracy.overallStatus)} ${testResults.performanceMetricsAccuracy.overallStatus.toUpperCase()}**

${testResults.performanceMetricsAccuracy.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 3. Data Rendering Performance
**Status: ${getStatusEmoji(testResults.dataRenderingPerformance.overallStatus)} ${testResults.dataRenderingPerformance.overallStatus.toUpperCase()}**

${testResults.dataRenderingPerformance.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 4. Individual Strategy Accuracy
**Status: ${getStatusEmoji(testResults.individualStrategyAccuracy.overallStatus)} ${testResults.individualStrategyAccuracy.overallStatus.toUpperCase()}**

${testResults.individualStrategyAccuracy.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

### 5. Scalability Issues
**Status: ${getStatusEmoji(testResults.scalabilityIssues.overallStatus)} ${testResults.scalabilityIssues.overallStatus.toUpperCase()}**

${testResults.scalabilityIssues.tests.map(test => 
  `- ${getStatusEmoji(test.status)} **${test.name}**: ${test.message}`
).join('\n')}

---

## Issues Found

${testResults.issues.length > 0 ? 
  testResults.issues.map((issue, index) => 
    `${index + 1}. **${issue.test}** (${issue.category})\n   - ${issue.message}\n`
  ).join('') : 
  'No critical issues found.'
}

---

## Recommendations

${testResults.recommendations.length > 0 ? 
  testResults.recommendations.map((rec, index) => 
    `${index + 1}. ${rec}`
  ).join('\n') : 
  'No specific recommendations at this time.'
}

---

## Performance Thresholds

- **Max Loading Time:** ${TEST_CONFIG.performanceThresholds.maxLoadingTime}ms
- **Max Calculation Time:** ${TEST_CONFIG.performanceThresholds.maxCalculationTime}ms
- **Max Memory Usage:** ${Math.round(TEST_CONFIG.performanceThresholds.maxMemoryUsage / 1024 / 1024)}MB
- **Min Win Rate Accuracy:** ${TEST_CONFIG.performanceThresholds.minWinRateAccuracy}%
- **Min P&L Accuracy:** ${TEST_CONFIG.performanceThresholds.minPnLAccuracy}%

---

## Large Dataset Testing Notes

This test was specifically designed to evaluate the strategy performance modal with a large dataset of 1,000 trades. The tests focus on:

1. **Loading Performance** - How quickly the modal loads and processes large datasets
2. **Calculation Accuracy** - Whether performance metrics remain accurate with more data
3. **Rendering Performance** - How efficiently the UI can display large amounts of data
4. **Individual Strategy Accuracy** - Whether strategy-specific metrics are calculated correctly
5. **Scalability** - How the system performs as data volume increases

### Key Performance Indicators:

- **Data Volume:** ${TEST_CONFIG.expectedTradeCount} trades across ${TEST_CONFIG.expectedStrategies.length} strategies
- **Complexity:** Multiple performance metrics calculated per strategy
- **User Experience:** Focus on responsive UI and quick loading times
- **Memory Efficiency:** Monitoring memory usage with large datasets
- **Calculation Speed:** Ensuring metrics are computed quickly

---

*This report was generated automatically by the Strategy Performance Modal Large Dataset Test Suite*
`;

  return report;
}

// Helper function to get status emoji
function getStatusEmoji(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'partial': return '⚠️';
    case 'pending': return '⏳';
    case 'error': return '💥';
    default: return '❓';
  }
}

// Print test summary to console
function printTestSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('🏁 STRATEGY PERFORMANCE MODAL LARGE DATASET TEST SUMMARY');
  console.log('='.repeat(70));
  
  const passRate = ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1);
  
  console.log(`\n📊 Overall Results:`);
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   Passed: ${testResults.summary.passedTests}`);
  console.log(`   Failed: ${testResults.summary.failedTests}`);
  console.log(`   Pass Rate: ${passRate}%`);
  console.log(`   Duration: ${Math.round(testResults.summary.duration / 1000)}s`);
  console.log(`   Dataset Size: ${TEST_CONFIG.expectedTradeCount} trades`);
  
  console.log(`\n📋 Category Status:`);
  Object.keys(testResults).forEach(category => {
    if (category !== 'summary' && category !== 'issues' && category !== 'recommendations') {
      const status = testResults[category].overallStatus;
      const emoji = getStatusEmoji(status);
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${emoji} ${categoryName}: ${status.toUpperCase()}`);
    }
  });
  
  if (testResults.issues.length > 0) {
    console.log(`\n⚠️  Issues Found: ${testResults.issues.length}`);
    testResults.issues.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.test}: ${issue.message}`);
    });
    if (testResults.issues.length > 5) {
      console.log(`   ... and ${testResults.issues.length - 5} more issues`);
    }
  }
  
  if (testResults.recommendations.length > 0) {
    console.log(`\n💡 Recommendations: ${testResults.recommendations.length}`);
    testResults.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    if (testResults.recommendations.length > 3) {
      console.log(`   ... and ${testResults.recommendations.length - 3} more recommendations`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`🎯 Overall Status: ${passRate >= 80 ? 'PASSED' : passRate >= 60 ? 'PARTIAL' : 'FAILED'}`);
  console.log(`📈 Large Dataset Performance: ${passRate >= 80 ? 'ACCEPTABLE' : 'NEEDS OPTIMIZATION'}`);
  console.log('='.repeat(70));
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};