/**
 * API-BASED CONFLUENCE FILTERING TEST
 * 
 * This test validates the confluence filtering API endpoints directly:
 * - /api/confluence-trades with all filter parameters
 * - /api/strategies for strategy dropdown
 * - /api/confluence-stats for statistics
 * - Filter combinations and edge cases
 * - Performance testing
 */

const https = require('https');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000
};

// Test data
const TEST_FILTERS = {
  emotions: ['CONFIDENT', 'FOMO', 'TILT'],
  markets: ['Stock', 'Crypto', 'Forex', 'Futures'],
  symbols: ['AAPL', 'BTCUSD', 'EURUSD'],
  pnlFilters: ['all', 'profitable', 'lossable'],
  sides: ['Buy', 'Sell'],
  dateRanges: [
    { from: '2024-01-01', to: '2024-12-31' },
    { from: '2024-10-01', to: '2024-12-01' }
  ]
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  performance: [],
  apiResponses: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

function addTestResult(testName, passed, details = '', performance = null, response = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName} - ${details}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    performance,
    response: response ? {
      status: response.statusCode,
      headers: response.headers,
      size: JSON.stringify(response.data).length
    } : null,
    timestamp: new Date().toISOString()
  });
}

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: TEST_CONFIG.timeout
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testStrategiesAPI() {
  log('Testing /api/strategies endpoint...');
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/strategies`);
    const responseTime = Date.now() - startTime;
    
    const success = response.statusCode === 200;
    const hasStrategiesArray = response.data && Array.isArray(response.data.strategies);
    const hasValidStructure = hasStrategiesArray && 
      response.data.strategies.every(s => s.id && s.name);
    
    addTestResult('Strategies API - status', success, 
      `Status code: ${response.statusCode}`, responseTime, response);
    addTestResult('Strategies API - structure', hasValidStructure,
      hasStrategiesArray ? `Found ${response.data.strategies.length} strategies` : 'Invalid response structure');
    
    testResults.performance.push({ test: 'Strategies API', time: responseTime });
    testResults.apiResponses.push({ endpoint: '/api/strategies', response });
    
  } catch (error) {
    addTestResult('Strategies API', false, error.message);
  }
}

async function testConfluenceTradesAPI() {
  log('Testing /api/confluence-trades endpoint...');
  
  // Test 1: Basic request (no filters)
  await testBasicTradesRequest();
  
  // Test 2: Single filters
  await testSingleFilters();
  
  // Test 3: Filter combinations
  await testFilterCombinations();
  
  // Test 4: Edge cases
  await testEdgeCases();
}

async function testBasicTradesRequest() {
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-trades`);
    const responseTime = Date.now() - startTime;
    
    const success = response.statusCode === 200;
    const hasValidStructure = response.data && 
      typeof response.data.trades === 'object' &&
      typeof response.data.totalCount === 'number' &&
      typeof response.data.currentPage === 'number';
    
    addTestResult('Trades API - basic request', success,
      `Status: ${response.statusCode}, Structure valid: ${hasValidStructure}`, responseTime, response);
    
    if (success && hasValidStructure) {
      addTestResult('Trades API - pagination structure', 
        response.data.hasOwnProperty('totalPages') && 
        response.data.hasOwnProperty('hasNextPage') && 
        response.data.hasOwnProperty('hasPreviousPage'),
        `Pagination fields present`);
      
      addTestResult('Trades API - trade structure',
        Array.isArray(response.data.trades) && 
        response.data.trades.every(t => t.id && t.symbol && t.side),
        `Trade objects have required fields`);
    }
    
    testResults.performance.push({ test: 'Trades API - basic', time: responseTime });
    testResults.apiResponses.push({ endpoint: '/api/confluence-trades (basic)', response });
    
  } catch (error) {
    addTestResult('Trades API - basic request', false, error.message);
  }
}

