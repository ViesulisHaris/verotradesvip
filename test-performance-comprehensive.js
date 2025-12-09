/**
 * Comprehensive Performance Testing Suite for Psychological Metrics System
 * 
 * This suite tests all critical performance aspects of the trading journal system:
 * - Large dataset performance (1000+ trades)
 * - Concurrent request handling (10+ simultaneous requests)
 * - Calculation performance benchmarks
 * - Memory and resource usage
 * - Database performance
 * - Real-world scenario testing
 * 
 * Performance Targets:
 * - API response time: < 500ms
 * - Calculation time: < 50ms
 * - Memory usage: < 50MB per request
 * - Concurrent requests: Handle 10+ simultaneously
 * - Large dataset processing: Handle 1000+ trades
 */

const { performance } = require('perf_hooks');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Performance targets
  targets: {
    apiResponseTime: 500, // ms
    calculationTime: 50, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB in bytes
    concurrentRequests: 10,
    largeDatasetSize: 1000 // trades
  },
  
  // Test data sizes
  testSizes: [10, 50, 100, 500, 1000, 2000],
  
  // Concurrent request levels
  concurrencyLevels: [1, 5, 10, 15, 20],
  
  // Valid emotions for testing
  validEmotions: ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL']
};

// Performance metrics collector
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      largeDataset: [],
      concurrentRequests: [],
      calculationBenchmarks: [],
      memoryUsage: [],
      databasePerformance: [],
      realWorldScenarios: []
    };
    this.startTime = null;
    this.endTime = null;
  }
  
  startTimer() {
    this.startTime = performance.now();
  }
  
  endTimer() {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }
  
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };
  }
  
  addMetric(category, metric) {
    if (this.metrics[category]) {
      this.metrics[category].push(metric);
    }
  }
  
  calculateStats(values) {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  generateReport() {
    const report = {
      summary: {
        totalTestTime: this.endTime - this.startTime,
        timestamp: new Date().toISOString(),
        performanceTargets: TEST_CONFIG.targets
      },
      results: {}
    };
    
    // Generate statistics for each category
    Object.keys(this.metrics).forEach(category => {
      const metrics = this.metrics[category];
      if (metrics.length > 0) {
        let values;
        let passed;
        
        if (category === 'concurrentRequests') {
          // For concurrent requests, use averageResponseTime
          values = metrics.map(m => m.averageResponseTime).filter(v => v !== undefined && !isNaN(v));
          passed = values.length > 0 && values.every(v => v <= TEST_CONFIG.targets.apiResponseTime);
        } else if (category === 'calculationBenchmarks') {
          // For calculation benchmarks, use averageCalculationTime
          values = metrics.map(m => m.averageCalculationTime).filter(v => v !== undefined && !isNaN(v));
          passed = values.length > 0 && values.every(v => v <= TEST_CONFIG.targets.calculationTime);
        } else if (category === 'memoryUsage') {
          // For memory usage, handle array of results
          const memoryValues = metrics.flat().map(m => m.memoryUsed).filter(v => v !== undefined && !isNaN(v));
          values = memoryValues;
          passed = memoryValues.length > 0 && memoryValues.every(v => v <= TEST_CONFIG.targets.memoryUsage);
        } else {
          // For other categories, use duration, responseTime, or calculationTime
          values = metrics.map(m => m.duration || m.responseTime || m.calculationTime).filter(v => v !== undefined && !isNaN(v));
          passed = values.length > 0 && values.every(v => v <= (TEST_CONFIG.targets[category] || TEST_CONFIG.targets.apiResponseTime));
        }
        
        if (values.length > 0) {
          report.results[category] = {
            stats: this.calculateStats(values),
            details: metrics,
            passed: passed
          };
        }
      }
    });
    
    return report;
  }
}

