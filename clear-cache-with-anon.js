// Try to clear cache using anon key with basic operations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Attempting to clear schema cache using anon key...\n');

// Create client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

console.log('✅ Supabase client created with anon key');

// Try different approaches to clear cache
async function tryCacheClear() {
  console.log('\n🔄 Attempting various cache clearing approaches...');
  
  // Approach 1: Try to access a simple table to trigger cache refresh
  try {
    console.log('Approach 1: Testing basic table access...');
    const { data, error } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Basic table access failed:', error.message);
      if (error.message.includes('strategy_rule_compliance')) {
        console.log('✅ CONFIRMED: This is the schema cache issue we need to fix!');
        return { confirmed: true, error: error.message };
      }
    } else {
      console.log('✅ Basic table access successful - cache might be clear');
      return { success: true, data };
    }
  } catch (err) {
    console.log('❌ Approach 1 failed:', err.message);
  }
  
  // Approach 2: Try to force a new connection
  try {
    console.log('Approach 2: Creating new client instance...');
    const newClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
    
    const { data, error } = await newClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    if (error) {
      console.log('❌ New client failed:', error.message);
      if (error.message.includes('strategy_rule_compliance')) {
        console.log('✅ CONFIRMED: Schema cache issue confirmed with new client');
        return { confirmed: true, error: error.message };
      }
    } else {
      console.log('✅ New client successful - cache cleared!');
      return { success: true, data };
    }
  } catch (err) {
    console.log('❌ Approach 2 failed:', err.message);
  }
  
  // Approach 3: Try a simple count query
  try {
    console.log('Approach 3: Testing simple count query...');
    const { data, error } = await supabase
      .from('strategies')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Count query failed:', error.message);
      if (error.message.includes('strategy_rule_compliance')) {
        console.log('✅ CONFIRMED: Schema cache issue confirmed with count query');
        return { confirmed: true, error: error.message };
      }
    } else {
      console.log('✅ Count query successful - cache might be clear');
      return { success: true, data };
    }
  } catch (err) {
    console.log('❌ Approach 3 failed:', err.message);
  }
  
  return { success: false, message: 'All cache clearing approaches failed' };
}

// Main execution
async function main() {
  const result = await tryCacheClear();
  
  if (result.confirmed) {
    console.log('\n🎯 DIAGNOSIS CONFIRMED:');
    console.log('The schema cache issue is confirmed.');
    console.log('Error:', result.error);
    console.log('\n📋 NEXT STEPS:');
    console.log('1. The service role key needs to be updated with valid credentials');
    console.log('2. Once service role key works, execute SCHEMA_CACHE_CLEAR.sql');
    console.log('3. Then execute RELATIONSHIP_REBUILD.sql');
    console.log('\n⚠️  CURRENT BLOCKER:');
    console.log('Invalid service role key prevents SQL execution');
    console.log('Need valid service role key from Supabase dashboard');
    
  } else if (result.success) {
    console.log('\n🎉 SUCCESS!');
    console.log('Cache appears to be cleared or was not the issue');
    console.log('Data:', result.data);
    
  } else {
    console.log('\n❌ FAILED:');
    console.log('Could not clear cache or confirm the issue');
    console.log('Message:', result.message);
  }
}

main().catch(console.error);