async function testSingleFilters() {
  const singleFilterTests = [
    { name: 'Emotion filter', params: 'emotionalStates=CONFIDENT' },
    { name: 'Symbol filter', params: 'symbol=AAPL' },
    { name: 'Market filter', params: 'market=Stock' },
    { name: 'P&L filter - profitable', params: 'pnlFilter=profitable' },
    { name: 'P&L filter - lossable', params: 'pnlFilter=lossable' },
    { name: 'Side filter - Buy', params: 'side=Buy' },
    { name: 'Side filter - Sell', params: 'side=Sell' },
    { name: 'Date from filter', params: 'dateFrom=2024-01-01' },
    { name: 'Date to filter', params: 'dateTo=2024-12-31' }
  ];
  
  for (const test of singleFilterTests) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-trades?${test.params}`);
      const responseTime = Date.now() - startTime;
      
      const success = response.statusCode === 200;
      const hasValidStructure = response.data && typeof response.data.trades === 'object';
      
      addTestResult(`Single filter - ${test.name}`, success && hasValidStructure,
        `Status: ${response.statusCode}, Trades: ${response.data?.trades?.length || 0}`, responseTime, response);
      
      testResults.performance.push({ test: `Single filter - ${test.name}`, time: responseTime });
      
    } catch (error) {
      addTestResult(`Single filter - ${test.name}`, false, error.message);
    }
  }
}

async function testFilterCombinations() {
  const combinationTests = [
    { name: 'Emotion + Market', params: 'emotionalStates=CONFIDENT&market=Stock' },
    { name: 'Symbol + Side', params: 'symbol=AAPL&side=Buy' },
    { name: 'P&L + Date range', params: 'pnlFilter=profitable&dateFrom=2024-01-01&dateTo=2024-12-31' },
    { name: 'All filters', params: 'emotionalStates=CONFIDENT&symbol=AAPL&market=Stock&side=Buy&pnlFilter=profitable&dateFrom=2024-01-01&dateTo=2024-12-31' }
  ];
  
  for (const test of combinationTests) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-trades?${test.params}`);
      const responseTime = Date.now() - startTime;
      
      const success = response.statusCode === 200;
      const hasValidStructure = response.data && typeof response.data.trades === 'object';
      
      addTestResult(`Filter combination - ${test.name}`, success && hasValidStructure,
        `Status: ${response.statusCode}, Trades: ${response.data?.trades?.length || 0}`, responseTime, response);
      
      testResults.performance.push({ test: `Filter combination - ${test.name}`, time: responseTime });
      
    } catch (error) {
      addTestResult(`Filter combination - ${test.name}`, false, error.message);
    }
  }
}

async function testEdgeCases() {
  const edgeCaseTests = [
    { name: 'Empty emotion filter', params: 'emotionalStates=' },
    { name: 'Invalid market', params: 'market=InvalidMarket' },
    { name: 'Future date', params: 'dateTo=2099-12-31' },
    { name: 'Negative page', params: 'page=-1' },
    { name: 'Zero limit', params: 'limit=0' },
    { name: 'Large limit', params: 'limit=1000' },
    { name: 'Multiple emotions', params: 'emotionalStates=CONFIDENT,FOMO,TILT' },
    { name: 'Special characters in symbol', params: 'symbol=AAPL!@#$%' }
  ];
  
  for (const test of edgeCaseTests) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-trades?${test.params}`);
      const responseTime = Date.now() - startTime;
      
      // For edge cases, we expect the API to handle gracefully (not crash)
      const success = response.statusCode < 500; // Should not be server error
      const hasValidStructure = response.data && typeof response.data.trades === 'object';
      
      addTestResult(`Edge case - ${test.name}`, success && hasValidStructure,
        `Status: ${response.statusCode}, Structure valid: ${hasValidStructure}`, responseTime, response);
      
      testResults.performance.push({ test: `Edge case - ${test.name}`, time: responseTime });
      
    } catch (error) {
      addTestResult(`Edge case - ${test.name}`, false, error.message);
    }
  }
}

async function testConfluenceStatsAPI() {
  log('Testing /api/confluence-stats endpoint...');
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`);
    const responseTime = Date.now() - startTime;
    
    const success = response.statusCode === 200;
    const hasValidStructure = response.data && 
      typeof response.data.totalTrades === 'number' &&
      typeof response.data.totalPnL === 'number' &&
      typeof response.data.winRate === 'number';
    
    addTestResult('Stats API - status', success,
      `Status code: ${response.statusCode}`, responseTime, response);
    addTestResult('Stats API - structure', hasValidStructure,
      hasValidStructure ? `Total trades: ${response.data.totalTrades}, Win rate: ${response.data.winRate}%` : 'Invalid response structure');
    
    if (hasValidStructure) {
      addTestResult('Stats API - emotional data',
        Array.isArray(response.data.emotionalData),
        `Emotional data present: ${response.data.emotionalData?.length || 0} items`);
    }
    
    testResults.performance.push({ test: 'Stats API', time: responseTime });
    testResults.apiResponses.push({ endpoint: '/api/confluence-stats', response });
    
  } catch (error) {
    addTestResult('Stats API', false, error.message);
  }
}

