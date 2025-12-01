const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Authentication with Real Tables...\n');
console.log('URL:', supabaseUrl);
console.log('Key format:', supabaseAnonKey?.startsWith('eyJ') ? 'JWT format' : 'Native format');
console.log('Key present:', !!supabaseAnonKey);
console.log('');

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test authentication by trying to access the auth endpoint
  console.log('Testing authentication endpoint...');
  supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Auth endpoint test failed:', error.message);
        if (error.message.includes('Invalid API key')) {
          console.log('\n🔍 Root Cause: Invalid API key error detected');
        }
      } else {
        console.log('✅ Auth endpoint accessible (no session is expected)');
      }
    })
    .catch(err => {
      console.log('❌ Auth endpoint test failed with exception:', err.message);
    });
  
  // Test database access with a real table
  console.log('\nTesting database access...');
  supabase.from('strategies').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Database access failed:', error.message);
        if (error.message.includes('Invalid API key')) {
          console.log('\n🔍 Root Cause: Invalid API key error detected');
        } else if (error.message.includes('permission')) {
          console.log('\n🔍 Note: Permission denied is expected for anon key on some tables');
        }
      } else {
        console.log('✅ Database access successful');
      }
    })
    .catch(err => {
      console.log('❌ Database access failed with exception:', err.message);
    });
    
} catch (error) {
  console.log('❌ Failed to create Supabase client:', error.message);
}