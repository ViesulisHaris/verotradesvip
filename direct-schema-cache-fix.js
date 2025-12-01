const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client with service role key
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

async function executeSqlViaRPC(sql, description) {
  try {
    console.log(`\n===========================================`);
    console.log(`Executing: ${description}`);
    console.log(`===========================================`);
    
    // Use the exec_sql function to bypass schema cache
    const { data, error } = await supabase
      .rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error executing ${description}:`, error);
      return { success: false, error };
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

async function executeSchemaCacheFix() {
  console.log('Starting Direct Schema Cache Corruption Fix execution...');
  
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
    const result = await executeSqlViaRPC(command.sql, command.desc);
    
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
  } else {
    console.log(`\n⚠️  SCHEMA CACHE FIX COMPLETED WITH ${errorCount} ERRORS`);
    console.log('The schema cache corruption issue may not be fully resolved.');
  }
}

// Run the execution
executeSchemaCacheFix().catch(console.error);