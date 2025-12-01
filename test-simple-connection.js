// Simple connection test using anon key
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

console.log('🔍 Testing simple Supabase connection with anon key...\n');

// Check environment variables
console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('\n❌ Critical: Supabase environment variables are missing!');
  process.exit(1);
}

console.log('\n✅ Environment variables are properly set');

// Create Supabase client with anon key
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

console.log('\n🔄 Testing Supabase client creation with anon key...');
console.log('✅ Supabase client created successfully');

// Test basic connection
async function testConnection() {
  try {
    console.log('\n🔄 Testing basic database connection...');
    
    // Try a simple query to check if we can connect
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Database connection successful');
      console.log('✅ Found tables:', data);
      return true;
    }
    
  } catch (err) {
    console.error('❌ Unexpected error during database test:', err);
    return false;
  }
}

// Test connection
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: Basic Supabase connection is working!');
    console.log('Now we can proceed with schema cache clearing using direct SQL execution.');
  } else {
    console.log('\n❌ FAILED: Supabase connection is not working');
    console.log('We need to fix the connection before proceeding.');
  }
}).catch(console.error);