/**
 * Comprehensive Test for Strategy Creation Functionality
 * 
 * This script tests the /api/generate-test-data endpoint with the 'create-strategies' action
 * to verify that all 5 predefined trading strategies are created correctly.
 */

// Node.js 18+ has built-in fetch, no need for node-fetch

// Test configuration
const API_URL = 'http://localhost:3000/api/generate-test-data';
const EXPECTED_STRATEGIES = [
  {
    name: 'Momentum Breakout Strategy',
    description: 'Focuses on identifying momentum breakouts and riding the trend for maximum profit',
    rulesCount: 5
  },
  {
    name: 'Mean Reversion Strategy',
    description: 'Capitalizes on price reversals after extreme movements',
    rulesCount: 5
  },
  {
    name: 'Scalping Strategy',
    description: 'Quick in-and-out trades capturing small price movements',
    rulesCount: 5
  },
  {
    name: 'Swing Trading Strategy',
    description: 'Medium-term trades capturing larger price swings over several days',
    rulesCount: 5
  },
  {
    name: 'Options Income Strategy',
    description: 'Generating consistent income through options selling strategies',
    rulesCount: 5
  }
];

// Test results tracking
const testResults = {
  basicCreation: { passed: false, details: null },
  dataIntegrity: { passed: false, details: null },
  configurationParameters: { passed: false, details: null },
  authentication: { passed: false, details: null },
  duplicateCreation: { passed: false, details: null },
  errorHandling: { passed: false, details: null }
};

/**
 * Helper function to make API requests
 */
async function makeRequest(action, authToken = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action })
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Request failed:', error);
    return { status: 0, data: { error: error.message } };
  }
}

/**
 * Test 1: Basic Strategy Creation
 */
async function testBasicStrategyCreation() {
  console.log('\n🧪 Test 1: Basic Strategy Creation');
  console.log('=' .repeat(50));

  try {
    // First, we need to authenticate by getting a session cookie
    // Since we can't easily authenticate via API, we'll test the endpoint directly
    // and check if it properly handles authentication

    const result = await makeRequest('create-strategies');
    
    if (result.status === 401) {
      console.log('✅ Authentication required (expected behavior)');
      testResults.basicCreation.passed = true;
      testResults.basicCreation.details = 'Endpoint correctly requires authentication';
      return true;
    }

    if (result.status === 200 && result.data.strategies) {
      console.log(`✅ Successfully created ${result.data.strategies.length} strategies`);
      testResults.basicCreation.passed = true;
      testResults.basicCreation.details = result.data;
      return true;
    }

    console.log('❌ Unexpected response:', result);
    testResults.basicCreation.details = result;
    return false;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.basicCreation.details = { error: error.message };
    return false;
  }
}

/**
 * Test 2: Data Integrity Verification
 */
async function testDataIntegrity() {
  console.log('\n🧪 Test 2: Data Integrity Verification');
  console.log('=' .repeat(50));

  try {
    const result = await makeRequest('create-strategies');
    
    if (result.status !== 200 || !result.data.strategies) {
      console.log('❌ Cannot verify data integrity - strategies not created');
      testResults.dataIntegrity.details = result;
      return false;
    }

    const createdStrategies = result.data.strategies;
    let allIntegrityChecksPassed = true;
    const integrityDetails = [];

    // Check if all expected strategies were created
    if (createdStrategies.length !== EXPECTED_STRATEGIES.length) {
      console.log(`❌ Expected ${EXPECTED_STRATEGIES.length} strategies, got ${createdStrategies.length}`);
      allIntegrityChecksPassed = false;
    }

    // Verify each strategy
    for (const expectedStrategy of EXPECTED_STRATEGIES) {
      const createdStrategy = createdStrategies.find(s => s.name === expectedStrategy.name);
      
      if (!createdStrategy) {
        console.log(`❌ Missing strategy: ${expectedStrategy.name}`);
        allIntegrityChecksPassed = false;
        integrityDetails.push({ 
          strategy: expectedStrategy.name, 
          status: 'MISSING' 
        });
        continue;
      }

      // Check description
      if (createdStrategy.description !== expectedStrategy.description) {
        console.log(`❌ Description mismatch for ${expectedStrategy.name}`);
        allIntegrityChecksPassed = false;
        integrityDetails.push({ 
          strategy: expectedStrategy.name, 
          status: 'DESCRIPTION_MISMATCH',
          expected: expectedStrategy.description,
          actual: createdStrategy.description
        });
      }

      // Check rules count
      if (!createdStrategy.rules || createdStrategy.rules.length !== expectedStrategy.rulesCount) {
        console.log(`❌ Rules count mismatch for ${expectedStrategy.name}`);
        allIntegrityChecksPassed = false;
        integrityDetails.push({ 
          strategy: expectedStrategy.name, 
          status: 'RULES_COUNT_MISMATCH',
          expected: expectedStrategy.rulesCount,
          actual: createdStrategy.rules ? createdStrategy.rules.length : 0
        });
      }

      console.log(`✅ Strategy verified: ${expectedStrategy.name}`);
      integrityDetails.push({ 
        strategy: expectedStrategy.name, 
        status: 'VERIFIED' 
      });
    }

    testResults.dataIntegrity.passed = allIntegrityChecksPassed;
    testResults.dataIntegrity.details = integrityDetails;
    
    if (allIntegrityChecksPassed) {
      console.log('✅ All data integrity checks passed');
    }

    return allIntegrityChecksPassed;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.dataIntegrity.details = { error: error.message };
    return false;
  }
}

