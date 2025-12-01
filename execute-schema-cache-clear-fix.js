const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSchemaCacheClear() {
  console.log('Executing schema cache clear command...');
  
  try {
    // Execute the schema cache clear command
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'NOTIFY pgrst, \'reload schema\';'
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
}

main().catch(console.error);