const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with anon key (like a real user)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test results tracking
const testResults = [];

function addTestResult(testName, passed, details, duration) {
  const result = {
    testName,
    passed,
    details,
    duration,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (duration) {
    console.log(`   Duration: ${duration}ms`);
  }
  console.log('');
}

async function simulateUserLogin() {
  console.log('🔐 Simulating user login...');
  
  // Try to get current user first
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (user && !userError) {
    console.log(`✅ Already logged in as: ${user.email}`);
    return user;
  }
  
  // If no user, try to sign in with test credentials
  // Note: This would need actual test user credentials
  console.log('⚠️  No active user session found');
  console.log('💡 For full testing, please ensure you are logged into the application');
  console.log('   or provide test user credentials');
  
  return null;
}

async function testTradeFormStrategyLoading() {
  console.log('📋 Testing TradeForm Strategy Loading...');
  const startTime = Date.now();
  
  try {
    // Simulate the exact query TradeForm uses
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      addTestResult('TradeForm Strategy Loading', false, 'No authenticated user', Date.now() - startTime);
      return;
    }
    
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(100);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        addTestResult('TradeForm Strategy Loading', false, 
          `strategy_rule_compliance error: ${error.message}`, duration);
      } else {
        addTestResult('TradeForm Strategy Loading', false, 
          `Other error: ${error.message}`, duration);
      }
    } else {
      addTestResult('TradeForm Strategy Loading', true, 
        `Successfully loaded ${data.length} strategies for TradeForm`, duration);
    }
  } catch (error) {
    addTestResult('TradeForm Strategy Loading', false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

async function testStrategiesPageLoading() {
  console.log('📄 Testing Strategies Page Loading...');
  const startTime = Date.now();
  
  try {
    // Simulate the exact query strategies page uses
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      addTestResult('Strategies Page Loading', false, 'No authenticated user', Date.now() - startTime);
      return;
    }
    
    // This simulates getStrategiesWithStats function
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    const duration = Date.now() - startTime;
    
    if (strategiesError) {
      if (strategiesError.message.includes('strategy_rule_compliance')) {
        addTestResult('Strategies Page Loading', false, 
          `strategy_rule_compliance error: ${strategiesError.message}`, duration);
      } else {
        addTestResult('Strategies Page Loading', false, 
          `Other error: ${strategiesError.message}`, duration);
      }
    } else {
      addTestResult('Strategies Page Loading', true, 
        `Successfully loaded ${strategies.length} strategies for page`, duration);
      
      // Test strategy stats calculation for each strategy
      for (const strategy of strategies.slice(0, 3)) { // Test first 3
        await testStrategyStatsCalculation(strategy.id);
      }
    }
  } catch (error) {
    addTestResult('Strategies Page Loading', false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

async function testStrategyStatsCalculation(strategyId) {
  console.log(`📊 Testing Strategy Stats Calculation for ${strategyId}...`);
  const startTime = Date.now();
  
  try {
    // Simulate calculateStrategyStats function
    const { data: trades, error } = await supabase
      .from('trades')
      .select('pnl, entry_time, exit_time, trade_date')
      .eq('strategy_id', strategyId)
      .not('pnl', 'is', null)
      .order('trade_date, entry_time');
    
    const duration = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        addTestResult(`Strategy Stats Calculation (${strategyId})`, false, 
          `strategy_rule_compliance error: ${error.message}`, duration);
      } else {
        addTestResult(`Strategy Stats Calculation (${strategyId})`, false, 
          `Other error: ${error.message}`, duration);
      }
    } else {
      addTestResult(`Strategy Stats Calculation (${strategyId})`, true, 
        `Successfully calculated stats for ${trades.length} trades`, duration);
    }
  } catch (error) {
    addTestResult(`Strategy Stats Calculation (${strategyId})`, false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

async function testStrategyCreation() {
  console.log('➕ Testing Strategy Creation...');
  const startTime = Date.now();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      addTestResult('Strategy Creation', false, 'No authenticated user', Date.now() - startTime);
      return;
    }
    
    const testStrategy = {
      user_id: user.id,
      name: `Test Strategy ${Date.now()}`,
      description: 'Test strategy for user experience verification',
      rules: ['Test rule 1', 'Test rule 2'],
      is_active: true
    };
    
    const { data, error } = await supabase
      .from('strategies')
      .insert(testStrategy)
      .select('id, name')
      .single();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        addTestResult('Strategy Creation', false, 
          `strategy_rule_compliance error: ${error.message}`, duration);
      } else {
        addTestResult('Strategy Creation', false, 
          `Other error: ${error.message}`, duration);
      }
    } else {
      addTestResult('Strategy Creation', true, 
        `Successfully created strategy: ${data.name}`, duration);
      
      // Clean up - delete the test strategy
      await supabase
        .from('strategies')
        .delete()
        .eq('id', data.id);
    }
  } catch (error) {
    addTestResult('Strategy Creation', false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

async function testStrategyRulesQuery() {
  console.log('📝 Testing Strategy Rules Query...');
  const startTime = Date.now();
  
  try {
    // Test strategy_rules table query
    const { data, error } = await supabase
      .from('strategy_rules')
      .select('id, rule_type, rule_value, is_checked')
      .limit(10);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        addTestResult('Strategy Rules Query', false, 
          `strategy_rule_compliance error: ${error.message}`, duration);
      } else {
        addTestResult('Strategy Rules Query', false, 
          `Other error: ${error.message}`, duration);
      }
    } else {
      addTestResult('Strategy Rules Query', true, 
        `Successfully queried ${data.length} strategy rules`, duration);
    }
  } catch (error) {
    addTestResult('Strategy Rules Query', false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

async function testDashboardStrategyQuery() {
  console.log('📈 Testing Dashboard Strategy Query...');
  const startTime = Date.now();
  
  try {
    // Simulate dashboard strategy query
    const { data, error } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(5);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        addTestResult('Dashboard Strategy Query', false, 
          `strategy_rule_compliance error: ${error.message}`, duration);
      } else {
        addTestResult('Dashboard Strategy Query', false, 
          `Other error: ${error.message}`, duration);
      }
    } else {
      addTestResult('Dashboard Strategy Query', true, 
        `Successfully queried ${data.length} strategies for dashboard`, duration);
    }
  } catch (error) {
    addTestResult('Dashboard Strategy Query', false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

async function testComplexStrategyQuery() {
  console.log('🔍 Testing Complex Strategy Query...');
  const startTime = Date.now();
  
  try {
    // Test a more complex query with joins and filters
    const { data, error } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        trades:trades(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      if (error.message.includes('strategy_rule_compliance')) {
        addTestResult('Complex Strategy Query', false, 
          `strategy_rule_compliance error: ${error.message}`, duration);
      } else {
        addTestResult('Complex Strategy Query', false, 
          `Other error: ${error.message}`, duration);
      }
    } else {
      addTestResult('Complex Strategy Query', true, 
        `Successfully executed complex query for ${data.length} strategies`, duration);
    }
  } catch (error) {
    addTestResult('Complex Strategy Query', false, 
      `Exception: ${error.message}`, Date.now() - startTime);
  }
}

function generateReport() {
  console.log('');
  console.log('========================================');
  console.log('USER EXPERIENCE TEST REPORT');
  console.log('========================================');
  console.log('');
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const failedTests = totalTests - passedTests;
  
  console.log(`📊 Test Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');
  
  if (failedTests > 0) {
    console.log('❌ FAILED TESTS:');
    testResults
      .filter(t => !t.passed)
      .forEach(test => {
        console.log(`   • ${test.testName}`);
        console.log(`     ${test.details}`);
      });
    console.log('');
  }
  
  const strategyRuleComplianceErrors = testResults.filter(t => 
    !t.passed && t.details.includes('strategy_rule_compliance')
  ).length;
  
  if (strategyRuleComplianceErrors > 0) {
    console.log('🚨 STRATEGY_RULE_COMPLIANCE ERRORS DETECTED:');
    console.log(`   Found ${strategyRuleComplianceErrors} tests with strategy_rule_compliance errors`);
    console.log('   This indicates the schema fix may not have been applied correctly');
    console.log('   Please run the SIMPLE_STRATEGY_SCHEMA_FIX.sql script');
  } else {
    console.log('✅ NO STRATEGY_RULE_COMPLIANCE ERRORS DETECTED');
    console.log('   The schema fix appears to be working correctly');
  }
  
  console.log('');
  console.log('📋 DETAILED RESULTS:');
  testResults.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.testName} (${test.duration}ms)`);
  });
  
  console.log('');
  console.log('========================================');
  console.log('RECOMMENDATIONS');
  console.log('========================================');
  
  if (strategyRuleComplianceErrors === 0 && failedTests === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('The strategy_rule_compliance schema issue has been resolved.');
    console.log('Users should now be able to:');
    console.log('• View strategies in TradeForm dropdown');
    console.log('• Access the Strategies page');
    console.log('• Create and edit strategies');
    console.log('• View strategy statistics and performance');
  } else if (strategyRuleComplianceErrors > 0) {
    console.log('⚠️  SCHEMA FIX REQUIRED:');
    console.log('');
    console.log('1. Run SIMPLE_STRATEGY_SCHEMA_FIX.sql in Supabase SQL Editor');
    console.log('2. Wait 2-3 minutes for cache to clear');
    console.log('3. Run this test again');
  } else {
    console.log('⚠️  OTHER ISSUES DETECTED:');
    console.log('');
    console.log('Review the failed tests above for specific error details.');
    console.log('These may be unrelated to the strategy_rule_compliance issue.');
  }
}

// Main execution
async function runUserExperienceTests() {
  console.log('🧪 Starting Comprehensive User Experience Tests...');
  console.log('📍 Testing exact scenarios that were failing for users');
  console.log('');
  
  // Simulate user login
  await simulateUserLogin();
  console.log('');
  
  // Test all the scenarios that were failing
  await testTradeFormStrategyLoading();
  await testStrategiesPageLoading();
  await testStrategyCreation();
  await testStrategyRulesQuery();
  await testDashboardStrategyQuery();
  await testComplexStrategyQuery();
  
  // Generate comprehensive report
  generateReport();
}

// Run the tests
runUserExperienceTests().catch(console.error);