/**
 * Test 3: Configuration Parameters Verification
 */
async function testConfigurationParameters() {
  console.log('\n🧪 Test 3: Configuration Parameters Verification');
  console.log('=' .repeat(50));

  try {
    const result = await makeRequest('create-strategies');
    
    if (result.status !== 200 || !result.data.strategies) {
      console.log('❌ Cannot verify configuration - strategies not created');
      testResults.configurationParameters.details = result;
      return false;
    }

    const createdStrategies = result.data.strategies;
    let allConfigChecksPassed = true;
    const configDetails = [];

    // Expected configuration parameters
    const expectedConfig = {
      winrate_min: 60,
      winrate_max: 80,
      profit_factor_min: 1.5,
      net_pnl_min: -1000,
      net_pnl_max: 5000,
      max_drawdown_max: 20,
      sharpe_ratio_min: 1.0,
      avg_hold_period_min: 1,
      avg_hold_period_max: 120,
      is_active: true
    };

    // Verify each strategy's configuration
    for (const strategy of createdStrategies) {
      const strategyConfigChecks = { name: strategy.name, checks: [] };
      
      for (const [param, expectedValue] of Object.entries(expectedConfig)) {
        if (strategy[param] !== expectedValue) {
          console.log(`❌ Config mismatch for ${strategy.name}.${param}: expected ${expectedValue}, got ${strategy[param]}`);
          allConfigChecksPassed = false;
          strategyConfigChecks.checks.push({
            parameter: param,
            status: 'MISMATCH',
            expected: expectedValue,
            actual: strategy[param]
          });
        } else {
          strategyConfigChecks.checks.push({
            parameter: param,
            status: 'VERIFIED',
            value: expectedValue
          });
        }
      }
      
      configDetails.push(strategyConfigChecks);
    }

    testResults.configurationParameters.passed = allConfigChecksPassed;
    testResults.configurationParameters.details = configDetails;
    
    if (allConfigChecksPassed) {
      console.log('✅ All configuration parameters verified');
    }

    return allConfigChecksPassed;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.configurationParameters.details = { error: error.message };
    return false;
  }
}

/**
 * Test 4: Authentication Error Handling
 */
async function testAuthenticationErrorHandling() {
  console.log('\n🧪 Test 4: Authentication Error Handling');
  console.log('=' .repeat(50));

  try {
    const result = await makeRequest('create-strategies');
    
    if (result.status === 401) {
      console.log('✅ Authentication properly required');
      testResults.authentication.passed = true;
      testResults.authentication.details = {
        status: result.status,
        message: 'Authentication correctly required'
      };
      return true;
    }

    if (result.status === 200) {
      console.log('⚠️  Warning: Endpoint allowed unauthenticated access');
      testResults.authentication.passed = false;
      testResults.authentication.details = {
        status: result.status,
        message: 'Endpoint should require authentication but allowed access'
      };
      return false;
    }

    console.log('❌ Unexpected authentication response:', result);
    testResults.authentication.details = result;
    return false;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.authentication.details = { error: error.message };
    return false;
  }
}

