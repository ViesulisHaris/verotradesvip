const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnR1ZngiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1ODQzNjAwLCJleHAiOjE5NTE0MTk2MDB9.7J6K1oZzX2x3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m'
);

async function testStrategySelection() {
  console.log('🔍 Testing strategy selection to identify strategy_rule_compliance errors...\n');
  
  try {
    // Test 1: Check if strategy_rule_compliance table exists
    console.log('1. Checking if strategy_rule_compliance table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'strategy_rule_compliance');
    
    if (tablesError) {
      console.log('   ❌ Error checking table:', tablesError.message);
    } else {
      if (tables && tables.length > 0) {
        console.log('   ❌ strategy_rule_compliance table still exists!');
      } else {
        console.log('   ✅ strategy_rule_compliance table does not exist');
      }
    }
    
    // Test 2: Try to query strategies (this is what the app does when selecting strategies)
    console.log('\n2. Testing strategy query (simulating app behavior)...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(10);
    
    if (strategiesError) {
      console.log('   ❌ Error querying strategies:', strategiesError.message);
      if (strategiesError.message.includes('strategy_rule_compliance')) {
        console.log('   🔍 FOUND: Strategy query references strategy_rule_compliance!');
      }
    } else {
      console.log(`   ✅ Successfully queried ${strategies?.length || 0} strategies`);
    }
    
    // Test 3: Try to query strategy rules (this might be the culprit)
    console.log('\n3. Testing strategy_rules query...');
    const { data: rules, error: rulesError } = await supabase
      .from('strategy_rules')
      .select('*')
      .limit(10);
    
    if (rulesError) {
      console.log('   ❌ Error querying strategy_rules:', rulesError.message);
      if (rulesError.message.includes('strategy_rule_compliance')) {
        console.log('   🔍 FOUND: Strategy rules query references strategy_rule_compliance!');
      }
    } else {
      console.log(`   ✅ Successfully queried ${rules?.length || 0} strategy rules`);
    }
    
    // Test 4: Check for any foreign key constraints
    console.log('\n4. Checking for foreign key constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .like('constraint_name', '%strategy_rule_compliance%');
    
    if (constraintsError) {
      console.log('   ❌ Error checking constraints:', constraintsError.message);
    } else {
      if (constraints && constraints.length > 0) {
        console.log('   ❌ Found constraints referencing strategy_rule_compliance:', constraints);
      } else {
        console.log('   ✅ No constraints referencing strategy_rule_compliance');
      }
    }
    
    // Test 5: Check for any remaining RLS policies
    console.log('\n5. Checking for RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('policyname, tablename')
      .like('policyname', '%strategy_rule_compliance%');
    
    if (policiesError) {
      console.log('   ❌ Error checking policies:', policiesError.message);
    } else {
      if (policies && policies.length > 0) {
        console.log('   ❌ Found policies referencing strategy_rule_compliance:', policies);
      } else {
        console.log('   ✅ No policies referencing strategy_rule_compliance');
      }
    }
    
    // Test 6: Try to simulate the exact query that might be failing
    console.log('\n6. Testing potential problematic queries...');
    
    // Check if there's a view or function that's being called
    const testQueries = [
      'SELECT * FROM strategies',
      'SELECT * FROM strategy_rules',
      'SELECT s.*, sr.* FROM strategies s LEFT JOIN strategy_rules sr ON s.id = sr.strategy_id'
    ];
    
    for (let i = 0; i < testQueries.length; i++) {
      console.log(`\n   Testing query ${i + 1}: ${testQueries[i]}`);
      try {
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: testQueries[i] });
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('strategy_rule_compliance')) {
            console.log(`   🔍 FOUND: Query ${i + 1} references strategy_rule_compliance!`);
          }
        } else {
          console.log(`   ✅ Query ${i + 1} executed successfully`);
        }
      } catch (e) {
        console.log(`   ❌ Exception: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testStrategySelection();