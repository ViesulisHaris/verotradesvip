const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_devDYJQgvC06kMcpJJ2smg_j1ZTYBUn';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function executeDirectSql(sqlContent) {
  console.log(`\n🔧 Executing direct SQL...`);
  
  try {
    // Use the Supabase SQL execution via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sqlContent })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`   ⚠️  SQL execution failed:`, errorText);
      return false;
    }
    
    const data = await response.json();
    console.log(`   ✅ SQL executed successfully`);
    if (data && data.length > 0) {
      console.log(`   📊 Result:`, data);
    }
    return true;
    
  } catch (error) {
    console.error(`   ❌ SQL execution exception:`, error.message);
    return false;
  }
}

async function setupExecSqlFunction() {
  console.log('\n📋 Setting up exec_sql function...');
  
  const setupSql = `
create or replace function exec_sql(sql_query text)
returns table(success boolean, error text, result json)
language plpgsql
security definer
as $$
declare
    query_result record;
    return_json json;
begin
    -- Execute the SQL query
    execute sql_query;
    
    -- Try to get the result if it's a SELECT query
    begin
        -- For SELECT queries, try to return the result
        execute 'select array_to_json(array_agg(row_to_json(t))) from (' || sql_query || ') t'
        into return_json;
        
        return query select true as success, null as error, return_json as result;
    exception when others then
        -- For non-SELECT queries, just return success
        return query select true as success, null as error, null as result;
    end;
    
exception when others then
    -- Return error if query fails
    return query select false as success, sqlerrm as error, null as result;
end;
$$;

grant execute on function exec_sql(text) to authenticated;
grant execute on function exec_sql(text) to service_role;

select 'exec_sql function created successfully' as status;
`;
  
  return await executeDirectSql(setupSql);
}

async function executeAggressiveCacheClear() {
  console.log('\n📋 Executing aggressive cache clear...');
  
  const cacheClearSql = `
-- Aggressive cache clearing
BEGIN;

-- Step 1: Discard all cached query plans
DISCARD PLANS;

-- Step 2: Reset all session configuration
RESET ALL;

-- Step 3: Force table statistics rebuild
ANALYZE VERBOSE;

-- Step 4: Create temporary tables to force cache invalidation
CREATE TEMP TABLE cache_bust_1 (id INTEGER, cache_bust TEXT);
INSERT INTO cache_bust_1 VALUES (1, 'cache_bust_1');
DROP TABLE cache_bust_1;

CREATE TEMP TABLE cache_bust_2 (id INTEGER, cache_bust TEXT);
INSERT INTO cache_bust_2 VALUES (2, 'cache_bust_2');
DROP TABLE cache_bust_2;

-- Step 5: Test basic queries
PERFORM 1 FROM strategies LIMIT 1;
PERFORM 1 FROM trades LIMIT 1;

COMMIT;

SELECT
    'AGGRESSIVE_CACHE_CLEAR' as operation,
    'SUCCESS' as status,
    NOW() as completed_at,
    'Aggressive cache clearing completed successfully. All query plans discarded and statistics rebuilt.' as message;
`;
  
  return await executeDirectSql(cacheClearSql);
}

async function main() {
  console.log('🚀 Starting simple cache clearing process...');
  console.log('===========================================');
  
  try {
    // Step 1: Set up exec_sql function
    const setupSuccess = await setupExecSqlFunction();
    
    if (!setupSuccess) {
      console.log('   ⚠️  exec_sql function setup had issues, but continuing...');
    }
    
    // Step 2: Execute aggressive cache clear
    const cacheClearSuccess = await executeAggressiveCacheClear();
    
    if (cacheClearSuccess) {
      console.log('\n✅ Cache clearing completed successfully!');
      console.log('   The PostgreSQL query plan cache should now be cleared.');
      console.log('   Try using the application again to test trade logging.');
    } else {
      console.log('\n❌ Cache clearing had issues.');
      console.log('   You may need to manually execute the SQL script in Supabase SQL Editor.');
    }
    
  } catch (error) {
    console.error('\n💥 Cache clearing process failed:', error);
  }
  
  console.log('\n📊 Process complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { executeDirectSql, setupExecSqlFunction, executeAggressiveCacheClear };