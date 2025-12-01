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

async function executeSqlDirectly(sql, description) {
  try {
    console.log(`\n===========================================`);
    console.log(`Executing: ${description}`);
    console.log(`===========================================`);
    
    // Use the direct SQL execution endpoint
    const { data, error } = await supabase
      .from('pg_catalog')
      .rpc('exec', { sql: sql });
    
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

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple test query
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Connection test successful');
    console.log('Found tables:', data);
    return true;
    
  } catch (err) {
    console.error('Connection test error:', err);
    return false;
  }
}

async function executeSchemaCacheFix() {
  console.log('Starting Schema Cache Corruption Fix execution...');
  
  // First test the connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - Supabase connection failed');
    console.log('Please check your environment variables and Supabase configuration');
    return;
  }
  
  // Execute the schema cache fix
  const result = await executeSqlFile('SCHEMA_CACHE_CORRUPTION_FIX.sql', 'Schema Cache Corruption Fix');
  
  console.log('\n===========================================');
  console.log('SCHEMA CACHE FIX EXECUTION SUMMARY');
  console.log('===========================================');
  
  if (result.success) {
    console.log('\n✅ SCHEMA CACHE FIX EXECUTED SUCCESSFULLY');
    console.log('The schema cache corruption issue should now be resolved.');
    console.log('Please test the strategies page to verify the fix.');
  } else {
    console.log('\n❌ SCHEMA CACHE FIX FAILED');
    console.log('The schema cache corruption issue may not be resolved.');
    console.log('Error details:', result.error);
  }
}

async function executeSqlFile(filename, description) {
  try {
    console.log(`\n===========================================`);
    console.log(`Preparing to execute: ${description}`);
    console.log(`File: ${filename}`);
    console.log(`===========================================`);
    
    // Read SQL script
    const sqlScript = fs.readFileSync(filename, 'utf8');
    
    console.log(`SQL script loaded (${sqlScript.length} characters)`);
    console.log('Commands to execute:');
    
    // Split the script into individual commands for better logging
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      console.log(`  - ${command}`);
    }
    
    // Try to execute the entire script at once
    const result = await executeSqlDirectly(sqlScript, description);
    
    if (result.success) {
      console.log(`✅ ${description} executed successfully`);
      return { success: true, errorCount: 0 };
    } else {
      console.log(`❌ ${description} failed with error:`, result.error);
      return { success: false, errorCount: 1 };
    }
    
  } catch (err) {
    console.error(`Error reading or executing ${filename}:`, err);
    return { success: false, errorCount: 1 };
  }
}

// Run the execution
executeSchemaCacheFix().catch(console.error);