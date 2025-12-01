const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 DATABASE COMPLIANCE DIAGNOSTIC TOOL');
console.log('='.repeat(50));

async function runComprehensiveDiagnostic() {
  console.log('\n📋 Running comprehensive database diagnostic...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Check 1: Direct table existence
  console.log('1️⃣ Checking if strategy_rule_compliance table exists...');
  try {
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_name', 'strategy_rule_compliance')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('   ❌ Error checking table existence:', tablesError.message);
      results.checks.tableExistence = { success: false, error: tablesError.message };
    } else {
      const exists = tables && tables.length > 0;
      console.log(`   ${exists ? '❌' : '✅'} Table ${exists ? 'EXISTS' : 'does not exist'}`);
      results.checks.tableExistence = { success: !exists, exists, count: tables?.length };
    }
  } catch (error) {
    console.log('   ❌ Exception checking table:', error.message);
    results.checks.tableExistence = { success: false, error: error.message };
  }
  
  // Check 2: Views referencing the table
  console.log('\n2️⃣ Checking for views referencing strategy_rule_compliance...');
  try {
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name, view_definition')
      .like('view_definition', '%strategy_rule_compliance%');
    
    if (viewsError) {
      console.log('   ❌ Error checking views:', viewsError.message);
      results.checks.viewsCheck = { success: false, error: viewsError.message };
    } else {
      const hasViews = views && views.length > 0;
      console.log(`   ${hasViews ? '❌' : '✅'} Found ${hasViews ? views.length : 0} views referencing table`);
      if (hasViews) {
        views.forEach(view => {
          console.log(`      - ${view.table_name}`);
        });
      }
      results.checks.viewsCheck = { success: !hasViews, views };
    }
  } catch (error) {
    console.log('   ❌ Exception checking views:', error.message);
    results.checks.viewsCheck = { success: false, error: error.message };
  }
  
  // Check 3: Functions/procedures referencing the table
  console.log('\n3️⃣ Checking for functions referencing strategy_rule_compliance...');
  try {
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .like('routine_definition', '%strategy_rule_compliance%');
    
    if (functionsError) {
      console.log('   ❌ Error checking functions:', functionsError.message);
      results.checks.functionsCheck = { success: false, error: functionsError.message };
    } else {
      const hasFunctions = functions && functions.length > 0;
      console.log(`   ${hasFunctions ? '❌' : '✅'} Found ${hasFunctions ? functions.length : 0} functions referencing table`);
      if (hasFunctions) {
        functions.forEach(func => {
          console.log(`      - ${func.routine_name}`);
        });
      }
      results.checks.functionsCheck = { success: !hasFunctions, functions };
    }
  } catch (error) {
    console.log('   ❌ Exception checking functions:', error.message);
    results.checks.functionsCheck = { success: false, error: error.message };
  }
  
  // Check 4: Triggers referencing the table
  console.log('\n4️⃣ Checking for triggers referencing strategy_rule_compliance...');
  try {
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, action_statement')
      .like('action_statement', '%strategy_rule_compliance%');
    
    if (triggersError) {
      console.log('   ❌ Error checking triggers:', triggersError.message);
      results.checks.triggersCheck = { success: false, error: triggersError.message };
    } else {
      const hasTriggers = triggers && triggers.length > 0;
      console.log(`   ${hasTriggers ? '❌' : '✅'} Found ${hasTriggers ? triggers.length : 0} triggers referencing table`);
      if (hasTriggers) {
        triggers.forEach(trigger => {
          console.log(`      - ${trigger.trigger_name}`);
        });
      }
      results.checks.triggersCheck = { success: !hasTriggers, triggers };
    }
  } catch (error) {
    console.log('   ❌ Exception checking triggers:', error.message);
    results.checks.triggersCheck = { success: false, error: error.message };
  }
  
  // Check 5: Foreign key constraints referencing the table
  console.log('\n5️⃣ Checking for foreign key constraints referencing strategy_rule_compliance...');
  try {
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name')
      .like('constraint_name', '%strategy_rule_compliance%');
    
    if (constraintsError) {
      console.log('   ❌ Error checking constraints:', constraintsError.message);
      results.checks.constraintsCheck = { success: false, error: constraintsError.message };
    } else {
      const hasConstraints = constraints && constraints.length > 0;
      console.log(`   ${hasConstraints ? '❌' : '✅'} Found ${hasConstraints ? constraints.length : 0} constraints referencing table`);
      if (hasConstraints) {
        constraints.forEach(constraint => {
          console.log(`      - ${constraint.constraint_name} on ${constraint.table_name}`);
        });
      }
      results.checks.constraintsCheck = { success: !hasConstraints, constraints };
    }
  } catch (error) {
    console.log('   ❌ Exception checking constraints:', error.message);
    results.checks.constraintsCheck = { success: false, error: error.message };
  }
  
  // Check 6: Row Level Security policies
  console.log('\n6️⃣ Checking for RLS policies referencing strategy_rule_compliance...');
  try {
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .like('policyname', '%strategy_rule_compliance%');
    
    if (policiesError) {
      console.log('   ❌ Error checking RLS policies:', policiesError.message);
      results.checks.policiesCheck = { success: false, error: policiesError.message };
    } else {
      const hasPolicies = policies && policies.length > 0;
      console.log(`   ${hasPolicies ? '❌' : '✅'} Found ${hasPolicies ? policies.length : 0} RLS policies referencing table`);
      if (hasPolicies) {
        policies.forEach(policy => {
          console.log(`      - ${policy.policyname} on ${policy.tablename}`);
        });
      }
      results.checks.policiesCheck = { success: !hasPolicies, policies };
    }
  } catch (error) {
    console.log('   ❌ Exception checking RLS policies:', error.message);
    results.checks.policiesCheck = { success: false, error: error.message };
  }
  
  // Check 7: Test actual queries that might trigger the error
  console.log('\n7️⃣ Testing queries that might trigger strategy_rule_compliance error...');
  
  // Test 7a: Simple strategies query
  console.log('   7a. Testing simple strategies query...');
  try {
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5);
    
    if (strategiesError) {
      console.log(`      ❌ Error: ${strategiesError.message}`);
      if (strategiesError.message.includes('strategy_rule_compliance')) {
        console.log('      🔍 FOUND: This query references strategy_rule_compliance!');
      }
      results.checks.strategiesQuery = { success: false, error: strategiesError.message, hasComplianceError: strategiesError.message.includes('strategy_rule_compliance') };
    } else {
      console.log(`      ✅ Success: ${strategies?.length || 0} strategies returned`);
      results.checks.strategiesQuery = { success: true, count: strategies?.length };
    }
  } catch (error) {
    console.log(`      ❌ Exception: ${error.message}`);
    results.checks.strategiesQuery = { success: false, error: error.message };
  }
  
  // Test 7b: Strategies with rules join
  console.log('   7b. Testing strategies with rules join...');
  try {
    const { data: joinData, error: joinError } = await supabase
      .from('strategies')
      .select(`
        *,
        strategy_rules:strategy_id (
          id,
          rule_text,
          is_checked
        )
      `)
      .limit(5);
    
    if (joinError) {
      console.log(`      ❌ Error: ${joinError.message}`);
      if (joinError.message.includes('strategy_rule_compliance')) {
        console.log('      🔍 FOUND: This join query references strategy_rule_compliance!');
      }
      results.checks.strategiesJoinQuery = { success: false, error: joinError.message, hasComplianceError: joinError.message.includes('strategy_rule_compliance') };
    } else {
      console.log(`      ✅ Success: ${joinData?.length || 0} strategies with rules returned`);
      results.checks.strategiesJoinQuery = { success: true, count: joinData?.length };
    }
  } catch (error) {
    console.log(`      ❌ Exception: ${error.message}`);
    results.checks.strategiesJoinQuery = { success: false, error: error.message };
  }
  
  // Test 7c: Complex query with multiple joins
  console.log('   7c. Testing complex query with multiple joins...');
  try {
    const { data: complexData, error: complexError } = await supabase
      .from('trades')
      .select(`
        *,
        strategies:strategy_id (
          name,
          description,
          strategy_rules:strategy_id (
            id,
            rule_text,
            is_checked
          )
        )
      `)
      .limit(5);
    
    if (complexError) {
      console.log(`      ❌ Error: ${complexError.message}`);
      if (complexError.message.includes('strategy_rule_compliance')) {
        console.log('      🔍 FOUND: This complex query references strategy_rule_compliance!');
      }
      results.checks.complexQuery = { success: false, error: complexError.message, hasComplianceError: complexError.message.includes('strategy_rule_compliance') };
    } else {
      console.log(`      ✅ Success: ${complexData?.length || 0} complex records returned`);
      results.checks.complexQuery = { success: true, count: complexData?.length };
    }
  } catch (error) {
    console.log(`      ❌ Exception: ${error.message}`);
    results.checks.complexQuery = { success: false, error: error.message };
  }
  
  // Check 8: PostgreSQL query plan cache
  console.log('\n8️⃣ Checking PostgreSQL query plan cache...');
  try {
    // This is a more advanced check that might require admin privileges
    const { data: cacheStats, error: cacheError } = await supabase
      .rpc('get_query_plan_cache_stats');
    
    if (cacheError) {
      console.log('   ⚠️ Cannot check query plan cache (might require admin privileges)');
      results.checks.queryPlanCache = { success: false, error: cacheError.message, note: 'Requires admin privileges' };
    } else {
      console.log(`   ✅ Query plan cache stats retrieved`);
      results.checks.queryPlanCache = { success: true, stats: cacheStats };
    }
  } catch (error) {
    console.log('   ⚠️ Cannot check query plan cache:', error.message);
    results.checks.queryPlanCache = { success: false, error: error.message, note: 'Requires admin privileges' };
  }
  
  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  const allChecks = Object.values(results.checks);
  const failedChecks = allChecks.filter(check => !check.success);
  const complianceErrors = allChecks.filter(check => check.hasComplianceError);
  
  console.log(`Total checks: ${allChecks.length}`);
  console.log(`Passed checks: ${allChecks.length - failedChecks.length}`);
  console.log(`Failed checks: ${failedChecks.length}`);
  console.log(`Compliance errors found: ${complianceErrors.length}`);
  
  if (complianceErrors.length > 0) {
    console.log('\n🚨 CRITICAL FINDING: strategy_rule_compliance references detected!');
    complianceErrors.forEach(check => {
      console.log(`   - ${check.error}`);
    });
  } else {
    console.log('\n✅ No direct strategy_rule_compliance references found in database objects');
  }
  
  // Save results to file
  const fs = require('fs');
  const reportPath = `database-compliance-diagnostic-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${reportPath}`);
  
  return results;
}

// Run the diagnostic
if (require.main === module) {
  runComprehensiveDiagnostic()
    .then(results => {
      console.log('\n✅ Diagnostic completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveDiagnostic };