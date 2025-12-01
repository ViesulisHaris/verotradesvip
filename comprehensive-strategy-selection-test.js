const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role for comprehensive testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED ${details ? '- ' + details : ''}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED ${details ? '- ' + details : ''}`);
  }
  testResults.details.push({ testName, passed, details });
}

// Helper function to check for strategy_rule_compliance errors
function checkForComplianceError(error) {
  return error && (
    error.message?.includes('strategy_rule_compliance') ||
    error.details?.includes('strategy_rule_compliance') ||
    error.hint?.includes('strategy_rule_compliance')
  );
}

async function testStrategySelectionFunctionality() {
  console.log('🔍 COMPREHENSIVE STRATEGY SELECTION TEST AFTER CACHE CLEAR\n');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: Verify strategy_rule_compliance table does not exist
    console.log('\n📋 TEST 1: Verify strategy_rule_compliance table does not exist');
    console.log('-'.repeat(60));
    
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'strategy_rule_compliance');
      
      if (tablesError) {
        logTest('Check strategy_rule_compliance table existence', false, tablesError.message);
      } else {
        const tableExists = tables && tables.length > 0;
        logTest('Verify strategy_rule_compliance table does not exist', !tableExists, 
          tableExists ? 'Table still exists!' : 'Table correctly removed');
      }
    } catch (error) {
      logTest('Check strategy_rule_compliance table existence', false, error.message);
    }

    // Test 2: Test basic strategies query
    console.log('\n📋 TEST 2: Test basic strategies query');
    console.log('-'.repeat(60));
    
    try {
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .limit(10);
      
      if (strategiesError) {
        const hasComplianceError = checkForComplianceError(strategiesError);
        logTest('Basic strategies query', false, 
          hasComplianceError ? 'strategy_rule_compliance error detected!' : strategiesError.message);
      } else {
        logTest('Basic strategies query', true, `Found ${strategies?.length || 0} strategies`);
      }
    } catch (error) {
      logTest('Basic strategies query', false, error.message);
    }

    // Test 3: Test strategy rules query
    console.log('\n📋 TEST 3: Test strategy rules query');
    console.log('-'.repeat(60));
    
    try {
      const { data: rules, error: rulesError } = await supabase
        .from('strategy_rules')
        .select('*')
        .limit(10);
      
      if (rulesError) {
        const hasComplianceError = checkForComplianceError(rulesError);
        logTest('Strategy rules query', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : rulesError.message);
      } else {
        logTest('Strategy rules query', true, `Found ${rules?.length || 0} strategy rules`);
      }
    } catch (error) {
      logTest('Strategy rules query', false, error.message);
    }

    // Test 4: Test complex strategy query with joins
    console.log('\n📋 TEST 4: Test complex strategy query with joins');
    console.log('-'.repeat(60));
    
    try {
      const { data: joinedData, error: joinError } = await supabase
        .from('strategies')
        .select(`
          *,
          strategy_rules (*)
        `)
        .limit(5);
      
      if (joinError) {
        const hasComplianceError = checkForComplianceError(joinError);
        logTest('Complex strategy query with joins', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : joinError.message);
      } else {
        logTest('Complex strategy query with joins', true, 
          `Successfully queried ${joinedData?.length || 0} strategies with rules`);
      }
    } catch (error) {
      logTest('Complex strategy query with joins', false, error.message);
    }

    // Test 5: Test trades query with strategy relationship
    console.log('\n📋 TEST 5: Test trades query with strategy relationship');
    console.log('-'.repeat(60));
    
    try {
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          strategies (*)
        `)
        .limit(5);
      
      if (tradesError) {
        const hasComplianceError = checkForComplianceError(tradesError);
        logTest('Trades query with strategy relationship', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : tradesError.message);
      } else {
        logTest('Trades query with strategy relationship', true, 
          `Successfully queried ${trades?.length || 0} trades with strategies`);
      }
    } catch (error) {
      logTest('Trades query with strategy relationship', false, error.message);
    }

    // Test 6: Test strategy performance calculation
    console.log('\n📋 TEST 6: Test strategy performance calculation');
    console.log('-'.repeat(60));
    
    try {
      // First get a strategy to test with
      const { data: testStrategies, error: strategyError } = await supabase
        .from('strategies')
        .select('id')
        .limit(1);
      
      if (strategyError) {
        const hasComplianceError = checkForComplianceError(strategyError);
        logTest('Get strategy for performance test', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : strategyError.message);
      } else if (testStrategies && testStrategies.length > 0) {
        const strategyId = testStrategies[0].id;
        
        // Test performance calculation query
        const { data: perfData, error: perfError } = await supabase
          .from('trades')
          .select('pnl, entry_time, exit_time, trade_date')
          .eq('strategy_id', strategyId)
          .not('pnl', 'is', null)
          .order('trade_date, entry_time');
        
        if (perfError) {
          const hasComplianceError = checkForComplianceError(perfError);
          logTest('Strategy performance calculation', false,
            hasComplianceError ? 'strategy_rule_compliance error detected!' : perfError.message);
        } else {
          logTest('Strategy performance calculation', true, 
            `Successfully calculated performance for ${perfData?.length || 0} trades`);
        }
      } else {
        logTest('Get strategy for performance test', true, 'No strategies found to test with');
      }
    } catch (error) {
      logTest('Strategy performance calculation', false, error.message);
    }

    // Test 7: Test trade insertion with strategy
    console.log('\n📋 TEST 7: Test trade insertion with strategy');
    console.log('-'.repeat(60));
    
    try {
      // Get a strategy for testing
      const { data: testStrategies, error: strategyError } = await supabase
        .from('strategies')
        .select('id')
        .limit(1);
      
      if (strategyError) {
        const hasComplianceError = checkForComplianceError(strategyError);
        logTest('Get strategy for trade insertion test', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : strategyError.message);
      } else {
        const strategyId = testStrategies && testStrategies.length > 0 ? testStrategies[0].id : null;
        
        // Test trade insertion
        const testTrade = {
          user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
          strategy_id: strategyId,
          symbol: 'TEST',
          market: 'stock',
          side: 'Buy',
          entry_price: 100.00,
          quantity: 10,
          trade_date: new Date().toISOString().split('T')[0],
          pnl: 50.00
        };
        
        const { data: insertedTrade, error: insertError } = await supabase
          .from('trades')
          .insert(testTrade)
          .select('id')
          .single();
        
        if (insertError) {
          const hasComplianceError = checkForComplianceError(insertError);
          logTest('Trade insertion with strategy', false,
            hasComplianceError ? 'strategy_rule_compliance error detected!' : insertError.message);
        } else {
          logTest('Trade insertion with strategy', true, 'Successfully inserted test trade');
          
          // Clean up the test trade
          if (insertedTrade) {
            await supabase
              .from('trades')
              .delete()
              .eq('id', insertedTrade.id);
          }
        }
      }
    } catch (error) {
      logTest('Trade insertion with strategy', false, error.message);
    }

    // Test 8: Test foreign key constraints
    console.log('\n📋 TEST 8: Test foreign key constraints');
    console.log('-'.repeat(60));
    
    try {
      const { data: constraints, error: constraintsError } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, table_name, constraint_type')
        .like('constraint_name', '%strategy_rule_compliance%');
      
      if (constraintsError) {
        logTest('Check foreign key constraints', false, constraintsError.message);
      } else {
        const hasComplianceConstraints = constraints && constraints.length > 0;
        logTest('Check foreign key constraints', !hasComplianceConstraints,
          hasComplianceConstraints ? 'Found constraints referencing strategy_rule_compliance' : 'No compliance constraints found');
      }
    } catch (error) {
      logTest('Check foreign key constraints', false, error.message);
    }

    // Test 9: Test RLS policies
    console.log('\n📋 TEST 9: Test RLS policies');
    console.log('-'.repeat(60));
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('information_schema.policies')
        .select('policyname, tablename')
        .like('policyname', '%strategy_rule_compliance%');
      
      if (policiesError) {
        logTest('Check RLS policies', false, policiesError.message);
      } else {
        const hasCompliancePolicies = policies && policies.length > 0;
        logTest('Check RLS policies', !hasCompliancePolicies,
          hasCompliancePolicies ? 'Found policies referencing strategy_rule_compliance' : 'No compliance policies found');
      }
    } catch (error) {
      logTest('Check RLS policies', false, error.message);
    }

    // Test 10: Test application navigation simulation
    console.log('\n📋 TEST 10: Test application navigation simulation');
    console.log('-'.repeat(60));
    
    try {
      // Simulate the queries that would be made when navigating to different pages
      
      // Simulate strategies page load
      const { data: strategiesPage, error: strategiesPageError } = await supabase
        .from('strategies')
        .select('*')
        .eq('is_active', true)
        .limit(50);
      
      if (strategiesPageError) {
        const hasComplianceError = checkForComplianceError(strategiesPageError);
        logTest('Strategies page simulation', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : strategiesPageError.message);
      } else {
        logTest('Strategies page simulation', true, `Loaded ${strategiesPage?.length || 0} strategies`);
      }
      
      // Simulate dashboard page load
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('trades')
        .select('pnl, trade_date, strategy_id')
        .order('trade_date', { ascending: false })
        .limit(10);
      
      if (dashboardError) {
        const hasComplianceError = checkForComplianceError(dashboardError);
        logTest('Dashboard page simulation', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : dashboardError.message);
      } else {
        logTest('Dashboard page simulation', true, `Loaded ${dashboardData?.length || 0} recent trades`);
      }
      
      // Simulate analytics page load
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('trades')
        .select('pnl, market, side, strategy_id')
        .not('pnl', 'is', null)
        .limit(100);
      
      if (analyticsError) {
        const hasComplianceError = checkForComplianceError(analyticsError);
        logTest('Analytics page simulation', false,
          hasComplianceError ? 'strategy_rule_compliance error detected!' : analyticsError.message);
      } else {
        logTest('Analytics page simulation', true, `Loaded ${analyticsData?.length || 0} trades for analytics`);
      }
      
    } catch (error) {
      logTest('Application navigation simulation', false, error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }

  // Generate final report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  // Check for any strategy_rule_compliance errors
  const complianceErrors = testResults.details.filter(test => 
    !test.passed && test.details.includes('strategy_rule_compliance')
  );
  
  if (complianceErrors.length > 0) {
    console.log('\n⚠️  STRATEGY_RULE_COMPLIANCE ERRORS DETECTED:');
    complianceErrors.forEach(error => {
      console.log(`   - ${error.testName}: ${error.details}`);
    });
    console.log('\n❌ CACHE CLEAR INCOMPLETE: strategy_rule_compliance references still exist!');
  } else {
    console.log('\n✅ NO STRATEGY_RULE_COMPLIANCE ERRORS DETECTED');
    console.log('✅ CACHE CLEAR SUCCESSFUL: All strategy selection functionality working correctly!');
  }
  
  // Failed tests summary
  const failedTests = testResults.details.filter(test => !test.passed);
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS SUMMARY:');
    failedTests.forEach(test => {
      console.log(`   - ${test.testName}: ${test.details}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  return {
    success: testResults.failed === 0,
    totalTests: testResults.total,
    passedTests: testResults.passed,
    failedTests: testResults.failed,
    complianceErrors: complianceErrors.length,
    details: testResults.details
  };
}

// Run the comprehensive test
// Run comprehensive test
testStrategySelectionFunctionality().then(results => {
  if (results.success && results.complianceErrors === 0) {
    console.log('\n🎉 SUCCESS: Strategy selection functionality is working perfectly after cache clear!');
    process.exit(0);
  } else {
    console.log('\n❌ FAILURE: Issues detected in strategy selection functionality.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 CRITICAL ERROR: Test execution failed:', error.message);
  process.exit(1);
});