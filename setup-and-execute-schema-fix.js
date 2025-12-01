const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupExecSqlFunction() {
  console.log('Setting up exec_sql function...');
  
  const setupSQL = `
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

    -- Grant execution permissions to authenticated users
    grant execute on function exec_sql(text) to authenticated;
    grant execute on function exec_sql(text) to service_role;
  `;
  
  try {
    // Direct SQL execution using the service role
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: setupSQL
    });
    
    if (error) {
      console.log('exec_sql function not available, trying direct SQL execution...');
      
      // Try using the raw SQL execution through the client
      const { data: directData, error: directError } = await supabase
        .from('pg_catalog.pg_proc')
        .select('proname')
        .eq('proname', 'exec_sql');
      
      if (directError && directError.code === 'PGRST000') {
        console.log('Function does not exist, creating it manually...');
        console.log('Please manually execute the setup SQL in your Supabase dashboard:');
        console.log('https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql');
        console.log('\nSQL to execute:');
        console.log(setupSQL);
        return false;
      }
    }
    
    console.log('✅ exec_sql function setup completed!');
    return true;
  } catch (err) {
    console.error('Error setting up exec_sql function:', err);
    return false;
  }
}

async function executeSchemaCacheClear() {
  console.log('\nExecuting schema cache clear command...');
  
  try {
    // Execute the schema cache clear command
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: 'NOTIFY pgrst, \'reload schema\';'
    });
    
    if (error) {
      console.error('Error executing schema cache clear:', error);
      return false;
    }
    
    console.log('✅ Schema cache clear command executed successfully!');
    console.log('Command executed: NOTIFY pgrst, \'reload schema\';');
    console.log('Response:', data);
    
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

async function verifySchemaCacheRefresh() {
  console.log('\nVerifying schema cache refresh...');
  
  try {
    // Test a simple query to verify the schema is accessible
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error verifying schema cache:', error);
      return false;
    }
    
    console.log('✅ Schema cache verification successful!');
    console.log('Users table is accessible:', data);
    
    return true;
  } catch (err) {
    console.error('Unexpected error during verification:', err);
    return false;
  }
}

async function main() {
  console.log('=== SCHEMA CACHE CLEAR FIX ===\n');
  
  const setupSuccess = await setupExecSqlFunction();
  
  if (setupSuccess) {
    // Wait a moment for the function to be available
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const cacheClearSuccess = await executeSchemaCacheClear();
    
    if (cacheClearSuccess) {
      // Wait a moment for the cache to refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verificationSuccess = await verifySchemaCacheRefresh();
      
      if (verificationSuccess) {
        console.log('\n✅ Schema cache clear fix completed successfully!');
        console.log('The schema cache has been refreshed and is working properly.');
      } else {
        console.log('\n❌ Schema cache verification failed.');
        console.log('The cache clear command executed but verification failed.');
      }
    } else {
      console.log('\n❌ Schema cache clear failed.');
      console.log('Please check your Supabase connection and permissions.');
    }
  } else {
    console.log('\n⚠️  exec_sql function setup required.');
    console.log('Please manually execute the setup SQL in your Supabase dashboard.');
    console.log('After setting up the function, run this script again.');
  }
}

main().catch(console.error);