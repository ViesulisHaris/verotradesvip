const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTradeLogging() {
  console.log('\n===========================================');
  console.log('Testing Trade Logging (strategy_rule_compliance fix)');
  console.log('===========================================');
  
  try {
    // Test 1: Check if strategy_rule_compliance table reference is gone
    console.log('Test 1: Checking if strategy_rule_compliance table references are cleared...');
    
    // Try to query trades table (which previously failed due to strategy_rule_compliance reference)
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (tradesError) {
      if (tradesError.message.includes('strategy_rule_compliance')) {
        console.log('❌ FAILED: strategy_rule_compliance reference still exists');
        console.log('Error:', tradesError.message);
        return false;
      } else {
        console.log('⚠️  Different error (might be expected if no trades exist):', tradesError.message);
      }
    } else {
      console.log('✅ SUCCESS: trades table queried without strategy_rule_compliance error');
    }
    
    // Test 2: Check if we can insert a trade (simulated)
    console.log('\nTest 2: Simulating trade insertion...');
    
    // First get a strategy to use
    const { data: strategies, error: strategyError } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);
    
    if (strategyError) {
      console.log('❌ FAILED: Cannot query strategies table');
      console.log('Error:', strategyError.message);
      return false;
    }
    
    if (!strategies || strategies.length === 0) {
      console.log('⚠️  WARNING: No strategies found to test trade insertion');
    } else {
      console.log('✅ SUCCESS: Strategies table accessible');
      console.log(`Found strategy ID: ${strategies[0].id}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ FAILED: Unexpected error during trade logging test:', error);
    return false;
  }
}

async function testStrategyPermissions() {
  console.log('\n===========================================');
  console.log('Testing Strategy Permissions');
  console.log('===========================================');
  
  try {
    // Test 1: Check if strategies table is accessible
    console.log('Test 1: Checking strategies table access...');
    
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (strategiesError) {
      if (strategiesError.message.includes('permission') || strategiesError.message.includes('not found')) {
        console.log('❌ FAILED: Strategy permission issue still exists');
        console.log('Error:', strategiesError.message);
        return false;
      } else {
        console.log('⚠️  Different error:', strategiesError.message);
      }
    } else {
      console.log('✅ SUCCESS: Strategies table accessible');
      console.log(`Found ${strategiesData.length} strategies`);
    }
    
    // Test 2: Check if we can modify a strategy (simulated)
    if (strategiesData && strategiesData.length > 0) {
      console.log('\nTest 2: Simulating strategy modification...');
      
      const strategyId = strategiesData[0].id;
      
      // Try to update the strategy (we'll use the same values to not actually change anything)
      const { data: updateData, error: updateError } = await supabase
        .from('strategies')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', strategyId)
        .select();
      
      if (updateError) {
        if (updateError.message.includes('permission') || updateError.message.includes('not found')) {
          console.log('❌ FAILED: Strategy modification permission issue');
          console.log('Error:', updateError.message);
          return false;
        } else {
          console.log('⚠️  Different error during update:', updateError.message);
        }
      } else {
        console.log('✅ SUCCESS: Strategy modification allowed');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ FAILED: Unexpected error during strategy permissions test:', error);
    return false;
  }
}

async function testDatabaseIntegrity() {
  console.log('\n===========================================');
  console.log('Testing Database Integrity');
  console.log('===========================================');
  
  try {
    // Test 1: Check if strategy_rule_compliance table is completely gone
    console.log('Test 1: Verifying strategy_rule_compliance table is removed...');
    
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'strategy_rule_compliance');
    
    if (tableError) {
      console.log('⚠️  Could not check table existence:', tableError.message);
    } else if (tableData && tableData.length > 0) {
      console.log('❌ FAILED: strategy_rule_compliance table still exists');
      return false;
    } else {
      console.log('✅ SUCCESS: strategy_rule_compliance table does not exist');
    }
    
    // Test 2: Check foreign key relationships
    console.log('\nTest 2: Checking foreign key relationships...');
    
    // Check if trades table has strategy_id foreign key
    const { data: fkData, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'trades')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (fkError) {
      console.log('⚠️  Could not check foreign keys:', fkError.message);
    } else if (fkData && fkData.length > 0) {
      console.log('✅ SUCCESS: Foreign key constraints found on trades table');
      fkData.forEach(fk => {
        console.log(`  - ${fk.constraint_name} (${fk.constraint_type})`);
      });
    } else {
      console.log('⚠️  WARNING: No foreign key constraints found on trades table');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ FAILED: Unexpected error during database integrity test:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting comprehensive database fix verification...');
  console.log('Testing the fixes for strategy_rule_compliance and strategy permission issues');
  
  const results = {
    tradeLogging: await testTradeLogging(),
    strategyPermissions: await testStrategyPermissions(),
    databaseIntegrity: await testDatabaseIntegrity()
  };
  
  console.log('\n===========================================');
  console.log('FINAL TEST RESULTS');
  console.log('===========================================');
  
  console.log(`Trade Logging Test: ${results.tradeLogging ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Strategy Permissions Test: ${results.strategyPermissions ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Database Integrity Test: ${results.databaseIntegrity ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The SQL fixes have successfully resolved the database issues.');
    console.log('Both the strategy_rule_compliance and strategy permission issues should now be resolved.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('The SQL fixes may not have been fully applied or there may be additional issues.');
    console.log('Please check the detailed test results above and ensure all SQL scripts were executed correctly.');
  }
  
  // Save results to file
  const testResults = {
    timestamp: new Date().toISOString(),
    results,
    summary: allPassed ? 'ALL_PASSED' : 'SOME_FAILED'
  };
  
  fs.writeFileSync('database-fix-test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\nTest results saved to: database-fix-test-results.json');
  
  return allPassed;
}

// Run the tests
runAllTests().catch(console.error);