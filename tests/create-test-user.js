const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
  console.log('🔧 [CREATE USER] Creating test user...');
  
  const TEST_USER_EMAIL = 'testuser@verotrade.com';
  const TEST_USER_PASSWORD = 'TestPassword123!';
  
  try {
    // Create user with auth admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        created_for: 'testing'
      }
    });
    
    if (error) {
      console.error('❌ Error creating test user:', error.message);
      return false;
    }
    
    if (data?.user) {
      console.log('✅ Test user created successfully:', {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      });
      
      // Confirm email automatically for testing
      const { error: confirmError } = await supabase.auth.admin.updateUser(
        data.user.id,
        { 
          email_confirm: true,
          user_metadata: {
            created_for: 'testing',
            email_confirmed_at: new Date().toISOString()
          }
        }
      );
      
      if (confirmError) {
        console.error('❌ Error confirming email:', confirmError.message);
        return false;
      }
      
      console.log('✅ Test user email confirmed automatically');
      console.log('🎉 [CREATE USER] Test user setup completed successfully');
      console.log('📧 [CREATE USER] User credentials:');
      console.log('   Email:', TEST_USER_EMAIL);
      console.log('   Password:', TEST_USER_PASSWORD);
      return true;
    } else {
      console.error('❌ No user data returned');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the user creation
createTestUser().then(success => {
  if (success) {
    console.log('🎉 Test user created and confirmed successfully');
    process.exit(0);
  } else {
    console.log('💥 Test user creation failed');
    process.exit(1);
  }
});