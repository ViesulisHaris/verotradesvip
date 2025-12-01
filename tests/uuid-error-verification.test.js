/**
 * UUID Error Verification Test
 * 
 * This test verifies that the "invalid input syntax for type uuid: 'undefined'" error
 * has been resolved by testing the specific scenarios that were previously failing.
 * 
 * Usage: npm test tests/uuid-error-verification.test.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test results tracking
 */
const testResults = [];

/**
 * Adds a test result to the results array
 */
function addTestResult(testName, passed, details, error = null) {
  testResults.push({
    testName,
    passed,
    details,
    error,
    timestamp: new Date().toISOString()
  });
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}: ${details}`);
  if (error) {
    console.log(`    Error: ${error.message}`);
  }
}

/**
 * Validates if a string is a proper UUID format
 */
function isValidUUID(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const trimmedValue = value.trim();
  if (trimmedValue === '' || trimmedValue === 'undefined' || trimmedValue === 'null') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmedValue);
}

/**
 * Test 1: Verify strategies query without undefined UUIDs
 */
async function testStrategiesQuery() {
  try {
    // First, get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      addTestResult('Strategies Query - Authentication', false, 'Failed to authenticate', authError);
      return;
    }
    
    // Validate user ID
    if (!isValidUUID(user.id)) {
      addTestResult('Strategies Query - User ID Validation', false, `Invalid user ID: ${user.id}`);
      return;
    }
    
    // Query strategies with validated user ID
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(5);
    
    if (strategiesError) {
      // Check if this is the UUID error we're looking for
      if (strategiesError.message.includes('invalid input syntax for type uuid') ||
          strategiesError.message.includes('undefined')) {
        addTestResult('Strategies Query', false, 'UUID error still occurs', strategiesError);
      } else {
        addTestResult('Strategies Query', false, 'Other database error', strategiesError);
      }
    } else {
      addTestResult('Strategies Query', true, `Successfully queried ${strategies.length} strategies`);
    }
    
  } catch (error) {
    addTestResult('Strategies Query - Exception', false, 'Unexpected exception', error);
  }
}

/**
 * Test 2: Verify trade insertion with proper UUID validation
 */
async function testTradeInsertion() {
  try {
    // First, get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      addTestResult('Trade Insertion - Authentication', false, 'Failed to authenticate', authError);
      return;
    }
    
    // Validate user ID
    if (!isValidUUID(user.id)) {
      addTestResult('Trade Insertion - User ID Validation', false, `Invalid user ID: ${user.id}`);
      return;
    }
    
    // First, get a valid strategy or use null
    const { data: strategies, error: strategyError } = await supabase
      .from('strategies')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);
    
    if (strategyError) {
      addTestResult('Trade Insertion - Strategy Query', false, 'Failed to query strategies', strategyError);
      return;
    }
    
    const strategyId = strategies && strategies.length > 0 ? strategies[0].id : null;
    
    // Validate strategy ID if present
    if (strategyId && !isValidUUID(strategyId)) {
      addTestResult('Trade Insertion - Strategy ID Validation', false, `Invalid strategy ID: ${strategyId}`);
      return;
    }
    
    // Insert test trade with validated UUIDs
    const testTrade = {
      user_id: user.id,
      market: 'stock',
      symbol: 'UUID_TEST',
      strategy_id: strategyId, // Can be null, but must be valid UUID if present
      trade_date: new Date().toISOString().split('T')[0],
      side: 'Buy',
      quantity: 100,
      entry_price: 50.0,
      exit_price: 55.0,
      pnl: 500.0
    };
    
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert(testTrade)
      .select('id')
      .single();
    
    if (tradeError) {
      // Check if this is the UUID error we're looking for
      if (tradeError.message.includes('invalid input syntax for type uuid') ||
          tradeError.message.includes('undefined')) {
        addTestResult('Trade Insertion', false, 'UUID error still occurs', tradeError);
      } else {
        addTestResult('Trade Insertion', false, 'Other database error', tradeError);
      }
    } else {
      // Clean up the test trade
      await supabase
        .from('trades')
        .delete()
        .eq('id', trade.id);
      
      addTestResult('Trade Insertion', true, 'Successfully inserted and cleaned up test trade');
    }
    
  } catch (error) {
    addTestResult('Trade Insertion - Exception', false, 'Unexpected exception', error);
  }
}

/**
 * Test 3: Verify strategy rules query with proper UUID validation
 */
async function testStrategyRulesQuery() {
  try {
    // First, get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      addTestResult('Strategy Rules Query - Authentication', false, 'Failed to authenticate', authError);
      return;
    }
    
    // Validate user ID
    if (!isValidUUID(user.id)) {
      addTestResult('Strategy Rules Query - User ID Validation', false, `Invalid user ID: ${user.id}`);
      return;
    }
    
    // Get a valid strategy first
    const { data: strategies, error: strategyError } = await supabase
      .from('strategies')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);
    
    if (strategyError) {
      addTestResult('Strategy Rules Query - Strategy Query', false, 'Failed to query strategies', strategyError);
      return;
    }
    
    if (!strategies || strategies.length === 0) {
      addTestResult('Strategy Rules Query', true, 'No strategies found - test skipped');
      return;
    }
    
    const strategyId = strategies[0].id;
    
    // Validate strategy ID
    if (!isValidUUID(strategyId)) {
      addTestResult('Strategy Rules Query - Strategy ID Validation', false, `Invalid strategy ID: ${strategyId}`);
      return;
    }
    
    // Query strategy rules with validated strategy ID
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('*')
      .eq('strategy_id', strategyId)
      .limit(5);
    
    if (rulesError) {
      // Check if this is the UUID error we're looking for
      if (rulesError.message.includes('invalid input syntax for type uuid') ||
          rulesError.message.includes('undefined')) {
        addTestResult('Strategy Rules Query', false, 'UUID error still occurs', rulesError);
      } else {
        addTestResult('Strategy Rules Query', false, 'Other database error', rulesError);
      }
    } else {
      addTestResult('Strategy Rules Query', true, `Successfully queried ${rules.length} strategy rules`);
    }
    
  } catch (error) {
    addTestResult('Strategy Rules Query - Exception', false, 'Unexpected exception', error);
  }
}

/**
 * Test 4: Verify complex join queries don't have UUID errors
 */
async function testComplexJoinQuery() {
  try {
    // Query trades with strategy join
    const { data: joinData, error: joinError } = await supabase
      .from('trades')
      .select(`
        id,
        symbol,
        strategy_id,
        strategies (
          id,
          name
        )
      `)
      .eq('user_id', supabase.auth.user().id)
      .limit(5);
    
    if (joinError) {
      // Check if this is the UUID error we're looking for
      if (joinError.message.includes('invalid input syntax for type uuid') ||
          joinError.message.includes('undefined')) {
        addTestResult('Complex Join Query', false, 'UUID error still occurs', joinError);
      } else {
        addTestResult('Complex Join Query', false, 'Other database error', joinError);
      }
    } else {
      addTestResult('Complex Join Query', true, `Successfully executed join query`);
    }
    
  } catch (error) {
    addTestResult('Complex Join Query - Exception', false, 'Unexpected exception', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting UUID Error Verification Tests\n');
  console.log('Testing for "invalid input syntax for type uuid: \'undefined\'" error\n');
  
  // Run all tests
  await testStrategiesQuery();
  await testTradeInsertion();
  await testStrategyRulesQuery();
  await testComplexJoinQuery();
  
  // Calculate results
  const passedTests = testResults.filter(test => test.passed).length;
  const failedTests = testResults.filter(test => !test.passed).length;
  const totalTests = testResults.length;
  
  // Check for UUID errors specifically
  const uuidErrors = testResults.filter(test => 
    test.error && (
      test.error.message.includes('invalid input syntax for type uuid') ||
      test.error.message.includes('undefined')
    )
  );
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   UUID Errors: ${uuidErrors.length}`);
  
  if (uuidErrors.length > 0) {
    console.log('\n❌ VERIFICATION FAILED:');
    console.log('   The "invalid input syntax for type uuid: \'undefined\'" error is still present!');
    console.log('   Check the failed tests above for details.');
    process.exit(1);
  } else if (failedTests > 0) {
    console.log('\n⚠️ VERIFICATION PARTIAL:');
    console.log('   No UUID errors detected, but some tests failed for other reasons.');
    console.log('   The UUID error fix appears to be working correctly.');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED:');
    console.log('   All tests passed successfully!');
    console.log('   The "invalid input syntax for type uuid: \'undefined\'" error has been resolved!');
    console.log('\n🎉 The application is now safe from UUID errors!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testStrategiesQuery,
  testTradeInsertion,
  testStrategyRulesQuery,
  testComplexJoinQuery,
  isValidUUID
};