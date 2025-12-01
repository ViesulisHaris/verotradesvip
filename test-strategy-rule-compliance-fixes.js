const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStrategyRuleComplianceFixes() {
  console.log('🧪 Testing strategy_rule_compliance fixes...\n');
  
  const results = {
    tests: [],
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Test 1: Check if strategy_rule_compliance table exists
  console.log('🔍 Test 1: Checking if strategy_rule_compliance table exists...');
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategy_rule_compliance')
      .eq('table_schema', 'public');
    
    if (tableError) {
      if (tableError.message?.includes('strategy_rule_compliance') || 
          tableError.message?.includes('schema cache')) {
        results.errors.push(`Schema cache error detected: ${tableError.message}`);
        results.tests.push({
          name: 'Strategy Rule Compliance Table Check',
          status: 'FAILED',
          details: `Schema cache error: ${tableError.message}`,
          isCacheError: true
        });
        results.failed++;
      } else {
        results.errors.push(`Unexpected error checking table: ${tableError.message}`);
        results.tests.push({
          name: 'Strategy Rule Compliance Table Check',
          status: 'ERROR',
          details: `Unexpected error: ${tableError.message}`
        });
        results.failed++;
      }
    } else if (tableCheck && tableCheck.length > 0) {
      results.errors.push('strategy_rule_compliance table still exists!');
      results.tests.push({
        name: 'Strategy Rule Compliance Table Check',
        status: 'FAILED',
        details: 'Table still exists in database'
      });
      results.failed++;
    } else {
      results.tests.push({
        name: 'Strategy Rule Compliance Table Check',
        status: 'PASSED',
        details: 'Table correctly removed from database'
      });
      results.passed++;
    }
  } catch (error) {
    results.errors.push(`Exception in table check: ${error.message}`);
    results.tests.push({
      name: 'Strategy Rule Compliance Table Check',
      status: 'ERROR',
      details: `Exception: ${error.message}`
    });
    results.failed++;
  }
  
  // Test 2: Test strategies table access
  console.log('🔍 Test 2: Testing strategies table access...');
  try {
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, user_id')
      .limit(5);
    
    if (strategiesError) {
      if (strategiesError.message?.includes('strategy_rule_compliance') || 
          strategiesError.message?.includes('schema cache')) {
        results.errors.push(`Strategies access cache error: ${strategiesError.message}`);
        results.tests.push({
          name: 'Strategies Table Access',
          status: 'FAILED',
          details: `Schema cache error: ${strategiesError.message}`,
          isCacheError: true
        });
        results.failed++;
      } else {
        results.errors.push(`Strategies access error: ${strategiesError.message}`);
        results.tests.push({
          name: 'Strategies Table Access',
          status: 'FAILED',
          details: `Error: ${strategiesError.message}`
        });
        results.failed++;
      }
    } else {
      results.tests.push({
        name: 'Strategies Table Access',
        status: 'PASSED',
        details: `Successfully accessed strategies table, found ${strategies.length} strategies`
      });
      results.passed++;
    }
  } catch (error) {
    results.errors.push(`Exception in strategies access: ${error.message}`);
    results.tests.push({
      name: 'Strategies Table Access',
      status: 'ERROR',
      details: `Exception: ${error.message}`
    });
    results.failed++;
  }
  
  // Test 3: Test strategy rules access
  console.log('🔍 Test 3: Testing strategy_rules table access...');
  try {
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('id, rule_text, strategy_id')
      .limit(5);
    
    if (rulesError) {
      if (rulesError.message?.includes('strategy_rule_compliance') || 
          rulesError.message?.includes('schema cache')) {
        results.errors.push(`Strategy rules access cache error: ${rulesError.message}`);
        results.tests.push({
          name: 'Strategy Rules Table Access',
          status: 'FAILED',
          details: `Schema cache error: ${rulesError.message}`,
          isCacheError: true
        });
        results.failed++;
      } else {
        results.errors.push(`Strategy rules access error: ${rulesError.message}`);
        results.tests.push({
          name: 'Strategy Rules Table Access',
          status: 'FAILED',
          details: `Error: ${rulesError.message}`
        });
        results.failed++;
      }
    } else {
      results.tests.push({
        name: 'Strategy Rules Table Access',
        status: 'PASSED',
        details: `Successfully accessed strategy_rules table, found ${rules.length} rules`
      });
      results.passed++;
    }
  } catch (error) {
    results.errors.push(`Exception in strategy rules access: ${error.message}`);
    results.tests.push({
      name: 'Strategy Rules Table Access',
      status: 'ERROR',
      details: `Exception: ${error.message}`
    });
    results.failed++;
  }
  
  // Test 4: Test trades table with strategy selection
  console.log('🔍 Test 4: Testing trades table with strategy selection...');
  try {
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, strategy_id, symbol')
      .limit(5);
    
    if (tradesError) {
      if (tradesError.message?.includes('strategy_rule_compliance') || 
          tradesError.message?.includes('schema cache')) {
        results.errors.push(`Trades access cache error: ${tradesError.message}`);
        results.tests.push({
          name: 'Trades Table Access',
          status: 'FAILED',
          details: `Schema cache error: ${tradesError.message}`,
          isCacheError: true
        });
        results.failed++;
      } else {
        results.errors.push(`Trades access error: ${tradesError.message}`);
        results.tests.push({
          name: 'Trades Table Access',
          status: 'FAILED',
          details: `Error: ${tradesError.message}`
        });
        results.failed++;
      }
    } else {
      results.tests.push({
        name: 'Trades Table Access',
        status: 'PASSED',
        details: `Successfully accessed trades table, found ${trades.length} trades`
      });
      results.passed++;
    }
  } catch (error) {
    results.errors.push(`Exception in trades access: ${error.message}`);
    results.tests.push({
      name: 'Trades Table Access',
      status: 'ERROR',
      details: `Exception: ${error.message}`
    });
    results.failed++;
  }
  
  // Test 5: Test information_schema access
  console.log('🔍 Test 5: Testing information_schema access...');
  try {
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);
    
    if (schemaError) {
      if (schemaError.message?.includes('strategy_rule_compliance') || 
          schemaError.message?.includes('schema cache')) {
        results.errors.push(`Information schema access cache error: ${schemaError.message}`);
        results.tests.push({
          name: 'Information Schema Access',
          status: 'FAILED',
          details: `Schema cache error: ${schemaError.message}`,
          isCacheError: true
        });
        results.failed++;
      } else {
        results.errors.push(`Information schema access error: ${schemaError.message}`);
        results.tests.push({
          name: 'Information Schema Access',
          status: 'FAILED',
          details: `Error: ${schemaError.message}`
        });
        results.failed++;
      }
    } else {
      results.tests.push({
        name: 'Information Schema Access',
        status: 'PASSED',
        details: `Successfully accessed information_schema, found ${schemaInfo.length} tables`
      });
      results.passed++;
    }
  } catch (error) {
    results.errors.push(`Exception in information schema access: ${error.message}`);
    results.tests.push({
      name: 'Information Schema Access',
      status: 'ERROR',
      details: `Exception: ${error.message}`
    });
    results.failed++;
  }
  
  // Calculate success rate
  const totalTests = results.passed + results.failed;
  const successRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : '0.0';
  
  // Print results
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  results.tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Status: ${test.status}`);
    console.log(`   Details: ${test.details}`);
    if (test.isCacheError) {
      console.log(`   ⚠️  Cache-related error detected`);
    }
  });
  
  // Determine overall result
  const allPassed = results.failed === 0;
  const hasCacheErrors = results.tests.some(test => test.isCacheError);
  
  console.log('\n🎯 OVERALL ASSESSMENT:');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - strategy_rule_compliance issue appears to be resolved!');
  } else if (hasCacheErrors) {
    console.log('⚠️  CACHE ERRORS DETECTED - Schema cache issues may still be present');
    console.log('💡 Recommendation: Try clearing browser cache and restarting application');
  } else {
    console.log('❌ TESTS FAILED - Other issues detected that need attention');
  }
  
  return {
    success: allPassed,
    hasCacheErrors,
    results
  };
}

// Run the tests
testStrategyRuleComplianceFixes()
  .then(result => {
    console.log('\n🏁 Test completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });