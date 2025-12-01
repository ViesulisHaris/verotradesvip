// Diagnostic script to identify the supabaseKey error
console.log('=== Supabase Key Error Diagnosis ===\n');

// Test 1: Check environment variable loading
console.log('1. Testing environment variable loading:');
require('dotenv').config();
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

// Test 2: Check Supabase client creation with exact same pattern as in the code
console.log('\n2. Testing Supabase client creation:');
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('   supabaseUrl:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'UNDEFINED');
  console.log('   supabaseAnonKey:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'UNDEFINED');
  
  if (!supabaseUrl) {
    console.log('   ❌ ERROR: supabaseUrl is undefined');
  }
  
  if (!supabaseAnonKey) {
    console.log('   ❌ ERROR: supabaseAnonKey is undefined');
  }
  
  // Try to create the client exactly as in the source code
  console.log('   Attempting to create Supabase client...');
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'sb-auth-token',
    },
    db: {
      schema: 'public',
    },
  });
  console.log('   ✅ Supabase client created successfully');
} catch (error) {
  console.log('   ❌ ERROR creating Supabase client:', error.message);
  console.log('   Stack trace:', error.stack);
}

// Test 3: Check if there's a mismatch in parameter names
console.log('\n3. Testing parameter name mismatch:');
try {
  const { createClient } = require('@supabase/supabase-js');
  console.log('   createClient function signature:');
  console.log('   Expected parameters: (supabaseUrl, supabaseKey, options)');
  console.log('   Your code provides: (supabaseUrl, supabaseAnonKey, options)');
  console.log('   This should work as supabaseAnonKey is passed as the second parameter');
} catch (error) {
  console.log('   Error checking function signature:', error.message);
}

// Test 4: Check Next.js specific environment variable handling
console.log('\n4. Testing Next.js environment variable handling:');
console.log('   In Next.js, only variables with NEXT_PUBLIC_ prefix are available on client side');
console.log('   Your variables have the correct prefix');
console.log('   However, during server-side rendering, the process.env might behave differently');

console.log('\n=== Diagnosis Complete ===');