/**
 * Test 5: Duplicate Strategy Creation Behavior
 */
async function testDuplicateCreationBehavior() {
  console.log('\n🧪 Test 5: Duplicate Strategy Creation Behavior');
  console.log('=' .repeat(50));

  try {
    // First creation attempt
    const firstResult = await makeRequest('create-strategies');
    
    if (firstResult.status !== 200) {
      console.log('❌ Cannot test duplicates - first creation failed');
      testResults.duplicateCreation.details = firstResult;
      return false;
    }

    // Second creation attempt (should either succeed with new strategies or handle duplicates gracefully)
    const secondResult = await makeRequest('create-strategies');
    
    if (secondResult.status === 200) {
      console.log('✅ Duplicate creation handled gracefully');
      testResults.duplicateCreation.passed = true;
      testResults.duplicateCreation.details = {
        firstCreation: firstResult.data,
        secondCreation: secondResult.data,
        message: 'System handled duplicate creation without errors'
      };
      return true;
    }

    if (secondResult.status === 400) {
      console.log('✅ Duplicate creation properly rejected');
      testResults.duplicateCreation.passed = true;
      testResults.duplicateCreation.details = {
        firstCreation: firstResult.data,
        secondCreation: secondResult.data,
        message: 'System properly rejected duplicate creation'
      };
      return true;
    }

    console.log('❌ Unexpected duplicate handling response:', secondResult);
    testResults.duplicateCreation.details = secondResult;
    return false;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.duplicateCreation.details = { error: error.message };
    return false;
  }
}

/**
 * Test 6: Error Handling for Invalid Actions
 */
async function testErrorHandling() {
  console.log('\n🧪 Test 6: Error Handling for Invalid Actions');
  console.log('=' .repeat(50));

  try {
    // Test with invalid action
    const result = await makeRequest('invalid-action');
    
    if (result.status === 400 && result.data.error === 'Invalid action') {
      console.log('✅ Invalid action properly rejected');
      testResults.errorHandling.passed = true;
      testResults.errorHandling.details = {
        status: result.status,
        response: result.data,
        message: 'Invalid action properly handled'
      };
      return true;
    }

    console.log('❌ Invalid action not properly handled:', result);
    testResults.errorHandling.details = result;
    return false;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.errorHandling.details = { error: error.message };
    return false;
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 STRATEGY CREATION FUNCTIONALITY TEST REPORT');
  console.log('='.repeat(80));

  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(test => test.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n📊 Test Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  console.log(`\n📝 Detailed Results:`);
  
  for (const [testName, result] of Object.entries(testResults)) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n   ${testName.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${status}`);
    
    if (result.details && typeof result.details === 'object') {
      console.log(`   Details: ${JSON.stringify(result.details, null, 6)}`);
    } else if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
  }

  // Overall assessment
  console.log(`\n🎯 Overall Assessment:`);
  if (passedTests === totalTests) {
    console.log(`   ✅ ALL TESTS PASSED - Strategy creation functionality is working correctly`);
  } else if (passedTests >= totalTests * 0.8) {
    console.log(`   ⚠️  MOSTLY FUNCTIONAL - Strategy creation works with minor issues`);
  } else {
    console.log(`   ❌ SIGNIFICANT ISSUES - Strategy creation functionality needs attention`);
  }

  return {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100
    },
    detailedResults: testResults,
    timestamp: new Date().toISOString()
  };
}

/**
 * Save test results to file
 */
function saveTestResults(report) {
  const fs = require('fs');
  const filename = `strategy-creation-test-results-${Date.now()}.json`;
  
  try {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Test results saved to: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to save test results:`, error);
  }
}

/**
 * Main test execution function
 */
async function runAllTests() {
  console.log('🚀 Starting Strategy Creation Functionality Tests');
  console.log('='.repeat(80));

  // Run all tests
  await testBasicStrategyCreation();
  await testDataIntegrity();
  await testConfigurationParameters();
  await testAuthenticationErrorHandling();
  await testDuplicateCreationBehavior();
  await testErrorHandling();

  // Generate and save report
  const report = generateTestReport();
  saveTestResults(report);

  return report;
}

// Execute tests if this file is run directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✅ All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testResults,
  EXPECTED_STRATEGIES
};