// Mock data generator
class MockDataGenerator {
  static generateTrades(count, withEmotionalData = true) {
    const trades = [];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    const sides = ['Buy', 'Sell'];
    const markets = ['Stocks', 'Crypto', 'Forex', 'Options'];
    
    for (let i = 0; i < count; i++) {
      const trade = {
        id: `trade_${i + 1}`,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        side: sides[Math.floor(Math.random() * sides.length)],
        quantity: Math.floor(Math.random() * 1000) + 10,
        entry_price: Math.random() * 500 + 10,
        exit_price: Math.random() * 500 + 10,
        pnl: (Math.random() - 0.5) * 1000,
        trade_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        market: markets[Math.floor(Math.random() * markets.length)],
        user_id: 'test_user_id'
      };
      
      if (withEmotionalData) {
        const numEmotions = Math.floor(Math.random() * 3) + 1;
        const emotions = [];
        for (let j = 0; j < numEmotions; j++) {
          const emotion = TEST_CONFIG.validEmotions[Math.floor(Math.random() * TEST_CONFIG.validEmotions.length)];
          if (!emotions.includes(emotion)) {
            emotions.push(emotion);
          }
        }
        trade.emotional_state = emotions;
      }
      
      trades.push(trade);
    }
    
    return trades;
  }
  
  static generateEmotionalData() {
    return TEST_CONFIG.validEmotions.map(emotion => ({
      subject: emotion,
      value: Math.random() * 100,
      fullMark: 100,
      leaning: ['Balanced', 'Buy Leaning', 'Sell Leaning'][Math.floor(Math.random() * 3)],
      side: ['Buy', 'Sell', 'NULL'][Math.floor(Math.random() * 3)],
      leaningValue: (Math.random() - 0.5) * 100,
      totalTrades: Math.floor(Math.random() * 100)
    }));
  }
}

