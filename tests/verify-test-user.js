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

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTestUser() {
  console.log('🔍 [TEST USER] Verifying test user existence...');
  
  const TEST_USER_EMAIL = 'testuser@verotrade.com';
  
  try {
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', TEST_USER_EMAIL)
      .single();
    
    if (userError) {
      console.error('❌ Error checking existing user:', userError.message);
      return false;
    }
    
    if (existingUser) {
      console.log('✅ Test user found:', {
        id: existingUser.id,
        email: existingUser.email,
        created_at: existingUser.created_at
      });
      
      // Check if user has auth configured properly
      const { data: { authData }, error: authError } = await supabase.auth.admin.getUserById(
        existingUser.id
      );
      
      if (authError) {
        console.error('❌ Error checking user auth:', authError.message);
        return false;
      }
      
      if (authData && authData.email_confirmed_at) {
        console.log('✅ User email confirmed at:', authData.email_confirmed_at);
        console.log('✅ Test user is properly configured for authentication');
        return true;
      } else {
        console.log('⚠️  User email not confirmed - user may need to verify email');
        console.log('📧 [TEST USER] To fix: Check Supabase dashboard for this user and verify email');
        return false;
      }
    } else {
      console.log('❌ Test user does not exist in database');
      console.log('📧 [TEST USER] To fix: Create test user with credentials:');
      console.log('   Email:', TEST_USER_EMAIL);
      console.log('   Password: TestPassword123!');
      console.log('   Or update TEST_USER_EMAIL in auth-system.spec.js to use an existing user');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the verification
verifyTestUser().then(success => {
  if (success) {
    console.log('🎉 [TEST USER] Test user verification completed successfully');
    process.exit(0);
  } else {
    console.log('💥 [TEST USER] Test user verification failed');
    process.exit(1);
  }
});