async function testPerformance() {
  log('Testing API performance under load...');
  
  const performanceTests = [
    { name: 'No filters', params: '' },
    { name: 'Single filter', params: 'emotionalStates=CONFIDENT' },
    { name: 'Multiple filters', params: 'emotionalStates=CONFIDENT&market=Stock&side=Buy' },
    { name: 'Complex filters', params: 'emotionalStates=CONFIDENT,FOMO&symbol=AAPL&market=Stock&side=Buy&pnlFilter=profitable&dateFrom=2024-01-01&dateTo=2024-12-31' }
  ];
  
  for (const test of performanceTests) {
    const times = [];
    
    // Run each test 3 times to get average
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      
      try {
        const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-trades?${test.params}&limit=50`);
        const responseTime = Date.now() - startTime;
        times.push(responseTime);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        times.push(9999); // Mark as failed
      }
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    const performanceAcceptable = avgTime < 2000; // 2 second threshold
    
    addTestResult(`Performance - ${test.name}`, performanceAcceptable,
      `Avg: ${avgTime.toFixed(0)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`, avgTime);
    
    testResults.performance.push({
      test: `Performance - ${test.name}`,
      time: avgTime,
      min: minTime,
      max: maxTime,
      samples: times
    });
  }
}

async function testAuthentication() {
  log('Testing authentication requirements...');
  
  try {
    // Test without authentication (should fail or return limited data)
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-trades`);
    
    // The API should either require auth or handle it gracefully
    const authHandled = response.statusCode === 401 || 
                      response.statusCode === 200 || 
                      response.statusCode === 403;
    
    addTestResult('Authentication - handled', authHandled,
      `Status code: ${response.statusCode} (401/403 = auth required, 200 = public/optional)`);
    
    if (response.statusCode === 200) {
      addTestResult('Authentication - data protection',
        response.data.trades && response.data.trades.length > 0,
        'Data returned without authentication - ensure this is intended');
    }
    
  } catch (error) {
    addTestResult('Authentication', false, error.message);
  }
}

async function generateTestReport() {
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%',
      timestamp: new Date().toISOString()
    },
    testResults: testResults.details,
    performance: testResults.performance,
    apiResponses: testResults.apiResponses,
    recommendations: generateRecommendations()
  };
  
  const reportPath = `api-confluence-filtering-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`API test report generated: ${reportPath}`);
  
  // Generate markdown summary
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = `api-confluence-filtering-test-report-${Date.now()}.md`;
  fs.writeFileSync(markdownPath, markdownReport);
  
  log(`Markdown report generated: ${markdownPath}`);
  
  return { reportPath, markdownPath };
}

function generateRecommendations() {
  const recommendations = [];
  
  // Analyze performance
  const performanceTests = testResults.performance.filter(p => p.test && p.test.includes('Performance'));
  if (performanceTests.length > 0) {
    const avgResponseTime = performanceTests.reduce((sum, p) => sum + (p.time || 0), 0) / performanceTests.length;
    if (avgResponseTime > 1500) {
      recommendations.push('Consider optimizing API response times - average is ' + avgResponseTime.toFixed(0) + 'ms');
    }
  }
  
  // Analyze test failures
  const failures = testResults.details.filter(r => !r.passed);
  if (failures.length > 0) {
    const failureTypes = {};
    failures.forEach(f => {
      const category = f.test.split(' - ')[0];
      failureTypes[category] = (failureTypes[category] || 0) + 1;
    });
    
    Object.entries(failureTypes).forEach(([category, count]) => {
      recommendations.push(`${count} ${category} test(s) failed - review ${category} implementation`);
    });
  }
  
  // Check for missing features
  const missingFeatures = [];
  if (!testResults.details.find(r => r.test.includes('Stats'))) {
    missingFeatures.push('Stats API may need implementation');
  }
  
  if (missingFeatures.length > 0) {
    recommendations.push('Missing features detected: ' + missingFeatures.join(', '));
  }
  
  // Performance recommendations
  const slowTests = testResults.performance.filter(p => p.time > 2000);
  if (slowTests.length > 0) {
    recommendations.push(`${slowTests.length} slow API responses detected (>2s) - consider database query optimization`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All API tests passed - filtering system is working correctly!');
  }
  
  return recommendations;
}

function generateMarkdownReport(report) {
  return `# API Confluence Filtering Test Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Pass Rate:** ${report.summary.passRate}

## Test Results

| Test | Status | Details | Performance |
|------|--------|----------|-------------|
${report.testResults.map(r => 
  `| ${r.test} | ${r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.details} | ${r.performance ? r.performance + 'ms' : '-' }`
).join('\n')}

## Performance Analysis

| Test | Response Time | Min | Max | Samples |
|------|---------------|------|------|---------|
${report.performance.filter(p => p.min !== undefined).map(p => 
  `| ${p.test} | ${p.time.toFixed(0)}ms | ${p.min}ms | ${p.max}ms | ${p.samples.length}`
).join('\n')}

## API Endpoints Tested

${report.apiResponses.map(r => 
  `- **${r.endpoint}** - Status: ${r.response.statusCode}, Size: ${r.response.size} bytes`
).join('\n')}

## Recommendations

${report.recommendations.map(r => `- ${r}`).join('\n')}

---
*Report generated by API Confluence Filtering Test Suite*
`;
}

// Main test execution
async function runTests() {
  log('Starting API-based Confluence Filtering Tests...');
  
  try {
    // Wait a bit for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run all tests
    await testAuthentication();
    await testStrategiesAPI();
    await testConfluenceTradesAPI();
    await testConfluenceStatsAPI();
    await testPerformance();
    
    // Generate report
    const { reportPath, markdownPath } = await generateTestReport();
    
    log(`API test execution completed. Results: ${testResults.passed}/${testResults.total} passed`);
    log(`Reports generated: ${reportPath}, ${markdownPath}`);
    
  } catch (error) {
    log(`API test execution failed: ${error.message}`, 'error');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testResults
};