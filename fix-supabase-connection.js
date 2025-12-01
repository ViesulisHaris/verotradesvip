// Fix Supabase connection by clearing schema cache and testing connection
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

console.log('🔧 Fixing Supabase connection issue...\n');

// Check environment variables
console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('\n❌ Critical: Supabase environment variables are missing!');
  process.exit(1);
}

console.log('\n✅ Environment variables are properly set');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

console.log('\n🔄 Testing Supabase client creation with service role key...');
console.log('✅ Supabase client created successfully');

// Function to execute SQL directly using RPC
async function executeSQL(sql, description) {
  try {
    console.log(`\n🔄 Executing: ${description}`);
    
    // Use the PostgreSQL RPC function to execute SQL
    const { data, error } = await supabase.rpc('exec', { sql: sql });
    
    if (error) {
      console.error(`❌ Error executing ${description}:`, error);
      return { success: false, error };
    }
    
    console.log(`✅ Successfully executed: ${description}`);
    if (data) {
      console.log('Result:', data);
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error(`❌ Unexpected error executing ${description}:`, err);
    return { success: false, error: err.message };
  }
}

// Function to test connection with different approaches
async function testConnection() {
  console.log('\n🔄 Testing connection approaches...');
  
  // Test 1: Simple RPC call
  try {
    console.log('Test 1: Simple version check...');
    const { data, error } = await supabase.rpc('version');
    if (error) {
      console.log('❌ RPC version check failed:', error.message);
    } else {
      console.log('✅ RPC version check successful:', data);
      return true;
    }
  } catch (err) {
    console.log('❌ RPC version check error:', err.message);
  }
  
  // Test 2: Direct SQL query
  try {
    console.log('Test 2: Direct SQL query...');
    const { data, error } = await executeSQL('SELECT version() as version', 'Version Query');
    if (error) {
      console.log('❌ Direct SQL query failed:', error.message);
    } else {
      console.log('✅ Direct SQL query successful');
      return true;
    }
  } catch (err) {
    console.log('❌ Direct SQL query error:', err.message);
  }
  
  // Test 3: Simple table query without schema cache
  try {
    console.log('Test 3: Simple table query...');
    const { data, error } = await executeSQL('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 1', 'Table Query');
    if (error) {
      console.log('❌ Table query failed:', error.message);
    } else {
      console.log('✅ Table query successful');
      return true;
    }
  } catch (err) {
    console.log('❌ Table query error:', err.message);
  }
  
  return false;
}

// Main execution function
async function main() {
  try {
    // Test connection first
    const connectionWorks = await testConnection();
    
    if (!connectionWorks) {
      console.log('\n❌ All connection tests failed. Attempting to clear schema cache...');
      
      // Try to clear schema cache using SQL
      const cacheClearResult = await executeSQL('DISCARD PLANS', 'Clear Query Plans');
      if (cacheClearResult.success) {
        console.log('✅ Schema cache cleared successfully');
        
        // Test connection again after cache clear
        console.log('\n🔄 Testing connection after cache clear...');
        const connectionAfterClear = await testConnection();
        
        if (connectionAfterClear) {
          console.log('\n🎉 SUCCESS: Connection established after clearing schema cache!');
        } else {
          console.log('\n❌ Connection still failing after cache clear');
        }
      } else {
        console.log('\n❌ Failed to clear schema cache');
      }
    } else {
      console.log('\n🎉 SUCCESS: Supabase connection is working!');
    }
    
    // Final connection test for schema cache clear execution
    console.log('\n🔄 Final connection test for SQL execution...');
    const finalTest = await executeSQL('SELECT 1 as test', 'Final Test');
    
    if (finalTest.success) {
      console.log('\n✅ READY: Supabase connection is ready for SQL script execution!');
      console.log('You can now run the schema cache clear and relationship rebuild scripts.');
    } else {
      console.log('\n❌ FAILED: Supabase connection is not ready for SQL execution');
      console.log('The connection issue needs to be resolved first.');
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error in main execution:', error);
  }
}

// Run the main function
main().catch(console.error);