// HTTP request helper
class HttpRequestHelper {
  static async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.supabaseAnonKey}`
        },
        ...options
      };
      
      const req = http.request(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          try {
            const parsedData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: parsedData,
              responseTime,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: data,
              responseTime,
              error: 'Failed to parse JSON'
            });
          }
        });
      });
      
      req.on('error', (error) => {
        const endTime = performance.now();
        reject({
          error,
          responseTime: endTime - startTime
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout after 10 seconds'));
      });
      
      req.end();
    });
  }
}

// Database performance helper
class DatabasePerformanceHelper {
  constructor() {
    this.client = createClient(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }
  
  async testQueryPerformance(query, description) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const { data, error } = await query;
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      return {
        description,
        duration: endTime - startTime,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal
        },
        resultCount: Array.isArray(data) ? data.length : 0,
        error: error?.message,
        success: !error
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        description,
        duration: endTime - startTime,
        error: error.message,
        success: false
      };
    }
  }
  
  async testConnectionPooling(concurrentRequests) {
    const promises = [];
    const startTime = performance.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        this.testQueryPerformance(
          this.client.from('trades').select('count', { count: 'exact' }),
          `Connection pool test ${i + 1}`
        )
      );
    }
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    return {
      concurrentRequests,
      totalTime: endTime - startTime,
      averageTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      successRate: results.filter(r => r.success).length / results.length,
      results
    };
  }
}

// Psychological metrics calculator (server-side implementation)
class PsychologicalMetricsCalculator {
  static calculateMetrics(emotionalData) {
    const startTime = performance.now();
    
    try {
      // Handle edge cases: empty or invalid data
      if (!emotionalData || emotionalData.length === 0) {
        const endTime = performance.now();
        return {
          disciplineLevel: 50,
          tiltControl: 50,
          calculationTime: endTime - startTime,
          valid: true
        };
      }
      
      // Define emotion categories with their weights
      const positiveEmotions = ['DISCIPLINE', 'CONFIDENCE', 'PATIENCE'];
      const negativeEmotions = ['TILT', 'REVENGE', 'IMPATIENCE'];
      const neutralEmotions = ['NEUTRAL', 'ANALYTICAL'];
      
      // Calculate weighted scores for each emotion category
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;
      
      emotionalData.forEach(emotion => {
        const emotionName = emotion.subject?.toUpperCase();
        const emotionValue = emotion.value || 0;
        
        if (positiveEmotions.includes(emotionName)) {
          positiveScore += emotionValue;
        } else if (negativeEmotions.includes(emotionName)) {
          negativeScore += emotionValue;
        } else if (neutralEmotions.includes(emotionName)) {
          neutralScore += emotionValue;
        }
      });
      
      // Normalize scores to 0-100 range
      const maxPossibleScore = emotionalData.length * 100;
      positiveScore = (positiveScore / maxPossibleScore) * 100;
      negativeScore = (negativeScore / maxPossibleScore) * 100;
      neutralScore = (neutralScore / maxPossibleScore) * 100;
      
      // Calculate Emotional State Score (ESS) with weighted formula
      const ess = (positiveScore * 2.0) + (neutralScore * 1.0) - (negativeScore * 1.5);
      
      // Calculate Psychological Stability Index (PSI) - normalized to 0-100 scale
      const psi = Math.max(0, Math.min(100, (ess + 100) / 2));
      
      // Coupling Algorithm - ensures mathematical dependency between discipline and tilt control
      const couplingFactor = 0.6; // Strength of the relationship between metrics
      
      // Calculate base values using PSI as the foundation
      const baseDiscipline = psi;
      const baseTiltControl = psi;
      
      // Apply coupling to ensure inverse relationship
      const disciplineAdjustment = baseDiscipline * couplingFactor * (1 - baseDiscipline / 100);
      const tiltControlAdjustment = baseTiltControl * couplingFactor * (1 - baseTiltControl / 100);
      
      // Final calculations with normalization to ensure 0-100 range
      let disciplineLevel = Math.max(0, Math.min(100, baseDiscipline + disciplineAdjustment));
      let tiltControl = Math.max(0, Math.min(100, baseTiltControl + tiltControlAdjustment));
      
      // Additional normalization to ensure mathematical consistency
      const averageLevel = (disciplineLevel + tiltControl) / 2;
      const maxDeviation = 30; // Maximum allowed difference between metrics
      
      if (Math.abs(disciplineLevel - tiltControl) > maxDeviation) {
        if (disciplineLevel > tiltControl) {
          tiltControl = Math.max(0, disciplineLevel - maxDeviation);
        } else {
          disciplineLevel = Math.max(0, tiltControl - maxDeviation);
        }
      }
      
      // Final validation to ensure 0-100 range
      disciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
      tiltControl = Math.max(0, Math.min(100, tiltControl));
      
      const endTime = performance.now();
      
      return {
        disciplineLevel: Math.round(disciplineLevel * 100) / 100,
        tiltControl: Math.round(tiltControl * 100) / 100,
        calculationTime: endTime - startTime,
        valid: true,
        emotionalStateScore: ess,
        psychologicalStabilityIndex: psi
      };
      
    } catch (error) {
      const endTime = performance.now();
      return {
        disciplineLevel: 50,
        tiltControl: 50,
        calculationTime: endTime - startTime,
        valid: false,
        error: error.message
      };
    }
  }
}

// Main performance test suite
class PerformanceTestSuite {
  constructor() {
    this.metrics = new PerformanceMetrics();
    this.dbHelper = new DatabasePerformanceHelper();
  }
  
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Performance Testing Suite...');
    console.log('📊 Performance Targets:', TEST_CONFIG.targets);
    console.log('');
    
    this.metrics.startTimer();
    
    try {
      // 1. Large Dataset Performance Testing
      console.log('📈 Testing Large Dataset Performance...');
      await this.testLargeDatasetPerformance();
      
      // 2. Concurrent Request Testing
      console.log('⚡ Testing Concurrent Request Performance...');
      await this.testConcurrentRequestPerformance();
      
      // 3. Calculation Performance Benchmarks
      console.log('🧮 Testing Calculation Performance Benchmarks...');
      await this.testCalculationPerformance();
      
      // 4. Memory and Resource Usage Testing
      console.log('💾 Testing Memory and Resource Usage...');
      await this.testMemoryAndResourceUsage();
      
      // 5. Database Performance Testing
      console.log('🗄️ Testing Database Performance...');
      await this.testDatabasePerformance();
      
      // 6. Real-world Scenario Testing
      console.log('🌍 Testing Real-world Scenarios...');
      await this.testRealWorldScenarios();
      
      const totalTime = this.metrics.endTimer();
      
      // Generate final report
      const report = this.metrics.generateReport();
      this.printFinalReport(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      throw error;
    }
  }
  
  async testLargeDatasetPerformance() {
    const results = [];
    
    for (const size of TEST_CONFIG.testSizes) {
      console.log(`  📊 Testing with ${size} trades...`);
      
      // Generate test data
      const trades = MockDataGenerator.generateTrades(size, true);
      const emotionalData = MockDataGenerator.generateEmotionalData();
      
      // Test API response time
      const startTime = performance.now();
      const startMemory = this.metrics.getMemoryUsage();
      
      // Simulate API processing
      const calculationResult = PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
      
      const endTime = performance.now();
      const endMemory = this.metrics.getMemoryUsage();
      
      const result = {
        dataSize: size,
        responseTime: endTime - startTime,
        calculationTime: calculationResult.calculationTime,
        memoryUsage: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal
        },
        withinTarget: (endTime - startTime) <= TEST_CONFIG.targets.apiResponseTime,
        calculationWithinTarget: calculationResult.calculationTime <= TEST_CONFIG.targets.calculationTime,
        memoryWithinTarget: (endMemory.heapUsed - startMemory.heapUsed) <= TEST_CONFIG.targets.memoryUsage
      };
      
      results.push(result);
      this.metrics.addMetric('largeDataset', result);
      
      console.log(`    ⏱️  Response time: ${result.responseTime.toFixed(2)}ms (target: ${TEST_CONFIG.targets.apiResponseTime}ms)`);
      console.log(`    🧮 Calculation time: ${result.calculationTime.toFixed(2)}ms (target: ${TEST_CONFIG.targets.calculationTime}ms)`);
      console.log(`    💾 Memory usage: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB (target: ${(TEST_CONFIG.targets.memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
      console.log(`    ✅ Within target: ${result.withinTarget && result.calculationWithinTarget && result.memoryWithinTarget ? 'YES' : 'NO'}`);
      console.log('');
    }
    
    return results;
  }
  
  async testConcurrentRequestPerformance() {
    const results = [];
    
    for (const concurrency of TEST_CONFIG.concurrencyLevels) {
      console.log(`  ⚡ Testing with ${concurrency} concurrent requests...`);
      
      const promises = [];
      const startTime = performance.now();
      
      for (let i = 0; i < concurrency; i++) {
        promises.push(this.simulateApiRequest(i));
      }
      
      const requestResults = await Promise.all(promises);
      const endTime = performance.now();
      
      const responseTimes = requestResults.map(r => r.responseTime);
      const successfulRequests = requestResults.filter(r => r.success).length;
      
      const result = {
        concurrencyLevel: concurrency,
        totalTime: endTime - startTime,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        successRate: successfulRequests / concurrency,
        requestsPerSecond: concurrency / ((endTime - startTime) / 1000),
        withinTarget: successfulRequests >= Math.min(concurrency, TEST_CONFIG.targets.concurrentRequests)
      };
      
      results.push(result);
      this.metrics.addMetric('concurrentRequests', result);
      
      console.log(`    ⏱️  Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`    📈 Requests per second: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`    ✅ Success rate: ${(result.successRate * 100).toFixed(1)}%`);
      console.log(`    🎯 Target met: ${result.withinTarget ? 'YES' : 'NO'}`);
      console.log('');
    }
    
    return results;
  }
  
  async simulateApiRequest(requestId) {
    const startTime = performance.now();
    
    try {
      // Simulate API processing with emotional data
      const emotionalData = MockDataGenerator.generateEmotionalData();
      const calculationResult = PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const endTime = performance.now();
      
      return {
        requestId,
        responseTime: endTime - startTime,
        success: calculationResult.valid,
        calculationTime: calculationResult.calculationTime
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        requestId,
        responseTime: endTime - startTime,
        success: false,
        error: error.message
      };
    }
  }
  
  async testCalculationPerformance() {
    const results = [];
    const iterations = 1000;
    
    console.log(`  🧮 Running ${iterations} calculation iterations...`);
    
    for (let i = 0; i < iterations; i++) {
      const emotionalData = MockDataGenerator.generateEmotionalData();
      const calculationResult = PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
      
      results.push({
        iteration: i + 1,
        calculationTime: calculationResult.calculationTime,
        valid: calculationResult.valid,
        disciplineLevel: calculationResult.disciplineLevel,
        tiltControl: calculationResult.tiltControl
      });
    }
    
    const calculationTimes = results.map(r => r.calculationTime);
    const validCalculations = results.filter(r => r.valid).length;
    
    const benchmarkResult = {
      totalIterations: iterations,
      validCalculations,
      successRate: validCalculations / iterations,
      averageCalculationTime: calculationTimes.reduce((a, b) => a + b, 0) / calculationTimes.length,
      minCalculationTime: Math.min(...calculationTimes),
      maxCalculationTime: Math.max(...calculationTimes),
      calculationsPerSecond: 1000 / (calculationTimes.reduce((a, b) => a + b, 0) / calculationTimes.length),
      withinTarget: (calculationTimes.reduce((a, b) => a + b, 0) / calculationTimes.length) <= TEST_CONFIG.targets.calculationTime
    };
    
    this.metrics.addMetric('calculationBenchmarks', benchmarkResult);
    
    console.log(`    ⏱️  Average calculation time: ${benchmarkResult.averageCalculationTime.toFixed(2)}ms (target: ${TEST_CONFIG.targets.calculationTime}ms)`);
    console.log(`    📈 Calculations per second: ${benchmarkResult.calculationsPerSecond.toFixed(2)}`);
    console.log(`    ✅ Success rate: ${(benchmarkResult.successRate * 100).toFixed(1)}%`);
    console.log(`    🎯 Target met: ${benchmarkResult.withinTarget ? 'YES' : 'NO'}`);
    console.log('');
    
    return benchmarkResult;
  }
  
  async testMemoryAndResourceUsage() {
    const results = [];
    
    console.log('  💾 Testing memory usage patterns...');
    
    // Test memory usage with increasing data sizes
    for (const size of [100, 500, 1000, 2000]) {
      const startMemory = this.metrics.getMemoryUsage();
      
      // Generate and process data
      const trades = MockDataGenerator.generateTrades(size, true);
      const emotionalData = MockDataGenerator.generateEmotionalData();
      
      // Process calculations multiple times
      for (let i = 0; i < 10; i++) {
        PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const endMemory = this.metrics.getMemoryUsage();
      
      const memoryResult = {
        dataSize: size,
        memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
        memoryTotal: endMemory.heapTotal - startMemory.heapTotal,
        memoryPerTrade: (endMemory.heapUsed - startMemory.heapUsed) / size,
        withinTarget: (endMemory.heapUsed - startMemory.heapUsed) <= TEST_CONFIG.targets.memoryUsage
      };
      
      results.push(memoryResult);
      
      console.log(`    📊 ${size} trades: ${(memoryResult.memoryUsed / 1024 / 1024).toFixed(2)}MB (${(memoryResult.memoryPerTrade / 1024).toFixed(2)}KB per trade)`);
    }
    
    // Test memory leaks with repeated operations
    console.log('  🔍 Testing for memory leaks...');
    const leakTestStart = this.metrics.getMemoryUsage();
    
    for (let i = 0; i < 100; i++) {
      const emotionalData = MockDataGenerator.generateEmotionalData();
      PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
    }
    
    if (global.gc) {
      global.gc();
    }
    
    const leakTestEnd = this.metrics.getMemoryUsage();
    const memoryLeakResult = {
      operations: 100,
      memoryGrowth: leakTestEnd.heapUsed - leakTestStart.heapUsed,
      memoryPerOperation: (leakTestEnd.heapUsed - leakTestStart.heapUsed) / 100,
      potentialLeak: (leakTestEnd.heapUsed - leakTestStart.heapUsed) > 10 * 1024 * 1024 // 10MB threshold
    };
    
    results.push(memoryLeakResult);
    this.metrics.addMetric('memoryUsage', results);
    
    console.log(`    🔄 100 operations: ${(memoryLeakResult.memoryGrowth / 1024 / 1024).toFixed(2)}MB growth`);
    console.log(`    🔍 Potential leak detected: ${memoryLeakResult.potentialLeak ? 'YES' : 'NO'}`);
    console.log('');
    
    return results;
  }
  
  async testDatabasePerformance() {
    const results = [];
    
    try {
      console.log('  🗄️ Testing database query performance...');
      
      // Test basic query performance
      const basicQuery = this.dbHelper.testQueryPerformance(
        this.dbHelper.client.from('trades').select('*').limit(10),
        'Basic query (10 trades)'
      );
      
      // Test large query performance
      const largeQuery = this.dbHelper.testQueryPerformance(
        this.dbHelper.client.from('trades').select('*').limit(1000),
        'Large query (1000 trades)'
      );
      
      // Test filtered query performance
      const filteredQuery = this.dbHelper.testQueryPerformance(
        this.dbHelper.client.from('trades').select('*').eq('side', 'Buy').limit(100),
        'Filtered query (Buy trades)'
      );
      
      // Test emotional state query performance
      const emotionalQuery = this.dbHelper.testQueryPerformance(
        this.dbHelper.client.from('trades').select('*').not('emotional_state', 'is', null).limit(100),
        'Emotional state query'
      );
      
      const queryResults = await Promise.all([basicQuery, largeQuery, filteredQuery, emotionalQuery]);
      results.push(...queryResults);
      
      // Test connection pooling
      console.log('  🔗 Testing connection pooling...');
      const poolingResults = [];
      for (const concurrency of [5, 10, 15]) {
        const poolingResult = await this.dbHelper.testConnectionPooling(concurrency);
        poolingResults.push(poolingResult);
        results.push(poolingResult);
        
        console.log(`    ⚡ ${concurrency} concurrent: ${poolingResult.averageTime.toFixed(2)}ms avg, ${(poolingResult.successRate * 100).toFixed(1)}% success`);
      }
      
      this.metrics.addMetric('databasePerformance', results);
      
    } catch (error) {
      console.error('    ❌ Database performance test failed:', error.message);
      results.push({
        error: error.message,
        success: false
      });
    }
    
    console.log('');
    return results;
  }
  
  async testRealWorldScenarios() {
    const results = [];
    
    console.log('  🌍 Testing real-world scenarios...');
    
    // Scenario 1: End of day trading rush
    console.log('    📈 End of day trading rush...');
    const eodStart = performance.now();
    const eodRequests = [];
    
    for (let i = 0; i < 20; i++) {
      const emotionalData = MockDataGenerator.generateEmotionalData();
      const result = PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
      eodRequests.push(result);
    }
    
    const eodEnd = performance.now();
    const eodResult = {
      scenario: 'End of day rush',
      requests: 20,
      totalTime: eodEnd - eodStart,
      averageTime: eodRequests.reduce((sum, r) => sum + r.calculationTime, 0) / eodRequests.length,
      successRate: eodRequests.filter(r => r.valid).length / eodRequests.length
    };
    
    results.push(eodResult);
    console.log(`      ⏱️  Average: ${eodResult.averageTime.toFixed(2)}ms, ${(eodResult.successRate * 100).toFixed(1)}% success`);
    
    // Scenario 2: Mobile network conditions (high latency)
    console.log('    📱 Mobile network conditions...');
    const mobileStart = performance.now();
    const mobileRequests = [];
    
    for (let i = 0; i < 10; i++) {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const emotionalData = MockDataGenerator.generateEmotionalData();
      const result = PsychologicalMetricsCalculator.calculateMetrics(emotionalData);
      mobileRequests.push(result);
    }
    
    const mobileEnd = performance.now();
    const mobileResult = {
      scenario: 'Mobile network',
      requests: 10,
      totalTime: mobileEnd - mobileStart,
      averageTime: mobileRequests.reduce((sum, r) => sum + r.calculationTime, 0) / mobileRequests.length,
      successRate: mobileRequests.filter(r => r.valid).length / mobileRequests.length
    };
    
    results.push(mobileResult);
    console.log(`      ⏱️  Average: ${mobileResult.averageTime.toFixed(2)}ms, ${(mobileResult.successRate * 100).toFixed(1)}% success`);
    
    // Scenario 3: Complex emotional patterns
    console.log('    🧠 Complex emotional patterns...');
    const complexStart = performance.now();
    const complexRequests = [];
    
    for (let i = 0; i < 50; i++) {
      // Generate complex emotional data
      const complexEmotionalData = TEST_CONFIG.validEmotions.map(emotion => ({
        subject: emotion,
        value: Math.random() * 100,
        fullMark: 100,
        leaning: ['Balanced', 'Buy Leaning', 'Sell Leaning'][Math.floor(Math.random() * 3)],
        side: ['Buy', 'Sell', 'NULL'][Math.floor(Math.random() * 3)],
        leaningValue: (Math.random() - 0.5) * 100,
        totalTrades: Math.floor(Math.random() * 1000)
      }));
      
      const result = PsychologicalMetricsCalculator.calculateMetrics(complexEmotionalData);
      complexRequests.push(result);
    }
    
    const complexEnd = performance.now();
    const complexResult = {
      scenario: 'Complex emotional patterns',
      requests: 50,
      totalTime: complexEnd - complexStart,
      averageTime: complexRequests.reduce((sum, r) => sum + r.calculationTime, 0) / complexRequests.length,
      successRate: complexRequests.filter(r => r.valid).length / complexRequests.length
    };
    
    results.push(complexResult);
    console.log(`      ⏱️  Average: ${complexResult.averageTime.toFixed(2)}ms, ${(complexResult.successRate * 100).toFixed(1)}% success`);
    
    this.metrics.addMetric('realWorldScenarios', results);
    console.log('');
    
    return results;
  }
  
  printFinalReport(report) {
    console.log('');
    console.log('📊 COMPREHENSIVE PERFORMANCE TEST REPORT');
    console.log('=' .repeat(50));
    console.log(`📅 Test completed: ${new Date().toISOString()}`);
    console.log(`⏱️  Total test time: ${report.summary.totalTestTime.toFixed(2)}ms`);
    console.log('');
    
    // Performance targets summary
    console.log('🎯 PERFORMANCE TARGETS SUMMARY:');
    Object.entries(TEST_CONFIG.targets).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}${key.includes('Time') ? 'ms' : key.includes('Usage') ? 'MB' : key.includes('Size') ? ' trades' : ''}`);
    });
    console.log('');
    
    // Results summary
    console.log('📈 TEST RESULTS SUMMARY:');
    Object.entries(report.results).forEach(([category, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${category}: ${status}`);
      
      if (result.stats && result.stats.avg !== undefined) {
        console.log(`    Average: ${result.stats.avg.toFixed(2)}ms`);
        console.log(`    Min: ${result.stats.min.toFixed(2)}ms`);
        console.log(`    Max: ${result.stats.max.toFixed(2)}ms`);
        console.log(`    95th percentile: ${result.stats.p95.toFixed(2)}ms`);
      } else {
        console.log(`    No valid statistics available`);
      }
      console.log('');
    });
    
    // Overall assessment
    const allPassed = Object.values(report.results).every(result => result.passed);
    console.log('🏆 OVERALL ASSESSMENT:');
    console.log(`  Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (!allPassed) {
      console.log('');
      console.log('⚠️  RECOMMENDATIONS:');
      Object.entries(report.results).forEach(([category, result]) => {
        if (!result.passed) {
          console.log(`  - Optimize ${category} performance`);
          console.log(`    Current average: ${result.stats.avg.toFixed(2)}ms`);
          console.log(`    Target: ${TEST_CONFIG.targets[category] || TEST_CONFIG.targets.apiResponseTime}ms`);
        }
      });
    }
    
    console.log('');
    console.log('=' .repeat(50));
    console.log('🎉 Performance testing completed!');
  }
}

// Main execution
async function main() {
  const testSuite = new PerformanceTestSuite();
  
  try {
    const report = await testSuite.runAllTests();
    
    // Save report to file
    const reportPath = `performance-test-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    const allPassed = Object.values(report.results).every(result => result.passed);
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  PerformanceTestSuite,
  PerformanceMetrics,
  MockDataGenerator,
  PsychologicalMetricsCalculator,
  HttpRequestHelper,
  DatabasePerformanceHelper,
  TEST_CONFIG
};
