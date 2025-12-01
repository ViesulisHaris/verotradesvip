const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeDirectSql(sql, description) {
  try {
    console.log(`\n===========================================`);
    console.log(`Executing: ${description}`);
    console.log(`SQL: ${sql}`);
    console.log(`===========================================`);
    
    // Use the PostgREST raw SQL endpoint with service role key
    const { data, error } = await supabaseAdmin
      .rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error executing ${description}:`, error);
      
      // Try alternative approach using direct SQL execution
      console.log('Trying alternative approach...');
      try {
        const { data: altData, error: altError } = await supabaseAdmin
          .from('pg_catalog')
          .rpc('exec', { sql: sql });
        
        if (altError) {
          console.error('Alternative approach also failed:', altError);
          return { success: false, error: altError };
        } else {
          console.log('Alternative approach succeeded:', altData);
          return { success: true, data: altData };
        }
      } catch (altErr) {
        console.error('Alternative approach exception:', altErr);
        return { success: false, error: altErr.message };
      }
    }
    
    console.log(`Successfully executed: ${description}`);
    if (data) {
      console.log('Result:', data);
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error(`Unexpected error executing ${description}:`, err);
    return { success: false, error: err.message };
  }
}

async function testConnection() {
  try {
    console.log('Testing Supabase admin connection...');
    
    // Simple test query using service role
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    if (error) {
      console.error('Admin connection test failed:', error);
      return false;
    }
    
    console.log('Admin connection test successful');
    console.log('Found tables:', data);
    return true;
    
  } catch (err) {
    console.error('Admin connection test error:', err);
    return false;
  }
}

async function executeSchemaCacheFix() {
  console.log('Starting Direct Schema Cache Corruption Fix execution...');
  
  // First test the connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - Supabase admin connection failed');
    console.log('Please check your SUPABASE_SERVICE_ROLE_KEY environment variable');
    return;
  }
  
  // Execute the schema cache fix commands individually
  const commands = [
    { sql: 'DISCARD PLANS;', desc: 'Clear query plans and cached execution plans' },
    { sql: 'DISCARD TEMP;', desc: 'Clear temporary tables and other temporary objects' },
    { sql: 'DISCARD ALL;', desc: 'Clear all cached data including prepared statements, cursors, and temporary tables' },
    { sql: 'DEALLOCATE ALL;', desc: 'Deallocate all prepared statements' },
    { sql: 'ANALYZE strategies;', desc: 'Update table statistics for strategies table' },
    { sql: 'ANALYZE trades;', desc: 'Update table statistics for trades table' },
    { sql: 'ANALYZE users;', desc: 'Update table statistics for users table' },
    { sql: 'RESET CONNECTION;', desc: 'Reset connection to default state' }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const command of commands) {
    const result = await executeDirectSql(command.sql, command.desc);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      console.log(`Command failed: ${command.sql}`);
      console.log(`Error:`, result.error);
    }
  }
  
  console.log('\n===========================================');
  console.log('SCHEMA CACHE FIX EXECUTION SUMMARY');
  console.log('===========================================');
  console.log(`Successful commands: ${successCount}`);
  console.log(`Failed commands: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n✅ ALL SCHEMA CACHE FIX COMMANDS EXECUTED SUCCESSFULLY');
    console.log('The schema cache corruption issue should now be resolved.');
    console.log('Please test the strategies page to verify the fix.');
    console.log('\nNext steps:');
    console.log('1. Navigate to http://localhost:3000/test-strategy-fix');
    console.log('2. Test the strategies page functionality');
    console.log('3. Verify all CRUD operations work properly');
  } else {
    console.log(`\n⚠️  SCHEMA CACHE FIX COMPLETED WITH ${errorCount} ERRORS`);
    console.log('The schema cache corruption issue may not be fully resolved.');
    console.log('\nManual fix may be required:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/bzmixuxautbmqbrqtufx/sql');
    console.log('2. Execute the commands manually in the SQL Editor');
    console.log('3. Restart the development server');
  }
}

// Run the execution
executeSchemaCacheFix().catch(console.error);