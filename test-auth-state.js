const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Authentication State...\n');
console.log('URL:', supabaseUrl);
console.log('Key format:', supabaseAnonKey?.startsWith('eyJ') ? 'JWT format' : 'Native format');
console.log('Key present:', !!supabaseAnonKey);
console.log('');

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test basic connection
  supabase.from('_test_connection').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Connection test failed:', error.message);
        if (error.message.includes('Invalid API key')) {
          console.log('\n🔍 Root Cause: Invalid API key error detected');
          console.log('This suggests the API key format is incorrect for this Supabase project.');
        }
      } else {
        console.log('✅ Connection test successful');
      }
    })
    .catch(err => {
      console.log('❌ Connection test failed with exception:', err.message);
    });
    
} catch (error) {
  console.log('❌ Failed to create Supabase client:', error.message);
}