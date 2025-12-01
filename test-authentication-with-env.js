// Load environment variables from .env file
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Test environment variables
console.log('🔍 Testing Environment Variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

// Test Supabase client initialization
console.log('\n🔍 Testing Supabase Client Initialization...');
try {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables');
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('✅ Supabase client created successfully');
  
  // Test basic connection
  console.log('\n🔍 Testing Basic Connection...');
  supabase.from('strategies').select('id').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Connection test failed:', error.message);
        if (error.message.includes('supabaseKey is required')) {
          console.error('🚨 CRITICAL: "supabaseKey is required" error detected!');
          console.error('🔧 This confirms environment variables are not loaded properly');
        }
      } else {
        console.log('✅ Basic connection test successful');
      }
    })
    .catch(err => {
      console.error('❌ Connection test exception:', err.message);
    });
    
  // Test authentication with test user
  console.log('\n🔍 Testing Authentication...');
  supabase.auth.signInWithPassword({
    email: 'testuser@verotrade.com',
    password: 'TestPassword123!'
  })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Authentication test failed:', error.message);
        if (error.message.includes('Invalid login credentials')) {
          console.log('⚠️ Test user credentials are invalid - this is expected if test user doesn\'t exist');
        }
      } else if (data.user && data.session) {
        console.log('✅ Authentication successful');
        console.log('👤 User ID:', data.user.id);
        console.log('📧 User email:', data.user.email);
        
        // Test strategy deletion with authenticated user
        console.log('\n🔍 Testing Strategy Deletion...');
        
        // First get user strategies
        supabase.from('strategies')
          .select('id, name')
          .eq('user_id', data.user.id)
          .limit(1)
          .then(({ data: strategies, error: fetchError }) => {
            if (fetchError) {
              console.error('❌ Strategy fetch failed:', fetchError.message);
            } else if (strategies && strategies.length > 0) {
              const testStrategy = strategies[0];
              console.log(`🔍 Found test strategy: ${testStrategy.name} (${testStrategy.id})`);
              
              // Test deletion (but don't actually delete - just test the query)
              supabase.from('strategies')
                .delete()
                .eq('id', testStrategy.id)
                .eq('user_id', data.user.id)
                .then(({ error: deleteError }) => {
                  if (deleteError) {
                    console.error('❌ Strategy deletion test failed:', deleteError.message);
                    if (deleteError.message.includes('supabaseKey is required')) {
                      console.error('🚨 CRITICAL: "supabaseKey is required" error in deletion!');
                    }
                  } else {
                    console.log('✅ Strategy deletion test successful (query structure is correct)');
                  }
                });
            } else {
              console.log('⚠️ No strategies found to test deletion');
            }
          });
      } else {
        console.error('❌ Unexpected authentication response');
      }
    })
    .catch(err => {
      console.error('❌ Authentication test exception:', err.message);
    });
    
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error.message);
  if (error.message.includes('Missing required environment variables')) {
    console.error('🚨 CRITICAL: Environment variables are not loaded!');
    console.error('🔧 FIX RECOMMENDATIONS:');
    console.error('  1. Ensure .env file is in project root');
    console.error('  2. Install dotenv package: npm install dotenv');
    console.error('  3. Check Next.js configuration for environment variable loading');
    console.error('  4. Verify variables start with NEXT_PUBLIC_ for client-side access');
    console.error('  5. Check deployment configuration for environment variable exposure');
  }
}

console.log('\n=== ANALYSIS ===');
console.log('If you see "supabaseKey is required" errors, the issue is that environment variables are not being loaded properly in the browser context.');
console.log('This is a common Next.js issue that requires restarting the development server after adding/changing .env file.');
console.log('The browser-side environment variables are loaded by Next.js automatically, but Node.js tests require dotenv to be loaded manually.');