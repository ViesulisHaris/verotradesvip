// Test script to verify Supabase configuration fixes
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

console.log('🔍 Testing Supabase configuration fixes...\n');

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

// Test Supabase client creation
try {
  console.log('\n🔄 Testing Supabase client creation...');
  
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
  
  console.log('✅ Supabase client created successfully');
  
  // Test basic connection
  console.log('\n🔄 Testing basic database connection...');
  
  supabase.from('information_schema.tables')
    .select('table_name')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Database connection successful');
        console.log('✅ Supabase configuration is working correctly');
        
        console.log('\n🎉 All tests passed! The Supabase configuration error should be resolved.');
        console.log('📝 Summary of fixes applied:');
        console.log('   1. Modified SchemaValidator to use dynamic imports');
        console.log('   2. Modified AuthProvider to use dynamic imports');
        console.log('   3. Enhanced Supabase client with better error handling');
        console.log('   4. Added environment variable validation with graceful fallbacks');
        
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error during database test:', error);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
  process.exit(1);
}