/**
 * Strategy Creation Test with Authentication
 * 
 * This script tests the strategy creation functionality by:
 * 1. Authenticating with the test user
 * 2. Testing strategy creation
 * 3. Verifying data integrity
 * 4. Testing duplicate handling
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const cleanLine = line.trim().replace(/^["']|["']$/g, '');
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test configuration
const TEST_EMAIL = 'testuser@verotrade.com';
const TEST_PASSWORD = 'TestPassword123!';
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
  authentication: { passed: false, details: null },
  basicCreation: { passed: false, details: null },
  dataIntegrity: { passed: false, details: null },
  configurationParameters: { passed: false, details: null },
  duplicateCreation: { passed: false, details: null },
  errorHandling: { passed: false, details: null }
};

/**
 * Authenticate and get session
 */
async function authenticate() {
  console.log('\n🔐 Step 1: Authenticating test user...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      console.log(`❌ Authentication failed: ${error.message}`);
      testResults.authentication.details = { error: error.message };
      return null;
    }
    
    console.log('✅ Authentication successful');
    console.log(`👤 User ID: ${data.user.id}`);
    console.log(`📧 Email: ${data.user.email}`);
    console.log(`🎫 Session: ${data.session ? 'VALID' : 'INVALID'}`);
    
    testResults.authentication.passed = true;
    testResults.authentication.details = {
      userId: data.user.id,
      email: data.user.email,
      sessionValid: !!data.session
    };
    
    return data.session;
  } catch (error) {
    console.error('❌ Authentication exception:', error.message);
    testResults.authentication.details = { error: error.message };
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(session, action) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };

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
 * Test basic strategy creation
 */
async function testBasicStrategyCreation(session) {
  console.log('\n📈 Step 2: Testing basic strategy creation...');
  
  try {
    const result = await makeAuthenticatedRequest(session, 'create-strategies');
    
    if (result.status === 200 && result.data.strategies) {
      console.log(`✅ Successfully created ${result.data.strategies.length} strategies`);
      testResults.basicCreation.passed = true;
      testResults.basicCreation.details = result.data;
      return result.data.strategies;
    } else {
      console.log('❌ Strategy creation failed:', result);
      testResults.basicCreation.details = result;
      return null;
    }
  } catch (error) {
    console.error('❌ Basic creation test failed:', error);
    testResults.basicCreation.details = { error: error.message };
    return null;
  }
}

/**
 * Test data integrity
 */
async function testDataIntegrity(strategies) {
  console.log('\n🔍 Step 3: Testing data integrity...');
  
  if (!strategies) {
    console.log('❌ Cannot test data integrity - no strategies provided');
    testResults.dataIntegrity.details = { error: 'No strategies to test' };
    return false;
  }

  let allTestsPassed = true;
  const integrityDetails = [];

  // Check strategy count
  if (strategies.length !== EXPECTED_STRATEGIES.length) {
    console.log(`❌ Expected ${EXPECTED_STRATEGIES.length} strategies, got ${strategies.length}`);
    allTestsPassed = false;
    integrityDetails.push({
      test: 'strategy_count',
      status: 'FAILED',
      expected: EXPECTED_STRATEGIES.length,
      actual: strategies.length
    });
  } else {
    console.log('✅ Correct number of strategies created');
    integrityDetails.push({
      test: 'strategy_count',
      status: 'PASSED',
      expected: EXPECTED_STRATEGIES.length,
      actual: strategies.length
    });
  }

  // Verify each strategy
  for (const expectedStrategy of EXPECTED_STRATEGIES) {
    const createdStrategy = strategies.find(s => s.name === expectedStrategy.name);
    
    if (!createdStrategy) {
      console.log(`❌ Missing strategy: ${expectedStrategy.name}`);
      allTestsPassed = false;
      integrityDetails.push({
        test: `strategy_exists_${expectedStrategy.name}`,
        status: 'FAILED',
        expected: expectedStrategy.name,
        actual: 'MISSING'
      });
      continue;
    }

    // Check description
    if (createdStrategy.description !== expectedStrategy.description) {
      console.log(`❌ Description mismatch for ${expectedStrategy.name}`);
      allTestsPassed = false;
      integrityDetails.push({
        test: `description_${expectedStrategy.name}`,
        status: 'FAILED',
        expected: expectedStrategy.description,
        actual: createdStrategy.description
      });
    } else {
      integrityDetails.push({
        test: `description_${expectedStrategy.name}`,
        status: 'PASSED',
        value: createdStrategy.description
      });
    }

    // Check rules count
    if (!createdStrategy.rules || createdStrategy.rules.length !== expectedStrategy.rulesCount) {
      console.log(`❌ Rules count mismatch for ${expectedStrategy.name}`);
      allTestsPassed = false;
      integrityDetails.push({
        test: `rules_count_${expectedStrategy.name}`,
        status: 'FAILED',
        expected: expectedStrategy.rulesCount,
        actual: createdStrategy.rules ? createdStrategy.rules.length : 0
      });
    } else {
      integrityDetails.push({
        test: `rules_count_${expectedStrategy.name}`,
        status: 'PASSED',
        value: createdStrategy.rules.length
      });
    }

    console.log(`✅ Strategy verified: ${expectedStrategy.name}`);
  }

  testResults.dataIntegrity.passed = allTestsPassed;
  testResults.dataIntegrity.details = integrityDetails;
  
  return allTestsPassed;
}

