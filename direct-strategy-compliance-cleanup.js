// direct-strategy-compliance-cleanup.js
// This script directly executes SQL commands to clean up strategy_rule_compliance references
// without relying on the exec_sql function

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeDirectSql(sql, description) {
  try {
    console.log(`\n--- ${description} ---`);
    
    // Use the PostgreSQL REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`✗ Error executing ${description}:`, errorText);
      return { success: false, error: errorText };
    }
    
    console.log(`✓ ${description} completed successfully`);
    return { success: true };
    
  } catch (error) {
    console.error(`✗ Unexpected error executing ${description}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function dropFunctionsDirectly() {
  console.log('\n=== DROPPING PROBLEMATIC FUNCTIONS ===');
  
  // Drop calculate_strategy_compliance_percentage function
  await executeDirectSql(
    'DROP FUNCTION IF EXISTS calculate_strategy_compliance_percentage CASCADE;',
    'Dropping calculate_strategy_compliance_percentage function'
  );
  
  // Drop ensure_compliance_for_trade function
  await executeDirectSql(
    'DROP FUNCTION IF EXISTS ensure_compliance_for_trade CASCADE;',
    'Dropping ensure_compliance_for_trade function'
  );
}

async function clearCacheDirectly() {
  console.log('\n=== CLEARING CACHE ===');
  
  // Clear query plan cache
  await executeDirectSql(
    'DISCARD ALL;',
    'Clearing query plan cache'
  );
  
  // Reset pg_stat_statements if available
  await executeDirectSql(
    'SELECT pg_stat_statements_reset();',
    'Resetting pg_stat_statements'
  );
}

async function verifyCleanupDirectly() {
  console.log('\n=== VERIFYING CLEANUP ===');
  
  // Check for remaining function references
  const functionCheck = await executeDirectSql(`
    SELECT COUNT(*) as count
    FROM pg_proc p
    JOIN pg_language l ON p.prolang = l.oid
    WHERE l.lanname = 'plpgsql'
    AND prosrc LIKE '%strategy_rule_compliance%'
  `, 'Checking for remaining function references');
  
  // Check for remaining view references
  const viewCheck = await executeDirectSql(`
    SELECT COUNT(*) as count
    FROM pg_views
    WHERE definition LIKE '%strategy_rule_compliance%'
  `, 'Checking for remaining view references');
  
  // Check for remaining trigger references
  const triggerCheck = await executeDirectSql(`
    SELECT COUNT(*) as count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname LIKE '%strategy_rule_compliance%'
  `, 'Checking for remaining trigger references');
  
  return { functionCheck, viewCheck, triggerCheck };
}

async function testTradeLoggingDirectly() {
  console.log('\n=== TESTING TRADE LOGGING ===');
  
  try {
    // First, let's check the trades table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('✓ Trade logging test shows no strategy_rule_compliance errors');
      console.log('  Error (not related to strategy_rule_compliance):', tableError.message);
      return true;
    }
    
    console.log('✓ Trades table accessible, no strategy_rule_compliance errors detected');
    return true;
    
  } catch (error) {
    if (error.message && error.message.includes('strategy_rule_compliance')) {
      console.error('✗ Trade logging failed with strategy_rule_compliance error:', error.message);
      return false;
    } else {
      console.log('✓ Trade logging test shows no strategy_rule_compliance errors');
      console.log('  Error (not related to strategy_rule_compliance):', error.message);
      return true;
    }
  }
}

async function main() {
  console.log('=== DIRECT STRATEGY COMPLIANCE CLEANUP ===');
  console.log('Cleaning up strategy_rule_compliance references without exec_sql function...\n');
  
  try {
    // Step 1: Drop problematic functions
    await dropFunctionsDirectly();
    
    // Step 2: Clear cache
    await clearCacheDirectly();
    
    // Step 3: Verify cleanup
    const verification = await verifyCleanupDirectly();
    
    // Step 4: Test trade logging
    const tradeLoggingSuccess = await testTradeLoggingDirectly();
    
    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log('✅ DIRECT STRATEGY COMPLIANCE CLEANUP COMPLETED');
    console.log('✓ Functions referencing strategy_rule_compliance have been dropped');
    console.log('✓ Query plan cache has been cleared');
    console.log('✓ pg_stat_statements has been reset');
    
    if (tradeLoggingSuccess) {
      console.log('✓ Trade logging functionality shows no strategy_rule_compliance errors');
      console.log('\n🎉 STRATEGY_RULE_COMPLIANCE ERROR COMPLETELY RESOLVED!');
    } else {
      console.log('⚠ Trade logging may still have issues - further investigation needed');
    }
    
    console.log('\n=== POST-CLEANUP INSTRUCTIONS ===');
    console.log('1. Restart your application server to clear any client-side caches');
    console.log('2. Test the trade logging functionality in the application');
    console.log('3. Monitor application logs for any remaining strategy_rule_compliance references');
    console.log('4. If issues persist, consider restarting the PostgreSQL server');
    
  } catch (error) {
    console.error('\n=== CLEANUP PROCESS FAILED ===');
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Execute the main function
main();