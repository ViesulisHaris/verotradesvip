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

async function executeSqlFile(filename, description) {
  try {
    console.log(`\n===========================================`);
    console.log(`Preparing to execute: ${description}`);
    console.log(`File: ${filename}`);
    console.log(`===========================================`);
    
    // Read SQL script
    const sqlScript = fs.readFileSync(filename, 'utf8');
    
    console.log(`SQL script loaded (${sqlScript.length} characters)`);
    
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

async function executeAllFixes() {
  console.log('Starting SQL fix execution process...');
  
  // First test the connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - Supabase connection failed');
    console.log('Please check your environment variables and Supabase configuration');
    return;
  }
  
  // Execute scripts in order
  const scripts = [
    { file: 'SCHEMA_CACHE_CLEAR.sql', desc: 'Schema Cache Clear' },
    { file: 'RELATIONSHIP_REBUILD.sql', desc: 'Relationship Rebuild' },
    { file: 'VERIFICATION.sql', desc: 'Verification' }
  ];
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const script of scripts) {
    const result = await executeSqlFile(script.file, script.desc);
    
    if (result.success) {
      totalSuccess++;
    } else {
      totalErrors++;
    }
  }
  
  console.log('\n===========================================');
  console.log('FINAL EXECUTION SUMMARY');
  console.log('===========================================');
  console.log(`Successful scripts: ${totalSuccess}`);
  console.log(`Failed scripts: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ ALL SQL FIXES EXECUTED SUCCESSFULLY');
    console.log('The database issues should now be resolved.');
  } else {
    console.log(`\n⚠️  EXECUTION COMPLETED WITH ${totalErrors} ERRORS`);
    console.log('Some issues may not be fully resolved.');
  }
}

// Run the execution
executeAllFixes().catch(console.error);