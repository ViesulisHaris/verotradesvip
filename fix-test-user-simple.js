const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const NEW_TEST_USER_PASSWORD = 'TestPassword123!2025';

async function fixTestUser() {
  console.log('🔧 [FIX USER] Fixing test user credentials...');
  
  try {
    // Step 1: Find existing user
    console.log('🔍 [STEP 1] Finding existing user...');
    
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', TEST_USER_EMAIL);

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message);
      return false;
    }

    console.log('🔍 [DEBUG] Existing users query result:', { existingUsers, error: fetchError });

    // Handle case where user doesn't exist
    if (!existingUsers || existingUsers.length === 0) {
      console.log('❌ User does not exist, creating new user...');
      return await createNewTestUser();
    }

    // Find the specific user
    const existingUser = existingUsers.find(user => user.email === TEST_USER_EMAIL);
    
    if (!existingUser) {
      console.error('❌ User not found in existing users');
      return false;
    }

    console.log('✅ User found:', {
      id: existingUser.id,
      email: existingUser.email,
      email_confirmed: !!existingUser.email_confirmed_at,
      created_at: existingUser.created_at
    });

    // Step 2: Ensure email is confirmed
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

    // Step 3: Test current password and reset if needed
    console.log('🔍 [STEP 3] Testing current password...');
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (signInError) {
        console.log('❌ Current password failed:', signInError.message);
        
        if (signInError.message && signInError.message.includes('Invalid login credentials')) {
          console.log('🔧 [FIX] Resetting password to new value...');
          
          try {
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
          } catch (resetErr) {
            console.error('❌ Error during password reset:', resetErr.message);
            return false;
          }
          
          // Test new password
          const { error: newSignInError } = await supabase.auth.signInWithPassword({
            email: TEST_USER_EMAIL,
            password: NEW_TEST_USER_PASSWORD
          });

          if (newSignInError) {
            console.error('❌ New password failed:', newSignInError.message);
            return false;
          }

          console.log('✅ New password works correctly');
        } else {
          console.log('✅ Current password works correctly');
        }
      } else {
        console.log('✅ Current password works correctly');
      }
    } catch (error) {
      console.error('❌ Error during password test:', error.message);
      return false;
    }

    // Step 4: Final verification
    console.log('🔍 [STEP 4] Final verification - attempting sign in...');
    
    try {
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: NEW_TEST_USER_PASSWORD
      });

      if (finalSignInError) {
        console.error('❌ Final sign in failed:', finalSignInError.message);
        return false;
      }

      console.log('🎉 [SUCCESS] Test user is ready for authentication tests!');
      console.log(`📋 [CREDENTIALS] Email: ${TEST_USER_EMAIL}`);
      console.log(`🔑 [CREDENTIALS] Password: ${NEW_TEST_USER_PASSWORD}`);
      
      return true;
    } catch (error) {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function createNewTestUser() {
  console.log('🔧 [CREATE] Creating new test user...');
  
  try {
    // First, delete any existing user to avoid conflicts
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', TEST_USER_EMAIL);

    if (deleteError) {
      console.error('❌ Error deleting existing user:', deleteError.message);
    }

    // Create new user
    const { data: { user }, error: createError } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: NEW_TEST_USER_PASSWORD,
      options: {
        emailRedirectTo: false
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
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

// Run the fix process
fixTestUser().then(success => {
  if (success) {
    console.log('🎉 [COMPLETE] Test user fix completed successfully');
    process.exit(0);
  } else {
    console.log('💥 [FAILED] Test user fix failed');
    process.exit(1);
  }
});