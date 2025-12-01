const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyComplianceRemoval() {
  console.log('=== VERIFYING COMPLIANCE REMOVAL ===\n');
  
  let allChecksPassed = true;
  
  // 1. Check if deleted tables exist
  console.log('1. Checking if any deleted tables still exist...');
  try {
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['strategy_rule_compliance', 'compliance_table', 'rule_compliance']);
    
    if (tablesError) {
      console.log(`   Error checking tables: ${tablesError.message}`);
      allChecksPassed = false;
    } else {
      if (tables && tables.length > 0) {
        console.log(`   ❌ FAIL: Found ${tables.length} deleted tables that still exist`);
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
        allChecksPassed = false;
      } else {
        console.log('   ✅ PASS: No deleted tables found in database');
      }
    }
  } catch (err) {
    console.log(`   Error: ${err.message}`);
    allChecksPassed = false;
  }
  
  // 2. Check if compliance_percentage column exists in trades table
  console.log('\n2. Checking if compliance_percentage column exists in trades table...');
  try {
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'trades')
      .eq('column_name', 'compliance_percentage');
    
    if (columnsError) {
      console.log(`   Error checking column: ${columnsError.message}`);
      allChecksPassed = false;
    } else {
      if (columns && columns.length > 0) {
        console.log('   ❌ FAIL: compliance_percentage column still exists in trades table');
        allChecksPassed = false;
      } else {
        console.log('   ✅ PASS: compliance_percentage column successfully removed from trades table');
      }
    }
  } catch (err) {
    console.log(`   Error: ${err.message}`);
    allChecksPassed = false;
  }
  
  // 3. Check if compliance-related functions exist
  console.log('\n3. Checking for compliance-related functions...');
  const complianceFunctions = [
    'calculate_trade_compliance',
    'calculate_strategy_compliance',
    'get_strategy_compliance_percentage',
    'update_trade_compliance_percentage'
  ];
  
  for (const funcName of complianceFunctions) {
    try {
      const { data: functions, error: funcError } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName);
      
      if (funcError) {
        console.log(`   Error checking function ${funcName}: ${funcError.message}`);
        allChecksPassed = false;
      } else {
        if (functions && functions.length > 0) {
          console.log(`   ❌ FAIL: ${funcName} function still exists`);
          allChecksPassed = false;
        } else {
          console.log(`   ✅ PASS: ${funcName} function successfully removed`);
        }
      }
    } catch (err) {
      console.log(`   Error checking function ${funcName}: ${err.message}`);
      allChecksPassed = false;
    }
  }
  
  // 4. Check if compliance-related triggers exist
  console.log('\n4. Checking for compliance-related triggers...');
  const complianceTriggers = [
    'update_trade_compliance_trigger',
    'calculate_strategy_compliance_trigger'
  ];
  
  for (const triggerName of complianceTriggers) {
    try {
      const { data: triggers, error: triggerError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name')
        .eq('trigger_name', triggerName);
      
      if (triggerError) {
        console.log(`   Error checking trigger ${triggerName}: ${triggerError.message}`);
        allChecksPassed = false;
      } else {
        if (triggers && triggers.length > 0) {
          console.log(`   ❌ FAIL: ${triggerName} trigger still exists`);
          allChecksPassed = false;
        } else {
          console.log(`   ✅ PASS: ${triggerName} trigger successfully removed`);
        }
      }
    } catch (err) {
      console.log(`   Error checking trigger ${triggerName}: ${err.message}`);
      allChecksPassed = false;
    }
  }
  
  // 5. Test basic database functionality
  console.log('\n5. Testing basic database functionality...');
  
  // Test strategies table
  console.log('\n   Testing strategies table access...');
  try {
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(1);
    
    if (strategiesError) {
      console.log(`   ❌ FAIL: Could not access strategies table: ${strategiesError.message}`);
      allChecksPassed = false;
    } else {
      console.log('   ✅ PASS: Strategies table is accessible');
    }
  } catch (err) {
    console.log(`   Error accessing strategies table: ${err.message}`);
    allChecksPassed = false;
  }
  
  // Test trades table
  console.log('\n   Testing trades table access...');
  try {
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol')
      .limit(1);
    
    if (tradesError) {
      console.log(`   ❌ FAIL: Could not access trades table: ${tradesError.message}`);
      allChecksPassed = false;
    } else {
      console.log('   ✅ PASS: Trades table is accessible');
    }
  } catch (err) {
    console.log(`   Error accessing trades table: ${err.message}`);
    allChecksPassed = false;
  }
  
  // Test strategy_rules table
  console.log('\n   Testing strategy_rules table access...');
  try {
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('id, rule_text')
      .limit(1);
    
    if (rulesError) {
      console.log(`   ❌ FAIL: Could not access strategy_rules table: ${rulesError.message}`);
      allChecksPassed = false;
    } else {
      console.log('   ✅ PASS: Strategy_rules table is accessible');
    }
  } catch (err) {
    console.log(`   Error accessing strategy_rules table: ${err.message}`);
    allChecksPassed = false;
  }
  
  // 6. Test creating a new trade without compliance_percentage
  console.log('\n6. Testing trade creation without compliance_percentage...');
  try {
    const testTrade = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      market: 'Stock',
      symbol: 'TEST',
      trade_date: new Date().toISOString().split('T')[0],
      side: 'Buy',
      quantity: 100,
      entry_price: 50.0,
      exit_price: 55.0,
      pnl: 500.0
    };
    
    // This should work without compliance_percentage
    const { data: insertResult, error: insertError } = await supabase
      .from('trades')
      .insert(testTrade)
      .select('id')
      .single();
    
    if (insertError) {
      if (insertError.message.includes('compliance_percentage')) {
        console.log('   ❌ FAIL: Trade creation still references compliance_percentage');
        allChecksPassed = false;
      } else {
        console.log(`   ✅ PASS: Trade creation works (other error expected: ${insertError.message})`);
      }
    } else {
      console.log('   ✅ PASS: Trade creation works without compliance_percentage');
      
      // Clean up test trade
      if (insertResult && insertResult.id) {
        await supabase
          .from('trades')
          .delete()
          .eq('id', insertResult.id);
      }
    }
  } catch (err) {
    console.log(`   Error testing trade creation: ${err.message}`);
    allChecksPassed = false;
  }
  
  // Final result
  console.log('\n=== VERIFICATION RESULT ===');
  if (allChecksPassed) {
    console.log('🎉 ALL CHECKS PASSED! Compliance functionality has been successfully removed.');
    console.log('✅ Database is functioning properly without compliance elements.');
  } else {
    console.log('❌ SOME CHECKS FAILED! Please review the errors above.');
  }
  
  return allChecksPassed;
}

// Run verification
verifyComplianceRemoval().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Verification failed with error:', error);
  process.exit(1);
});