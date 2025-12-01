// Debug script to validate API key configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('='.repeat(80));
console.log('SUPABASE API KEY DEBUG TEST');
console.log('='.repeat(80));

// Check environment variables
console.log('\n1. Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

// Get the actual values (truncated for security)
console.log('\n2. API Key Values (truncated for security):');
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...');
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}

// Test with ANON key
console.log('\n3. Testing with ANON key:');
try {
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Simple test query
  supabaseAnon.from('information_schema.tables').select('table_name').limit(1)
    .then(result => {
      if (result.error) {
        console.log('❌ ANON key test failed:', result.error.message);
      } else {
        console.log('✅ ANON key test successful');
      }
    })
    .catch(err => {
      console.log('❌ ANON key test error:', err.message);
    });
} catch (err) {
  console.log('❌ ANON key creation error:', err.message);
}

// Test with SERVICE ROLE key
console.log('\n4. Testing with SERVICE ROLE key:');
try {
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Simple test query
  supabaseService.from('information_schema.tables').select('table_name').limit(1)
    .then(result => {
      if (result.error) {
        console.log('❌ SERVICE ROLE key test failed:', result.error.message);
      } else {
        console.log('✅ SERVICE ROLE key test successful');
      }
    })
    .catch(err => {
      console.log('❌ SERVICE ROLE key test error:', err.message);
    });
} catch (err) {
  console.log('❌ SERVICE ROLE key creation error:', err.message);
}

// Test RPC call (which is what the failing script is using)
console.log('\n5. Testing RPC call with SERVICE ROLE key:');
try {
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Test the RPC call that's failing
  supabaseService.rpc('exec_sql', { sql_query: 'SELECT 1 as test;' })
    .then(result => {
      if (result.error) {
        console.log('❌ RPC call test failed:', result.error.message);
      } else {
        console.log('✅ RPC call test successful');
      }
    })
    .catch(err => {
      console.log('❌ RPC call test error:', err.message);
    });
} catch (err) {
  console.log('❌ RPC call setup error:', err.message);
}

console.log('\n' + '='.repeat(80));
console.log('DEBUG TEST COMPLETE');
console.log('='.repeat(80));