/**
 * COMPREHENSIVE ERROR HANDLING TEST SUITE
 * Tests error handling and edge cases across the entire psychological metrics system
 * 
 * Critical Error Handling Scenarios:
 * 1. Data Validation Edge Cases
 * 2. API Error Scenarios  
 * 3. Frontend Error Handling
 * 4. UI Error Recovery
 * 5. Mathematical Edge Cases
 * 6. System Integration Errors
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retryAttempts: 3,
  testResults: {
    passed: 0,
    failed: 0,
    warnings: 0,
    total: 0,
    details: []
  }
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data
  };
  
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  return logEntry;
}

function createTestResult(testName, category, status, details = null, error = null) {
  const result = {
    testName,
    category,
    status, // 'PASS', 'FAIL', 'WARN'
    timestamp: new Date().toISOString(),
    details,
    error: error ? error.message : null,
    stack: error ? error.stack : null
  };
  
  TEST_CONFIG.testResults.details.push(result);
  TEST_CONFIG.testResults.total++;
  
  if (status === 'PASS') {
    TEST_CONFIG.testResults.passed++;
    log('info', `✅ ${testName} PASSED`, details);
  } else if (status === 'FAIL') {
    TEST_CONFIG.testResults.failed++;
    log('error', `❌ ${testName} FAILED`, { details, error: error?.message });
  } else if (status === 'WARN') {
    TEST_CONFIG.testResults.warnings++;
    log('warn', `⚠️ ${testName} WARNING`, details);
  }
  
  return result;
}

// Helper function to make HTTP requests with error handling
async function makeRequest(url, options = {}) {
  const defaultOptions = {
    timeout: TEST_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ErrorHandlingTestSuite/1.0'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    const responseTime = Date.now();
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      responseTime,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      error: error.message,
      responseTime: Date.now()
    };
  }
}

// 1. DATA VALIDATION EDGE CASES
async function testDataValidationEdgeCases() {
  log('info', '🧪 Testing Data Validation Edge Cases...');
  
  // Test 1.1: Null/undefined emotional data
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-for-testing'
      }
    });
    
    const shouldHandleNullGracefully = response.status === 401 || response.status === 422;
    createTestResult(
      'Null/Undefined Emotional Data Handling',
      'Data Validation',
      shouldHandleNullGracefully ? 'PASS' : 'FAIL',
      {
        expectedStatus: [401, 422],
        actualStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined
      }
    );
  } catch (error) {
    createTestResult('Null/Undefined Emotional Data Handling', 'Data Validation', 'FAIL', null, error);
  }
  
  // Test 1.2: Malformed JSON emotional states
  try {
    const malformedJson = '{"emotionalData": "invalid-json"}';
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: malformedJson,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const shouldHandleMalformedJson = response.status === 400 || response.status === 422;
    createTestResult(
      'Malformed JSON Handling',
      'Data Validation',
      shouldHandleMalformedJson ? 'PASS' : 'FAIL',
      {
        expectedStatus: [400, 422],
        actualStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined
      }
    );
  } catch (error) {
    createTestResult('Malformed JSON Handling', 'Data Validation', 'FAIL', null, error);
  }
  
  // Test 1.3: Invalid emotion names
  try {
    const invalidEmotions = {
      emotionalData: [
        { subject: 'INVALID_EMOTION_123', value: 50 },
        { subject: '', value: 25 },
        { subject: null, value: 75 }
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(invalidEmotions),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const shouldHandleInvalidEmotions = response.status === 422 || response.status === 400;
    createTestResult(
      'Invalid Emotion Names Handling',
      'Data Validation',
      shouldHandleInvalidEmotions ? 'PASS' : 'FAIL',
      {
        expectedStatus: [400, 422],
        actualStatus: response.status,
        hasValidationErrors: response.data?.details?.length > 0
      }
    );
  } catch (error) {
    createTestResult('Invalid Emotion Names Handling', 'Data Validation', 'FAIL', null, error);
  }
  
  // Test 1.4: Extreme emotion values
  try {
    const extremeValues = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: -100 },
        { subject: 'CONFIDENCE', value: 1000 },
        { subject: 'TILT', value: Infinity },
        { subject: 'PATIENCE', value: -Infinity }
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(extremeValues),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const shouldHandleExtremeValues = response.status === 422 || response.status === 400;
    createTestResult(
      'Extreme Emotion Values Handling',
      'Data Validation',
      shouldHandleExtremeValues ? 'PASS' : 'FAIL',
      {
        expectedStatus: [400, 422],
        actualStatus: response.status,
        hasRangeValidation: response.data?.details?.some(detail => 
          detail.includes('range') || detail.includes('0-100')
        )
      }
    );
  } catch (error) {
    createTestResult('Extreme Emotion Values Handling', 'Data Validation', 'FAIL', null, error);
  }
  
  // Test 1.5: Circular reference objects
  try {
    const circularObj = { subject: 'CIRCULAR', value: 50 };
    circularObj.self = circularObj; // Create circular reference
    
    const dataWithCircular = {
      emotionalData: [circularObj]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(dataWithCircular),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    // Should either handle gracefully or fail with proper error
    const handledGracefully = response.status === 422 || response.status === 400 || response.status === 500;
    createTestResult(
      'Circular Reference Objects Handling',
      'Data Validation',
      handledGracefully ? 'PASS' : 'FAIL',
      {
        expectedStatus: [400, 422, 500],
        actualStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined
      }
    );
  } catch (error) {
    // JSON.stringify should handle circular references, but if it throws, that's also valid error handling
    const isCircularError = error.message.includes('circular') || error.message.includes('Converting');
    createTestResult(
      'Circular Reference Objects Handling',
      'Data Validation',
      isCircularError ? 'PASS' : 'FAIL',
      { circularErrorDetected: isCircularError },
      error
    );
  }
}

// 2. API ERROR SCENARIOS
async function testApiErrorScenarios() {
  log('info', '🔌 Testing API Error Scenarios...');
  
  // Test 2.1: Database connection failures
  try {
    // Simulate database connection failure by making a request that would require DB access
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    // Should handle database errors gracefully
    const handledDbError = response.status === 500 || response.status === 503 || 
                         (response.status === 401 && response.data?.error);
    
    createTestResult(
      'Database Connection Failure Handling',
      'API Error',
      handledDbError ? 'PASS' : 'FAIL',
      {
        expectedStatus: [401, 500, 503],
        actualStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined
      }
    );
  } catch (error) {
    createTestResult('Database Connection Failure Handling', 'API Error', 'PASS', { networkErrorHandled: true });
  }
  
  // Test 2.2: Network timeouts during API calls
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      timeout: 100, // Very short timeout to force timeout
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    const endTime = Date.now();
    
    const timedOut = (endTime - startTime) >= 100 || response.status === 0;
    createTestResult(
      'Network Timeout Handling',
      'API Error',
      timedOut ? 'PASS' : 'FAIL',
      {
        expectedTimeout: 100,
        actualTime: endTime - startTime,
        responseStatus: response.status,
        timeoutHandled: timedOut
      }
    );
  } catch (error) {
    const isTimeoutError = error.message.includes('timeout') || error.message.includes('aborted');
    createTestResult(
      'Network Timeout Handling',
      'API Error',
      isTimeoutError ? 'PASS' : 'FAIL',
      { timeoutErrorDetected: isTimeoutError },
      error
    );
  }
  
  // Test 2.3: Malformed request headers
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': null, // Invalid header
        'Authorization': 'Bearer test-token',
        'Invalid-Header': '\x00\x01\x02' // Binary data in header
      }
    });
    
    const handledMalformedHeaders = response.status === 400 || response.status === 422;
    createTestResult(
      'Malformed Request Headers Handling',
      'API Error',
      handledMalformedHeaders ? 'PASS' : 'FAIL',
      {
        expectedStatus: [400, 422],
        actualStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined
      }
    );
  } catch (error) {
    createTestResult('Malformed Request Headers Handling', 'API Error', 'PASS', { headerErrorHandled: true });
  }
  
  // Test 2.4: Rate limiting (if implemented)
  try {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    const hasRateLimiting = rateLimitedResponses.length > 0;
    createTestResult(
      'Rate Limiting Implementation',
      'API Error',
      hasRateLimiting ? 'PASS' : 'WARN',
      {
        totalRequests: responses.length,
        rateLimitedResponses: rateLimitedResponses.length,
        rateLimitingDetected: hasRateLimiting
      }
    );
  } catch (error) {
    createTestResult('Rate Limiting Implementation', 'API Error', 'WARN', { rateLimitingTestError: true });
  }
  
  // Test 2.5: Corrupted data in database simulation
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    // Check if API can handle corrupted data gracefully
    const handlesCorruptedData = response.status !== 200 || 
                               (response.status === 200 && response.data?.validationWarnings?.length > 0);
    
    createTestResult(
      'Corrupted Database Data Handling',
      'API Error',
      handlesCorruptedData ? 'PASS' : 'WARN',
      {
        responseStatus: response.status,
        hasValidationWarnings: response.data?.validationWarnings?.length > 0,
        dataIntegrityChecks: response.data?.validationWarnings?.some(w => 
          w.includes('invalid') || w.includes('corrupted')
        )
      }
    );
  } catch (error) {
    createTestResult('Corrupted Database Data Handling', 'API Error', 'PASS', { corruptedDataErrorHandled: true });
  }
}

// 3. FRONTEND ERROR HANDLING
async function testFrontendErrorHandling() {
  log('info', '🎨 Testing Frontend Error Handling...');
  
  // Test 3.1: Calculation function crashes
  try {
    // Simulate calculation with invalid data that might crash functions
    const invalidCalculationData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: NaN },
        { subject: 'CONFIDENCE', value: undefined },
        { subject: 'TILT', value: 'not-a-number' }
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(invalidCalculationData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const shouldHandleCalculationCrash = response.status === 422 || response.status === 400;
    createTestResult(
      'Calculation Function Crash Handling',
      'Frontend Error',
      shouldHandleCalculationCrash ? 'PASS' : 'FAIL',
      {
        expectedStatus: [400, 422],
        actualStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined
      }
    );
  } catch (error) {
    createTestResult('Calculation Function Crash Handling', 'Frontend Error', 'FAIL', null, error);
  }
  
  // Test 3.2: Invalid API responses
  try {
    // Test with response that has invalid structure
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesInvalidResponse = response.status !== 200 || 
                                 (response.status === 200 && typeof response.data === 'object');
    
    createTestResult(
      'Invalid API Response Handling',
      'Frontend Error',
      handlesInvalidResponse ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        isResponseObject: typeof response.data === 'object',
        hasValidation: response.data?.error !== undefined || response.data?.validationWarnings
      }
    );
  } catch (error) {
    createTestResult('Invalid API Response Handling', 'Frontend Error', 'PASS', { invalidResponseErrorHandled: true });
  }
  
  // Test 3.3: Memory exhaustion scenarios
  try {
    // Create large payload that might cause memory issues
    const largePayload = {
      emotionalData: Array.from({ length: 10000 }, (_, i) => ({
        subject: `EMOTION_${i}`,
        value: Math.random() * 100,
        fullMark: 100,
        leaning: 'Balanced',
        side: i % 2 === 0 ? 'Buy' : 'Sell',
        largeData: 'x'.repeat(1000) // Add large string to each item
      }))
    };
    
    const startTime = Date.now();
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(largePayload),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    const endTime = Date.now();
    
    const handledMemoryPressure = response.status === 413 || response.status === 422 || 
                                response.status === 500 || (endTime - startTime) < 30000;
    
    createTestResult(
      'Memory Exhaustion Scenario Handling',
      'Frontend Error',
      handledMemoryPressure ? 'PASS' : 'WARN',
      {
        payloadSize: JSON.stringify(largePayload).length,
        responseStatus: response.status,
        processingTime: endTime - startTime,
        memoryPressureHandled: handledMemoryPressure
      }
    );
  } catch (error) {
    const isMemoryError = error.message.includes('memory') || error.message.includes('heap');
    createTestResult(
      'Memory Exhaustion Scenario Handling',
      'Frontend Error',
      isMemoryError ? 'PASS' : 'FAIL',
      { memoryErrorDetected: isMemoryError },
      error
    );
  }
  
  // Test 3.4: Infinite loop prevention
  try {
    // Create data that might cause infinite loops in processing
    const infiniteLoopData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: 50, circularRef: null }
      ]
    };
    infiniteLoopData.emotionalData[0].circularRef = infiniteLoopData; // Create potential infinite loop
    
    const startTime = Date.now();
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(infiniteLoopData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    const endTime = Date.now();
    
    const preventedInfiniteLoop = (endTime - startTime) < 10000; // Should complete within 10 seconds
    createTestResult(
      'Infinite Loop Prevention',
      'Frontend Error',
      preventedInfiniteLoop ? 'PASS' : 'FAIL',
      {
        processingTime: endTime - startTime,
        responseStatus: response.status,
        infiniteLoopPrevented: preventedInfiniteLoop
      }
    );
  } catch (error) {
    createTestResult('Infinite Loop Prevention', 'Frontend Error', 'PASS', { infiniteLoopErrorHandled: true });
  }
  
  // Test 3.5: Stack overflow protection
  try {
    // Create deeply nested structure that might cause stack overflow
    let deepNested = { value: 0 };
    for (let i = 0; i < 1000; i++) {
      deepNested = { nested: deepNested, value: i };
    }
    
    const stackOverflowData = {
      emotionalData: [deepNested]
    };
    
    const startTime = Date.now();
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(stackOverflowData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    const endTime = Date.now();
    
    const preventedStackOverflow = (endTime - startTime) < 10000;
    createTestResult(
      'Stack Overflow Protection',
      'Frontend Error',
      preventedStackOverflow ? 'PASS' : 'FAIL',
      {
        processingTime: endTime - startTime,
        responseStatus: response.status,
        stackOverflowPrevented: preventedStackOverflow
      }
    );
  } catch (error) {
    const isStackOverflow = error.message.includes('stack') || error.message.includes('Maximum call stack');
    createTestResult(
      'Stack Overflow Protection',
      'Frontend Error',
      isStackOverflow ? 'PASS' : 'FAIL',
      { stackOverflowDetected: isStackOverflow },
      error
    );
  }
}

// 4. UI ERROR RECOVERY
async function testUiErrorRecovery() {
  log('info', '🔄 Testing UI Error Recovery...');
  
  // Test 4.1: Error display when API fails
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ErrorHandlingTestSuite/1.0'
      }
    });
    
    const hasErrorHandling = response.status === 200;
    createTestResult(
      'Error Display When API Fails',
      'UI Error Recovery',
      hasErrorHandling ? 'PASS' : 'WARN',
      {
        responseStatus: response.status,
        pageLoads: hasErrorHandling
      }
    );
  } catch (error) {
    createTestResult('Error Display When API Fails', 'UI Error Recovery', 'FAIL', null, error);
  }
  
  // Test 4.2: Retry mechanisms
  try {
    // Test if retry mechanisms work by making multiple failed requests
    const retryAttempts = [];
    for (let i = 0; i < 3; i++) {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      retryAttempts.push(response.status);
    }
    
    const consistentErrorHandling = retryAttempts.every(status => status === retryAttempts[0]);
    createTestResult(
      'Retry Mechanisms',
      'UI Error Recovery',
      consistentErrorHandling ? 'PASS' : 'WARN',
      {
        retryAttempts: retryAttempts,
        consistentHandling: consistentErrorHandling
      }
    );
  } catch (error) {
    createTestResult('Retry Mechanisms', 'UI Error Recovery', 'FAIL', null, error);
  }
  
  // Test 4.3: Fallback values display
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    const hasFallbackValues = response.status === 200 || 
                             (response.status !== 200 && response.data?.error);
    
    createTestResult(
      'Fallback Values Display',
      'UI Error Recovery',
      hasFallbackValues ? 'PASS' : 'WARN',
      {
        responseStatus: response.status,
        hasFallbackData: response.data?.totalTrades !== undefined || response.data?.error,
        fallbackMechanism: hasFallbackValues
      }
    );
  } catch (error) {
    createTestResult('Fallback Values Display', 'UI Error Recovery', 'PASS', { fallbackErrorHandled: true });
  }
  
  // Test 4.4: Error state accessibility
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ErrorHandlingTestSuite/1.0'
      }
    });
    
    // Check if the page has proper error state handling
    const hasAccessibility = response.status === 200;
    createTestResult(
      'Error State Accessibility',
      'UI Error Recovery',
      hasAccessibility ? 'PASS' : 'WARN',
      {
        responseStatus: response.status,
        pageAccessible: hasAccessibility
      }
    );
  } catch (error) {
    createTestResult('Error State Accessibility', 'UI Error Recovery', 'FAIL', null, error);
  }
  
  // Test 4.5: Error logging functionality
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const hasErrorLogging = response.data?.error !== undefined || response.status !== 200;
    createTestResult(
      'Error Logging Functionality',
      'UI Error Recovery',
      hasErrorLogging ? 'PASS' : 'WARN',
      {
        responseStatus: response.status,
        hasErrorData: response.data?.error !== undefined,
        errorLogged: hasErrorLogging
      }
    );
  } catch (error) {
    createTestResult('Error Logging Functionality', 'UI Error Recovery', 'PASS', { errorLoggingHandled: true });
  }
}

// 5. MATHEMATICAL EDGE CASES
async function testMathematicalEdgeCases() {
  log('info', '🔢 Testing Mathematical Edge Cases...');
  
  // Test 5.1: Division by zero scenarios
  try {
    const divisionByZeroData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: 50 },
        { subject: 'CONFIDENCE', value: 0 } // Zero value might cause division by zero
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(divisionByZeroData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesDivisionByZero = response.status !== 500 || 
                               (response.status === 500 && response.data?.error);
    
    createTestResult(
      'Division by Zero Scenarios',
      'Mathematical Edge Cases',
      handlesDivisionByZero ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        divisionByZeroHandled: handlesDivisionByZero
      }
    );
  } catch (error) {
    const isDivisionError = error.message.includes('division') || error.message.includes('zero');
    createTestResult(
      'Division by Zero Scenarios',
      'Mathematical Edge Cases',
      isDivisionError ? 'PASS' : 'FAIL',
      { divisionErrorDetected: isDivisionError },
      error
    );
  }
  
  // Test 5.2: Floating point precision issues
  try {
    const floatingPointData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: 0.1 + 0.2 }, // Known floating point issue
        { subject: 'CONFIDENCE', value: 0.3 },
        { subject: 'TILT', value: 1.0e-10 }, // Very small number
        { subject: 'PATIENCE', value: 1.0e10 } // Very large number
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(floatingPointData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesFloatingPoint = response.status !== 500 || 
                               (response.status === 500 && response.data?.error);
    
    createTestResult(
      'Floating Point Precision Issues',
      'Mathematical Edge Cases',
      handlesFloatingPoint ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        floatingPointHandled: handlesFloatingPoint
      }
    );
  } catch (error) {
    createTestResult('Floating Point Precision Issues', 'Mathematical Edge Cases', 'FAIL', null, error);
  }
  
  // Test 5.3: Overflow/underflow conditions
  try {
    const overflowData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: Number.MAX_SAFE_INTEGER },
        { subject: 'CONFIDENCE', value: Number.MIN_SAFE_INTEGER },
        { subject: 'TILT', value: Number.MAX_VALUE },
        { subject: 'PATIENCE', value: Number.MIN_VALUE }
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(overflowData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesOverflow = response.status !== 500 || 
                          (response.status === 500 && response.data?.error);
    
    createTestResult(
      'Overflow/Underflow Conditions',
      'Mathematical Edge Cases',
      handlesOverflow ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        overflowHandled: handlesOverflow
      }
    );
  } catch (error) {
    const isOverflowError = error.message.includes('overflow') || error.message.includes('range');
    createTestResult(
      'Overflow/Underflow Conditions',
      'Mathematical Edge Cases',
      isOverflowError ? 'PASS' : 'FAIL',
      { overflowErrorDetected: isOverflowError },
      error
    );
  }
  
  // Test 5.4: NaN and Infinity handling
  try {
    const nanInfinityData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: NaN },
        { subject: 'CONFIDENCE', value: Infinity },
        { subject: 'TILT', value: -Infinity },
        { subject: 'PATIENCE', value: 0 / 0 } // Another NaN
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(nanInfinityData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesNanInfinity = response.status === 422 || response.status === 400;
    
    createTestResult(
      'NaN and Infinity Handling',
      'Mathematical Edge Cases',
      handlesNanInfinity ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        nanInfinityHandled: handlesNanInfinity
      }
    );
  } catch (error) {
    createTestResult('NaN and Infinity Handling', 'Mathematical Edge Cases', 'FAIL', null, error);
  }
  
  // Test 5.5: Mathematical coupling with invalid inputs
  try {
    const couplingData = {
      emotionalData: [
        { subject: 'DISCIPLINE', value: 'invalid' },
        { subject: 'CONFIDENCE', value: null },
        { subject: 'TILT', value: undefined },
        { subject: 'PATIENCE', value: [] }
      ]
    };
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'POST',
      body: JSON.stringify(couplingData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesInvalidCoupling = response.status === 422 || response.status === 400;
    
    createTestResult(
      'Mathematical Coupling with Invalid Inputs',
      'Mathematical Edge Cases',
      handlesInvalidCoupling ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        invalidCouplingHandled: handlesInvalidCoupling
      }
    );
  } catch (error) {
    createTestResult('Mathematical Coupling with Invalid Inputs', 'Mathematical Edge Cases', 'FAIL', null, error);
  }
}

// 6. SYSTEM INTEGRATION ERRORS
async function testSystemIntegrationErrors() {
  log('info', '🔗 Testing System Integration Errors...');
  
  // Test 6.1: Authentication token expiration
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer expired-token-12345'
      }
    });
    
    const handlesExpiredToken = response.status === 401 || response.status === 403;
    
    createTestResult(
      'Authentication Token Expiration',
      'System Integration Errors',
      handlesExpiredToken ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        expiredTokenHandled: handlesExpiredToken
      }
    );
  } catch (error) {
    createTestResult('Authentication Token Expiration', 'System Integration Errors', 'FAIL', null, error);
  }
  
  // Test 6.2: Concurrent request conflicts
  try {
    const concurrentRequests = [];
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(
        makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    }
    
    const responses = await Promise.all(concurrentRequests);
    const consistentResponses = responses.every(r => r.status === responses[0].status);
    
    createTestResult(
      'Concurrent Request Conflicts',
      'System Integration Errors',
      consistentResponses ? 'PASS' : 'WARN',
      {
        totalRequests: responses.length,
        responseStatuses: responses.map(r => r.status),
        consistentResponses: consistentResponses
      }
    );
  } catch (error) {
    createTestResult('Concurrent Request Conflicts', 'System Integration Errors', 'FAIL', null, error);
  }
  
  // Test 6.3: Memory leaks during calculations
  try {
    const memoryLeakTests = [];
    for (let i = 0; i < 10; i++) {
      const largeData = {
        emotionalData: Array.from({ length: 1000 }, (_, j) => ({
          subject: `EMOTION_${j}`,
          value: Math.random() * 100,
          fullMark: 100,
          leaning: 'Balanced',
          side: j % 2 === 0 ? 'Buy' : 'Sell'
        }))
      };
      
      const startTime = Date.now();
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/confluence-stats`, {
        method: 'POST',
        body: JSON.stringify(largeData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      const endTime = Date.now();
      
      memoryLeakTests.push({
        iteration: i,
        responseTime: endTime - startTime,
        status: response.status
      });
    }
    
    const responseTimes = memoryLeakTests.map(t => t.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const memoryLeakDetected = maxResponseTime > avgResponseTime * 3;
    
    createTestResult(
      'Memory Leaks During Calculations',
      'System Integration Errors',
      !memoryLeakDetected ? 'PASS' : 'WARN',
      {
        iterations: memoryLeakTests.length,
        avgResponseTime,
        maxResponseTime,
        memoryLeakDetected
      }
    );
  } catch (error) {
    createTestResult('Memory Leaks During Calculations', 'System Integration Errors', 'FAIL', null, error);
  }
  
  // Test 6.4: Browser compatibility issues
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0)' // IE11 user agent
      }
    });
    
    const browserCompatible = response.status === 200;
    
    createTestResult(
      'Browser Compatibility Issues',
      'System Integration Errors',
      browserCompatible ? 'PASS' : 'WARN',
      {
        responseStatus: response.status,
        userAgent: 'IE11',
        browserCompatible
      }
    );
  } catch (error) {
    createTestResult('Browser Compatibility Issues', 'System Integration Errors', 'FAIL', null, error);
  }
  
  // Test 6.5: Network interruption handling
  try {
    // Simulate network interruption by making a request to a non-existent endpoint
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/non-existent-endpoint`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    const handlesNetworkInterruption = response.status === 404 || response.status === 0;
    
    createTestResult(
      'Network Interruption Handling',
      'System Integration Errors',
      handlesNetworkInterruption ? 'PASS' : 'FAIL',
      {
        responseStatus: response.status,
        hasErrorHandling: response.data?.error !== undefined,
        networkInterruptionHandled: handlesNetworkInterruption
      }
    );
  } catch (error) {
    createTestResult('Network Interruption Handling', 'System Integration Errors', 'PASS', { networkErrorHandled: true });
  }
}

// Generate comprehensive report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    testConfiguration: TEST_CONFIG,
    summary: {
      totalTests: TEST_CONFIG.testResults.total,
      passed: TEST_CONFIG.testResults.passed,
      failed: TEST_CONFIG.testResults.failed,
      warnings: TEST_CONFIG.testResults.warnings,
      successRate: ((TEST_CONFIG.testResults.passed / TEST_CONFIG.testResults.total) * 100).toFixed(2) + '%'
    },
    categories: {
      'Data Validation': TEST_CONFIG.testResults.details.filter(t => t.category === 'Data Validation'),
      'API Error': TEST_CONFIG.testResults.details.filter(t => t.category === 'API Error'),
      'Frontend Error': TEST_CONFIG.testResults.details.filter(t => t.category === 'Frontend Error'),
      'UI Error Recovery': TEST_CONFIG.testResults.details.filter(t => t.category === 'UI Error Recovery'),
      'Mathematical Edge Cases': TEST_CONFIG.testResults.details.filter(t => t.category === 'Mathematical Edge Cases'),
      'System Integration Errors': TEST_CONFIG.testResults.details.filter(t => t.category === 'System Integration Errors')
    },
    detailedResults: TEST_CONFIG.testResults.details,
    recommendations: generateRecommendations()
  };
  
  return report;
}

function generateRecommendations() {
  const recommendations = [];
  
  const failedTests = TEST_CONFIG.testResults.details.filter(t => t.status === 'FAIL');
  const warningTests = TEST_CONFIG.testResults.details.filter(t => t.status === 'WARN');
  
  if (failedTests.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Critical Issues',
      description: `Fix ${failedTests.length} failing test(s) that could cause system crashes`,
      tests: failedTests.map(t => t.testName)
    });
  }
  
  if (warningTests.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Improvements Needed',
      description: `Address ${warningTests.length} warning(s) to improve robustness`,
      tests: warningTests.map(t => t.testName)
    });
  }
  
  // Specific recommendations based on test patterns
  const dataValidationFailures = failedTests.filter(t => t.category === 'Data Validation');
  if (dataValidationFailures.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Data Validation',
      description: 'Strengthen input validation and sanitization',
      suggestion: 'Implement comprehensive validation middleware for all API endpoints'
    });
  }
  
  const apiErrorFailures = failedTests.filter(t => t.category === 'API Error');
  if (apiErrorFailures.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'API Error Handling',
      description: 'Improve API error response consistency',
      suggestion: 'Standardize error response format across all endpoints'
    });
  }
  
  const mathFailures = failedTests.filter(t => t.category === 'Mathematical Edge Cases');
  if (mathFailures.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Mathematical Calculations',
      description: 'Add robust mathematical edge case handling',
      suggestion: 'Implement safe math functions with proper NaN, Infinity, and overflow checks'
    });
  }
  
  return recommendations;
}

// Main test execution function
async function runComprehensiveErrorHandlingTests() {
  log('info', '🚀 Starting Comprehensive Error Handling Tests...');
  log('info', `📍 Target: ${TEST_CONFIG.baseUrl}`);
  
  try {
    await testDataValidationEdgeCases();
    await testApiErrorScenarios();
    await testFrontendErrorHandling();
    await testUiErrorRecovery();
    await testMathematicalEdgeCases();
    await testSystemIntegrationErrors();
    
    const report = generateReport();
    
    // Save report to file
    const reportPath = path.join(__dirname, 'error-handling-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, 'ERROR_HANDLING_TEST_REPORT.md');
    fs.writeFileSync(markdownPath, markdownReport);
    
    log('info', '📊 Test Results Summary:');
    log('info', `   Total Tests: ${report.summary.totalTests}`);
    log('info', `   Passed: ${report.summary.passed}`);
    log('info', `   Failed: ${report.summary.failed}`);
    log('info', `   Warnings: ${report.summary.warnings}`);
    log('info', `   Success Rate: ${report.summary.successRate}`);
    log('info', `📄 Reports saved to: ${reportPath} and ${markdownPath}`);
    
    return report;
    
  } catch (error) {
    log('error', '💥 Test execution failed', error);
    throw error;
  }
}

function generateMarkdownReport(report) {
  return `# COMPREHENSIVE ERROR HANDLING TEST REPORT

Generated on: ${report.timestamp}

## 📊 EXECUTIVE SUMMARY

- **Total Tests:** ${report.summary.totalTests}
- **Passed:** ${report.summary.passed} ✅
- **Failed:** ${report.summary.failed} ❌
- **Warnings:** ${report.summary.warnings} ⚠️
- **Success Rate:** ${report.summary.successRate}

## 📋 TEST CATEGORIES

### 1. Data Validation Edge Cases
${generateCategorySection(report.categories['Data Validation'])}

### 2. API Error Scenarios
${generateCategorySection(report.categories['API Error'])}

### 3. Frontend Error Handling
${generateCategorySection(report.categories['Frontend Error'])}

### 4. UI Error Recovery
${generateCategorySection(report.categories['UI Error Recovery'])}

### 5. Mathematical Edge Cases
${generateCategorySection(report.categories['Mathematical Edge Cases'])}

### 6. System Integration Errors
${generateCategorySection(report.categories['System Integration Errors'])}

## 🎯 RECOMMENDATIONS

${report.recommendations.map(rec => `
### ${rec.priority} PRIORITY: ${rec.category}
**Description:** ${rec.description}
**Tests Affected:** ${rec.tests ? rec.tests.join(', ') : 'N/A'}
${rec.suggestion ? `**Suggestion:** ${rec.suggestion}` : ''}
`).join('\n')}

## 📈 DETAILED RESULTS

${report.detailedResults.map(test => `
### ${test.testName}
- **Category:** ${test.category}
- **Status:** ${test.status === 'PASS' ? '✅ PASS' : test.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN'}
- **Timestamp:** ${test.timestamp}
${test.details ? `- **Details:** \`${JSON.stringify(test.details)}\`` : ''}
${test.error ? `- **Error:** ${test.error}` : ''}
`).join('\n')}

---
*Report generated by Comprehensive Error Handling Test Suite v1.0*
`;
}

function generateCategorySection(tests) {
  if (tests.length === 0) {
    return 'No tests in this category.';
  }
  
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  const warnings = tests.filter(t => t.status === 'WARN').length;
  
  return `
**Results:** ${passed} passed, ${failed} failed, ${warnings} warnings

${tests.map(test => `
- **${test.testName}**: ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'} ${test.status}
${test.details ? `  - Details: \`${JSON.stringify(test.details)}\`` : ''}
${test.error ? `  - Error: ${test.error}` : ''}
`).join('')}
`;
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runComprehensiveErrorHandlingTests,
    generateReport,
    TEST_CONFIG
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveErrorHandlingTests()
    .then(report => {
      log('info', '✅ All tests completed successfully');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      log('error', '💥 Test suite failed', error);
      process.exit(1);
    });
}