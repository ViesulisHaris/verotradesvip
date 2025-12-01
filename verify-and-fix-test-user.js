const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const NEW_TEST_USER_PASSWORD = 'TestPassword123!2025';

async function verifyAndFixTestUser() {
  console.log('🔧 [VERIFY USER] Verifying and fixing test user...');
  
  try {
    // Step 1: Check if user exists
    console.log('🔍 [STEP 1] Checking if user exists...');
    
    const { data: { users }, error: fetchError } = await supabase
      .from('users')
      .select('id, email, email_confirmed_at, created_at')
      .eq('email', TEST_USER_EMAIL)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message);
      return false;
    }

    console.log('🔍 [DEBUG] Query result:', { users, error: fetchError });

    if (!users || users.length === 0) {
      console.log('❌ User does not exist, creating new user...');
      return await createNewTestUser();
    }

    const existingUser = users[0];
    console.log('✅ User found:', {
      id: existingUser.id,
      email: existingUser.email,
      email_confirmed: !!existingUser.email_confirmed_at,
      created_at: existingUser.created_at
    });

    // Step 2: Check if email is confirmed
    if (!existingUser.email_confirmed_at) {
      console.log('🔍 [STEP 2] Email not confirmed, confirming now...');
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { 
          email_confirmed_at: new Date().toISOString()
        }
      );

      if (confirmError) {
        console.error('❌ Error confirming email:', confirmError.message);
        return false;
      }
      console.log('✅ Email confirmed successfully');
    }

    // Step 3: Test password reset if needed
    console.log('🔍 [STEP 3] Testing current password...');
    
    // Try to sign in with current password to verify it works
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (signInError) {
      console.log('❌ Current password failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('🔧 [FIX] Resetting password to new value...');
        // Reset password
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { 
            password: NEW_TEST_USER_PASSWORD
          }
        );

        if (resetError) {
          console.error('❌ Error resetting password:', resetError.message);
          return false;
        }

        console.log('✅ Password reset successfully');
        console.log(`🔑 New password: ${NEW_TEST_USER_PASSWORD}`);
        console.log('⚠️  Please update test credentials in auth-system.spec.js to use the new password!');
        return true;
      }
    } else {
      console.log('✅ Current password works correctly');
    }

    // Step 4: Final verification
    console.log('🔍 [STEP 4] Final verification - attempting sign in...');
    const { error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: signInError ? NEW_TEST_USER_PASSWORD : TEST_USER_PASSWORD
    });

    if (finalSignInError) {
      console.error('❌ Final sign in failed:', finalSignInError.message);
      return false;
    }

    console.log('🎉 [SUCCESS] Test user is ready for authentication tests!');
    console.log(`📋 [CREDENTIALS] Email: ${TEST_USER_EMAIL}`);
    console.log(`🔑 [CREDENTIALS] Password: ${signInError ? NEW_TEST_USER_PASSWORD : TEST_USER_PASSWORD}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function createNewTestUser() {
  console.log('🔧 [CREATE] Creating new test user...');
  
  try {
    const { data: { user }, error } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: NEW_TEST_USER_PASSWORD,
      options: {
        emailRedirectTo: false
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      return false;
    }

    // Confirm email
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        email_confirmed_at: new Date().toISOString()
      }
    );

    if (confirmError) {
      console.error('❌ Error confirming email:', confirmError.message);
      return false;
    }

    console.log('✅ New test user created and confirmed successfully');
    console.log(`📋 [NEW CREDENTIALS] Email: ${TEST_USER_EMAIL}`);
    console.log(`🔑 [NEW CREDENTIALS] Password: ${NEW_TEST_USER_PASSWORD}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the verification and fix process
verifyAndFixTestUser().then(success => {
  if (success) {
    console.log('🎉 [COMPLETE] Test user verification and fix completed successfully');
    process.exit(0);
  } else {
    console.log('💥 [FAILED] Test user verification and fix failed');
    process.exit(1);
  }
});