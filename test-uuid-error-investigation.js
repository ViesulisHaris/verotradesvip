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
    
    // Try to use the exec_sql function if it exists
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

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple test query
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
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
    
    // Split the script into individual statements
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      const result = await executeSqlDirectly(statement + ';', `${description} - Statement ${i + 1}`);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.log(`Statement ${i + 1} failed:`, statement.substring(0, 100) + '...');
      }
    }
    
    console.log(`\nExecution summary for ${description}:`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Failed statements: ${errorCount}`);
    
    return { success: errorCount === 0, errorCount };
    
  } catch (err) {
    console.error(`Error reading or executing ${filename}:`, err);
    return { success: false, errorCount: 1 };
  }
}

async function main() {
  console.log('Starting UUID Error Investigation Script Test...');
  
  // First test the connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - Supabase connection failed');
    console.log('Please check your environment variables and Supabase configuration');
    return;
  }
  
  // Execute the UUID error investigation script
  const result = await executeSqlFile('TEST_UUID_ERROR_INVESTIGATION.sql', 'UUID Error Investigation');
  
  console.log('\n===========================================');
  console.log('FINAL EXECUTION SUMMARY');
  console.log('===========================================');
  
  if (result.success) {
    console.log('\n✅ UUID ERROR INVESTIGATION SCRIPT EXECUTED SUCCESSFULLY');
    console.log('The script ran without any column reference errors.');
  } else {
    console.log(`\n⚠️  EXECUTION COMPLETED WITH ${result.errorCount} ERRORS`);
    console.log('There may still be some column reference issues to resolve.');
  }
}

// Run the execution
main().catch(console.error);