// Test Authentication Fix
// This script tests that the Supabase API key fix resolves authentication issues

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

console.log('🧪 [AUTH_FIX_TEST] Starting authentication fix verification...\n');

async function testAuthentication() {
  console.log('\n🔍 [STEP 1] Testing Supabase Connection...');
  
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    // Test basic connection
    const startTime = Date.now();
    const { data, error } = await client.from('_').select('*').limit(1);
    const responseTime = Date.now() - startTime;

    if (error) {
      console.log(`❌ Connection FAILED: ${error.message}`);
      if (error.message.includes('Invalid API key')) {
        console.log('🔴 CRITICAL: Still getting "Invalid API key" error - fix did not work');
        return false;
      }
      return false;
    } else {
      console.log(`✅ Connection SUCCESS: ${responseTime}ms`);
    }
  } catch (e) {
    console.log(`💥 Connection EXCEPTION: ${e.message}`);
    return false;
  }

  console.log('\n🔍 [STEP 2] Testing Authentication Flow...');
  
  try {
    // Test sign in
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (signInError) {
      console.log(`❌ Sign in FAILED: ${signInError.message}`);
      if (signInError.message.includes('Invalid API key')) {
        console.log('🔴 CRITICAL: "Invalid API key" error persists - fix failed');
        return false;
      }
      return false;
    } else {
      console.log(`❌ Sign in failed with different error: ${signInError.message}`);
      return false;
    }
  } else {
    console.log('✅ Sign in SUCCESS');
    console.log(`👤 User ID: ${signInData.user?.id}`);
    console.log(`📧 User Email: ${signInData.user?.email}`);
    console.log(`🎫 Session Valid: ${!!signInData.session}`);
    return true;
  }
  } catch (e) {
    console.log(`💥 Sign in EXCEPTION: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('Environment Check:');
  console.log(`- URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
  console.log(`- Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
  console.log(`- Key Length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0}`);
  
  // Test connection
  const connectionWorks = await testAuthentication();
  if (!connectionWorks) {
    console.log('\n❌ AUTHENTICATION FIX FAILED');
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify .env file has been updated with fresh keys');
    console.log('2. Check that keys are complete (not truncated)');
    console.log('3. Restart development server: npm run dev');
    console.log('4. Clear browser cache and localStorage');
    return;
  }
  
  // Test authentication
  const authWorks = await testAuthentication();
  if (!authWorks) {
    console.log('\n❌ AUTHENTICATION FIX FAILED');
    return;
  }
  
  console.log('\n✅ AUTHENTICATION FIX SUCCESSFUL');
  console.log('\n🎉 Users should now be able to log in without "Invalid API key" errors');
  console.log('\n📋 Next Steps:');
  console.log('1. Test login in browser: http://localhost:3000/login');
  console.log('2. Verify successful authentication and dashboard access');
  console.log('3. Confirm no more "Invalid API key" errors in browser console');
}

main().catch(console.error);