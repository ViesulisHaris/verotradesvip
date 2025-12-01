const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'verotrades-test-creator',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  }
);

const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!2025';

async function createTestUser() {
  console.log('🔧 [SIMPLE CREATE] Creating test user using public API...');
  
  try {
    // Step 1: Try to sign up the user
    console.log('🔍 [STEP 1] Attempting to create user...');
    
    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      options: {
        emailRedirectTo: false,
        data: {
          role: 'test_user',
          created_for: 'authentication_tests'
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log('✅ User already exists, attempting to sign in...');
        
        // User exists, try to sign in to verify credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });

        if (signInError) {
          console.error('❌ Existing user sign in failed:', signInError.message);
          console.log('🔄 User exists but password is wrong. Please check the password.');
          return false;
        } else {
          console.log('✅ Existing user credentials work correctly');
          return true;
        }
      } else {
        console.error('❌ Error creating user:', error.message);
        return false;
      }
    }

    if (data && data.user) {
      console.log('✅ User created successfully:', {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: !!data.user.email_confirmed_at
      });

      // Step 2: Try to confirm email if needed
      if (!data.user.email_confirmed_at) {
        console.log('🔍 [STEP 2] Email not confirmed, but user created');
        console.log('⚠️  Note: Email confirmation may be required for full functionality');
      }

      // Step 3: Test sign in
      console.log('🔍 [STEP 3] Testing sign in...');
      const { error: testSignInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (testSignInError) {
        console.error('❌ Test sign in failed:', testSignInError.message);
        return false;
      }

      console.log('✅ Test sign in successful');
      console.log('🎉 [SUCCESS] Test user is ready for authentication tests!');
      console.log(`📋 [CREDENTIALS] Email: ${TEST_USER_EMAIL}`);
      console.log(`🔑 [CREDENTIALS] Password: ${TEST_USER_PASSWORD}`);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the user creation process
createTestUser().then(success => {
  if (success) {
    console.log('🎉 [COMPLETE] Test user creation completed successfully');
    process.exit(0);
  } else {
    console.log('💥 [FAILED] Test user creation failed');
    process.exit(1);
  }
});