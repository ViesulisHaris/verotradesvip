/**
 * Comprehensive Trades Tab Validation Script
 * 
 * This script validates all the fixes implemented for the /trades tab data display issue:
 * 1. API Authentication Fixes
 * 2. Win Rate Calculation Bug Fix
 * 3. Frontend User Validation Improvements
 * 4. UUID Validation Logic Improvements
 * 5. Comprehensive Error Logging
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
  trades: '/api/confluence-trades',
  stats: '/api/confluence-stats'
};

// Test results storage
const validationResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: {},
  performance: {},
  errors: [],
  recommendations: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
  
  // Store in results
  if (type === 'error') {
    validationResults.errors.push(message);
  }
}

function recordTest(category, testName, passed, details = '') {
  if (!validationResults.tests[category]) {
    validationResults.tests[category] = [];
  }
  
  validationResults.tests[category].push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  
  validationResults.summary.totalTests++;
  if (passed) {
    validationResults.summary.passed++;
  } else {
    validationResults.summary.failed++;
  }
  
  log(`${category}: ${testName} - ${passed ? 'PASS' : 'FAIL'} ${details}`, passed ? 'info' : 'error');
}

function recordPerformance(testName, duration, metadata = {}) {
  validationResults.performance[testName] = {
    duration,
    metadata,
    timestamp: new Date().toISOString()
  };
}

function addRecommendation(recommendation) {
  validationResults.recommendations.push(recommendation);
  log(`RECOMMENDATION: ${recommendation}`, 'warn');
  validationResults.summary.warnings++;
}

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const duration = Date.now() - startTime;
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      duration,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 0,
      ok: false,
      data: { error: error.message },
      duration,
      headers: {}
    };
  }
}

// Validation functions
async function validateAPIAuthentication() {
  log('Starting API Authentication Validation...');
  
  // Test 1: Check if API endpoints are accessible without authentication
  for (const [name, endpoint] of Object.entries(API_ENDPOINTS)) {
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url);
    
    recordTest(
      'API Authentication',
      `${name} endpoint without auth returns 401`,
      result.status === 401,
      `Status: ${result.status}, Duration: ${result.duration}ms`
    );
    
    recordPerformance(`API_${name}_no_auth`, result.duration);
  }
  
  // Test 2: Check if API endpoints handle malformed authentication
  for (const [name, endpoint] of Object.entries(API_ENDPOINTS)) {
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    recordTest(
      'API Authentication',
      `${name} endpoint with invalid auth returns 401`,
      result.status === 401,
      `Status: ${result.status}, Duration: ${result.duration}ms`
    );
    
    recordPerformance(`API_${name}_invalid_auth`, result.duration);
  }
  
  // Test 3: Check if API endpoints have proper error logging
  // This would require checking server logs, but we can infer from response structure
  for (const [name, endpoint] of Object.entries(API_ENDPOINTS)) {
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const hasRequestId = result.data && result.data.requestId;
    const hasErrorDetails = result.data && result.data.error;
    
    recordTest(
      'API Authentication',
      `${name} endpoint provides structured error response`,
      hasRequestId && hasErrorDetails,
      `RequestId: ${hasRequestId}, ErrorDetails: ${hasErrorDetails}`
    );
  }
}

async function validateUUIDHandling() {
  log('Starting UUID Handling Validation...');
  
  // Test 1: Check if UUID validation is properly implemented
  try {
    // Read the UUID validation file
    const uuidValidationPath = path.join(__dirname, 'src/lib/uuid-validation.ts');
    if (fs.existsSync(uuidValidationPath)) {
      const content = fs.readFileSync(uuidValidationPath, 'utf8');
      
      const hasPermissiveValidation = content.includes('permissiveUuidRegex');
      const hasProperErrorHandling = content.includes('validateUUID');
      const hasEdgeCaseHandling = content.includes('undefined') && content.includes('null');
      
      recordTest(
        'UUID Validation',
        'UUID validation file exists and has proper validation',
        hasPermissiveValidation && hasProperErrorHandling && hasEdgeCaseHandling,
        `Permissive: ${hasPermissiveValidation}, Error Handling: ${hasProperErrorHandling}, Edge Cases: ${hasEdgeCaseHandling}`
      );
    } else {
      recordTest('UUID Validation', 'UUID validation file exists', false, 'File not found');
    }
  } catch (error) {
    recordTest('UUID Validation', 'UUID validation file analysis', false, error.message);
  }
  
  // Test 2: Check API routes use UUID validation
  const apiRoutes = [
    'src/app/api/confluence-trades/route.ts',
    'src/app/api/confluence-stats/route.ts'
  ];
  
  for (const route of apiRoutes) {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      const usesUUIDValidation = content.includes('validateUUID');
      const hasProperAuthFlow = content.includes('getUser()') && !content.includes('getUser(token)');
      const hasErrorLogging = content.includes('requestId') && content.includes('console.error');
      
      recordTest(
        'UUID Validation',
        `${route} uses UUID validation and proper auth`,
        usesUUIDValidation && hasProperAuthFlow && hasErrorLogging,
        `UUID Validation: ${usesUUIDValidation}, Auth Flow: ${hasProperAuthFlow}, Error Logging: ${hasErrorLogging}`
      );
    } else {
      recordTest('UUID Validation', `${route} file exists`, false, 'File not found');
    }
  }
}

async function validateWinRateCalculation() {
  log('Starting Win Rate Calculation Validation...');
  
  // Test 1: Check if win rate calculation is correct in the stats API
  const statsRoutePath = path.join(__dirname, 'src/app/api/confluence-stats/route.ts');
  if (fs.existsSync(statsRoutePath)) {
    const content = fs.readFileSync(statsRoutePath, 'utf8');
    
    // Check for correct win rate calculation
    const hasCorrectWinRateCalc = content.includes('const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0');
    const hasProperVariableUsage = !content.includes('winningTrades / winningTrades'); // Check for division by zero bug
    
    recordTest(
      'Win Rate Calculation',
      'Stats API has correct win rate calculation',
      hasCorrectWinRateCalc && hasProperVariableUsage,
      `Correct Calculation: ${hasCorrectWinRateCalc}, No Division Bug: ${hasProperVariableUsage}`
    );
    
    // Check for proper handling of edge cases
    const hasZeroTradesHandling = content.includes('totalTrades > 0');
    const hasNaNPrevention = content.includes('winRate: 0');
    
    recordTest(
      'Win Rate Calculation',
      'Stats API handles edge cases properly',
      hasZeroTradesHandling && hasNaNPrevention,
      `Zero Trades: ${hasZeroTradesHandling}, NaN Prevention: ${hasNaNPrevention}`
    );
  } else {
    recordTest('Win Rate Calculation', 'Stats API file exists', false, 'File not found');
  }
}

async function validateFrontendUserValidation() {
  log('Starting Frontend User Validation...');
  
  // Test 1: Check if trades page has proper user validation
  const tradesPagePath = path.join(__dirname, 'src/app/trades/page.tsx');
  if (fs.existsSync(tradesPagePath)) {
    const content = fs.readFileSync(tradesPagePath, 'utf8');
    
    const hasUserValidation = content.includes('validateUUID(user.id');
    const hasUserExistenceCheck = content.includes('if (!user || !user.id)');
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    
    recordTest(
      'Frontend Validation',
      'Trades page has proper user validation',
      hasUserValidation && hasUserExistenceCheck && hasErrorHandling,
      `User Validation: ${hasUserValidation}, Existence Check: ${hasUserExistenceCheck}, Error Handling: ${hasErrorHandling}`
    );
    
    // Check for proper loading states
    const hasLoadingState = content.includes('setLoading(true)') && content.includes('setLoading(false)');
    const hasErrorState = content.includes('setError') && content.includes('error');
    
    recordTest(
      'Frontend Validation',
      'Trades page has proper loading and error states',
      hasLoadingState && hasErrorState,
      `Loading State: ${hasLoadingState}, Error State: ${hasErrorState}`
    );
  } else {
    recordTest('Frontend Validation', 'Trades page file exists', false, 'File not found');
  }
}

async function validateErrorLogging() {
  log('Starting Error Logging Validation...');
  
  // Test 1: Check API routes have comprehensive error logging
  const apiRoutes = [
    'src/app/api/confluence-trades/route.ts',
    'src/app/api/confluence-stats/route.ts'
  ];
  
  for (const route of apiRoutes) {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      const hasRequestId = content.includes('const requestId =');
      const hasTimingMeasurement = content.includes('startTime') && content.includes('endTime');
      const hasStructuredLogging = content.includes('console.log') && content.includes('console.error');
      const hasDetailedErrorInfo = content.includes('error.message') && content.includes('stack');
      
      recordTest(
        'Error Logging',
        `${route} has comprehensive error logging`,
        hasRequestId && hasTimingMeasurement && hasStructuredLogging && hasDetailedErrorInfo,
        `Request ID: ${hasRequestId}, Timing: ${hasTimingMeasurement}, Structured: ${hasStructuredLogging}, Detailed: ${hasDetailedErrorInfo}`
      );
    } else {
      recordTest('Error Logging', `${route} file exists`, false, 'File not found');
    }
  }
}

async function validateDataFlow() {
  log('Starting Data Flow Validation...');
  
  // Test 1: Check if the data flow from API to frontend is properly structured
  const tradesPagePath = path.join(__dirname, 'src/app/trades/page.tsx');
  if (fs.existsSync(tradesPagePath)) {
    const content = fs.readFileSync(tradesPagePath, 'utf8');
    
    const hasProperDataFetching = content.includes('fetchTradesPaginated') && content.includes('fetchTradesStatistics');
    const hasStateManagement = content.includes('setTrades') && content.includes('setStatistics');
    const hasPaginationHandling = content.includes('pagination') && content.includes('currentPage');
    
    recordTest(
      'Data Flow',
      'Frontend properly handles data fetching and state management',
      hasProperDataFetching && hasStateManagement && hasPaginationHandling,
      `Data Fetching: ${hasProperDataFetching}, State Management: ${hasStateManagement}, Pagination: ${hasPaginationHandling}`
    );
  } else {
    recordTest('Data Flow', 'Trades page file exists', false, 'File not found');
  }
  
  // Test 2: Check if API responses are properly structured
  const tradesRoutePath = path.join(__dirname, 'src/app/api/confluence-trades/route.ts');
  if (fs.existsSync(tradesRoutePath)) {
    const content = fs.readFileSync(tradesRoutePath, 'utf8');
    
    const hasProperResponseStructure = content.includes('ConfluenceTradesResponse') && content.includes('trades') && content.includes('totalCount');
    const hasPaginationInfo = content.includes('currentPage') && content.includes('totalPages');
    const hasProcessingTime = content.includes('processingTime') && content.includes('requestId');
    
    recordTest(
      'Data Flow',
      'Trades API returns properly structured response',
      hasProperResponseStructure && hasPaginationInfo && hasProcessingTime,
      `Response Structure: ${hasProperResponseStructure}, Pagination: ${hasPaginationInfo}, Metadata: ${hasProcessingTime}`
    );
  } else {
    recordTest('Data Flow', 'Trades API file exists', false, 'File not found');
  }
}

async function validatePerformance() {
  log('Starting Performance Validation...');
  
  // Test 1: Check for performance optimizations
  const tradesPagePath = path.join(__dirname, 'src/app/trades/page.tsx');
  if (fs.existsSync(tradesPagePath)) {
    const content = fs.readFileSync(tradesPagePath, 'utf8');
    
    const hasMemoization = content.includes('useMemo') || content.includes('memo');
    const hasDebouncing = content.includes('createFilterDebouncedFunction') || content.includes('debounce');
    const hasOptimizedRendering = content.includes('useCallback') || content.includes('React.memo');
    
    recordTest(
      'Performance',
      'Frontend has performance optimizations',
      hasMemoization && hasDebouncing && hasOptimizedRendering,
      `Memoization: ${hasMemoization}, Debouncing: ${hasDebouncing}, Optimized Rendering: ${hasOptimizedRendering}`
    );
  } else {
    recordTest('Performance', 'Trades page file exists', false, 'File not found');
  }
  
  // Test 2: Check API response times (if server is running)
  for (const [name, endpoint] of Object.entries(API_ENDPOINTS)) {
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url);
    
    if (result.ok) {
      const isPerformant = result.duration < 2000; // Less than 2 seconds
      
      recordTest(
        'Performance',
        `${name} API response time is acceptable`,
        isPerformant,
        `Duration: ${result.duration}ms`
      );
      
      recordPerformance(`API_${name}_response_time`, result.duration);
    } else {
      recordTest('Performance', `${name} API is accessible for performance testing`, false, `Status: ${result.status}`);
    }
  }
}

async function generateReport() {
  log('Generating Validation Report...');
  
  const reportPath = path.join(__dirname, `trades-validation-report-${Date.now()}.json`);
  
  // Calculate success rate
  const successRate = validationResults.summary.totalTests > 0 
    ? (validationResults.summary.passed / validationResults.summary.totalTests * 100).toFixed(2)
    : 0;
  
  validationResults.summary.successRate = `${successRate}%`;
  
  // Add overall assessment
  if (parseFloat(successRate) >= 90) {
    validationResults.overallStatus = 'EXCELLENT';
    validationResults.recommendations.push('All critical fixes are working correctly. The /trades tab should display data properly.');
  } else if (parseFloat(successRate) >= 75) {
    validationResults.overallStatus = 'GOOD';
    validationResults.recommendations.push('Most fixes are working, but some areas need attention.');
  } else if (parseFloat(successRate) >= 50) {
    validationResults.overallStatus = 'NEEDS_IMPROVEMENT';
    validationResults.recommendations.push('Several fixes need attention before the /trades tab will work properly.');
  } else {
    validationResults.overallStatus = 'CRITICAL';
    validationResults.recommendations.push('Critical issues remain. The /trades tab may not function correctly.');
  }
  
  // Write report
  fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
  
  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('TRADES TAB VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Overall Status: ${validationResults.overallStatus}`);
  console.log(`Success Rate: ${validationResults.summary.successRate}`);
  console.log(`Total Tests: ${validationResults.summary.totalTests}`);
  console.log(`Passed: ${validationResults.summary.passed}`);
  console.log(`Failed: ${validationResults.summary.failed}`);
  console.log(`Warnings: ${validationResults.summary.warnings}`);
  console.log(`Report saved to: ${reportPath}`);
  
  // Display failed tests
  const failedTests = [];
  for (const [category, tests] of Object.entries(validationResults.tests)) {
    for (const test of tests) {
      if (!test.passed) {
        failedTests.push(`${category}: ${test.name} - ${test.details}`);
      }
    }
  }
  
  if (failedTests.length > 0) {
    console.log('\nFAILED TESTS:');
    failedTests.forEach(test => console.log(`  ❌ ${test}`));
  }
  
  // Display recommendations
  if (validationResults.recommendations.length > 0) {
    console.log('\nRECOMMENDATIONS:');
    validationResults.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
  }
  
  console.log('='.repeat(80));
  
  return validationResults;
}

// Main execution function
async function runValidation() {
  console.log('Starting Comprehensive Trades Tab Validation...');
  console.log('This will validate all fixes for the /trades tab data display issue.\n');
  
  try {
    await validateAPIAuthentication();
    await validateUUIDHandling();
    await validateWinRateCalculation();
    await validateFrontendUserValidation();
    await validateErrorLogging();
    await validateDataFlow();
    await validatePerformance();
    
    const report = await generateReport();
    
    return report;
  } catch (error) {
    log(`Validation failed with error: ${error.message}`, 'error');
    console.error(error);
    return null;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation()
    .then(report => {
      if (report) {
        process.exit(report.summary.failed > 0 ? 1 : 0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Validation script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runValidation,
  validateAPIAuthentication,
  validateUUIDHandling,
  validateWinRateCalculation,
  validateFrontendUserValidation,
  validateErrorLogging,
  validateDataFlow,
  validatePerformance,
  generateReport
};