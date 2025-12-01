const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with anon key for limited access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 DATABASE COMPLIANCE DIAGNOSTIC TOOL (ANON KEY)');
console.log('='.repeat(50));

async function runComprehensiveDiagnostic() {
  console.log('\n📋 Running comprehensive database diagnostic with anon key...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Check 1: Direct table existence (limited with anon key)
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
  
  // Check 2: Test actual queries that might trigger the error
  console.log('\n2️⃣ Testing queries that might trigger strategy_rule_compliance error...');
  
  // Test 2a: Simple strategies query
  console.log('   2a. Testing simple strategies query...');
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
  
  // Test 2b: Strategies with rules join
  console.log('   2b. Testing strategies with rules join...');
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
  
  // Test 2c: Complex query with multiple joins
  console.log('   2c. Testing complex query with multiple joins...');
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
  const reportPath = `database-compliance-diagnostic-anon-${Date.now()}.json`;
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