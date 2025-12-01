// Script to check and create exec_sql function in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('='.repeat(80));
console.log('EXEC_SQL FUNCTION SETUP');
console.log('='.repeat(80));

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// SQL to create the exec_sql function
const createExecSQLFunction = `
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
`;

async function setupExecSQLFunction() {
  try {
    console.log('\n1. Checking current Supabase connection...');
    
    // Test basic connection first
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection test failed:', testError.message);
      return false;
    }
    console.log('✅ Connection successful');
    
    console.log('\n2. Checking if exec_sql function exists...');
    
    // Check if function exists
    const { data: functionData, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'exec_sql')
      .eq('routine_schema', 'public');
    
    if (functionError) {
      console.log('⚠️ Could not check for existing function:', functionError.message);
    } else if (functionData && functionData.length > 0) {
      console.log('✅ exec_sql function already exists');
    } else {
      console.log('❌ exec_sql function does not exist');
    }
    
    console.log('\n3. Creating/updating exec_sql function...');
    
    // Create or update the function
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql_query: createExecSQLFunction
    });
    
    if (createError) {
      // If exec_sql doesn't exist, we need to create it differently
      if (createError.message.includes('Invalid API key') || createError.message.includes('function exec_sql')) {
        console.log('⚠️ Cannot use exec_sql to create itself. Trying direct SQL execution...');
        
        // Try using the raw SQL execution through the client
        try {
          const { data: directData, error: directError } = await supabase
            .from('pg_proc')
            .select('proname')
            .limit(1);
          
          if (directError) {
            console.log('❌ Direct SQL execution also failed:', directError.message);
            console.log('\n⚠️ You may need to manually create the exec_sql function in your Supabase dashboard:');
            console.log('\nGo to: Supabase Dashboard → SQL Editor → New Query');
            console.log('Paste and run the following SQL:');
            console.log('\n' + createExecSQLFunction);
            return false;
          }
        } catch (err) {
          console.log('❌ Direct execution failed:', err.message);
        }
      } else {
        console.log('❌ Function creation failed:', createError.message);
        return false;
      }
    } else {
      console.log('✅ exec_sql function created/updated successfully');
    }
    
    console.log('\n4. Testing exec_sql function...');
    
    // Test the function with a simple query
    const { data: testData2, error: testError2 } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1 as test_value;'
    });
    
    if (testError2) {
      console.log('❌ exec_sql function test failed:', testError2.message);
      return false;
    }
    
    console.log('✅ exec_sql function test successful');
    console.log('Test result:', testData2);
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run the setup
setupExecSQLFunction().then(success => {
  console.log('\n' + '='.repeat(80));
  if (success) {
    console.log('✅ EXEC_SQL FUNCTION SETUP COMPLETE');
    console.log('The exec_sql function is now ready for use.');
  } else {
    console.log('❌ EXEC_SQL FUNCTION SETUP FAILED');
    console.log('You may need to manually create the function in Supabase dashboard.');
  }
  console.log('='.repeat(80));
}).catch(console.error);