/**
 * Test configuration parameters
 */
async function testConfigurationParameters(strategies) {
  console.log('\n⚙️ Step 4: Testing configuration parameters...');
  
  if (!strategies) {
    console.log('❌ Cannot test configuration - no strategies provided');
    testResults.configurationParameters.details = { error: 'No strategies to test' };
    return false;
  }

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

  let allTestsPassed = true;
  const configDetails = [];

  for (const strategy of strategies) {
    for (const [param, expectedValue] of Object.entries(expectedConfig)) {
      if (strategy[param] !== expectedValue) {
        console.log(`❌ Config mismatch for ${strategy.name}.${param}: expected ${expectedValue}, got ${strategy[param]}`);
        allTestsPassed = false;
        configDetails.push({
          strategy: strategy.name,
          parameter: param,
          status: 'FAILED',
          expected: expectedValue,
          actual: strategy[param]
        });
      } else {
        configDetails.push({
          strategy: strategy.name,
          parameter: param,
          status: 'PASSED',
          value: expectedValue
        });
      }
    }
  }

  testResults.configurationParameters.passed = allTestsPassed;
  testResults.configurationParameters.details = configDetails;
  
  if (allTestsPassed) {
    console.log('✅ All configuration parameters verified');
  }
  
  return allTestsPassed;
}

/**
 * Test duplicate creation behavior
 */
async function testDuplicateCreation(session) {
  console.log('\n🔄 Step 5: Testing duplicate creation behavior...');
  
  try {
    const result = await makeAuthenticatedRequest(session, 'create-strategies');
    
    if (result.status === 200) {
      console.log('✅ Duplicate creation handled gracefully');
      testResults.duplicateCreation.passed = true;
      testResults.duplicateCreation.details = {
        status: result.status,
        message: 'System handled duplicate creation without errors',
        data: result.data
      };
      return true;
    } else if (result.status === 400) {
      console.log('✅ Duplicate creation properly rejected');
      testResults.duplicateCreation.passed = true;
      testResults.duplicateCreation.details = {
        status: result.status,
        message: 'System properly rejected duplicate creation',
        data: result.data
      };
      return true;
    } else {
      console.log('❌ Unexpected duplicate handling response:', result);
      testResults.duplicateCreation.details = result;
      return false;
    }
  } catch (error) {
    console.error('❌ Duplicate test failed:', error);
    testResults.duplicateCreation.details = { error: error.message };
    return false;
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(session) {
  console.log('\n⚠️ Step 6: Testing error handling...');
  
  try {
    const result = await makeAuthenticatedRequest(session, 'invalid-action');
    
    if (result.status === 400 && result.data.error === 'Invalid action') {
      console.log('✅ Invalid action properly rejected');
      testResults.errorHandling.passed = true;
      testResults.errorHandling.details = {
        status: result.status,
        message: 'Invalid action properly handled',
        data: result.data
      };
      return true;
    } else {
      console.log('❌ Invalid action not properly handled:', result);
      testResults.errorHandling.details = result;
      return false;
    }
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
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
  const filename = `strategy-creation-auth-test-results-${Date.now()}.json`;
  
  try {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Test results saved to: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to save test results:`, error);
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting Strategy Creation Functionality Tests with Authentication');
  console.log('='.repeat(80));

  // Step 1: Authenticate
  const session = await authenticate();
  if (!session) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    return generateTestReport();
  }

  // Step 2: Test basic strategy creation
  const strategies = await testBasicStrategyCreation(session);

  // Step 3: Test data integrity
  if (strategies) {
    await testDataIntegrity(strategies);
    await testConfigurationParameters(strategies);
  }

  // Step 4: Test duplicate creation
  await testDuplicateCreation(session);

  // Step 5: Test error handling
  await testErrorHandling(session);

  // Generate and save report
  const report = generateTestReport();
  saveTestResults(report);

  return report;
}

// Execute tests
runAllTests()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });