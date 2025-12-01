const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSchemaCacheIssues() {
  console.log('=== TESTING FOR SCHEMA CACHE ISSUES ===\n');
  
  // Test 1: Direct strategy query to check for strategy_rule_compliance references
  console.log('Test 1: Direct strategy query...');
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.log('❌ FAILED:', error.message);
      if (error.message.includes('strategy_rule_compliance')) {
        console.log('✅ SCHEMA CACHE ISSUE CONFIRMED: strategy_rule_compliance reference found');
        return true;
      }
    } else {
      console.log('✅ PASSED: Direct query successful');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  // Test 2: Check information schema for cached references
  console.log('\nTest 2: Checking information schema...');
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT schemaname, tablename, attname, typname 
          FROM pg_attribute 
          JOIN pg_class ON pg_attribute.attrelid = pg_class.oid 
          JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
          JOIN pg_type ON pg_attribute.atttypid = pg_type.oid 
          WHERE pg_attribute.attname LIKE '%strategy_rule_compliance%' 
          OR pg_class.relname LIKE '%strategy_rule_compliance%'
          LIMIT 10;
        `
      });
    
    if (error) {
      console.log('❌ FAILED:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ SCHEMA CACHE ISSUE CONFIRMED: Found cached references');
      console.log('References found:', data);
      return true;
    } else {
      console.log('✅ PASSED: No cached references found');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  // Test 3: Check for any remaining strategy_rule_compliance dependencies
  console.log('\nTest 3: Checking for remaining dependencies...');
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            dependent_ns.nspname AS schema_name,
            dependent_view.relname AS view_name,
            pg_get_viewdef(dependent_view.oid) AS view_definition
          FROM pg_depend
          JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
          JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid
          JOIN pg_namespace AS dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
          WHERE pg_depend.refobjid::regclass::text LIKE '%strategy_rule_compliance%'
          LIMIT 10;
        `
      });
    
    if (error) {
      console.log('❌ FAILED:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ SCHEMA CACHE ISSUE CONFIRMED: Found remaining dependencies');
      console.log('Dependencies found:', data);
      return true;
    } else {
      console.log('✅ PASSED: No remaining dependencies found');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('No explicit schema cache issues detected, but the problem may still exist.');
  console.log('Proceeding with schema cache clear as a precautionary measure.');
  return false;
}

async function main() {
  try {
    const hasSchemaCacheIssues = await testSchemaCacheIssues();
    
    if (hasSchemaCacheIssues) {
      console.log('\n🔧 CONFIRMED: Schema cache issues detected');
      console.log('Proceeding with SCHEMA_CACHE_CLEAR.sql execution...');
    } else {
      console.log('\n🔧 PRECAUTIONARY: No explicit schema cache issues detected');
      console.log('However, based on the investigation, proceeding with schema cache clear...');
    }
    
    return hasSchemaCacheIssues;
  } catch (error) {
    console.error('Error during schema cache testing:', error);
    return true; // Assume there's an issue and proceed with fix
  }
}

main().then(result => {
  process.exit(result ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});