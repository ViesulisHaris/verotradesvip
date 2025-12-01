const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Create multiple Supabase clients with different configurations
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
        'X-Client-Info': 'verotrades-auth-fix',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  }
);

// Service role client for admin operations
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'verotrades-service-admin',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  }
);

const TEST_USER_EMAIL = 'testuser@verotrade.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const NEW_TEST_USER_PASSWORD = 'TestPassword123!2025';

async function fixTestUserFinal() {
  console.log('🔧 [FINAL AUTH FIX] Fixing test user credentials using Auth API...');
  
  try {
    // Step 1: Try to find existing user using auth.admin.listUsers()
    console.log('🔍 [STEP 1] Finding existing user using Auth API...');
    
    let existingUser = null;
    
    try {
      const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError.message);
        console.log('🔄 Trying alternative approach...');
      } else {
        console.log(`✅ Found ${users.length} users in the system`);
        existingUser = users.find(user => user.email === TEST_USER_EMAIL);
        
        if (existingUser) {
          console.log('✅ User found:', {
            id: existingUser.id,
            email: existingUser.email,
            email_confirmed: !!existingUser.email_confirmed_at,
            created_at: existingUser.created_at
          });
        }
      }
    } catch (error) {
      console.error('❌ Exception during user list:', error.message);
    }

    // Handle case where user doesn't exist
    if (!existingUser) {
      console.log('❌ User does not exist, creating new user...');
      return await createNewTestUser();
    }

    // Step 2: Ensure email is confirmed
    if (!existingUser.email_confirmed_at) {
      console.log('🔍 [STEP 2] Email not confirmed, confirming now...');
      try {
        const { error: confirmError } = await serviceClient.auth.admin.updateUserById(
          existingUser.id,
          { 
            email_confirm: true
          }
        );

        if (confirmError) {
          console.error('❌ Error confirming email:', confirmError.message);
          // Try alternative method
          const { error: altConfirmError } = await serviceClient.auth.admin.updateUserById(
            existingUser.id,
            { 
              email_confirmed_at: new Date().toISOString()
            }
          );
          
          if (altConfirmError) {
            console.error('❌ Alternative email confirmation failed:', altConfirmError.message);
          } else {
            console.log('✅ Email confirmed successfully (alternative method)');
          }
        } else {
          console.log('✅ Email confirmed successfully');
        }
      } catch (error) {
        console.error('❌ Exception during email confirmation:', error.message);
      }
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
        
        if (signInError.message && (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Invalid credentials'))) {
          console.log('🔧 [FIX] Resetting password to new value...');
          
          try {
            const { error: resetError } = await serviceClient.auth.admin.updateUserById(
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
    // Create new user
    const { data: { user }, error: createError } = await serviceClient.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: NEW_TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: 'test_user',
        created_for: 'authentication_tests'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
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

// Run the final fix process
fixTestUserFinal().then(success => {
  if (success) {
    console.log('🎉 [COMPLETE] Test user fix completed successfully (AUTH API VERSION)');
    process.exit(0);
  } else {
    console.log('💥 [FAILED] Test user fix failed');
    process.exit(1);
  }
});